# Procédure pour réparer les emails (signup + reset password)

> Tu m'as dit : « j'ai créé un compte, ça charge dans le vide puis ❌ {} »
> et « mot de passe oublié → ✓ Email envoyé puis 20s plus tard ❌ Erreur : {} ».
>
> **Cause racine :** Supabase n'arrive pas à envoyer l'email — soit le SMTP custom (Resend) n'est pas branché, soit le rate limit par défaut (4 emails/h !) est explosé. Le `{}` vient de `error.message` vide quand Supabase fait timeout sur l'envoi SMTP.
>
> **Côté code (déjà fait dans ce push) :**
> - on log l'erreur complète dans la console (`F12` → onglet Console)
> - on ne mange plus les `{}` muets — on traduit en message clair (« le serveur mail n'est pas configuré », « réessaie plus tard », etc.)
> - on bloque le double-clic (Enter + tap simultanés qui doublait l'appel et tapait le rate limit)
> - signup pose maintenant `emailRedirectTo: https://resakit.fr` (sinon le lien dans l'email pointait vers localhost si le « Site URL » Supabase est mal réglé)
>
> Mais le code seul ne suffit pas : **Supabase doit avoir un SMTP qui marche**. Voilà ce que tu dois faire toi.

---

## 0. Diagnostic 30 sec — où est-on ?

Va sur **https://supabase.com/dashboard** → ton projet RezaKit → menu de gauche **Authentication** → onglet **Logs**.

Tu vois 1 ligne par tentative. Cherche les `email_send_failed` ou `over_email_send_rate_limit`.

| Ce que tu vois | Ce qui se passe |
|---|---|
| `over_email_send_rate_limit` | Tu as épuisé les 4 emails/h du SMTP par défaut Supabase. Solution = **passer sur Resend (étape 2)**. |
| `email_send_failed` | Le SMTP est branché mais foire. Solution = **vérifier les DNS Resend (étape 3)**. |
| `Error: SMTP relay error: 535` | Mot de passe SMTP faux. Solution = **régénérer la clé Resend (étape 2.D)**. |
| Aucune ligne, juste 200 OK | Email parti côté Supabase mais bloqué côté Gmail (spam ou bounce). Solution = **DNS DKIM + DMARC manquants (étape 3)**. |

---

## 1. Vérifier le « Site URL » Supabase (1 min, OBLIGATOIRE)

Sans ça, les liens dans les emails de confirm / reset partent vers `localhost:3000` et ne marchent pas.

1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. **Site URL :** `https://resakit.fr`
3. **Redirect URLs (Additional) :** ajoute (un par ligne) :
   ```
   https://resakit.fr
   https://resakit.fr/*
   https://resakit.fr/?reset=true
   ```
4. Save.

> Si ce champ pointait sur autre chose, c'est probablement déjà 50 % du bug.

---

## 2. Brancher Resend (SMTP custom) — **30 min, indispensable**

Le SMTP par défaut de Supabase est **rate-limited à 4 emails / heure / projet**. Donc dès que toi + un pote testez, ça pète. Resend = 3 000 emails/mois gratuits, 10 fois plus rapide, et ça part depuis `noreply@resakit.fr` (pro).

J'ai déjà écrit le guide complet dans **`SUPABASE_EMAIL_SETUP.md`** (fichier à la racine du repo). Suis-le étape par étape :

1. **§3** Crée le compte Resend (5 min)
2. **§4** Vérifie le domaine `resakit.fr` (DNS chez OVH/Cloudflare/etc — c'est l'étape la plus longue, 5–60 min de propagation)
3. **§5** Colle les credentials SMTP Resend dans Supabase (Project Settings → Authentication → SMTP Settings → Enable Custom SMTP)
4. **§6** Personnalise les 6 templates email (le HTML pro est fourni dans le guide — copie-colle)
5. **§7** Règle les rate limits Supabase (Authentication → Rate Limits)

> ⚠️ Sans avoir fait l'étape **§4 (DNS)** avec les 3 records (MX + 2× TXT), Resend refuse d'envoyer et tu auras toujours `email_send_failed`.

---

## 3. Vérifier que les DNS sont bons (5 min)

Une fois les DNS posés chez ton registrar, vérifie depuis n'importe quel terminal :

```bash
# SPF (anti-spam) — doit contenir "include:_spf.resend.com" ou "v=spf1 ... resend"
dig TXT resakit.fr +short

# DKIM (signature des emails)
dig TXT resend._domainkey.resakit.fr +short

# DMARC (politique anti-phishing) — recommandé
dig TXT _dmarc.resakit.fr +short
```

Si l'un des 3 ne renvoie rien : la propagation DNS n'est pas finie (jusqu'à 1 h selon le registrar). Re-teste plus tard.

Si SPF/DKIM apparaissent **mais que les emails finissent encore en spam Gmail** :

1. Ajoute un record DMARC (s'il n'existe pas) :
   - Type : `TXT`
   - Nom : `_dmarc`
   - Valeur : `v=DMARC1; p=none; rua=mailto:nathantamtsi@gmail.com`
2. Attends 1 h.
3. Re-test.

---

## 4. Tester proprement (5 min)

### A. Test via le bouton « Send password recovery » dans Supabase

1. Supabase → Authentication → **Users**
2. Trouve un user de test (ou crée-en un avec un email à toi)
3. Clique les `…` à droite → **Send password recovery**
4. Tu dois recevoir un mail venant de `RezaKit <noreply@resakit.fr>` (pas de l'adresse generic Supabase)

Si ça arrive ✅ → SMTP OK, le problème dans l'app était bien le rate-limit.
Si ça arrive PAS → le problème est SMTP. Va voir Resend Dashboard → onglet **Logs** : tu verras la raison exacte.

### B. Test depuis l'app (avec les nouveaux logs)

1. Ouvre `https://resakit.fr` sur Chrome desktop
2. `F12` → onglet **Console**
3. Essaie de créer un compte ou un reset → maintenant tu vas voir :
   ```
   [auth.signUp] error: AuthError { code: ..., status: ..., message: ... }
   ```
4. **Copie-moi cette ligne complète si ça foire encore.** On saura exactement ce qui plante.

---

## 5. Pour le compte test `jowth11@gmail.com` qui était cassé

Avec l'ancien code, il est possible que le user a été **partiellement créé** (entrée dans `auth.users` mais pas confirmée, et confirmation email jamais reçue). Pour repartir propre :

1. Supabase → Authentication → **Users**
2. Filtre sur `jowth11@gmail.com`
3. Si trouvé : `…` → **Delete user**
4. Refais un signup propre depuis l'app (une fois Resend branché).

---

## 6. Bonus : éviter le blocage automatique

Pendant qu'on y est, dans Supabase → Authentication → **Settings** :

- ✅ **Enable email confirmations** : activé (sinon n'importe qui peut signup avec un email à toi)
- ✅ **Allow new users to sign up** : activé (sinon plus aucun signup ne passe)
- **Max failed sign-in attempts** : 5 (par défaut) — laisse
- **Lockout duration** : 1 h (par défaut) — laisse

---

## TL;DR — ce qui te reste à faire concrètement

1. ⏱️ 1 min : régler **Site URL = https://resakit.fr** dans Supabase (étape 1)
2. ⏱️ 30 min : suivre **SUPABASE_EMAIL_SETUP.md** pour brancher Resend (étape 2)
3. ⏱️ 5 min : vérifier les DNS avec `dig` + ajouter DMARC (étape 3)
4. ⏱️ 5 min : tester avec le user de test + ouvrir la console F12 (étape 4)
5. ⏱️ 1 min : supprimer le user `jowth11@gmail.com` cassé pour tester clean (étape 5)

Total ≈ **45 min** une bonne fois pour toutes.

Si après ça tu as encore un bug, copie-moi la ligne exacte de la console Chrome F12 qui commence par `[auth.signUp]` ou `[auth.reset]` — avec ce log on cible direct le vrai problème.
