// ping 轮盘音效（可选，LOL 模式启用）：值为 base64 数据 URL，留空 = 静音。
// - tick：轮盘切片切换的轻响（自动半音量）
// 个人口味：把自备音频转成 base64 填进来；版权素材不要提交到公开仓库。
export const PING_SOUNDS: Record<'tick' | 'cancel', string> = { tick: '', cancel: '' };

export function playPingAudio(url: string | undefined, volume = 0.35): void {
  if (!url) return;
  try {
    const audio = new Audio(url);
    audio.volume = volume;
    void audio.play().catch(() => { /* 自动播放限制等：静默 */ });
  } catch { /* 音频不可用时静默 */ }
}

export function playPingSound(kind: 'tick' | 'cancel', volume = 0.35): void {
  playPingAudio(PING_SOUNDS[kind], kind === 'tick' ? volume * 0.5 : volume);
}
