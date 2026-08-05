const PRICE_IDS = {
  'gi': 'price_1U18IDP9xRSWM27taeHn4v63',
  'mg': 'price_1U18IEP9xRSWM27tgTqpMLOj',
  'cp': 'price_1U18IEP9xRSWM27tTYeOa58Q',
  'bundle-once': 'price_1U18IFP9xRSWM27tk2x3ce3s',
  'bundle-sub': 'price_1U18IFP9xRSWM27tecgQefoO',
};

const ALLOWED_ORIGINS = [
  'https://youranchor.co',
  'http://localhost:8429',
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers });
    }

    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) {
      return new Response(JSON.stringify({ error: 'No items' }), { status: 400, headers });
    }

    const recurring = items.filter((i) => i.id === 'bundle-sub');
    const oneTime = items.filter((i) => i.id !== 'bundle-sub');
    if (recurring.length && oneTime.length) {
      return new Response(JSON.stringify({ error: "The monthly bundle subscription can't be checked out with one-time items. Check out the subscription separately." }), { status: 400, headers });
    }

    const mode = recurring.length ? 'subscription' : 'payment';
    const base = body.baseUrl;
    if (!base || !ALLOWED_ORIGINS.some((o) => base.startsWith(o))) {
      return new Response(JSON.stringify({ error: 'Invalid baseUrl' }), { status: 400, headers });
    }

    const params = new URLSearchParams();
    params.set('mode', mode);
    params.set('success_url', base + 'index.html?checkout=success');
    params.set('cancel_url', base + 'index.html?checkout=cancelled');
    if (env.STRIPE_AUTOMATIC_TAX === 'true') {
      params.set('automatic_tax[enabled]', 'true');
    }

    let idx = 0;
    for (const i of items) {
      const priceId = PRICE_IDS[i.id];
      const qty = parseInt(i.qty, 10);
      if (!priceId || !Number.isInteger(qty) || qty < 1 || qty > 50) {
        return new Response(JSON.stringify({ error: `Invalid item: ${i.id}` }), { status: 400, headers });
      }
      params.set(`line_items[${idx}][price]`, priceId);
      params.set(`line_items[${idx}][quantity]`, String(qty));
      idx++;
    }

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();
    if (!stripeRes.ok) {
      return new Response(JSON.stringify({ error: session.error?.message || 'Stripe error' }), { status: 502, headers });
    }

    return new Response(JSON.stringify({ url: session.url }), { headers: { ...headers, 'Content-Type': 'application/json' } });
  },
};
