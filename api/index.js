const fs = require('fs');
const path = require('path');

// 数据存储
let db = {
  settings: {
    systemName: "VIP保洁客户管理系统",
    password: "admin123",
    announcement: "",
    vipLevels: ["普通VIP", "银牌VIP", "金牌VIP", "钻石VIP"],
    managers: [],
    enableShareView: true,
    showRemainingTime: true,
    showRemainingAmount: true,
    showServiceRecords: true,
    showContactInfo: true,
    showExpiration: true
  },
  vips: [],
  history: []
};

// 尝试从文件加载数据
const dbPath = path.join(process.cwd(), 'data', 'database.json');
if (fs.existsSync(dbPath)) {
  try {
    db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (e) {
    console.log('加载数据库失败，使用默认数据');
  }
}

module.exports = async (req, res) => {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;

  // 路由处理
  try {
    // 获取设置
    if (pathname === '/api/settings' && req.method === 'GET') {
      res.status(200).json(db.settings);
      return;
    }

    // 更新设置
    if (pathname === '/api/settings' && req.method === 'POST') {
      const newSettings = await getBody(req);
      db.settings = { ...db.settings, ...newSettings };
      saveDb();
      res.status(200).json({ success: true });
      return;
    }

    // 获取客户列表
    if (pathname === '/api/vips' && req.method === 'GET') {
      res.status(200).json(db.vips);
      return;
    }

    // 创建/更新客户
    if (pathname === '/api/vips' && req.method === 'POST') {
      const newVip = await getBody(req);
      const existingIndex = db.vips.findIndex(v => v.vip_id === newVip.vip_id);
      
      if (existingIndex >= 0) {
        newVip.services = db.vips[existingIndex].services || [];
        db.vips[existingIndex] = { ...db.vips[existingIndex], ...newVip };
      } else {
        newVip.services = [];
        newVip.createdAt = new Date().toISOString();
        db.vips.push(newVip);
      }
      
      saveDb();
      res.status(200).json({ success: true, vip_id: newVip.vip_id });
      return;
    }

    // 获取单个客户 / 删除客户
    const vipMatch = pathname.match(/^\/api\/vips\/([^/]+)$/);
    if (vipMatch) {
      const vipId = vipMatch[1];
      
      if (req.method === 'GET') {
        const vip = db.vips.find(v => v.vip_id === vipId);
        if (vip) {
          res.status(200).json(vip);
        } else {
          res.status(404).json({ error: '客户不存在' });
        }
        return;
      }
      
      if (req.method === 'DELETE') {
        db.vips = db.vips.filter(v => v.vip_id !== vipId);
        saveDb();
        res.status(200).json({ success: true });
        return;
      }
    }

    // 添加服务记录
    const serviceMatch = pathname.match(/^\/api\/vips\/([^/]+)\/services$/);
    if (serviceMatch && req.method === 'POST') {
      const serviceData = await getBody(req);
      const vipId = serviceMatch[1];
      const vipIndex = db.vips.findIndex(v => v.vip_id === vipId);
      
      if (vipIndex >= 0) {
        const service = {
          id: Date.now(),
          ...serviceData,
          createdAt: new Date().toISOString()
        };
        if (!db.vips[vipIndex].services) db.vips[vipIndex].services = [];
        db.vips[vipIndex].services.unshift(service);
        saveDb();
        res.status(200).json({ success: true });
      } else {
        res.status(404).json({ error: '客户不存在' });
      }
      return;
    }

    // 历史记录
    if (pathname === '/api/history' && req.method === 'GET') {
      res.status(200).json(db.history);
      return;
    }

    // 调试接口
    if (pathname === '/api/debug/info' && req.method === 'GET') {
      res.status(200).json({
        success: true,
        password: db.settings.password,
        dbExists: true
      });
      return;
    }

    if (pathname === '/api/debug/reset-password' && req.method === 'POST') {
      db.settings.password = 'admin123';
      saveDb();
      res.status(200).json({ success: true, message: '密码已重置为 admin123' });
      return;
    }

    res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function saveDb() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  } catch (e) {
    console.log('保存数据库失败:', e);
  }
}
