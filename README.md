# VIP 保洁客户管理系统

一个功能完整的 VIP 客户管理系统，可以在 GitHub Pages 上完美运行！

## ✨ 特性

- ✅ 无需服务器，完全静态网站
- ✅ 数据自动保存到浏览器本地存储
- ✅ 支持客户管理
- ✅ 支持服务记录
- ✅ 支持客户信息分享
- ✅ 响应式设计，移动端友好
- ✅ 美观的 UI 界面

## 🚀 GitHub Pages 部署步骤

### 方法一：使用 GitHub 网页界面（最简单）

1. **创建 GitHub 仓库**
   - 访问 https://github.com/new
   - 仓库名称：`vip-system`（或您喜欢的名称）
   - 选择 Public（公开）或 Private（私有）
   - 点击「Create repository」

2. **上传项目文件**
   - 在新仓库页面，点击「uploading an existing file」
   - 将项目文件夹中的所有文件拖拽到上传区域
   - 在 Commit changes 部分填写描述（可选）
   - 点击「Commit changes」

3. **启用 GitHub Pages**
   - 进入仓库的「Settings」页面
   - 在左侧菜单找到「Pages」（在 Code and automation 部分）
   - 在「Build and deployment」下：
     - Source: 选择 `Deploy from a branch`
     - Branch: 选择 `main` 或 `master` 分支
     - Folder: 选择 `/ (root)`
   - 点击「Save」

4. **等待部署完成**
   - 等待 1-2 分钟，页面会自动刷新
   - 您会看到一个绿色提示：「Your site is live at https://你的用户名.github.io/vip-system/」

### 方法二：使用 Git 命令行（推荐）

```bash
# 1. 初始化 Git 仓库
cd c:\Users\Administrator\Desktop\1\VIP
git init

# 2. 添加所有文件
git add .

# 3. 提交
git commit -m "Initial commit"

# 4. 添加远程仓库（替换为您的仓库地址）
git remote add origin https://github.com/您的用户名/vip-system.git

# 5. 推送到 GitHub
git branch -M main
git push -u origin main
```

然后按照方法一的步骤 3-4 启用 GitHub Pages。

## 🔐 登录信息

- **用户名**: `admin`
- **默认密码**: `admin123`

## 💡 使用说明

### 本地开发

直接在浏览器中打开 `index.html` 文件即可使用，无需任何服务器！

### 数据存储

所有数据保存在浏览器的 localStorage 中：
- 数据只保存在当前浏览器
- 清除浏览器数据会删除所有信息
- 不同浏览器之间数据不共享

### 分享客户信息

1. 登录系统
2. 在客户列表中点击「分享」
3. 复制生成的链接
4. 发送给客户查看

## 📁 项目结构

```
VIP/
├── index.html              # 主页面
├── share.html              # 分享查看页面
├── favicon.ico             # 网站图标
├── minimal-server.js       # 本地服务器版本（可选）
├── vercel.json            # Vercel 部署配置（可选）
├── api/                   # Serverless API（可选）
│   └── index.js
├── data/                  # 本地数据库（仅本地服务器版本使用）
│   └── database.json
└── README.md              # 本文件
```

## 🌟 支持的部署平台

- ✅ GitHub Pages（推荐）
- ✅ Vercel
- ✅ Netlify
- ✅ 任何静态网站托管服务

## ⚠️ 注意事项

### GitHub Pages 版本

- 使用 localStorage 存储数据
- 数据仅在当前浏览器中保存
- 适合个人或小团队使用

### 本地服务器版本

- 如果需要多设备同步，请使用 `minimal-server.js` 版本
- 数据保存在 `data/database.json` 文件中
- 适合本地局域网使用

## 📞 技术支持

如有问题，请检查浏览器控制台（F12）查看错误信息。

---

**祝您使用愉快！** 🎉
