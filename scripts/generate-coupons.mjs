// scripts/generate-coupons.mjs
// Genera un lote de cupones únicos, aleatorios y seguros -> coupon_pool.json
// Códigos criptográficamente aleatorios (crypto.randomBytes), sin sesgo (alfabeto de 32),
// sin caracteres confusos (0/O/1/I). Espacio 32^8 ≈ 1,1 billones -> imposibles de adivinar.
//
// Subir a la RTDB (como propietario, salta las reglas de forma legítima):
//   firebase database:set /coupon_pool coupon_pool.json --project pagepino-e8e97 --account <cuenta-owner>
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const N = Number(process.env.COUPON_COUNT || 10000);
const PCT = Number(process.env.COUPON_PCT || 20);
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 chars exactos (256 % 32 === 0 => uniforme)
const LEN = 8;
const nowIso = new Date().toISOString();
const batch = nowIso.slice(0, 10);

function code() {
  const b = randomBytes(LEN);
  let s = '';
  for (let i = 0; i < LEN; i++) s += ALPHABET[b[i] % 32];
  return 'PINO-' + s;
}

const pool = {};
let n = 0;
while (n < N) {
  const c = code();
  if (pool[c]) continue; // evita colisiones (dedupe)
  pool[c] = { estado: 'available', descuento_pct: PCT, batch, created_at: nowIso };
  n++;
}

writeFileSync('coupon_pool.json', JSON.stringify(pool));
console.log(`OK ${n} cupones unicos generados en coupon_pool.json (batch ${batch}, -${PCT}%)`);
