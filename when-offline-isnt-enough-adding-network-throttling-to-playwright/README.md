# Network Throttling for Playwright — Source Code Changes

This file documents the source code changes that add a network throttling API
(`BrowserContext.setNetworkConditions()` and a matching `networkConditions` init
option on `browser.newContext()` / `launchPersistentContext()`) to Playwright.

All paths are relative to the Playwright repo root. Generated files
(`packages/protocol/src/channels.d.ts` and
`packages/playwright-core/types/types.d.ts`) are **not** listed here because they
are produced automatically from the YAML and Markdown sources below. After
applying the YAML and Markdown changes, regenerate them with:

```bash
node utils/generate_channels.js
node utils/generate_types/
```

---

## 1. Protocol — `packages/protocol/spec/mixins.yml`

Add the `networkConditions` option to the shared context-init properties block,
immediately after the existing `offline: boolean?` line:

```yaml
offline: boolean?
networkConditions:
  type: object?
  properties:
    latency: float?
    downloadThroughput: float?
    uploadThroughput: float?
```

## 2. Protocol — `packages/protocol/spec/browserContext.yml`

Add the `setNetworkConditions` channel method right after the existing
`setOffline` method:

```yaml
setOffline:
  title: Set offline mode
  parameters:
    offline: boolean

setNetworkConditions:
  title: Set network conditions
  parameters:
    networkConditions:
      type: object?
      properties:
        latency: float?
        downloadThroughput: float?
        uploadThroughput: float?
```

## 3. Docs — `docs/src/api/class-browsercontext.md`

Add the new method documentation block after the existing
`BrowserContext.setOffline` block:

```markdown
## async method: BrowserContext.setNetworkConditions
* since: v1.61

Emulates network conditions for the browser context. Pass `null` to clear emulation and restore unlimited bandwidth.

**NOTE** Network throttling is currently only supported in Chromium.

**Usage**

```js
// Throttle to roughly Slow 3G.
await context.setNetworkConditions({
  latency: 2000,
  downloadThroughput: 50 * 1024,
  uploadThroughput: 50 * 1024,
});

// Restore unlimited bandwidth.
await context.setNetworkConditions(null);
```

### param: BrowserContext.setNetworkConditions.networkConditions
* since: v1.61
- `networkConditions` <[null]|[Object]>
  - `latency` ?<[float]> Minimum latency added to every request, in milliseconds. Defaults to `0`.
  - `downloadThroughput` ?<[float]> Maximum download throughput in bytes/second. Use `-1` to disable download throttling. Defaults to `-1`.
  - `uploadThroughput` ?<[float]> Maximum upload throughput in bytes/second. Use `-1` to disable upload throttling. Defaults to `-1`.
```

## 4. Docs — `docs/src/api/params.md`

Add a reusable option template after `context-option-offline`:

```markdown
## context-option-networkconditions
- `networkConditions` <[Object]>
  - `latency` ?<[float]> Minimum latency added to every request, in milliseconds. Defaults to `0`.
  - `downloadThroughput` ?<[float]> Maximum download throughput in bytes/second. Use `-1` to disable download throttling. Defaults to `-1`.
  - `uploadThroughput` ?<[float]> Maximum upload throughput in bytes/second. Use `-1` to disable upload throttling. Defaults to `-1`.

Emulates slow network conditions. Currently only supported in Chromium.
```

Register it in the shared options list (`shared-context-params-list-v1.8`) by
adding a line right after `context-option-offline-%%`:

```markdown
- %%-context-option-offline-%%
- %%-context-option-networkconditions-%%
- %%-context-option-httpcredentials-%%
```

## 5. Server types — `packages/playwright-core/src/server/types.ts`

Add the shared `NetworkConditions` type, next to the existing `Geolocation`
type:

```typescript
export type NetworkConditions = {
  latency?: number;
  downloadThroughput?: number;
  uploadThroughput?: number;
};
```

## 6. Server core — `packages/playwright-core/src/server/browserContext.ts`

Add the abstract method declaration next to the existing
`doUpdateOffline`:

```typescript
protected abstract doUpdateOffline(): Promise<void>;
protected abstract doUpdateNetworkConditions(): Promise<void>;
```

Add the runtime setter immediately after the existing `setOffline` method,
mirroring the rollback-on-error pattern:

```typescript
async setNetworkConditions(progress: Progress, networkConditions: types.NetworkConditions | undefined) {
  const oldNetworkConditions = this._options.networkConditions;
  this._options.networkConditions = networkConditions;
  try {
    await progress.race(this.doUpdateNetworkConditions());
  } catch (error) {
    this._options.networkConditions = oldNetworkConditions;
    // Note: no await, conditions will be reset in the background as soon as possible.
    this.doUpdateNetworkConditions().catch(() => {});
    throw error;
  }
}
```

## 7. Dispatcher — `packages/playwright-core/src/server/dispatchers/browserContextDispatcher.ts`

Add a handler that forwards the channel call into the server, right after the
existing `setOffline` dispatcher:

```typescript
async setNetworkConditions(params: channels.BrowserContextSetNetworkConditionsParams, progress: Progress): Promise<void> {
  await this._context.setNetworkConditions(progress, params.networkConditions);
}
```

## 8. Client — `packages/playwright-core/src/client/browserContext.ts`

Add the user-facing wrapper, right after the existing `setOffline` method:

```typescript
async setNetworkConditions(networkConditions: { latency?: number, downloadThroughput?: number, uploadThroughput?: number } | null): Promise<void> {
  await this._channel.setNetworkConditions({ networkConditions: networkConditions || undefined });
}
```

## 9. Chromium — `packages/playwright-core/src/server/chromium/crNetworkManager.ts`

Add a private field next to the existing `_offline` field:

```typescript
private _offline = false;
private _networkConditions: types.NetworkConditions = {};
```

Update the `addSession` initialization call site so it uses the renamed helper:

```typescript
this._emulateNetworkConditionsForSession(sessionInfo, true /* initial */),
```

Replace the existing `setOffline` / `_setOfflineForSession` block with the
following. The helper is renamed because it now sends both `offline` and
throttling values in the same CDP call, and the initial-skip guard is widened
so fresh sessions only skip when neither feature is in use:

```typescript
async setOffline(offline: boolean) {
  if (offline === this._offline)
    return;
  this._offline = offline;
  await this._forEachSession(info => this._emulateNetworkConditionsForSession(info));
}

async setNetworkConditions(networkConditions: types.NetworkConditions | undefined) {
  this._networkConditions = networkConditions ?? {};
  await this._forEachSession(info => this._emulateNetworkConditionsForSession(info));
}

private _hasNetworkThrottling(): boolean {
  const c = this._networkConditions;
  return (c.latency !== undefined && c.latency > 0)
      || (c.downloadThroughput !== undefined && c.downloadThroughput >= 0)
      || (c.uploadThroughput !== undefined && c.uploadThroughput >= 0);
}

private async _emulateNetworkConditionsForSession(info: SessionInfo, initial?: boolean) {
  if (initial && !this._offline && !this._hasNetworkThrottling())
    return;
  // Workers are affected by the owner frame's Network.emulateNetworkConditions.
  if (info.workerFrame)
    return;
  await info.session.send('Network.emulateNetworkConditions', {
    offline: this._offline,
    // values of 0 remove any active throttling. crbug.com/456324#c9
    latency: this._networkConditions.latency ?? 0,
    downloadThroughput: this._networkConditions.downloadThroughput ?? -1,
    uploadThroughput: this._networkConditions.uploadThroughput ?? -1,
  });
}
```

## 10. Chromium — `packages/playwright-core/src/server/chromium/crPage.ts`

In the `CRPage` constructor, after `this.updateOffline();`, sync the new option:

```typescript
this.updateOffline();
this.updateNetworkConditions();
```

Add the per-page update method right after `updateOffline()`:

```typescript
async updateNetworkConditions(): Promise<void> {
  await this._networkManager.setNetworkConditions(this._browserContext._options.networkConditions);
}
```

## 11. Chromium — `packages/playwright-core/src/server/chromium/crServiceWorker.ts`

After the existing `this.updateOffline();` initialization call, add:

```typescript
this.updateOffline();
this.updateNetworkConditions();
```

Add the corresponding update method right after `updateOffline()`:

```typescript
async updateNetworkConditions(): Promise<void> {
  if (!this._isNetworkInspectionEnabled())
    return;
  await this._networkManager?.setNetworkConditions(this.browserContext._options.networkConditions).catch(() => {});
}
```

## 12. Chromium — `packages/playwright-core/src/server/chromium/crBrowser.ts`

Add the context-level fan-out right after the existing `doUpdateOffline`:

```typescript
async doUpdateNetworkConditions(): Promise<void> {
  for (const page of this.pages())
    await (page.delegate as CRPage).updateNetworkConditions();
  for (const sw of this.serviceWorkers())
    await (sw as CRServiceWorker).updateNetworkConditions();
}
```

## 13. Firefox — `packages/playwright-core/src/server/firefox/ffBrowser.ts`

In the context initialization block, apply the option at creation time if it
was passed via `newContext`:

```typescript
if (this._options.offline)
  promises.push(this.doUpdateOffline());
if (this._options.networkConditions)
  promises.push(this.doUpdateNetworkConditions());
```

Add the abstract method implementation right after `doUpdateOffline`. It throws
when any throttling value is actively set, but accepts `null` or an empty
object as a no-op so cross-browser setups don't blow up:

```typescript
async doUpdateNetworkConditions(): Promise<void> {
  const c = this._options.networkConditions;
  if (c && ((c.latency ?? 0) > 0 || (c.downloadThroughput ?? -1) >= 0 || (c.uploadThroughput ?? -1) >= 0))
    throw new Error('Network throttling is not yet supported in Firefox.');
}
```

## 14. WebKit — `packages/playwright-core/src/server/webkit/wkBrowser.ts`

Same shape as the Firefox change. In the context initialization block:

```typescript
if (this._options.offline)
  promises.push(this.doUpdateOffline());
if (this._options.networkConditions)
  promises.push(this.doUpdateNetworkConditions());
```

Add the implementation right after `doUpdateOffline`:

```typescript
async doUpdateNetworkConditions(): Promise<void> {
  const c = this._options.networkConditions;
  if (c && ((c.latency ?? 0) > 0 || (c.downloadThroughput ?? -1) >= 0 || (c.uploadThroughput ?? -1) >= 0))
    throw new Error('Network throttling is not yet supported in WebKit.');
}
```

## 15. BiDi — `packages/playwright-core/src/server/bidi/bidiBrowser.ts`

Add the implementation right after `doUpdateOffline`:

```typescript
async doUpdateNetworkConditions(): Promise<void> {
  const c = this._options.networkConditions;
  if (c && ((c.latency ?? 0) > 0 || (c.downloadThroughput ?? -1) >= 0 || (c.uploadThroughput ?? -1) >= 0))
    throw new Error('Network throttling is not yet supported in BiDi mode.');
}
```

## 16. WebView — `packages/playwright-core/src/server/webkit/webview/wvBrowser.ts`

Add the abstract method stub next to the existing `doUpdateOffline` stub:

```typescript
protected override async doUpdateNetworkConditions(): Promise<void> { throw new Error('Method not implemented.'); }
```

---

## Verification

After applying the changes and regenerating the protocol / types files, the
full lint pipeline should pass:

```bash
npm run flint
```

Build the project once so the test runner picks up the compiled code:

```bash
node utils/build/build.js
```
