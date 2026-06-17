# 项目系统模块（Project System）

## 🎯 实现目标
实现用户画布项目管理系统，一个用户可以拥有多个画布项目。

---

## 🧠 功能需求

### 1. 创建项目
POST /projects

### 2. 获取项目列表
GET /projects

### 3. 获取项目详情
GET /projects/:id

---

## 🧱 数据结构

project:
- id
- user_id
- name
- created_at

---
