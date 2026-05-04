# Setup Supabase emails pro + Cron rapport hebdo — Guide pas-à-pas

> **Pour qui ?** Toi, Reza, sans Claude, en 30 minutes, à n'importe quel moment.
> Suis les étapes dans l'ordre — ne saute rien.

---

## Sommaire

1. [Prérequis (5 min)](#1-prérequis)
2. [Acheter le domaine resakit.fr — déjà fait](#2-domaine)
3. [Créer un compte Resend (envoi d'emails)](#3-créer-resend)
4. [Vérifier le domaine resakit.fr dans Resend](#4-vérifier-domaine-resend)
5. [Configurer Supabase pour utiliser Resend (SMTP custom)](#5-supabase-smtp-resend)
6. [Personnaliser les templates email Supabase (FR pro)](#6-templates-email-supabase)
7. [Régler les rate limits + bans Supabase](#7-rate-limits-bans)
8. [Activer le rapport hebdo dimanche 22h sur Vercel](#8-rapport-hebdo-vercel)
9. [Tester que tout marche](#9-tester)
10. [Annexe : variables d'env recap + dépannage](#10-annexe)

---

<a id="1-prérequis"></a>
## 1. Prérequis

Tu as déjà :
- ✅ Domaine `resakit.fr` (configuré chez ton registrar)
- ✅ Projet Supabase (`https://supabase.com/dashboard`)
- ✅ Projet Vercel pour `resakit.fr`

Tu vas avoir besoin de :
- Accès à ton **registrar du domaine** (OVH / Gandi / Namecheap / Cloudflare…) pour ajouter des enregistrements DNS
- **30 min** sans interruption

---

<a id="2-domaine"></a>
## 2. Domaine `resakit.fr`

Rien à faire ici, tu l'as déjà. On va juste **ajouter des DNS** (étape 4) pour que Resend puisse envoyer en ton nom.

---

<a id="3-créer-resend"></a>
## 3. Créer un compte Resend

Resend = service d'envoi d'email moderne. **3 000 emails/mois gratuits**, 10x mieux que le SMTP Supabase par défaut (qui est limité à 4/h !).

### Étapes

1. Va sur [https://resend.com/signup](https://resend.com/signup)
2. Crée un compte avec **ton email perso** (`jozer717606@gmail.com`)
3. Confirme ton email
4. Tu arrives sur le dashboard Resend

### Récupérer une clé API

1. Dans le menu de gauche → **API Keys**
2. Clique **Create API Key**
3. Donne un nom : `RezaKit Production`
4. Permission : **Sending access** (par défaut, c'est bon)
5. Domain : laisse `All domains` (on va vérifier resakit.fr juste après)
6. Clique **Create**
7. **COPIE LA CLÉ** qui commence par `re_...` (elle ne s'affiche qu'une fois !)
8. Colle-la dans un fichier temporaire genre `notes.txt` — on en aura besoin

> ⚠️ Si tu perds la clé, tu peux toujours en créer une nouvelle plus tard.

---

<a id="4-vérifier-domaine-resend"></a>
## 4. Vérifier le domaine `resakit.fr` dans Resend

C'est l'étape la plus longue (5 min) mais après tu peux envoyer depuis `noreply@resakit.fr` comme un vrai pro.

### A. Ajouter le domaine dans Resend

1. Resend → menu de gauche → **Domains**
2. Clique **Add Domain**
3. Tape : `resakit.fr`
4. Region : `EU (Ireland)` (plus rapide pour la France)
5. Clique **Add**

Resend t'affiche maintenant **3 enregistrements DNS** à copier dans ton registrar :
- 1× MX
- 1× TXT pour SPF
- 1× TXT pour DKIM (avec un nom genre `resend._domainkey`)

**Ne ferme pas cette page Resend.** On y revient à la fin.

### B. Ajouter les DNS dans ton registrar

Selon ton registrar :

#### Si tu es chez **OVH** :
1. Espace client OVH → **Domaines** → `resakit.fr` → onglet **Zone DNS**
2. Pour chaque enregistrement à ajouter dans Resend :
   - Clique **Ajouter une entrée**
   - Choisis le type (MX / TXT)
   - Recopie **exactement** : sous-domaine, target/valeur, priorité (pour MX)
   - Valide
3. Attends 5 min

#### Si tu es chez **Cloudflare** :
1. Cloudflare dashboard → `resakit.fr` → onglet **DNS**
2. Pour chaque enregistrement :
   - Clique **Add record**
   - Type / Name / Content : recopie exactement
   - **DÉSACTIVE le proxy (nuage gris, pas orange)** sur les enregistrements MX et TXT
   - Save
3. Attends 5 min

#### Si tu es chez **Gandi / Namecheap / autre** :
1. Cherche `DNS` ou `Zone DNS` ou `DNS records`
2. Ajoute chacun des 3 enregistrements à l'identique

### C. Vérifier dans Resend

1. Retour sur la page Resend du domaine `resakit.fr`
2. Clique **Verify DNS Records** (en haut)
3. Si vert ✅ partout → c'est bon
4. Sinon attends 10 min et clique encore. La propagation DNS peut prendre jusqu'à 1h selon le registrar.

> 💡 Pour tester pendant l'attente, tape dans un terminal : `dig TXT resakit.fr` — tu dois voir le TXT SPF apparaître.

### D. Copier le SMTP de Resend (pour Supabase)

Une fois le domaine vérifié :
1. Resend → menu de gauche → **SMTP**
2. Tu vois ces infos (note-les) :
   ```
   Host:     smtp.resend.com
   Port:     465  (SSL/TLS)
   Username: resend
   Password: re_xxxxxxxxxxxxxxxxxx   ← c'est ta clé API d'avant
   ```

---

<a id="5-supabase-smtp-resend"></a>
## 5. Configurer Supabase pour utiliser Resend (SMTP custom)

C'est ce qui transforme tes emails « envoyés depuis l'adresse louche default Supabase » en **emails pro depuis `noreply@resakit.fr`**.

### Étapes

1. Va sur [https://supabase.com/dashboard](https://supabase.com/dashboard) → ton projet RezaKit
2. Menu de gauche → ⚙️ **Project Settings** → **Authentication**
3. Section **SMTP Settings** → clique **Enable Custom SMTP**
4. Remplis :
   ```
   Sender email   : noreply@resakit.fr
   Sender name    : RezaKit
   Host           : smtp.resend.com
   Port           : 465
   Username       : resend
   Password       : re_xxxxxxxxxxxx     ← ta clé API Resend
   Minimum interval between emails : 1   (1 seconde — recommandé)
   ```
5. Clique **Save**

### Tester l'envoi

1. Toujours dans **Authentication** → onglet **Users**
2. Clique sur **un utilisateur de test** (créé exprès, ou toi)
3. Clique sur les `…` → **Send password recovery**
4. Vérifie l'email reçu :
   - Expéditeur : `RezaKit <noreply@resakit.fr>` ✅
   - Pas de spam ✅

> ❌ Si l'email finit en spam → vérifie que les enregistrements DNS SPF + DKIM + DMARC sont bien validés dans Resend.
> Ajoute aussi un enregistrement DMARC : type `TXT`, nom `_dmarc`, valeur `v=DMARC1; p=none; rua=mailto:jozer717606@gmail.com`

---

<a id="6-templates-email-supabase"></a>
## 6. Personnaliser les templates email Supabase (FR pro)

### Où ?

Supabase Dashboard → **Authentication** → onglet **Email Templates**.

Tu as **6 templates** à customiser. Pour chacun :
1. Sélectionne le template (Confirm signup, Invite user, Magic Link, Change Email Address, Reset Password, Reauthentication)
2. Décoche `Use default email content` (si l'option existe)
3. Colle les versions ci-dessous dans **Subject** et **Message body**
4. Clique **Save**

### A. Confirm signup (Confirmation d'inscription)

**Subject:**
```
Bienvenue sur RezaKit 🏋️ — confirme ton email
```

**Message body (HTML):**
```html
<div style="font-family:-apple-system,BlinkMacSystemFont,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:30px 20px;background:#050505;color:#f5f5f5;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:42px;letter-spacing:2px;color:#ff6b35;font-weight:800;">RezaKit</div>
    <div style="font-size:11px;color:#76767e;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">Ton kit fitness complet</div>
  </div>

  <div style="background:linear-gradient(135deg,rgba(255,107,53,0.18),rgba(196,30,58,0.10));border:1px solid rgba(255,107,53,0.3);border-radius:18px;padding:28px 22px;">
    <h1 style="margin:0 0 14px;font-size:22px;color:#fff;font-weight:800;">Bienvenue 💪</h1>
    <p style="margin:0 0 18px;color:#bdbdc4;line-height:1.6;font-size:14px;">
      Plus qu'une étape avant de commencer à tracker tes séances, ta nutrition et tes records :
      <strong style="color:#fff;">confirme ton email</strong>.
    </p>
    <p style="text-align:center;margin:20px 0 8px;">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:linear-gradient(135deg,#ff6b35,#c41e3a);color:#fff;padding:14px 36px;border-radius:999px;text-decoration:none;font-weight:800;font-size:14px;letter-spacing:0.5px;">
        Confirmer mon email →
      </a>
    </p>
    <p style="margin:14px 0 0;color:#76767e;font-size:11.5px;line-height:1.5;text-align:center;">
      Le lien expire dans 24 h. Si tu n'as pas demandé cet email, ignore-le.
    </p>
  </div>

  <div style="margin-top:30px;padding:16px;background:#0E0E10;border:1px solid rgba(255,255,255,0.06);border-radius:12px;font-size:12px;color:#bdbdc4;line-height:1.6;">
    <strong style="color:#ff6b35;">Et après ?</strong> Une fois connecté tu pourras :
    <ul style="margin:8px 0 0 18px;padding:0;color:#76767e;">
      <li>📊 Tracker tes séances de muscu</li>
      <li>🏃 Importer Strava / Garmin</li>
      <li>🤖 Discuter avec un coach IA gratuit</li>
      <li>📈 Voir ta progression sur tous tes records</li>
    </ul>
  </div>

  <div style="text-align:center;margin-top:24px;color:#44444a;font-size:10px;line-height:1.6;">
    RezaKit · resakit.fr<br>
    Cet email a été envoyé à {{ .Email }} car un compte a été créé avec cette adresse.
  </div>
</div>
```

### B. Reset Password (Mot de passe oublié)

**Subject:**
```
Réinitialise ton mot de passe RezaKit
```

**Message body (HTML):**
```html
<div style="font-family:-apple-system,BlinkMacSystemFont,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:30px 20px;background:#050505;color:#f5f5f5;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:42px;letter-spacing:2px;color:#ff6b35;font-weight:800;">RezaKit</div>
  </div>

  <div style="background:#0E0E10;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:28px 22px;">
    <h1 style="margin:0 0 14px;font-size:20px;color:#fff;font-weight:800;">Mot de passe oublié ?</h1>
    <p style="margin:0 0 18px;color:#bdbdc4;line-height:1.6;font-size:14px;">
      Pas de souci. Clique ci-dessous pour choisir un nouveau mot de passe.
      Le lien expire dans <strong style="color:#fff;">1 heure</strong>.
    </p>
    <p style="text-align:center;margin:20px 0 8px;">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:linear-gradient(135deg,#ff6b35,#c41e3a);color:#fff;padding:14px 36px;border-radius:999px;text-decoration:none;font-weight:800;font-size:14px;">
        Choisir un nouveau mot de passe →
      </a>
    </p>
    <p style="margin:14px 0 0;color:#76767e;font-size:11.5px;line-height:1.5;text-align:center;">
      Si tu n'as pas demandé ce changement, ignore cet email — ton compte reste sécurisé.
    </p>
  </div>

  <div style="text-align:center;margin-top:24px;color:#44444a;font-size:10px;">
    RezaKit · resakit.fr
  </div>
</div>
```

### C. Magic Link (Connexion sans mot de passe)

**Subject:**
```
🪄 Ton lien de connexion RezaKit
```

**Message body (HTML):**
```html
<div style="font-family:-apple-system,BlinkMacSystemFont,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:30px 20px;background:#050505;color:#f5f5f5;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:42px;letter-spacing:2px;color:#ff6b35;font-weight:800;">RezaKit</div>
  </div>

  <div style="background:#0E0E10;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:28px 22px;">
    <h1 style="margin:0 0 14px;font-size:20px;color:#fff;font-weight:800;">Connecte-toi en un clic 🪄</h1>
    <p style="margin:0 0 18px;color:#bdbdc4;line-height:1.6;font-size:14px;">
      Voici ton lien magique. Il expire dans <strong style="color:#fff;">1 heure</strong>.
    </p>
    <p style="text-align:center;margin:20px 0 8px;">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:linear-gradient(135deg,#ff6b35,#c41e3a);color:#fff;padding:14px 36px;border-radius:999px;text-decoration:none;font-weight:800;font-size:14px;">
        Me connecter →
      </a>
    </p>
  </div>

  <div style="text-align:center;margin-top:24px;color:#44444a;font-size:10px;">
    RezaKit · resakit.fr
  </div>
</div>
```

### D. Change Email Address (Confirmation de changement d'email)

**Subject:**
```
Confirme ton nouvel email RezaKit
```

**Message body (HTML):**
```html
<div style="font-family:-apple-system,BlinkMacSystemFont,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:30px 20px;background:#050505;color:#f5f5f5;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:42px;letter-spacing:2px;color:#ff6b35;font-weight:800;">RezaKit</div>
  </div>

  <div style="background:#0E0E10;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:28px 22px;">
    <h1 style="margin:0 0 14px;font-size:20px;color:#fff;font-weight:800;">Confirme ta nouvelle adresse</h1>
    <p style="margin:0 0 18px;color:#bdbdc4;line-height:1.6;font-size:14px;">
      Tu as demandé à changer ton email RezaKit pour <strong style="color:#fff;">{{ .NewEmail }}</strong>. Confirme ci-dessous :
    </p>
    <p style="text-align:center;margin:20px 0 8px;">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:linear-gradient(135deg,#ff6b35,#c41e3a);color:#fff;padding:14px 36px;border-radius:999px;text-decoration:none;font-weight:800;font-size:14px;">
        Confirmer le changement →
      </a>
    </p>
    <p style="margin:14px 0 0;color:#76767e;font-size:11.5px;line-height:1.5;text-align:center;">
      Si tu n'as rien demandé, ignore cet email.
    </p>
  </div>
</div>
```

### E. Invite user (Invitation d'un nouveau user — peu utilisé)
Tu peux laisser le défaut ou copier le template **Confirm signup**.

### F. Reauthentication (Nonce 2FA — peu utilisé)
Idem, laisse le défaut sauf si tu actives la 2FA plus tard.

---

<a id="7-rate-limits-bans"></a>
## 7. Régler les rate limits + bans Supabase

Pour éviter le spam / abus.

### Rate limits

Supabase Dashboard → **Authentication** → **Rate Limits**.

Réglages recommandés (pour une appli petite/moyenne) :
| Action | Default | Recommandé |
|---|---|---|
| Email signups & sign-ins | 30 / heure / IP | **15 / heure / IP** |
| Magic link / OTP | 30 / heure | **10 / heure** |
| Password recovery | 30 / heure | **5 / heure** |
| Token refreshes | 1800 / 5 min | (laisse défaut) |
| Verify (email click) | 30 / 5 min | (laisse défaut) |

> Plus c'est strict, plus tu protèges. Mais si tu mets trop bas, tes vrais users vont se faire bloquer. Les valeurs ci-dessus sont un bon équilibre.

### Bans / verrouillage compte

Supabase Dashboard → **Authentication** → **Settings** (section *Auth*).

- **Banned users** : section où tu peux voir/ban manuellement un user. Pour ban un compte spam :
  1. Onglet **Users** → trouve le user → `…` → **Ban User** → durée (24h, 7j, permanent)
- **Max failed sign-in attempts** : par défaut 5. **Recommande : 5 puis lock 1h.**
- **Verifying emails required to log in** : ✅ active (force la vérif d'email avant login)
- **Allow new users to sign up** : ✅ active (sinon plus aucun user ne peut s'inscrire)

### Recevoir un email pour chaque ban / event critique

C'est natif dans Supabase :
1. Project Settings → **Notifications**
2. Active les events :
   - ✅ Auth: User Signed Up
   - ✅ Auth: User Was Banned
   - ✅ Auth: Failed Login Attempts (>5)
3. Email destinataire : ton email perso

---

<a id="8-rapport-hebdo-vercel"></a>
## 8. Activer le rapport hebdo dimanche 22h

Le code est déjà prêt dans `api/weekly-report.ts` et le cron est configuré dans `vercel.json` (déclenchement chaque dimanche 20:00 UTC = 21:00 ou 22:00 Paris selon saison).

Il reste à ajouter **4 variables d'environnement** sur Vercel.

### A. Récupérer la `SUPABASE_SERVICE_ROLE_KEY`

1. Supabase Dashboard → ⚙️ **Project Settings** → **API**
2. Section **Project API keys**
3. Copie la valeur de **`service_role`** (PAS la `anon` !)

> ⚠️ Cette clé est ULTRA sensible. Elle bypass toutes les RLS. Ne la mets JAMAIS dans le code front, jamais dans Git, jamais dans le navigateur.

### B. Récupérer la `SUPABASE_URL`

Même page Supabase → en haut tu vois `Project URL`. Copie-la (genre `https://xxxxxxxxxx.supabase.co`).

### C. Générer un `CRON_SECRET`

Tape ça dans un terminal pour générer un secret aléatoire :
```bash
openssl rand -hex 32
```
Sinon va sur [https://generate-secret.vercel.app/32](https://generate-secret.vercel.app/32). Copie la valeur.

### D. Ajouter les 4 vars sur Vercel

1. Vercel Dashboard → projet RezaKit → **Settings** → **Environment Variables**
2. Pour chaque variable ci-dessous, clique **Add New** → remplis Name + Value → coche les 3 envs (Production, Preview, Development) → **Save** :

| Name | Value |
|---|---|
| `SUPABASE_URL` | (l'URL Project URL) |
| `SUPABASE_SERVICE_ROLE_KEY` | (la `service_role` key) |
| `RESEND_API_KEY` | (la clé `re_...` de Resend) |
| `CRON_SECRET` | (le secret aléatoire) |
| `REPORT_FROM_EMAIL` *(optionnel)* | `RezaKit <noreply@resakit.fr>` |

### E. Configurer le cron Vercel pour utiliser le secret

Vercel auth automatiquement les Crons avec le header `Authorization: Bearer <CRON_SECRET>` **si la var d'env `CRON_SECRET` est définie**. Tu n'as donc **rien d'autre à faire** : le code de `api/weekly-report.ts` vérifie ça.

> 💡 Vercel envoie le cron exactement à `0 20 * * 0` UTC, soit dimanche 20h UTC = **21h Paris en été, 22h Paris en hiver**.
> Si tu veux 22h pile toute l'année, il faudrait une fonction qui se réveille à 19h ET 21h UTC et qui décide selon l'heure exacte. Mais c'est sur-ingénieré → on accepte le décalage 1h en été.

### F. Redéployer

1. Vercel Dashboard → onglet **Deployments**
2. Clique sur le dernier déploiement réussi → bouton **⋯** → **Redeploy**

Ou bien push n'importe quel commit sur master.

---

<a id="9-tester"></a>
## 9. Tester que tout marche

### Test SMTP Supabase

1. Inscris-toi avec un email de test dans l'app
2. Vérifie l'email reçu :
   - Vient bien de `RezaKit <noreply@resakit.fr>` ✅
   - Bouton orange RezaKit ✅
   - Pas en spam ✅

### Test rapport hebdo

Pour ne pas attendre dimanche, déclenche manuellement :

```bash
curl -X GET https://resakit.fr/api/weekly-report \
  -H "Authorization: Bearer TON_CRON_SECRET"
```

(remplace `TON_CRON_SECRET` par la vraie valeur)

Réponse attendue :
```json
{ "ok": true, "sent": 3, "skipped": 1, "failed": 0 }
```

> Si `failed > 0` → regarde les logs Vercel : Vercel Dashboard → Functions → `api/weekly-report` → onglet **Logs**.

### Vérifier l'email reçu

Dans ta boîte mail :
- Sujet : `🏋️ Ton récap RezaKit — N séances cette semaine`
- 3 cartes stats au milieu
- Tableau "Cette semaine — fait"
- Tableau "Semaine prochaine — prévu"
- CTA "Ouvrir RezaKit →"

---

<a id="10-annexe"></a>
## 10. Annexe

### Variables d'env recap

À avoir dans Vercel :

```env
# Front (vite) — déjà existantes
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...

# Back (api/*) — à ajouter
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
RESEND_API_KEY=re_xxxxxxxx
CRON_SECRET=xxxxxxxx_random_long
REPORT_FROM_EMAIL="RezaKit <noreply@resakit.fr>"
```

### Dépannage

#### Mes emails Supabase finissent en spam
- Vérifie que les DNS SPF + DKIM + DMARC sont 100% verts dans Resend
- Ajoute un enregistrement `_dmarc` TXT : `v=DMARC1; p=none; rua=mailto:tonemail@gmail.com`
- Évite les mots "free", "money", "click here" dans le subject

#### Le cron ne se déclenche pas
- Vercel free plan limite à 2 crons/projet. Tu en as 1 → OK.
- Vercel Dashboard → onglet **Crons** doit lister `/api/weekly-report` avec `0 20 * * 0`
- Si absent : redéploie

#### Erreur 401 Unauthorized en testant le cron à la main
- Vérifie que tu utilises bien `Authorization: Bearer <CRON_SECRET>`, pas juste `<CRON_SECRET>`
- Vérifie qu'il n'y a pas d'espaces parasites dans la valeur de `CRON_SECRET` sur Vercel

#### "Failed to list users" dans la réponse
- Tu as collé la `anon` key au lieu de la `service_role` key. Recommence avec la bonne.

#### Resend "domain not verified"
- Re-vérifie les DNS chez ton registrar
- `dig TXT resakit.fr` doit montrer le SPF
- `dig TXT resend._domainkey.resakit.fr` doit montrer le DKIM
- Patiente jusqu'à 1h de propagation

### Coûts

| Service | Plan | Limite gratuite | Pour passer payant |
|---|---|---|---|
| Resend | Free | 3 000 emails/mois, 100/jour | À 100 emails/jour permanents |
| Vercel | Hobby | 1 cron, 100 GB bandwidth | Si tu fais > 1k users actifs |
| Supabase | Free | 50 000 MAU, 500 MB DB | Si tu dépasses 500 MB de data |

Pour ton volume actuel (~10 users), tout reste gratuit pour très longtemps.

---

**Fini.** Si tu butes sur une étape, copie l'erreur exacte et demande à l'IA. 🏋️
