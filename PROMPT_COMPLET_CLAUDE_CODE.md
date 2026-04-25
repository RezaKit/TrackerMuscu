# 🏋️ TRACKER MUSCU — PROMPT COMPLET POUR CLAUDE CODE

## 🎯 MISSION GLOBALE

Créer une **web app offline-first pour iPhone** complète pour tracker musculation (PPL/Upper-Lower), course et natation.
- **Zero cloud, 100% local** (IndexedDB)
- **Offline-first** (service workers)
- **Design minimaliste** (orange/rouge/noir)
- **Ultra-rapide** à utiliser au gym

---

## 🚀 STACK TECH RECOMMANDÉ

```
Frontend: React 18 + TypeScript + Vite
Storage: IndexedDB + dexie.js (wrapper)
PWA: Service Workers (workbox)
UI: Tailwind CSS (ou styled-components)
State: Zustand ou Context API
Charts: Chart.js ou Recharts
Date: date-fns
```

**Alternative plus légère:**
```
Frontend: Vue 3 + TypeScript + Vite
Storage: IndexedDB
PWA: Service Workers
UI: Tailwind CSS
```

---

## 📱 STRUCTURE PROJET

```
src/
├── components/
│   ├── Dashboard.tsx
│   ├── SessionForm.tsx
│   ├── Calendar.tsx
│   ├── Analytics.tsx
│   ├── ExerciseHistory.tsx
│   ├── ExerciseAdd.tsx
│   └── Navbar.tsx
├── db/
│   ├── db.ts (Dexie config)
│   ├── seedData.ts (exercices presets)
│   └── migrations.ts
├── stores/
│   ├── sessionStore.ts
│   ├── exerciseStore.ts
│   └── settingsStore.ts
├── types/
│   ├── index.ts
│   └── database.ts
├── utils/
│   ├── export.ts (CSV/PDF)
│   ├── notifications.ts
│   └── charts.ts
├── App.tsx
├── main.tsx
└── index.css (Tailwind)

public/
├── manifest.json (PWA)
├── service-worker.ts
└── icons/
```

---

## 🗄️ BASE DE DONNÉES — EXERCICES PRÉ-CHARGÉS

### Liste complète (~150 exercices organisés par muscle)

```typescript
// src/db/seedData.ts

export const PRESET_EXERCISES = {
  // POITRINE (Chest)
  chest: [
    "Barbell Bench Press",
    "Dumbbell Bench Press",
    "Incline Barbell Press",
    "Incline Dumbbell Press",
    "Decline Bench Press",
    "Machine Chest Press",
    "Cable Chest Press",
    "Chest Fly Machine",
    "Dumbbell Fly",
    "Cable Fly",
    "Push-ups",
    "Dips (Chest)",
  ],

  // DOS (Back)
  back: [
    "Deadlift",
    "Sumo Deadlift",
    "Romanian Deadlift (RDL)",
    "Barbell Rows",
    "Dumbbell Rows",
    "Machine Rows",
    "Lat Pulldown",
    "Pull-ups",
    "Assisted Pull-ups",
    "Chin-ups",
    "Pendulum Rows",
    "T-Bar Rows",
    "Bent-Over Barbell Rows",
    "Seal Rows",
    "Chest-Supported Rows",
    "Face Pulls",
    "Shrugs",
    "Smith Machine Rows",
  ],

  // ÉPAULES (Shoulders)
  shoulders: [
    "Barbell Shoulder Press",
    "Dumbbell Shoulder Press",
    "Machine Shoulder Press",
    "Lateral Raises",
    "Dumbbell Lateral Raises",
    "Cable Lateral Raises",
    "Front Raises",
    "Reverse Fly",
    "Reverse Pec Deck",
    "Overhead Press",
    "Military Press",
    "Pike Push-ups",
    "Upright Rows",
  ],

  // BRAS AVANT (Biceps)
  biceps: [
    "Barbell Curls",
    "Dumbbell Curls",
    "Machine Curls",
    "Cable Curls",
    "EZ-Bar Curls",
    "Incline Dumbbell Curls",
    "Preacher Curls",
    "Hammer Curls",
    "Cable Hammer Curls",
    "Concentration Curls",
    "21s Curls",
  ],

  // BRAS ARRIÈRE (Triceps)
  triceps: [
    "Tricep Dips",
    "Rope Pushdowns",
    "V-Bar Pushdowns",
    "Straight Bar Pushdowns",
    "Tricep Overhead Extensions",
    "EZ-Bar Overhead Extensions",
    "Skull Crushers",
    "Dumbbell Overhead Extensions",
    "Close-Grip Bench Press",
    "Tricep Kickbacks",
    "Machine Tricep Dips",
  ],

  // AVANT-BRAS (Forearms)
  forearms: [
    "Barbell Wrist Curls",
    "Dumbbell Wrist Curls",
    "Wrist Curls Machine",
    "Reverse Wrist Curls",
    "Farmer Walks",
    "Farmer Carries",
  ],

  // JAMBES (Legs)
  legs: [
    "Barbell Squats",
    "Dumbbell Squats",
    "Leg Press Machine",
    "Smith Machine Squats",
    "Bulgarian Split Squats",
    "Goblet Squats",
    "Hack Squats",
    "Leg Extensions",
    "Leg Curls (Lying)",
    "Leg Curls (Seated)",
    "Walking Lunges",
    "Dumbbell Lunges",
    "Barbell Lunges",
    "Reverse Lunges",
    "Step-ups",
    "Wall Sits",
  ],

  // JAMBES - MOLLETS (Calves)
  calves: [
    "Standing Calf Raises",
    "Seated Calf Raises",
    "Machine Calf Raises",
    "Calf Raises on Leg Press",
    "Donkey Calf Raises",
  ],

  // CORE (Abs/Core)
  core: [
    "Barbell Abs Rollouts",
    "Ab Wheel Rollouts",
    "Cable Crunches",
    "Machine Crunches",
    "Decline Sit-ups",
    "Rope Crunches",
    "Leg Raises",
    "Hanging Leg Raises",
    "Hanging Knee Raises",
    "Dragon Flags",
    "Planks",
    "Side Planks",
    "Ab Wheel",
    "Torso Rotation Machine",
  ],

  // CARDIO/ENDURANCE
  cardio: [
    "Treadmill Running",
    "Incline Walking",
    "Rowing Machine",
    "Stationary Bike",
    "Elliptical",
    "Stair Climber",
    "Jump Rope",
    "Battle Ropes",
  ]
};
```

---

## 📊 SCHÉMA BASE DE DONNÉES COMPLET

```typescript
// src/types/database.ts

export interface Exercise {
  id: string; // uuid
  name: string;
  muscleGroup: string; // chest, back, shoulders, etc.
  category: "preset" | "custom"; // preset ou créé par user
  isUserCreated: boolean;
}

export interface SessionExercise {
  id: string; // uuid
  sessionId: string;
  exerciseId: string; // ref to Exercise
  exerciseName: string; // snapshot du nom (au cas où modif)
  sets: Set[];
}

export interface Set {
  id: string;
  weight: number; // kg
  reps: number;
  setNumber: number;
}

export interface Session {
  id: string; // uuid
  date: string; // "2026-04-24"
  type: "push" | "pull" | "legs" | "upper" | "lower";
  exercises: SessionExercise[]; // embedded or refs
  completed: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string; // "Push Standard"
  type: "push" | "pull" | "legs" | "upper" | "lower";
  exerciseNames: string[]; // just the names
  createdAt: string;
}

export interface Course {
  id: string;
  date: string;
  distance: number; // km
  time: number; // minutes
  notes?: string;
  createdAt: string;
}

export interface Natation {
  id: string;
  date: string;
  distance: number; // meters
  time: number; // minutes
  style?: string; // freestyle, breaststroke, etc.
  notes?: string;
  createdAt: string;
}

export interface BodyWeight {
  id: string;
  date: string;
  weight: number; // kg
  notes?: string;
  createdAt: string;
}

export interface Stats {
  totalSessions: number;
  totalVolume: number; // kg
  avgSessionsPerWeek: number;
  currentStreak: number; // days
  records: Record[] // top lifts
}
```

---

## 🎨 UI/UX — WIREFRAMES DÉTAILLÉS

### SCREEN 1: DASHBOARD (Accueil)

```
┌─────────────────────────┐
│  TRACKER MUSCU    ⚙️    │ (header avec settings)
├─────────────────────────┤
│                         │
│  📅 AUJOURD'HUI         │
│  ─────────────────────  │
│  Push Workout          │
│  [En cours]  [3/8 exo]  │
│                         │
├─────────────────────────┤
│  CETTE SEMAINE          │
│  ─────────────────────  │
│  ✅ Lundi: Push        │
│  ✅ Mardi: Pull        │
│  ✅ Mercredi: Legs     │
│  ⚪ Jeudi: Upper       │
│  ⚪ Vendredi: Lower    │
│  ✅ Samedi: Course 5km │
│  ⚪ Dimanche: Natation │
│                         │
├─────────────────────────┤
│  🔥 DERNIER RECORD      │
│  ─────────────────────  │
│  Deadlift: 150kg x5     │
│  (Hier)                 │
│                         │
├─────────────────────────┤
│  [+ NOUVELLE SÉANCE]    │ (CTA button)
│  [STATS]  [CALENDRIER]  │
└─────────────────────────┘
```

### SCREEN 2: SAISIE SÉANCE (Session Form)

```
┌─────────────────────────┐
│  ◀ NOUVELLE SÉANCE      │
├─────────────────────────┤
│                         │
│  Choisir type:          │
│  [Push] [Pull] [Legs]   │
│  [Upper] [Lower]        │
│                         │
│  Charger template:      │
│  [Aucun] ▼              │
│  (dropdown: "Push Std", │
│   "Push Heavy", etc)    │
│                         │
├─────────────────────────┤
│  EXERCICES RAPIDES:     │
│  [Deadlift] [Bench]     │
│  [Squat]   [Pull-ups]   │
│  [Dips]    [Rows]       │
│  [+ Ajouter]            │
│                         │
├─────────────────────────┤
│  EXERCICES SÉLECTIONNÉS │
│  ─────────────────────  │
│  1. Deadlift            │
│  2. Barbell Rows        │
│  3. Lat Pulldown        │
│                         │
│  [Commencer séance]     │
└─────────────────────────┘
```

### SCREEN 3: TRACKING EXERCICE (In-Session)

```
┌─────────────────────────┐
│  ◀ PUSH - 3/8 EXO       │
├─────────────────────────┤
│                         │
│  EXERCICE ACTUEL:       │
│  Deadlift               │
│                         │
│  ┌──────────────────┐   │
│  │ POIDS: [  100 ] │   │
│  │ KG               │   │
│  ├──────────────────┤   │
│  │ REPS:  [   5  ] │   │
│  ├──────────────────┤   │
│  │ SÉRIE: [  1/3 ] │   │
│  ├──────────────────┤   │
│  │ [   VALIDER   ]  │   │
│  └──────────────────┘   │
│                         │
├─────────────────────────┤
│  HISTORIQUE DEADLIFT:   │
│  ─────────────────────  │
│  Hier: 100kg x5 x3      │
│  -2j:  95kg x8 x3       │
│  -4j:  100kg x3 x2      │
│                         │
│  [Exercice suivant] ▶   │
│  [Fin séance]           │
└─────────────────────────┘
```

### SCREEN 4: CALENDRIER

```
┌─────────────────────────┐
│  CALENDRIER       [2026] │
├─────────────────────────┤
│  < AVRIL >              │
│                         │
│  L  M  M  J  V  S  D   │
│  1  2  3  4  5  6  7   │
│  🔴 🔴 ⬛ 🟠 🔴 🔴 🟢  │
│  8  9 10 11 12 13 14   │
│  🟠 ⬛ 🔴 🟠 🔴 🟠 🟢  │
│ 15 16 17 18 19 20 21   │
│  🔴 🔴 🟠 ⬛ 🔴 🟠 🟢  │
│ 22 23 24 25 26 27 28   │
│  🟠 🟠 ⭕ ⬛ 🔴 🟠     │
│                         │
│  🔴 Push | 🟠 Upper    │
│  ⬛ Pull | 🟢 Course   │
│  ⭕ Legs | 🟦 Natation │
│                         │
│  [Clic sur jour → détail]
└─────────────────────────┘
```

### SCREEN 5: ANALYTICS

```
┌─────────────────────────┐
│  ANALYTIQUES            │
├─────────────────────────┤
│                         │
│  [EXERCICES] [STATS]    │
│                         │
│  Sélectionner exercice: │
│  [Deadlift ▼]           │
│                         │
│  📈 PROGRESSION         │
│  [Graph: Poids vs temps]│
│  (last 3 months)        │
│                         │
│  📊 STATS DEADLIFT      │
│  ──────────────────────│
│  Max: 150kg             │
│  Avg: 110kg             │
│  Séries faites: 47      │
│  Volume total: 5170kg   │
│                         │
│  📋 HISTORIQUE          │
│  ──────────────────────│
│  24 Apr: 150kg x5 x3   │
│  23 Apr: 145kg x6 x3   │
│  21 Apr: 140kg x5 x4   │
│                         │
│  [Exporter] [Partager]  │
└─────────────────────────┘
```

### SCREEN 6: CRÉER EXERCICE CUSTOM

```
┌─────────────────────────┐
│  ◀ NOUVEL EXERCICE      │
├─────────────────────────┤
│                         │
│  Nom exercice:          │
│  [____________]         │
│                         │
│  Muscle visé:           │
│  [Poitrine ▼]           │
│  - Poitrine             │
│  - Dos                  │
│  - Épaules              │
│  - Bras avant           │
│  - Bras arrière         │
│  - Jambes               │
│  - Autre                │
│                         │
│  [  CRÉER  ]            │
│  [ANNULER ]             │
│                         │
│  (exercice ajouté au   │
│   quick-add et dispo   │
│   dans les templates)   │
│                         │
└─────────────────────────┘
```

---

## 🔧 FONCTIONNALITÉS DÉTAILLÉES

### 1. SAISIE SÉANCE MUSCULATION

**Flow complet:**
1. User tape "+ Nouvelle séance"
2. Choisir type (Push/Pull/Legs/Upper/Lower)
3. Option A: Charger template sauvegardé
   - Si oui → voir list de templates pour ce type
   - Charger → affiche exercices
   - Possibilité d'ajouter/retirer sur le moment
4. Option B: Créer libre
   - Accès direct aux exercices favoris (Quick-add)
   - Ou recherche dans tous les exercices
5. Pour chaque exercice:
   - Champs: Poids (kg) | Reps | Numéro série
   - Tap VALIDER → enregistre la série
   - Affiche historique de cet exercice (tendance)
   - Possibilité: [Ajouter une série] ou [Exercice suivant]
6. Fin de séance:
   - Popup: "Séance enregistrée ✅"
   - Option: Ajouter notes ou fin directe

**Édition en temps réel:**
- Pendant la séance: pouvoir ajouter exercice rapidement (quick-add)
- Corriger une série (modifier poids/reps avant valider)
- Retirer un exercice

### 2. TEMPLATES SAUVEGARDÉS

**Créer template:**
- User sélectionne exercices pour Push
- Tap "Sauvegarder en template"
- Nom: "Push Standard" / "Push Heavy" / etc
- Stocké localement

**Utiliser template:**
- Tap "Charger template"
- Voir tous les templates (filtrés par type)
- Charger un template
- Modifier sur le moment si besoin

**Gérer templates:**
- Voir liste (éditer/supprimer)
- Renommer
- Dupliquer

### 3. QUICK-ADD EXERCICES

**Concept:**
- Top 20-30 exercices favoris (ou customisables) affichés comme buttons
- Tap rapide = ajoute à séance en cours
- Exemple: [Deadlift] [Bench] [Squat] [Rows] etc

**Personnaliser:**
- User peut ajouter/retirer du quick-add
- Les exercices custom ajoutés auto go to quick-add

### 4. CRÉER EXERCICE CUSTOM

**Form simple:**
- Nom exercice
- Muscle visé (dropdown)
- Créer

**Auto-saved:**
- Apparaît dans quick-add
- Dispo pour futures séances
- User peut le réutiliser comme preset

### 5. CALENDRIER

**Vue:**
- Mois/année
- Code couleur: Push (orange), Pull (rouge), Legs (noir), Upper (orange+), Lower (rouge+), Course (bleu), Natation (vert)
- Tap jour → affiche séance du jour

**Interactions:**
- Voir toutes les séances d'une journée
- Ajouter séance rétroactive
- Supprimer séance
- Exporter mois

### 6. HISTORIQUE EXERCICE

**Affichage en temps réel:**
- Quand user ajoute une série → voir historique live
- Tableau: date | poids | reps
- Graphique: progression poids vs temps (last 3 months)
- Max lift, avg, tendance

**Comparaison:**
- Voir si on monte ou baisse
- Notifications: "Nouveau PR! 🔥"

### 7. SAISIE COURSE

**Form simple:**
- Date
- Distance (km)
- Temps (min:sec)
- Notes (optional)
- Enregistrer

**Affichage:**
- Historique course (tableau)
- Graphique distance vs temps
- Avg pace

**Intégration Garmin:**
- (Future) Import direct depuis Garmin Connect API

### 8. SAISIE NATATION

**Form:**
- Date
- Distance (m)
- Temps (min:sec)
- Style (optional: freestyle, brasse, dos, papillon)
- Notes
- Enregistrer

**Affichage:**
- Historique natation
- Graphique distance vs temps

### 9. POIDS CORPOREL

**Tracking:**
- Date
- Poids (kg)
- Notes (optional)
- Enregistrer

**Affichage:**
- Graphique tendance (last 3 months)
- Avg, max, min
- Notifications: "T'as gagné 2kg ce mois!" ou "T'as perdu 1kg bien joué!"

### 10. DASHBOARD

**Affiche:**
- Séance d'aujourd'hui (type + progression: 3/8 exo)
- Stats semaine:
  - Nombre séances muscu
  - Course: distance total
  - Natation: distance total
- Dernier record (avec date)
- Bouton "+ Nouvelle séance" prominent
- Bottom nav: [Dashboard] [Calendrier] [Analytiques]

### 11. ANALYTIQUES

**Tab 1: Exercices**
- Dropdown: sélectionner exercice
- Graphique poids vs temps (last 3 months)
- Stats: max, avg, num séries
- Historique tableau

**Tab 2: Stats globales**
- Volume total muscu (semaine, mois, all-time)
- Nombre séances par semaine
- Course: distance avg, total km
- Natation: distance avg, total m
- Poids corporel: graphique tendance
- Momentum: "📈 En montée" ou "📉 En descente"

**Export:**
- CSV (poids, reps, date)
- PDF (stats pretty-printed)

### 12. NOTIFICATIONS

**Activées:**
- Inactivité: "3+ jours sans muscu 💪" (1x par jour max)
- Records: "Nouveau PR Deadlift 150kg! 🔥" (immediate)

**Désactivées:**
- Rappels de séances

**Tech:**
- Notifications API (demander permission)
- Service worker pour push

### 13. EXPORT DONNÉES

**CSV:**
- Sessions (date, type, exercice, poids, reps, séries)
- Courses (date, distance, temps)
- Natation (date, distance, temps)
- Bodyweight (date, poids)

**PDF:**
- Stats joli formaté
- Graphiques
- Récapitulatif mois/année

**Boutons:**
- Dashboard: [Exporter] → dropdown CSV/PDF
- Analytics: [Exporter] → filtered data

---

## 🔐 TECHNOLOGIE OFFLINE-FIRST

### Service Workers

```typescript
// public/service-worker.ts

const CACHE_VERSION = 'v1';
const CACHE_ASSETS = 'tracker-assets';
const CACHE_DATA = 'tracker-data';

// Cache tous les assets statiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_ASSETS).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/main.js',
        '/styles.css',
        // assets
      ]);
    })
  );
});

// Serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

### IndexedDB Setup

```typescript
// src/db/db.ts

import Dexie from 'dexie';

export const db = new Dexie('TrackerMuscu');

db.version(1).stores({
  exercises: '++id, muscleGroup, category',
  templates: '++id, type, name',
  sessions: '++id, date, type',
  sessionExercises: '++id, sessionId',
  courses: '++id, date',
  natation: '++id, date',
  bodyweight: '++id, date',
});

// Seed preset exercises on first load
db.exercises.bulkAdd(PRESET_EXERCISES);
```

---

## 📱 DESIGN SYSTEM

### Couleurs (Tailwind)
```
primary: #FF6B35 (Orange)
secondary: #C41E3A (Red)
dark: #1a1a1a (Black)
bg: #222222 (Dark Gray)
text: #F5F5F5 (Light Gray)

Buttons: Orange (#FF6B35)
Danger: Red (#C41E3A)
Success: Green (#27AE60)
```

### Typography
```
H1: 28px, bold, white
H2: 24px, bold, gray-200
H3: 18px, semibold, gray-200
Body: 16px, regular, gray-300
Small: 12px, regular, gray-400
```

### Components
```
Button: Orange bg, white text, 16px padding
Input: Dark bg, orange border on focus
Card: Dark bg, subtle border, rounded
Nav: Fixed bottom, 4 icons, white text
Modal: Dark overlay, card centered
Loading: Spinner orange
```

---

## 🚀 PRIORITÉS IMPLÉMENTATION

### Phase 1: MVP (Core musculation)
- [x] Database schema + seedData
- [x] Service workers + offline
- [x] Dashboard basic
- [x] Session form (select type + exercises)
- [x] Exercise tracking (weight/reps/sets/validate)
- [x] Exercise history display
- [x] Calendar view
- [x] Basic analytics (exercise progression graph)

### Phase 2: Complete app
- [ ] Templates (create, load, edit)
- [ ] Quick-add customization
- [ ] Create custom exercises
- [ ] Course tracking
- [ ] Natation tracking
- [ ] Bodyweight tracking
- [ ] Stats page (global stats)
- [ ] Export (CSV/PDF)
- [ ] Notifications (inactivity + records)

### Phase 3: Polish
- [ ] Graphs refined
- [ ] UI animations
- [ ] Mobile responsive tweaks
- [ ] Dark mode perfected
- [ ] Error handling
- [ ] Backup iCloud (optional)
- [ ] Photos progress (optional)

---

## 🎯 ACCEPTANCE CRITERIA

### MVP Checklist
- [ ] App loads offline (no network needed after first load)
- [ ] Can create musculation session in < 2 min
- [ ] Can view exercise history in < 5 sec
- [ ] All data persists locally (check DevTools IndexedDB)
- [ ] Calendar shows color-coded sessions
- [ ] Exercise tracking shows current set/max/avg
- [ ] Design is orange/red/black, minimaliste
- [ ] Mobile responsive (tested on iPhone 6"+)
- [ ] No console errors
- [ ] PWA installable (Add to Home Screen works)

### Performance
- [ ] Page load: < 2 sec
- [ ] Exercise select: < 1 sec
- [ ] Graph render: < 3 sec
- [ ] No janky animations

---

## 📖 EXEMPLE FLOW COMPLET

**User workflow:**

1. **Day 1 - Matin avant la salle**
   - Tap "+ Nouvelle séance"
   - Sélectionne "Push"
   - Charge template "Push Standard" → affiche [Bench, Incline, Dips, Flies, Lateral Raises]
   - Ajoute "Skull Crushers" (quick-add)
   - Tap "Commencer séance"

2. **Day 1 - Au gym**
   - Bench Press:
     - Poids: 100kg, Reps: 8, Série: 1 → VALIDER
     - Voit historique: [100kg x8, 95kg x10, 100kg x6]
     - Poids: 100kg, Reps: 6, Série: 2 → VALIDER
     - Poids: 100kg, Reps: 4, Série: 3 → VALIDER
   - [Exercice suivant] → Incline DB Press
     - ... pareil ...
   - ... autres exercices ...
   - [Fin séance] → "Séance enregistrée ✅"

3. **Day 5 - Voir progression**
   - Tap "Analytiques"
   - Sélectionne "Bench Press"
   - Voit graphique: 100kg progression depuis 1 mois
   - Affiche: Max 100kg, Avg 95kg, 12 séries faites
   - "Nouveau PR potentiel! 💪"

4. **Day 7 - Voir semaine**
   - Dashboard affiche:
     - Lundi: ✅ Push
     - Mardi: ✅ Pull
     - Mercredi: ✅ Legs
     - Jeudi: ✅ Upper
     - Vendredi: ✅ Lower
     - Samedi: ✅ Course 5km
     - Dimanche: ⭕ Natation (not done)

5. **Exporter données**
   - Tap [Exporter]
   - Choose CSV
   - Download file (all sessions, exercises, data)
   - Email ou stocke perso

---

## 💡 NOTES DE DÉVELOPPEMENT

### Pièges à éviter
- ❌ Ne pas sauvegarder à chaque keystroke (batch)
- ❌ Ne pas faire requêtes indexedDB en boucle (use transactions)
- ❌ Ne pas ignorer le offline-first (test sans wifi)
- ❌ Ne pas oublier manifest.json pour PWA

### Librairies recommandées
```json
{
  "react": "^18.2.0",
  "typescript": "^5.0.0",
  "dexie": "^3.2.0",
  "zustand": "^4.4.0",
  "recharts": "^2.10.0",
  "date-fns": "^2.30.0",
  "tailwindcss": "^3.3.0",
  "vite": "^4.4.0",
  "workbox-webpack-plugin": "^7.0.0"
}
```

### Test localement
```bash
npm run dev
# Ouvre iPhone sur http://localhost:5173
# Devtools: F12 → Application → Service Workers (register)
# Devtools: Application → IndexedDB (check data)
# Déconnecte wifi → vérifie offline fonctionne
```

---

## 🎉 RÉSULTAT FINAL

Une app iOS-like complète:
- ✅ Musculation tracking ultra-rapide
- ✅ 150+ exercices presets + custom
- ✅ Templates + Quick-add
- ✅ Course + Natation + Poids
- ✅ Analytics & progression graphs
- ✅ Calendar view
- ✅ 100% offline + local data
- ✅ Export CSV/PDF
- ✅ Notifications smart
- ✅ Design orange/red/black clean

**Ready to ship! 🚀**

---

## 🎬 POUR DÉMARRER AVEC CLAUDE CODE

Copie ce prompt entier et demande à Claude Code:

> "Crée une web app React TypeScript complète avec tout ce brief. Use Vite, Tailwind, Dexie, Zustand. Full offline-first, PWA ready. Design minimaliste orange/red/black. 150+ exercices presets, custom exercises, templates, quick-add, analytics complets. Utilise exactement la structure et le design défini dans ce brief."

Claude va générer:
- Toute la structure projet
- DB schema + seed data
- Tous les components React
- Service workers
- Styles Tailwind
- Export functions
- Logic complète

Ensuite tu pourras:
1. `npm install`
2. `npm run dev`
3. Test au gym 💪
4. Customise couleurs/exos si besoin

---

**C'est partit! 🏋️‍♂️🔥**
