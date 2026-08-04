// Server-side price source of truth. Client-supplied prices are never trusted.
const PRODUCTS = {
  gi: { name: 'ANCHOR GI Relief', unitAmount: 6999, recurring: false },
  mg: { name: 'ANCHOR Muscle Guard', unitAmount: 6999, recurring: false },
  cp: { name: 'ANCHOR Complete', unitAmount: 6999, recurring: false },
  'bundle-once': { name: 'ANCHOR Full Bundle (one-time)', unitAmount: 14999, recurring: false },
  'bundle-sub': { name: 'ANCHOR Full Bundle (monthly)', unitAmount: 11999, recurring: true },
};

module.exports = { PRODUCTS };
