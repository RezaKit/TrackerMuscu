import { useState } from 'react';
import { useCardioStore } from '../stores/cardioStore';
import { formatDate, formatTime, getDateString } from '../utils/export';

interface CardioProps {
  showToast: (msg: string, type?: 'success' | 'info' | 'record') => void;
}

type Tab = 'course' | 'natation';

export default function Cardio({ showToast }: CardioProps) {
  const [tab, setTab] = useState<Tab>('course');
  const { courses, natations, addCourse, addNatation, deleteCourse, deleteNatation } =
    useCardioStore();

  const [distance, setDistance] = useState('');
  const [time, setTime] = useState('');
  const [date, setDate] = useState(getDateString());
  const [notes, setNotes] = useState('');
  const [style, setStyle] = useState('Crawl');
  const [showForm, setShowForm] = useState(false);

  const handleAdd = async () => {
    const d = parseFloat(distance);
    const t = parseFloat(time);
    if (isNaN(d) || isNaN(t) || d <= 0 || t <= 0) return;

    if (tab === 'course') {
      await addCourse(d, t, date, notes || undefined);
      showToast(`Course ajoutée 🏃 ${d}km`, 'success');
    } else {
      await addNatation(d, t, date, style, notes || undefined);
      showToast(`Natation ajoutée 🏊 ${d}m`, 'success');
    }

    setDistance('');
    setTime('');
    setNotes('');
    setDate(getDateString());
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette séance ?')) return;
    if (tab === 'course') await deleteCourse(id);
    else await deleteNatation(id);
  };

  const entries = tab === 'course' ? courses : natations;
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  const totalDistance = sorted.reduce((sum, e) => sum + e.distance, 0);
  const totalTime = sorted.reduce((sum, e) => sum + e.time, 0);
  const avgPace =
    totalDistance > 0 && tab === 'course'
      ? totalTime / totalDistance
      : totalDistance > 0 && tab === 'natation'
      ? totalTime / (totalDistance / 100)
      : 0;

  return (
    <div className="p-4 pb-24 space-y-4">
      <h2 className="text-xl font-black text-primary">🏃 CARDIO</h2>

      <div className="flex gap-2 bg-dark rounded-xl p-1">
        <button
          onClick={() => setTab('course')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
            tab === 'course' ? 'bg-primary text-dark' : 'text-gray-400'
          }`}
        >
          🏃 Course
        </button>
        <button
          onClick={() => setTab('natation')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
            tab === 'natation' ? 'bg-primary text-dark' : 'text-gray-400'
          }`}
        >
          🏊 Natation
        </button>
      </div>

      {sorted.length > 0 && (
        <div className="bg-dark border border-primary/20 rounded-xl p-4 grid grid-cols-3 gap-2">
          <div>
            <p className="text-[10px] text-gray-500 uppercase">Total distance</p>
            <p className="text-lg font-black text-primary">
              {tab === 'course' ? `${totalDistance.toFixed(1)}km` : `${totalDistance}m`}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase">Séances</p>
            <p className="text-lg font-black text-primary">{sorted.length}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase">
              {tab === 'course' ? 'Min/km' : 'Min/100m'}
            </p>
            <p className="text-lg font-black text-primary">
              {avgPace > 0 ? avgPace.toFixed(1) : '-'}
            </p>
          </div>
        </div>
      )}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-gradient-to-r from-primary to-secondary text-white py-4 rounded-xl font-bold active:scale-95 transition"
        >
          + Nouvelle {tab === 'course' ? 'course' : 'natation'}
        </button>
      ) : (
        <div className="bg-dark border border-primary/30 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-primary">
              Nouvelle {tab === 'course' ? 'course' : 'natation'}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 text-sm">
              ✕
            </button>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-bg-dark border border-primary/40 rounded-lg px-3 py-2 text-text-light focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 uppercase">
                Distance ({tab === 'course' ? 'km' : 'm'})
              </label>
              <input
                type="number"
                inputMode="decimal"
                placeholder={tab === 'course' ? '5.2' : '1000'}
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="w-full bg-bg-dark border border-primary/40 rounded-lg px-3 py-2 text-primary font-bold focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Temps (min)</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="28"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-bg-dark border border-primary/40 rounded-lg px-3 py-2 text-primary font-bold focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {tab === 'natation' && (
            <div>
              <label className="text-xs text-gray-500 uppercase">Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-bg-dark border border-primary/40 rounded-lg px-3 py-2 text-text-light focus:outline-none focus:border-primary"
              >
                <option>Crawl</option>
                <option>Brasse</option>
                <option>Dos</option>
                <option>Papillon</option>
                <option>Mixte</option>
              </select>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-500 uppercase">Notes (optionnel)</label>
            <input
              type="text"
              placeholder="Ressenti, météo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-bg-dark border border-primary/40 rounded-lg px-3 py-2 text-text-light focus:outline-none focus:border-primary"
            />
          </div>

          <button
            onClick={handleAdd}
            disabled={!distance || !time}
            className="w-full bg-primary text-dark py-3 rounded-lg font-black disabled:opacity-30"
          >
            ✓ Enregistrer
          </button>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          Aucune {tab === 'course' ? 'course' : 'natation'} enregistrée
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="text-xs text-gray-500 uppercase font-bold">Historique</h3>
          {sorted.map((entry) => (
            <div
              key={entry.id}
              className="bg-dark border border-primary/20 rounded-xl p-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-text-light">
                    {tab === 'course'
                      ? `${entry.distance} km`
                      : `${entry.distance} m`}
                    <span className="text-gray-500 text-xs font-normal">
                      {' '}
                      · {formatTime(entry.time)}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(entry.date)}</p>
                  {tab === 'natation' && 'style' in entry && typeof (entry as any).style === 'string' && (entry as any).style && (
                    <p className="text-xs text-primary mt-1">{(entry as any).style as string}</p>
                  )}
                  {typeof entry.notes === 'string' && entry.notes && (
                    <p className="text-xs text-gray-400 mt-1 italic">{entry.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-secondary text-xs"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
