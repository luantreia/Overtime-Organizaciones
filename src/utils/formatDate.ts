const SAFE_FALLBACK = 'Sin fecha';

const parseDate = (isoDate: string): Date | null => {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDate = (isoDate: string, locale: string = 'es-AR'): string => {
  const date = parseDate(isoDate);
  if (!date) return SAFE_FALLBACK;

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = (isoDate: string, locale: string = 'es-AR'): string => {
  const date = parseDate(isoDate);
  if (!date) return SAFE_FALLBACK;

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const pad = (valor: number): string => String(valor).padStart(2, '0');

/**
 * Valor para un `<input type="datetime-local">`, que habla en hora local del dispositivo.
 * `toISOString().slice(0, 16)` metía UTC en ese campo: en Argentina el partido se abría 3 h
 * corrido y, como al guardar se reconvierte desde local, cada edición lo corría otras 3 h.
 * Mismo helper que dodgeballmanager.
 */
export const toDatetimeLocalValue = (isoDate?: string | null): string => {
  const date = parseDate(isoDate ?? '');
  if (!date) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};
