import { Suspense, lazy, useEffect, useState } from 'react';
import { useSessionStore } from './stores/sessionStore';
import { useCardioStore } from './stores/cardioStore';
import { useBodyWeightStore } from './stores/bodyweightStore';
import { useTemplateStore } from './stores/templateStore';
import { useExerciseStore } from './stores/exerciseStore';
import { useCalorieStore } from './stores/calorieStore';
import { useRoutineStore } from './stores/routineStore';
import { useMeasurementStore } from './stores/measurementStore';
import { useAuthStore } from './stores/authStore';
import { initDB } from './db/db';
import { restoreFromCloud, pushToCloud, scheduleSync } from './utils/cloudSync';
import { syncStravaActivities, syncGarminCalories } from './utils/strava';

// Critical-path routes — load eagerly so first paint is instant.
import Dashboard from './components/Dashboard';
import SessionForm from './components/SessionForm';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import UpdateBanner from './components/UpdateBanner';
import Params from './components/Params';
import SharedTemplateImport from './components/SharedTemplateImport';

// Heavier secondary routes — code-split into their own chunks loaded on demand.
const Calendar     = lazy(() => import('./components/Calendar'));
const Analytics    = lazy(() => import('./components/Analytics'));
const Cardio       = lazy(() => import('./components/Cardio'));
const Settings     = lazy(() => import('./components/Settings'));
const Daily        = lazy(() => import('./components/Daily'));
const AICoach      = lazy(() => import('./components/AICoach'));
const Measurements = lazy(() => import('./components/Measurements'));
const Legal        = lazy(() => import('./components/Legal'));

function RouteFallback() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-mute)', fontSize: 12, fontWeight: 700, letterSpacing: 1,
      textTransform: 'uppercase',
    }}>
      <div className="skeleton" style={{ width: 80, height: 6, borderRadius: 999 }} />
    </div>
  );
}

export type Page = 'dashboard' | 'calendar' | 'analytics' | 'cardio' | 'session' | 'params' | 'settings' | 'daily' | 'coach' | 'measurements' | 'legal';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'record' } | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(() => !!localStorage.getItem('onboarding_done'));

  const { currentSession, loadSessions } = useSessionStore();
  const { loadAll: loadCardio } = useCardioStore();
  const { loadWeights } = useBodyWeightStore();
  const { loadTemplates } = useTemplateStore();
  const { loadCustomExercises } = useExerciseStore();
  const { loadEntries } = useCalorieStore();
  const { loadAll: loadRoutine } = useRoutineStore();
  const { loadMeasurements } = useMeasurementStore();
  const { user, loading: authLoading, init: initAuth } = useAuthStore();

  const reloadAllStores = async () => {
    await Promise.all([
      loadSessions(),
      loadCardio(),
      loadWeights(),
      loadTemplates(),
      loadCustomExercises(),
      loadEntries(),
      loadRoutine(),
      loadMeasurements(),
    ]);
  };

  // Init DB + auth on mount
  useEffect(() => {
    initAuth();
    initDB().then(reloadAllStores);
  }, []);

  // Handle OAuth callbacks in URL (Strava / Garmin)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('strava_token')) {
      localStorage.setItem('strava_token', params.get('strava_token')!);
      localStorage.setItem('strava_refresh', params.get('strava_refresh')!);
      localStorage.setItem('strava_expires', params.get('strava_expires')!);
      localStorage.setItem('strava_athlete_id', params.get('strava_athlete_id')!);
      localStorage.setItem('strava_name', params.get('strava_name')!);
      window.history.replaceState({}, '', '/');
      showToast('Strava connecté — import en cours...', 'success');
      scheduleSync();
      syncStravaActivities().then(({ imported, caloriesImported }) => {
        if (imported > 0 || caloriesImported > 0) {
          const parts = [];
          if (imported > 0) parts.push(`${imported} activité${imported > 1 ? 's' : ''}`);
          if (caloriesImported > 0) parts.push(`${caloriesImported} kcal`);
          showToast(`Strava : ${parts.join(' · ')} importés !`, 'success');
        }
      });
    }

    if (params.get('garmin_token')) {
      localStorage.setItem('garmin_token', params.get('garmin_token')!);
      localStorage.setItem('garmin_secret', params.get('garmin_secret')!);
      window.history.replaceState({}, '', '/');
      showToast('Garmin connecté — import en cours...', 'success');
      scheduleSync();
      syncGarminCalories().then((cal) => {
        if (cal > 0) showToast(`Garmin : ${cal} kcal actives importées !`, 'success');
      });
    }

    if (params.get('strava_error')) {
      window.history.replaceState({}, '', '/');
      showToast('Connexion Strava annulée', 'info');
    }

    if (params.get('garmin_error')) {
      window.history.replaceState({}, '', '/');
      showToast('Connexion Garmin échouée', 'info');
    }
  }, []);

  // When user logs in: restore cloud data then reload stores
  useEffect(() => {
    if (!user) return;
    setSyncing(true);
    restoreFromCloud().then(async (restored) => {
      if (restored) {
        await reloadAllStores();
        showToast('Données synchronisées ☁', 'success');
      }
      setSyncing(false);
    });
  }, [user?.id]);

  // Push to cloud when app goes to background
  useEffect(() => {
    if (!user) return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') pushToCloud();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  useEffect(() => {
    if (currentSession && currentPage !== 'session') {
      setCurrentPage('session');
    }
  }, [currentSession]);

  // Keyboard detection via Visual Viewport
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const initialHeight = vv.height;
    const handler = () => { setKeyboardOpen(initialHeight - vv.height > 100); };
    vv.addEventListener('resize', handler);
    return () => vv.removeEventListener('resize', handler);
  }, []);

  const showToast = (message: string, type: 'success' | 'info' | 'record' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSessionEnd = () => {
    setCurrentPage('dashboard');
    showToast('Séance enregistrée', 'success');
  };

  const inSession = !!currentSession && currentPage === 'session';

  // Onboarding — first ever launch
  if (!onboardingDone) {
    return <Onboarding onDone={() => setOnboardingDone(true)} />;
  }

  // Auth screen
  if (showAuth && !user) {
    return <Auth
      onSkip={() => setShowAuth(false)}
      onShowLegal={() => { setShowAuth(false); setCurrentPage('legal'); }}
    />;
  }

  // Auth loading splash — visible branded screen, never stays > 4s
  if (authLoading) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at 30% 20%, rgba(255,107,53,0.18) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(196,30,58,0.12) 0%, transparent 50%), #050505',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0,
      }}>
        {/* Logo */}
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, letterSpacing: 4,
          color: '#FF6B35', lineHeight: 1, marginBottom: 6,
          textShadow: '0 0 60px rgba(255,107,53,0.5)',
        }}>
          RezaKit
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.28)', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 48 }}>
          Fitness · Coach IA
        </div>
        {/* Animated spinner */}
        <div style={{ position: 'relative', width: 36, height: 36 }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '2.5px solid rgba(255,107,53,0.15)',
          }} />
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '2.5px solid transparent',
            borderTopColor: '#FF6B35',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-0)', overflow: 'hidden' }}>
      <div className="ambient-bg" />

      {syncing && (
        <div style={{
          position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 8px)', left: '50%',
          transform: 'translateX(-50%)', zIndex: 200,
          background: 'rgba(14,14,16,0.95)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 999, padding: '6px 14px', fontSize: 11, color: 'var(--text-mute)', fontWeight: 600,
          backdropFilter: 'blur(12px)',
        }}>
          ⟳ Synchronisation...
        </div>
      )}

      <div style={{
        position: 'absolute', inset: 0,
        overflowY: 'auto', overflowX: 'hidden',
        scrollbarWidth: 'none',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: (inSession || currentPage === 'coach' || currentPage === 'daily')
          ? 'env(safe-area-inset-bottom, 0px)'
          : 'calc(90px + env(safe-area-inset-bottom, 8px))',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        touchAction: 'pan-y',
      }}>
        {currentPage === 'dashboard' && (
          <Dashboard
            onNewSession={() => setCurrentPage('session')}
            onGoToSettings={() => setCurrentPage('settings')}
            onGoToStats={() => setCurrentPage('analytics')}
            onGoToCoach={() => setCurrentPage('coach')}
            onGoToMeasurements={() => setCurrentPage('measurements')}
            showToast={showToast}
            user={user}
            onShowAuth={() => setShowAuth(true)}
            onSignOut={async () => {
              await useAuthStore.getState().signOut();
              showToast('Déconnecté', 'info');
            }}
          />
        )}

        {currentPage === 'session' && (
          <SessionForm
            onSessionEnd={handleSessionEnd}
            onCancel={() => {
              useSessionStore.getState().cancelSession();
              setCurrentPage('dashboard');
            }}
            showToast={showToast}
          />
        )}

        <Suspense fallback={<RouteFallback />}>
          {currentPage === 'calendar' && <Calendar
            onStartSession={() => setCurrentPage('session')}
            onAskCoach={() => setCurrentPage('coach')}
          />}
          {currentPage === 'analytics' && <Analytics showToast={showToast} />}
          {currentPage === 'cardio' && <Cardio showToast={showToast} />}
          {currentPage === 'daily' && <Daily showToast={showToast} onBack={() => setCurrentPage('dashboard')} />}
          {currentPage === 'settings' && <Settings
            showToast={showToast}
            onStartSession={() => setCurrentPage('session')}
            onAskCoach={() => setCurrentPage('coach')}
          />}
          {currentPage === 'coach' && <AICoach onBack={() => setCurrentPage('dashboard')} />}
          {currentPage === 'measurements' && <Measurements onClose={() => setCurrentPage('dashboard')} />}
          {currentPage === 'legal' && <Legal onBack={() => setCurrentPage('params')} />}
        </Suspense>
        {currentPage === 'params' && <Params showToast={showToast} onShowAuth={() => setShowAuth(true)} onShowLegal={() => setCurrentPage('legal')} />}
      </div>

      {!inSession && !keyboardOpen && currentPage !== 'daily' && currentPage !== 'coach' && currentPage !== 'measurements' && currentPage !== 'legal' && (
        <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
      )}

      <SharedTemplateImport
        showToast={showToast}
        onImported={() => setCurrentPage('calendar')}
      />

      {toast && <Toast message={toast.message} type={toast.type} />}
      <UpdateBanner />
    </div>
  );
}
