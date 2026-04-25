# DESIGN BRIEF — TRACKER MUSCU
## App de suivi d'entraînement mobile-first

---

## CONTEXTE & VISION

App web PWA installable sur iPhone (Safari → Écran d'accueil).
Utilisée au gym, souvent avec une main, en sueur.
**Philosophie :** entrer les données vite, voir la progression sans friction.
**Ambiance :** sportive, sombre, premium. Pas de gamification, pas de bullshit.

---

## DESIGN SYSTEM ACTUEL (à révolutionner)

```
Primary :    #FF6B35  (orange vif)
Secondary :  #C41E3A  (rouge)
Dark :       #1a1a1a
Bg-dark :    #222222
Text :       #F5F5F5
```

**Objectif du redesign :** garder l'âme dark/orange/rouge mais passer de "fonctionnel" à "produit premium". Penser Nike Training Club, Whoop, mais plus brutal et minimaliste. Typo forte, espacement généreux, micro-interactions, hierarchy claire.

---

## NAVIGATION

**Bottom navbar fixe** — 6 onglets :
```
🏠 Home  |  📅 Calendrier  |  🏃 Cardio  |  📈 Stats  |  🏁 Programme  |  ⚙️ Réglages
```
La navbar disparaît pendant une séance active (plein écran pour le tracking).

---

## PAGE 1 — DASHBOARD (Home)

**Rôle :** vue d'ensemble rapide au réveil ou avant d'aller s'entraîner.

**Contenu actuel (de haut en bas) :**
1. **Header** — titre "TRACKER" + date du jour + 2 boutons export (📄 Semaine / 📥 CSV)
2. **CTA principal** — bouton "＋ NOUVELLE SÉANCE" (gradient orange→rouge, pleine largeur)
3. **Bloc race countdown** — si programme running actif : "🏁 Semi-Marathon · S{n} · {phase} · {X}km dimanche · {N} jours"
4. **Bloc "Aujourd'hui"** — si séance déjà faite ce jour : badge type (Push/Pull/etc), nb exos, nb sets
5. **Stats 7 derniers jours** — 3 cases : Muscu (nb séances) / Course (km) / Natation (m) + streak si > 1 jour
6. **Poids corporel** — dernière mesure + tendance (▲/▼), bouton "+ Ajouter" qui ouvre un input
7. **Records personnels** — top 3 des PR (exercice, poids max × reps, date)
8. **Bouton secondaire** — "🏃 Ajouter Course / Natation"

**UX clé :** tout visible sans scroll sur iPhone 14. Densité d'info haute mais aérée.

---

## PAGE 2 — SESSION FORM (pendant une séance)

**Rôle :** tracking en temps réel d'une séance de muscu. Page la plus critique de l'app.

**Étape 1 — Choix du type :**
- Grille 2×3 de gros boutons colorés : Push 💪 / Pull 🏋️ / Legs 🦵 / Upper ⬆️ / Lower ⬇️
- Chaque bouton = couleur propre (orange, rouge, gris, orange clair, rouge foncé)

**Étape 2 — Séance en cours :**

*Header :*
- Type de séance (ex: "💪 PUSH") + sous-titre "3 exercices · 9 sets"
- Bouton "✕ Annuler" en haut à droite

*Liste des exercices (composant ExerciseTracker) :*
Chaque exercice = une card expandable :
- **Header card** : numéro + nom exercice + groupe musculaire + "N sets · max Xkg" + flèche expand
- **Corps (quand expandé) :**
  - Liste des sets déjà faits : "S1 · 100kg × 5" avec bouton edit ✏️ et delete 🗑️
  - Mode édition inline d'un set : 2 inputs (poids / reps) + ✓ / ✕
  - Input row pour nouveau set : [Poids] × [Reps] + bouton [＋]
  - Historique compact des 3 dernières séances pour cet exercice (date · sets ex: "100×5, 100×5, 102×3")
  - Bouton "🗑️ Retirer de la séance" tout en bas

*Panel "Ajouter exercice" :*
- Bouton "📋 Charger template" (si templates dispo pour ce type)
- Bouton "＋ Ajouter exercice" → ouvre un panel :
  - Input recherche (filtre la liste des ~100 exercices preset)
  - Grille "⚡ Favoris" (6 exercices hardcodés)
  - Bouton "＋ Créer exercice custom" → 2 champs (nom + groupe musculaire)

*Footer :*
- Bouton "💾 Sauvegarder comme template" → input nom + confirmer
- Bouton "✓ TERMINER LA SÉANCE" (vert, gros, pleine largeur)

**UX clé :** on est debout au gym, une main, fatiguée. Inputs larges, bouton + bien accessible, validation immédiate. Toast "🔥 Nouveau PR Deadlift: 120kg!" si PR battu.

---

## PAGE 3 — CALENDRIER

**Rôle :** voir son historique au mois, cliquer un jour pour voir le détail.

**Contenu :**
1. **Header** — "📅 CALENDRIER" + stats mois (ex: "4 séances · 12.5km")
2. **Navigation mois** — ‹ Avril 2026 › 
3. **Grille calendrier (7×N jours) :**
   - Chaque case = carré arrondi
   - Couleur selon type séance : orange (Push), rouge (Pull), gris (Legs), orange clair (Upper), rouge foncé (Lower)
   - Points en bas de case : bleu (course) et cyan (natation)
   - Aujourd'hui = bordure orange
   - Tap = ring blanc + panel détail en dessous
4. **Légende couleurs** en bas de la grille
5. **Panel détail jour sélectionné :**
   - Card séance muscu : bordure left colorée, type, liste exercices + sets
   - Card course : 🏃 X km · Ymin · Z min/km
   - Card natation : 🏊 Xm · Ymin · style
   - Bouton 🗑️ pour supprimer une séance

**UX clé :** overview visuel immédiat, pas de scroll dans la grille.

---

## PAGE 4 — ANALYTICS

**Rôle :** voir sa progression sur les exercices et le cardio.

**Contenu :**
1. **Stats globales** — 4 cases : Séances totales / Volume total (kg) / Course (km) / Natation (m)
2. **Sélecteur d'onglets** : 🏋️ Muscu | 🏃 Cardio | ⚖️ Poids

**Onglet Muscu :**
- Dropdown pour choisir un exercice (parmi ceux trackés)
- Si exercice sélectionné :
  - 4 mini-stats : Max (kg) / 1RM estimé (kg) / Progression (+Xkg) / Nb sessions
  - **Area chart** poids max par séance vs temps (orange)
  - Badge "📈 +Xkg sur N séances — belle progression!" si progression positive

**Onglet Cardio :**
- Area chart course : distance (km) vs temps (bleu)
- Line chart course : allure (min/km) vs temps (orange) — axe Y inversé (plus bas = mieux)
- Area chart natation : distance (m) vs temps (cyan)

**Onglet Poids corporel :**
- Area chart poids (kg) vs temps (rouge)
- 3 stats : Actuel / Min / Évolution (±kg)

**Tous les graphiques :** dark background, grille subtile, tooltip custom dark/orange, dots sur les points.

---

## PAGE 5 — CARDIO

**Rôle :** ajouter et consulter les sorties course à pied et natation.

**Contenu :**
1. **Onglets** : 🏃 Course | 🏊 Natation
2. **Stats totales** (si entrées existantes) : Distance totale / Nb séances / Pace moyen
3. **Bouton "＋ Nouvelle course/natation"** → panel formulaire :
   - Date (input date)
   - Distance (km pour course, m pour natation)
   - Temps (minutes)
   - Style (pour natation : Crawl/Brasse/Dos/Papillon/Mixte)
   - Notes (optionnel)
   - Bouton "✓ Enregistrer"
4. **Liste historique** — tri anti-chrono, chaque entrée : distance · temps · pace · date · notes · 🗑️

---

## PAGE 6 — PROGRAMME RUNNING

**Rôle :** plan d'entraînement personnalisé 27 semaines pour un semi-marathon.

**Contexte :** utilisateur débutant en course, objectif Semi-Marathon 21.1km le 1er novembre 2026. Programme structuré du 27 avril au 26 octobre (1 sortie/sem dimanche, optionnel 2e en semaine).

**7 phases :**
- Phase 1 Découverte (S1-4) : 3→5km
- Phase 2 Fondation (S5-8) : 6→8km + optionnel
- Phase 3 Construction (S9-12) : 10→12km
- Phase 4 Endurance (S13-16) : 13→15km
- Phase 5 Spécifique (S17-20) : 16→18km
- Phase 6 Peak (S21-23) : 19→21km + simulation race S22
- Phase 7 Affûtage/Taper (S24-27) : 12→5km

**Contenu de la page :**
1. **Header** — "🏁 PROGRAMME" + "Semi-Marathon · 1er Novembre 2026" + compte à rebours "{N} jours restants"
2. **Barre de progression** — "Semaine X / 27 · Y% du programme" + barre de progression gradient
3. **Légende phases** — mini dots colorés (1 couleur par phase)
4. **Card semaine actuelle** — highlightée, grosse, avec : phase, description motivante, distance dimanche, option semaine si applicable, badge "🔥 SIMULATION" si semaine 22
5. **Liste déroulante des 27 semaines** — chaque ligne : numéro + phase (couleur) + date + distance km + mention optionnel + icône (✓ fait, 💤 récup, 🎯 taper, 🔥 peak)
6. **Card Race Day** — en bas de la liste, spéciale, gradient
7. **Section conseils** — 5 tips en bullets

**UX clé :** la semaine courante est immédiatement visible. Les semaines passées s'estompent. Une sortie course enregistrée dans Cardio = semaine marquée comme ✓ faite automatiquement.

---

## PAGE 7 — PARAMÈTRES (Settings)

**Rôle :** gérer ses données personnelles dans l'app.

**Contenu :**
1. **Onglets** : 💪 Exercices | 📋 Templates
2. **Onglet Exercices custom :**
   - Bouton "＋ Ajouter" → formulaire inline : nom + dropdown groupe musculaire
   - Liste des exercices créés par l'utilisateur (nom + groupe + 🗑️)
   - Récapitulatif exercices preset (par groupe : chest 12 / back 18 / etc.)
3. **Onglet Templates :**
   - Liste des templates sauvegardés : nom + badge type (Push/Pull/etc) + liste des exercices + 🗑️
   - Vide state avec explication pour en créer

---

## COMPOSANTS TRANSVERSAUX

### Toast notifications
- Apparaissent en haut, durée 3s
- 3 types : success (vert) / info (orange) / record (🔥 rouge/orange animé)
- Exemples : "Séance enregistrée ✅" / "🔥 Nouveau PR Deadlift: 120kg!" / "Template sauvegardé 💾"

### ExerciseTracker (composant réutilisable)
- Accordéon d'exercices pendant la séance
- Dernier exercice ajouté = auto-expandé
- Un seul exercice expandé à la fois

### TemplateModal
- Overlay modal pour choisir un template à charger pendant la séance
- Liste des templates filtré par type de séance

---

## FLOWS UX CRITIQUES

### Flow 1 — Enregistrer une séance (2 min chrono)
1. Dashboard → tap "＋ NOUVELLE SÉANCE"
2. Choisir type (Push)
3. Tap "Charger template" OU ajouter exos manuellement
4. Pour chaque exercice : entrer poids → entrer reps → tap [＋]
5. Répéter pour chaque set
6. Tap "✓ TERMINER LA SÉANCE" → toast success → retour dashboard

### Flow 2 — Vérifier son historique deadlift
1. Analytics → onglet Muscu → dropdown "Deadlift"
2. Voir graphique + stats + progression

### Flow 3 — Voir son programme running
1. Programme → voir semaine courante highlighted
2. Distance du dimanche visible immédiatement

---

## DONNÉES & STOCKAGE

- IndexedDB local (Dexie) — offline-first, 100% sur le device
- Aucun serveur, aucun cloud
- 6 stores : sessions, templates, courses, natations, bodyweights, customExercises

---

## AMBIANCES DE RÉFÉRENCE (inspiration)

- **Nike Training Club** : typographie massive, espacement aéré, dark mode
- **Whoop** : data dense mais lisible, palette sombre
- **Strong App** : UX gym optimisée
- **Raycast** : dark UI ultra propre, system design cohérent
- **Ton vibe perso** : brutal, minimaliste, pas de fioritures, chaque élément justifié

---

## CE QU'ON VEUT AMÉLIORER AVEC LE REDESIGN

1. **Typographie** — plus de hierarchy, les chiffres doivent claquer (font-weight 900 sur les stats)
2. **Cards** — plus de profondeur visuelle, glassmorphism subtil possible
3. **Couleurs** — garder orange/rouge mais ajouter des accents, gradients plus sophistiqués
4. **Le CTA "NOUVELLE SÉANCE"** — doit être le plus beau bouton qu'on ait jamais vu
5. **Les graphiques** — plus stylés, custom tooltips, animations d'entrée
6. **La navbar** — plus premium, peut-être des icônes custom SVG
7. **Les inputs** — plus larges, feedback visuel au focus
8. **Micro-animations** — scale au tap, transitions fluides entre pages
9. **La page Programme** — doit donner envie de courir, doit être inspirante
10. **L'ExerciseTracker** — le coeur de l'app, doit être parfait

---

## CONTRAINTES TECHNIQUES

- React + TypeScript + Tailwind CSS v3
- Recharts pour les graphiques (peut être remplacé par autre chose)
- Optimisé pour iPhone (écran 390px-430px de large)
- Touch-first : tous les tap targets minimum 44×44px
- Dark mode uniquement
- Doit marcher offline

---

## OUTPUT ATTENDU DU REDESIGN

Nouveau code complet pour tous les composants :
- `src/index.css` (Tailwind + variables CSS custom)
- `tailwind.config.js`
- `src/components/Dashboard.tsx`
- `src/components/SessionForm.tsx`
- `src/components/ExerciseTracker.tsx`
- `src/components/Calendar.tsx`
- `src/components/Analytics.tsx`
- `src/components/Cardio.tsx`
- `src/components/RunningProgram.tsx`
- `src/components/Settings.tsx`
- `src/components/Navbar.tsx`
- `src/components/Toast.tsx`
- `src/components/TemplateModal.tsx`

**NE PAS TOUCHER :**
- `src/stores/` (toute la logique)
- `src/db/` (IndexedDB)
- `src/utils/` (export, records, runningPlan, weekExport)
- `src/types/index.ts`
- `src/App.tsx` (routing)
- `src/main.tsx`
- Tout ce qui n'est pas dans `src/components/` ou les fichiers CSS/config
