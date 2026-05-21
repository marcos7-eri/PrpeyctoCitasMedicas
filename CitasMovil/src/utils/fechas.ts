export function formatFecha(fecha: string): string {
  const [year, month, day] = fecha.split('-');
  return `${day}/${month}/${year}`;
}

export function formatHora(hora: string): string {
  return hora.substring(0, 5);
}

export function formatFechaLarga(fecha: string): string {
  const date = new Date(fecha + 'T12:00:00');
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getProximas14Dias(): { fecha: string; label: string; dayOfWeek: number }[] {
  const dias = [];
  const hoy = new Date();

  for (let i = 0; i < 14; i++) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + i);

    // Usar componentes locales para evitar desfase UTC vs. timezone local
    const year  = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day   = String(fecha.getDate()).padStart(2, '0');
    const fechaStr  = `${year}-${month}-${day}`;
    const dayOfWeek = fecha.getDay(); // 0=Dom, 1=Lun, ..., 6=Sab

    let label: string;
    if (i === 0) {
      label = 'Hoy';
    } else if (i === 1) {
      label = 'Mañana';
    } else {
      label = fecha.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    }
    dias.push({ fecha: fechaStr, label, dayOfWeek });
  }

  return dias;
}

export function generarSlots(
  horaInicio: string,
  horaFin: string,
  duracionMinutos: number
): string[] {
  const slots: string[] = [];
  const [h1, m1] = horaInicio.split(':').map(Number);
  const [h2, m2] = horaFin.split(':').map(Number);

  let totalMinutes = h1 * 60 + m1;
  const endMinutes = h2 * 60 + m2;

  while (totalMinutes + duracionMinutos <= endMinutes) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    totalMinutes += duracionMinutos;
  }

  return slots;
}

export function calcularHoraFin(horaInicio: string, duracionMinutos: number): string {
  const [h, m] = horaInicio.split(':').map(Number);
  const endMinutes = h * 60 + m + duracionMinutos;
  const hf = Math.floor(endMinutes / 60);
  const mf = endMinutes % 60;
  return `${String(hf).padStart(2, '0')}:${String(mf).padStart(2, '0')}:00`;
}

export function formatTimeAgo(fechaStr: string): string {
  const fecha = new Date(fechaStr);
  const ahora = new Date();
  const diffMs = ahora.getTime() - fecha.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Ahora mismo';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'Ayer';
  if (diffD < 7) return `Hace ${diffD} días`;
  return formatFecha(fecha.toISOString().split('T')[0]);
}
