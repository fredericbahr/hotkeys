import { getSequenceManager } from '@tanstack/hotkeys'
import { HOTKEY_SEQUENCE_DEFAULT_OPTIONS } from '../constants'
import type { ReactiveController, ReactiveControllerHost } from 'lit'
import type {
  HotkeyCallback,
  HotkeySequence,
  SequenceManager,
  SequenceOptions,
  SequenceRegistrationHandle,
} from '@tanstack/hotkeys'

/**
 * A Lit ReactiveController that registers a keyboard sequence (e.g. Vim-style)
 * when the host element is connected and unregisters it when the host is disconnected.
 *
 * @example
 * ```ts
 * class MyElement extends LitElement {
 *   private seq = new HotkeySequenceController(this, ['G', 'G'], () => this.goToTop())
 *
 *   constructor() {
 *     super()
 *     this.addController(this.seq)
 *   }
 * }
 * ```
 */
export class HotkeySequenceController implements ReactiveController {
  /** The sequence registration handle. */
  private _registration: SequenceRegistrationHandle | undefined

  /**
   * @param _host - The Lit component that owns this controller (use `this` and pass it to `addController()`).
   * @param _sequence - The key sequence to listen for (e.g. `['G', 'G']`).
   * @param _callback - Function to run when the sequence is completed; called with the host as `this`.
   * @param _options - Optional sequence options (target, timeout, enabled, etc.).
   */
  constructor(
    private _host: ReactiveControllerHost,
    private _sequence: HotkeySequence,
    private _callback: HotkeyCallback,
    private _options: SequenceOptions = HOTKEY_SEQUENCE_DEFAULT_OPTIONS,
  ) {}

  /**
   * Registers the sequence with the global sequence manager when the host is connected to the DOM.
   * Skips registration if disabled, sequence is empty, or no target is available.
   */
  public hostConnected(): void {
    const { target: _target, ...optionsWithoutTarget } = this._options

    const manager: SequenceManager = getSequenceManager()

    const hasExplicitTarget = 'target' in this._options
    const resolvedTarget = hasExplicitTarget
      ? (this._options.target ?? null)
      : typeof document !== 'undefined'
        ? document
        : null

    if (!resolvedTarget) {
      return
    }

    const boundCallback: HotkeyCallback = this._callback.bind(
      this._host as unknown as object,
    )

    this._registration = manager.register(this._sequence, boundCallback, {
      ...optionsWithoutTarget,
      target: resolvedTarget,
    })
  }

  /** Unregisters the sequence when the host is disconnected from the DOM. */
  public hostDisconnected(): void {
    if (this._registration?.isActive) {
      this._registration.unregister()
    }
    this._registration = undefined
  }
}
