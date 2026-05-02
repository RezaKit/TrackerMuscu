#!/usr/bin/env node
/**
 * RezaKit — Mixamo Exercise Downloader
 * ─────────────────────────────────────
 * Télécharge automatiquement toutes les animations d'exercices depuis Mixamo.
 *
 * SETUP (une seule fois) :
 * 1. Va sur mixamo.com et connecte-toi avec ton compte Adobe
 * 2. Clique sur n'importe quelle animation pour déclencher une requête
 * 3. Ouvre DevTools (F12) → onglet "Network"
 * 4. Cherche une requête vers "mixamo.com/api/" → clique dessus
 * 5. Dans l'onglet "Headers", copie la valeur après "Authorization: Bearer "
 * 6. Lance : node scripts/download-mixamo.mjs TON_TOKEN
 *
 * OUTPUT : public/models/exercises/*.glb  (prêts à charger en Three.js)
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// ── Config ────────────────────────────────────────────────────────────────────

const TOKEN = process.argv[2];

// YBot (personnage Mixamo standard — changeable si tu préfères un autre)
// Pour changer de perso : va sur Mixamo, choisis un perso, lance le script avec
// --character=ID (l'ID est visible dans l'URL de l'API Network tab)
const CHARACTER_ID_ARG = process.argv.find(a => a.startsWith('--character='));
const CHARACTER_ID = CHARACTER_ID_ARG
  ? CHARACTER_ID_ARG.split('=')[1]
  : '6b0a3b5e-7437-11e4-9fd5-54ea3a27c1e5'; // YBot par défaut

const OUTPUT_DIR = join(process.cwd(), 'public', 'models', 'exercises');
const CONCURRENCY = 2;   // téléchargements en parallèle (ne pas dépasser 3)
const DELAY_MS    = 800; // pause entre requêtes (évite le rate-limit)

// ── Liste complète des exercices ──────────────────────────────────────────────
// Format : { id: nom_du_fichier_glb, query: recherche_Mixamo }

const EXERCISES = [
  // ── PUSH ──────────────────────────────────────────────────────────────────
  { id: 'bench_press',         query: 'bench press' },
  { id: 'incline_bench_press', query: 'incline bench press' },
  { id: 'overhead_press',      query: 'overhead press standing' },
  { id: 'push_up',             query: 'push up' },
  { id: 'dip',                 query: 'dip tricep' },
  { id: 'tricep_extension',    query: 'tricep extension' },
  { id: 'tricep_pushdown',     query: 'tricep pushdown' },
  { id: 'chest_fly',           query: 'chest fly' },
  { id: 'lateral_raise',       query: 'lateral raise' },
  { id: 'front_raise',         query: 'front raise' },
  { id: 'arnold_press',        query: 'arnold press' },

  // ── PULL ──────────────────────────────────────────────────────────────────
  { id: 'pull_up',             query: 'pull up' },
  { id: 'chin_up',             query: 'chin up' },
  { id: 'lat_pulldown',        query: 'lat pulldown' },
  { id: 'seated_row',          query: 'seated row' },
  { id: 'bent_over_row',       query: 'bent over row' },
  { id: 'one_arm_row',         query: 'one arm dumbbell row' },
  { id: 'bicep_curl',          query: 'bicep curl' },
  { id: 'hammer_curl',         query: 'hammer curl' },
  { id: 'face_pull',           query: 'face pull' },
  { id: 'shrug',               query: 'shrug' },

  // ── LEGS ──────────────────────────────────────────────────────────────────
  { id: 'squat',               query: 'squat' },
  { id: 'front_squat',         query: 'front squat' },
  { id: 'deadlift',            query: 'deadlift' },
  { id: 'romanian_deadlift',   query: 'romanian deadlift' },
  { id: 'leg_press',           query: 'leg press' },
  { id: 'lunge',               query: 'lunge walking' },
  { id: 'reverse_lunge',       query: 'reverse lunge' },
  { id: 'leg_curl',            query: 'leg curl lying' },
  { id: 'leg_extension',       query: 'leg extension' },
  { id: 'calf_raise',          query: 'calf raise standing' },
  { id: 'hip_thrust',          query: 'hip thrust' },
  { id: 'glute_bridge',        query: 'glute bridge' },
  { id: 'sumo_squat',          query: 'sumo squat' },
  { id: 'step_up',             query: 'step up' },

  // ── CORE ──────────────────────────────────────────────────────────────────
  { id: 'plank',               query: 'plank' },
  { id: 'crunch',              query: 'crunch' },
  { id: 'sit_up',              query: 'sit up' },
  { id: 'leg_raise',           query: 'leg raise lying' },
  { id: 'russian_twist',       query: 'russian twist' },
  { id: 'mountain_climber',    query: 'mountain climber' },

  // ── CARDIO ────────────────────────────────────────────────────────────────
  { id: 'running',             query: 'running' },
  { id: 'jumping_jack',        query: 'jumping jack' },
  { id: 'burpee',              query: 'burpee' },
  { id: 'jump_squat',          query: 'jump squat' },
  { id: 'box_jump',            query: 'box jump' },
  { id: 'rope_jump',           query: 'jump rope' },
];

// ── API helpers ───────────────────────────────────────────────────────────────

const BASE = 'https://www.mixamo.com/api/v1';

async function apiGet(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
  return res.json();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Core functions ────────────────────────────────────────────────────────────

async function searchAnimation(query) {
  const data = await apiGet(
    `/products?limit=10&offset=0&order=&type=Motion%2CMotionPack&query=${encodeURIComponent(query)}`
  );
  return data.results?.[0] ?? null;
}

async function requestExport(productId) {
  const data = await apiPost('/animations/download', {
    character_id: CHARACTER_ID,
    product_id:   productId,
    type:         'Motion',
    pose:         'A',
    parameters: { trimStart: 0, trimEnd: 100, fps: 30, arm: 0.5 },
    gms_hash: { model: CHARACTER_ID, motion: productId, skeleton: 'mixamo', skin: true },
  });
  return data.job_id ?? null;
}

async function pollExport(jobId, timeout = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    await sleep(2500);
    const data = await apiGet(`/animations/download?job_id=${jobId}`);
    if (data.job_result === 'done')  return data.download_url;
    if (data.job_result === 'error') throw new Error(`Export job ${jobId} failed`);
  }
  throw new Error(`Export job ${jobId} timed out`);
}

async function downloadGLB(url, filepath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buf = await res.arrayBuffer();
  writeFileSync(filepath, Buffer.from(buf));
}

// ── Progress display ──────────────────────────────────────────────────────────

const STATUS = { done: '✅', skip: '⏭ ', fail: '❌', search: '🔍', export: '📦', dl: '⬇️ ' };

function log(icon, id, msg) {
  const time = new Date().toLocaleTimeString('fr', { hour12: false });
  console.log(`  ${icon} [${time}] ${id.padEnd(22)} ${msg}`);
}

// ── Process one exercise ──────────────────────────────────────────────────────

async function processExercise(ex) {
  const filepath = join(OUTPUT_DIR, `${ex.id}.glb`);

  if (existsSync(filepath)) {
    log(STATUS.skip, ex.id, 'déjà téléchargé');
    return true;
  }

  try {
    log(STATUS.search, ex.id, `recherche "${ex.query}"`);
    const product = await searchAnimation(ex.query);

    if (!product) {
      log(STATUS.fail, ex.id, 'aucune animation trouvée');
      return false;
    }

    log(STATUS.export, ex.id, `export "${product.name}"`);
    const jobId = await requestExport(product.id);

    if (!jobId) throw new Error('pas de job_id dans la réponse');

    const url = await pollExport(jobId);

    log(STATUS.dl, ex.id, 'téléchargement...');
    await downloadGLB(url, filepath);

    log(STATUS.done, ex.id, `${ex.id}.glb`);
    await sleep(DELAY_MS);
    return true;

  } catch (err) {
    log(STATUS.fail, ex.id, err.message);
    return false;
  }
}

// ── Pool: run N tasks concurrently ───────────────────────────────────────────

async function runPool(items, concurrency, fn) {
  const results = [];
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!TOKEN) {
    console.error(`
❌  Token manquant !

Comment l'obtenir (30 secondes) :
  1. Va sur mixamo.com → connecte-toi
  2. Ouvre DevTools (F12) → onglet Network
  3. Clique sur n'importe quelle animation
  4. Cherche une requête vers "mixamo.com/api/"
  5. Onglet Headers → copie la valeur après "Authorization: Bearer "

Puis lance :
  node scripts/download-mixamo.mjs TON_TOKEN
`);
    process.exit(1);
  }

  // Vérifier le token en récupérant le profil
  try {
    await apiGet('/characters?limit=1');
  } catch {
    console.error('❌  Token invalide ou expiré. Recopie-le depuis Mixamo.');
    process.exit(1);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`\n🏋️  RezaKit — Mixamo Downloader`);
  console.log(`   Personnage : ${CHARACTER_ID}`);
  console.log(`   Output     : public/models/exercises/`);
  console.log(`   Exercices  : ${EXERCISES.length}\n`);

  const results = await runPool(EXERCISES, CONCURRENCY, processExercise);

  const ok   = results.filter(Boolean).length;
  const fail = results.length - ok;

  console.log(`\n─────────────────────────────────────`);
  console.log(`✅  ${ok} téléchargés   ❌  ${fail} échoués`);

  if (fail > 0) {
    console.log(`\n💡 Pour les échoués, essaie de relancer (les déjà téléchargés sont ignorés).`);
  }

  console.log(`\n📁 Fichiers dans : public/models/exercises/\n`);
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
