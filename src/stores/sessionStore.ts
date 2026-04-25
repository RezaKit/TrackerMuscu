import { create } from 'zustand';
import { db } from '../db/db';
import type { Session, ExerciseLog, SessionType } from '../types';

interface SessionStore {
  currentSession: Session | null;
  sessions: Session[];

  createSession: (type: SessionType) => void;
  cancelSession: () => void;
  endSession: () => Promise<Session | null>;

  addExercise: (exerciseName: string, muscleGroup: string) => void;
  deleteExercise: (exerciseId: string) => void;

  addSet: (exerciseId: string, weight: number, reps: number) => void;
  editSet: (exerciseId: string, setIndex: number, weight: number, reps: number) => void;
  deleteSet: (exerciseId: string, setIndex: number) => void;

  loadFromTemplate: (exerciseNames: Array<{ name: string; muscleGroup: string }>) => void;

  loadSessions: () => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  currentSession: null,
  sessions: [],

  createSession: (type) => {
    const newSession: Session = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      type,
      exercises: [],
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set({ currentSession: newSession });
  },

  cancelSession: () => {
    set({ currentSession: null });
  },

  addExercise: (exerciseName, muscleGroup) => {
    const { currentSession } = get();
    if (!currentSession) return;

    const exerciseLog: ExerciseLog = {
      id: crypto.randomUUID(),
      sessionId: currentSession.id,
      exerciseName,
      muscleGroup,
      sets: [],
      createdAt: new Date().toISOString(),
    };

    set({
      currentSession: {
        ...currentSession,
        exercises: [...currentSession.exercises, exerciseLog],
      },
    });
  },

  deleteExercise: (exerciseId) => {
    const { currentSession } = get();
    if (!currentSession) return;

    set({
      currentSession: {
        ...currentSession,
        exercises: currentSession.exercises.filter((ex) => ex.id !== exerciseId),
      },
    });
  },

  addSet: (exerciseId, weight, reps) => {
    const { currentSession } = get();
    if (!currentSession) return;

    set({
      currentSession: {
        ...currentSession,
        exercises: currentSession.exercises.map((ex) => {
          if (ex.id === exerciseId) {
            const setNumber = ex.sets.length + 1;
            return { ...ex, sets: [...ex.sets, { weight, reps, setNumber }] };
          }
          return ex;
        }),
      },
    });
  },

  editSet: (exerciseId, setIndex, weight, reps) => {
    const { currentSession } = get();
    if (!currentSession) return;

    set({
      currentSession: {
        ...currentSession,
        exercises: currentSession.exercises.map((ex) => {
          if (ex.id === exerciseId) {
            const newSets = [...ex.sets];
            newSets[setIndex] = { ...newSets[setIndex], weight, reps };
            return { ...ex, sets: newSets };
          }
          return ex;
        }),
      },
    });
  },

  deleteSet: (exerciseId, setIndex) => {
    const { currentSession } = get();
    if (!currentSession) return;

    set({
      currentSession: {
        ...currentSession,
        exercises: currentSession.exercises.map((ex) => {
          if (ex.id === exerciseId) {
            const newSets = ex.sets
              .filter((_, i) => i !== setIndex)
              .map((s, i) => ({ ...s, setNumber: i + 1 }));
            return { ...ex, sets: newSets };
          }
          return ex;
        }),
      },
    });
  },

  loadFromTemplate: (exerciseNames) => {
    const { currentSession } = get();
    if (!currentSession) return;

    const newExercises: ExerciseLog[] = exerciseNames.map((ex) => ({
      id: crypto.randomUUID(),
      sessionId: currentSession.id,
      exerciseName: ex.name,
      muscleGroup: ex.muscleGroup,
      sets: [],
      createdAt: new Date().toISOString(),
    }));

    set({
      currentSession: {
        ...currentSession,
        exercises: [...currentSession.exercises, ...newExercises],
      },
    });
  },

  endSession: async () => {
    const { currentSession } = get();
    if (!currentSession || currentSession.exercises.length === 0) return null;

    const completed: Session = {
      ...currentSession,
      completed: true,
      updatedAt: new Date().toISOString(),
    };

    await db.sessions.put(completed);
    const sessions = await db.sessions.toArray();
    set({ currentSession: null, sessions });
    return completed;
  },

  loadSessions: async () => {
    const sessions = await db.sessions.toArray();
    set({ sessions });
  },

  deleteSession: async (id) => {
    await db.sessions.delete(id);
    const sessions = await db.sessions.toArray();
    set({ sessions });
  },
}));
