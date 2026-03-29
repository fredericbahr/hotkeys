import {
  detectPlatform,
  formatHotkey,
  getHotkeyManager,
  rawHotkeyToParsedHotkey,
} from '@tanstack/hotkeys'
import { HOTKEY_DEFAULT_OPTIONS } from '../constants'
import type { ReactiveController, ReactiveControllerHost } from 'lit'
import type {
  Hotkey,
  HotkeyCallback,
  HotkeyManager,
  HotkeyOptions,
  HotkeyRegistrationHandle,
  RegisterableHotkey,
} from '@tanstack/hotkeys'

/**
 * A Lit ReactiveController that registers a keyboard hotkey when the host
 * element is connected and unregisters it when the host is disconnected.
 *
 * @example
 * ```ts
 * class MyElement extends LitElement {
 *   private hotkey = new HotkeyController(this, 'Mod+S', () => this.save())
 *
 *   constructor() {
 *     super()
 *     this.addController(this.hotkey)
 *   }
 * }
 * ```
 */
export class HotkeyController implements ReactiveController {
  /** The hotkey registration handle. */
  private _registration: HotkeyRegistrationHandle | undefined

  /**
   * @param _host - The Lit component that owns this controller (use `this` and pass it to `addController()`).
   * @param _hotkey - The key or key combo to listen for (e.g. `'Mod+S'` or a raw hotkey object).
   * @param _callback - Function to run when the hotkey is pressed; called with the host as `this`.
   * @param _options - Optional registration options (target, platform, enabled, etc.).
   */
  constructor(
    private _host: ReactiveControllerHost,
    private _hotkey: RegisterableHotkey,
    private _callback: HotkeyCallback,
    private _options: HotkeyOptions = HOTKEY_DEFAULT_OPTIONS,
  ) {}

  /**
   * Registers the hotkey with the global manager when the host is connected to the DOM.
   * Skips registration if no target is available (e.g. no document or options.target is null).
   */
  public hostConnected(): void {
    const manager: HotkeyManager = getHotkeyManager()

    const platform = this._options.platform ?? detectPlatform()
    const hotkeyString: Hotkey =
      typeof this._hotkey === 'string'
        ? this._hotkey
        : (formatHotkey(
            rawHotkeyToParsedHotkey(this._hotkey, platform),
          ) as Hotkey)

    const hasExplicitTarget = 'target' in this._options
    const resolvedTarget = hasExplicitTarget
      ? (this._options.target ?? null)
      : typeof document !== 'undefined'
        ? document
        : null

    if (!resolvedTarget) {
      return
    }

    const { target: _target, ...optionsWithoutTarget } = this._options

    const boundCallback: HotkeyCallback = this._callback.bind(
      this._host as unknown as object,
    )

    this._registration = manager.register(hotkeyString, boundCallback, {
      ...optionsWithoutTarget,
      target: resolvedTarget,
    })
  }

  /** Unregisters the hotkey when the host is disconnected from the DOM. */
  public hostDisconnected(): void {
    if (this._registration?.isActive) {
      this._registration.unregister()
    }
    this._registration = undefined
  }
}
