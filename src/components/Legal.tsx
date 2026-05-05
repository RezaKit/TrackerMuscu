import { useState } from 'react';
import { Icons } from './Icons';
import { tr, useLang } from '../utils/i18n';

interface LegalProps {
  onBack: () => void;
  initialTab?: 'mentions' | 'privacy' | 'terms';
}

type Tab = 'mentions' | 'privacy' | 'terms';

const LAST_UPDATE = '3 mai 2026';

export default function Legal({ onBack, initialTab = 'privacy' }: LegalProps) {
  useLang();
  const [tab, setTab] = useState<Tab>(initialTab);

  const TABS: Array<{ id: Tab; label: string }> = [
    { id: 'mentions', label: tr({ fr: 'Mentions légales', en: 'Legal Notice', es: 'Aviso legal' }) },
    { id: 'privacy',  label: tr({ fr: 'Confidentialité',  en: 'Privacy',     es: 'Privacidad'  }) },
    { id: 'terms',    label: tr({ fr: 'CGU',              en: 'Terms',       es: 'Términos'    }) },
  ];

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
          <div style={{ fontSize: 11, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.16 }}>
            {tr({ fr: 'Légal', en: 'Legal', es: 'Legal' })}
          </div>
          <h2 className="t-display" style={{ fontSize: 28, lineHeight: 0.9, marginTop: 2 }}>
            {tr({ fr: 'Informations', en: 'Information', es: 'Información' })}
          </h2>
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
        {tr({ fr: 'Dernière mise à jour :', en: 'Last update:', es: 'Última actualización:' })} {LAST_UPDATE}
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
      <P>{tr({
        fr: "Conformément aux dispositions des articles 6-III et 19 de la loi n°2004-575 du 21 juin 2004 pour la Confiance dans l'économie numérique, dite L.C.E.N., il est porté à la connaissance des utilisateurs du site les présentes mentions légales.",
        en: 'Under articles 6-III and 19 of French law 2004-575 of 21 June 2004 (L.C.E.N.), the following legal notice is brought to the attention of users.',
        es: 'En cumplimiento de los artículos 6-III y 19 de la ley francesa 2004-575 de 21 de junio de 2004 (L.C.E.N.), se pone en conocimiento de los usuarios el presente aviso legal.',
      })}</P>

      <SectionTitle>{tr({ fr: 'Éditeur', en: 'Publisher', es: 'Editor' })}</SectionTitle>
      <P><strong>RezaKit</strong> — {tr({
        fr: 'application mobile et web de suivi sportif personnel.',
        en: 'mobile and web app for personal fitness tracking.',
        es: 'aplicación móvil y web de seguimiento deportivo personal.',
      })}</P>
      <P>{tr({ fr: 'Site web', en: 'Website', es: 'Sitio web' })}: <span style={{ color: 'var(--primary)' }}>resakit.fr</span></P>
      <P>{tr({ fr: 'Contact', en: 'Contact', es: 'Contacto' })}: <span style={{ color: 'var(--primary)' }}>jozer717606@gmail.com</span></P>

      <SectionTitle>{tr({ fr: 'Hébergeur', en: 'Hosting', es: 'Alojamiento' })}</SectionTitle>
      <P>{tr({
        fr: "L'application RezaKit est hébergée par :",
        en: 'RezaKit is hosted by:',
        es: 'RezaKit está alojado por:',
      })}</P>
      <Ul>
        <Li><strong>Vercel Inc.</strong> — 340 S Lemon Ave #4133, Walnut, CA 91789, USA — vercel.com</Li>
        <Li><strong>Supabase Inc.</strong> {tr({
          fr: '(base de données et authentification)',
          en: '(database and authentication)',
          es: '(base de datos y autenticación)',
        })} — 970 Toa Payoh North #07-04, Singapore — supabase.com</Li>
      </Ul>

      <SectionTitle>{tr({ fr: 'Propriété intellectuelle', en: 'Intellectual property', es: 'Propiedad intelectual' })}</SectionTitle>
      <P>{tr({
        fr: "L'ensemble du contenu de l'application RezaKit (textes, images, logos, code) est protégé par le droit d'auteur. Toute reproduction, même partielle, sans autorisation préalable est interdite.",
        en: 'All content in RezaKit (text, images, logos, code) is protected by copyright law. Any reproduction, even partial, without prior authorization is forbidden.',
        es: 'Todo el contenido de RezaKit (textos, imágenes, logos, código) está protegido por derechos de autor. Toda reproducción, incluso parcial, sin autorización previa está prohibida.',
      })}</P>

      <SectionTitle>{tr({ fr: 'Limitation de responsabilité', en: 'Limitation of liability', es: 'Limitación de responsabilidad' })}</SectionTitle>
      <P>{tr({
        fr: "RezaKit est un outil de suivi personnel ne se substituant pas à l'avis d'un professionnel de santé ou d'un coach sportif diplômé. Les conseils générés par l'intelligence artificielle (Coach IA) sont indicatifs et n'engagent en aucun cas la responsabilité de l'éditeur.",
        en: 'RezaKit is a personal tracking tool and does not replace medical advice or guidance from a certified coach. AI-generated recommendations (AI Coach) are indicative only and never engage the publisher\'s liability.',
        es: 'RezaKit es una herramienta de seguimiento personal y no reemplaza la opinión de un profesional de la salud ni de un entrenador certificado. Los consejos generados por la inteligencia artificial (Coach IA) son orientativos y no comprometen la responsabilidad del editor.',
      })}</P>
      <P>{tr({
        fr: "L'utilisateur est seul responsable de l'usage qu'il fait de ces conseils et des éventuelles blessures pouvant résulter de la pratique d'activités physiques.",
        en: 'The user is solely responsible for how they use these recommendations and for any injuries that may result from physical activities.',
        es: 'El usuario es el único responsable del uso que haga de estos consejos y de las posibles lesiones derivadas de la práctica física.',
      })}</P>

      <SectionTitle>{tr({ fr: 'Loi applicable', en: 'Governing law', es: 'Ley aplicable' })}</SectionTitle>
      <P>{tr({
        fr: 'Les présentes mentions légales sont régies par le droit français. En cas de litige, les tribunaux français seront seuls compétents.',
        en: 'This legal notice is governed by French law. In the event of a dispute, French courts shall have sole jurisdiction.',
        es: 'El presente aviso legal se rige por el derecho francés. En caso de litigio, solo serán competentes los tribunales franceses.',
      })}</P>
    </>
  );
}

// ─── PRIVACY (GDPR) ──────────────────────────────────────────────────────────

function Privacy() {
  return (
    <>
      <P>{tr({
        fr: "Cette politique décrit comment RezaKit collecte, utilise et protège vos données personnelles, conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.",
        en: 'This policy describes how RezaKit collects, uses and protects your personal data, in accordance with the General Data Protection Regulation (GDPR).',
        es: 'Esta política describe cómo RezaKit recopila, utiliza y protege tus datos personales, conforme al Reglamento General de Protección de Datos (RGPD).',
      })}</P>

      <SectionTitle>{tr({ fr: '1. Données collectées', en: '1. Data collected', es: '1. Datos recopilados' })}</SectionTitle>
      <SubTitle>{tr({ fr: 'Sans compte (utilisation locale)', en: 'Without account (local use)', es: 'Sin cuenta (uso local)' })}</SubTitle>
      <P>{tr({
        fr: 'Aucune donnée n\'est transmise à nos serveurs. Toutes les données (séances, mesures, photos, etc.) restent stockées localement dans votre navigateur (IndexedDB et localStorage).',
        en: 'No data is sent to our servers. All your data (workouts, measurements, photos…) stays stored locally in your browser (IndexedDB and localStorage).',
        es: 'No se envía ningún dato a nuestros servidores. Todos los datos (sesiones, medidas, fotos…) permanecen almacenados localmente en tu navegador (IndexedDB y localStorage).',
      })}</P>

      <SubTitle>{tr({ fr: 'Avec un compte', en: 'With an account', es: 'Con una cuenta' })}</SubTitle>
      <Ul>
        <Li><strong>{tr({ fr: 'Adresse e-mail', en: 'Email address', es: 'Dirección de correo' })}</strong> — {tr({
          fr: "pour l'authentification et la récupération du compte.",
          en: 'for authentication and account recovery.',
          es: 'para autenticación y recuperación de la cuenta.',
        })}</Li>
        <Li><strong>{tr({ fr: "Données d'entraînement", en: 'Training data', es: 'Datos de entrenamiento' })}</strong> — {tr({
          fr: 'séances, exercices, séries (poids/reps), notes.',
          en: 'workouts, exercises, sets (weight/reps), notes.',
          es: 'sesiones, ejercicios, series (peso/reps), notas.',
        })}</Li>
        <Li><strong>{tr({ fr: 'Données corporelles', en: 'Body data', es: 'Datos corporales' })}</strong> — {tr({
          fr: 'poids, mensurations, photos de progression.',
          en: 'weight, measurements, progress photos.',
          es: 'peso, medidas, fotos de progreso.',
        })}</Li>
        <Li><strong>{tr({ fr: 'Préférences', en: 'Preferences', es: 'Preferencias' })}</strong> — {tr({
          fr: 'objectif, niveau, fréquence, blessures déclarées.',
          en: 'goal, level, frequency, declared injuries.',
          es: 'objetivo, nivel, frecuencia, lesiones declaradas.',
        })}</Li>
        <Li><strong>{tr({ fr: 'Conversations IA', en: 'AI conversations', es: 'Conversaciones IA' })}</strong> — {tr({
          fr: 'historique des échanges avec le Coach IA (si vous utilisez cette fonctionnalité).',
          en: 'history of exchanges with the AI Coach (if you use this feature).',
          es: 'historial de intercambios con el Coach IA (si usas esta función).',
        })}</Li>
      </Ul>

      <SubTitle>{tr({ fr: 'Intégrations tierces (optionnelles)', en: 'Third-party integrations (optional)', es: 'Integraciones de terceros (opcionales)' })}</SubTitle>
      <Ul>
        <Li><strong>Strava</strong> — {tr({
          fr: 'si connecté, nous récupérons vos activités cardio et calories actives via OAuth 2.0.',
          en: 'if connected, we fetch your cardio activities and active calories via OAuth 2.0.',
          es: 'si está conectado, obtenemos tus actividades cardio y calorías activas vía OAuth 2.0.',
        })}</Li>
        <Li><strong>Garmin</strong> — {tr({
          fr: 'si connecté, nous récupérons vos calories actives.',
          en: 'if connected, we fetch your active calories.',
          es: 'si está conectado, obtenemos tus calorías activas.',
        })}</Li>
        <Li><strong>Google Gemini (IA)</strong> — {tr({
          fr: 'vous fournissez votre propre clé API ; les messages transitent directement entre votre appareil et Google.',
          en: 'you provide your own API key; messages flow directly between your device and Google.',
          es: 'tú proporcionas tu propia clave API; los mensajes transitan directamente entre tu dispositivo y Google.',
        })}</Li>
      </Ul>

      <SectionTitle>{tr({ fr: '2. Finalité du traitement', en: '2. Purpose of processing', es: '2. Finalidad del tratamiento' })}</SectionTitle>
      <Ul>
        <Li>{tr({ fr: 'Permettre le suivi de votre progression sportive.', en: 'Enable tracking of your fitness progress.', es: 'Permitir el seguimiento de tu progreso deportivo.' })}</Li>
        <Li>{tr({ fr: 'Synchroniser vos données entre vos appareils.', en: 'Sync your data across your devices.', es: 'Sincronizar tus datos entre dispositivos.' })}</Li>
        <Li>{tr({ fr: 'Fournir des recommandations personnalisées via le Coach IA.', en: 'Provide personalised recommendations via the AI Coach.', es: 'Proporcionar recomendaciones personalizadas mediante el Coach IA.' })}</Li>
      </Ul>
      <P>{tr({
        fr: 'RezaKit ne vend, ne loue et ne transmet vos données à aucun tiers à des fins commerciales ou publicitaires.',
        en: 'RezaKit never sells, rents or shares your data with any third party for commercial or advertising purposes.',
        es: 'RezaKit nunca vende, alquila ni transmite tus datos a terceros con fines comerciales o publicitarios.',
      })}</P>

      <SectionTitle>{tr({ fr: '3. Base légale', en: '3. Legal basis', es: '3. Base jurídica' })}</SectionTitle>
      <P>{tr({
        fr: 'Le traitement de vos données est fondé sur votre consentement explicite (article 6.1.a RGPD), donné lors de la création du compte.',
        en: 'Processing of your data is based on your explicit consent (GDPR art. 6.1.a), given when creating the account.',
        es: 'El tratamiento de tus datos se basa en tu consentimiento explícito (RGPD art. 6.1.a), dado al crear la cuenta.',
      })}</P>

      <SectionTitle>{tr({ fr: '4. Durée de conservation', en: '4. Retention period', es: '4. Plazo de conservación' })}</SectionTitle>
      <P>{tr({
        fr: "Vos données sont conservées tant que votre compte est actif. En cas de suppression du compte, l'ensemble de vos données est effacé sous 30 jours, à l'exception des sauvegardes techniques qui sont purgées automatiquement après 90 jours.",
        en: 'Your data is kept while your account is active. If you delete your account, all your data is erased within 30 days, except technical backups which are purged automatically after 90 days.',
        es: 'Tus datos se conservan mientras tu cuenta esté activa. Si eliminas la cuenta, todos tus datos se borran en 30 días, salvo las copias técnicas que se purgan automáticamente tras 90 días.',
      })}</P>

      <SectionTitle>{tr({ fr: '5. Vos droits', en: '5. Your rights', es: '5. Tus derechos' })}</SectionTitle>
      <P>{tr({ fr: 'Conformément au RGPD, vous disposez des droits suivants :', en: 'Under the GDPR you have the following rights:', es: 'Conforme al RGPD, dispones de los siguientes derechos:' })}</P>
      <Ul>
        <Li><strong>{tr({ fr: "Droit d'accès", en: 'Right of access', es: 'Derecho de acceso' })}</strong> — {tr({ fr: 'visualiser vos données (Paramètres).', en: 'view your data (Settings).', es: 'consulta tus datos (Ajustes).' })}</Li>
        <Li><strong>{tr({ fr: 'Droit de rectification', en: 'Right to rectification', es: 'Derecho de rectificación' })}</strong> — {tr({ fr: "modifier vos données via l'interface.", en: 'edit your data through the interface.', es: 'modifica tus datos desde la interfaz.' })}</Li>
        <Li><strong>{tr({ fr: "Droit à l'effacement", en: 'Right to erasure', es: 'Derecho de supresión' })}</strong> — {tr({ fr: 'supprimer votre compte (Paramètres → Supprimer mon compte).', en: 'delete your account (Settings → Delete my account).', es: 'eliminar tu cuenta (Ajustes → Eliminar mi cuenta).' })}</Li>
        <Li><strong>{tr({ fr: 'Droit à la portabilité', en: 'Right to portability', es: 'Derecho a la portabilidad' })}</strong> — {tr({ fr: 'exporter vos données en CSV ou JSON (Paramètres → Exporter).', en: 'export your data as CSV or JSON (Settings → Export).', es: 'exporta tus datos en CSV o JSON (Ajustes → Exportar).' })}</Li>
        <Li><strong>{tr({ fr: "Droit d'opposition", en: 'Right to object', es: 'Derecho de oposición' })}</strong> — {tr({ fr: 'refuser certains traitements (désactiver les intégrations tierces).', en: 'refuse certain processing (disable third-party integrations).', es: 'rechaza ciertos tratamientos (desactivando integraciones de terceros).' })}</Li>
        <Li><strong>{tr({ fr: 'Droit de retirer votre consentement', en: 'Right to withdraw consent', es: 'Derecho a retirar el consentimiento' })}</strong> — {tr({ fr: 'à tout moment, sans affecter la licéité du traitement antérieur.', en: 'at any time, without affecting the lawfulness of prior processing.', es: 'en cualquier momento, sin afectar la licitud del tratamiento anterior.' })}</Li>
      </Ul>
      <P>{tr({ fr: 'Pour exercer ces droits, contactez', en: 'To exercise these rights, contact', es: 'Para ejercer estos derechos, contacta a' })}: <span style={{ color: 'var(--primary)' }}>jozer717606@gmail.com</span></P>
      <P>{tr({
        fr: "Vous pouvez également introduire une réclamation auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés) — cnil.fr.",
        en: 'You may also lodge a complaint with the French data protection authority (CNIL) — cnil.fr.',
        es: 'También puedes presentar una reclamación ante la autoridad francesa de protección de datos (CNIL) — cnil.fr.',
      })}</P>

      <SectionTitle>{tr({ fr: '6. Sécurité', en: '6. Security', es: '6. Seguridad' })}</SectionTitle>
      <Ul>
        <Li>{tr({ fr: 'Authentification chiffrée via Supabase Auth.', en: 'Encrypted authentication via Supabase Auth.', es: 'Autenticación cifrada vía Supabase Auth.' })}</Li>
        <Li>{tr({ fr: 'Connexion HTTPS obligatoire.', en: 'HTTPS connection enforced.', es: 'Conexión HTTPS obligatoria.' })}</Li>
        <Li>{tr({ fr: 'Mots de passe hachés (jamais stockés en clair).', en: 'Passwords hashed (never stored in clear).', es: 'Contraseñas hasheadas (nunca en texto plano).' })}</Li>
        <Li>{tr({ fr: 'Données chiffrées au repos sur les serveurs Supabase (AES-256).', en: 'Data encrypted at rest on Supabase servers (AES-256).', es: 'Datos cifrados en reposo en los servidores de Supabase (AES-256).' })}</Li>
      </Ul>

      <SectionTitle>{tr({ fr: '7. Cookies et stockage local', en: '7. Cookies and local storage', es: '7. Cookies y almacenamiento local' })}</SectionTitle>
      <P>{tr({
        fr: 'RezaKit utilise uniquement du stockage local (IndexedDB et localStorage) pour fonctionner — pas de cookies tiers ni de pixels de tracking.',
        en: 'RezaKit only uses local storage (IndexedDB and localStorage) to operate — no third-party cookies or tracking pixels.',
        es: 'RezaKit solo utiliza almacenamiento local (IndexedDB y localStorage) — sin cookies de terceros ni píxeles de seguimiento.',
      })}</P>
      <P>{tr({
        fr: "Aucun outil d'analyse comportementale (Google Analytics, Facebook Pixel, etc.) n'est installé.",
        en: 'No behavioural analytics tool (Google Analytics, Facebook Pixel, etc.) is installed.',
        es: 'No hay ninguna herramienta de análisis (Google Analytics, Facebook Pixel, etc.) instalada.',
      })}</P>

      <SectionTitle>{tr({ fr: '8. Photos de progression', en: '8. Progress photos', es: '8. Fotos de progreso' })}</SectionTitle>
      <P>{tr({
        fr: 'Les photos de progression que vous prenez sont stockées de manière privée dans Supabase Storage, accessibles uniquement par votre compte. Elles ne sont jamais partagées ni utilisées à d\'autres fins.',
        en: 'Progress photos you take are stored privately in Supabase Storage, accessible only by your account. They are never shared or used for any other purpose.',
        es: 'Las fotos de progreso se almacenan de forma privada en Supabase Storage, accesibles solo desde tu cuenta. Nunca se comparten ni se usan para otros fines.',
      })}</P>

      <SectionTitle>{tr({ fr: '9. Mineurs', en: '9. Minors', es: '9. Menores' })}</SectionTitle>
      <P>{tr({
        fr: "RezaKit n'est pas destiné aux mineurs de moins de 15 ans. Les utilisateurs entre 15 et 18 ans doivent obtenir l'accord parental.",
        en: 'RezaKit is not intended for minors under 15. Users between 15 and 18 must obtain parental consent.',
        es: 'RezaKit no está destinado a menores de 15 años. Los usuarios entre 15 y 18 años deben contar con consentimiento parental.',
      })}</P>

      <SectionTitle>{tr({ fr: '10. Modifications', en: '10. Changes', es: '10. Modificaciones' })}</SectionTitle>
      <P>{tr({
        fr: "Cette politique peut évoluer. Toute modification sera notifiée dans l'application et la date de dernière mise à jour sera actualisée.",
        en: 'This policy may evolve. Any change will be notified in the app and the last-update date will be refreshed.',
        es: 'Esta política puede cambiar. Cualquier modificación será notificada en la app y la fecha de última actualización se renovará.',
      })}</P>
    </>
  );
}

// ─── TERMS ───────────────────────────────────────────────────────────────────

function Terms() {
  return (
    <>
      <P>{tr({
        fr: "Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de l'application RezaKit. En utilisant l'application, vous acceptez ces conditions.",
        en: 'These Terms of Use govern your use of the RezaKit app. By using the app, you accept these terms.',
        es: 'Los presentes Términos de Uso regulan el uso de la aplicación RezaKit. Al usar la app, aceptas estos términos.',
      })}</P>

      <SectionTitle>{tr({ fr: '1. Objet', en: '1. Purpose', es: '1. Objeto' })}</SectionTitle>
      <P>{tr({
        fr: "RezaKit est une application de suivi sportif personnel permettant d'enregistrer ses entraînements de musculation, cardio, mesures corporelles et alimentation. Elle propose également un assistant IA pour des conseils personnalisés.",
        en: 'RezaKit is a personal fitness tracker that lets you log strength workouts, cardio, body measurements and nutrition. It also offers an AI assistant for personalised advice.',
        es: 'RezaKit es una app de seguimiento deportivo personal que permite registrar entrenamientos de fuerza, cardio, medidas corporales y alimentación. También ofrece un asistente IA para consejos personalizados.',
      })}</P>

      <SectionTitle>{tr({ fr: '2. Accès au service', en: '2. Service access', es: '2. Acceso al servicio' })}</SectionTitle>
      <P>{tr({
        fr: "L'utilisation de RezaKit est gratuite dans sa version actuelle. Une version premium pourra être proposée ultérieurement avec des fonctionnalités étendues.",
        en: 'Using RezaKit is free in its current version. A premium tier may be offered later with extended features.',
        es: 'El uso de RezaKit es gratuito en su versión actual. Más adelante puede ofrecerse una versión premium con funciones extendidas.',
      })}</P>
      <P>{tr({ fr: "L'utilisateur peut utiliser l'application :", en: 'You can use the app:', es: 'Puedes usar la app:' })}</P>
      <Ul>
        <Li>{tr({ fr: 'Sans compte — données stockées uniquement sur l\'appareil.', en: 'Without an account — data stored only on the device.', es: 'Sin cuenta — datos almacenados solo en el dispositivo.' })}</Li>
        <Li>{tr({ fr: 'Avec compte — synchronisation entre appareils via Supabase.', en: 'With an account — sync across devices via Supabase.', es: 'Con cuenta — sincronización entre dispositivos vía Supabase.' })}</Li>
      </Ul>

      <SectionTitle>{tr({ fr: '3. Compte utilisateur', en: '3. User account', es: '3. Cuenta de usuario' })}</SectionTitle>
      <P>{tr({ fr: "Lors de la création d'un compte, vous vous engagez à :", en: 'When creating an account, you commit to:', es: 'Al crear una cuenta, te comprometes a:' })}</P>
      <Ul>
        <Li>{tr({ fr: 'Fournir des informations exactes (e-mail valide).', en: 'Provide accurate information (valid email).', es: 'Proporcionar información exacta (correo válido).' })}</Li>
        <Li>{tr({ fr: 'Maintenir la confidentialité de votre mot de passe.', en: 'Keep your password confidential.', es: 'Mantener la confidencialidad de tu contraseña.' })}</Li>
        <Li>{tr({ fr: 'Ne pas partager votre compte avec des tiers.', en: 'Not share your account with third parties.', es: 'No compartir tu cuenta con terceros.' })}</Li>
      </Ul>

      <SectionTitle>{tr({ fr: '4. Avertissement santé', en: '4. Health disclaimer', es: '4. Aviso de salud' })}</SectionTitle>
      <P>{tr({
        fr: 'RezaKit n\'est pas un dispositif médical. Les conseils générés par l\'IA et les programmes proposés sont à titre informatif uniquement.',
        en: 'RezaKit is not a medical device. AI-generated advice and offered programs are for informational purposes only.',
        es: 'RezaKit no es un dispositivo médico. Los consejos generados por la IA y los programas propuestos son solo informativos.',
      })}</P>
      <P>{tr({ fr: 'Avant de commencer une activité physique :', en: 'Before starting physical activity:', es: 'Antes de comenzar una actividad física:' })}</P>
      <Ul>
        <Li>{tr({ fr: 'Consultez un médecin si vous avez des problèmes de santé.', en: 'Consult a doctor if you have health issues.', es: 'Consulta a un médico si tienes problemas de salud.' })}</Li>
        <Li>{tr({ fr: 'Faites-vous accompagner par un coach diplômé en cas de doute sur la technique.', en: 'Get help from a certified coach if you doubt your technique.', es: 'Pide ayuda a un entrenador certificado si dudas de tu técnica.' })}</Li>
        <Li>{tr({ fr: 'Écoutez votre corps et arrêtez en cas de douleur.', en: 'Listen to your body and stop if you feel pain.', es: 'Escucha tu cuerpo y detente si sientes dolor.' })}</Li>
      </Ul>
      <P>{tr({
        fr: "L'éditeur décline toute responsabilité en cas de blessure liée à l'usage de l'application.",
        en: 'The publisher disclaims any liability for injuries related to the use of the app.',
        es: 'El editor declina toda responsabilidad por lesiones relacionadas con el uso de la app.',
      })}</P>

      <SectionTitle>{tr({ fr: '5. Coach IA', en: '5. AI Coach', es: '5. Coach IA' })}</SectionTitle>
      <P>{tr({
        fr: "Le Coach IA utilise Google Gemini. Vous fournissez votre propre clé API. L'éditeur ne contrôle pas les réponses de l'IA et ne peut être tenu responsable d'erreurs ou d'inexactitudes.",
        en: 'The AI Coach uses Google Gemini. You provide your own API key. The publisher does not control the AI\'s responses and cannot be held liable for errors or inaccuracies.',
        es: 'El Coach IA usa Google Gemini. Tú aportas tu propia clave API. El editor no controla las respuestas de la IA y no es responsable de errores o imprecisiones.',
      })}</P>

      <SectionTitle>{tr({ fr: '6. Contenu utilisateur', en: '6. User content', es: '6. Contenido del usuario' })}</SectionTitle>
      <P>{tr({
        fr: 'Les données que vous saisissez (séances, photos, notes) restent votre propriété. Vous nous accordez uniquement le droit de les stocker pour vous fournir le service.',
        en: 'Data you enter (workouts, photos, notes) remains your property. You only grant us the right to store it in order to provide the service.',
        es: 'Los datos que introduces (sesiones, fotos, notas) siguen siendo de tu propiedad. Solo nos otorgas el derecho de almacenarlos para prestarte el servicio.',
      })}</P>
      <P>{tr({ fr: 'Vous vous engagez à ne pas :', en: 'You commit to not:', es: 'Te comprometes a no:' })}</P>
      <Ul>
        <Li>{tr({ fr: "Charger de contenu illégal, offensant ou portant atteinte aux droits d'autrui.", en: "Upload illegal, offensive content or content infringing others' rights.", es: 'Subir contenido ilegal, ofensivo o que infrinja los derechos de terceros.' })}</Li>
        <Li>{tr({ fr: "Utiliser l'application à des fins commerciales sans autorisation.", en: 'Use the app commercially without authorization.', es: 'Usar la app con fines comerciales sin autorización.' })}</Li>
        <Li>{tr({ fr: "Tenter d'accéder à des comptes tiers ou perturber le service.", en: 'Try to access third-party accounts or disrupt the service.', es: 'Intentar acceder a cuentas de terceros o perturbar el servicio.' })}</Li>
      </Ul>

      <SectionTitle>{tr({ fr: '7. Disponibilité', en: '7. Availability', es: '7. Disponibilidad' })}</SectionTitle>
      <P>{tr({
        fr: "L'éditeur s'efforce de maintenir le service accessible 24h/24. Néanmoins, des interruptions peuvent survenir pour maintenance, mise à jour ou cas de force majeure. Aucune garantie de disponibilité n'est fournie.",
        en: 'The publisher strives to keep the service available 24/7. However, interruptions may occur for maintenance, updates or force majeure. No availability guarantee is provided.',
        es: 'El editor se esfuerza en mantener el servicio accesible 24/7. No obstante, pueden producirse interrupciones por mantenimiento, actualizaciones o causas de fuerza mayor. No se ofrece ninguna garantía de disponibilidad.',
      })}</P>

      <SectionTitle>{tr({ fr: '8. Suppression du compte', en: '8. Account deletion', es: '8. Eliminación de cuenta' })}</SectionTitle>
      <P>{tr({
        fr: "Vous pouvez supprimer votre compte à tout moment depuis l'application (Paramètres). Cette action est irréversible et entraîne l'effacement définitif de l'ensemble de vos données.",
        en: 'You can delete your account anytime from the app (Settings). This action is irreversible and erases all your data permanently.',
        es: 'Puedes eliminar tu cuenta en cualquier momento desde la app (Ajustes). Esta acción es irreversible y borra todos tus datos definitivamente.',
      })}</P>

      <SectionTitle>{tr({ fr: '9. Modification des CGU', en: '9. Changes to terms', es: '9. Modificación de los términos' })}</SectionTitle>
      <P>{tr({
        fr: "L'éditeur se réserve le droit de modifier les présentes CGU à tout moment. Les modifications seront notifiées dans l'application.",
        en: 'The publisher may change these terms at any time. Changes will be notified in the app.',
        es: 'El editor se reserva el derecho de modificar los presentes términos en cualquier momento. Los cambios se notificarán en la app.',
      })}</P>

      <SectionTitle>{tr({ fr: '10. Litiges', en: '10. Disputes', es: '10. Conflictos' })}</SectionTitle>
      <P>{tr({
        fr: "Tout litige sera soumis au droit français. Une médiation amiable sera privilégiée avant toute action en justice.",
        en: 'Any dispute will be subject to French law. Amicable mediation will be preferred before any legal action.',
        es: 'Cualquier conflicto se someterá al derecho francés. Se priorizará la mediación amistosa antes de toda acción legal.',
      })}</P>
    </>
  );
}
