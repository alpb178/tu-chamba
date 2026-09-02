// Días calendario del negocio para los filtros del panel.
//
// El dashboard agrupa sus series por día de Bolivia (America/La_Paz), pero los
// filtros "desde/hasta" de auditoría, anuncios, reseñas y errores tomaban la
// fecha como día UTC. En Bolivia (UTC-4, sin horario de verano) eso corre el
// corte cuatro horas: todo lo ocurrido entre las 20:00 y la medianoche caía en
// el día siguiente del filtro, y los totales no cuadraban con el dashboard.

const DAY_MS = 24 * 60 * 60 * 1000;
// Bolivia no aplica horario de verano: el desfase es fijo.
const OFFSET_MS = 4 * 60 * 60 * 1000;

// 00:00 del día boliviano indicado ('YYYY-MM-DD'), en UTC. Si llega una marca
// de tiempo completa se respeta el instante recibido.
export function startOfDay(value: string) {
  if (value.includes('T')) return new Date(value);
  return new Date(Date.parse(`${value}T00:00:00.000Z`) + OFFSET_MS);
}

// 23:59:59.999 del día boliviano indicado, en UTC.
export function endOfDay(value: string) {
  if (value.includes('T')) return new Date(value);
  return new Date(startOfDay(value).getTime() + DAY_MS - 1);
}
