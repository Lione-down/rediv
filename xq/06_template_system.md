# 模板系统（Template System）

## 🎯 实现目标
实现画布模板复用能力（JSON snapshot）。

---

## 🧠 功能需求

### 1. 保存模板
POST /templates

### 2. 获取模板
GET /templates

### 3. 使用模板创建项目
POST /templates/:id/use

---

## 🧠 数据结构

template:
- id
- name
- data (JSON nodes)

---
