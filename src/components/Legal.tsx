import { useState } from 'react';
import { Icons } from './Icons';

interface LegalProps {
  onBack: () => void;
  initialTab?: 'mentions' | 'privacy' | 'terms';
}

type Tab = 'mentions' | 'privacy' | 'terms';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'mentions', label: 'Mentions légales' },
  { id: 'privacy', label: 'Confidentialité' },
  { id: 'terms', label: 'CGU' },
];

const LAST_UPDATE = '3 mai 2026';

export default function Legal({ onBack, initialTab = 'privacy' }: LegalProps) {
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <div className="page-enter" style={{ padding: '14px 16px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <button onClick={onBack} className="tap glass" style={{
          width: 36, height: 36, borderRadius: 12, border: '1px solid var(--glass-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mute)',
        }}>
          <Icons.ChevronLeft size={16} />
        </button>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.16 }}>Légal</div>
          <h2 className="t-display" style={{ fontSize: 28, lineHeight: 0.9, marginTop: 2 }}>Informations</h2>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="tap"
            style={{
              padding: '8px 14px', borderRadius: 999, border: 'none', whiteSpace: 'nowrap',
              background: tab === t.id ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'rgba(255,255,255,0.05)',
              color: tab === t.id ? '#fff' : 'var(--text-mute)',
              fontSize: 12, fontWeight: 700,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Updated date */}
      <div style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 18, fontStyle: 'italic' }}>
        Dernière mise à jour : {LAST_UPDATE}
      </div>

      {/* Content */}
      <div className="glass" style={{ borderRadius: 22, padding: 20, fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.7 }}>
        {tab === 'mentions' && <Mentions />}
        {tab === 'privacy' && <Privacy />}
        {tab === 'terms' && <Terms />}
      </div>
    </div>
  );
}

// ─── Section helpers ──────────────────────────────────────────────────────────

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginTop: 18, marginBottom: 8 }}>{children}</h3>
);

const SubTitle = ({ children }: { children: React.ReactNode }) => (
  <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginTop: 12, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>{children}</h4>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ marginBottom: 8 }}>{children}</p>
);

const Ul = ({ children }: { children: React.ReactNode }) => (
  <ul style={{ marginBottom: 8, paddingLeft: 20 }}>{children}</ul>
);

const Li = ({ children }: { children: React.ReactNode }) => (
  <li style={{ marginBottom: 4 }}>{children}</li>
);

// ─── MENTIONS LÉGALES ─────────────────────────────────────────────────────────

function Mentions() {
  return (
    <>
      <P>Conformément aux dispositions des articles 6-III et 19 de la loi n°2004-575 du 21 juin 2004 pour la Confiance dans l'économie numérique, dite L.C.E.N., il est porté à la connaissance des utilisateurs du site les présentes mentions légales.</P>

      <SectionTitle>Éditeur</SectionTitle>
      <P><strong>RezaKit</strong> — application mobile et web de suivi sportif personnel.</P>
      <P>Site web : <span style={{ color: 'var(--primary)' }}>resakit.fr</span></P>
      <P>Contact : <span style={{ color: 'var(--primary)' }}>jozer717606@gmail.com</span></P>

      <SectionTitle>Hébergeur</SectionTitle>
      <P>L'application RezaKit est hébergée par :</P>
      <Ul>
        <Li><strong>Vercel Inc.</strong> — 340 S Lemon Ave #4133, Walnut, CA 91789, USA — vercel.com</Li>
        <Li><strong>Supabase Inc.</strong> (base de données et authentification) — 970 Toa Payoh North #07-04, Singapore — supabase.com</Li>
      </Ul>

      <SectionTitle>Propriété intellectuelle</SectionTitle>
      <P>L'ensemble du contenu de l'application RezaKit (textes, images, logos, code) est protégé par le droit d'auteur. Toute reproduction, même partielle, sans autorisation préalable est interdite.</P>

      <SectionTitle>Limitation de responsabilité</SectionTitle>
      <P>RezaKit est un outil de suivi personnel ne se substituant pas à l'avis d'un professionnel de santé ou d'un coach sportif diplômé. Les conseils générés par l'intelligence artificielle (Coach IA) sont indicatifs et n'engagent en aucun cas la responsabilité de l'éditeur.</P>
      <P>L'utilisateur est seul responsable de l'usage qu'il fait de ces conseils et des éventuelles blessures pouvant résulter de la pratique d'activités physiques.</P>

      <SectionTitle>Loi applicable</SectionTitle>
      <P>Les présentes mentions légales sont régies par le droit français. En cas de litige, les tribunaux français seront seuls compétents.</P>
    </>
  );
}

// ─── POLITIQUE DE CONFIDENTIALITÉ (RGPD) ──────────────────────────────────────

function Privacy() {
  return (
    <>
      <P>Cette politique décrit comment RezaKit collecte, utilise et protège vos données personnelles, conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.</P>

      <SectionTitle>1. Données collectées</SectionTitle>
      <SubTitle>Sans compte (utilisation locale)</SubTitle>
      <P>Aucune donnée n'est transmise à nos serveurs. Toutes les données (séances, mesures, photos, etc.) restent stockées localement dans votre navigateur (IndexedDB et localStorage).</P>

      <SubTitle>Avec un compte</SubTitle>
      <Ul>
        <Li><strong>Adresse e-mail</strong> — pour l'authentification et la récupération du compte.</Li>
        <Li><strong>Données d'entraînement</strong> — séances, exercices, séries (poids/reps), notes.</Li>
        <Li><strong>Données corporelles</strong> — poids, mensurations, photos de progression.</Li>
        <Li><strong>Préférences</strong> — objectif, niveau, fréquence, blessures déclarées.</Li>
        <Li><strong>Conversations IA</strong> — historique des échanges avec le Coach IA (si vous utilisez cette fonctionnalité).</Li>
      </Ul>

      <SubTitle>Intégrations tierces (optionnelles)</SubTitle>
      <Ul>
        <Li><strong>Strava</strong> — si connecté, nous récupérons vos activités cardio et calories actives via OAuth 2.0.</Li>
        <Li><strong>Garmin</strong> — si connecté, nous récupérons vos calories actives.</Li>
        <Li><strong>Google Gemini (IA)</strong> — vous fournissez votre propre clé API ; les messages transitent directement entre votre appareil et Google.</Li>
      </Ul>

      <SectionTitle>2. Finalité du traitement</SectionTitle>
      <Ul>
        <Li>Permettre le suivi de votre progression sportive.</Li>
        <Li>Synchroniser vos données entre vos appareils.</Li>
        <Li>Fournir des recommandations personnalisées via le Coach IA.</Li>
      </Ul>
      <P>RezaKit ne vend, ne loue et ne transmet vos données à aucun tiers à des fins commerciales ou publicitaires.</P>

      <SectionTitle>3. Base légale</SectionTitle>
      <P>Le traitement de vos données est fondé sur votre <strong>consentement explicite</strong> (article 6.1.a RGPD), donné lors de la création du compte.</P>

      <SectionTitle>4. Durée de conservation</SectionTitle>
      <P>Vos données sont conservées tant que votre compte est actif. En cas de suppression du compte, l'ensemble de vos données est effacé sous 30 jours, à l'exception des sauvegardes techniques qui sont purgées automatiquement après 90 jours.</P>

      <SectionTitle>5. Vos droits</SectionTitle>
      <P>Conformément au RGPD, vous disposez des droits suivants :</P>
      <Ul>
        <Li><strong>Droit d'accès</strong> — visualiser vos données (Paramètres).</Li>
        <Li><strong>Droit de rectification</strong> — modifier vos données via l'interface.</Li>
        <Li><strong>Droit à l'effacement</strong> — supprimer votre compte (Paramètres → Supprimer mon compte).</Li>
        <Li><strong>Droit à la portabilité</strong> — exporter vos données en CSV ou JSON (Paramètres → Exporter).</Li>
        <Li><strong>Droit d'opposition</strong> — refuser certains traitements (désactiver les intégrations tierces).</Li>
        <Li><strong>Droit de retirer votre consentement</strong> — à tout moment, sans affecter la licéité du traitement antérieur.</Li>
      </Ul>
      <P>Pour exercer ces droits, contactez : <span style={{ color: 'var(--primary)' }}>jozer717606@gmail.com</span></P>
      <P>Vous pouvez également introduire une réclamation auprès de la <strong>CNIL</strong> (Commission Nationale de l'Informatique et des Libertés) — cnil.fr.</P>

      <SectionTitle>6. Sécurité</SectionTitle>
      <Ul>
        <Li>Authentification chiffrée via Supabase Auth.</Li>
        <Li>Connexion HTTPS obligatoire.</Li>
        <Li>Mots de passe hachés (jamais stockés en clair).</Li>
        <Li>Données chiffrées au repos sur les serveurs Supabase (AES-256).</Li>
      </Ul>

      <SectionTitle>7. Cookies et stockage local</SectionTitle>
      <P>RezaKit utilise uniquement du <strong>stockage local</strong> (IndexedDB et localStorage) pour fonctionner — pas de cookies tiers ni de pixels de tracking.</P>
      <P>Aucun outil d'analyse comportementale (Google Analytics, Facebook Pixel, etc.) n'est installé.</P>

      <SectionTitle>8. Photos de progression</SectionTitle>
      <P>Les photos de progression que vous prenez sont stockées de manière privée dans Supabase Storage, accessibles uniquement par votre compte. Elles ne sont jamais partagées ni utilisées à d'autres fins.</P>

      <SectionTitle>9. Mineurs</SectionTitle>
      <P>RezaKit n'est pas destiné aux mineurs de moins de 15 ans. Les utilisateurs entre 15 et 18 ans doivent obtenir l'accord parental.</P>

      <SectionTitle>10. Modifications</SectionTitle>
      <P>Cette politique peut évoluer. Toute modification sera notifiée dans l'application et la date de dernière mise à jour sera actualisée.</P>
    </>
  );
}

// ─── CGU ──────────────────────────────────────────────────────────────────────

function Terms() {
  return (
    <>
      <P>Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de l'application RezaKit. En utilisant l'application, vous acceptez ces conditions.</P>

      <SectionTitle>1. Objet</SectionTitle>
      <P>RezaKit est une application de suivi sportif personnel permettant d'enregistrer ses entraînements de musculation, cardio, mesures corporelles et alimentation. Elle propose également un assistant IA pour des conseils personnalisés.</P>

      <SectionTitle>2. Accès au service</SectionTitle>
      <P>L'utilisation de RezaKit est <strong>gratuite</strong> dans sa version actuelle. Une version premium pourra être proposée ultérieurement avec des fonctionnalités étendues.</P>
      <P>L'utilisateur peut utiliser l'application :</P>
      <Ul>
        <Li>Sans compte — données stockées uniquement sur l'appareil.</Li>
        <Li>Avec compte — synchronisation entre appareils via Supabase.</Li>
      </Ul>

      <SectionTitle>3. Compte utilisateur</SectionTitle>
      <P>Lors de la création d'un compte, vous vous engagez à :</P>
      <Ul>
        <Li>Fournir des informations exactes (e-mail valide).</Li>
        <Li>Maintenir la confidentialité de votre mot de passe.</Li>
        <Li>Ne pas partager votre compte avec des tiers.</Li>
      </Ul>

      <SectionTitle>4. Avertissement santé</SectionTitle>
      <P><strong>RezaKit n'est pas un dispositif médical.</strong> Les conseils générés par l'IA et les programmes proposés sont à titre informatif uniquement.</P>
      <P>Avant de commencer une activité physique :</P>
      <Ul>
        <Li>Consultez un médecin si vous avez des problèmes de santé.</Li>
        <Li>Faites-vous accompagner par un coach diplômé en cas de doute sur la technique.</Li>
        <Li>Écoutez votre corps et arrêtez en cas de douleur.</Li>
      </Ul>
      <P>L'éditeur décline toute responsabilité en cas de blessure liée à l'usage de l'application.</P>

      <SectionTitle>5. Coach IA</SectionTitle>
      <P>Le Coach IA utilise Google Gemini. Vous fournissez votre propre clé API. L'éditeur ne contrôle pas les réponses de l'IA et ne peut être tenu responsable d'erreurs ou d'inexactitudes.</P>

      <SectionTitle>6. Contenu utilisateur</SectionTitle>
      <P>Les données que vous saisissez (séances, photos, notes) restent votre propriété. Vous nous accordez uniquement le droit de les stocker pour vous fournir le service.</P>
      <P>Vous vous engagez à ne pas :</P>
      <Ul>
        <Li>Charger de contenu illégal, offensant ou portant atteinte aux droits d'autrui.</Li>
        <Li>Utiliser l'application à des fins commerciales sans autorisation.</Li>
        <Li>Tenter d'accéder à des comptes tiers ou perturber le service.</Li>
      </Ul>

      <SectionTitle>7. Disponibilité</SectionTitle>
      <P>L'éditeur s'efforce de maintenir le service accessible 24h/24. Néanmoins, des interruptions peuvent survenir pour maintenance, mise à jour ou cas de force majeure. Aucune garantie de disponibilité n'est fournie.</P>

      <SectionTitle>8. Suppression du compte</SectionTitle>
      <P>Vous pouvez supprimer votre compte à tout moment depuis l'application (Paramètres). Cette action est irréversible et entraîne l'effacement définitif de l'ensemble de vos données.</P>

      <SectionTitle>9. Modification des CGU</SectionTitle>
      <P>L'éditeur se réserve le droit de modifier les présentes CGU à tout moment. Les modifications seront notifiées dans l'application.</P>

      <SectionTitle>10. Litiges</SectionTitle>
      <P>Tout litige sera soumis au droit français. Une médiation amiable sera privilégiée avant toute action en justice.</P>
    </>
  );
}
