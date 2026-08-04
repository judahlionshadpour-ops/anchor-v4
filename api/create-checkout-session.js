const Stripe = require('stripe');
const { PRODUCTS } = require('./lib/products');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const siteUrl = process.env.SITE_URL || `https://${req.headers.host}`;

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const cartItems = Array.isArray(body?.items) ? body.items : [];

  if (!cartItems.length) {
    res.status(400).json({ error: 'Cart is empty' });
    return;
  }

  const resolved = [];
  for (const line of cartItems) {
    const product = PRODUCTS[line.id];
    const qty = Math.max(1, Math.min(20, parseInt(line.qty, 10) || 1));
    if (!product) {
      res.status(400).json({ error: `Unknown product: ${line.id}` });
      return;
    }
    resolved.push({ id: line.id, product, qty });
  }

  const recurringLines = resolved.filter((l) => l.product.recurring);
  const oneTimeLines = resolved.filter((l) => !l.product.recurring);

  if (recurringLines.length && oneTimeLines.length) {
    res.status(400).json({ error: 'Subscription items cannot be combined with one-time items in the same checkout. Please check out separately.' });
    return;
  }

  const mode = recurringLines.length ? 'subscription' : 'payment';

  const line_items = resolved.map((l) => ({
    quantity: l.qty,
    price_data: {
      currency: 'usd',
      product_data: { name: l.product.name },
      unit_amount: l.product.unitAmount,
      ...(l.product.recurring ? { recurring: { interval: 'month' } } : {}),
    },
  }));

  const allowedCountries = (process.env.ALLOWED_SHIPPING_COUNTRIES || 'US')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

  try {
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items,
      payment_method_types: ['card'],
      shipping_address_collection: { allowed_countries: allowedCountries },
      ...(mode === 'payment' ? {
        customer_creation: 'always',
        shipping_options: [{
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: 'usd' },
            display_name: 'Free Shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 3 },
              maximum: { unit: 'business_day', value: 5 },
            },
          },
        }],
      } : {}),
      automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === 'true' },
      phone_number_collection: { enabled: true },
      success_url: `${siteUrl}/order-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/order-cancelled.html`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout session error:', err.message);
    res.status(500).json({ error: 'Unable to start checkout' });
  }
};
