
/**
 * Valida un RUT chileno mediante el algoritmo del dígito verificador (Módulo 11).
 * @param rut El RUT a validar (puede incluir puntos y guion).
 * @returns true si el RUT es válido, false en caso contrario.
 */
export function validateRut(rut: string): boolean {
  if (!rut || typeof rut !== 'string') return false;

  // Limpiar puntos y guiones, y convertir a mayúsculas
  let value = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();

  // Validar longitud mínima (RUTs de 7 u 8 dígitos + DV)
  if (value.length < 8) return false;

  const body = value.slice(0, -1);
  const dv = value.slice(-1);

  // El cuerpo debe ser numérico
  if (!body.match(/^\d+$/)) return false;

  let sum = 0;
  let multiplier = 2;

  // Algoritmo Módulo 11
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedDv = 11 - (sum % 11);
  const calculatedDv = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString();

  return dv === calculatedDv;
}

/**
 * Formatea un RUT chileno al formato estandar (XXXXXXXX-X) sin puntos.
 * @param rut El string de entrada a formatear
 * @returns El RUT formateado
 */
export function formatRut(rut: string): string {
  if (!rut) return '';

  // Limpiar cualquier caracter que no sea numero o K
  let value = rut.replace(/[^0-9kK]/g, '').toUpperCase();

  if (value.length <= 1) return value;

  // Extraer el digito verificador (ultimo caracter)
  const dv = value.slice(-1);
  const body = value.slice(0, -1);

  return `${body}-${dv}`;
}
