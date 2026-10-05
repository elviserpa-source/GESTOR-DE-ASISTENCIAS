import { Aprendiz, Ficha, RegistroAsistencia, AprendizRiesgoSummary, FormatoGFPI176Item, FormatoDesercionItem } from '../types/attendance';

export const calculateAprendizSummary = (
  aprendiz: Aprendiz,
  ficha: Ficha,
  allRecords: RegistroAsistencia[],
  gfpiRecords: FormatoGFPI176Item[] = [],
  desercionRecords: FormatoDesercionItem[] = []
): AprendizRiesgoSummary => {
  // Sort records by date ascending
  const studentRecords = allRecords
    .filter(r => r.aprendizId === aprendiz.id && r.fichaId === ficha.id)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const totalAsistencias = studentRecords.filter(r => r.estado === 'P').length;
  const totalRetardos = studentRecords.filter(r => r.estado === 'R').length;
  const totalInasistencias = studentRecords.filter(r => r.estado === 'NA').length;
  const totalInasistenciasJustificadas = studentRecords.filter(r => r.estado === 'J').length;
  const totalSesiones = studentRecords.length;

  const tasaAsistencia = totalSesiones > 0 
    ? Math.round(((totalAsistencias + totalRetardos + totalInasistenciasJustificadas) / totalSesiones) * 100) 
    : 100;

  const tasaInasistencia = totalSesiones > 0
    ? Math.round((totalInasistencias / totalSesiones) * 100)
    : 0;

  // Calculate consecutive unjustified absences ending at the most recent session
  // Note: Justified absence ('J') breaks consecutive unjustified streak under SENA regulations
  let inasistenciasConsecutivas = 0;
  for (let i = studentRecords.length - 1; i >= 0; i--) {
    if (studentRecords[i].estado === 'NA') {
      inasistenciasConsecutivas++;
    } else {
      break;
    }
  }

  // Also check if any window of 3 consecutive unjustified absences happened
  let maxConsecutiveAnytime = 0;
  let currentStreak = 0;
  for (const rec of studentRecords) {
    if (rec.estado === 'NA') {
      currentStreak++;
      if (currentStreak > maxConsecutiveAnytime) {
        maxConsecutiveAnytime = currentStreak;
      }
    } else {
      currentStreak = 0;
    }
  }

  // Determine protocol state according to SENA rules and handwritten workflow
  let estadoCalculado: 'NORMAL' | 'RETARDO' | 'ALERTA_PREVENTIVA_1_2' | 'DESERCION_3_MAS' | 'JUSTIFICADA' = 'NORMAL';

  if (inasistenciasConsecutivas >= 3 || maxConsecutiveAnytime >= 3 || totalInasistencias >= 5) {
    estadoCalculado = 'DESERCION_3_MAS';
  } else if (totalInasistencias >= 1) {
    estadoCalculado = 'ALERTA_PREVENTIVA_1_2';
  } else if (totalRetardos > 0) {
    estadoCalculado = 'RETARDO';
  } else if (totalInasistenciasJustificadas > 0) {
    estadoCalculado = 'JUSTIFICADA';
  } else {
    estadoCalculado = 'NORMAL';
  }

  const ultimoRegistro = studentRecords.length > 0 ? studentRecords[studentRecords.length - 1] : undefined;
  const historialGFPI176 = gfpiRecords.filter(g => g.aprendizId === aprendiz.id);
  const historialDesercion = desercionRecords.find(d => d.aprendizId === aprendiz.id);

  return {
    aprendiz,
    ficha,
    totalAsistencias,
    totalRetardos,
    totalInasistencias,
    totalInasistenciasJustificadas,
    totalSesiones,
    inasistenciasConsecutivas: Math.max(inasistenciasConsecutivas, maxConsecutiveAnytime),
    tasaAsistencia,
    tasaInasistencia,
    estadoCalculado,
    ultimoRegistro,
    historialGFPI176,
    historialDesercion
  };
};

export const getBadgeColor = (estado: 'NORMAL' | 'RETARDO' | 'ALERTA_PREVENTIVA_1_2' | 'DESERCION_3_MAS' | 'JUSTIFICADA') => {
  switch (estado) {
    case 'NORMAL':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500',
        label: 'Asistencia Regular (P)',
        actionLabel: 'Guardar dato para analítica'
      };
    case 'RETARDO':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
        label: 'Retardo Registrado (R)',
        actionLabel: 'Enviar correo con exhortación a cumplir horario'
      };
    case 'JUSTIFICADA':
      return {
        bg: 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
        dot: 'bg-sky-500',
        label: 'Inasistencia Justificada (J)',
        actionLabel: 'Excusa radicada validada (No cuenta para deserción)'
      };
    case 'ALERTA_PREVENTIVA_1_2':
      return {
        bg: 'bg-orange-50 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
        dot: 'bg-orange-500',
        label: 'Alerta Preventiva (1-2 Inasistencias)',
        actionLabel: 'Diligenciar Formato GFPI-F-176'
      };
    case 'DESERCION_3_MAS':
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        dot: 'bg-rose-500',
        label: 'Causal Deserción (≥3 continuas o 5 acum.)',
        actionLabel: 'Diligenciar Formato Reporte Deserción Grupal'
      };
  }
};
