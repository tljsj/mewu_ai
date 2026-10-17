// SPDX-License-Identifier: MPL-2.0
import { createEffect, createSignal, For, on, onCleanup, Show } from 'solid-js';
import { translationLanguages, type TranslationLanguage } from '../translation-request';
import { t } from '../i18n';
import { LoaderCircle, ScanLine, Video } from 'lucide-solid';
import CaptureShortcutField from './CaptureShortcutField';
import type { Preferences } from './SettingsDialog';
import { CapturePreferencesController, type CapturePreferencesView } from '../capture-preferences';
import { settingsApi } from '../settings-bridge';
import type { SettingsClient } from '../settings-client';
import { Row, Toggle } from './SettingControls';
import RecordingAudioSettings from './RecordingAudioSettings';
import type { PreviewResolution } from '../video-preview';
import { DEFAULT_PING_WHEEL_SLOTS, DEFAULT_PING_WHEEL_TRIGGER, type PingWheelTriggerPref } from '../interface-preferences';
import { PING_WHEEL_BUILTIN_ACTIONS } from './SpaceCanvas';
import { getPlugins, subscribePlugins } from '../plugin-bridge';
import { PING_SKINS } from '../ping-assets';
import type { PluginRecord } from '../plugin-contracts';

const PING_WHEEL_DIRECTIONS = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'] as const;
const formatPingTrigger = (value: PingWheelTriggerPref) => [value.ctrl && 'Ctrl', value.shift && 'Shift', value.alt && 'Alt', value.code.replace(/^Key|^Digit/, '').replace('Control', 'Ctrl')].filter(Boolean).join(' + ');
function PingTriggerField(props: { value: PingWheelTriggerPref; onChange: (value: PingWheelTriggerPref) => void }) {
  const [recording, setRecording] = createSignal(false);
  const [notice, setNotice] = createSignal('');
  let heldModifier = '';
  const captureKey = (event: KeyboardEvent) => {
    event.preventDefault(); event.stopPropagation();
    if (event.key === 'Escape') { heldModifier = ''; stop(); return; }
    if (event.repeat || event.isComposing || event.metaKey) return;
    if (/^[a-z0-9]$/i.test(event.key)) {
      if (!event.ctrlKey && !event.shiftKey && !event.altKey) { setNotice('裸字母/数字会打进输入框，请加修饰键或用 Alt'); return; } // 限制：不允许与打字冲突的键
      heldModifier = '';
      stop();
      props.onChange({ code: /^[0-9]$/.test(event.key) ? `Digit${event.key}` : `Key${event.key.toUpperCase()}`, ctrl: event.ctrlKey, shift: event.shiftKey, alt: event.altKey });
    } else if (event.key === 'Alt' || event.key === 'Control' || event.key === 'Shift') {
      heldModifier = event.key; // 可能是在组组合键：等字母；直接松开则记为裸修饰键
    }
  };
  const captureKeyUp = (event: KeyboardEvent) => {
    if (!heldModifier || event.key !== heldModifier) return;
    event.preventDefault(); event.stopPropagation();
    const code = heldModifier;
    heldModifier = '';
    stop();
    props.onChange({ code, ctrl: false, shift: false, alt: false });
  };
  const stop = () => { window.removeEventListener('keydown', captureKey, true); window.removeEventListener('keyup', captureKeyUp, true); setRecording(false); };
  onCleanup(stop);
  return <span class="ping-trigger-field">
    <button class="secondary-button" classList={{ 'ping-trigger-recording': recording() }} onClick={() => {
      if (recording()) { heldModifier = ''; setNotice(''); stop(); return; }
      setNotice(''); setRecording(true);
      window.addEventListener('keydown', captureKey, true);
      window.addEventListener('keyup', captureKeyUp, true);
    }}>{recording() ? t('单独按 Alt/Ctrl/Shift 松开即设为该键；或修饰键+字母') : formatPingTrigger(props.value)}</button>
    <Show when={notice()}><span class="settings-error" role="alert">{notice()}</span></Show>
  </span>;
}

export default function CaptureSettings(props: { active: boolean; preferences: Preferences; onPreferences: (value: Preferences) => void; api?: SettingsClient }) {
  const api = props.api ?? settingsApi;
  const [pane, setPane] = createSignal<'screenshot' | 'recording'>('screenshot');
  const [view, setView] = createSignal<CapturePreferencesView>({ pending: false, conflict: false, error: '' });
  const [loading, setLoading] = createSignal(false);
  const controller = new CapturePreferencesController(api.saveCapturePreferences, setView);
  const [workflowActions, setWorkflowActions] = createSignal<Array<{ action: string; title: string }>>([]);
  const collectWorkflowActions = (plugins: PluginRecord[]) => setWorkflowActions(plugins
    .filter(plugin => plugin.state === 'enabled' && !plugin.error)
    .flatMap(plugin => plugin.manifest.contributions.filter(contribution => contribution.kind === 'selection.workflow')
      .map(contribution => ({ action: `workflow:${plugin.manifest.id}/${contribution.id}`, title: contribution.title }))));
  createEffect(on(() => props.active && pane() === 'screenshot', active => {
    if (!active) return;
    let stopSubscription: (() => void) | undefined;
    let disposedEffect = false;
    onCleanup(() => { disposedEffect = true; stopSubscription?.(); });
    void getPlugins().then(snapshot => { if (!disposedEffect) collectWorkflowActions(snapshot.plugins); }).catch(() => {});
    void subscribePlugins(snapshot => collectWorkflowActions(snapshot.plugins), 'settings').then(stop => { if (disposedEffect) stop(); else stopSubscription = stop; }).catch(() => {});
  }));
  let disposed = false, stop: (() => void) | undefined, started = false;
  async function initialize() {
    if (loading() || disposed) return;
    setLoading(true);
    try {
      if (!stop) {
        const unsubscribe = await api.watchCapturePreferences(state => controller.loaded(state));
        if (disposed) unsubscribe(); else stop = unsubscribe;
      } else controller.loaded(await api.getCapturePreferences());
    } catch (error) { controller.failed(error); }
    finally { if (!disposed) setLoading(false); }
  }
  async function loadLatest() {
    if (loading() || view().pending || disposed) return;
    const draft = view().draft;
    setLoading(true);
    try { const state = await api.getCapturePreferences(); if (!disposed) controller.loadLatest(state, draft); }
    catch (error) { controller.failed(error); }
    finally { if (!disposed) setLoading(false); }
  }
  createEffect(on(() => props.active && pane() === 'screenshot', active => { if (active && !started) { started = true; void initialize(); } }));
  onCleanup(() => { disposed = true; stop?.(); controller.dispose(); });
  return <div class="capture-settings">
    <header class="settings-page-heading"><h2>{t("截图与录屏")}</h2></header>
    <div class="segmented"><button aria-pressed={pane() === 'screenshot'} classList={{ selected: pane() === 'screenshot' }} onClick={() => setPane('screenshot')}><ScanLine size={13} />{t('截图')}</button><button aria-pressed={pane() === 'recording'} classList={{ selected: pane() === 'recording' }} onClick={() => setPane('recording')}><Video size={13} />{t('录屏')}</button></div>
    <div hidden={pane() !== 'screenshot'}>
    <Row title={t("截图快捷键")}><CaptureShortcutField visible={props.active && pane() === 'screenshot'} /></Row>
    <Row title={t('翻译目标语言')}><select aria-label={t('翻译目标语言')} value={props.preferences.translationLanguage ?? 'zh-Hans'} onChange={event => props.onPreferences({ ...props.preferences, translationLanguage: event.currentTarget.value as TranslationLanguage })}><For each={translationLanguages}>{([language, label]) => <option value={language}>{t(label)}</option>}</For></select></Row>
    <Row title={t("选区外暗度")}><div class="range-field"><input aria-label={t("选区外暗度")} type="range" min=".3" max=".8" step=".01" value={props.preferences.maskOpacity} onInput={event => props.onPreferences({ ...props.preferences, maskOpacity: Number(event.currentTarget.value) })} /><output>{Math.round(props.preferences.maskOpacity * 100)}%</output></div></Row>
    <Row title={t("ping 轮盘触发键")}><PingTriggerField value={props.preferences.pingWheelTrigger ?? DEFAULT_PING_WHEEL_TRIGGER} onChange={value => props.onPreferences({ ...props.preferences, pingWheelTrigger: value })} /></Row>
    <Row title={t("轮盘模式")}><select aria-label={t('轮盘模式')} value={props.preferences.pingWheelMode ?? 'click'} onChange={event => props.onPreferences({ ...props.preferences, pingWheelMode: event.currentTarget.value as 'click' | 'lol' })}><option value="click">{t('点击模式（按住键唤出，点击槽位执行）')}</option><option value="lol">{t('LOL 模式（按住键+左键拖动，松开执行，含标记与音效）')}</option></select></Row>
    <For each={Array.from({ length: 8 }, (_, index) => index)}>{index => {
      const slot = () => (props.preferences.pingWheelSlots ?? DEFAULT_PING_WHEEL_SLOTS)[index] ?? DEFAULT_PING_WHEEL_SLOTS[index];
      const builtin = () => PING_WHEEL_BUILTIN_ACTIONS.find(entry => entry.action === slot().action);
      const editSlot = (patch: Partial<{ action: string; label: string; icon?: string; skin?: string }>) => {
        const next = Array.from({ length: 8 }, (_, i) => (props.preferences.pingWheelSlots ?? DEFAULT_PING_WHEEL_SLOTS)[i] ?? DEFAULT_PING_WHEEL_SLOTS[i]);
        next[index] = { action: patch.action ?? next[index].action, label: patch.label !== undefined ? patch.label : next[index].label, ...(patch.icon !== undefined ? { icon: patch.icon } : ('icon' in next[index] ? { icon: next[index].icon } : {})) };
        props.onPreferences({ ...props.preferences, pingWheelSlots: next });
      };
      let iconInput: HTMLInputElement | undefined;
      const pickIcon = (file: File | undefined) => {
        if (!file) return;
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 200 * 1024) { props.onPreferences({ ...props.preferences }); return; } // 只收 ≤200KB 的 PNG/JPEG/WebP
        const reader = new FileReader();
        reader.onload = () => { if (typeof reader.result === 'string') editSlot({ icon: reader.result }); };
        reader.readAsDataURL(file);
      };
      return <Row title={`${t('轮盘槽位')} · ${PING_WHEEL_DIRECTIONS[index]}`}>
        <select aria-label={`${t('轮盘槽位')} ${PING_WHEEL_DIRECTIONS[index]}`} value={slot().action} onChange={event => editSlot({ action: event.currentTarget.value })}>
          <For each={PING_WHEEL_BUILTIN_ACTIONS}>{entry => <option value={entry.action}>{t(entry.title)}</option>}</For>
          <For each={workflowActions()}>{entry => <option value={entry.action}>{entry.title}</option>}</For>
          <option value="none">{t('空')}</option>
        </select>
        <input aria-label={`${t('槽位图标')} ${PING_WHEEL_DIRECTIONS[index]}`} class="ping-slot-label" maxlength="8" placeholder={builtin()?.label ?? t('图标')} value={slot().label ?? ''} onInput={event => editSlot({ label: event.currentTarget.value })} />
        <select aria-label={`${t('槽位样式')} ${PING_WHEEL_DIRECTIONS[index]}`} value={slot().skin ?? ''} onChange={event => editSlot({ skin: event.currentTarget.value })}>
          <option value="">{t('默认样式')}</option>
          <For each={Object.entries(PING_SKINS)}>{([id, entry]) => <option value={id}>{entry.name}</option>}</For>
        </select>
        <input ref={iconInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={event => { pickIcon(event.currentTarget.files?.[0]); event.currentTarget.value = ''; }} />
        <button class="secondary-button" title={t('选择图片图标（≤200KB）')} onClick={() => iconInput?.click()}>{slot().icon ? t('换图') : t('图片')}</button>
        <Show when={slot().icon}><button class="secondary-button" title={t('清除图片图标')} onClick={() => editSlot({ icon: '' })}>{t('清除')}</button></Show>
      </Row>;
    }}</For>
    <Row title={t("轮盘布局")}><button class="secondary-button" onClick={() => props.onPreferences({ ...props.preferences, pingWheelSlots: [...DEFAULT_PING_WHEEL_SLOTS] })}>{t('恢复默认布局')}</button></Row>
    <Show when={view().values} fallback={<Show when={loading()}><LoaderCircle size={16} class="spin" aria-label={t("加载截图设置")} /></Show>}>
      <Row title={t("延时截图")}><select aria-label={t("延时截图")} value={view().values!.captureDelaySeconds} onChange={event => controller.edit({ captureDelaySeconds: Number(event.currentTarget.value) as 0 | 3 | 5 })}><option value="0">{t("无")}</option><option value="3">{t("3 秒")}</option><option value="5">{t("5 秒")}</option></select></Row>
      <Row title={t("默认图片格式")}><select aria-label={t("默认图片格式")} value={view().values!.defaultImageFormat} onChange={event => controller.edit({ defaultImageFormat: event.currentTarget.value as 'png' | 'jpeg' })}><option value="png">PNG</option><option value="jpeg">JPEG</option></select></Row>
      <Row title={t("截图包含鼠标指针")}><Toggle label={t("截图包含鼠标指针")} checked={view().values!.includeCursor} onChange={value => controller.edit({ includeCursor: value })} /></Row>
    </Show>
    <Show when={view().error || view().conflict}><p class="settings-error" role="alert">{view().error || t('截图设置已变化，请载入最新设置')}</p></Show>
    <Show when={view().draft || view().error}><div class="settings-actions">
      <Show when={view().draft}><button class="secondary-button" disabled={view().pending || loading()} onClick={() => view().conflict || view().error ? void loadLatest() : controller.discard()}>{view().conflict || view().error ? t('载入最新') : t('取消')}</button><button class="primary-button" disabled={view().pending || view().conflict || loading()} onClick={() => void controller.saveDraft()}><Show when={view().pending}><LoaderCircle size={13} class="spin" /></Show>{t("保存")}</button></Show>
      <Show when={!view().draft && view().error}><button class="secondary-button" disabled={loading()} onClick={() => void initialize()}>{t("重试")}</button></Show>
    </div></Show>
    </div>
    <div hidden={pane() !== 'recording'}><RecordingAudioSettings active={props.active && pane() === 'recording'} />
      <Row title={t('预览分辨率')}><select aria-label={t('预览分辨率')} value={props.preferences.videoPreviewResolution ?? 100} onChange={event => props.onPreferences({ ...props.preferences, videoPreviewResolution: Number(event.currentTarget.value) as PreviewResolution })}><option value="100">{t('原始（100%）')}</option><option value="75">75%</option><option value="50">50%</option></select></Row>
    </div>
  </div>;
}
