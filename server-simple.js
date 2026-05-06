
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// 确保 data 目录存在
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 数据库文件路径
const dbPath = path.join(dataDir, 'database.json');

// 默认配置
const DEFAULT_SETTINGS = {
  systemName: 'VIP保洁客户管理系统',
  password: 'admin123',
  announcement: '',
  vipLevels: ['普通VIP', '银牌VIP', '金牌VIP', '钻石VIP'],
  managers: [],
  enableShareView: true,
  showRemainingTime: true,
  showRemainingAmount: true,
  showServiceRecords: true,
  showContactInfo: true,
  showExpiration: true
};

// 初始化数据库
let db = {
  settings: { ...DEFAULT_SETTINGS },
  vips: [],
  history: []
};

// 加载数据库
function loadDB() {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      const loadedDB = JSON.parse(data);
      // 合并设置，确保有默认值
      db = {
        settings: { ...DEFAULT_SETTINGS, ...loadedDB.settings },
        vips: loadedDB.vips || [],
        history: loadedDB.history || []
      };
      console.log('✅ 数据库加载成功');
      console.log('📌 当前密码:', db.settings.password);
    } else {
      console.log('📝 创建新数据库');
      saveDB();
    }
  } catch (e) {
    console.error('❌ 数据库加载失败，使用默认数据:', e);
  }
}

// 保存数据库
function saveDB() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    return true;
  } catch (e) {
    console.error('❌ 数据库保存失败:', e);
    return false;
  }
}

// 重置密码为默认值的函数
function resetPassword() {
  db.settings.password = DEFAULT_SETTINGS.password;
  saveDB();
  console.log('🔑 密码已重置为: admin123');
}

// 添加操作日志
function addHistory(action, details) {
  try {
    db.history.unshift({
      id: Date.now(),
      action: action,
      details: typeof details === 'string' ? details : JSON.stringify(details),
      createdAt: new Date().toISOString()
    });
    if (db.history.length > 100) {
      db.history = db.history.slice(0, 100);
    }
    saveDB();
  } catch (e) {
    console.error('❌ 添加日志失败:', e);
  }
}

// 初始化
loadDB();

// 处理静态文件
function serveStatic(req, res) {
  try {
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
      if (error) {
        if(error.code === 'ENOENT') {
          if (req.url !== '/' && !req.url.startsWith('/api/')) {
            fs.readFile(path.join(__dirname, 'index.html'), (err, html) => {
              if (err) {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
              } else {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(html, 'utf-8');
              }
            });
            return;
          }
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<h1>404 Not Found</h1>', 'utf-8');
        } else {
          res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('Server Error: ' + error.code, 'utf-8');
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  } catch (e) {
    console.error('❌ 静态文件服务错误:', e);
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
}

// API 路由处理
function handleAPI(req, res, method, pathname) {
  try {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // 获取请求体
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      let data = null;
      if (body) {
        try {
          data = JSON.parse(body);
        } catch (e) {
          console.error('❌ JSON 解析失败:', e);
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
          return;
        }
      }

      // 调试端点 - 重置密码
      if (pathname === '/api/debug/reset-password' && method === 'POST') {
        resetPassword();
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, message: '密码已重置为 admin123' }));
        return;
      }

      // 调试端点 - 获取当前设置
      if (pathname === '/api/debug/info' && method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          password: db.settings.password,
          hasPassword: !!db.settings.password,
          dbExists: fs.existsSync(dbPath)
        }));
        return;
      }

      // 设置
      if (pathname === '/api/settings') {
        if (method === 'GET') {
          console.log('📥 获取设置请求');
          res.writeHead(200);
          res.end(JSON.stringify(db.settings));
        } else if (method === 'POST') {
          db.settings = { ...db.settings, ...data };
          addHistory('更新设置', data);
          saveDB();
          console.log('📝 密码已更新为:', db.settings.password);
          res.writeHead(200);
          res.end(JSON.stringify({ success: true }));
        }
        return;
      }

      // 客户列表
      if (pathname === '/api/vips' && method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify(db.vips));
        return;
      }

      // 创建/更新客户
      if (pathname === '/api/vips' && method === 'POST') {
        const existingIndex = db.vips.findIndex(v => v.vip_id === data.vip_id);
        if (existingIndex >= 0) {
          data.services = db.vips[existingIndex].services || [];
          db.vips[existingIndex] = { ...db.vips[existingIndex], ...data };
          addHistory('更新客户', data);
        } else {
          data.services = [];
          data.createdAt = new Date().toISOString();
          db.vips.push(data);
          addHistory('新增客户', data);
        }
        saveDB();
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, vip_id: data.vip_id }));
        return;
      }

      // 获取单个客户
      const vipMatch = pathname.match(/^\/api\/vips\/([^/]+)$/);
      if (vipMatch) {
        const vipId = vipMatch[1];
        const vip = db.vips.find(v => v.vip_id === vipId);
        
        if (method === 'GET') {
          if (vip) {
            res.writeHead(200);
            res.end(JSON.stringify(vip));
          } else {
            res.writeHead(404);
            res.end(JSON.stringify({ error: '客户不存在' }));
          }
          return;
        }
        
        if (method === 'DELETE') {
          db.vips = db.vips.filter(v => v.vip_id !== vipId);
          addHistory('删除客户', { vip_id: vipId });
          saveDB();
          res.writeHead(200);
          res.end(JSON.stringify({ success: true }));
          return;
        }
      }

      // 添加服务记录
      const serviceMatch = pathname.match(/^\/api\/vips\/([^/]+)\/services$/);
      if (serviceMatch && method === 'POST') {
        const vipId = serviceMatch[1];
        const vipIndex = db.vips.findIndex(v => v.vip_id === vipId);
        
        if (vipIndex >= 0) {
          const service = {
            id: Date.now(),
            ...data,
            createdAt: new Date().toISOString()
          };
          if (!db.vips[vipIndex].services) db.vips[vipIndex].services = [];
          db.vips[vipIndex].services.unshift(service);
          addHistory('添加服务', { vip_id: vipId, ...data });
          saveDB();
          res.writeHead(200);
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: '客户不存在' }));
        }
        return;
      }

      // 操作历史
      if (pathname === '/api/history' && method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify(db.history));
        return;
      }

      // 404
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'API not found' }));
    });
  } catch (e) {
    console.error('❌ API 处理错误:', e);
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
}

// 创建服务器
const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname;
    const method = req.method;

    console.log(`${method} ${pathname}`);

    if (pathname.startsWith('/api/')) {
      handleAPI(req, res, method, pathname);
    } else {
      serveStatic(req, res);
    }
  } catch (e) {
    console.error('❌ 服务器错误:', e);
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
});

// 处理服务器错误
server.on('error', (e) => {
  console.error('❌ 服务器错误:', e);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 VIP保洁客户管理系统已启动！`);
  console.log(`📍 访问地址: http://localhost:${PORT}`);
  console.log(`💾 数据库位置: ${dbPath}`);
  console.log(`👤 默认账号: admin / ${db.settings.password}`);
  console.log(`\n🔧 调试工具:`);
  console.log(`   - 重置密码: POST /api/debug/reset-password`);
  console.log(`   - 查看信息: GET /api/debug/info`);
  console.log(`\n按 Ctrl+C 停止服务器\n`);
});
