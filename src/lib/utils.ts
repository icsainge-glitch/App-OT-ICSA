import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFolio(folio: string | number | undefined | null): string {
  if (folio === undefined || folio === null) return 'D-00000';
  const numParsed = Number(folio);
  if (isNaN(numParsed)) return String(folio).startsWith('D-') ? String(folio) : `D-${folio}`;
  return `D-${String(numParsed).padStart(5, '0')}`;
}
