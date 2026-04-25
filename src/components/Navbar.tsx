import type { Page } from '../App';

interface NavbarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  hasActiveSession: boolean;
}

const NAV_ITEMS: { id: Page; icon: string; label: string }[] = [
  { id: 'dashboard', icon: '🏠', label: 'Home' },
  { id: 'calendar', icon: '📅', label: 'Calendrier' },
  { id: 'cardio', icon: '🏃', label: 'Cardio' },
  { id: 'analytics', icon: '📈', label: 'Stats' },
  { id: 'program', icon: '🏁', label: 'Programme' },
  { id: 'settings', icon: '⚙️', label: 'Réglages' },
];

export default function Navbar({ currentPage, onPageChange, hasActiveSession }: NavbarProps) {
  if (hasActiveSession) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark border-t border-primary/20 safe-bottom">
      <div className="flex justify-around px-1 py-1.5">
        {NAV_ITEMS.map((item) => {
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition ${
                active ? 'text-primary' : 'text-gray-500'
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className={`text-[9px] leading-none ${active ? 'font-bold' : ''}`}>{item.label}</span>
              {active && <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
