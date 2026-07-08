---
title: Nginx 反向代理排查从请求路径开始
date: 2026-07-08 10:55:00
updated: 2026-07-08 10:55:00
tags:
  - nginx
  - ops
  - backend
  - engineering
categories:
  - 技术分享
description: 记录 Nginx 反向代理问题的排查顺序：域名、路径、转发、响应和日志。
cover:
abbrlink: 技术分享-nginx-反向代理排查从请求路径开始
synced_from_content_repo: true
source_path: 技术分享/Nginx 反向代理排查从请求路径开始.md
source_hash: 83c07340caea1156f152979d89cc738422d941c6
---

# Nginx 反向代理排查从请求路径开始

Nginx 反向代理出问题时，表现可能是页面打不开、接口跨域、静态资源丢失、后端拿不到真实地址。排查时先不要急着改配置，先把请求路径走一遍。

## 先确认请求到了哪里

第一步是确认域名解析、端口监听和 server 匹配是否正确。请求如果没有进入预期的 server 块，后面的 location 配置再正确也没用。

这一步可以通过访问日志和错误日志确认。日志里能看到请求路径、状态、上游地址和错误原因。

## 再看路径匹配

Nginx 的 location 匹配如果写得不清楚，容易出现静态资源被转发到后端、接口路径被当成页面、斜杠处理不一致等问题。

我会把需要代理的接口路径和需要直接返回的静态路径分开，避免规则互相覆盖。

## 最后看上游响应

如果请求已经转发到后端，还要看上游服务是否正常、超时配置是否合适、请求头是否完整。特别是 Host、真实地址、协议头这些字段，可能会影响后端生成链接或做权限判断。

反向代理不是单纯转发，它也参与了请求语义。

## 复盘

Nginx 排查要从请求路径开始：域名到 server，server 到 location，location 到 upstream，upstream 到后端响应。按链路看，比直接改配置更稳。

## 参考

- Nginx 官方文档：https://nginx.org/en/docs/
- Nginx location 文档：https://nginx.org/en/docs/http/ngx_http_core_module.html#location
