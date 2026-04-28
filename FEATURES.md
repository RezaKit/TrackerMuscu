# Tracker Muscu — Features complètes

> Fichier de référence pour la présentation finale de l'app.
> À mettre à jour après chaque ajout de feature.

---

## 🏠 Dashboard

- Vue d'ensemble de la journée au premier coup d'œil
- Raccourci vers la session en cours
- Accès rapide : Cardio · Stats · Coach IA · Config
- Indicateur de connexion compte cloud
- Bouton "Se connecter" pour sync multi-appareils

---

## 🏋️ Séances (Musculation)

- 5 types de séances : Push / Pull / Legs / Upper / Lower
- Ajout d'exercices à la volée depuis une bibliothèque complète
- Chargement depuis un template en 1 tap
- Gestion des séries : poids + reps, édition inline, suppression
- Timer de repos intégré entre les séries
- Notes libres sur la séance
- Historique complet de toutes les séances passées
- Suppression d'une séance depuis le calendrier

---

## 📋 Templates

- Templates prédéfinis (Push / Pull / Legs / Upper / Lower) inclus par défaut
- Création de templates personnalisés avec n'importe quels exercices
- Templates créables directement depuis le Coach IA (chat)
- Édition et suppression des templates
- Chargement rapide d'un template en début de séance

---

## 📅 Calendrier

- Vue mensuelle des séances et activités cardio
- Séances planifiées (futures) visibles dans le calendrier
- Séances complétées marquées distinctement
- Navigation mois par mois
- Tap sur un jour → détail des activités du jour

---

## 📊 Stats & Analytics

- Records personnels (PRs) par exercice : poids max × reps
- Progression sur chaque exercice dans le temps
- Volume hebdomadaire / mensuel
- Répartition des groupes musculaires travaillés
- Statistiques cardio : distance, temps, allure
- Évolution du poids corporel (graphe)
- Bilan calories : entrées vs dépenses
- **Galerie photos de progression** : photos de posing après chaque séance

## 📷 Photos de progression

- Prise de photo posing proposée automatiquement à la fin de chaque séance
- Upload compressé (max 1200px, JPEG 82%) vers Supabase Storage
- Galerie 3 colonnes avec vignettes + date + type de séance
- Visionneuse plein écran au tap
- Notes associées à chaque photo
- Suppression avec confirmation (Storage + base)
- Requires compte connecté (stockage cloud uniquement)

---

## 🏃 Cardio

- Enregistrement des courses à pied (distance, temps, notes)
- Enregistrement des séances de natation (distance, style, temps)
- Calcul automatique de l'allure (course)
- Historique complet course + natation
- Import automatique depuis Strava (toutes activités avec calories)

---

## 🍽 Calories & Nutrition

- Suivi journalier des calories ingérées (petit-dej / déjeuner / dîner / collation)
- Suivi des calories dépensées (sport, activité)
- Objectif calorique journalier personnalisable
- Bilan net (mangé − dépensé)
- Entrées calories ajoutables directement depuis le Coach IA
- Import automatique des calories dépensées depuis Strava (à la connexion et manuellement)
- Import automatique des calories actives depuis Garmin (à la connexion et manuellement)

---

## ⚖️ Poids corporel

- Enregistrement du poids avec date et notes
- Graphe d'évolution dans le temps
- Poids loggable directement depuis le Coach IA

---

## 🧘 Routine Quotidienne

- Liste de checklist d'habitudes quotidiennes personnalisable
- Emoji + nom pour chaque item
- Ajout / suppression d'items librement
- Calcul du streak (jours consécutifs avec ≥ 50% des items)
- Mise à jour automatique chaque jour

---

## 🤖 Coach IA (Gemini 2.0 Flash)

### Contexte en temps réel
- Accès à toutes les données : séances, PRs, poids, calories, cardio, templates
- Sessions avec IDs pour modification directe
- Date du jour injectée (calcul "demain", "mardi prochain"...)
- Mémoire long-terme : compaction automatique au-delà de 30 messages
- **Domaine : fitness ET nutrition sportive** (macros, calories, compléments, récupération, sommeil, hydratation)

### Actions directes depuis le chat (Function Calling)
| Action | Description |
|---|---|
| Créer une séance | Planifie une séance dans le calendrier pour une date précise |
| Créer un template | Crée un template réutilisable |
| Supprimer une séance | Supprime une séance existante par référence |
| Déplacer une séance | Reschedule à une nouvelle date |
| Modifier les notes | Met à jour les notes d'une séance passée |
| Logger le poids | Enregistre le poids corporel |
| Ajouter des calories | Ajoute entrée mangée ou dépensée |
| Enregistrer cardio | Course ou natation depuis le chat |
| Mémoriser une blessure | Stockage permanent, influence tous les futurs conseils |
| Effacer les blessures | Supprime les limitations enregistrées |
| Plan de périodisation | Génère un plan N semaines avec toutes les séances dans le calendrier |

### Multi-action chaining
- L'IA peut enchaîner plusieurs actions dans un seul message (ex: mémoriser une blessure + créer une séance adaptée)
- Boucle Gemini Function Calling multi-tour : functionCall → functionResponse → next action
- Fallback mode `ANY` si Gemini revient en mode texte au milieu d'une chaîne

### Confirmation avant action
- Chaque action affiche une card de confirmation avec aperçu détaillé
- L'utilisateur valide ou annule avant exécution

### Blessures & limitations permanentes
- Mémorisées dans le profil coach (Supabase)
- Visibles dans l'en-tête du chat
- L'IA les intègre dans tous les conseils et créations de séances

### Détection de surmenage
- Si ≥ 6 séances en 7 jours ou ≥ 5 jours consécutifs → l'IA reçoit un warning automatique et le signale

### Quick prompts
- Suggestions de questions au démarrage du chat
- Couvrent bilan, création de séance, plan, blessure, logger poids

---

## 🔗 Intégrations externes

### Strava
- Connexion OAuth 2.0 sécurisée (secret côté serveur)
- Import automatique des courses + natations (anti-doublon par activité ID)
- Import automatique des calories dépensées pour toutes les activités (anti-doublon par activité ID)
- Déclenchement automatique à la connexion + bouton sync manuel dans les Paramètres
- Déconnexion propre (nettoyage tokens + IDs importés)

### Garmin (en attente approbation développeur)
- Connexion OAuth 1.0a via Vercel serverless
- Import des calories actives uniquement (pas BMR)
- Déclenchement automatique à la connexion + bouton "Calories du jour" dans les Paramètres
- Anti-doublon par date + libellé
- Compatible Forerunner, Fenix, Venu, Vivoactive...

---

## ☁️ Compte & Synchronisation Cloud

- Authentification email/mot de passe (Supabase)
- Sync automatique toutes les données : séances, templates, cardio, poids, calories, routine, Coach IA, profil
- Restore depuis le cloud au login (multi-appareils)
- Sync des tokens Strava / Garmin sur le cloud (portable entre appareils)
- Sync de la clé API Gemini (pas besoin de la re-saisir sur chaque appareil)
- Profil onboarding synchronisé
- Sync déclenchée en background quand l'app passe en arrière-plan

### Sécurité compte
- Changement de mot de passe depuis l'app
- Changement d'email avec confirmation double
- Réinitialisation de mot de passe par email
- Déconnexion

---

## 🎓 Onboarding

- 5 slides animées à la première ouverture
- Saisie du prénom
- Choix de l'objectif : Prise de masse / Force / Sèche / Recomposition / Endurance / Santé
- Niveau : Débutant / Intermédiaire / Avancé
- Fréquence d'entraînement hebdomadaire (2 à 7 jours)
- Appareils connectés (Garmin / Apple Watch / Polar / Strava / Fitbit / Aucun)
- Glow ambiant dynamique selon l'objectif choisi
- Profil sauvegardé + synchronisé sur Supabase

---

## 📱 PWA (Progressive Web App)

- Installable sur iPhone (Ajouter à l'écran d'accueil)
- Icône + splash screen natifs
- Fonctionne offline (données locales via Dexie/IndexedDB)
- Service Worker pour cache des assets
- Pas d'App Store requis

---

## ⚙️ Config (Paramètres techniques)

- Gestion des exercices personnalisés (ajout / suppression)
- Bibliothèque d'exercices présets intégrée
- Gestion des templates (création / édition / suppression)
- Clé API Coach IA (Gemini) configurable
- Routine quotidienne personnalisable (emoji + nom)

---

## 🔧 Paramètres (Compte & Préférences)

- Profil compte (email affiché)
- Changement de mot de passe / email
- Clé API Coach IA
- Connexion / déconnexion Strava
- Connexion / déconnexion Garmin
- Inviter un ami (share natif iOS + copie du lien)
- Modification de l'objectif principal (6 choix) — l'IA s'adapte immédiatement
- Réinitialisation totale des données (séances, templates, cardio, calories, poids, IA) avec confirmation — le compte reste actif

---

## 🎨 Design & UX

- Dark mode natif, design minimaliste
- Typographie display bold + font monospace pour les chiffres
- Glassmorphism (blur + transparence) cohérent
- Ambient glow animé en arrière-plan
- Animations de page (page-enter)
- Tap feedback (classe `tap`) sur tous les boutons interactifs
- Safe area iOS respectée (notch, home indicator)
- Détection clavier virtuel (navbar se cache pendant la saisie)
- Toast notifications pour feedback utilisateur
- Navigation par onglets : Dashboard · Calendrier · Stats · Paramètres

---

## 🛠 Stack technique

- **Frontend** : React 18 + TypeScript + Vite
- **State** : Zustand (stores par domaine)
- **DB locale** : Dexie (IndexedDB) — offline-first
- **Cloud** : Supabase (Auth + user_data JSON blob)
- **IA** : Gemini 2.5 Flash (appel direct navigateur, retry auto sur 503)
- **Serverless** : Vercel API routes (Strava OAuth, Garmin OAuth 1.0a)
- **Déploiement** : Vercel (https://tracker-muscu-xi.vercel.app)
- **PWA** : Service Worker + manifest.json

---

---

## ❌ Fonctionnalités non incluses (décisions)

- **Push notifications** : pas possible en PWA iOS sans backend (décision : skip)
- **Suivi macros détaillé** : non implémenté, la plupart des utilisateurs utilisent déjà Yazio ou MyFitnessPal

---

*Dernière mise à jour : 2026-04-27*
