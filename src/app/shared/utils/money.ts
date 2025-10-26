// Money helpers in BR locale

export function round2(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export function sum(arr: Array<number | undefined | null>): number {
  const values = arr ?? [];
  const total = values.reduce<number>(
    (acc, v) => acc + (Number(v ?? 0) || 0),
    0
  );
  return round2(total);
}

export function formatPtBR(n: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);
}
