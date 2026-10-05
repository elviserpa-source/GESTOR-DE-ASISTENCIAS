import { Aprendiz } from '../types/attendance';

/**
 * Sorts a list of apprentices alphabetically by First Name (Nombre),
 * then by Last Name (Apellidos).
 */
export const sortAprendicesByName = (aprendices: Aprendiz[]): Aprendiz[] => {
  return [...aprendices].sort((a, b) => {
    const compNombre = (a.nombres || '').localeCompare(b.nombres || '', 'es', { sensitivity: 'base' });
    if (compNombre !== 0) return compNombre;
    return (a.apellidos || '').localeCompare(b.apellidos || '', 'es', { sensitivity: 'base' });
  });
};
