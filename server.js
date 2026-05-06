const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const dbPath = process.env.DB_PATH || './data/vip.db';
const dbDir = path.dirname(dbPath);

const fs = require('fs');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE,
    value TEXT
  );
  CREATE TABLE IF NOT EXISTS vips (
    vip_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    level TEXT,
    fixedManager TEXT,
    statMode TEXT DEFAULT 'duration',
    totalHours REAL DEFAULT 0,
    totalAmount REAL DEFAULT 0,
    startDate TEXT,
    endDate TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vip_id TEXT,
    date TEXT,
    duration REAL,
    type TEXT,
    pricePerHour REAL,
    manager TEXT,
    remark TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vip_id) REFERENCES vips(vip_id)
  );
  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT,
    details TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

function initSettings() {
  const defaultSettings = [
    { key: 'systemName', value: 'VIP保洁客户管理系统' },
    { key: 'password', value: 'admin123' },
    { key: 'announcement', value: '' },
    { key: 'vipLevels', value: JSON.stringify(['普通VIP', '银牌VIP', '金牌VIP', '钻石VIP']) },
    { key: 'managers', value: JSON.stringify([]) },
    { key: 'enableShareView', value: 'true' },
    { key: 'showRemainingTime', value: 'true' },
    { key: 'showRemainingAmount', value: 'true' },
    { key: 'showServiceRecords', value: 'true' },
    { key: 'showContactInfo', value: 'true' },
    { key: 'showExpiration', value: 'true' }
  ];

  const stmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  defaultSettings.forEach(s => stmt.run(s.key, s.value));
}

initSettings();

function addHistory(action, details) {
  const stmt = db.prepare('INSERT INTO history (action, details) VALUES (?, ?)');
  stmt.run(action, JSON.stringify(details));
}

app.get('/api/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM settings').all();
    const settings = {};
    rows.forEach(row => {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const settings = req.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    Object.keys(settings).forEach(key => {
      const value = typeof settings[key] === 'object' 
        ? JSON.stringify(settings[key]) 
        : String(settings[key]);
      stmt.run(key, value);
    });
    addHistory('更新设置', settings);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vips', (req, res) => {
  try {
    const vips = db.prepare('SELECT * FROM vips').all();
    const servicesStmt = db.prepare('SELECT * FROM services WHERE vip_id = ? ORDER BY date DESC');
    vips.forEach(vip => {
      vip.services = servicesStmt.all(vip.vip_id);
    });
    res.json(vips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vips/:id', (req, res) => {
  try {
    const vip = db.prepare('SELECT * FROM vips WHERE vip_id = ?').get(req.params.id);
    if (!vip) {
      return res.status(404).json({ error: '客户不存在' });
    }
    vip.services = db.prepare('SELECT * FROM services WHERE vip_id = ? ORDER BY date DESC').all(req.params.id);
    res.json(vip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vips', (req, res) => {
  try {
    const data = req.body;
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO vips 
      (vip_id, name, phone, address, level, fixedManager, statMode, totalHours, totalAmount, startDate, endDate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      data.vip_id,
      data.name,
      data.phone,
      data.address,
      data.level,
      data.fixedManager,
      data.statMode,
      data.totalHours,
      data.totalAmount,
      data.startDate,
      data.endDate
    );
    addHistory('保存客户', data);
    res.json({ success: true, vip_id: data.vip_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/vips/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM services WHERE vip_id = ?').run(req.params.id);
    db.prepare('DELETE FROM vips WHERE vip_id = ?').run(req.params.id);
    addHistory('删除客户', { vip_id: req.params.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vips/:id/services', (req, res) => {
  try {
    const data = req.body;
    const stmt = db.prepare(`
      INSERT INTO services (vip_id, date, duration, type, pricePerHour, manager, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      req.params.id,
      data.date,
      data.duration,
      data.type,
      data.pricePerHour,
      data.manager,
      data.remark
    );
    addHistory('添加服务', { vip_id: req.params.id, ...data });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/history', (req, res) => {
  try {
    const history = db.prepare('SELECT * FROM history ORDER BY createdAt DESC LIMIT 100').all();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'VIP保洁客户管理系统.html'));
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
