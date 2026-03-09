---
title: Quick Start
id: quick-start
---

## Installation

Don't have TanStack Hotkeys installed yet? See the [Installation](../../installation) page for instructions.

## Your First Hotkey

The Lit adapter offers two ways to register hotkeys: **decorators** for declarative method-level binding, and **controllers** for imperative, reactive state management.

### Using the `@hotkey` Decorator

The `@hotkey` decorator is the simplest way to bind a keyboard shortcut to a class method:

```ts
import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { hotkey } from '@tanstack/lit-hotkeys'

@customElement('my-editor')
class MyEditor extends LitElement {
  @hotkey('Mod+S')
  save() {
    saveDocument()
  }

  render() {
    return html`<div>Press Cmd+S (Mac) or Ctrl+S (Windows) to save</div>`
  }
}
```

### Using `HotkeyController`

For more control, use the `HotkeyController` directly:

```ts
import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { HotkeyController } from '@tanstack/lit-hotkeys'

@customElement('my-editor')
class MyEditor extends LitElement {
  private saveHotkey = new HotkeyController(
    this,
    'Mod+S',
    () => this.save(),
  )

  constructor() {
    super()
    this.addController(this.saveHotkey)
  }

  private save() {
    saveDocument()
  }

  render() {
    return html`<div>Press Cmd+S (Mac) or Ctrl+S (Windows) to save</div>`
  }
}
```

The `Mod` modifier automatically resolves to `Meta` (Command) on macOS and `Control` on Windows/Linux, so your shortcuts work across platforms without extra logic.

## Common Patterns

### Multiple Hotkeys

Register as many hotkeys as you need with the `@hotkey` decorator:

```ts
@customElement('my-editor')
class MyEditor extends LitElement {
  @hotkey('Mod+S')
  save() { saveDocument() }

  @hotkey('Mod+Z')
  undo() { undoAction() }

  @hotkey('Mod+Shift+Z')
  redo() { redoAction() }

  @hotkey('Mod+F')
  search() { openSearch() }

  @hotkey('Escape')
  dismiss() { closeDialog() }
}
```

### Scoped Hotkeys

Attach hotkeys to specific elements instead of the entire document using the `target` option:

```ts
import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js'
import { hotkey } from '@tanstack/lit-hotkeys'

@customElement('my-panel')
class MyPanel extends LitElement {
  private panelRef = createRef<HTMLDivElement>()

  @hotkey('Escape', { target: this.panelRef.value })
  closePanel() {
    this.dispatchEvent(new CustomEvent('close'))
  }

  render() {
    return html`
      <div ${ref(this.panelRef)} tabindex="0">
        <p>Press Escape while focused here to close</p>
      </div>
    `
  }
}
```

### Conditional Hotkeys

Enable or disable hotkeys based on application state via the `enabled` option:

```ts
import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { hotkey } from '@tanstack/lit-hotkeys'

@customElement('my-modal')
class MyModal extends LitElement {
  @hotkey('Escape', { enabled: true })
  close() {
    this.dispatchEvent(new CustomEvent('close'))
  }
}
```

### Multi-Key Sequences

Register Vim-style key sequences with the `@hotkeySequence` decorator or `HotkeySequenceController`:

```ts
import { LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { hotkeySequence } from '@tanstack/lit-hotkeys'

@customElement('vim-editor')
class VimEditor extends LitElement {
  @hotkeySequence(['G', 'G'])
  scrollToTop() {
    window.scrollTo({ top: 0 })
  }

  @hotkeySequence(['G', 'Shift+G'])
  scrollToBottom() {
    window.scrollTo({ top: document.body.scrollHeight })
  }
}
```

### Tracking Held Keys

Display modifier key state for power-user UIs using `KeyHoldController` and `HeldKeysController`:

```ts
import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { KeyHoldController, HeldKeysController } from '@tanstack/lit-hotkeys'

@customElement('status-bar')
class StatusBar extends LitElement {
  private shiftHold = new KeyHoldController(this, 'Shift')
  private heldKeys = new HeldKeysController(this)

  render() {
    return html`
      <div class="status-bar">
        ${this.shiftHold.value
          ? html`<span>Shift mode active</span>`
          : null}
        ${this.heldKeys.value.length > 0
          ? html`<span>Keys: ${this.heldKeys.value.join('+')}</span>`
          : null}
      </div>
    `
  }
}
```

### Recording Hotkeys

Build shortcut customization UIs with `HotkeyRecorderController`:

```ts
import { LitElement, html, nothing } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import {
  HotkeyRecorderController,
  formatForDisplay,
  type Hotkey,
} from '@tanstack/lit-hotkeys'

@customElement('shortcut-settings')
class ShortcutSettings extends LitElement {
  private recorder = new HotkeyRecorderController(this, {
    onRecord: (hotkey) => {
      this.shortcut = hotkey
    },
    onCancel: () => {
      console.log('Recording cancelled')
    },
  })

  @state() private shortcut: Hotkey | null = null

  render() {
    return html`
      <button @click=${() => this.recorder.startRecording()}>
        ${this.recorder.isRecording ? 'Recording...' : 'Edit Shortcut'}
      </button>
      ${this.shortcut
        ? html`<kbd>${formatForDisplay(this.shortcut)}</kbd>`
        : nothing}
    `
  }
}
```

### Displaying Hotkeys in the UI

Format hotkeys for platform-aware display:

```ts
import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { hotkey, formatForDisplay } from '@tanstack/lit-hotkeys'

@customElement('save-button')
class SaveButton extends LitElement {
  @hotkey('Mod+S')
  save() { saveDocument() }

  render() {
    return html`
      <button>
        Save <kbd>${formatForDisplay('Mod+S')}</kbd>
        <!-- Mac: "⌘S"  |  Windows: "Ctrl+S" -->
      </button>
    `
  }
}
```

## Decorators vs Controllers

The Lit adapter provides two complementary approaches:

| | Decorators (`@hotkey`, `@hotkeySequence`) | Controllers (`HotkeyController`, etc.) |
|---|---|---|
| **Best for** | Declarative method binding | Reactive state, dynamic hotkeys |
| **Registration** | Automatic on connect/disconnect | Automatic via `hostConnected`/`hostDisconnected` |
| **State access** | No (fire-and-forget callbacks) | Yes (`isRecording`, `value`, etc.) |
| **Dynamic hotkeys** | No (static at decoration time) | Yes (can re-register programmatically) |

Use **decorators** when you simply want a method to fire on a key combo. Use **controllers** when you need reactive state (held keys, recording) or dynamic hotkey registration.

## Next Steps

- [Hotkeys Guide](./guides/hotkeys) - Deep dive into `@hotkey` decorator and `HotkeyController` options
- [Sequences Guide](./guides/sequences) - Multi-key sequence handling
- [Hotkey Recording Guide](./guides/hotkey-recording) - Building shortcut customization UIs
- [Key State Tracking Guide](./guides/key-state-tracking) - Real-time key state monitoring
- [Formatting & Display Guide](./guides/formatting-display) - Platform-aware hotkey formatting
