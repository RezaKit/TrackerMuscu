import type { ExerciseLog } from '../types';

interface MuscleMapProps {
  exercises: ExerciseLog[];
  size?: number;
}

// Maps the high-level "muscle group" stored on each exercise to the individual
// anatomical muscle paths in the SVG. Each path id corresponds to a <path id="…">
// drawn below.
const EXO_TO_MUSCLES: Record<string, string[]> = {
  chest:     ['pec_upper_l', 'pec_upper_r', 'pec_lower_l', 'pec_lower_r', 'serratus_l', 'serratus_r'],
  back:      ['lats_l', 'lats_r', 'rhomboid', 'erector_l', 'erector_r', 'traps_mid'],
  shoulders: ['delt_ant_l', 'delt_ant_r', 'delt_lat_l', 'delt_lat_r', 'delt_post_l', 'delt_post_r', 'traps_upper_l', 'traps_upper_r'],
  biceps:    ['biceps_l', 'biceps_r', 'brachial_l', 'brachial_r'],
  triceps:   ['tri_lat_l', 'tri_lat_r', 'tri_long_l', 'tri_long_r'],
  forearms:  ['forearm_fl_l', 'forearm_fl_r', 'forearm_ex_l', 'forearm_ex_r'],
  legs:      ['quad_rec_l', 'quad_rec_r', 'quad_vl_l', 'quad_vl_r', 'quad_vm_l', 'quad_vm_r',
              'ham_bf_l', 'ham_bf_r', 'ham_st_l', 'ham_st_r',
              'glute_l', 'glute_r', 'glute_med_l', 'glute_med_r'],
  calves:    ['gastro_lat_l', 'gastro_lat_r', 'gastro_med_l', 'gastro_med_r',
              'soleus_l', 'soleus_r', 'tibialis_l', 'tibialis_r'],
  core:      ['abs_t_l', 'abs_t_r', 'abs_m_l', 'abs_m_r', 'abs_b_l', 'abs_b_r',
              'oblique_l', 'oblique_r'],
};

function intensityColor(intensity: number, fallback = 'rgba(255,255,255,0.05)'): string {
  if (intensity <= 0) return fallback;
  if (intensity < 0.2)  return 'rgba(255,170,90,0.40)';
  if (intensity < 0.4)  return 'rgba(255,140,60,0.60)';
  if (intensity < 0.6)  return 'rgba(255,107,53,0.80)';
  if (intensity < 0.8)  return 'rgba(232,68,42,0.92)';
  return 'rgba(196,30,58,1)';
}

export default function MuscleMap({ exercises, size = 280 }: MuscleMapProps) {
  // Aggregate volume per muscle group
  const volumeByGroup: Record<string, number> = {};
  exercises.forEach((ex) => {
    const vol = ex.sets.reduce((s, st) => s + (st.weight || 1) * st.reps, 0);
    volumeByGroup[ex.muscleGroup] = (volumeByGroup[ex.muscleGroup] || 0) + Math.max(vol, 1);
  });
  const maxVol = Math.max(1, ...Object.values(volumeByGroup));

  // Spread group intensity into individual muscle ids
  const intensityByMuscle: Record<string, number> = {};
  Object.entries(volumeByGroup).forEach(([group, vol]) => {
    const muscles = EXO_TO_MUSCLES[group] || [];
    const intensity = vol / maxVol;
    muscles.forEach((m) => {
      intensityByMuscle[m] = Math.max(intensityByMuscle[m] || 0, intensity);
    });
  });

  const fill = (id: string) => intensityColor(intensityByMuscle[id] || 0);
  const skin = 'rgba(255,255,255,0.045)';        // body outline / unworked muscle
  const stroke = 'rgba(255,255,255,0.18)';       // muscle definition lines
  const sw = 0.5;                                 // stroke width

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
      {/* ─── FRONT VIEW ─── */}
      <svg viewBox="0 0 200 440" width={size / 2} height={size} style={{ flexShrink: 0 }}>
        {/* Body silhouette */}
        <path d="M 100 12
          C 112 12 122 22 122 38
          C 122 50 116 60 110 64
          L 116 76
          L 142 90 Q 152 96 154 110
          L 158 132
          C 160 148 158 160 156 172
          L 166 190 Q 172 220 168 252
          L 156 270
          L 158 290 Q 162 320 154 350
          L 150 376 Q 152 400 148 420
          L 148 432 L 130 432 L 128 420
          Q 124 380 124 360
          L 116 280
          L 110 270
          L 90 270
          L 84 280
          L 76 360
          Q 76 380 72 420
          L 70 432 L 52 432 L 52 420
          Q 48 400 50 376
          L 46 350 Q 38 320 42 290
          L 44 270
          L 32 252
          Q 28 220 34 190
          L 44 172
          C 42 160 40 148 42 132
          L 46 110 Q 48 96 58 90
          L 84 76
          L 90 64
          C 84 60 78 50 78 38
          C 78 22 88 12 100 12 Z"
          fill={skin} stroke={stroke} strokeWidth={sw}/>

        {/* Head shading (face line) */}
        <path d="M 100 36 L 100 50" stroke={stroke} strokeWidth={sw}/>

        {/* Neck — sternocleidomastoid lines */}
        <path d="M 92 64 L 96 80" stroke={stroke} strokeWidth={sw} fill="none"/>
        <path d="M 108 64 L 104 80" stroke={stroke} strokeWidth={sw} fill="none"/>

        {/* TRAPS upper (visible from front above clavicles) */}
        <path id="traps_upper_l" d="M 100 76 L 92 80 L 84 92 L 92 96 L 100 88 Z"
          fill={fill('traps_upper_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="traps_upper_r" d="M 100 76 L 108 80 L 116 92 L 108 96 L 100 88 Z"
          fill={fill('traps_upper_r')} stroke={stroke} strokeWidth={sw}/>

        {/* DELTOID anterior */}
        <path id="delt_ant_l" d="M 80 90 Q 70 96 66 110 Q 70 122 78 124 L 88 116 Q 84 100 82 92 Z"
          fill={fill('delt_ant_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="delt_ant_r" d="M 120 90 Q 130 96 134 110 Q 130 122 122 124 L 112 116 Q 116 100 118 92 Z"
          fill={fill('delt_ant_r')} stroke={stroke} strokeWidth={sw}/>

        {/* DELTOID lateral (side cap) */}
        <path id="delt_lat_l" d="M 66 110 Q 60 118 60 130 Q 64 138 72 138 L 78 124 Q 70 122 66 110 Z"
          fill={fill('delt_lat_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="delt_lat_r" d="M 134 110 Q 140 118 140 130 Q 136 138 128 138 L 122 124 Q 130 122 134 110 Z"
          fill={fill('delt_lat_r')} stroke={stroke} strokeWidth={sw}/>

        {/* PEC upper (clavicular head) */}
        <path id="pec_upper_l" d="M 98 92 L 88 96 L 80 102 Q 76 112 84 120 L 98 116 Z"
          fill={fill('pec_upper_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="pec_upper_r" d="M 102 92 L 112 96 L 120 102 Q 124 112 116 120 L 102 116 Z"
          fill={fill('pec_upper_r')} stroke={stroke} strokeWidth={sw}/>

        {/* PEC lower (sternal head) */}
        <path id="pec_lower_l" d="M 84 120 L 98 116 L 100 158 L 88 156 Q 78 152 78 138 Z"
          fill={fill('pec_lower_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="pec_lower_r" d="M 116 120 L 102 116 L 100 158 L 112 156 Q 122 152 122 138 Z"
          fill={fill('pec_lower_r')} stroke={stroke} strokeWidth={sw}/>

        {/* Cleavage line */}
        <line x1="100" y1="92" x2="100" y2="158" stroke={stroke} strokeWidth={sw}/>

        {/* SERRATUS anterior (finger-like ribs) */}
        <path id="serratus_l" d="M 78 142 L 72 154 L 76 168 L 82 154 Z"
          fill={fill('serratus_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="serratus_r" d="M 122 142 L 128 154 L 124 168 L 118 154 Z"
          fill={fill('serratus_r')} stroke={stroke} strokeWidth={sw}/>

        {/* BICEPS brachii */}
        <path id="biceps_l" d="M 56 130 Q 46 140 46 158 Q 50 178 58 184 L 66 174 Q 64 158 64 142 Q 60 134 56 130 Z"
          fill={fill('biceps_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="biceps_r" d="M 144 130 Q 154 140 154 158 Q 150 178 142 184 L 134 174 Q 136 158 136 142 Q 140 134 144 130 Z"
          fill={fill('biceps_r')} stroke={stroke} strokeWidth={sw}/>

        {/* Biceps split line */}
        <line x1="55" y1="148" x2="55" y2="178" stroke={stroke} strokeWidth={sw}/>
        <line x1="145" y1="148" x2="145" y2="178" stroke={stroke} strokeWidth={sw}/>

        {/* BRACHIALIS (small muscle near elbow on outer side) */}
        <path id="brachial_l" d="M 64 174 Q 62 184 64 192 L 70 188 Q 68 178 66 174 Z"
          fill={fill('brachial_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="brachial_r" d="M 136 174 Q 138 184 136 192 L 130 188 Q 132 178 134 174 Z"
          fill={fill('brachial_r')} stroke={stroke} strokeWidth={sw}/>

        {/* FOREARM flexors (front of forearm) */}
        <path id="forearm_fl_l" d="M 50 188 Q 42 200 42 226 Q 46 250 54 264 L 64 256 Q 60 234 62 210 Q 58 196 50 188 Z"
          fill={fill('forearm_fl_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="forearm_fl_r" d="M 150 188 Q 158 200 158 226 Q 154 250 146 264 L 136 256 Q 140 234 138 210 Q 142 196 150 188 Z"
          fill={fill('forearm_fl_r')} stroke={stroke} strokeWidth={sw}/>

        {/* ABDOMINALS — proper 6-pack */}
        <path id="abs_t_l" d="M 90 162 L 99 162 L 99 180 L 88 180 Z"
          fill={fill('abs_t_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="abs_t_r" d="M 110 162 L 101 162 L 101 180 L 112 180 Z"
          fill={fill('abs_t_r')} stroke={stroke} strokeWidth={sw}/>

        <path id="abs_m_l" d="M 88 184 L 99 184 L 99 202 L 86 202 Z"
          fill={fill('abs_m_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="abs_m_r" d="M 112 184 L 101 184 L 101 202 L 114 202 Z"
          fill={fill('abs_m_r')} stroke={stroke} strokeWidth={sw}/>

        <path id="abs_b_l" d="M 86 206 L 99 206 L 99 230 L 84 230 Z"
          fill={fill('abs_b_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="abs_b_r" d="M 114 206 L 101 206 L 101 230 L 116 230 Z"
          fill={fill('abs_b_r')} stroke={stroke} strokeWidth={sw}/>

        {/* OBLIQUES */}
        <path id="oblique_l" d="M 78 168 L 86 174 L 84 230 L 74 220 Z"
          fill={fill('oblique_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="oblique_r" d="M 122 168 L 114 174 L 116 230 L 126 220 Z"
          fill={fill('oblique_r')} stroke={stroke} strokeWidth={sw}/>

        {/* Hip / pelvis (no muscle highlight, just shading) */}
        <path d="M 84 232 Q 100 248 116 232 L 116 264 Q 100 270 84 264 Z"
          fill="rgba(255,255,255,0.03)" stroke={stroke} strokeWidth={sw}/>
        <line x1="100" y1="234" x2="100" y2="266" stroke={stroke} strokeWidth={sw}/>

        {/* QUADS — vastus lateralis (outer) */}
        <path id="quad_vl_l" d="M 80 270 Q 72 290 72 320 Q 76 348 84 360 L 90 354 L 92 280 Z"
          fill={fill('quad_vl_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="quad_vl_r" d="M 120 270 Q 128 290 128 320 Q 124 348 116 360 L 110 354 L 108 280 Z"
          fill={fill('quad_vl_r')} stroke={stroke} strokeWidth={sw}/>

        {/* QUADS — rectus femoris (center) */}
        <path id="quad_rec_l" d="M 92 280 L 99 280 L 99 354 L 94 354 Z"
          fill={fill('quad_rec_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="quad_rec_r" d="M 108 280 L 101 280 L 101 354 L 106 354 Z"
          fill={fill('quad_rec_r')} stroke={stroke} strokeWidth={sw}/>

        {/* QUADS — vastus medialis (inner, teardrop above knee) */}
        <path id="quad_vm_l" d="M 92 330 Q 88 348 90 358 L 99 358 L 99 330 Z"
          fill={fill('quad_vm_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="quad_vm_r" d="M 108 330 Q 112 348 110 358 L 101 358 L 101 330 Z"
          fill={fill('quad_vm_r')} stroke={stroke} strokeWidth={sw}/>

        {/* Knees */}
        <ellipse cx="86" cy="368" rx="9" ry="6" fill="rgba(255,255,255,0.04)" stroke={stroke} strokeWidth={sw}/>
        <ellipse cx="114" cy="368" rx="9" ry="6" fill="rgba(255,255,255,0.04)" stroke={stroke} strokeWidth={sw}/>

        {/* TIBIALIS anterior (front shin) */}
        <path id="tibialis_l" d="M 80 380 Q 76 400 78 416 L 84 414 Q 88 400 88 386 L 86 380 Z"
          fill={fill('tibialis_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="tibialis_r" d="M 120 380 Q 124 400 122 416 L 116 414 Q 112 400 112 386 L 114 380 Z"
          fill={fill('tibialis_r')} stroke={stroke} strokeWidth={sw}/>

        {/* Calves visible front (gastrocnemius peek-out) */}
        <path d="M 88 384 Q 90 408 90 420 L 96 420 L 96 384 Z"
          fill="rgba(255,255,255,0.04)" stroke={stroke} strokeWidth={sw}/>
        <path d="M 112 384 Q 110 408 110 420 L 104 420 L 104 384 Z"
          fill="rgba(255,255,255,0.04)" stroke={stroke} strokeWidth={sw}/>

        {/* Label */}
        <text x="100" y="438" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontWeight="800" fontFamily="system-ui" letterSpacing="2">FACE</text>
      </svg>

      {/* ─── BACK VIEW ─── */}
      <svg viewBox="0 0 200 440" width={size / 2} height={size} style={{ flexShrink: 0 }}>
        {/* Body silhouette (mirror of front) */}
        <path d="M 100 12
          C 112 12 122 22 122 38
          C 122 50 116 60 110 64
          L 116 76
          L 142 90 Q 152 96 154 110
          L 158 132
          C 160 148 158 160 156 172
          L 166 190 Q 172 220 168 252
          L 156 270
          L 158 290 Q 162 320 154 350
          L 150 376 Q 152 400 148 420
          L 148 432 L 130 432 L 128 420
          Q 124 380 124 360
          L 116 280
          L 110 270
          L 90 270
          L 84 280
          L 76 360
          Q 76 380 72 420
          L 70 432 L 52 432 L 52 420
          Q 48 400 50 376
          L 46 350 Q 38 320 42 290
          L 44 270
          L 32 252
          Q 28 220 34 190
          L 44 172
          C 42 160 40 148 42 132
          L 46 110 Q 48 96 58 90
          L 84 76
          L 90 64
          C 84 60 78 50 78 38
          C 78 22 88 12 100 12 Z"
          fill={skin} stroke={stroke} strokeWidth={sw}/>

        {/* TRAPS upper (back) — diamond above shoulder blades */}
        <path id="traps_upper_l_b" d="M 100 70 L 80 86 L 88 110 L 100 100 Z"
          fill={fill('traps_upper_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="traps_upper_r_b" d="M 100 70 L 120 86 L 112 110 L 100 100 Z"
          fill={fill('traps_upper_r')} stroke={stroke} strokeWidth={sw}/>

        {/* TRAPS middle (between shoulder blades) */}
        <path id="traps_mid" d="M 88 110 L 112 110 L 108 138 L 92 138 Z"
          fill={fill('traps_mid')} stroke={stroke} strokeWidth={sw}/>

        {/* RHOMBOIDS (smaller, between scapulae) */}
        <path id="rhomboid" d="M 92 114 L 108 114 L 106 132 L 94 132 Z"
          fill={fill('rhomboid')} stroke={stroke} strokeWidth={sw}/>

        {/* DELTOID posterior */}
        <path id="delt_post_l" d="M 80 96 Q 64 108 60 126 Q 64 140 72 140 L 84 130 Q 80 116 82 100 Z"
          fill={fill('delt_post_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="delt_post_r" d="M 120 96 Q 136 108 140 126 Q 136 140 128 140 L 116 130 Q 120 116 118 100 Z"
          fill={fill('delt_post_r')} stroke={stroke} strokeWidth={sw}/>

        {/* TRICEPS — lateral head */}
        <path id="tri_lat_l" d="M 56 138 Q 46 150 46 168 Q 50 184 56 188 L 62 178 Q 60 164 62 148 Z"
          fill={fill('tri_lat_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="tri_lat_r" d="M 144 138 Q 154 150 154 168 Q 150 184 144 188 L 138 178 Q 140 164 138 148 Z"
          fill={fill('tri_lat_r')} stroke={stroke} strokeWidth={sw}/>

        {/* TRICEPS — long head (inner) */}
        <path id="tri_long_l" d="M 62 148 Q 64 162 64 178 L 70 178 Q 68 162 70 144 Q 66 142 62 148 Z"
          fill={fill('tri_long_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="tri_long_r" d="M 138 148 Q 136 162 136 178 L 130 178 Q 132 162 130 144 Q 134 142 138 148 Z"
          fill={fill('tri_long_r')} stroke={stroke} strokeWidth={sw}/>

        {/* LATS — V-shape down */}
        <path id="lats_l" d="M 84 130 Q 78 156 80 190 Q 86 210 100 212 L 100 156 L 88 138 Z"
          fill={fill('lats_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="lats_r" d="M 116 130 Q 122 156 120 190 Q 114 210 100 212 L 100 156 L 112 138 Z"
          fill={fill('lats_r')} stroke={stroke} strokeWidth={sw}/>

        {/* FOREARM extensors */}
        <path id="forearm_ex_l" d="M 50 192 Q 42 204 42 230 Q 46 254 54 268 L 64 260 Q 60 238 62 214 Q 58 200 50 192 Z"
          fill={fill('forearm_ex_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="forearm_ex_r" d="M 150 192 Q 158 204 158 230 Q 154 254 146 268 L 136 260 Q 140 238 138 214 Q 142 200 150 192 Z"
          fill={fill('forearm_ex_r')} stroke={stroke} strokeWidth={sw}/>

        {/* ERECTOR SPINAE (lower back columns) */}
        <path id="erector_l" d="M 90 212 L 99 212 L 99 250 L 90 248 Z"
          fill={fill('erector_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="erector_r" d="M 110 212 L 101 212 L 101 250 L 110 248 Z"
          fill={fill('erector_r')} stroke={stroke} strokeWidth={sw}/>

        {/* GLUTE medius (upper, smaller) */}
        <path id="glute_med_l" d="M 80 244 Q 76 254 80 262 L 92 256 L 92 244 Z"
          fill={fill('glute_med_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="glute_med_r" d="M 120 244 Q 124 254 120 262 L 108 256 L 108 244 Z"
          fill={fill('glute_med_r')} stroke={stroke} strokeWidth={sw}/>

        {/* GLUTE max (large round) */}
        <path id="glute_l" d="M 78 252 Q 72 268 78 282 Q 88 290 99 282 L 99 256 Q 90 250 78 252 Z"
          fill={fill('glute_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="glute_r" d="M 122 252 Q 128 268 122 282 Q 112 290 101 282 L 101 256 Q 110 250 122 252 Z"
          fill={fill('glute_r')} stroke={stroke} strokeWidth={sw}/>

        {/* HAMSTRINGS — biceps femoris (outer) */}
        <path id="ham_bf_l" d="M 80 286 Q 74 308 74 334 Q 78 354 86 360 L 92 354 L 92 290 Z"
          fill={fill('ham_bf_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="ham_bf_r" d="M 120 286 Q 126 308 126 334 Q 122 354 114 360 L 108 354 L 108 290 Z"
          fill={fill('ham_bf_r')} stroke={stroke} strokeWidth={sw}/>

        {/* HAMSTRINGS — semitendinosus (inner) */}
        <path id="ham_st_l" d="M 92 290 L 99 290 L 99 358 L 92 354 Z"
          fill={fill('ham_st_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="ham_st_r" d="M 108 290 L 101 290 L 101 358 L 108 354 Z"
          fill={fill('ham_st_r')} stroke={stroke} strokeWidth={sw}/>

        {/* Hamstring crease (knee fold) */}
        <line x1="80" y1="358" x2="98" y2="362" stroke={stroke} strokeWidth={sw}/>
        <line x1="120" y1="358" x2="102" y2="362" stroke={stroke} strokeWidth={sw}/>

        {/* CALVES — gastrocnemius medial head (inner) */}
        <path id="gastro_med_l" d="M 92 372 Q 88 394 90 410 L 99 410 L 99 372 Z"
          fill={fill('gastro_med_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="gastro_med_r" d="M 108 372 Q 112 394 110 410 L 101 410 L 101 372 Z"
          fill={fill('gastro_med_r')} stroke={stroke} strokeWidth={sw}/>

        {/* CALVES — gastrocnemius lateral head (outer) */}
        <path id="gastro_lat_l" d="M 80 372 Q 76 394 80 412 L 90 410 L 92 372 Z"
          fill={fill('gastro_lat_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="gastro_lat_r" d="M 120 372 Q 124 394 120 412 L 110 410 L 108 372 Z"
          fill={fill('gastro_lat_r')} stroke={stroke} strokeWidth={sw}/>

        {/* SOLEUS (lower calf, peeks out) */}
        <path id="soleus_l" d="M 82 412 Q 80 422 84 426 L 92 422 L 92 412 Z"
          fill={fill('soleus_l')} stroke={stroke} strokeWidth={sw}/>
        <path id="soleus_r" d="M 118 412 Q 120 422 116 426 L 108 422 L 108 412 Z"
          fill={fill('soleus_r')} stroke={stroke} strokeWidth={sw}/>

        {/* Label */}
        <text x="100" y="438" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontWeight="800" fontFamily="system-ui" letterSpacing="2">DOS</text>
      </svg>
    </div>
  );
}
