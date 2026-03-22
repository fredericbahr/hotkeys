---
id: SequenceRegistrationHandle
title: SequenceRegistrationHandle
---

# Interface: SequenceRegistrationHandle

Defined in: [sequence-manager.ts:111](https://github.com/TanStack/hotkeys/blob/main/packages/hotkeys/src/sequence-manager.ts#L111)

A handle returned from SequenceManager.register() that allows updating
the callback and options without re-registering the sequence.

## Example

```ts
const handle = manager.register(['G', 'G'], callback, options)

handle.callback = newCallback
handle.setOptions({ timeout: 500 })
handle.unregister()
```

## Properties

### callback

```ts
callback: HotkeyCallback;
```

Defined in: [sequence-manager.ts:114](https://github.com/TanStack/hotkeys/blob/main/packages/hotkeys/src/sequence-manager.ts#L114)

***

### id

```ts
readonly id: string;
```

Defined in: [sequence-manager.ts:112](https://github.com/TanStack/hotkeys/blob/main/packages/hotkeys/src/sequence-manager.ts#L112)

***

### isActive

```ts
readonly isActive: boolean;
```

Defined in: [sequence-manager.ts:113](https://github.com/TanStack/hotkeys/blob/main/packages/hotkeys/src/sequence-manager.ts#L113)

***

### setOptions()

```ts
setOptions: (options) => void;
```

Defined in: [sequence-manager.ts:115](https://github.com/TanStack/hotkeys/blob/main/packages/hotkeys/src/sequence-manager.ts#L115)

#### Parameters

##### options

`Partial`\<[`SequenceOptions`](SequenceOptions.md)\>

#### Returns

`void`

***

### unregister()

```ts
unregister: () => void;
```

Defined in: [sequence-manager.ts:116](https://github.com/TanStack/hotkeys/blob/main/packages/hotkeys/src/sequence-manager.ts#L116)

#### Returns

`void`
