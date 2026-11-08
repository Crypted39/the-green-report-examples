import { browser, expect, $ } from '@wdio/globals'

describe('cart', () => {
    it('adds a blue T-shirt in size M', async () => {
        await browser.url('/')

        // Written as intent. On the first run the model works out the steps and
        // they are recorded to __act__/cart.e2e.ts.json. Every run after that
        // replays the recorded WebdriverIO commands: no model, no tokens.
        await browser.act('Open the Blue T-Shirt, pick size M and add it to the cart', {
            id: 'add-blue-shirt',  // stable cache key, survives renaming the test
            timeout: 3 * 60 * 1000 // a local 8B model needs longer than the 60s default to record
        })

        // act() never asserts. The checks stay plain, deterministic WebdriverIO.
        await expect($('#cart-count')).toHaveText('Cart (1)')
        await expect($('#cart-items')).toHaveText('1 × Blue T-Shirt (size M)')
    })
})
