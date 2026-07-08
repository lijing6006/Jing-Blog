---
title: DTO 和 Entity 之间应该有边界
date: 2026-07-08 12:05:00
updated: 2026-07-08 12:05:00
tags:
  - backend
  - api-design
  - architecture
categories:
  - 技术分享
description: 讨论 DTO 和 Entity 的边界，避免接口模型被数据库结构牵着走。
cover:
abbrlink: 技术分享-dto和entity之间应该有边界
synced_from_content_repo: true
source_path: 技术分享/DTO和Entity之间应该有边界.md
source_hash: c65434b7cb6286ab9071f0bf5e5e6c52c7257d36
---

# DTO 和 Entity 之间应该有边界

Entity 代表数据持久化结构，DTO 代表接口传输结构。它们有时字段很像，但职责并不一样。如果直接把 Entity 暴露给接口，短期省事，长期会让数据库变化牵动接口变化。

## Entity 关注存储

Entity 更关心字段如何落库、如何关联、如何被 ORM 管理。它可能包含内部状态、删除标记、审计字段、版本字段，也可能存在为了查询性能而加入的冗余字段。

这些字段不一定适合出现在接口里。用户不需要知道内部删除标记，前端也不应该依赖数据库的字段命名。

## DTO 关注表达

DTO 应该围绕接口场景设计。列表页需要轻量字段，详情页需要完整字段，创建请求需要校验字段，更新请求需要可修改字段。不同场景复用同一个对象，看似简单，后面会越来越别扭。

我更喜欢按场景拆 DTO。这样字段含义清晰，也能避免用户提交不该修改的内部字段。

## 转换不是无意义代码

很多人觉得 DTO 和 Entity 互转只是样板代码，但这层转换其实是边界。它让接口模型可以独立演进，也让业务逻辑有地方处理枚举文案、时间格式、脱敏字段和组合字段。

如果转换代码开始变复杂，通常说明业务表达本身变复杂了。这时应该审视模型，而不是简单把所有字段塞进一个对象。

## 复盘

DTO 和 Entity 的边界，本质上是接口契约和存储实现的边界。越是长期维护的项目，越需要这种隔离。它会多一点代码，但能换来更稳定的对外接口。

## 参考

- Spring Data JPA 文档：https://docs.spring.io/spring-data/jpa/reference/
- MapStruct 文档：https://mapstruct.org/documentation/stable/reference/html/
