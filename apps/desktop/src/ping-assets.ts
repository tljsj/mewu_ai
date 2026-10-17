// LOL 模式的可选素材（data URL）：PING_WHEEL_ICONS/PING_HUB_ICON 为轮盘贴图（键 = 槽位 action），
// PING_VOICES 为 ping 标记生成时的语音音效（同键名）。
// 公开版本为空对象（此时退化为文字图标、无语音，构建不报错）；
// 本地个人版可注入自备素材的 base64（版权素材不要提交公开仓库）。
export const PING_WHEEL_ICONS: Record<string, string> = {};
export const PING_VOICES: Record<string, string> = {};
export const PING_HUB_ICON = '';
