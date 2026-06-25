# 📋 Audit Front-End NeoTravel

## 📊 Vue d'ensemble générale

**Framework**: Next.js 16.2.9  
**Language**: TypeScript 5  
**Styling**: Tailwind CSS 4 + PostCSS  
**Langue**: Français  
**Architecture**: App Router (Next.js 13+)

---

## 📁 Structure du Projet

```
src/
├── app/                           # App Router pages et layouts
│   ├── api/                       # API routes (backend)
│   │   ├── chat/
│   │   ├── devis/
│   │   ├── leads/
│   │   ├── health/
│   │   └── cron/
│   ├── dashboard/                 # Page: /dashboard
│   ├── devis/[id]/                # Pages dynamiques pour devis
│   │   ├── accepter/              # Page: /devis/[id]/accepter
│   │   └── decliner/              # Page: /devis/[id]/decliner
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Page: /
│   └── globals.css
├── components/                    # Composants React réutilisables
│   ├── chat-devis.tsx
│   ├── chat-placeholder.tsx
│   ├── devis-form.tsx
│   ├── reponse-devis.tsx
│   └── dashboard/
│       ├── devis-create.tsx
│       ├── devis-preview.tsx
│       └── leads-table.tsx
└── lib/                          # Utilitaires et logique métier
    ├── business/                  # Logique métier
    │   ├── calculer-devis.ts
    │   ├── relances.ts
    │   └── tarifs.ts
    ├── db/                        # Base de données
    │   ├── index.ts
    │   └── schema.ts (Drizzle ORM)
    ├── email/                     # Envoi d'emails
    │   ├── devis-pdf.tsx
    │   ├── envoyer-devis.ts
    │   ├── envoyer-relance.ts
    │   └── transporter.ts
    └── geo/                       # Géolocalisation
        └── distance.ts
```

---

## 🎨 Pages Frontend (4 pages)

### 1. **Page d'Accueil** (`/`)
- **Fichier**: `src/app/page.tsx`
- **Type**: Client Component (`"use client"`)
- **Fonctionnalités**:
  - Navbar avec navigation
  - Hero section (gauche) + formulaire (droite)
  - Toggle entre mode "Chat IA" et "Formulaire"
  - Design navy/lime (couleurs principales)
  - Responsive (mobile/tablet/desktop)

### 2. **Dashboard** (`/dashboard`)
- **Fichier**: `src/app/dashboard/page.tsx`
- **Type**: Server Component (async)
- **Fonctionnalités**:
  - KPIs: Total leads, devis générés, envoyés, acceptés, refusés
  - Taux de conversion
  - CA accepté, demandes urgentes, relances
  - Table des leads avec devis associés
  - Data fetching direct depuis la DB (Drizzle)

### 3. **Accepter Devis** (`/devis/[id]/accepter`)
- **Fichier**: `src/app/devis/[id]/accepter/page.tsx`
- **Type**: ?
- **Fonctionnalités**: À déterminer (probablement confirmation d'acceptation)

### 4. **Décliner Devis** (`/devis/[id]/decliner`)
- **Fichier**: `src/app/devis/[id]/decliner/page.tsx`
- **Type**: ?
- **Fonctionnalités**: À déterminer (probablement raison du refus)

---

## 🧩 Composants (7 composants)

### Page d'Accueil
| Composant | Fichier | Rôle |
|-----------|---------|------|
| `ChatDevis` | `chat-devis.tsx` | Chat IA pour demande de devis |
| `ChatPlaceholder` | `chat-placeholder.tsx` | Placeholder/skeleton pour chat |
| `DevisForm` | `devis-form.tsx` | Formulaire classique de devis |

### Dashboard
| Composant | Fichier | Rôle |
|-----------|---------|------|
| `LeadsTable` | `dashboard/leads-table.tsx` | Table des leads avec actions |
| `DevisCreate` | `dashboard/devis-create.tsx` | Création manuelle de devis |
| `DevisPreview` | `dashboard/devis-preview.tsx` | Aperçu d'un devis |

### Pages Devis
| Composant | Fichier | Rôle |
|-----------|---------|------|
| `ReponseDevis` | `reponse-devis.tsx` | Formulaire réponse client |

---

## 🎨 Design System & Conventions

### Palette Couleurs
```
Primary:
  - navy-950: Bg principal #1a1f35 (dark navy)
  - navy-900: Bg secondaire #242d4a
  - navy-800: Cards #2d3a57
  - navy-700: Borders/hover #3d4a6a
  - navy-400: Texte secondaire #6b7399
  - navy-100: Texte principal #e5e7eb

Accent:
  - lime-400: Accent principal #84cc16
  - lime-400/15: Bg button light

Secondary:
  - red-400: Erreurs/urgent
  - green-400: Succès/accepté
  - yellow-400: Attention/en attente
  - blue-400: Info
```

### Typographie
- **Font**: Geist (sans-serif) + Geist Mono (monospace)
- **Charsets**: Latin
- **Tailwind classes**: font-bold, font-medium, font-normal
- **Sizing**: text-xs, text-sm, text-base, text-2xl, text-4xl, text-5xl

### Spacing & Layout
- **Container**: max-w-7xl (centered)
- **Gaps**: gap-2, gap-3, gap-4, gap-6
- **Padding**: px-4, px-6, px-12, px-20 / py-2, py-3, py-4
- **Borders**: border-navy-700/50, rounded-xl, rounded-2xl, rounded-lg
- **Shadows**: shadow-2xl shadow-navy-950/50

### States & Interactions
```css
/* Buttons */
- bg-lime-400/15 → hover:bg-lime-400/25
- text-lime-400 → hover:text-navy-100
- transition-colors

/* Links */
- text-navy-400 → hover:text-navy-100
- transition-colors

/* Borders */
- border-navy-700/50 (40% opacity)
```

### Responsive Design
- **Mobile**: grid-cols-2 (tous les grids)
- **Tablet (sm)**: grid-cols-3
- **Desktop (lg)**: grid-cols-4 à 6
- **XL**: max-w-xl → max-w-7xl
- **Hidden on mobile**: lg:flex, hidden lg:block

---

## 📦 Dépendances Frontend Clés

| Package | Version | Usage |
|---------|---------|-------|
| next | 16.2.9 | Framework |
| react | 19.2.4 | UI library |
| react-dom | 19.2.4 | DOM rendering |
| tailwindcss | 4.x | Styling |
| @tailwindcss/postcss | 4.x | PostCSS plugin |
| zod | 4.4.3 | Validation |
| @ai-sdk/react | 3.0.211 | AI chat integration |
| ai | 6.0.209 | AI SDK core |
| @react-pdf/renderer | 4.5.1 | PDF generation |

---

## 🔧 Configuration & Règles

### TypeScript
- **Target**: ES2017
- **Lib**: DOM + ESNext
- **Strict Mode**: ✅ Activé
- **Module Resolution**: bundler
- **JSX**: react-jsx

### ESLint
- **Config**: eslint-config-next (web vitals + typescript)
- **Ignore**: .next/, out/, build/, next-env.d.ts
- **Rules**: Next.js best practices

### Path Aliases
```json
"@/*": "./src/*"
```

### Tailwind CSS
- **Version**: 4 (latest)
- **PostCSS Integration**: ✅
- **Plugins**: @tailwindcss/postcss

---

## 🎯 Conventions Observées

### Naming
- ✅ camelCase pour les variables/fonctions
- ✅ PascalCase pour les composants
- ✅ kebab-case pour les fichiers (sauf Page/Layout)
- ✅ Préfixes: `use` pour hooks, `get` pour fetch

### Component Structure
```tsx
"use client" (si state/hooks)

import { type TypeName } from "...";

type Props = {
  label: string;
  value: number | string;
};

export default function ComponentName({ ... }: Props) {
  return (...);
}
```

### Layout & Rendering
- ✅ Flexbox pour layout (flex-col, flex-row)
- ✅ Grid pour KPIs (grid grid-cols-2 sm:grid-cols-3)
- ✅ Tailwind utility classes exclusivement
- ✅ `h-screen`, `min-h-full` pour fullscreen
- ✅ `overflow-hidden`, `overflow-y-auto` pour scroll

### API Integration
- ✅ Routes d'API dans `src/app/api/`
- ✅ Database queries directement en server components
- ✅ Client components pour forms/interactions

---

## 🔍 Points d'Attention

1. **Pages dynamiques** (`devis/[id]/*`)
   - Pas d'implémentation visible → À créer/compléter

2. **Composants dashboard**
   - `devis-create.tsx` et `devis-preview.tsx` → À examiner pour comprendre la logique

3. **Responsive**
   - Mobile navbar: navigation cachée (hidden md:flex)
   - À tester sur tous les breakpoints

4. **Types React 19**
   - Migration vers React 19 → Vérifier types props/children

5. **Tailwind v4**
   - CSS 3 features avancées → CSS custom properties
   - Configuration minimaliste (pas de tailwind.config.js)

---

## 📈 Recommandations pour Modifications

### Si tu dois ajouter des pages:
1. Créer le dossier `src/app/nompage/`
2. Ajouter `page.tsx` (lazy loaded)
3. Ajouter `layout.tsx` si nested layout spécifique
4. Respecter la palette navy/lime

### Si tu dois ajouter des composants:
1. Placer dans `src/components/` ou `src/components/dashboard/`
2. Nommer en PascalCase
3. Exporter en default export
4. Typer les props avec `type Props = { ... }`

### Si tu dois modifier le design:
1. Garder la palette navy-950 → lime-400
2. Utiliser Tailwind v4 utilities
3. Mobile-first responsive
4. Tester sur mobile/tablet/desktop

---

## 🚀 Setup & Commands

```bash
npm install        # Installer les dépendances
npm run dev        # Dev server (port 3000)
npm run build      # Build production
npm run start      # Start production
npm run lint       # Vérifier ESLint
```

---

**Dernière mise à jour**: 25 juin 2026
