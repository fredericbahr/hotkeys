import { LitElement, css, html, nothing, unsafeCSS } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import {
  HeldKeysController,
  HotkeySequenceRecorderController,
  formatForDisplay,
  getSequenceManager,
} from '@tanstack/lit-hotkeys'
import appStyles from './index.css?raw'
import type {
  HotkeyCallback,
  HotkeySequence,
  SequenceRegistrationHandle,
} from '@tanstack/lit-hotkeys'

interface ShortcutAction {
  name: string
  defaultSequence: HotkeySequence
}

interface ShortcutActions {
  [key: string]: ShortcutAction
}

const DEFAULT_SHORTCUT_ACTIONS: ShortcutActions = {
  save: { name: 'Save', defaultSequence: ['Mod+S'] },
  open: { name: 'Open (gg)', defaultSequence: ['G', 'G'] },
  new: { name: 'New (dd)', defaultSequence: ['D', 'D'] },
  close: { name: 'Close', defaultSequence: ['Mod+Shift+K'] },
  undo: { name: 'Undo (yy)', defaultSequence: ['Y', 'Y'] },
  redo: { name: 'Redo', defaultSequence: ['Mod+Shift+G'] },
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

  private recorder = new HotkeySequenceRecorderController(this, {
    onRecord: (sequence: HotkeySequence) => {
      if (this._recordingActionId) {
        this._shortcuts = {
          ...this._shortcuts,
          [this._recordingActionId]: sequence,
        }
        this._recordingActionId = null
        this._reregisterSequences()
      }
    },
    onCancel: () => {
      this._recordingActionId = null
      this._reregisterSequences()
    },
    onClear: () => {
      if (this._recordingActionId) {
        this._shortcuts = {
          ...this._shortcuts,
          [this._recordingActionId]: [],
        }
        this._recordingActionId = null
        this._reregisterSequences()
      }
    },
  })

  @state() private _shortcuts: Record<string, HotkeySequence> =
    Object.fromEntries(
      Object.entries(DEFAULT_SHORTCUT_ACTIONS).map(([id, action]) => [
        id,
        action.defaultSequence,
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

  private _registrations: Array<SequenceRegistrationHandle> = []

  override connectedCallback(): void {
    super.connectedCallback()
    this._reregisterSequences()
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

  private _reregisterSequences(): void {
    this._unregisterAll()

    if (this.recorder.isRecording) return

    const manager = getSequenceManager()

    for (const [actionId, action] of Object.entries(DEFAULT_SHORTCUT_ACTIONS)) {
      const sequence = this._resolveSequence(actionId)

      if (sequence.length === 0) continue

      const callback: HotkeyCallback = () => {
        console.log(`${action.name} triggered:`, sequence)
        this._counts = {
          ...this._counts,
          [actionId]: (this._counts[actionId] ?? 0) + 1,
        }
      }

      const reg = manager.register(sequence, callback, { target: document })
      this._registrations.push(reg)
    }
  }

  private _resolveSequence(actionId: string): HotkeySequence {
    return (
      this._shortcuts[actionId] ??
      DEFAULT_SHORTCUT_ACTIONS[actionId].defaultSequence
    )
  }

  private _formatSequenceLabel(actionId: string): string {
    const seq = this._resolveSequence(actionId)
    if (seq.length === 0) return '—'
    return seq.map((h) => formatForDisplay(h)).join(' ')
  }

  private _handleEdit(actionId: string): void {
    this._unregisterAll()
    this._recordingActionId = actionId
    this.recorder.startRecording()
  }

  private _handleCancel(): void {
    this.recorder.cancelRecording()
    this._recordingActionId = null
    this._reregisterSequences()
  }

  render() {
    return html`
      <div class="app">
        <header>
          <h1>Sequence Shortcut Settings</h1>
          <p>
            Customize Vim-style sequences. Click Edit, press each chord in
            order, then press Enter to save. Escape cancels; Backspace removes
            the last chord or clears when empty.
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
                  const sequence = this._resolveSequence(actionId)
                  const disabled = sequence.length === 0

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
                                  ${this.recorder.steps.length > 0
                                    ? html`
                                        <span class="held-hotkeys">
                                          ${this.recorder.steps
                                            .map((h) => formatForDisplay(h))
                                            .join(' ')}
                                        </span>
                                      `
                                    : this.heldKeys.value.length > 0
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
                                            Press chords, then Enter…
                                          </span>
                                        `}
                                </div>
                              `
                            : disabled
                              ? html`<span class="no-shortcut"
                                  >No shortcut</span
                                >`
                              : html`<kbd>
                                  ${sequence
                                    .map((h) => formatForDisplay(h))
                                    .join(' ')}
                                </kbd>`}
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
            <p>Try your sequences within the default timeout window.</p>
            <div class="demo-stats">
              ${Object.entries(DEFAULT_SHORTCUT_ACTIONS).map(
                ([actionId, action]) => html`
                  <div class="stat-item">
                    <div class="stat-label">${action.name}</div>
                    <div class="stat-value">${this._counts[actionId] ?? 0}</div>
                    <kbd>${this._formatSequenceLabel(actionId)}</kbd>
                  </div>
                `,
              )}
            </div>
          </section>

          ${this.recorder.isRecording
            ? html`
                <div class="info-box recording-notice">
                  <strong>Recording sequence…</strong> Press each chord, then
                  Enter to finish. Escape cancels. Backspace removes the last
                  chord or clears.
                  ${this.recorder.steps.length > 0
                    ? html`
                        <div>
                          Steps:
                          ${this.recorder.steps.map(
                            (h, i) => html`
                              ${i > 0 ? ' ' : ''}<kbd
                                >${formatForDisplay(h)}</kbd
                              >
                            `,
                          )}
                        </div>
                      `
                    : nothing}
                </div>
              `
            : nothing}

          <section class="demo-section">
            <h2>Usage</h2>
            <pre class="code-block">
${`import { HotkeySequenceRecorderController, formatForDisplay } from '@tanstack/lit-hotkeys'
import type { HotkeySequence } from '@tanstack/lit-hotkeys'

class ShortcutSettings extends LitElement {
  private recorder = new HotkeySequenceRecorderController(this, {
    onRecord: (sequence) => {
      this.sequence = sequence
      this.requestUpdate()
    },
    onCancel: () => {
      console.log('Recording cancelled')
    },
  })

  @state() private sequence: HotkeySequence | null = null

  render() {
    return html\`
      <button @click=\${() => this.recorder.startRecording()}>
        \${this.recorder.isRecording ? 'Recording...' : 'Edit Sequence'}
      </button>
      \${this.recorder.steps.length
        ? html\`<div>Steps: \${this.recorder.steps.map(h => formatForDisplay(h)).join(' ')}</div>\`
        : nothing}
      \${this.sequence
        ? html\`<div>Recorded: \${this.sequence.map(h => formatForDisplay(h)).join(' ')}</div>\`
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
