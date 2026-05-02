# RezaKit

PWA de suivi fitness offline-first, optimisée iOS/Safari. Musculation, cardio, nutrition, poids corporel, coach IA et routine du soir dans une seule app.

**Live** : https://resakit.fr

---

## Sommaire

1. [Vue d'ensemble](#vue-densemble)
2. [Fonctionnalités](#fonctionnalités)
3. [Stack technique](#stack-technique)
4. [Architecture](#architecture)
5. [Structure des fichiers](#structure-des-fichiers)
6. [Base de données](#base-de-données)
7. [Synchronisation cloud](#synchronisation-cloud)
8. [Intégrations externes](#intégrations-externes)
9. [Coach IA](#coach-ia)
10. [Design system](#design-system)
11. [Variables d'environnement](#variables-denvironnement)
12. [Installation & développement](#installation--développement)
13. [Déploiement](#déploiement)

---

## Vue d'ensemble

RezaKit est une app fitness pensée pour un usage quotidien depuis l'iPhone. Elle fonctionne entièrement hors ligne grâce à IndexedDB (Dexie), avec une synchronisation cloud optionnelle via Supabase pour les utilisateurs connectés.

L'app est une PWA installable (pas d'App Store nécessaire) avec une UI en glassmorphism sombre optimisée pour les safe areas iOS (notch, home indicator).

**Principes :**
- Offline-first : tout fonctionne sans internet
- Local-first : les données vivent sur l'appareil, le cloud est une couche de backup
- Pas d'inscription obligatoire : l'app est pleinement fonctionnelle sans compte
- Une seule main suffit : navigation bottom nav + FAB central

---

## Fonctionnalités

### Musculation

- 5 types de séance : Push / Pull / Legs / Upper / Lower
- Bibliothèque de 150+ exercices organisés par groupe musculaire (poitrine, dos, épaules, biceps, triceps, avant-bras, abdos, quadriceps, ischio-jambiers, fessiers, mollets, cardio)
- Exercices personnalisés
- Templates (préréglés + créés par l'utilisateur)
- Suivi par série : poids (kg) + reps
- Timer de repos entre les séries
- Records personnels (PR) calculés automatiquement par exercice
- Historique complet de chaque exercice (graphe de progression)

### Cardio

- Course à pied : distance (km) + temps → allure calculée automatiquement
- Natation : distance (m) + temps + style (Crawl / Brasse / Dos / Papillon / Mixte)
- Plan semi-marathon 27 semaines (avril → novembre 2026)
- Import automatique depuis Strava

### Nutrition

- Suivi calories entrantes par repas (petit-déj, déjeuner, dîner, collation)
- Calories sortantes (dépenses, cardio)
- Calcul du net journalier
- Objectif calorique configurable (défaut 2200 kcal)
- Import calories depuis Strava et Garmin

### Poids corporel

- Pesée du matin (à jeun)
- Delta automatique (variation entre les 2 dernières mesures)
- Graphe d'évolution

### Photos de progression

- Proposition de photo posing à la fin de chaque séance
- Upload compressé (max 1200px, JPEG 82%) vers Supabase Storage
- Galerie 3 colonnes avec vignettes, date et type de séance
- Visionneuse plein écran
- Notes associées à chaque photo
- Nécessite un compte connecté

### Analytics

- Records personnels par exercice
- Graphes de progression par exercice (Recharts)
- Stats volume hebdo / mensuel
- Répartition des groupes musculaires travaillés
- Stats cardio : distance totale, temps, allure moyenne
- Export CSV des données
- Export texte du bilan hebdomadaire complet (musculation + cardio + poids + nutrition + routine)

### Routine du soir

- Items personnalisables (emoji + nom)
- Completion journalière cochable
- Streak calculé automatiquement (journée complète = 50%+ items cochés)
- Heure de coucher / réveil

### Coach IA (Gemini 2.0 Flash)

- Chat avec contexte complet : 14 derniers jours de séances, PRs, poids, calories, dernière course
- Mémoire persistante : compaction automatique au-delà de 30 messages (garde les 20 plus récents + résumé)
- Profil d'injuries / limitations sauvegardé
- Clé API Gemini configurée par l'utilisateur (Settings → Params)

### Cloud & Auth

- Supabase email/password (optionnel)
- Sync automatique debounced (4 secondes après chaque mutation)
- Restore complète depuis le cloud à la connexion
- Fonctionne 100% en local sans compte

### Calendrier

- Vue mensuelle (séances + cardio)
- Navigation mois par mois
- Tap sur un jour → détail des activités

---

## Stack technique

| Couche | Outil |
|--------|-------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS + CSS custom (variables, animations) |
| State | Zustand |
| DB locale | Dexie (IndexedDB) |
| DB cloud | Supabase (PostgreSQL + Storage) |
| Auth | Supabase Auth |
| Graphs | Recharts |
| AI | Gemini 2.0 Flash (appels directs navigateur) |
| AI proxy | Anthropic Claude (via Vercel Edge Function) |
| Cardio sync | Strava OAuth 2.0 |
| Calories sync | Garmin OAuth 1.0a (en attente d'approbation) |
| Hébergement | Vercel |

---

## Architecture

### Flux de données local

```
Action utilisateur
      ↓
Zustand store (optimistic update)
      ↓
Dexie (IndexedDB) — persist
      ↓
scheduleSync() — debounce 4s
      ↓
pushToCloud() → Supabase user_data
```

### Flux offline / online

- Sans compte : tout stocké en IndexedDB + localStorage. Zéro requête réseau.
- Avec compte : identique, mais `scheduleSync()` déclenche un upsert Supabase après chaque mutation. Aussi déclenché sur `visibilitychange` (app en arrière-plan → sync immédiate).

### Restore depuis le cloud

```
Login Supabase
      ↓
restoreFromCloud()
      ↓
Clear IndexedDB local
      ↓
Bulk insert depuis user_data JSON
      ↓
Restore localStorage (settings, tokens)
```

---

## Structure des fichiers

```
RezaKit/
├── api/                          # Vercel serverless functions
│   ├── chat.ts                   # Proxy Claude (edge runtime)
│   ├── strava-callback.ts        # OAuth 2.0 Strava token exchange
│   └── garmin/
│       ├── request-token.ts      # OAuth 1.0a request
│       ├── callback.ts           # OAuth 1.0a exchange
│       └── dailies.ts            # Wellness data fetch
├── landing/                      # Landing page statique
│   ├── index.html
│   ├── confidentialite.html
│   └── merci.html
├── public/
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # Service worker
│   └── apple-touch-icon.png
├── src/
│   ├── components/               # 21 composants React
│   │   ├── AICoach.tsx           # Chat Gemini
│   │   ├── Analytics.tsx         # Graphes et stats
│   │   ├── Auth.tsx              # Login / signup
│   │   ├── Calendar.tsx          # Vue calendrier
│   │   ├── Cardio.tsx            # Course + natation
│   │   ├── Daily.tsx             # Plan running journalier
│   │   ├── Dashboard.tsx         # Page principale (hero + sheets)
│   │   ├── ExerciseTracker.tsx   # Tracking séries par exercice
│   │   ├── Icons.tsx             # 50+ icônes SVG custom
│   │   ├── Navbar.tsx            # Navigation bottom + FAB
│   │   ├── Onboarding.tsx        # Premier lancement
│   │   ├── Params.tsx            # Compte, API keys, OAuth
│   │   ├── PostSessionPhoto.tsx  # Photo posing post-séance
│   │   ├── ProgressGallery.tsx   # Galerie photos
│   │   ├── RestTimer.tsx         # Timer de repos
│   │   ├── RunningProgram.tsx    # Plan semi-marathon 27 semaines
│   │   ├── SessionForm.tsx       # UI session active
│   │   ├── Settings.tsx          # Exercices + templates
│   │   ├── TemplateModal.tsx     # Sélection template
│   │   └── Toast.tsx             # Notifications
│   ├── db/
│   │   ├── db.ts                 # Schéma Dexie (v3)
│   │   ├── supabase.ts           # Client Supabase
│   │   ├── seedExercises.ts      # 150+ exercices preset
│   │   ├── seedTemplates.ts      # Templates PPL / Upper-Lower
│   │   └── exerciseInfo.ts       # Métadonnées exercices
│   ├── stores/                   # Zustand stores
│   │   ├── authStore.ts          # Supabase auth
│   │   ├── bodyweightStore.ts    # Pesée
│   │   ├── calorieStore.ts       # Calories in/out
│   │   ├── cardioStore.ts        # Courses + natations
│   │   ├── exerciseStore.ts      # Exercices (presets + custom)
│   │   ├── progressPhotoStore.ts # Photos Supabase
│   │   ├── routineStore.ts       # Routine du soir + streaks
│   │   ├── sessionStore.ts       # Session en cours + historique
│   │   └── templateStore.ts      # Templates
│   ├── types/
│   │   └── index.ts              # Types TS (Session, Exercise, etc.)
│   ├── utils/
│   │   ├── cloudSync.ts          # Push/restore Supabase, debounce
│   │   ├── coachMemory.ts        # Compaction mémoire IA
│   │   ├── coachProfile.ts       # Profil injuries
│   │   ├── export.ts             # Export CSV (PapaParse)
│   │   ├── records.ts            # Calcul PRs
│   │   ├── runningPlan.ts        # Plan semi-marathon 27 semaines
│   │   ├── strava.ts             # OAuth + sync activités
│   │   └── weekExport.ts         # Export bilan hebdo texte
│   ├── App.tsx                   # Routing, OAuth callbacks, orchestration
│   ├── index.css                 # Design tokens, animations, glassmorphism
│   └── main.tsx                  # Point d'entrée React
├── index.html                    # Entry HTML (PWA meta, SW registration)
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── vercel.json                   # Rewrites SPA
```

---

## Base de données

### Dexie (IndexedDB) — schéma v3

| Table | Index |
|-------|-------|
| `sessions` | `id, date, type, completed` |
| `templates` | `id, type, name` |
| `courses` | `id, date` |
| `natations` | `id, date` |
| `bodyweights` | `id, date` |
| `customExercises` | `id, name, muscleGroup` |
| `calories` | `id, date, type` |
| `routineItems` | `id, order` |
| `routineCompletions` | `id, date` |

### Supabase — table `user_data`

Toutes les tables Dexie sont sérialisées en JSON dans une seule ligne par utilisateur :

```
user_id (PK)
sessions, templates, courses, natations, body_weights
custom_exercises, calorie_entries, routine_items, routine_completions
coach_memory, chat_history
local_settings  ← capture de tous les localStorage keys
updated_at
```

### localStorage (à migrer vers Supabase)

| Clé | Contenu |
|-----|---------|
| `gemini_api_key` | Clé API Gemini de l'utilisateur |
| `user_profile` | Onboarding (nom, objectif, niveau, jours/semaine) |
| `onboarding_done` | Boolean |
| `rezakit_calorie_goal` | Objectif calorique journalier |
| `coach_profile` | Injuries / limitations |
| `strava_token`, `strava_refresh`, `strava_expires` | OAuth Strava |
| `strava_athlete_id`, `strava_name`, `strava_imported_ids` | Strava meta |
| `garmin_token`, `garmin_secret` | OAuth Garmin |
| `ai_coach_memory`, `ai_chat_history` | Aussi dans Supabase |

---

## Synchronisation cloud

`src/utils/cloudSync.ts` gère deux opérations :

**`pushToCloud()`** — déclenché 4s après chaque mutation (debounce) ou sur `visibilitychange`
1. Capture toutes les tables Dexie
2. Capture tous les localStorage pertinents
3. Upsert dans `supabase.user_data`

**`restoreFromCloud()`** — déclenché au login
1. Fetch `user_data` de l'utilisateur
2. Vide les tables Dexie locales
3. Bulk insert depuis le JSON cloud
4. Restaure les localStorage

---

## Intégrations externes

### Strava

- OAuth 2.0 via `/api/strava-callback.ts` (Vercel)
- Token stocké en localStorage (refresh automatique)
- `syncStravaActivities()` : importe les 100 dernières activités
  - Run/Swim → `courses` / `natations`
  - Toutes activités avec calories → `calorie_entries` (type `out`)
  - Deduplication via `strava_imported_ids`

### Garmin

- OAuth 1.0a via `/api/garmin/` (Vercel)
- Wellness API : calories actives, pas, fréquence cardiaque
- **Statut : en attente d'approbation développeur Garmin**

### Gemini 2.0 Flash

- Appels directs depuis le navigateur (pas de proxy)
- Clé API fournie par l'utilisateur dans Params
- Contexte injecté : 14 derniers jours de sessions, PRs, poids, calories, dernière course
- Mémoire compactée automatiquement (>30 messages → résumé + 20 récents gardés)

### Claude (Anthropic)

- Proxy via `/api/chat.ts` (Vercel Edge Function)
- Optionnel : `ANTHROPIC_API_KEY` requis en variable Vercel

---

## Coach IA

Le coach utilise Gemini 2.0 Flash avec un système de contexte en 3 couches :

**Contexte court terme** (injecté à chaque message)
- 14 derniers jours de sessions avec exercices, séries, poids
- Records personnels actuels
- Poids corporel récent
- Calories du jour
- Dernière course (distance, allure)

**Mémoire long terme** (compactée)
- Résumé des échanges passés (>30 messages → `coachMemory.ts` compacte)
- Sauvegardé dans localStorage + Supabase

**Profil permanent** (`coachProfile.ts`)
- Blessures et limitations physiques
- Jamais supprimé lors de la compaction

---

## Design system

### Couleurs

| Variable | Valeur | Usage |
|----------|--------|-------|
| `--primary` | `#FF6B35` | Orange — CTA, accents |
| `--secondary` | `#C41E3A` | Rouge — danger, gradient |
| `--bg-base` | `#050505` | Fond principal |
| `--bg-elevated` | `#232329` | Cards, modals |
| `--text-main` | `#F5F5F5` | Texte principal |
| `--text-soft` | `#BDBDC4` | Texte secondaire |
| `--ok` | `#4ADE80` | Succès, validation |
| `--info` | `#60A5FA` | Info, liens |

### Typographie

| Usage | Police |
|-------|--------|
| Headlines, titres | Bebas Neue (uppercase) |
| Corps de texte | Inter |
| Chiffres, données | JetBrains Mono |

### Composants clés

- `.glass` / `.glass-strong` — glassmorphism (blur + saturation)
- Fond ambient — deux cercles en dégradé orange/rouge qui dérivent (animation `drift`)
- Navbar fixe en bas avec safe area inset
- Sheets/modals pour la saisie (calories, poids, cardio, routine)
- FAB central pour nouvelle séance

### iOS specifics

- `viewport-fit=cover` + `env(safe-area-inset-*)` pour notch et home indicator
- Font-size 16px minimum sur les inputs (évite le zoom iOS)
- `-webkit-overflow-scrolling: touch` sur les zones scrollables
- `touch-action: manipulation` pour désactiver le double-tap zoom

---

## Variables d'environnement

### Vercel (backend uniquement)

```
STRAVA_CLIENT_SECRET=...
GARMIN_CONSUMER_KEY=...
GARMIN_CONSUMER_SECRET=...
ANTHROPIC_API_KEY=...          # Optionnel, pour /api/chat
```

### Vite (baked dans le build)

```
VITE_STRAVA_CLIENT_ID=231353
```

### Supabase (hardcodé, clé publique)

```
URL : https://muwplluumpvwmwhrtepq.supabase.co
Anon key : sb_publishable_...   (visible dans supabase.ts)
```

---

## Installation & développement

```bash
npm install

# Dev
npm run dev          # Vite sur http://localhost:5173

# Build production
npm run build        # TypeScript check + Vite build → /dist

# Preview build
npm run preview
```

Pour tester l'expérience PWA complète : ouvrir sur iPhone dans Safari, puis "Ajouter à l'écran d'accueil".

---

## Déploiement

L'app est déployée sur Vercel. Push sur `master` → déploiement automatique.

- Le dossier `/api` est auto-déployé en serverless functions
- `vercel.json` configure les rewrites pour le routing SPA (toutes les routes → `index.html`)
- Pas de configuration supplémentaire requise

```json
// vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
