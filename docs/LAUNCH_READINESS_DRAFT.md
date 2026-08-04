# ANCHOR Launch Readiness — DRAFT for review

Status: **NOT APPROVED. NOT LIVE.** Everything below is either invented as a plausible
starting point (marked MADE UP) or a set of instructions for something Claude cannot
do on your behalf (marked CANNOT DO — YOUR ACTION). Edit anything, delete anything,
tell me what to change.

Nothing in this doc has been wired into code yet except where noted.

---

## 1. Final product prices — CONFIRMED, already live in code
- GI Relief / Muscle Guard / Complete: $69.99 each, one-time, 30 sticks
- Full Bundle one-time: $149.99
- Full Bundle subscription: $119.99/month
No action needed.

---

## 2. Ingredient info — MADE UP, review against real formulation/COA

Site currently shows (already in index.html, per-formula):

| Formula | Ingredient | Amount |
|---|---|---|
| GI Relief | Soluble fiber | 5 g |
| GI Relief | Ginger root extract | 500 mg |
| GI Relief | Peppermint leaf | 200 mg |
| GI Relief | Electrolyte blend | 720 mg |
| Muscle Guard | Whey protein isolate | 15 g |
| Muscle Guard | Essential amino acids | All 9 |
| Muscle Guard | Creatine monohydrate | 3 g |
| Muscle Guard | Leucine | 2.5 g |
| Complete | Vitamins & minerals | 15+ |
| Complete | Sodium blend | 1000 mg |
| Complete | Vitamin B12 | 500 mcg |
| Complete | Vitamin D3 | 2000 IU |

**MADE UP full label draft** (not yet on site — would need a new ingredients/label
section or PDF per formula):

- Serving size: 1 stick (approx. 8g powder), 30 servings per box
- Other ingredients (all formulas): citric acid, natural flavor, silica, stevia leaf extract, beet root color (where applicable)
- Allergen statement: "Produced in a facility that also processes milk (whey), tree nuts, and soy."
- Manufacturing claim: "Made in a cGMP-certified facility. Third-party tested for purity and potency."
- Standard FDA disclaimer (already in footer): "These statements have not been evaluated by the FDA. This product is not intended to diagnose, treat, cure, or prevent any disease."

**CANNOT DO — YOUR ACTION:** Real amounts, sourcing, and the allergen statement must
come from your actual manufacturer's Certificate of Analysis / formulation sheet.
Do not ship label claims Claude invented — supplement labeling has real FDA/FTC
exposure. Send me the real COA and I'll match copy to it exactly.

---

## 3. Shipping regions — MADE UP starting point

Draft: **US only at launch** (all 50 states + DC, no PO boxes, no APO/FPO for now).
Matches current `ALLOWED_SHIPPING_COUNTRIES=US` in `.env`.

Expansion candidates later: Canada (add customs/duties messaging first).

**Your call:** confirm US-only is right, or name other countries — I'll update the
env var and Stripe `shipping_address_collection.allowed_countries` to match.

---

## 4. Shipping charges — MADE UP, and flags a real bug

Draft: **Free shipping on all US orders** — this matches what the site ALREADY
markets in the top marquee ("Free Shipping on All Orders").

**Bug found:** the live checkout code (`api/create-checkout-session.js`) collects a
shipping address but never adds a `shipping_options` line — so right now Checkout
would silently charge **$0 shipping with no line item shown**, which happens to
match "free shipping" by accident, not by design. I'd fix this properly by adding
an explicit `$0.00 Free Shipping` shipping rate so it's intentional and shows on
the receipt. Want me to make that fix now (safe, no live-mode implication)?

---

## 5. Refund policy — MADE UP draft

> **30-Day Money-Back Guarantee.** If ANCHOR isn't right for you, contact us within
> 30 days of your delivery date for a full refund on your first box — no return
> shipping required. Opened or unopened, no questions asked. Subsequent boxes on a
> subscription are refundable if defective or if the order arrives damaged; contact
> support within 14 days of delivery.

**Your call:** approve, edit terms (e.g. restock fee, return-shipping-required, time
window), or replace entirely. Once approved this needs its own page (not on the
locked homepage) and a footer link.

---

## 6. Subscription cancellation policy — MADE UP draft

> Cancel or skip anytime from your account — no fees, no phone calls required.
> Cancellation takes effect at the end of your current billing period; you keep
> access to (i.e. receive) any box already in transit. No partial-month refunds.

Mechanically: this is what `api/create-portal-session.js` already opens (Stripe
Customer Portal) — the portal's cancel flow already behaves this way by Stripe
default. Just needs the policy text confirmed and posted on-site.

---

## 7. Business entity details — CANNOT DO — YOUR ACTION

Stripe requires your real legal business info before it will approve **any** live
charge: legal entity name, entity type (LLC/S-Corp/sole prop/etc.), EIN or SSN,
registered business address, and an authorized representative's info.

Claude cannot invent this (it'd be fraud) and cannot register a business or get an
EIN for you. If you don't have an entity yet: form an LLC (state of your choice,
~$50-500 + state fees, same-day to 2 weeks depending on state), then get a free EIN
instantly at irs.gov/ein. Send me the details once you have them and I'll help wire
them into the Stripe onboarding flow (I still won't type them in for you if it's a
credential/payment-details field — that part you enter yourself in Stripe's portal).

---

## 8. Support email — MADE UP placeholder

Draft: `support@anchordaily.co`

**Your action:** this requires a real mailbox. Once your domain's DNS is set up,
set up email (e.g. Google Workspace, or your registrar's free forwarding) at that
address. Tell me when it's live and I'll wire it into checkout/footer/receipts.

---

## 9. Tax setup — CANNOT DO (registration) / MADE UP (config)

**MADE UP config placeholder:** `STRIPE_AUTOMATIC_TAX=false` currently — leave off
until you've registered.

**CANNOT DO — YOUR ACTION:** Sales tax registration (a "nexus" state — usually
wherever your business is legally located, minimum) is a real government filing,
not something Claude can do or fabricate a number for. Typical path: register for
a sales tax permit in your home state via that state's Department of Revenue site
(often free, instant-to-few-days), then enable Stripe Tax and flip
`STRIPE_AUTOMATIC_TAX=true`. Multi-state nexus (economic nexus from high sales
volume in other states) is a later problem — don't block launch on it.

---

## 10. Fulfillment process — MADE UP draft

> Orders placed by 2pm ET ship same business day (Mon-Fri), otherwise next business
> day. Fulfilled via [3PL name — e.g. ShipBob / your own warehouse]. Standard
> shipping: 3-5 business days via USPS/UPS. Subscription boxes ship automatically
> on the same day-of-month as the first order.

**Your call:** who's actually packing and shipping boxes — you personally, a 3PL,
or a co-packer? That answer changes the real timeline above. Also determines
whether the Stripe webhook (`api/webhook.js`) needs to notify a fulfillment
partner's API — right now it just logs to console, no real fulfillment trigger yet.

---

## 11. Stripe business verification — CANNOT DO — YOUR ACTION

Once you have the business entity (#7) formed, log into your Stripe Dashboard →
Settings → Business details, and complete the verification flow with your real
info. Stripe will ask for entity docs, banking info for payouts, and possibly ID
verification for the account owner. This must be done by you in Stripe's own UI —
Claude has no path to do this even with API access, by Stripe's design.

---

## Bottom line to un-block live mode

**Hard Stripe blockers (#7, #9, #11):** all require you personally, in Stripe's
dashboard / government filings. No code work unblocks these.

**Everything else (#2-6, #8, #10):** review my drafts above, edit, and tell me what's
approved — I'll turn approved copy into actual site pages/config. None of it requires
live mode to build or test.
