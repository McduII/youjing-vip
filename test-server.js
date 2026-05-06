
// 测试一下当前有哪些模块可用
console.log('Node.js version:', process.version);
console.log('Current directory:', __dirname);

try {
  const http = require('http');
  console.log('✅ http module available');
  
  const fs = require('fs');
  console.log('✅ fs module available');
  
  const path = require('path');
  console.log('✅ path module available');
  
  console.log('\n基础模块都可用！');
  
} catch (e) {
  console.error('❌ 模块加载失败:', e);
}
