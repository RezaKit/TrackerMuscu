# RezaKit — Roadmap & Plan de lancement complet

---

## État actuel de l'app (mai 2026)

### Fonctionnel à 100%

- Tracking musculation (5 types, 150+ exercices, templates, PRs, historique)
- Tracking cardio (course + natation, import Strava)
- Nutrition (calories in/out, objectif, net journalier, import Garmin/Strava)
- Poids corporel (pesée, delta, graphe)
- Routine du soir (items custom, streaks)
- Coach IA Gemini 2.5 Flash (chat + 11 actions directes : create_session, create_template, log_weight, add_calorie, add_cardio, periodization plan, etc.)
- Photos de progression (upload Supabase, galerie, viewer)
- Analytics et graphes
- Export CSV + export texte hebdo
- Cloud sync Supabase (push debounced + restore au login)
- Onboarding 5 étapes
- Plan semi-marathon 27 semaines
- Timer de repos
- PWA installable iOS
- Calendrier mensuel
- OAuth Strava complet
- OAuth Garmin complet (en attente approbation)

### Ce qui manque pour monétiser

- [ ] **Stripe paywall** — aucun système de paiement en place
- [ ] **Gating des features Pro** — tout est gratuit sans limite
- [ ] **Domaine resakit.fr** — pas encore configuré sur Vercel
- [ ] **Garmin** — code complet, en attente d'approbation développeur
- [ ] **Plan running** — hardcodé avr–nov 2026, à rendre configurable

---

## Plan de lancement — 5 phases

---

### Phase 0 — Fondations techniques (1–2 semaines)

Objectif : l'app est prête à recevoir des utilisateurs payants.

#### 1. Configurer resakit.fr sur Vercel (30 min)

```
Vercel → Settings → Domains → Ajouter resakit.fr
Registrar DNS :
  A      @    76.76.21.21
  CNAME  www  cname.vercel-dns.com
```
HTTPS auto via Let's Encrypt. Coût : 0€ supplémentaire.

#### 2. Configurer Supabase pour le nouveau domaine

Dans Supabase → Authentication → URL Configuration :
- Site URL : `https://resakit.fr`
- Redirect URLs : ajouter `https://resakit.fr/**`

#### 3. Intégrer Stripe (2–3 jours de dev)

**Setup Stripe :**
```
npm install @stripe/stripe-js stripe
```

**Prix à créer dans Stripe Dashboard :**
- `price_pro_monthly` : 4,99€/mois
- `price_pro_yearly` : 34,99€/an (économie 30%)

**Tables Supabase à ajouter :**
```sql
ALTER TABLE auth.users ADD COLUMN is_pro boolean DEFAULT false;
ALTER TABLE auth.users ADD COLUMN stripe_customer_id text;
ALTER TABLE auth.users ADD COLUMN pro_expires_at timestamptz;
```

**API Vercel à créer :**
- `/api/stripe/create-checkout.ts` — génère une session Stripe Checkout
- `/api/stripe/webhook.ts` — reçoit les events Stripe (payment_succeeded, subscription_cancelled)

**Variable Vercel à ajouter :**
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**Logique de gating :**
- `authStore` : ajouter `isPro: boolean` lu depuis Supabase
- Features Pro : Coach IA, cloud sync, photos, Strava/Garmin, analytics complets
- Features gratuites : séances basiques, calendrier, cardio manuel

#### 4. Plan running configurable

Remplacer le plan hardcodé par un formulaire : date de départ + objectif (5k / 10k / semi / marathon). Stocké dans `user_profile` localStorage.

---

### Phase 1 — Premiers utilisateurs (semaines 3–6)

Objectif : 50 utilisateurs actifs hebdomadaires avant d'activer le paywall.

**Règle absolue : pas de paywall pendant cette phase. On veut du feedback.**

#### Canal 1 — Entourage immédiat (Jour 1)

WhatsApp à tous les contacts qui font du sport :
```
Salut, j'ai construit une app fitness avec un coach IA intégré.
Elle connaît tous tes PRs et crée des séances depuis le chat.
C'est gratuit pour l'instant, je cherche des testeurs.
resakit.fr
```
Objectif : 10 installs la première semaine.

#### Canal 2 — Reddit francophone (Semaine 1)

Ordre de priorité :
1. `r/frenchfitness` — le plus pertinent
2. `r/france` — angle "j'ai construit ça seul"
3. `r/developpeurs` — angle technique
4. `r/Fitness` (EN) — plus de trafic

Règles Reddit (à ne pas ignorer) :
- Commenter des posts 3 jours avant de poster
- Toujours préciser "je suis le créateur"
- Ne jamais poster le lien dans les commentaires sans qu'on le demande
- Attendre 48h entre deux posts dans des subs différents

#### Canal 3 — TikTok / Instagram Reels (Semaine 2, puis quotidien)

**1 vidéo par jour minimum pendant 4 semaines.**

Types de vidéos qui fonctionnent :

*"J'ai construit ça"* (le plus viral)
```
"J'ai passé 6 mois à construire une app fitness parce que
j'en avais marre des apps à 15€/mois qui ne font rien."
[screen recording app]
"Elle a un coach IA qui connaît tous mes PRs."
"Elle crée mes séances depuis le chat."
"Gratuite pour l'instant. resakit.fr"
```

*"Le coach IA dit ça quand..."*
- Screenshot d'une vraie conversation avec le coach
- "J'ai demandé au coach de me créer un plan 4 semaines..."
- "J'ai dit au coach que j'avais mal à l'épaule..."

*"Mon tracking du jour"*
- Screen recording d'une vraie séance trackée
- Résultat + commentaire du coach

*"Features que personne ne connaît"*
- 1 feature par vidéo, 30 secondes

Format : 30–60s · Screen recording + voix off · Sous-titres auto · Son tendance

Hashtags : `#fitness #musculation #coachIA #buildinpublic #gymfr #rezakit`

#### Canal 4 — DMs micro-influenceurs (10/jour dès semaine 2)

Cibles : comptes Instagram/TikTok fitness FR entre 500 et 15k abonnés.

Message DM :
```
Salut [prénom],

Je développe RezaKit, une app fitness avec un coach IA qui connaît
tous tes PRs et crée des séances directement depuis le chat.
PWA installable, gratuite en ce moment.

Je cherche des créateurs pour tester et en parler si ça leur plaît.
Accès Pro à vie si tu testes honnêtement.

Tu serais partant(e) ?
```

Tableur de suivi : Nom | Plateforme | Abonnés | Date DM | Réponse | Statut

#### Canal 5 — ProductHunt (Semaine 4)

- Créer compte 2 semaines avant, commenter d'autres projets
- Lancer à minuit PST (9h France)
- Description en anglais, screenshots propres
- Demander à l'entourage de voter le matin du lancement

Tagline : `RezaKit — The AI fitness coach that knows all your PRs`

#### Canal 6 — Twitter/X #buildinpublic (chaque semaine)

Post hebdo type :
```
Semaine [X] de #buildinpublic — RezaKit

✅ [ce qui a marché]
❌ [ce qui n'a pas marché]
📊 [utilisateurs / sessions trackées / messages coach envoyés]
🎯 Semaine prochaine : [X]

[screenshot ou screen recording]
```

Comptes à cibler : @levelsio @marc_louvion @guilhemdb

---

### Phase 2 — Activer la monétisation (Mois 2–3)

Déclencheur : 50+ utilisateurs actifs hebdomadaires.

#### Activation du paywall

**Email aux beta testeurs (Brevo, gratuit) :**
```
Sujet : RezaKit passe en freemium — tu gardes l'accès Pro 3 mois

[Prénom],

Tu fais partie des premiers utilisateurs de RezaKit.
Merci de nous avoir fait confiance depuis le début.

À partir du [date], RezaKit passe en freemium :

Plan Gratuit (pour toujours) :
→ Tracking séances musculation
→ Calendrier
→ Cardio manuel

Plan Pro (4,99€/mois ou 34,99€/an) :
→ Coach IA complet avec actions directes
→ Cloud sync multi-appareils
→ Photos de progression
→ Import Strava + Garmin
→ Analytics complets

En tant que bêta testeur, tu gardes le Pro complet
gratuit pendant encore 3 mois. Aucune action requise.

Si RezaKit t'aide vraiment — partage-le à un ami qui fait du sport.
C'est le meilleur cadeau que tu puisses nous faire.

Reza
```

#### Structure tarifaire

| Plan | Prix | Contenu |
|------|------|---------|
| Gratuit | 0€ | Séances, calendrier, cardio basique |
| Pro Mensuel | 4,99€/mois | Tout : IA, sync, photos, intégrations |
| Pro Annuel | 34,99€/an | Idem + économie 42% |
| Lifetime (limité) | 79€ une fois | Lancement uniquement, 50 places max |

**L'offre Lifetime au lancement est une tactique puissante :**
- Génère du cash immédiat
- Crée de vrais early adopters investis
- Limite à 50 places → urgence réelle, pas fabriquée

#### Setup emailing (Brevo, gratuit)

1. Créer compte Brevo
2. Formulaire d'opt-in dans l'onboarding (après slide 5)
3. Séquence welcome (3 emails sur 7 jours) :
   - J+0 : "Bienvenue sur RezaKit, voici comment démarrer"
   - J+3 : "5 choses que le Coach IA peut faire pour toi"
   - J+7 : "Ta première semaine — bilan + tips"
4. Newsletter mensuelle : nouveautés + stats de la communauté

---

### Phase 3 — Croissance (Mois 3–6)

Objectif : 200+ utilisateurs actifs, 20–50 abonnés payants.

#### IndieHackers

Poster le projet sur indiehackers.com avec l'historique complet.
Titre : "Building a French fitness app with AI coach — Month 1 update"
Contenu : chiffres réels, leçons apprises, prochaines étapes.
Les makers retweetent et votent naturellement.

#### Partenariats salle de sport

Approcher des coaches sportifs indépendants (Instagram 1k–20k) :
- Commission 30% sur chaque abonnement référé (Stripe Affiliate)
- Lien affilié unique par coach
- Dashboard simple pour tracker leurs conversions

#### Contenu SEO (landing/index.html)

Pages à créer sur resakit.fr :
- `/` — Home avec demo vidéo et features
- `/coach-ia` — Page dédiée au coach IA (le mot clé "coach fitness IA" a du volume)
- `/vs/myfitnesspal` — Comparatif
- `/vs/hevy` — Comparatif (Hevy est très recherché)
- Blog : "Comment tracker sa musculation efficacement"

Ces pages ne coûtent rien et ramènent du trafic organique permanent.

---

### Phase 4 — App Store (Mois 4–5)

**Prérequis :**
- 20+ utilisateurs actifs avec retours positifs
- Stripe en production, premiers revenus
- Budget 99€ (Apple Developer)

**Steps :**

1. Intégrer Capacitor
```bash
npm install @capacitor/core @capacitor/ios @capacitor/camera
npx cap init RezaKit fr.resakit.app
npx cap add ios
```

2. Assets App Store requis
   - Icône 1024×1024 PNG (fond opaque obligatoire)
   - Screenshots iPhone 15 Pro Max (6.7") — 3 minimum, 10 max
   - Description FR + EN
   - Privacy policy : resakit.fr/confidentialite (déjà dans /landing/)
   - Review notes pour Apple (expliquer le fonctionnement IA)

3. Règles Apple importantes
   - Clé API Gemini entrée par l'utilisateur = pas de violation
   - Achats intégrés (Pro) DOIVENT passer par StoreKit si vendu depuis l'App Store (Apple prend 30%)
   - Solution : garder Stripe pour les abonnements web, StoreKit pour iOS

4. Au lancement App Store
   - Email à toute la liste
   - Post TikTok/Reddit/Twitter "c'est live"
   - DMs aux influenceurs qui avaient testé la beta

---

### Phase 5 — Scale (Mois 6–12)

#### Android (PWA suffit, pas besoin de Play Store en priorité)

La PWA fonctionne sur Android via Chrome. Pas besoin de wrapper natif dans un premier temps. À faire seulement si la demande est forte.

#### API publique / webhooks

Permettre aux coachs professionnels d'accéder aux données de leurs clients via API. Modèle B2B léger — tarification différente (19€/mois par coach).

#### Communauté Discord

Créer un serveur Discord RezaKit à 500+ utilisateurs :
- Channel #bilan-semaine (poster son export hebdo)
- Channel #records (fêter les PRs)
- Channel #coach-ia-tips (partager des prompts utiles)
- Role "Pro" automatique via bot pour les abonnés

La communauté réduit le churn (les gens restent abonnés pour la communauté autant que pour l'app).

---

## Modèle économique complet

### Revenus directs

| Source | Prix | Marge |
|--------|------|-------|
| Pro Mensuel | 4,99€/mois | ~97% (juste frais Stripe 1,5%+0,25€) |
| Pro Annuel | 34,99€/an | ~97% |
| Lifetime | 79€ | ~97% |
| Coachs B2B | 19€/mois | ~97% |

### Revenus indirects (futur)

| Source | Modèle |
|--------|--------|
| Programme d'affiliation | 30% des abonnements référés |
| Whitelabel | App custom pour salles de sport (500€ setup + 99€/mois) |
| Données anonymisées | Agrégat tendances fitness (opt-in strict, RGPD) |

### Projections réalistes

| Mois | Utilisateurs actifs | Abonnés Pro | Revenus |
|------|--------------------|--------------|---------| 
| 1 | 10–30 | 0 | 0€ |
| 2 | 30–80 | 0 | 0€ |
| 3 | 80–150 | 5–15 + Lifetime | 100–400€ |
| 4 | 150–300 | 15–30 | 75–150€/mois |
| 5 | 300–600 | 30–70 | 150–350€/mois |
| 6 | 600–1200 | 70–150 | 350–750€/mois |
| 12 | 2000–5000 | 200–400 | 1000–2000€/mois |

Ces chiffres supposent : TikTok régulier + outreach actif + App Store en mois 5.

---

## Checklist lancement immédiat

### Cette semaine
- [ ] Configurer resakit.fr → Vercel (DNS + HTTPS)
- [ ] Mettre à jour Supabase redirect URL → resakit.fr
- [ ] Créer compte Stripe, activer les produits Pro
- [ ] Créer compte Brevo, préparer la liste email
- [ ] Créer compte TikTok + Instagram avec handle @rezakit

### Semaine 2
- [ ] Intégrer Stripe Checkout dans l'app (create-checkout + webhook)
- [ ] Ajouter `is_pro` dans authStore
- [ ] Gater les features Pro dans le code
- [ ] Filmer et poster la première vidéo TikTok
- [ ] Envoyer WhatsApp aux contacts sportifs

### Semaine 3–4
- [ ] 1 vidéo TikTok/jour
- [ ] Post Reddit r/frenchfitness
- [ ] 10 DMs influenceurs/jour
- [ ] Préparer ProductHunt launch
- [ ] Stripe en mode live, tester le flow complet

### Mois 2
- [ ] ProductHunt lancement
- [ ] Activer paywall (si 50+ utilisateurs actifs)
- [ ] Email grandfathering aux beta testeurs
- [ ] Offer Lifetime à 50 places

---

## Stack et coûts mensuels

| Service | Plan | Coût |
|---------|------|------|
| Vercel | Hobby | 0€ |
| Supabase | Free (500MB) | 0€ → 25€/mois à 500+ users |
| Stripe | Pay-as-you-go | 1,5% + 0,25€/transaction |
| Brevo | Free (300 emails/jour) | 0€ → 25€/mois à 20k emails |
| domaine resakit.fr | Déjà payé | 0€ |
| Apple Developer | 99€/an | ~8€/mois |
| **TOTAL mois 1–4** | | **~8€/mois** |
| **TOTAL mois 5+** | | **~35–60€/mois** |

---

## Ce qu'il ne faut pas faire

- Payer des pubs avant d'avoir 100 utilisateurs organiques
- Ajouter des features avant d'avoir du feedback utilisateur
- Poster une fois et attendre (la régularité est tout)
- Changer de stratégie avant 4 semaines complètes
- Baisser le prix sous 4,99€ (signal de mauvaise qualité)
- Viser les gros influenceurs (ignorent ou demandent 500–2000€)
- Faire l'App Store avant d'avoir des utilisateurs et des revenus
