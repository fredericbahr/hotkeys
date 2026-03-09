import type { HotkeyOptions, SequenceOptions } from '@tanstack/hotkeys'

export const HOTKEY_DEFAULT_OPTIONS: HotkeyOptions = {
  enabled: true,
  preventDefault: true,
  stopPropagation: true,
  eventType: 'keydown',
  requireReset: false,
  ignoreInputs: undefined, // smart default: false for Mod+S, true for single keys
  target: document,
  platform: undefined, // auto-detected
  conflictBehavior: 'warn',
}

export const HOTKEY_SEQUENCE_DEFAULT_OPTIONS: SequenceOptions = {
  enabled: true,
  timeout: 1000,
  preventDefault: true,
  stopPropagation: true,
  eventType: 'keydown',
  ignoreInputs: undefined, // smart default: false for Mod+S, true for single keys
  target: document,
  platform: undefined, // auto-detected
  conflictBehavior: 'warn',
}
