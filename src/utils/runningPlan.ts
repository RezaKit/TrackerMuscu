export interface RunWeek {
  week: number;
  sundayDate: string;
  phase: string;
  phaseNum: number;
  longRunKm: number;
  optionalKm: number | null;
  description: string;
  isRecovery: boolean;
  isTaper: boolean;
  isPeak: boolean;
}

const RACE_DATE = '2026-11-01';
const FIRST_SUNDAY = '2026-04-27';

export const PLAN: RunWeek[] = [
  // Phase 1 - Découverte
  { week: 1, sundayDate: '2026-04-27', phase: 'Découverte', phaseNum: 1, longRunKm: 3, optionalKm: null, description: 'Première sortie ! Allure conversation, pas de pression.', isRecovery: false, isTaper: false, isPeak: false },
  { week: 2, sundayDate: '2026-05-04', phase: 'Découverte', phaseNum: 1, longRunKm: 4, optionalKm: null, description: 'Tu te sens ? Ajoute 1km. Marche si besoin.', isRecovery: false, isTaper: false, isPeak: false },
  { week: 3, sundayDate: '2026-05-11', phase: 'Découverte', phaseNum: 1, longRunKm: 5, optionalKm: null, description: '5km — objectif intermédiaire atteint !', isRecovery: false, isTaper: false, isPeak: false },
  { week: 4, sundayDate: '2026-05-18', phase: 'Découverte', phaseNum: 1, longRunKm: 4, optionalKm: null, description: 'Semaine de récupération. Allure facile.', isRecovery: true, isTaper: false, isPeak: false },

  // Phase 2 - Fondation
  { week: 5, sundayDate: '2026-05-25', phase: 'Fondation', phaseNum: 2, longRunKm: 6, optionalKm: 3, description: 'On monte. Tu peux ajouter une sortie courte en semaine.', isRecovery: false, isTaper: false, isPeak: false },
  { week: 6, sundayDate: '2026-06-01', phase: 'Fondation', phaseNum: 2, longRunKm: 7, optionalKm: 3, description: '7km — le rythme s\'installe.', isRecovery: false, isTaper: false, isPeak: false },
  { week: 7, sundayDate: '2026-06-08', phase: 'Fondation', phaseNum: 2, longRunKm: 8, optionalKm: 4, description: '8km, tu n\'étais pas fan de courir ? Regarde où t\'en es.', isRecovery: false, isTaper: false, isPeak: false },
  { week: 8, sundayDate: '2026-06-15', phase: 'Fondation', phaseNum: 2, longRunKm: 6, optionalKm: null, description: 'Récupération active. Jambes fraîches pour la suite.', isRecovery: true, isTaper: false, isPeak: false },

  // Phase 3 - Construction
  { week: 9, sundayDate: '2026-06-22', phase: 'Construction', phaseNum: 3, longRunKm: 10, optionalKm: 4, description: '10km — demi de l\'objectif. Tu gères.', isRecovery: false, isTaper: false, isPeak: false },
  { week: 10, sundayDate: '2026-06-29', phase: 'Construction', phaseNum: 3, longRunKm: 11, optionalKm: 5, description: 'Maintenir l\'allure confort. Boire régulièrement.', isRecovery: false, isTaper: false, isPeak: false },
  { week: 11, sundayDate: '2026-07-06', phase: 'Construction', phaseNum: 3, longRunKm: 12, optionalKm: 5, description: '12km — les jambes commencent à connaître la distance.', isRecovery: false, isTaper: false, isPeak: false },
  { week: 12, sundayDate: '2026-07-13', phase: 'Construction', phaseNum: 3, longRunKm: 8, optionalKm: null, description: 'Récup. Profite des jambes fraîches.', isRecovery: true, isTaper: false, isPeak: false },

  // Phase 4 - Endurance
  { week: 13, sundayDate: '2026-07-20', phase: 'Endurance', phaseNum: 4, longRunKm: 13, optionalKm: 5, description: '13km — au-delà du 10km maintenant. Nouvelle zone.', isRecovery: false, isTaper: false, isPeak: false },
  { week: 14, sundayDate: '2026-07-27', phase: 'Endurance', phaseNum: 4, longRunKm: 14, optionalKm: 6, description: 'Concentration sur la régularité d\'allure.', isRecovery: false, isTaper: false, isPeak: false },
  { week: 15, sundayDate: '2026-08-03', phase: 'Endurance', phaseNum: 4, longRunKm: 15, optionalKm: 6, description: '15km — tu cours des distances sérieuses maintenant.', isRecovery: false, isTaper: false, isPeak: false },
  { week: 16, sundayDate: '2026-08-10', phase: 'Endurance', phaseNum: 4, longRunKm: 10, optionalKm: null, description: 'Récupération. Semaine légère.', isRecovery: true, isTaper: false, isPeak: false },

  // Phase 5 - Spécifique
  { week: 17, sundayDate: '2026-08-17', phase: 'Spécifique', phaseNum: 5, longRunKm: 16, optionalKm: 6, description: '16km — on entre dans le vif du sujet.', isRecovery: false, isTaper: false, isPeak: false },
  { week: 18, sundayDate: '2026-08-24', phase: 'Spécifique', phaseNum: 5, longRunKm: 17, optionalKm: 7, description: 'Commence à visualiser la course. 17km = pres des ¾.', isRecovery: false, isTaper: false, isPeak: false },
  { week: 19, sundayDate: '2026-08-31', phase: 'Spécifique', phaseNum: 5, longRunKm: 18, optionalKm: 7, description: '18km. Le mental est aussi important que les jambes.', isRecovery: false, isTaper: false, isPeak: false },
  { week: 20, sundayDate: '2026-09-07', phase: 'Spécifique', phaseNum: 5, longRunKm: 12, optionalKm: null, description: 'Semaine de récupération avant le pic.', isRecovery: true, isTaper: false, isPeak: false },

  // Phase 6 - Peak
  { week: 21, sundayDate: '2026-09-14', phase: 'Peak', phaseNum: 6, longRunKm: 19, optionalKm: 7, description: '19km. L\'avant-dernier effort long.', isRecovery: false, isTaper: false, isPeak: false },
  { week: 22, sundayDate: '2026-09-21', phase: 'Peak', phaseNum: 6, longRunKm: 21, optionalKm: null, description: '🔥 SIMULATION SEMI — 21km en conditions réelles !', isRecovery: false, isTaper: false, isPeak: true },
  { week: 23, sundayDate: '2026-09-28', phase: 'Peak', phaseNum: 6, longRunKm: 12, optionalKm: null, description: 'Récup post-simulation. Jambes OK ? Excellent.', isRecovery: true, isTaper: false, isPeak: false },

  // Phase 7 - Affûtage (Taper)
  { week: 24, sundayDate: '2026-10-05', phase: 'Affûtage', phaseNum: 7, longRunKm: 12, optionalKm: 5, description: 'Début du taper. On réduit le volume, on garde l\'allure.', isRecovery: false, isTaper: true, isPeak: false },
  { week: 25, sundayDate: '2026-10-12', phase: 'Affûtage', phaseNum: 7, longRunKm: 10, optionalKm: 4, description: 'Jambes fraîches, tête prête. Routine légère.', isRecovery: false, isTaper: true, isPeak: false },
  { week: 26, sundayDate: '2026-10-19', phase: 'Affûtage', phaseNum: 7, longRunKm: 8, optionalKm: null, description: 'Dernier effort long. Garde de l\'énergie.', isRecovery: false, isTaper: true, isPeak: false },
  { week: 27, sundayDate: '2026-10-26', phase: 'Affûtage', phaseNum: 7, longRunKm: 5, optionalKm: null, description: 'Shakeout final. Facile, fluide. Tu es prêt.', isRecovery: false, isTaper: true, isPeak: false },
];

export const RACE_INFO = {
  date: RACE_DATE,
  name: 'Semi-Marathon',
  distanceKm: 21.1,
  firstSunday: FIRST_SUNDAY,
};

export function getCurrentWeek(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const first = new Date(FIRST_SUNDAY);
  first.setHours(0, 0, 0, 0);
  if (today < first) return 0;
  const diffDays = Math.floor((today.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
  const week = Math.floor(diffDays / 7) + 1;
  return Math.min(week, PLAN.length);
}

export function getDaysUntilRace(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const race = new Date(RACE_DATE);
  race.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((race.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
}

export function getWeekProgress(): number {
  const current = getCurrentWeek();
  return Math.min(100, Math.round((current / PLAN.length) * 100));
}
