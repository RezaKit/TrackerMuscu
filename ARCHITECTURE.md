# TrackerMuscu — Architecture & État des données

## Stack
- **Frontend**: React 18 + TypeScript + Vite PWA → Vercel
- **DB locale**: Dexie (IndexedDB) — cache offline
- **Cloud**: Supabase (auth + `user_data` table JSON blob)
- **IA**: Gemini 2.0 Flash (appel direct navigateur via clé API user)
- **Serverless**: Vercel API routes (`/api/`)
- **URL prod**: https://tracker-muscu-xi.vercel.app

---

## Stockage actuel

### Dexie (IndexedDB local) — src/db/db.ts
Tables : `sessions`, `templates`, `courses`, `natations`, `bodyweights`, `customExercises`, `calories`, `routineItems`, `routineCompletions`

### Supabase — table `user_data` (1 ligne par user, JSON blob)
Champs synchronisés via `cloudSync.ts` (push/restore) :
- `sessions`, `templates`, `courses`, `natations`
- `body_weights`, `custom_exercises`, `calorie_entries`
- `routine_items`, `routine_completions`
- `coach_memory` (résumé IA compact)
- `chat_history` (historique conversations IA)
- `updated_at`

**Sync** : `scheduleSync()` → debounce 4s → `pushToCloud()`. Trigger aussi sur `visibilitychange` (app en background). `restoreFromCloud()` au login.

### localStorage — À MIGRER vers Supabase
| Clé | Usage | Migré ? |
|-----|-------|---------|
| `gemini_api_key` | Clé API Coach IA | ❌ |
| `user_profile` | Profil onboarding (name, goal, level, weeklyDays, devices) | ❌ |
| `onboarding_done` | Flag "onboarding terminé" | ❌ |
| `strava_token` | OAuth token Strava | ❌ |
| `strava_refresh` | Refresh token Strava | ❌ |
| `strava_expires` | Expiry timestamp Strava | ❌ |
| `strava_athlete_id` | ID athlète Strava | ❌ |
| `strava_name` | Nom athlète Strava | ❌ |
| `strava_imported_ids` | IDs activités déjà importées (JSON Set) | ❌ |
| `garmin_token` | OAuth token Garmin | ❌ |
| `garmin_secret` | OAuth secret Garmin | ❌ |
| `tracker_calorie_goal` | Objectif calories journalier | ❌ |
| `ai_coach_memory` | Résumé compact IA | ✅ (dans coach_memory) |
| `ai_chat_history` | Historique chat | ✅ (dans chat_history) |

**Plan migration** : Ajouter ces champs dans l'upsert `user_data` de `cloudSync.ts` + les lire dans `restoreFromCloud()`. Pour les users non connectés → garder localStorage comme fallback.

---

## Types (src/types/index.ts)
```ts
Session { id, date, type: SessionType, exercises: ExerciseLog[], completed, notes?, createdAt, updatedAt }
SessionType = 'push' | 'pull' | 'legs' | 'upper' | 'lower'
ExerciseLog { id, sessionId, exerciseName, muscleGroup, sets: ExerciseSet[], createdAt }
ExerciseSet { weight, reps, setNumber }
Template { id, name, type: SessionType, exerciseNames: [{name, muscleGroup}][], createdAt }
Course { id, date, distance, time, notes?, createdAt }
Natation { id, date, distance, time, style?, notes?, createdAt }
BodyWeight { id, date, weight, notes?, createdAt }
CalorieEntry { id, date, type: 'in'|'out', calories, label, meal?: MealType, createdAt }
RoutineItem { id, name, emoji, order }
RoutineCompletion { id, date, completedItemIds: string[], createdAt }
UserProfile { name, goal: 'muscle'|'cut'|'endurance'|'health', level: 'beginner'|'intermediate'|'advanced', weeklyDays, devices: string[] }
```

---

## Stores Zustand (src/stores/)
- `sessionStore` — currentSession, sessions, createSession, endSession, addExercise/Set/deleteSet, loadFromTemplate
- `templateStore` — templates, loadTemplates, createTemplate, deleteTemplate, updateTemplate
- `cardioStore` — courses, natations, addCourse, addNatation, deleteCourse, deleteNatation
- `bodyweightStore` — weights, addWeight, deleteWeight
- `calorieStore` — entries, calorieGoal (localStorage), addEntry, deleteEntry, setGoal
- `exerciseStore` — customExercises + presets merged, createExercise, deleteExercise
- `routineStore` — items, completions, addItem, deleteItem, toggleItem, getStreak
- `authStore` — user (Supabase), signIn, signUp, signOut, init

---

## Pages / Navigation (App.tsx)
`Page = 'dashboard' | 'calendar' | 'analytics' | 'cardio' | 'session' | 'params' | 'settings' | 'daily' | 'coach'`

Navbar : Dashboard · Calendrier · Stats · Params (⚙️)
- **settings** = Config (onglets: Exercices / Templates / Coach IA / Routine)
- **params** = Paramètres (compte Supabase / API Gemini / Strava / Garmin / Inviter)
- **coach** = AICoach (page full-screen sans navbar)

---

## Coach IA — src/components/AICoach.tsx
- Appel direct Gemini 2.0 Flash (`generativelanguage.googleapis.com`)
- Clé depuis `localStorage.getItem('gemini_api_key')`
- Contexte injecté : sessions 14 derniers jours, PRs, poids, calories semaine, dernière course
- Mémoire long-terme : `coachMemory.ts` — compact > 30 messages, garde 20 récents
- Historique + mémoire = synchro Supabase via `cloudSync`

### Plan intégration actions IA (À implémenter)
L'IA peut créer des séances et templates directement depuis le chat via **Gemini Function Calling** :

**Fonctions déclarées à Gemini :**
```
create_session(date, type, template_id?, exercises?, notes?)
create_template(name, type, exercises[{name, muscleGroup}])
reschedule_session(session_id, new_date)
```

**Flow :**
1. User message → callGemini avec `tools` (function declarations)
2. Si Gemini retourne `functionCall` → afficher une card de confirmation dans le chat
3. User confirme → exécuter l'action via les stores (sessionStore.createSession + templateStore.createTemplate)
4. Afficher résultat dans le chat

**Confirmation card** :
```
┌─────────────────────────────────────┐
│ 🏋️ Créer une séance ?               │
│ Dos/Biceps · Mardi 29 avril         │
│ Exercices : Tirage, Curl...         │
│ [Confirmer] [Annuler]               │
└─────────────────────────────────────┘
```

---

## Vercel API routes (api/)
- `/api/strava-callback.ts` — échange code → access_token (OAuth 2.0)
- `/api/garmin/request-token.ts` — OAuth 1.0a request token
- `/api/garmin/callback.ts` — OAuth 1.0a token exchange
- `/api/garmin/dailies.ts` — fetch calories Garmin (wellness API)
- `/api/chat.ts` — (existe mais pas encore utilisé pour proxy Gemini)

## Env vars Vercel
- `STRAVA_CLIENT_ID` = 231353
- `STRAVA_CLIENT_SECRET` = secret côté serveur uniquement
- `VITE_STRAVA_CLIENT_ID` = 231353 (baked in frontend build)
- `GARMIN_CONSUMER_KEY` / `GARMIN_CONSUMER_SECRET` = en attente approbation

---

## Points d'attention
- `scheduleSync()` doit être appelé après chaque mutation qui doit aller dans Supabase
- Les users sans compte = localStorage uniquement (pas de cloud)
- Gemini function calling : `responseMimeType` non nécessaire, utiliser `tools` + `tool_config`
- SessionType = 5 valeurs : push/pull/legs/upper/lower (pas de type libre côté IA)
- Templates : les presets ont des IDs fixes, les templates user ont UUID
