import { useEffect, useState } from 'react';
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
import Dashboard from './components/Dashboard';
import SessionForm from './components/SessionForm';
import Calendar from './components/Calendar';
import Analytics from './components/Analytics';
import Cardio from './components/Cardio';
import Settings from './components/Settings';
import Params from './components/Params';
import Daily from './components/Daily';
import AICoach from './components/AICoach';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import Measurements from './components/Measurements';
import Legal from './components/Legal';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import UpdateBanner from './components/UpdateBanner';

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
    return <Auth onSkip={() => setShowAuth(false)} />;
  }

  // Auth loading splash
  if (authLoading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'var(--bg-0)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div className="ambient-bg" />
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
        {currentPage === 'params' && <Params showToast={showToast} onShowAuth={() => setShowAuth(true)} onShowLegal={() => setCurrentPage('legal')} />}
        {currentPage === 'coach' && <AICoach onBack={() => setCurrentPage('dashboard')} />}
        {currentPage === 'measurements' && <Measurements onClose={() => setCurrentPage('dashboard')} />}
        {currentPage === 'legal' && <Legal onBack={() => setCurrentPage('params')} />}
      </div>

      {!inSession && !keyboardOpen && currentPage !== 'daily' && currentPage !== 'coach' && currentPage !== 'measurements' && currentPage !== 'legal' && (
        <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
      <UpdateBanner />
    </div>
  );
}
