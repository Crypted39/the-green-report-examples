# WebdriverIO v10 `browser.act()` demo, with a local model

Companion code for the blog post. One test, one `act()` call, a tiny local shop,
and a local model through Ollama, so no API key is needed and nothing leaves your machine.

```ts
await browser.act('Open the Blue T-Shirt, pick size M and add it to the cart', { id: 'add-blue-shirt' })
await expect($('#cart-count')).toHaveText('Cart (1)')
```

## Setup

```bash
ollama pull qwen3:8b
npm install
```

Tested with Node.js 26.13.0, WebdriverIO 10.2.0, `@wdio/ai-service` 10.2.0, `qwen3:8b` on Ollama 0.40,
Chrome 157, on a 6 GB GTX 1660 Ti. WebdriverIO 10.2.0 needs Node.js `>=22.23.4 <23`, `>=24.22.1 <25`
or `>=26.12.1`.

## The scenarios

| Command | What changes in the shop | What happens | Model tokens |
|---|---|---|---|
| `npm test` (first run) | nothing | the model records 3 steps to `test/specs/__act__/cart.e2e.ts.json` (30-70 s, depending on whether the model is already loaded) | ~18k |
| `npm test` | nothing | steps are replayed as plain WebdriverIO (~2 s) | 0 |
| `npm run test:locked` | nothing | replay only, model calls are forbidden: the CI setting | 0 |
| `npm run test:refactor` | new ids, classes, wrappers | still passes as is: recorded selectors are role based | 0 |
| `npm run test:relabel` | "Size" → "Choose a size", "Add to cart" → "Add to bag" | healed from the recorded fallback selectors (`#size`, `#add-to-cart`) | 0 |
| `npm run test:redesign` | new labels, ids and markup | the model continues from the broken step, the healed click still sends `POST /api/cart` | ~21k |
| `npm run test:broken` | the button is renamed and **no longer calls the cart API** | `act()` fails: the click no longer causes `POST /api/cart → 2xx` | 0 |

The variant scripts run with `ACT_CACHE=heal`, so healed steps go to `.wdio/act-cache/`
instead of overwriting the committed cache file. Heal screenshots land in `.wdio/ai/heals/`.

Other commands:

- `npm run test:rerecord`: record every `act()` call again (`wdio run -s`)
- `npm run eject`: print the spec with `act()` replaced by the recorded WebdriverIO code
- `npm run shop`: run the shop on its own at http://localhost:3000 (`SHOP_VARIANT=relabel npm run shop` and so on)
- `HEADED=1 npm test`: watch the browser

## Notes from making this work with a local 8B model

- **Context size.** `model: 'ollama:qwen3:8b'` uses Ollama's default 4k context, which a page snapshot
  plus the tool definitions outgrow. `wdio.conf.ts` passes a `ChatOllama` instance instead
  (`numCtx: 16384`, `think: false`, `temperature: 0`). The service accepts any LangChain chat model.
- **Timeouts.** `act()` has a 60 s default timeout per call. A cold local model can take that long
  to load, so the spec passes `timeout: 180_000`. Replays take about 2 s.
- **Ref format.** qwen3:8b passed snapshot refs as `ref=e2` instead of `e2`, and WebdriverIO reads
  `ref=e2` as a `tag=text` selector. One line in `ai-instructions.md` (the service's `instructions`
  option) fixes it.
- **`extract()` was left out.** It calls the model on every run (it is never cached), the
  `@langchain/ollama` adapter rejects its response-body tool results ("Non string tool message
  content is not supported", avoidable with `responseBodies: false`), and qwen3:8b still could not
  produce a schema-valid answer within 15 steps. The assertions are plain `expect` instead.
- **`id` on the act() call.** In 10.2.0 the runtime keys cache entries by the test title alone,
  while `wdio-ai eject` expects `describe` + test title, so eject finds nothing. An explicit `id`
  is used by both sides, and it survives renaming the test.
- **What the effect check covers.** When the model heals, only the effect of the *first* cached
  step that failed is checked. If an earlier step without an effect (the size dropdown) breaks
  first, the model continues through the later steps and their effects are not compared.
  `test:broken` therefore changes only the button.
