// src/utils/dataFormatter.ts

/**
 * Formata valores do banco de dados (Datas, Booleanos) para o padrão visual do SSMS.
 * @param val - O valor retornado do banco de dados.
 * @returns A string formatada ou null.
 */
export const formatSqlValue = (val: any): string | null => {
  if (val === null || val === undefined) return null;

  if (val instanceof Date) {
    const pad = (num: number, size: number = 2): string => String(num).padStart(size, '0');

    const year: number = val.getUTCFullYear();
    const month: string = pad(val.getUTCMonth() + 1);
    const day: string = pad(val.getUTCDate());
    const hours: string = pad(val.getUTCHours());
    const minutes: string = pad(val.getUTCMinutes());
    const seconds: string = pad(val.getUTCSeconds());
    const ms: string = pad(val.getUTCMilliseconds(), 3);

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
  }

  if (typeof val === 'boolean') {
    return val ? '1' : '0';
  }

  return String(val);
};