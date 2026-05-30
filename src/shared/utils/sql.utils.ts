export function extractFirstKeyword(sql: string): string {
  const trimmed = sql.trim();
  const match = trimmed.match(/^(\w+)/);
  return match ? match[1].toUpperCase() : '';
}

export function normalizeQuery(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}

export function addRowLimit(sql: string, maxRows: number): string {
  const keyword = extractFirstKeyword(sql);
  if (keyword !== 'SELECT' && keyword !== 'WITH') {
    return sql;
  }
  
  let q = sql.trim();
  const limitMatch = q.match(/limit\s+(\d+)/i);

  if (!limitMatch) {
    return `${q} LIMIT ${maxRows}`;
  }

  const limitValue = parseInt(limitMatch[1], 10);
  if (limitValue > maxRows) {
    q = q.replace(/limit\s+\d+/i, `LIMIT ${maxRows}`);
  }

  return q;
}
