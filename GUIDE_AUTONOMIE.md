# GUIDE AUTONOMIE — TrackerMuscu
> Comment modifier l'UI, tester localement, faire des backups et déployer sans aide

---

## 1. COMMENT LANCER L'APPLI EN LOCAL

### Prérequis (une seule fois)
- Node.js installé (vérifier : `node -v` dans un terminal)
- npm installé (vérifier : `npm -v`)

### Lancer le serveur de développement
```bash
# Dans le terminal, aller dans le dossier du projet
cd "/home/jlnfu/Bureau/CLAUDE PROJETS/TrackerMuscu"

# Lancer le serveur local (HOT RELOAD = les modifs s'affichent instantanément)
npm run dev
```
→ Ouvre ton navigateur sur **http://localhost:5173**
→ Toute modification de fichier `.tsx`, `.css`, `.ts` se recharge **en temps réel**
→ CTRL+C dans le terminal pour arrêter

### Autres commandes utiles
```bash
npm run build        # Compile pour production (vérifie s'il y a des erreurs)
npm run preview      # Voir le build final en local avant de déployer
npm run type-check   # Vérifie les erreurs TypeScript sans compiler
```

---

## 2. STRUCTURE DES FICHIERS — QUOI EST OÙ

```
TrackerMuscu/
├── src/
│   ├── App.tsx                  ← Racine : navigation entre pages, gestion clavier/auth
│   ├── index.css                ← TOUTES les classes CSS custom + variables de couleurs
│   ├── components/
│   │   ├── Dashboard.tsx        ← Page d'accueil (stats du jour, bouton nouvelle séance)
│   │   ├── SessionForm.tsx      ← Formulaire pendant une séance (exercices, séries, reps)
│   │   ├── Calendar.tsx         ← Vue calendrier des séances passées
│   │   ├── Analytics.tsx        ← Graphiques et statistiques
│   │   ├── Cardio.tsx           ← Tracking cardio (course, vélo...)
│   │   ├── Daily.tsx            ← Page calories + routine du soir
│   │   ├── AICoach.tsx          ← Coach IA
│   │   ├── Navbar.tsx           ← Barre de navigation en bas de l'écran
│   │   ├── Settings.tsx         ← Paramètres (Strava, export...)
│   │   ├── Params.tsx           ← Paramètres avancés (compte, données)
│   │   ├── RunningProgram.tsx   ← Programme semi-marathon
│   │   ├── ExerciseTracker.tsx  ← Composant de saisie d'exercice
│   │   ├── TemplateModal.tsx    ← Modal pour choisir un template de séance
│   │   ├── Toast.tsx            ← Notifications pop-up (succès, info...)
│   │   ├── Icons.tsx            ← Tous les icônes de l'appli (SVG)
│   │   ├── Auth.tsx             ← Écran de connexion
│   │   ├── Onboarding.tsx       ← Premier lancement
│   │   ├── RestTimer.tsx        ← Timer de repos entre séries
│   │   ├── PostSessionPhoto.tsx ← Photo post-séance
│   │   └── ProgressGallery.tsx  ← Galerie de photos progression
│   ├── stores/
│   │   ├── sessionStore.ts      ← État des séances (données en cours + historique)
│   │   ├── cardioStore.ts       ← État des activités cardio
│   │   ├── routineStore.ts      ← État de la routine quotidienne
│   │   ├── templateStore.ts     ← Templates de séances
│   │   ├── exerciseStore.ts     ← Liste d'exercices custom
│   │   ├── bodyweightStore.ts   ← Poids corporel
│   │   ├── calorieStore.ts      ← Calories
│   │   └── authStore.ts         ← Utilisateur connecté (Supabase)
│   ├── db/
│   │   ├── db.ts                ← Base de données locale (Dexie/IndexedDB)
│   │   ├── supabase.ts          ← Connexion cloud Supabase
│   │   ├── exerciseInfo.ts      ← Infos sur les exercices (muscles, etc.)
│   │   └── seedTemplates.ts     ← Templates par défaut
│   └── utils/
│       ├── cloudSync.ts         ← Sync locale ↔ Supabase
│       ├── export.ts            ← Export CSV/PDF
│       ├── records.ts           ← Calcul des records personnels
│       ├── runningPlan.ts       ← Logique du plan semi-marathon
│       └── strava.ts            ← Intégration Strava/Garmin
├── index.html                   ← Point d'entrée HTML (titre, meta tags, PWA)
├── tailwind.config.js           ← Config Tailwind (couleurs custom, polices)
├── vite.config.ts               ← Config du bundler
├── vercel.json                  ← Config déploiement Vercel
└── package.json                 ← Dépendances et scripts npm
```

---

## 3. COMMENT MODIFIER L'UI — LE SYSTÈME DE STYLE

Ce projet utilise **deux systèmes de style en parallèle** :

### A) Tailwind CSS (classes dans le JSX)
Classes ajoutées directement sur les éléments HTML.

```tsx
// Exemple dans un composant .tsx
<button className="bg-primary text-white rounded-xl px-6 py-3 font-bold">
  Texte
</button>
```

| Ce que tu veux changer | Classe Tailwind | Exemple |
|---|---|---|
| Taille de texte | `text-xs` `text-sm` `text-base` `text-lg` `text-xl` `text-2xl` | `text-lg` |
| Gras | `font-normal` `font-medium` `font-semibold` `font-bold` `font-extrabold` | `font-bold` |
| Couleur texte | `text-white` `text-gray-400` | `text-white` |
| Couleur fond | `bg-primary` `bg-red-500` `bg-white/10` | `bg-primary` |
| Coins arrondis | `rounded` `rounded-lg` `rounded-xl` `rounded-2xl` `rounded-full` | `rounded-xl` |
| Padding (intérieur) | `p-2` `px-4` `py-3` `pt-2` `pb-4` | `px-6 py-3` |
| Marge (extérieur) | `m-2` `mx-auto` `mt-4` `mb-2` | `mt-4` |
| Largeur | `w-full` `w-1/2` `w-10` `w-16` | `w-full` |
| Hauteur | `h-10` `h-16` `h-full` | `h-12` |
| Bordure | `border` `border-2` `border-white/20` | `border border-white/20` |
| Ombre | `shadow` `shadow-lg` `shadow-xl` | `shadow-lg` |
| Flex | `flex` `flex-col` `items-center` `justify-between` `gap-2` | `flex items-center gap-3` |
| Opacité | `opacity-50` `opacity-80` | `opacity-70` |

### B) Style inline (style={{ }})
Quand tu vois `style={{ ... }}` dans le code, c'est du CSS direct.

```tsx
// Exemple
<button style={{
  background: 'rgba(255,107,53,0.2)',
  border: '1px solid rgba(255,107,53,0.5)',
  borderRadius: 16,
  padding: '12px 24px',
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--primary)',
}}>
  Mon bouton
</button>
```

| Propriété CSS | Ce que ça fait |
|---|---|
| `borderRadius: 16` | Coins arrondis (px) — `999` = pilule |
| `border: '1px solid rgba(255,255,255,0.2)'` | Bordure (épaisseur, style, couleur) |
| `padding: '12px 24px'` | Intérieur (haut/bas, gauche/droite) |
| `fontSize: 15` | Taille du texte en px |
| `fontWeight: 700` | Gras (400=normal, 600=semi, 700=bold, 800=extra) |
| `width: '100%'` ou `width: 200` | Largeur |
| `height: 48` | Hauteur en px |
| `gap: 8` | Espace entre éléments flex |
| `opacity: 0.7` | Transparence (0=invisible, 1=opaque) |
| `boxShadow: '0 4px 20px rgba(0,0,0,0.5)'` | Ombre portée |

---

## 4. LES VARIABLES DE COULEUR (à utiliser partout)

Définies dans `src/index.css`, utilisables avec `var(--nom)` :

```css
--primary       → orange/rouge principal     (#FF6B35)
--primary-soft  → orange plus clair          (#FF8A5C)
--primary-deep  → orange plus foncé          (#E14A0F)
--secondary     → rouge/bordeaux             (#C41E3A)

--bg-0          → fond le plus sombre        (#050505)
--bg-1          → fond très sombre           (#0E0E10)
--bg-2          → fond sombre                (#131316)
--bg-3          → fond moyen-sombre          (#1A1A1F)
--bg-4          → fond légèrement clair      (#232329)

--text          → texte blanc                (#F5F5F5)
--text-soft     → texte gris clair           (#BDBDC4)
--text-mute     → texte gris                 (#76767E)
--text-faint    → texte très gris            (#44444A)

--ok            → vert succès               (#4ADE80)
--info          → bleu info                 (#60A5FA)
--cyan          → cyan                      (#22D3EE)
```

Usage dans le code :
```tsx
style={{ color: 'var(--primary)' }}
style={{ background: 'var(--bg-3)' }}
```

---

## 5. LES CLASSES CSS CUSTOM (définies dans index.css)

Ces classes sont créées dans `src/index.css` et s'utilisent comme des classes Tailwind :

| Classe | Ce qu'elle fait |
|---|---|
| `glass` | Fond transparent effet verre (blur + bordure fine) |
| `glass-strong` | Verre plus opaque |
| `scroll-area` | Zone scrollable sans scrollbar visible |
| `ambient-bg` | Fond animé avec les halos orange/rouge |
| `tap` | Animation de "press" au toucher |
| `shimmer-text` | Texte avec effet brillant animé |
| `page-enter` | Animation d'apparition de page |
| `pulse-glow` | Pulsation lumineuse orange |
| `input-glass` | Style input sombre avec focus orange |
| `switch` | Toggle on/off |
| `t-display` | Police Bebas Neue (grands titres) |
| `t-mono` | Police monospace |
| `t-num` | Police pour les chiffres |
| `tag` | Badge/étiquette pill |
| `divider` | Ligne séparatrice fine |

---

## 6. COMMENT TROUVER UN BOUTON POUR LE MODIFIER

### Méthode 1 : Via l'inspecteur navigateur (le plus rapide)
1. Lance `npm run dev`
2. Ouvre http://localhost:5173
3. **Clic droit → Inspecter** sur l'élément à modifier
4. Dans l'onglet "Elements", tu vois les classes et styles appliqués
5. Tu peux modifier en direct dans l'inspecteur pour **prévisualiser**
6. Une fois satisfait, reporte la modif dans le vrai fichier

### Méthode 2 : Chercher dans le code
```bash
# Dans un terminal, chercher un texte affiché dans l'appli
grep -r "Nouvelle séance" src/
grep -r "btn-primary" src/
grep -r "borderRadius.*32" src/
```

### Méthode 3 : Logique par page
- Tu es sur le Dashboard ? → modifie `src/components/Dashboard.tsx`
- Sur la page séance ? → `src/components/SessionForm.tsx`
- Sur la navbar du bas ? → `src/components/Navbar.tsx`
- Un style global ? → `src/index.css`

---

## 7. EXEMPLES CONCRETS DE MODIFICATIONS

### Changer la taille d'un bouton
```tsx
// AVANT (dans le fichier .tsx)
<button style={{ padding: '12px 24px', fontSize: 15 }}>

// APRÈS (plus grand)
<button style={{ padding: '16px 32px', fontSize: 18 }}>
```

### Changer les coins arrondis (border-radius)
```tsx
// Coins légèrement arrondis
style={{ borderRadius: 8 }}

// Coins très arrondis
style={{ borderRadius: 24 }}

// Pilule parfaite
style={{ borderRadius: 999 }}
```

### Changer l'épaisseur/couleur d'une bordure
```tsx
// Bordure fine discrète
style={{ border: '1px solid rgba(255,255,255,0.1)' }}

// Bordure épaisse orange
style={{ border: '2px solid var(--primary)' }}

// Pas de bordure
style={{ border: 'none' }}
```

### Changer la couleur de fond d'un bouton
```tsx
// Orange plein
style={{ background: 'var(--primary)' }}

// Orange transparent
style={{ background: 'rgba(255,107,53,0.2)' }}

// Verre sombre
style={{ background: 'rgba(255,255,255,0.06)' }}
```

---

## 8. FAIRE UNE BACKUP AVANT DE MODIFIER

### Option A — Git (recommandé, déjà en place)

**Avant de toucher quoi que ce soit :**
```bash
# Voir l'état actuel
git status

# Créer un point de sauvegarde avec un nom clair
git add -A
git commit -m "backup avant modifs UI boutons"
```

**Si tu veux annuler et revenir en arrière :**
```bash
# Voir la liste des sauvegardes
git log --oneline

# Revenir à la sauvegarde (remplace abc1234 par l'ID affiché)
git checkout abc1234
# OU pour annuler les dernières modifs non sauvegardées
git restore .
```

### Option B — Branche de test (pour garder les deux versions)
```bash
# Créer une branche "expérience" séparée
git checkout -b test-ui-modifs

# Faire tes modifs...
# Si ça marche → fusionner sur master
git checkout master
git merge test-ui-modifs

# Si ça marche pas → supprimer la branche
git checkout master
git branch -D test-ui-modifs
```

### Option C — Copie manuelle (le plus simple sans connaissance Git)
```bash
# Copier le fichier avant de le toucher
cp src/components/Dashboard.tsx src/components/Dashboard.tsx.bak

# Restaurer si besoin
cp src/components/Dashboard.tsx.bak src/components/Dashboard.tsx
```

---

## 9. LA VERSION VERCEL VS LA VERSION LOCALE

### Situation actuelle
```
Version sur Vercel (en ligne)  ←  C'est la dernière version déployée
Version locale sur ton PC      ←  Peut avoir des modifs non déployées
```

### Comment récupérer/sauvegarder la version Vercel actuelle
La version Vercel **vient de ton dépôt Git local**. Si ton local est à jour avec ce qui a été déployé :
```bash
git log --oneline   # Voir les commits déployés
```

Pour t'assurer que ta version locale correspond à ce qui est en ligne :
```bash
# Télécharger les dernières modifs depuis GitHub (si tu as un remote)
git pull origin master
```

### Télécharger le build Vercel (backup du site compilé)
Si tu veux garder une copie du site tel qu'il tourne actuellement :
```bash
# Compiler localement (crée le dossier dist/)
npm run build

# Le dossier dist/ contient le site complet compilé
# Tu peux le copier ailleurs pour archivage
cp -r dist/ ~/Desktop/backup-trackermuscu-$(date +%Y%m%d)/
```

---

## 10. DÉPLOYER SUR VERCEL

### Déploiement automatique (ce qui se passe normalement)
Vercel regarde ton dépôt GitHub. Dès que tu push un commit sur `master`, Vercel redéploie automatiquement.

```bash
# 1. Sauvegarder tes modifs en local
git add -A
git commit -m "ma modification de l'UI"

# 2. Envoyer sur GitHub → Vercel redéploie automatiquement
git push origin master
```

### Vérifier que le déploiement a marché
- Va sur le dashboard Vercel dans ton navigateur
- Ou installe le CLI Vercel : `npm i -g vercel` puis `vercel status`

### ATTENTION avant de déployer
```bash
# Toujours vérifier qu'il n'y a pas d'erreurs de compilation
npm run build

# S'il y a des erreurs TypeScript, elles s'affichent ici
# Vercel échouera aussi si npm run build échoue
```

---

## 11. FLUX DE TRAVAIL RECOMMANDÉ

### Pour tester une modification sans risque

```
1. git add -A && git commit -m "backup"    ← sauvegarde
2. npm run dev                              ← lancer local
3. Modifier le fichier dans un éditeur      ← ex: VS Code ou nano
4. Voir le résultat sur http://localhost:5173 (live)
5. Si OK  → git add -A && git commit && git push
   Si KO  → git restore .   (annule tout)
```

### Éditeur de texte recommandé pour modifier les fichiers
- **VS Code** (le mieux) — ouvrir le dossier TrackerMuscu, puis cliquer sur le fichier
- **Gedit** sur Linux — clic droit sur un fichier → "Ouvrir avec Gedit"
- **nano** dans le terminal : `nano src/components/Dashboard.tsx`

---

## 12. ANATOMIE D'UN COMPOSANT TSX (pour lire le code)

```tsx
// Les imports en haut : ce dont le composant a besoin
import { useState } from 'react';
import { Icons } from './Icons';

// Le composant = une fonction qui retourne du JSX (HTML-like)
export default function MonComposant() {

  // useState = une valeur qui peut changer + déclenche un re-rendu
  const [ouvert, setOuvert] = useState(false);

  // Le JSX = ce qui est affiché
  return (
    <div style={{ padding: 16 }}>

      {/* Un bouton avec style inline */}
      <button
        onClick={() => setOuvert(!ouvert)}
        style={{
          background: 'var(--primary)',
          borderRadius: 12,
          padding: '10px 20px',
          color: 'white',
          border: 'none',
          fontSize: 15,
          fontWeight: 700,
        }}
      >
        Cliquer
      </button>

      {/* Affichage conditionnel : s'affiche seulement si ouvert === true */}
      {ouvert && (
        <p style={{ color: 'var(--text-soft)', marginTop: 8 }}>
          Contenu affiché !
        </p>
      )}

    </div>
  );
}
```

**Points clés :**
- `{}` dans le JSX = du JavaScript à l'intérieur du HTML
- `style={{ }}` = double accolades (une pour JSX, une pour l'objet CSS)
- Les noms CSS en camelCase : `border-radius` → `borderRadius`, `font-size` → `fontSize`
- `className=` pour les classes Tailwind (pas `class=`)

---

## 13. RACCOURCIS UTILES

```bash
# Chercher un texte dans tous les fichiers source
grep -r "texte à chercher" src/

# Chercher un style spécifique
grep -r "borderRadius.*32" src/components/

# Voir les dernières sauvegardes Git
git log --oneline -10

# Annuler toutes les modifs non sauvegardées
git restore .

# Voir ce qui a changé depuis la dernière sauvegarde
git diff
```

---

*Fichier généré le 2026-04-28 — Guide d'autonomie TrackerMuscu*
