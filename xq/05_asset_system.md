# 资产系统（Asset System）

## 🎯 实现目标

实现用户个人资产库，用于管理用户上传资产、Agnes 模型生成资产、画布项目素材和生成历史。

---

## 🧠 功能需求

### 1. 上传资产

POST /assets/upload

- 支持图片上传。
- 预留视频上传能力。
- 仅正式登录用户可上传。
- 游客不能写入个人资产库。

### 2. 获取资产列表

GET /assets

- 获取当前用户资产。
- 支持按类型筛选：prompt | image | video。
- 支持按项目筛选。

### 3. 生成结果入库

POST /assets/from-generation

- 文本、图片、视频生成成功后自动创建资产。
- 记录来源模型、来源任务、来源画布节点。

### 4. 返回 URL

- 可直接访问。
- 需要支持资源权限校验，避免用户读取他人私有资产。

---

## 🧱 数据结构

asset:

- id
- user_id
- project_id
- canvas_node_id
- type: prompt | image | video
- url
- content_text
- source: upload | generation
- source_model
- source_task_id
- status: active | hidden | deleted
- created_at
- updated_at

---

## 🔐 权限规则

- 用户只能访问自己的资产。
- Admin 可查看和隐藏所有资产。
- 用户被封禁后不能新增资产，但历史资产保留。
- 用户生成权限被冻结后不能创建生成资产，但仍可查看历史资产。

---
