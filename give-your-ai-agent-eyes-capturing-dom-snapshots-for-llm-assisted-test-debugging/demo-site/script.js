// Add ?bug=1 to the URL to simulate a UI regression: the submit button's
// accessible name silently changes from "Submit Order" to "Place Order".
// This is what the failure-capture pattern is meant to catch and explain.
const params = new URLSearchParams(window.location.search);
const bugMode = params.get('bug') === '1';

if (bugMode) {
  document.getElementById('submit-btn').textContent = 'Place Order';
}

document.getElementById('checkout-form').addEventListener('submit', (event) => {
  event.preventDefault();
  document.getElementById('confirmation').hidden = false;
});
