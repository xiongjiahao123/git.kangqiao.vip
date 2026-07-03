# 康桥数智 APP

这是一个可安装的 PWA 移动 APP 原型，用于演示康桥数智的 GEO 图文生成和任务监测能力。它不依赖第三方框架，直接用浏览器即可预览，也可以后续封装成 Android / iOS APP。

## 预览

在 `mobile-app` 目录启动任意静态服务器：

```bash
python -m http.server 8080
```

然后打开：

```text
http://localhost:8080
```

## 安装到手机

- Android Chrome：打开页面后选择「添加到主屏幕」。
- iPhone Safari：打开页面后选择「分享」->「添加到主屏幕」。

## 后续打包

如果需要生成 APK / IPA，可以用 Capacitor、Cordova 或 HBuilderX 把 `mobile-app` 作为 Web 资源目录进行封装。

## 已包含页面

- 首页：品牌和关键指标。
- 监测：图文任务状态列表。
- 生成：输入关键词和主题生成任务草案。
- 我的：版本、服务地址和运行模式。
