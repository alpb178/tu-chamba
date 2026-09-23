// Business calendar days for the panel filters.
//
// The dashboard groups its series by Bolivian day (America/La_Paz), but the
// "from/to" filters for audit, listings, reviews and errors took the date as a
// UTC day. In Bolivia (UTC-4, no daylight saving) that shifts the cutoff by
// four hours: everything between 20:00 and midnight fell into the filter's
// next day, and the totals didn't match the dashboard.

const DAY_MS = 24 * 60 * 60 * 1000;
// Bolivia has no daylight saving time: the offset is fixed.
const OFFSET_MS = 4 * 60 * 60 * 1000;

// 00:00 of the given Bolivian day ('YYYY-MM-DD'), in UTC. If a full timestamp
// arrives, the received instant is kept as is.
export function startOfDay(value: string) {
  if (value.includes('T')) return new Date(value);
  return new Date(Date.parse(`${value}T00:00:00.000Z`) + OFFSET_MS);
}

// 23:59:59.999 of the given Bolivian day, in UTC.
export function endOfDay(value: string) {
  if (value.includes('T')) return new Date(value);
  return new Date(startOfDay(value).getTime() + DAY_MS - 1);
}
