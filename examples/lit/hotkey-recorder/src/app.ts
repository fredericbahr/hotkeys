import { LitElement, css, html, nothing, unsafeCSS } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import {
  HeldKeysController,
  HotkeyRecorderController,
  formatForDisplay,
  getHotkeyManager,
} from '@tanstack/lit-hotkeys'
import appStyles from './index.css?raw'
import type {
  Hotkey,
  HotkeyCallback,
  HotkeyRegistrationHandle,
} from '@tanstack/lit-hotkeys'

interface ShortcutActions {
  [key: string]: {
    name: string
    defaultHotkey: Hotkey
  }
}

const DEFAULT_SHORTCUT_ACTIONS: ShortcutActions = {
  save: { name: 'Save', defaultHotkey: 'Mod+K' },
  open: { name: 'Open', defaultHotkey: 'Mod+E' },
  new: { name: 'New', defaultHotkey: 'Mod+G' },
  close: { name: 'Close', defaultHotkey: 'Mod+Shift+K' },
  undo: { name: 'Undo', defaultHotkey: 'Mod+Shift+E' },
  redo: { name: 'Redo', defaultHotkey: 'Mod+Shift+G' },
}

@customElement('my-app')
export class MyApp extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
        margin: 0;
        font-family:
          system-ui,
          -apple-system,
          sans-serif;
        background: #f5f5f5;
        color: #333;
        box-sizing: border-box;
      }
      :host *,
      :host *::before,
      :host *::after {
        box-sizing: border-box;
      }
    `,
    unsafeCSS(appStyles),
  ]

  private heldKeys = new HeldKeysController(this)

  private recorder = new HotkeyRecorderController(this, {
    onRecord: (hotkey: Hotkey) => {
      if (this._recordingActionId) {
        this._shortcuts = {
          ...this._shortcuts,
          [this._recordingActionId]: hotkey,
        }
        this._recordingActionId = null
        this._reregisterHotkeys()
      }
    },
    onCancel: () => {
      this._recordingActionId = null
    },
    onClear: () => {
      if (this._recordingActionId) {
        this._shortcuts = {
          ...this._shortcuts,
          [this._recordingActionId]: '',
        }
        this._recordingActionId = null
        this._reregisterHotkeys()
      }
    },
  })

  @state() private _shortcuts: Record<string, string> = Object.fromEntries(
    Object.entries(DEFAULT_SHORTCUT_ACTIONS).map(([id, action]) => [
      id,
      action.defaultHotkey,
    ]),
  )

  @state() private _recordingActionId: string | null = null
  @state() private _counts: Record<string, number> = {
    save: 0,
    open: 0,
    new: 0,
    close: 0,
    undo: 0,
    redo: 0,
  }

  private _registrations: Array<HotkeyRegistrationHandle> = []

  override connectedCallback(): void {
    super.connectedCallback()
    this._reregisterHotkeys()
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this._unregisterAll()
  }

  private _unregisterAll(): void {
    for (const reg of this._registrations) {
      if (reg.isActive) {
        reg.unregister()
      }
    }
    this._registrations = []
  }

  private _reregisterHotkeys(): void {
    this._unregisterAll()

    if (this.recorder.isRecording) return

    const manager = getHotkeyManager()

    for (const [actionId, action] of Object.entries(DEFAULT_SHORTCUT_ACTIONS)) {
      const hotkey = (this._shortcuts[actionId] ||
        action.defaultHotkey) as Hotkey

      const callback: HotkeyCallback = () => {
        console.log(`${action.name} triggered:`, hotkey)
        this._counts = {
          ...this._counts,
          [actionId]: (this._counts[actionId] ?? 0) + 1,
        }
      }

      const reg = manager.register(hotkey, callback, { target: document })
      this._registrations.push(reg)
    }
  }

  private _handleEdit(actionId: string): void {
    this._unregisterAll()
    this._recordingActionId = actionId
    this.recorder.startRecording()
  }

  private _handleCancel(): void {
    this.recorder.cancelRecording()
    this._recordingActionId = null
    this._reregisterHotkeys()
  }

  render() {
    return html`
      <div class="app">
        <header>
          <h1>Keyboard Shortcuts Settings</h1>
          <p>
            Customize your keyboard shortcuts. Click "Edit" to record a new
            shortcut, or press Escape to cancel.
          </p>
        </header>

        <main>
          <section class="demo-section">
            <h2>Shortcuts</h2>
            <div class="shortcuts-list">
              ${Object.entries(DEFAULT_SHORTCUT_ACTIONS).map(
                ([actionId, action]) => {
                  const isRecordingThis =
                    this.recorder.isRecording &&
                    this._recordingActionId === actionId
                  const hotkey = this._shortcuts[actionId] ?? ''

                  return html`
                    <div
                      class="shortcut-item ${isRecordingThis
                        ? 'recording'
                        : ''}"
                    >
                      <div class="shortcut-item-content">
                        <div class="shortcut-action">${action.name}</div>
                        <div class="shortcut-hotkey">
                          ${isRecordingThis
                            ? html`
                                <div class="recording-indicator">
                                  ${this.heldKeys.value.length > 0
                                    ? html`
                                        <div class="held-hotkeys">
                                          ${this.heldKeys.value.map(
                                            (key, index) => html`
                                              ${index > 0
                                                ? html`<span class="plus"
                                                    >+</span
                                                  >`
                                                : nothing}
                                              <kbd>${key}</kbd>
                                            `,
                                          )}
                                        </div>
                                      `
                                    : html`
                                        <span class="recording-text">
                                          Press any key combination...
                                        </span>
                                      `}
                                </div>
                              `
                            : hotkey
                              ? html`<kbd
                                  >${formatForDisplay(hotkey as Hotkey)}</kbd
                                >`
                              : html`<span class="no-shortcut"
                                  >No shortcut</span
                                >`}
                        </div>
                      </div>
                      <div class="shortcut-actions">
                        ${isRecordingThis
                          ? html`
                              <button
                                class="cancel-button"
                                @click=${() => this._handleCancel()}
                              >
                                Cancel
                              </button>
                            `
                          : html`
                              <button
                                class="edit-button"
                                @click=${() => this._handleEdit(actionId)}
                              >
                                Edit
                              </button>
                            `}
                      </div>
                    </div>
                  `
                },
              )}
            </div>
          </section>

          <section class="demo-section">
            <h2>Demo Actions</h2>
            <p>Try your shortcuts! Actions will trigger when you press them.</p>
            <div class="demo-stats">
              ${Object.entries(DEFAULT_SHORTCUT_ACTIONS).map(
                ([actionId, action]) => html`
                  <div class="stat-item">
                    <div class="stat-label">${action.name}</div>
                    <div class="stat-value">${this._counts[actionId] ?? 0}</div>
                    <kbd>
                      ${formatForDisplay(
                        (this._shortcuts[actionId] ||
                          action.defaultHotkey) as Hotkey,
                      )}
                    </kbd>
                  </div>
                `,
              )}
            </div>
          </section>

          ${this.recorder.isRecording
            ? html`
                <div class="info-box recording-notice">
                  <strong>Recording shortcut...</strong> Press any key
                  combination or Escape to cancel. Press Backspace/Delete to
                  clear the shortcut.
                </div>
              `
            : nothing}

          <section class="demo-section">
            <h2>Usage</h2>
            <pre class="code-block">
${`import { HotkeyRecorderController, formatForDisplay } from '@tanstack/lit-hotkeys'
import type { Hotkey } from '@tanstack/lit-hotkeys'

class ShortcutSettings extends LitElement {
  private recorder = new HotkeyRecorderController(this, {
    onRecord: (hotkey) => {
      this.shortcut = hotkey
      this.requestUpdate()
    },
    onCancel: () => {
      console.log('Recording cancelled')
    },
  })

  @state() private shortcut: Hotkey | null = null

  render() {
    return html\`
      <button @click=\${() => this.recorder.startRecording()}>
        \${this.recorder.isRecording ? 'Recording...' : 'Edit Shortcut'}
      </button>
      \${this.shortcut
        ? html\`<kbd>\${formatForDisplay(this.shortcut)}</kbd>\`
        : nothing}
    \`
  }
}`}</pre
            >
          </section>
        </main>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-app': MyApp
  }
}
