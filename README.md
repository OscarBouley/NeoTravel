# NeoTravel

Automatisation des processus commerciaux — prototype de gestion de leads.

## Prérequis

- Node.js 18+ (LTS recommandé)
- npm
- Un projet Supabase avec une base Postgres accessible

## Installation

```bash
git clone https://github.com/NewDevNelfar/NeoTravel.git && cd NeoTravel
npm install
```

## Variables d'environnement

Copie le fichier d'exemple et remplis les valeurs :

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | URL de connexion Postgres via le **transaction pooler** Supabase (port `6543`). Format : `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de ton projet Supabase (ex: `https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clé `anon` / publishable de Supabase |

> Les clés Supabase se trouvent dans **Project Settings → API** sur le dashboard Supabase.

## Migrations (Drizzle)

Génère les fichiers de migration à partir du schéma :

```bash
npm run db:generate
```

Applique les migrations sur la base :

```bash
npm run db:migrate
```

## Lancement

```bash
npm run dev
```

Le serveur démarre sur [http://localhost:3000](http://localhost:3000).

## Vérifier la connexion à la base

Une fois le serveur lancé, appelle le health-check :

```bash
curl http://localhost:3000/api/health
```

Réponse attendue si tout va bien :

```json
{ "status": "ok" }
```

## Structure du projet

```
src/
├── app/                  # Routes Next.js (App Router)
│   └── api/
│       └── health/       # Route de health-check
├── lib/
│   ├── db/               # Accès données : client Drizzle + schéma
│   └── business/         # Logique métier (futur calculer_devis(), etc.)
```

## Scripts npm

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run lint` | Lint ESLint |
| `npm run db:generate` | Génère les migrations Drizzle |
| `npm run db:migrate` | Applique les migrations |
| `npm run db:studio` | Interface web Drizzle Studio |
