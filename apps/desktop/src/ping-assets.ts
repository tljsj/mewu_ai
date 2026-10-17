// LOL 模式的可选素材库。公开版本为空（退化为文字图标、无语音，构建不报错）；
// 本地个人版注入全部贴图/音效的 base64（版权素材不要提交公开仓库）。
// 结构：
//   PING_TEXTURES    贴图库（文件名 → data URL），含轮盘图标与落点标记符号两层
//   PING_SOUNDS_LIB  音效库（文件名 → data URL）
//   *_NAMES          动作 → 素材名的映射表：换符号/换音效只改这里的名字字符串
// 本地注入脚本会填充两个库并保持映射表不变。
export const PING_TEXTURES: Record<string, string> = {};
export const PING_SOUNDS_LIB: Record<string, string> = {};

// 动作 → 轮盘切片图标（对应 lolPing PingDef.icon 层）
export const PING_WHEEL_ICON_NAMES: Record<string, string> = {
  explain: 'pingwheel_basicpingrender',
  pin: 'target',
  copy: 'vision_cleared',
  save: 'push',
  cancel: 'pingwheel_retreatrender',
  ocr: 'pingwheel_enemyvisionrender',
  translate: 'pingwheel_baitrender',
  table: 'all_in',
};

// 动作 → 落点标记符号（对应 lolPing PingDef.art 层，与轮盘图标是不同的图）
export const PING_MARKER_ART_NAMES: Record<string, string> = {
  explain: 'pingwheel_basicpingrender',
  pin: 'target',
  copy: 'pingwheel_visionclearedrender',
  save: 'pingwheel_pushrender',
  cancel: 'pingwheel_retreatrender',
  ocr: 'pingwheel_enemyvisionrender',
  translate: 'pingwheel_baitrender',
  table: 'pingwheel_allin_render_01',
};

// 动作 → 标记生成时的语音音效
export const PING_VOICE_NAMES: Record<string, string> = {
  explain: 'Base',
  pin: 'OnMyWay',
  copy: 'SRP_6',
  save: 'SRP_9',
  cancel: 'SRP_12',
  ocr: 'AreaIsWarded',
  translate: 'SRP_11',
  table: 'SRP_4',
};

const pick = (names: Record<string, string>, library: Record<string, string>): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const [action, name] of Object.entries(names)) { const url = library[name]; if (url) result[action] = url; }
  return result;
};

export const PING_WHEEL_ICONS: Record<string, string> = pick(PING_WHEEL_ICON_NAMES, PING_TEXTURES);
export const PING_MARKER_ART: Record<string, string> = pick(PING_MARKER_ART_NAMES, PING_TEXTURES);
export const PING_VOICES: Record<string, string> = pick(PING_VOICE_NAMES, PING_SOUNDS_LIB);
export const PING_HUB_ICON: string = PING_TEXTURES['generic_ping'] ?? '';
