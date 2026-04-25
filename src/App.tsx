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
import Navbar from './components/Navbar';
import Toast from './components/Toast';

export type Page = 'dashboard' | 'calendar' | 'analytics' | 'cardio' | 'session' | 'program' | 'settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'record' } | null>(null);

  const { currentSession, loadSessions } = useSessionStore();
  const { loadAll: loadCardio } = useCardioStore();
  const { loadWeights } = useBodyWeightStore();
  const { loadTemplates } = useTemplateStore();
  const { loadCustomExercises } = useExerciseStore();

  useEffect(() => {
    initDB().then(async () => {
      await Promise.all([
        loadSessions(),
        loadCardio(),
        loadWeights(),
        loadTemplates(),
        loadCustomExercises(),
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
    showToast('Séance enregistrée ✅', 'success');
  };

  return (
    <div className="min-h-screen bg-bg-dark text-text-light pb-24">
      {currentPage === 'dashboard' && (
        <Dashboard
          onNewSession={() => setCurrentPage('session')}
          onGoToCardio={() => setCurrentPage('cardio')}
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
      {currentPage === 'analytics' && <Analytics />}
      {currentPage === 'cardio' && <Cardio showToast={showToast} />}
      {currentPage === 'program' && <RunningProgram />}
      {currentPage === 'settings' && <Settings showToast={showToast} />}

      <Navbar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        hasActiveSession={!!currentSession}
      />

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
