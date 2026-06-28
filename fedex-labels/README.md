# ShipDeal — FedEx Label Resale Platform

A Next.js 14 web app for selling FedEx International Priority shipping labels.

## Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Auth + DB**: Supabase
- **Payments**: Stripe Checkout
- **Deploy**: Vercel

## Setup

### 1. Clone & install
```bash
git clone <your-repo>
cd shipdeal
npm install
```

### 2. Create a Supabase project
1. Go to https://supabase.com and create a new project
2. In SQL Editor, run the contents of `SUPABASE_SCHEMA.sql`
3. Copy your project URL and anon key

### 3. Create a Stripe account
1. Go to https://stripe.com and create an account
2. Get your publishable key and secret key from the Dashboard
3. Create a webhook endpoint pointing to `https://your-app.vercel.app/api/webhook`
   - Events to listen to: `checkout.session.completed`, `checkout.session.expired`
4. Copy the webhook signing secret

### 4. Configure environment variables
Copy `.env.example` to `.env.local` and fill in all values:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_TOKEN=your-secret-admin-token
```

### 5. Run locally
```bash
npm run dev
```

### 6. Deploy to Vercel
```bash
npm install -g vercel
vercel
```
Add all environment variables in Vercel Dashboard → Settings → Environment Variables.
Set `NEXT_PUBLIC_APP_URL` to your production Vercel URL.

## Admin Workflow (Manual Label Generation)

After a customer pays, the order status becomes `paid`. You then:

1. **List paid orders** (waiting for label):
```bash
curl https://your-app.vercel.app/api/admin/orders?status=paid \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

2. **Generate the FedEx label** manually via your FedEx contract portal

3. **Upload the label PDF URL** to mark order as ready:
```bash
curl -X POST https://your-app.vercel.app/api/admin/upload-label \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId": "uuid-here", "labelUrl": "https://storage.example.com/label.pdf"}'
```

The customer can then download their label from the Dashboard.

## Pricing
| Weight | Price |
|--------|-------|
| Up to 250g | $2.40 |
| 251g – 1 kg | $3.00 |
| 1 kg – 3 kg | $3.60 |
| 3 kg – 7 kg | $4.20 |
| 7 kg – 30 kg | $5.00 |
