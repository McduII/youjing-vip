
// 简单的测试服务器
const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🔍 正在启动测试服务器...\n');

// 测试端口是否被占用的函数
function checkPort(port) {
    return new Promise((resolve, reject) => {
        const server = http.createServer();
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                server.close();
                resolve(false);
            } else {
                reject(err);
            }
        });
        server.once('listening', () => {
            server.close();
            resolve(true);
        });
        server.listen(port);
    });
}

// 主函数
async function main() {
    const PORT = 3000;
    
    console.log('📋 检查系统信息：');
    console.log('  - Node.js 版本:', process.version);
    console.log('  - 当前目录:', __dirname);
    
    // 检查 data 目录
    const dataDir = path.join(__dirname, 'data');
    console.log('  - data 目录:', dataDir);
    console.log('  - data 目录存在:', fs.existsSync(dataDir));
    
    if (!fs.existsSync(dataDir)) {
        console.log('  📁 正在创建 data 目录...');
        fs.mkdirSync(dataDir, { recursive: true });
        console.log('  ✅ data 目录已创建');
    }
    
    // 检查数据库文件
    const dbPath = path.join(dataDir, 'database.json');
    console.log('  - 数据库文件:', dbPath);
    console.log('  - 数据库文件存在:', fs.existsSync(dbPath));
    
    // 检查端口
    console.log('  - 检查端口 ' + PORT + '...');
    try {
        const isPortAvailable = await checkPort(PORT);
        console.log('  - 端口 ' + PORT + ' 可用:', isPortAvailable);
    } catch (e) {
        console.log('  ❌ 端口检查错误:', e);
    }
    
    console.log('\n✅ 测试完成！现在启动实际服务器...\n');
    
    // 启动实际的 server-simple.js
    console.log('🚀 正在启动 server-simple.js...\n');
    require('./server-simple.js');
}

main().catch(err => {
    console.error('❌ 启动错误:', err);
    process.exit(1);
});

