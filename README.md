# 先学一点

帮助大学生把学习愿望变成可以开始、可以协商调整的一周安排。

学习工具部署于 GitHub Pages。反馈使用独立的 Supabase 数据库；本地管理员服务只绑定 127.0.0.1。

## 体验

- 明确目标 / 寻找方向两个入口。
- 四步引导、七天计划、每日时间上限、留白日。
- 规则体验版不需要密钥，明确标为非 AI 生成。
- DeepSeek AI：每位访客填写自己的 API 密钥，浏览器直接请求 `https://api.deepseek.com/chat/completions`。
- 解释计划依据与取舍，支持协商修改、单日编辑、完成记录及Markdown下载。
- 朋友免登录点击提交反馈，收到数据库保存回执后才显示成功；失败时保留当前输入，重试相同内容不会重复保存。
- 本地管理支持浏览全部反馈、分页、标记已处理、只看未处理和 Markdown 导出。

## 密钥和数据

密钥只在当前页面内存保留，刷新后清除。不存储于localStorage、Cookie、代码或仓库，不经过本站服务器，也不使用创建者额度。学习计划可保存在本机浏览器；反馈与导出不含密钥。

API费用由填写密钥的访客自行承担。用户勾选同意后，浏览器仅将密钥发送给DeepSeek。由于是静态站点，无法提供服务端全局限流；页面加载不调用模型，只有明确生成或协商修改才调用。

本仓库不包含个人访谈、聊天记录、DeepSeek 密钥或管理员密钥。`lib/feedback-config.ts` 仅包含反馈服务地址和可公开的提交凭据；它不能读取反馈。

## 查看反馈

在配置好的本机双击 `打开反馈管理.cmd`，打开 `http://127.0.0.1:4318/__admin`。从此本地服务打开学习工具，会显示“管理反馈”入口；公开站点没有此入口。仅用 Vite 启动或另存 HTML 不会获得管理员权限。

管理员服务从被 Git 忽略的 `feedback-admin.local.json` 读取 `{ "url": "https://项目.supabase.co", "secretKey": "本地管理员密钥" }`，密钥仅在 Node 服务中使用，不发往浏览器。不要分享此配置文件；换电脑需要另行配置。

反馈只上传评价、问题、建议、体验模式及随机提交编号。数据库自动记录接收时间和处理状态，不附带学习计划、个人描述或模型密钥。反馈表在不公开的 `feedback_private` schema 中，公开 RPC 仅能提交；读取和标记 RPC 只授予 `service_role`。本地管理还验证访问地址、浏览器来源和会话 Cookie，防止其他网页读取本机反馈。

数据库定义：`feedback-service/schema.sql`。Supabase Free 项目可能在一周无活动后暂停；服务暂停时页面会报告提交失败，不会假装保存。可在 Supabase 控制台恢复，参考官方免费方案说明：https://supabase.com/pricing 。匿名入口没有验证码或身份识别，适用于初期小范围试用；大范围公开前应补充防滥用措施。

## 开发与部署

Node.js 24：

```sh
npm ci
npm run dev
npm test
npm run build
npm run pages:prepare
```

完成测试与构建后运行 `node scripts/prepare-pages.mjs`，将静态产物和源码指纹保存到 `docs/`，并一同提交。GitHub仓库的 Settings → Pages → Build and deployment 选择 GitHub Actions。推送至main后，工作流会校验源码与产物的一致性并部署 `docs/`，发布阶段无需重新安装npm依赖。

`base: './'` 适配项目仓库的子路径。页面不依赖路由重写或原Sites域名。

AI接口默认使用官方文档中列出的 `deepseek-flash`。已用模拟响应测试输出校验和密钥边界；真实账户调用效果须以用户实际体验为准。参考：https://api-docs.deepseek.com/ 。

反馈测试：`npm test` 包含提交数据边界、错误回执、本地管理会话和跨站访问检查。数据库权限测试可在隔离运行库安装后执行：`npm install --prefix outputs/feedback-tests --ignore-scripts @electric-sql/pglite`，再运行 `npm run test:feedback-db`。云端联调脚本 `scripts/check-feedback-live.mjs` 会写入明确标记的测试反馈并标记已处理，需本地项目凭据，不能在公开 CI 中运行。
