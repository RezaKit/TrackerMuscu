import { useEffect, useMemo, useState } from 'react';
import type { Session } from '../types';
import { Icons } from './Icons';
import MuscleMap from './MuscleMap';

interface SessionSummaryProps {
  session: Session;
  isNewRecord?: { exercise: string; weight: number; reps: number }[];
  onClose: () => void;
  onTakePhoto?: () => void;
}

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pectoraux', back: 'Dos', shoulders: 'Épaules',
  biceps: 'Biceps', triceps: 'Triceps', forearms: 'Avant-bras',
  legs: 'Jambes', calves: 'Mollets', core: 'Abdos',
};

export default function SessionSummary({ session, isNewRecord = [], onClose, onTakePhoto }: SessionSummaryProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const stats = useMemo(() => {
    const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const totalReps = session.exercises.reduce((sum, ex) =>
      sum + ex.sets.reduce((s, set) => s + set.reps, 0), 0);
    const totalVolume = session.exercises.reduce((sum, ex) =>
      sum + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0);

    const groupVolume: Record<string, { sets: number; reps: number; volume: number }> = {};
    session.exercises.forEach((ex) => {
      const g = groupVolume[ex.muscleGroup] || { sets: 0, reps: 0, volume: 0 };
      g.sets += ex.sets.length;
      g.reps += ex.sets.reduce((s, set) => s + set.reps, 0);
      g.volume += ex.sets.reduce((s, set) => s + set.weight * set.reps, 0);
      groupVolume[ex.muscleGroup] = g;
    });

    const sortedGroups = Object.entries(groupVolume).sort((a, b) => b[1].volume - a[1].volume);

    return { totalSets, totalReps, totalVolume, sortedGroups };
  }, [session]);

  return (
    <div className="page-enter" style={{
      minHeight: '100vh',
      padding: '20px 18px calc(120px + env(safe-area-inset-bottom, 0px))',
      background: 'radial-gradient(ellipse at top, rgba(255,107,53,0.08), transparent 60%), var(--bg-base, #050505)',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 22, margin: '0 auto 12px',
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 12px 32px rgba(255,107,53,0.4)',
          transform: animated ? 'scale(1)' : 'scale(0.5)',
          transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          <Icons.Trophy size={32} color="#fff" />
        </div>
        <div className="t-display" style={{ fontSize: 36, lineHeight: 0.9, marginBottom: 6 }}>
          Séance terminée
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: 0.16, fontWeight: 700 }}>
          {session.type.toUpperCase()} · {session.exercises.length} exercices
        </div>
      </div>

      {/* PR Banner */}
      {isNewRecord.length > 0 && (
        <div style={{
          marginBottom: 18, padding: '14px 16px',
          background: 'linear-gradient(135deg, rgba(255,107,53,0.18), rgba(196,30,58,0.18))',
          border: '1px solid rgba(255,107,53,0.4)',
          borderRadius: 18,
          opacity: animated ? 1 : 0, transform: animated ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.6s 0.3s, transform 0.6s 0.3s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 22 }}>🏆</span>
            <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 14, letterSpacing: 0.1 }}>
              {isNewRecord.length} NOUVEAU{isNewRecord.length > 1 ? 'X' : ''} RECORD{isNewRecord.length > 1 ? 'S' : ''} !
            </span>
          </div>
          {isNewRecord.map((r, i) => (
            <div key={i} style={{ fontSize: 12, color: 'var(--text-soft)', marginLeft: 32 }}>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{r.exercise}</span>
              <span style={{ color: 'var(--text-mute)' }}> · {r.weight}kg × {r.reps}</span>
            </div>
          ))}
        </div>
      )}

      {/* Muscle map */}
      <div className="glass" style={{
        borderRadius: 24, padding: '20px 16px 14px', marginBottom: 16,
        opacity: animated ? 1 : 0, transform: animated ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s 0.2s, transform 0.6s 0.2s',
      }}>
        <div style={{ fontSize: 11, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.14, marginBottom: 12, textAlign: 'center' }}>
          Muscles travaillés
        </div>
        <MuscleMap exercises={session.exercises} size={300} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Léger', color: 'rgba(255,107,53,0.35)' },
            { label: 'Moyen', color: 'rgba(255,107,53,0.6)' },
            { label: 'Intense', color: 'rgba(255,90,30,0.85)' },
            { label: 'Max', color: 'rgba(196,30,58,1)' },
          ].map((l) => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
              <span style={{ fontSize: 9.5, color: 'var(--text-mute)', fontWeight: 600 }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16,
        opacity: animated ? 1 : 0, transform: animated ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s 0.4s, transform 0.6s 0.4s',
      }}>
        {[
          { label: 'Volume', value: `${(stats.totalVolume / 1000).toFixed(1)}t`, sub: 'tonnes' },
          { label: 'Sets', value: stats.totalSets, sub: 'séries' },
          { label: 'Reps', value: stats.totalReps, sub: 'répétitions' },
        ].map((s) => (
          <div key={s.label} className="glass" style={{ borderRadius: 16, padding: '14px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.14 }}>{s.label}</div>
            <div className="t-display" style={{ fontSize: 24, color: 'var(--primary)', lineHeight: 1, marginTop: 4 }}>{s.value}</div>
            <div style={{ fontSize: 9, color: 'var(--text-faint)', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Per-muscle breakdown */}
      <div className="glass" style={{
        borderRadius: 22, padding: '14px 16px', marginBottom: 16,
        opacity: animated ? 1 : 0, transform: animated ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s 0.5s, transform 0.6s 0.5s',
      }}>
        <div style={{ fontSize: 11, color: 'var(--text-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.14, marginBottom: 10 }}>
          Détail par groupe
        </div>
        {stats.sortedGroups.map(([group, g], i) => {
          const max = stats.sortedGroups[0][1].volume;
          const pct = max > 0 ? (g.volume / max) * 100 : 0;
          return (
            <div key={group} style={{ marginBottom: i === stats.sortedGroups.length - 1 ? 0 : 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                  {MUSCLE_LABELS[group] || group}
                </span>
                <span className="t-mono" style={{ fontSize: 11, color: 'var(--text-mute)' }}>
                  {g.sets} sets · {g.reps} reps · {Math.round(g.volume)}kg
                </span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  width: animated ? `${pct}%` : '0%',
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                  borderRadius: 999,
                  transition: `width 0.8s ${0.6 + i * 0.08}s ease-out`,
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {onTakePhoto && (
          <button onClick={onTakePhoto} className="tap" style={{
            border: 'none', borderRadius: 18, padding: '14px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: '#fff', fontWeight: 700, fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 8px 24px rgba(255,107,53,0.3)',
          }}>
            <Icons.Camera size={16} /> Photo de progression
          </button>
        )}
        <button onClick={onClose} className="tap glass" style={{
          border: '1px solid var(--glass-border)', borderRadius: 18, padding: '14px',
          color: 'var(--text)', fontWeight: 700, fontSize: 14,
        }}>
          Terminer
        </button>
      </div>
    </div>
  );
}
