
// 最简化的服务器 - 确保能工作
const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('\n🚀 正在启动极简服务器...\n');

const PORT = 8888;

// 确保有数据
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.json');
let db = {
    settings: {
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
    },
    vips: [],
    history: []
};

// 加载数据库
if (fs.existsSync(dbPath)) {
    try {
        const data = fs.readFileSync(dbPath, 'utf8');
        db = JSON.parse(data);
        console.log('✅ 数据库已加载');
    } catch (e) {
        console.log('⚠️ 数据库加载失败，使用默认数据');
    }
} else {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    console.log('📝 新数据库已创建');
}

console.log('📍 当前密码:', db.settings.password);

// 创建服务器
const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname;
    const method = req.method;

    console.log(method, pathname);

    // API 处理
    if (pathname.startsWith('/api/')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        // 调试信息
        if (pathname === '/api/debug/info' && method === 'GET') {
            res.writeHead(200);
            res.end(JSON.stringify({
                success: true,
                password: db.settings.password,
                dbExists: true
            }));
            return;
        }

        // 重置密码
        if (pathname === '/api/debug/reset-password' && method === 'POST') {
            db.settings.password = 'admin123';
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, message: '密码已重置为 admin123' }));
            return;
        }

        // 获取设置
        if (pathname === '/api/settings' && method === 'GET') {
            res.writeHead(200);
            res.end(JSON.stringify(db.settings));
            return;
        }

        // 更新设置
        if (pathname === '/api/settings' && method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
                const newSettings = JSON.parse(body);
                db.settings = { ...db.settings, ...newSettings };
                fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
                res.writeHead(200);
                res.end(JSON.stringify({ success: true }));
            });
            return;
        }

        // 获取客户列表
        if (pathname === '/api/vips' && method === 'GET') {
            res.writeHead(200);
            res.end(JSON.stringify(db.vips));
            return;
        }

        // 创建/更新客户
        if (pathname === '/api/vips' && method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
                const newVip = JSON.parse(body);
                const existingIndex = db.vips.findIndex(v => v.vip_id === newVip.vip_id);
                
                if (existingIndex >= 0) {
                    newVip.services = db.vips[existingIndex].services || [];
                    db.vips[existingIndex] = { ...db.vips[existingIndex], ...newVip };
                } else {
                    newVip.services = [];
                    newVip.createdAt = new Date().toISOString();
                    db.vips.push(newVip);
                }
                
                fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, vip_id: newVip.vip_id }));
            });
            return;
        }

        // 获取单个客户 / 删除客户
        const vipMatch = pathname.match(/^\/api\/vips\/([^/]+)$/);
        if (vipMatch) {
            const vipId = vipMatch[1];
            
            if (method === 'GET') {
                const vip = db.vips.find(v => v.vip_id === vipId);
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
                fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
                res.writeHead(200);
                res.end(JSON.stringify({ success: true }));
                return;
            }
        }

        // 添加服务记录
        const serviceMatch = pathname.match(/^\/api\/vips\/([^/]+)\/services$/);
        if (serviceMatch && method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
                const vipId = serviceMatch[1];
                const serviceData = JSON.parse(body);
                const vipIndex = db.vips.findIndex(v => v.vip_id === vipId);
                
                if (vipIndex >= 0) {
                    const service = {
                        id: Date.now(),
                        ...serviceData,
                        createdAt: new Date().toISOString()
                    };
                    if (!db.vips[vipIndex].services) db.vips[vipIndex].services = [];
                    db.vips[vipIndex].services.unshift(service);
                    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: true }));
                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: '客户不存在' }));
                }
            });
            return;
        }

        // 历史记录
        if (pathname === '/api/history' && method === 'GET') {
            res.writeHead(200);
            res.end(JSON.stringify(db.history));
            return;
        }

        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
    }

    // 静态文件处理
    let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                if (req.url !== '/') {
                    fs.readFile(path.join(__dirname, 'index.html'), (err, html) => {
                        if (err) {
                            res.writeHead(404);
                            res.end('Not Found');
                        } else {
                            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                            res.end(html);
                        }
                    });
                    return;
                }
                res.writeHead(404);
                res.end('Not Found');
            } else {
                res.writeHead(500);
                res.end('Server Error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log('\n✅ 极简服务器已启动！');
    console.log('📍 访问地址: http://localhost:' + PORT);
    console.log('💾 数据库位置:', dbPath);
    console.log('👤 默认账号: admin / admin123');
    console.log('\n按 Ctrl+C 停止服务器\n');
});

