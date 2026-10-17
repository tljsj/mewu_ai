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

// 默认动作 → 皮肤：没选皮肤的槽位也按这套获得符号/语音/动效（解释=通用、保存=推进……）
export const PING_DEFAULT_SKIN_BY_ACTION: Record<string, string> = {
  explain: 'generic',
  pin: 'target',
  copy: 'visioncleared',
  save: 'push',
  cancel: 'danger',
  ocr: 'enemyvision',
  translate: 'bait',
  table: 'allin',
};

// 皮肤（LOL ping 预设）：一个皮肤同时确定 轮盘图标 + 落点符号 + 语音 + 颜色。
// 对应 lolPing 的 ALL_PINGS，另加 target/caution 两个补充皮肤。公开版本库为空时全部字段为空串（退化为默认样式）。
export interface PingSkin { name: string; icon: string; art: string; art2?: string; voice: string; color: string; fx?: 'spin' | 'drop' | 'flash' | 'swing' }
const skin = (name: string, icon: string, art: string, voice: string, color: string, fx?: 'spin' | 'drop' | 'flash' | 'swing', art2?: string): PingSkin =>
  ({ name, icon: PING_TEXTURES[icon] ?? '', art: PING_TEXTURES[art] ?? '', ...(art2 ? { art2: PING_TEXTURES[art2] ?? '' } : {}), voice: PING_SOUNDS_LIB[voice] ?? '', color, ...(fx ? { fx } : {}) });
export const PING_SKINS: Record<string, PingSkin> = {
  danger: skin('危险', 'pingwheel_retreatrender', 'pingwheel_retreatrender', 'SRP_12', '#ff3b55', 'drop'),
  push: skin('推进', 'push', 'pingwheel_pushrender', 'SRP_9', '#35d27a', 'spin'),
  omw: skin('在路上', 'omw', 'omw', 'OnMyWay', '#2e8bff', 'swing'),
  allin: skin('全押', 'all_in', 'pingwheel_allin_render_01', 'SRP_4', '#f2b320', undefined, 'pingwheel_allin_render_02'),
  assist: skin('求援', 'assist_me', 'assist_me', 'ComeHere', '#56d43c', 'flash'),
  needvision: skin('需要视野', 'need_vision', 'need_vision', 'SRP_7', '#56d43c', 'flash'),
  missing: skin('敌人失踪', 'enemy_missing', 'enemy_missing', 'MIA', '#f2c518', 'spin'),
  enemyvision: skin('敌方视野', 'pingwheel_enemyvisionrender', 'pingwheel_enemyvisionrender', 'AreaIsWarded', '#ff3b55', 'drop'),
  generic: skin('通用', 'pingwheel_basicpingrender', 'pingwheel_basicpingrender', 'Base', '#2e8bff'),
  bait: skin('诱饵', 'pingwheel_baitrender', 'pingwheel_baitrender', 'SRP_11', '#efbc12', 'spin'),
  visioncleared: skin('视野已清', 'vision_cleared', 'pingwheel_visionclearedrender', 'SRP_6', '#2b80ff', 'flash'),
  missingflip: skin('倒放的问号', 'enemy_missing_flipped', 'enemy_missing_flipped', 'MIA', '#f2c518', 'spin'),
  target: skin('目标', 'target', 'target', 'Attack', '#f2b320', 'drop'),
  caution: skin('警告', 'caution', 'caution', 'Danger', '#f2c518', 'flash'),
};
