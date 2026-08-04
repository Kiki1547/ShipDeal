# ShipDeal — FedEx Label Resale Platform

## Setup complet depuis zéro

### 1. Installer les dépendances
```bash
cd fedex-labels
npm install
```

### 2. Variables d'environnement
Crée un fichier `.env.local` à la racine de `fedex-labels/` avec :
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=https://ton-domaine.vercel.app
ADMIN_TOKEN=un-token-secret
```

### 3. Base de données Supabase
Dans Supabase → SQL Editor, exécute dans l'ordre :
1. `SUPABASE_SCHEMA.sql` (table orders de base)
2. `SUPABASE_ROLES_MIGRATION.sql` (rôles + profils)
3. Le SQL ci-dessous pour les colonnes manquantes et le bulk :

```sql
alter table public.profiles
  add column if not exists full_name text,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists zip text,
  add column if not exists country text;

alter table public.orders
  add column if not exists is_bulk boolean default false,
  add column if not exists bulk_recipients jsonb;

alter table public.orders 
  drop constraint if exists orders_weight_kg_check;
alter table public.orders
  add constraint orders_weight_kg_check 
  check (weight_kg >= 0 and weight_kg <= 30);
```

### 4. Supabase Storage
Storage → New bucket → nom `labels` → coche **Public**.

Puis SQL Editor :
```sql
create policy "Authenticated users can upload labels"
  on storage.objects for insert
  with check (bucket_id = 'labels' AND auth.role() = 'authenticated');

create policy "Public can read labels"
  on storage.objects for select
  using (bucket_id = 'labels');
```

### 5. Passer ton compte en admin
```sql
update public.profiles set role = 'admin' where email = 'ton@email.com';
```

### 6. Stripe Webhook
Stripe Dashboard → Developers → Webhooks → Add endpoint :
- URL : `https://ton-domaine.vercel.app/api/webhook`
- Events : `checkout.session.completed`, `checkout.session.expired`

### 7. Déployer sur Vercel
- Connecte le repo GitHub à un projet Vercel
- Root Directory : `fedex-labels`
- Ajoute toutes les variables d'environnement ci-dessus
- Deploy

## Fonctionnalités
- Achat de label unique avec slider de poids
- Bulk order (CSV/Excel) — une seule commande groupée avec tous les destinataires
- 3 rôles : customer / reseller / admin
- `/admin` — gestion commandes + utilisateurs
- `/reseller` — upload PDF label, download Excel des destinataires bulk
- `/dashboard` — historique client + téléchargement labels
- Facturation Stripe automatique (invoice_creation activé)

## Pricing
| Weight | Price |
|--------|-------|
| Up to 250g | $2.40 |
| 251g – 1 kg | $3.00 |
| 1 kg – 3 kg | $3.60 |
| 3 kg – 7 kg | $4.20 |
| 7 kg – 30 kg | $5.00 |
