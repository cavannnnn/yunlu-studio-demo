# 云麓 Studio UI Prototype

童装 AI 多智能体 SaaS 的纯前端交互原型。当前版本不包含后端、数据库或真实 AI 接口，所有按钮和工作流状态均为浏览器内演示数据。

## 启动

```bash
cd /Users/cavanliu/Documents/Playground/yunlu-studio
npm run dev
```

打开 `http://127.0.0.1:5173/`。

## 全流程演示后端

本项目现在包含一个可本地演示的 FastAPI 后端：SQLite 持久化业务数据，本地目录模拟对象存储，Agent 使用确定性 Mock Adapter，所有 API 契约都预留了未来接入 PostgreSQL、Redis、OSS/COS 和真实 AI 服务的位置。

```bash
python3 -m pip install -r requirements.txt
python3 backend.py
```

后端地址为 `http://127.0.0.1:8000`，API 文档为 `http://127.0.0.1:8000/docs`。前端开发服务仍使用 `npm run dev`，生产构建由后端直接托管 `dist/`。

核心演示接口包括：`/api/products/{id}/demo-run` 一键跑 Agent1-8、`/api/products/{id}/sample-upload` 恢复人工打样断点、`/api/products/{id}/agents/{agent}` 独立调用单个 Agent、`/api/subscriptions/checkout` Mock 支付、`/api/data-lifecycle/run` 数据生命周期 dry-run。

## 已覆盖界面

- 款式总览：进度状态、市场信号、最近款式、一键推进
- 市场洞察：趋势信号、竞品动向、建议带入设计
- AI 设计工作台：面料参考、4 个设计方向、版本保存、自然语言修改
- 3D 预览：简化服装预览、旋转、智能推荐细节
- 纸板版型：参数、纸样 PDF 预览、版师初审、人工打样断点
- 营销内容：样衣上传状态、平台文案草稿、素材生成入口
- 账单与会员：会员计划、用量、按款计费明细

## 技术说明

React 18 + TypeScript + Tailwind CSS + Lucide React + Vite。演示图片位于 `public/assets`，后续可替换为客户实拍或真实 AI 生成资产。
