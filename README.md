# 🏋️ TRACKER MUSCU

App iOS de suivi d'entraînement minimaliste, offline-first et 100% local.

## 🚀 Quick Start

### Installation
```bash
npm install
```

### Développement
```bash
npm run dev
```
Ouvre `http://localhost:5173` dans Safari sur ton iPhone.

### Build Production
```bash
npm run build
```

## 📱 Features

✅ **Musculation**
- PPL / Upper-Lower tracking
- Poids + Reps + Séries
- 150+ exercices presets
- Créer exercices custom
- Templates sauvegardés
- Quick-add exercices
- Historique par exercice

✅ **Course & Natation**
- Distance + Temps
- Historique complet

✅ **Analytiques**
- Graphiques progression
- Stats globales
- Volume total

✅ **Data**
- 100% local (IndexedDB)
- Export CSV
- Offline-first

## 🎨 Design

- **Colors**: Orange (#FF6B35) / Red (#C41E3A) / Black (#1a1a1a)
- **Dark mode** obligatoire
- **Minimaliste** et clean

## 📁 Structure

```
src/
├── components/        # React components
├── db/               # Dexie database + seeds
├── stores/           # Zustand stores
├── types/            # TypeScript types
├── utils/            # Helpers (export, etc)
├── App.tsx
└── main.tsx
```

## 🔧 Tech Stack

- **React 18** + TypeScript
- **Vite** (build tool)
- **Tailwind CSS** (styling)
- **Dexie** (IndexedDB wrapper)
- **Zustand** (state management)
- **Recharts** (graphs)

## 📋 Workflow

1. Lance l'app
2. "Nouvelle séance" → Choisir type (Push/Pull/Legs/Upper/Lower)
3. Ajouter exercices (presets ou custom)
4. Tracking:
   - Poids (kg) → Reps → Série → Valider
   - Voir historique live
5. Fin de séance → Enregistré localement

## 📊 Analytics

- Sélectionner exercice → voir graphique progression
- Stats globales: volume, séances, tendances
- Export données en CSV

## 💾 Données

Tout est stocké **localement** dans IndexedDB:
- Sessions musculation
- Course / Natation
- Poids corporel
- Templates

**Aucune donnée n'est envoyée au cloud.**

## 🌐 PWA

App fonctionne **offline**:
1. Service workers cachent assets
2. IndexedDB fonctionne sans internet
3. Ajoute à l'écran d'accueil (iOS)

## 📱 Mobile Optimized

- Responsive design
- Optimisé pour iPhone 6"+
- Touch-friendly buttons
- Fast loading

## 🔄 Synchro iCloud (Future)

Optionnel: backup automatique sur iCloud.

## 📧 Support

Si problème:
1. Check console (F12)
2. Verify IndexedDB (Application tab)
3. Clear cache if needed

---

**Ready to get swole! 💪**
