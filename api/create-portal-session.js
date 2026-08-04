const Stripe = require('stripe');

// Looks up a Stripe customer by email and opens the Customer Portal.
// No login system exists yet, so email is the only identifier we have.
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
  const email = (body?.email || '').trim();

  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  try {
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (!customers.data.length) {
      res.status(404).json({ error: 'No subscription found for that email' });
      return;
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${siteUrl}/index.html`,
    });

    res.status(200).json({ url: portalSession.url });
  } catch (err) {
    console.error('Stripe portal session error:', err.message);
    res.status(500).json({ error: 'Unable to open subscription portal' });
  }
};
