const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/utils/fechas.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const sandbox = { exports: {}, Date };
vm.runInNewContext(compiled, sandbox);
const { generarSlots, getProximas14Dias } = sandbox.exports;

test('genera horarios completos dentro del turno', () => {
  assert.deepEqual(Array.from(generarSlots('09:00', '10:00', 30)), ['09:00', '09:30']);
});
test('excluye horas pasadas y mantiene margen de 30 minutos hoy', () => {
  assert.deepEqual(Array.from(generarSlots('09:00', '11:00', 30, true, new Date(2026, 9, 4, 9, 20))), ['10:00', '10:30']);
});
test('las fechas futuras conservan todos los horarios', () => {
  assert.deepEqual(Array.from(generarSlots('09:00', '10:00', 30, false, new Date(2026, 9, 4, 23))), ['09:00', '09:30']);
});
test('duraciones inválidas no provocan un bucle infinito', () => {
  for (const duration of [0, -10, NaN, Infinity, 2.5]) assert.equal(generarSlots('09:00', '10:00', duration).length, 0);
});
test('rechaza horas inválidas y turnos invertidos', () => {
  assert.equal(generarSlots('24:00', '10:00', 30).length, 0);
  assert.equal(generarSlots('09:00', '08:00', 30).length, 0);
});
test('el primer día usa la fecha local y el calendario conserva 14 días', () => {
  const now = new Date();
  const local = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const days = getProximas14Dias();
  assert.equal(days.length, 14);
  assert.equal(days[0].fecha, local);
  assert.equal(days[0].dayOfWeek, now.getDay());
});
