// ping 轮盘音效（可选，LOL 模式启用）：值为 base64 数据 URL，留空 = 静音。
// 播放走预解码的 AudioContext 缓冲（照抄 lolPing soundBank 的做法：HTMLAudioElement 每次现解
// 100-200KB wav 会有可闻延迟，首次播放尤其明显）。未命中缓冲时退回 HTMLAudio 并补解码。
export const PING_SOUNDS: Record<'tick' | 'cancel', string> = { tick: '', cancel: '' };

let audioContext: AudioContext | undefined;
const buffers = new Map<string, AudioBuffer>();
const decoding = new Set<string>();

function ensureContext(): AudioContext {
  if (!audioContext) audioContext = new AudioContext({ latencyHint: 'interactive' });
  return audioContext;
}

async function decode(url: string): Promise<void> {
  if (buffers.has(url) || decoding.has(url)) return;
  decoding.add(url);
  try {
    const response = await fetch(url);
    buffers.set(url, await ensureContext().decodeAudioData(await response.arrayBuffer()));
  } catch { /* 解码失败：播放时走 HTMLAudio 退化 */ }
  finally { decoding.delete(url); }
}

/** 提前解码一批音频（例如轮盘打开时调用），让稍后触发的语音零延迟。 */
export function preloadPingAudio(urls: Iterable<string>): void {
  for (const url of urls) if (url) void decode(url);
}

export function playPingAudio(url: string | undefined, volume = 0.35): void {
  if (!url) return;
  const buffer = buffers.get(url);
  if (buffer) {
    const context = ensureContext();
    if (context.state !== 'running') void context.resume();
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    gain.gain.value = volume;
    source.connect(gain).connect(context.destination);
    source.start();
    return;
  }
  void decode(url); // 这次先退回，下次就快了
  try {
    const audio = new Audio(url);
    audio.volume = volume;
    void audio.play().catch(() => { /* 自动播放限制等：静默 */ });
  } catch { /* 音频不可用时静默 */ }
}

export function playPingSound(kind: 'tick' | 'cancel', volume = 0.35): void {
  playPingAudio(PING_SOUNDS[kind], kind === 'tick' ? volume * 0.5 : volume);
}
