import { HotkeySequenceController } from '../controllers/hotkey-sequence'
import { HOTKEY_SEQUENCE_DEFAULT_OPTIONS } from '../constants'
import type { LitElement } from 'lit'
import type {
  HotkeyCallback,
  HotkeySequence,
  SequenceOptions,
} from '@tanstack/hotkeys'

/**
 * Decorator that registers a keyboard sequence (e.g. Vim-style) on the element
 * when it connects and unregisters when it disconnects. Uses
 * {@link HotkeySequenceController} under the hood.
 *
 * @param sequence - The key sequence to listen for (e.g. `['G', 'G']` for "g g").
 * @param options - Optional sequence options (target, timeout, enabled, etc.).
 * @returns A method decorator for use on LitElement methods.
 *
 * @example
 * ```ts
 * class MyElement extends LitElement {
 *   @hotkeySequence(['G', 'G'])
 *   goToTop() { window.scrollTo(0, 0) }
 *
 *   @hotkeySequence(['D', 'D'], { timeout: 500 })
 *   deleteLine() { this.deleteCurrentLine() }
 * }
 * ```
 */
export function hotkeySequence(
  sequence: HotkeySequence,
  options: SequenceOptions = HOTKEY_SEQUENCE_DEFAULT_OPTIONS,
) {
  return function <T extends HotkeyCallback>(
    proto: LitElement,
    methodName: string,
    descriptor: TypedPropertyDescriptor<T>,
  ) {
    const originalConnected = proto.connectedCallback
    const controllerKey = Symbol(`@hotkeySequence:${methodName}`)

    proto.connectedCallback = function () {
      originalConnected.call(this)

      const host = this as unknown as {
        [key: symbol]: HotkeySequenceController | undefined
        addController: (c: unknown) => void
        [key: string]: unknown
      }
      if (!host[controllerKey]) {
        const callback: HotkeyCallback = descriptor.value
          ? descriptor.value.bind(this)
          : (host[methodName] as HotkeyCallback).bind(this)

        if (typeof callback !== 'function') {
          throw new Error(
            `@hotkeySequence decorator can only be applied to functions`,
          )
        }

        const controller: HotkeySequenceController =
          new HotkeySequenceController(this, sequence, callback, options)
        host[controllerKey] = controller
        this.addController(controller)
      }
    }
  }
}
