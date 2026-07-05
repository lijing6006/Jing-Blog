# 用 Surge 实现内网穿透和科学上网共存

## 背景

最近飞牛的安全漏洞让我重新重视 NAS 的隐私安全问题。之前我一直没有太重视隐私安全，NAS 也是直接公网暴露在外面。出了这件事以后，我决定关闭公网访问，改用内网穿透方案。

一开始我尝试过 Tailscale，但体验不够丝滑。手机上同一时间只能开一个 VPN：

- 想用内网穿透，就不能科学上网；
- 想科学上网，就不能用内网穿透。

对我这种高频使用科学上网、同时又经常访问家里 NAS 服务的人来说，这个痛点不能接受。后来发现 Surge 可以比较好地解决这个问题，所以开始折腾这套方案。

## 我的设备环境

- iPhone 13
- MacBook Air M4（上班时会带去公司）
- iPad Pro 2021
- Apple TV
- 飞牛 NAS

## 目标

通过 Apple TV 作为服务端，让 iPhone 和 Mac 在外部网络环境下，依然能够：

- 同时实现科学上网；
- 访问家里的内网服务 / NAS；
- 避免 NAS 直接公网暴露。

## 服务端配置

由于我的 Mac 需要经常外带，所以需要 Apple TV 作为科学上网和内网穿透的服务端。



![IMG_6026](https://cdn3.ldstatic.com/optimized/4X/1/4/6/1467ee1ffebf8b10648759a77e5683db8084d485_2_231x500.jpeg)

1170×2532 229 KB



### Apple TV 端配置

1. 打开 Surge iOS。
2. 进入 "更多"。
3. 点击 `Surge tvOS` 进入对应界面。
4. 在 Surge Ponte 中选择 `Direct Access`。
5. 在路由器里添加对应的端口转发。

### Surge iOS 远程控制器配置

在 Surge iOS 的远程控制器里，为 Apple TV 添加规则：

- 规则类型：`IP-CIDR`

- 内容：填写 Apple TV 所在的内网段，并加上 `no-resolve`

- 策略：选择**直连**

  ![IMG_6027](https://cdn3.ldstatic.com/optimized/4X/f/4/2/f423080ebac13648c94d7617d0e35c4d0805acb1_2_231x500.jpeg)

  IMG_60271170×2532 177 KB

## 客户端配置

### Surge iOS 配置

在首页代理规则里新增规则：

- 规则类型：`IP-CIDR`
- 内容：填写 Apple TV 所在的内网段，并加上 `no-resolve`
- 策略：选择 **Appletv 设备**



![IMG_6029](https://cdn3.ldstatic.com/optimized/4X/6/d/a/6da1b5016bee07e206796af9ee335f84f116ee67_2_231x500.jpeg)

IMG_60291170×2532 179 KB



### Surge Mac 配置

添加规则：

- 规则类型：`IP-CIDR`
- 内容：填写 Apple TV 所在的内网段，并加上 `no-resolve`
- 策略：选择 **Appletv 设备**



![CleanShot 2026-03-16 at 00.11.53@2x](https://cdn3.ldstatic.com/optimized/4X/c/7/f/c7fc4c8f90409c1a1753e5cbc1f7102bd6b36f26_2_690x362.png)

CleanShot 2026-03-16 at 00.11.53@2x1630×856 68.1 KB



## 验证结果

目前已经基本跑通，达到的效果是：

- iPhone 在外面可以同时实现科学上网和内网穿透；
- Mac 在外面也可以通过 Surge 同时实现科学上网和访问内网服务。

## 目前的问题

通过这种方式实现的内网穿透，速度还是偏慢，暂时跑不满我的上传带宽。