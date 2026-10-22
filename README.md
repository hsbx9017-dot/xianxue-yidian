# 先学一点

帮助大学生把学习愿望变成可以开始、可以协商调整的一周安排。

本项目是可部署至 GitHub Pages 的独立静态版本，不需要 Sites 服务或站点后端。

## 体验

- 明确目标 / 寻找方向两个入口。
- 四步引导、七天计划、每日时间上限、留白日。
- 规则体验版不需要密钥，明确标为非 AI 生成。
- DeepSeek AI：每位访客填写自己的 API 密钥，浏览器直接请求 `https://api.deepseek.com/chat/completions`。
- 解释计划依据与取舍，支持协商修改、单日编辑、完成记录及Markdown下载。
- 反馈由用户复制发给邀请人，不会假装已自动提交。

## 密钥和数据

密钥只在当前页面内存保留，刷新后清除。不存储于localStorage、Cookie、代码或仓库，不经过本站服务器，也不使用创建者额度。学习计划可保存在本机浏览器；反馈与导出不含密钥。

API费用由填写密钥的访客自行承担。用户勾选同意后，浏览器仅将密钥发送给DeepSeek。由于是静态站点，无法提供服务端全局限流；页面加载不调用模型，只有明确生成或协商修改才调用。

本仓库不包含任何个人访谈、聊天记录、真实API密钥或账号信息。

## 开发与部署

Node.js 24：

```sh
npm ci
npm run dev
npm test
npm run build
```

GitHub仓库的 Settings → Pages → Build and deployment 选择 GitHub Actions。推送至main后，工作流会检查、构建并部署dist。

`base: './'` 适配项目仓库的子路径。页面不依赖路由重写或原Sites域名。

AI接口默认使用官方文档中列出的 `deepseek-flash`。已用模拟响应测试输出校验和密钥边界；真实账户调用效果须以用户实际体验为准。参考：https://api-docs.deepseek.com/ 。
