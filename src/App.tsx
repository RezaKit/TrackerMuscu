import { useEffect, useState } from 'react';
import { useSessionStore } from './stores/sessionStore';
import { useCardioStore } from './stores/cardioStore';
import { useBodyWeightStore } from './stores/bodyweightStore';
import { useTemplateStore } from './stores/templateStore';
import { useExerciseStore } from './stores/exerciseStore';
import { initDB } from './db/db';
import Dashboard from './components/Dashboard';
import SessionForm from './components/SessionForm';
import Calendar from './components/Calendar';
import Analytics from './components/Analytics';
import Cardio from './components/Cardio';
import RunningProgram from './components/RunningProgram';
import Settings from './components/Settings';
import Daily from './components/Daily';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import { useCalorieStore } from './stores/calorieStore';
import { useRoutineStore } from './stores/routineStore';

export type Page = 'dashboard' | 'calendar' | 'analytics' | 'cardio' | 'session' | 'program' | 'settings' | 'daily';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'record' } | null>(null);

  const { currentSession, loadSessions } = useSessionStore();
  const { loadAll: loadCardio } = useCardioStore();
  const { loadWeights } = useBodyWeightStore();
  const { loadTemplates } = useTemplateStore();
  const { loadCustomExercises } = useExerciseStore();
  const { loadEntries } = useCalorieStore();
  const { loadAll: loadRoutine } = useRoutineStore();

  useEffect(() => {
    initDB().then(async () => {
      await Promise.all([
        loadSessions(),
        loadCardio(),
        loadWeights(),
        loadTemplates(),
        loadCustomExercises(),
        loadEntries(),
        loadRoutine(),
      ]);
    });
  }, []);

  useEffect(() => {
    if (currentSession && currentPage !== 'session') {
      setCurrentPage('session');
    }
  }, [currentSession]);

  const showToast = (message: string, type: 'success' | 'info' | 'record' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSessionEnd = () => {
    setCurrentPage('dashboard');
    showToast('Séance enregistrée', 'success');
  };

  const inSession = !!currentSession && currentPage === 'session';

  return (
    <div style={{
      height: '100%',
      background: 'var(--bg-0)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient animated background */}
      <div className="ambient-bg" />

      {/* Page content */}
      <div style={{
        position: 'absolute', inset: 0,
        overflowY: 'auto', overflowX: 'hidden',
        scrollbarWidth: 'none',
        paddingBottom: inSession ? 0 : 120,
        zIndex: 1,
      }}>
        {currentPage === 'dashboard' && (
          <Dashboard
            onNewSession={() => setCurrentPage('session')}
            onGoToCardio={() => setCurrentPage('cardio')}
            onGoToDaily={() => setCurrentPage('daily')}
            onGoToSettings={() => setCurrentPage('settings')}
            onGoToStats={() => setCurrentPage('analytics')}
            showToast={showToast}
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

        {currentPage === 'calendar' && <Calendar />}
        {currentPage === 'analytics' && <Analytics showToast={showToast} />}
        {currentPage === 'cardio' && <Cardio showToast={showToast} />}
        {currentPage === 'program' && <RunningProgram />}
        {currentPage === 'daily' && <Daily showToast={showToast} />}
        {currentPage === 'settings' && <Settings showToast={showToast} />}
      </div>

      {/* Navbar */}
      {!inSession && (
        <Navbar
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
