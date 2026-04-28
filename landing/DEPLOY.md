# Déployer GAIN·OS landing sur Netlify + Supabase

## Étape 1 — Créer la table Supabase (UNE SEULE FOIS)

1. Va sur https://supabase.com → ton projet → **SQL Editor**
2. Colle et exécute ce SQL :

```sql
-- Crée la table waitlist
create table public.waitlist (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  consent boolean default true,
  created_at timestamp with time zone default now()
);

-- Active la sécurité par lignes
alter table public.waitlist enable row level security;

-- Autorise les inserts anonymes (pour le formulaire public)
create policy "Allow public inserts" on public.waitlist
  for insert with check (true);

-- Interdit la lecture anonyme (seul toi peux voir les emails)
-- Pour lire : utilise le dashboard Supabase ou la service_role key en backend
```

3. Clique **Run** → tu dois voir "Success, no rows returned"

---

## Étape 2 — Déployer sur Netlify

### Méthode simple — Drag & Drop

1. Va sur https://app.netlify.com
2. **Add new site** → **Deploy manually**
3. Glisse le dossier **`landing/`** dans la zone
4. C'est en ligne en 30 secondes 🎉

### Méthode GitHub (mises à jour auto)

```bash
cd landing/
git init
git add .
git commit -m "GAIN·OS landing"
git remote add origin git@github.com:TON_USER/gainos-landing.git
git push -u origin main
```
Puis connecte ce repo dans Netlify.

---

## Étape 3 — Vérifier que ça marche

1. Soumets le formulaire avec ton propre email
2. Va sur Supabase → **Table Editor** → **waitlist** → tu vois ton email
3. Pour voir tous les inscrits à tout moment : Supabase → Table Editor → waitlist

---

## Voir les inscrits

**Dans Supabase :**
- Table Editor → waitlist → tu vois tous les emails + date d'inscription

**Via SQL :**
```sql
select email, created_at from public.waitlist order by created_at desc;
```

**Export CSV :**
- Table Editor → icône téléchargement → Export as CSV

---

## Checklist avant de partager le lien

- [ ] Table `waitlist` créée dans Supabase
- [ ] Formulaire testé → email visible dans Supabase
- [ ] Le site s'affiche bien sur mobile et desktop
- [ ] Page `/confidentialite.html` accessible
