import type { Server } from 'node:http'
import { ChatOllama } from '@langchain/ollama'
import { startShop } from './app/server.mjs'

let shop: Server

export const config: WebdriverIO.Config = {
    runner: 'local',
    specs: ['./test/specs/**/*.e2e.ts'],
    maxInstances: 1,
    baseUrl: 'http://localhost:3000',

    capabilities: [{
        browserName: 'chrome',
        // WebDriver BiDi: lets the AI service record what each step *did*
        // (requests, navigation, changed regions) so a healed step can be checked.
        webSocketUrl: true,
        'goog:chromeOptions': { args: process.env.HEADED ? [] : ['--headless=new'] }
    }],

    framework: 'mocha',
    // The first run asks a local model for every act() step, so give it time.
    mochaOpts: { ui: 'bdd', timeout: 5 * 60 * 1000 },
    reporters: ['spec'],
    logLevel: 'warn',

    services: [['ai', {
        // Local model through Ollama: no API key, nothing leaves your machine.
        // The shorthand `model: 'ollama:qwen3:8b'` works too, but it keeps Ollama's
        // default 4k context, which is too small once a page snapshot is in the prompt.
        // Any LangChain chat model is accepted, so we tune it here.
        model: new ChatOllama({
            model: process.env.OLLAMA_MODEL ?? 'qwen3:8b',
            baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
            numCtx: 16384,
            think: false,     // qwen3 "thinking" is slow and adds nothing for clicking buttons
            temperature: 0,
            keepAlive: '30m'  // keep the model loaded between act() calls
        }),
        // Project conventions appended to the system prompt. Small local models
        // need a nudge on how to pass element refs; hosted models don't.
        instructions: './ai-instructions.md',
        // auto   = record locally, heal without touching the cache file on CI (default)
        // heal   = like auto, but healed steps go to the output dir, not the cache file
        // locked = replay only, never call the model
        cache: (process.env.ACT_CACHE as 'auto' | 'heal' | 'locked' | undefined) ?? 'auto'
    }]],

    onPrepare: async () => {
        shop = await startShop({ port: 3000 })
    },
    onComplete: () => {
        shop?.close()
    }
}
