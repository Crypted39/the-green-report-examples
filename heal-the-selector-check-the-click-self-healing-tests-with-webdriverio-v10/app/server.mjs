// A tiny demo shop for the browser.act() blog post.
//
// SHOP_VARIANT switches the product page markup so we can show what happens
// to recorded act() steps when the UI changes:
//
//   original  - the UI the steps are recorded against (default)
//   refactor  - new ids, classes and wrappers; same labels  -> replays as is (role selectors)
//   relabel   - new labels, same ids                        -> heals from recorded fallbacks, no model
//   redesign  - new labels, ids and markup                  -> the model heals the step
//   broken    - the button is renamed and no longer calls the cart API
//               -> the model finds the new button, but the click has a different effect: act() fails

import http from 'node:http'

const PRODUCTS = {
    blue: { name: 'Blue T-Shirt', price: 19 },
    red: { name: 'Red T-Shirt', price: 19 },
    green: { name: 'Green Hoodie', price: 45 }
}

let cart = []

const page = (title, body) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title} · Demo Shop</title>
  <style>
    body { font: 16px system-ui, sans-serif; margin: 0; color: #1d1d1f; }
    header { display: flex; justify-content: space-between; padding: 12px 24px; background: #f2f2f5; }
    main { padding: 24px; max-width: 640px; }
    ul.products { list-style: none; padding: 0; display: grid; gap: 8px; }
    button { font: inherit; padding: 8px 16px; cursor: pointer; }
    aside { margin-top: 32px; padding: 16px; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <header>
    <a href="/">Demo Shop</a>
    <span id="cart-count">Cart (${cart.reduce((n, i) => n + i.qty, 0)})</span>
  </header>
  <main>${body}</main>
  <aside aria-label="Cart">
    <h2>Cart</h2>
    <ul id="cart-items">${cart.map((i) => `<li>${i.qty} × ${i.name} (size ${i.size})</li>`).join('') || '<li>Your cart is empty</li>'}</ul>
  </aside>
  <script>
    async function addToCart(product, size) {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ product, size })
      })
      const items = await res.json()
      document.querySelector('#cart-items').innerHTML = items
        .map((i) => '<li>' + i.qty + ' × ' + i.name + ' (size ' + i.size + ')</li>').join('')
      document.querySelector('#cart-count').textContent =
        'Cart (' + items.reduce((n, i) => n + i.qty, 0) + ')'
    }
  </script>
</body>
</html>`

const listPage = () => page('Shop', `
  <h1>Shop</h1>
  <ul class="products">
    ${Object.entries(PRODUCTS).map(([id, p]) => `<li><a href="/products/${id}">${p.name}</a> · $${p.price}</li>`).join('')}
  </ul>`)

function productPage(id, variant) {
    const p = PRODUCTS[id]
    const sizes = ['S', 'M', 'L'].map((s) => `<option>${s}</option>`).join('')

    if (variant === 'refactor') {
        return page(p.name, `
  <div class="pdp__hero"><h1 class="pdp__title">${p.name}</h1><p class="pdp__price">$${p.price}</p></div>
  <div class="pdp__form">
    <div class="field"><label for="variant-size-01">Size</label>
      <select id="variant-size-01" class="field__select">${sizes}</select></div>
    <div class="actions"><button type="button" class="Button_root__x7f2" data-testid="pdp-atc"
      onclick="addToCart('${id}', document.querySelector('#variant-size-01').value)">Add to cart</button></div>
  </div>`)
    }

    if (variant === 'broken') {
        // Only the button changed, and it no longer calls the cart API.
        return page(p.name, `
  <h1>${p.name}</h1>
  <p>$${p.price}</p>
  <label for="size">Size</label>
  <select id="size">${sizes}</select>
  <button type="button" class="cta__primary" onclick="this.textContent = 'Added!'">Add to bag</button>`)
    }

    if (variant === 'redesign') {
        const onclick = `addToCart('${id}', document.querySelector('#pdp-size').value)`
        return page(p.name, `
  <section class="pdp">
    <h1>${p.name}</h1>
    <p>$${p.price}</p>
    <form onsubmit="event.preventDefault()">
      <fieldset><legend>Options</legend>
        <label for="pdp-size">Choose a size</label>
        <select id="pdp-size">${sizes}</select>
      </fieldset>
      <div class="cta"><button type="button" class="cta__primary" onclick="${onclick}">Add to bag</button></div>
    </form>
  </section>`)
    }

    const relabel = variant === 'relabel'
    return page(p.name, `
  <h1>${p.name}</h1>
  <p>$${p.price}</p>
  <label for="size">${relabel ? 'Choose a size' : 'Size'}</label>
  <select id="size">${sizes}</select>
  <button id="add-to-cart" type="button"
    onclick="addToCart('${id}', document.querySelector('#size').value)">${relabel ? 'Add to bag' : 'Add to cart'}</button>`)
}

export function startShop({ port = 3000, variant = process.env.SHOP_VARIANT || 'original' } = {}) {
    const server = http.createServer(async (req, res) => {
        const url = new URL(req.url, `http://${req.headers.host}`)
        const html = (body) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end(body) }

        if (req.method === 'GET' && url.pathname === '/') {
            cart = [] // every test starts from the home page with an empty cart
            return html(listPage())
        }

        const match = url.pathname.match(/^\/products\/(\w+)$/)
        if (req.method === 'GET' && match && PRODUCTS[match[1]]) {
            return html(productPage(match[1], variant))
        }

        if (req.method === 'POST' && url.pathname === '/api/cart') {
            let raw = ''
            for await (const chunk of req) raw += chunk
            const { product, size } = JSON.parse(raw)
            const name = PRODUCTS[product].name
            const line = cart.find((i) => i.name === name && i.size === size)
            line ? line.qty++ : cart.push({ name, size, qty: 1 })
            res.writeHead(201, { 'content-type': 'application/json' })
            return res.end(JSON.stringify(cart))
        }

        res.writeHead(404).end('Not found')
    })

    return new Promise((resolve) => server.listen(port, () => {
        console.log(`Demo shop (${variant}) on http://localhost:${port}`)
        resolve(server)
    }))
}

// `node app/server.mjs` runs the shop on its own so you can click around.
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
    startShop()
}
