# mewu_ai（个人魔改版）

[MewuAI](https://github.com/abnste/mewu_ai) 的个人 fork：给截图工作台加了一套 **LOL 风格的 ping 轮盘** 和若干自用增强。
基于上游 master（MPL-2.0），仅个人使用与学习。

## 本 fork 新增的东西

- **ping 轮盘**：截图画布里按住触发键唤出八向轮盘，分发到既有动作（AI 解释 / 翻译 / 表格 / OCR / 贴图 / 复制 / 保存）
  - 两种模式：**点击模式**（按住键 → 点击槽位）与 **LOL 模式**（按住键 + 左键拖动 → 松手触发，含落点标记动画、双层音效、贴图主题）
  - **槽位全自定义**：触发键（仅裸修饰键或含修饰键组合，避免与打字冲突，默认 Alt）、动作、图标（文字/emoji/自带图片）
  - **皮肤系统**：14 种 LOL ping 预设（图标 + 落点符号 + 语音 + 颜色 + 专属入场动效一体）
  - **插件生态**：已启用的 `selection.workflow` 插件贡献自动进入槽位动作池
  - 音效预解码（AudioContext 缓冲，零延迟）
- **对话栏常驻 + 位置记忆**：不再因鼠标离开自动收起；手动放置的位置全局记住
- 自维护：更新检查指向本仓库，签名公钥为本机密钥对（官方更新包无法覆盖）

## 分支结构

| 分支 | 内容 |
|---|---|
| `master` | 跟随上游，仅改本 README |
| `ping-wheel` | PR 线：lite 轮盘 + 自定义 + 插件槽位（无任何素材，可提上游） |
| `ping-wheel-lol` | = ping-wheel + LOL 模式（手势/动效/音效骨架） |
| `composer-pinned` | = ping-wheel + 对话栏常驻与位置记忆 |
| `personal` | 上两者合并，日常自用主线 |

## 构建

```bash
npm ci
npm run desktop:dev     # 开发（Rust 已编译后秒起）
npm run desktop:build   # 出 NSIS 安装包（target/release/bundle/nsis/）
```

release 构建签名需设置 `TAURI_SIGNING_PRIVATE_KEY`（密钥保存在仓库外，不提交）。

## ⚠️ 素材版权

本仓库**不含任何 Riot/LOL 的图标与音效**：`ping-assets.ts` / `ping-sound.ts` 提交的是空骨架，
素材由使用者本地注入（skip-worktree 防误提交）。**含素材的安装包一律不发布到本仓库。**
皮肤/动效的交互与实现参考了 [darrenprx/lolPing](https://github.com/darrenprx/lolPing)（MIT）的代码。

## 上游

一切荣誉归于 [abnste/mewu_ai](https://github.com/abnste/mewu_ai)——截图、标注、OCR、翻译、
录屏、插件系统等全部能力都是原作者的工作，本 fork 只是在其上贴了一层 ping。
