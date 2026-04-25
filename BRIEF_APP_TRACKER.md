# 🏋️ TRACKER MUSCU — BRIEF COMPLET

## 🎯 VISION
App mobile de suivi d'entraînement **ultra-clean, minimaliste, offline-first** pour iPhone. 
Focus: musculation (PPL/Upper-Lower), course 1x/semaine, natation 2x/semaine.
Philosophie: entrer les données essentielles rapido, visualiser la progression sans friction.

---

## 📱 TECH STACK

**Plateforme:** Web app (Safari + offline capability)
**Storage:** IndexedDB local (data sur iPhone) + Export CSV/PDF
**Framework:** React / Vue / Svelte (ou vanilla + PWA)
**Service Workers:** Offline-first architecture
**Design:** Minimaliste, responsive pour écran 6"

---

## 🏋️ FONCTIONNALITÉS MUSCULATION

### Structure des séances
- **Types:** Push, Pull, Legs, Upper, Lower
- **Templates sauvegardés** (créer une fois, réutiliser)
  - Possibilité d'éditer sur le moment (ajouter/retirer exercices)
  - Quick-add: accès rapide aux exercices favoris (~20-30 exercices)

### Tracking pendant la séance
**Flux:** Exercice → Poids → Reps → Séries → Valider

Pour chaque série:
```
[Exercice: Deadlift]
├─ Poids: 100kg
├─ Reps: 5
├─ Série: 1/3
└─ [VALIDER] → affiche historique de Deadlift
```

Après validation → historique de l'exercice s'affiche
- Dernières séries (date, poids, reps)
- Progression visuelle (tendance)

### Données stockées par exercice
- Nom
- Date
- Poids
- Reps
- Numéro de série
- Historique complet

---

## 🏃 COURSE (1x/semaine)

**Données:** Distance + Temps
**Exemple:** 5km en 28min
**Intégration future:** Garmin (import possible)

---

## 🏊 NATATION (2x/semaine)

**Données:** Temps + Distance
**Exemple:** 1000m en 20min

---

## ⚖️ POIDS CORPOREL

**Tracking optional:**
- Poids du jour
- Date
- Graphique de tendance

---

## 📊 INTERFACE GÉNÉRALE

### 1️⃣ DASHBOARD (Accueil)
Résumé rapide:
- Séance du jour (en cours / complétée / prévue)
- Stats semaine:
  - ✅ X séances muscu (quels jours)
  - ✅ 1 course (distance)
  - ✅ 2 piscine (distance)
- Dernier record battu (si applicable)
- Bouton "+ Nouvelle séance"

### 2️⃣ SAISIE SÉANCE
```
[Choisir type: Push / Pull / Legs / Upper / Lower]
  ↓
[Charger template OU créer libre]
  ↓
[Quick-add: affiche liste exercices favoris]
  ↓
[Pour chaque exercice: Poids → Reps → Séries → Valider]
  ↓
[Voir historique en temps réel]
  ↓
[Fin de séance: "Séance enregistrée ✅"]
```

### 3️⃣ CALENDRIER
- Vue mois/semaine
- Chaque jour affiche type de séance (si complétée)
- Code couleur: Push (orange), Pull (rouge), Legs (noir), Course (bleu), Natation (vert)
- Clic sur jour → voir détail séance

### 4️⃣ ANALYTIQUES
**Pages séparées:**

#### a) Progression par exercice
- Graphique: poids levé vs temps
- Graphique: reps vs temps
- Meilleure série (1RM estimé?)
- Historique complet (tableau)

#### b) Stats globales
- Volume total (muscu par semaine/mois)
- Tendances (on monte ou on descend?)
- Courses: distance moyenne par sortie
- Natation: distance moyenne par sortie
- Poids corporel: graphique tendance

#### c) Tendances
- "T'as levé 10kg de plus sur deadlift cette semaine" ✨
- "Moyenne distance course: 5.2km"
- "Momentum: en montée 📈"

### 5️⃣ CALENDRIER + HISTORIQUE
- Vue calendrier mois/année
- Liste toutes les séances passées
- Filtrer par type (muscu, course, natation)
- Exporter données (CSV/PDF)

---

## 🎨 DESIGN

**Couleurs:**
- Primary: Orange (#FF6B35)
- Secondary: Rouge (#C41E3A)
- Dark: Noir (#1a1a1a)
- Background: Gris très sombre (#222222)
- Text: Blanc/Gris clair

**Style:**
- Minimaliste, épuré
- Typo: sans-serif (Inter, Roboto)
- Spacing: clean, respirant
- Dark mode obligatoire (facile au gym)

**Icons:**
- Dumbbell, running man, swimmer, calendar, stats
- Simple, line-based

---

## 📲 UX FLOWS

### Flow 1: Enregistrer une séance muscu
1. Tap "+ Nouvelle séance"
2. Choisir type (Push/Pull/etc)
3. Charger template OU ajouter manuel (Quick-add)
4. Pour chaque exercice:
   - Entrer poids
   - Entrer reps
   - Entrer num série (1/3, 2/3, etc)
   - Tap VALIDER
   - Voir historique de cet exercice
5. Fin de séance → confirmation ✅

### Flow 2: Voir progression deadlift
1. Tap "Analytiques"
2. Choisir "Deadlift"
3. Voir graphique poids vs temps
4. Voir tableau historique
5. Comparer avec mois dernier

### Flow 3: Voir semaine
1. Dashboard affiche résumé
2. Calendrier color-coded
3. Tap jour → voir détail séance

---

## 🔔 NOTIFICATIONS

**ACTIVÉES:**
- Rappel inactivité: "3+ jours sans muscu, c'est pas normal! 💪"
- Félicitations records: "GG! Nouveau record deadlift: 105kg 🔥"

**DÉSACTIVÉES:**
- Rappels de séances programmées
- Notifications générales

---

## 💾 DONNÉES & BACKUP

**Stockage:**
- IndexedDB (local sur iPhone)
- Données jamais envoyées au cloud
- Utilisateur contrôle ses données

**Export:**
- CSV (pour Excel/analyse perso)
- PDF (pour imprimer/archiver)
- Backup local (si service worker)

**Nice-to-have (si facile):**
- Backup automatique (iCloud?)
- Photos progress (avant/après)

---

## 🗂️ STRUCTURE BDD

### Collections

#### `sessions`
```json
{
  "id": "uuid",
  "date": "2026-04-24",
  "type": "push", // push|pull|legs|upper|lower|course|natation
  "exercises": ["id1", "id2"],
  "notes": "",
  "completed": true
}
```

#### `exercises`
```json
{
  "id": "uuid",
  "sessionId": "uuid",
  "name": "Deadlift",
  "sets": [
    { "weight": 100, "reps": 5, "setNumber": 1 },
    { "weight": 100, "reps": 5, "setNumber": 2 },
    { "weight": 100, "reps": 3, "setNumber": 3 }
  ]
}
```

#### `templates`
```json
{
  "id": "uuid",
  "name": "Push Standard",
  "type": "push",
  "exerciseNames": ["Bench Press", "Incline DB", "Dips"]
}
```

#### `workouts_course`
```json
{
  "id": "uuid",
  "date": "2026-04-24",
  "distance": 5, // km
  "time": 28, // min
  "notes": ""
}
```

#### `workouts_natation`
```json
{
  "id": "uuid",
  "date": "2026-04-24",
  "distance": 1000, // m
  "time": 20, // min
  "style": "freestyle" // optional
}
```

#### `bodyweight`
```json
{
  "id": "uuid",
  "date": "2026-04-24",
  "weight": 82 // kg
}
```

#### `favorites_exercises`
```json
[
  "Deadlift",
  "Bench Press",
  "Squat",
  "Pull-ups",
  // ... 20-30 exercices usuels
]
```

---

## 📋 PRIORITÉS DÉVELOPPEMENT

### MVP (Must Have)
1. Saisie séances muscu (poids/reps/séries/historique)
2. Dashboard rapide
3. Calendrier
4. Offline-first + data local
5. Dark mode orange/rouge/noir

### Phase 2 (Should Have)
1. Graphiques progression
2. Stats détaillées
3. Course + Natation
4. Notifications (inactivité + records)
5. Export CSV/PDF

### Phase 3 (Nice to Have)
1. Photos progress
2. Backup automatique
3. Poids corporel avancé
4. Intégration Garmin

---

## 🎯 KPIs SUCCESS

- ✅ Saisir une séance en < 2min
- ✅ Voir historique exercise en < 5 sec
- ✅ App fonctionne offline
- ✅ Design orange/rouge/noir clean
- ✅ Données locales 100% privées

---

## 💡 NOTES

- **Pas de cloud** → données 100% perso, offline-first
- **Pas de gamification complexe** → juste félicitations et records
- **Pas de social** → ton espace privé
- **Minimaliste** → entre données essentielles, vois la progression
- **Mobile-first** → optimisé pour écran 6" en main au gym

---

**Ready to build! 🚀**
