# NeoTravel

Prototype d'automatisation du cycle commercial de NeoTravel — PME de transport de personnes en groupe (bus, autocar, minibus avec chauffeur). De la captation du lead jusqu'au pilotage du pipeline commercial.

**Principe directeur** : digitaliser sans déshumaniser — automatiser le répétitif, garder l'humain sur les cas complexes.

---

## Fonctionnalités

### Pour le prospect (page d'accueil)
- **Chatbot IA** : assistant conversationnel qui collecte progressivement les infos du trajet puis les coordonnées, qualifie la demande, et génère automatiquement un devis
- **Formulaire classique** : alternative au chat pour les prospects qui préfèrent un formulaire structuré
- **Email avec devis PDF** : le prospect reçoit son devis en pièce jointe avec boutons Accepter / Décliner

### Pour le commercial (dashboard)
- **Pipeline Kanban** responsive avec 7 colonnes : Erreur distance, Qualifié, Devis envoyé, Relance, Gagné, Perdu, À traiter
- **10 KPIs** : leads aujourd'hui, leads 30j, taux de conversion, CA accepté, qualif. automatique, en attente HITL, répartition (pie chart)
- **Simulateur de devis** : visualisation du détail de calcul, modification des coefficients (saisonnalité, délai, capacité, marge), remise personnalisée en % ou €
- **Multi-devis** : possibilité de créer plusieurs versions de devis par demande (v1, v2, v3...)
- **Création de devis comparative** : vue à deux colonnes (formulaire à gauche, données existantes de la demande à droite) avec auto-complétion des coefficients
- **Édition client & voyage** : modification des informations client et voyage depuis la preview du devis
- **Relances automatiques** : 2 emails de relance max — J+3/J+7 (normal) ou J+1/J+2 (urgent si prestation ≤7 jours), pas de relance si date dépassée
- **Déclenchement manuel des relances** : endpoint POST pour déclencher les relances pendant une démo
- **Validation humaine** : le commercial review et envoie le devis — pas d'envoi automatique
- **Escalade HITL** : >85 passagers ou cas complexe (circuit multi-étapes, PMR, international...) → renvoi au commercial
- **Alerte** : bandeau d'alerte pour les demandes "À traiter" ET "Erreur distance"
- **Logging** : traçabilité complète (IA + commerciaux) dans `LOGS/` par jour

### Pipeline de statuts
`Nouvelle demande` → `Devis généré` → `Devis envoyé` → `Devis accepté` / `Devis refusé`

Statuts spéciaux : `Renvoyé au commercial`, `Erreur distance`

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, TypeScript) |
| Base de données | [Supabase](https://supabase.com/) (Postgres managé) |
| ORM | [Drizzle](https://orm.drizzle.team/) |
| IA | [Vercel AI SDK](https://ai-sdk.dev/) + [AI Gateway](https://vercel.com/docs/ai-gateway) (Claude Sonnet 4) |
| PDF | [@react-pdf/renderer](https://react-pdf.org/) |
| Email | [Nodemailer](https://nodemailer.com/) (SMTP Gmail) |
| Distance | [OSRM](https://project-osrm.org/) + [Nominatim](https://nominatim.org/) (gratuit, sans clé) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Hébergement | [Vercel](https://vercel.com/) (serverless) |

---

## Installation

### Prérequis
- Node.js 18+ (LTS recommandé)
- npm
- Un projet Supabase avec une base Postgres

### Setup

```bash
git clone https://github.com/NewDevNelfar/NeoTravel.git && cd NeoTravel
npm install
cp .env.example .env.local
```

### Variables d'environnement

Remplir `.env.local` avec les valeurs suivantes :

| Variable | Description | Où la trouver |
|---|---|---|
| `DATABASE_URL` | URL Postgres via le transaction pooler Supabase (port `6543`) | Supabase → Project Settings → Database |
| `AI_GATEWAY_API_KEY` | Clé Vercel AI Gateway | [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) |
| `GMAIL_USER` | Adresse Gmail pour l'envoi des emails | — |
| `GMAIL_APP_PASSWORD` | Mot de passe d'application Gmail | [Google Account → Security → App Passwords](https://myaccount.google.com/apppasswords) |
| `CRON_SECRET` | Secret pour protéger l'endpoint cron | Valeur libre |
| `NEXT_PUBLIC_BASE_URL` | URL publique du site (pour les liens dans les emails) | `http://localhost:3000` en dev |

### Migrations

```bash
npm run db:generate
npm run db:migrate
```

> `db:migrate` charge automatiquement `.env.local` — pas besoin de passer la variable manuellement.

### Lancement

```bash
npm run dev
```

- Page d'accueil : [http://localhost:3000](http://localhost:3000)
- Dashboard : [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- Health-check : [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## Architecture

```
src/
├── app/                                    # Routes Next.js (App Router)
│   ├── page.tsx                            # Page d'accueil (chat IA + formulaire)
│   ├── layout.tsx                          # Layout global, metadata
│   ├── globals.css                         # Palette de couleurs (bleu nuit / lime)
│   ├── dashboard/
│   │   ├── page.tsx                        # Dashboard commercial (KPIs + Kanban)
│   │   └── leads/[id]/page.tsx             # Page détail d'un lead
│   ├── devis/[id]/
│   │   ├── accepter/page.tsx               # Page publique d'acceptation du devis
│   │   └── decliner/page.tsx               # Page publique de déclin du devis
│   └── api/
│       ├── health/route.ts                 # Health-check (SELECT 1)
│       ├── chat/route.ts                   # Chat IA (streamText + tool creer_devis)
│       ├── leads/
│       │   ├── route.ts                    # GET liste leads | POST créer lead (formulaire)
│       │   └── [id]/
│       │       ├── route.ts                # PATCH modifier lead + prospect
│       │       ├── devis/route.ts          # POST créer devis + envoyer (auto)
│       │       ├── devis-custom/route.ts   # POST créer devis avec coefficients custom
│       │       ├── note/route.ts           # GET/PUT note commerciale du lead
│       │       └── status/route.ts         # PATCH changer le statut
│       ├── devis/[id]/
│       │   ├── route.ts                    # DELETE supprimer un devis (si non envoyé)
│       │   ├── pdf/route.ts                # GET générer et retourner le PDF
│       │   ├── envoyer/route.ts            # POST envoyer le devis par email
│       │   └── repondre/route.ts           # POST accepter/décliner (boutons email)
│       └── cron/
│           └── relances/route.ts           # GET (cron Vercel) + POST (déclenchement manuel)
│
├── components/
│   ├── chat-devis.tsx                      # Composant chat IA (useChat + streaming)
│   ├── chat-placeholder.tsx                # Chips de suggestion initiales
│   ├── devis-form.tsx                      # Formulaire de devis classique
│   ├── reponse-devis.tsx                   # Page de réponse prospect (accepter/décliner)
│   └── dashboard/
│       ├── pipeline-board.tsx              # Pipeline Kanban (7 colonnes, KPIs, responsive)
│       ├── leads-table.tsx                 # Tableau des leads avec actions, note éditable
│       ├── devis-preview.tsx               # Simulateur de devis (coefficients + édition client/voyage)
│       ├── devis-create.tsx                # Modale de création (vue comparative + auto-complétion)
│       └── lead-actions.tsx                # Boutons d'action sur un lead
│
└── lib/
    ├── db/
    │   ├── index.ts                        # Client Drizzle + connexion Postgres (Supabase pooler)
    │   └── schema.ts                       # Schéma DB : prospects, leads, devis, relances
    ├── business/
    │   ├── tarifs.ts                       # Grille tarifaire, coefficients, marge (configurable)
    │   ├── calculer-devis.ts              # calculerDevis() — 100% déterministe, supporte overrides
    │   └── relances.ts                    # Logique de calcul des relances dues (max 2)
    ├── email/
    │   ├── transporter.ts                 # Client SMTP Gmail (nodemailer)
    │   ├── envoyer-devis.ts               # Génère PDF + envoie email devis
    │   ├── envoyer-relance.ts             # Email de relance (2 templates)
    │   └── devis-pdf.tsx                  # Template PDF du devis (react-pdf)
    ├── geo/
    │   └── distance.ts                    # Calcul distance routière (Nominatim + OSRM)
    └── logger.ts                          # Logger fichier (LOGS/YYYY-MM-DD.log) + console

LOGS/                                      # Logs applicatifs par jour (dossier versionné, contenu ignoré)
```

### Fichiers racine

| Fichier | Rôle |
|---|---|
| `drizzle.config.ts` | Configuration Drizzle Kit (schéma, driver, URL) |
| `next.config.ts` | Config Next.js (`serverExternalPackages` pour postgres, react-pdf, nodemailer) |
| `vercel.json` | Configuration Vercel Cron (relances à 9h chaque jour) |
| `.env.example` | Template des variables d'environnement |

---

## Base de données

4 tables relationnelles :

```
prospects  1───∞  leads  1───∞  devis
                                  1───∞  relances
```

- **prospects** : coordonnées client (email unique), upsert à chaque nouvelle demande
- **leads** : demande de transport (trajet, dates, voyageurs, statut, note commerciale)
- **devis** : version chiffrée d'un lead (prix, coefficients, distance, référence, date d'envoi)
- **relances** : trace de chaque email de relance envoyé

---

## Règle d'or

> Le prix n'est **JAMAIS** calculé par un LLM. La fonction `calculerDevis()` est du code déterministe, documenté, testable et auditable. Le LLM orchestre et dialogue — le code calcule.

### Formule de prix

1. **Prix base** : grille forfaitaire jusqu'à 180 km, au-delà `(km × 2) × 2.5€/km`
2. **Multiplicateur** : ×2 si aller-retour
3. **Marge** : +15% (configurable)
4. **Saisonnalité** : -7% à +15% selon le mois de départ
5. **Délai demande** : -10% à +10% selon le nombre de jours avant le départ
6. **Capacité** : -5% à +40% selon le nombre de passagers (>85 → escalade HITL)
7. **Ajustement commercial** : remise libre en % ou € (via le simulateur)
8. **TVA** : +10%

Tous les coefficients sont dans [`src/lib/business/tarifs.ts`](src/lib/business/tarifs.ts) et modifiables.

---

## Prompt système de l'agent IA

L'agent IA (`src/app/api/chat/route.ts`) est configuré avec Claude Sonnet 4 (temperature 0.3) et un unique outil `creer_devis`. Son comportement :

1. **Collecte en 2 étapes strictes** : d'abord le trajet (type, villes, dates, heures, passagers), puis les coordonnées (nom, prénom, email, téléphone, société)
2. **Récapitulatif + confirmation** avant appel de l'outil
3. **Jamais de prix** pendant la collecte — le prix est calculé par `calculerDevis()` uniquement
4. **Cas complexes** : circuits multi-étapes, PMR, international, multi-jours → création partielle et renvoi au commercial
5. **Style** : texte simple (pas de markdown), concis, professionnel, chaleureux, émojis rares
6. **Après création** : communique le TTC et précise qu'un conseiller va relire et envoyer le devis par email

---

## Scripts npm

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run lint` | Lint ESLint |
| `npm run db:generate` | Génère les migrations Drizzle à partir du schéma |
| `npm run db:migrate` | Applique les migrations sur la base |
| `npm run db:studio` | Interface web Drizzle Studio |

---

## Relances automatiques

En dev, déclencher manuellement (GET) :

```bash
curl "http://localhost:3000/api/cron/relances?secret=VOTRE_CRON_SECRET"
```

Ou en POST (pour la démo) :

```bash
curl -X POST http://localhost:3000/api/cron/relances \
  -H "Content-Type: application/json" \
  -d '{"secret": "VOTRE_CRON_SECRET"}'
```

En prod, Vercel Cron exécute automatiquement chaque jour à 9h (configuré dans `vercel.json`).

### Calendrier de relance

| Type | Relance 1 | Relance 2 |
|---|---|---|
| Normal | J+3 | J+7 |
| Urgent (prestation ≤7j) | J+1 | J+2 |

Pas de relance si : devis accepté/refusé, date de prestation dépassée.

---

## Logging

Les logs applicatifs sont écrits dans `LOGS/YYYY-MM-DD.log` (en dev) et dans la console (Vercel logs en prod).

Chaque ligne suit le format : `[timestamp] [SOURCE] action — détail`

Sources :
- `IA` : actions de l'agent conversationnel (création lead, calcul prix, renvoi commercial)
- `COMMERCIAL` : actions du commercial (envoi devis, création custom, changement statut)
- `CRON` : exécution des relances automatiques
- `SYSTEM` : réponses prospect, erreurs
