export type AsistenciaEstado = 'P' | 'R' | 'NA' | 'J';

export interface Aprendiz {
  id: string;
  documento: string;
  tipoDocumento: 'CC' | 'TI' | 'CE' | 'PEP';
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  celular?: string;
  fichaId: string;
  contactoAcudiente?: string;
  telefonoAcudiente?: string;
  observacionesGenerales?: string;
  estadoSena?: string; // 'EN FORMACION' | 'RETIRO VOLUNTARIO' | etc. from SofiaPlus
  estado: 'ACTIVO' | 'EN_RIESGO_PREVENTIVO' | 'DESERCION_REPORTADA';
}

export interface Ficha {
  id: string;
  codigo: string; // e.g. "3534716" o "2827103"
  programa: string; // e.g. "GESTION DEL DESARROLLO ADMINISTRATIVO E INNOVACION"
  nivel: 'Técnico Laboral' | 'Tecnólogo' | 'Operario' | 'Auxiliar';
  jornada: 'Diurna' | 'Nocturna' | 'Mixta' | 'Madrugada' | 'Fines de semana' | 'Virtual';
  regional: string; // e.g. "Regional Córdoba"
  centroFormacion: string; // e.g. "Centro de Comercio, Industria y Turismo CCIT"
  horario: string; // e.g. "07:00 - 13:00"
  fechaInicio: string; // "2026-02-01"
  fechaFin: string; // "2027-04-30"
  instructorLider: string; // "Elvis Serpa Hernández"
  instructorCc: string; // "1067894512"
  estadoFicha?: string; // e.g. "EN EJECUCION"
  fechaReporte?: string; // e.g. "19/09/2026"
}

export interface RegistroAsistencia {
  id: string;
  fichaId: string;
  aprendizId: string;
  fecha: string; // YYYY-MM-DD
  estado: AsistenciaEstado; // 'P' | 'R' | 'NA' | 'J'
  horaLlegada?: string;
  minutosRetardo?: number;
  observacion?: string;
  justificado?: boolean;
  motivoJustificacion?: string;
  soporteEvidencia?: string;
}

export interface FormatoGFPI176Item {
  id: string;
  fechaRegistro: string;
  fichaId: string;
  aprendizId: string;
  documentoAprendiz: string;
  nombreAprendiz: string;
  situacionRiesgo: string;
  categoriaTabla1: string;
  causaTabla1: string;
  escaloCaso: boolean;
  aQuienEscalo: string;
  accionesAdelantadas: string;
  estadoFinalTrimestre: string;
  instructor: string;
}

export interface FormatoDesercionItem {
  id: string;
  fechaReporte: string;
  fichaId: string;
  aprendizId: string;
  documentoAprendiz: string;
  apellidosNombres: string;
  correo: string;
  tipoNovedadCodigo: string; // e.g. "3.1"
  tipoNovedadTexto: string;
  causaCodigo: number; // 1-23
  causaTexto: string;
  fechaDesercion: string;
  observaciones: string;
  estadoEnvio: 'Pendiente' | 'Enviado a Coordinación' | 'En Comité';
}

export interface EmailLog {
  id: string;
  fecha: string;
  tipo: 'EXHORTACION_RETARDO' | 'ALERTA_PREVENCION_1_2' | 'REPORTE_DESERCION_3_MAS';
  destinatario: string;
  copia?: string;
  asunto: string;
  cuerpo: string;
  fichaId: string;
  aprendizId?: string;
  aprendizNombre?: string;
}

export interface AprendizRiesgoSummary {
  aprendiz: Aprendiz;
  ficha: Ficha;
  totalAsistencias: number;
  totalRetardos: number;
  totalInasistencias: number; // Inasistencias injustificadas (NA)
  totalInasistenciasJustificadas: number; // Inasistencias con excusa médica o soporte (J)
  totalSesiones: number;
  inasistenciasConsecutivas: number; // Consecutivas injustificadas (NA)
  tasaAsistencia: number; // 0-100%
  tasaInasistencia: number; // 0-100%
  estadoCalculado: 'NORMAL' | 'RETARDO' | 'ALERTA_PREVENTIVA_1_2' | 'DESERCION_3_MAS' | 'JUSTIFICADA';
  ultimoRegistro?: RegistroAsistencia;
  historialGFPI176?: FormatoGFPI176Item[];
  historialDesercion?: FormatoDesercionItem;
}
