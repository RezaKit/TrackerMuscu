export interface ExerciseSet {
  weight: number;
  reps: number;
  setNumber: number;
}

export interface ExerciseLog {
  id: string;
  sessionId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: ExerciseSet[];
  createdAt: string;
}

export type SessionType = 'push' | 'pull' | 'legs' | 'upper' | 'lower';

export interface Session {
  id: string;
  date: string;
  type: SessionType;
  exercises: ExerciseLog[];
  completed: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  type: SessionType;
  exerciseNames: Array<{ name: string; muscleGroup: string }>;
  createdAt: string;
}

export interface Course {
  id: string;
  date: string;
  distance: number;
  time: number;
  notes?: string;
  createdAt: string;
}

export interface Natation {
  id: string;
  date: string;
  distance: number;
  time: number;
  style?: string;
  notes?: string;
  createdAt: string;
}

export interface BodyWeight {
  id: string;
  date: string;
  weight: number;
  notes?: string;
  createdAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
}

export interface Record {
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
}
