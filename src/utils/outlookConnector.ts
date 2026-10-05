/**
 * Outlook SENA Institutional Connector
 * Generates official Microsoft 365 Outlook Web deeplinks and desktop protocol
 * for sending institutional communications directly from the Instructor's official account.
 */

import { Aprendiz, Ficha } from '../types/attendance';
import { InstructorConfig } from '../db/senaDatabase';

export interface EmailTemplateData {
  to: string;
  cc?: string;
  subject: string;
  body: string;
  senderEmail: string;
}

/**
 * Builds the empathetic, dialogue-oriented delay template
 * Promotes close conversation to understand mobility, work or family constraints.
 */
export const buildEmpatheticDelayTemplate = (
  aprendiz: Aprendiz,
  ficha: Ficha,
  instructor: InstructorConfig,
  minutesLate: number = 30,
  dateString: string = '2026-09-25'
): EmailTemplateData => {
  const nombreAprendiz = `${aprendiz.nombres} ${aprendiz.apellidos}`;

  const subject = `Espacio de diálogo y seguimiento a tu horario de formación - Ficha ${ficha.codigo} | SENA`;

  const body = 
`Hola ${aprendiz.nombres}, espero que te encuentres muy bien.

Te escribo de manera cordial y cercana desde la coordinación pedagógica de nuestra Ficha ${ficha.codigo} (${ficha.programa}).

El día de hoy (${dateString}), notamos que ingresaste al ambiente de formación con una demora aproximada de ${minutesLate} minutos frente al horario concertado de inicio (${ficha.horario}). 

Queremos expresarte que tu presencia y participación activa son fundamentales para el equipo de trabajo y para el desarrollo de tus proyectos formativos. Al mismo tiempo, somos plenamente conscientes de que en ocasiones se presentan imprevistos cotidianos, dificultades de movilidad o transporte, compromisos laborales o situaciones familiares que pueden dificultar la puntualidad.

Nuestro principal propósito no es sancionatorio, sino comprender qué situación estás experimentando y dialogar contigo para encontrar alternativas que te permitan superar estas dificultades. El Reglamento del Aprendiz (Acuerdo 09 de 2024, Artículo 8, Numeral 5) resalta el valor formativo de la puntualidad como competencia clave para el mundo del trabajo y de la vida, y en el SENA estamos para acompañarte en ese camino.

Te invito a que nos tomemos unos minutos antes o después de la jornada formativa de mañana, o bien me respondas a este correo, para que conversemos con tranquilidad sobre cómo podemos apoyarte desde la formación o mediante el equipo de Bienestar al Aprendiz.

Quedo atento a tus comentarios y te envío un saludo fraternal.

Cordialmente,

${instructor.nombre}
Instructor Técnico / Responsable de Ficha
Correo Institucional: ${instructor.correoInstitucional}
${instructor.centroFormacion} — ${instructor.regional}
Servicio Nacional de Aprendizaje - SENA`;

  return {
    to: aprendiz.correo,
    cc: instructor.bienestarCorreo,
    subject,
    body,
    senderEmail: instructor.correoInstitucional
  };
};

/**
 * Builds Outlook Web (Office 365) compose URL
 * URL pattern for Microsoft 365 / Outlook Web App
 */
export const generateOutlookWebLink = (to: string, cc: string = '', subject: string, body: string): string => {
  const baseUrl = 'https://outlook.office.com/mail/deeplink/compose';
  const params = new URLSearchParams();
  if (to) params.append('to', to);
  if (cc) params.append('cc', cc);
  if (subject) params.append('subject', subject);
  if (body) params.append('body', body);

  return `${baseUrl}?${params.toString()}`;
};

/**
 * Builds standard mailto link for Outlook Desktop
 */
export const generateMailtoLink = (to: string, cc: string = '', subject: string, body: string): string => {
  const params: string[] = [];
  if (cc) params.push(`cc=${encodeURIComponent(cc)}`);
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);

  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return `mailto:${to}${query}`;
};
