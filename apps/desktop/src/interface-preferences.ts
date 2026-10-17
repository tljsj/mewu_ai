// SPDX-License-Identifier: MPL-2.0
import type { UiLanguage } from './i18n';
import { translationLanguages, type TranslationLanguage } from './translation-request';
import type { PreviewResolution } from './video-preview';
/** ping 轮盘触发键：物理键 code（KeyA-Z / Digit0-9）+ 三个修饰键开关；裸键合法。 */
export interface PingWheelTriggerPref { code: string; ctrl: boolean; shift: boolean; alt: boolean }
/** ping 轮盘槽位：方位由数组下标决定（0=北，顺时针），action 见 SpaceCanvas 的动作池，label 为槽位图标文字（可空用默认），icon 为用户自带的图片 data URL（可空，仅存本地偏好，不随源码分发）。 */
export interface PingWheelSlotPref { action: string; label?: string; icon?: string }
export const DEFAULT_PING_WHEEL_TRIGGER: PingWheelTriggerPref = { code: 'KeyG', ctrl: false, shift: false, alt: false };
export const DEFAULT_PING_WHEEL_SLOTS: readonly PingWheelSlotPref[] = [
  { action: 'explain' }, { action: 'pin' }, { action: 'copy' }, { action: 'save' },
  { action: 'cancel' }, { action: 'ocr' }, { action: 'translate' }, { action: 'table' },
];
const validTrigger = (value: unknown): value is PingWheelTriggerPref =>
  Boolean(value) && typeof value === 'object' && /^(Key[A-Z]|Digit[0-9])$/.test((value as PingWheelTriggerPref).code)
  && [(value as PingWheelTriggerPref).ctrl, (value as PingWheelTriggerPref).shift, (value as PingWheelTriggerPref).alt].every(flag => typeof flag === 'boolean');
const validSlots = (value: unknown): PingWheelSlotPref[] => {
  if (!Array.isArray(value)) return [...DEFAULT_PING_WHEEL_SLOTS];
  const cleaned = value.filter((slot): slot is PingWheelSlotPref =>
    Boolean(slot) && typeof slot === 'object' && typeof (slot as PingWheelSlotPref).action === 'string' && (slot as PingWheelSlotPref).action.length > 0 && (slot as PingWheelSlotPref).action.length <= 80)
    .map(slot => ({
      action: slot.action,
      ...(typeof slot.label === 'string' && slot.label.trim() && slot.label.length <= 8 ? { label: slot.label.trim() } : {}),
      ...(typeof slot.icon === 'string' && /^data:image\/(png|jpeg|webp);base64,/.test(slot.icon) && slot.icon.length <= 280000 ? { icon: slot.icon } : {}),
    }));
  return [...DEFAULT_PING_WHEEL_SLOTS.map((slot, index) => cleaned[index] ?? slot)];
};
export interface Preferences {
  textSize: 'small' | 'default' | 'large';
  reduceMotion: boolean;
  maskOpacity: number;
  uiLanguage?: UiLanguage;
  translationLanguage?: TranslationLanguage;
  showButtonLabels?: boolean;
  thinkingGlowEnabled?: boolean;
  thinkingGlowColor?: string;
  videoPreviewResolution?: PreviewResolution;
  pingWheelTrigger?: PingWheelTriggerPref;
  pingWheelSlots?: PingWheelSlotPref[];
}
export const preferenceKey = 'mewu.interface.v1';
export function readPreferences(): Preferences {
  const defaults: Preferences = { textSize: 'default', reduceMotion: false, maskOpacity: .58, uiLanguage: 'system', translationLanguage: 'zh-Hans', showButtonLabels: true, thinkingGlowEnabled: true, thinkingGlowColor: '#A7C7FF', videoPreviewResolution: 100, pingWheelTrigger: DEFAULT_PING_WHEEL_TRIGGER, pingWheelSlots: [...DEFAULT_PING_WHEEL_SLOTS] };
  try {
    const value = JSON.parse(localStorage.getItem(preferenceKey) || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return defaults;
    return {
      textSize: ['small', 'default', 'large'].includes(value.textSize) ? value.textSize : defaults.textSize,
      reduceMotion: value.reduceMotion === true,
      maskOpacity: typeof value.maskOpacity === 'number' && Number.isFinite(value.maskOpacity) ? Math.min(.8, Math.max(.3, value.maskOpacity)) : defaults.maskOpacity,
      uiLanguage: ['system', 'zh-CN', 'en-US'].includes(value.uiLanguage) ? value.uiLanguage : defaults.uiLanguage,
      translationLanguage: translationLanguages.some(([language]) => language === value.translationLanguage) ? value.translationLanguage : defaults.translationLanguage,
      showButtonLabels: value.showButtonLabels !== false,
      thinkingGlowEnabled: value.thinkingGlowEnabled !== false,
      videoPreviewResolution: [50, 75, 100].includes(value.videoPreviewResolution) ? value.videoPreviewResolution : 100,
      thinkingGlowColor: typeof value.thinkingGlowColor === 'string' && /^#[0-9a-f]{6}$/i.test(value.thinkingGlowColor.trim()) ? value.thinkingGlowColor.trim().toUpperCase() : defaults.thinkingGlowColor,
      pingWheelTrigger: validTrigger(value.pingWheelTrigger) ? value.pingWheelTrigger : defaults.pingWheelTrigger,
      pingWheelSlots: validSlots(value.pingWheelSlots),
    };
  } catch { return defaults; }
}
