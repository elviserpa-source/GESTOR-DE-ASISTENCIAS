/**
 * SENA Database Persistence Layer
 * Provides robust persistent storage using localStorage with fallback,
 * data models for Fichas, Aprendices, Asistencias, Formatos GFPI-F-176,
 * Reportes de Deserción, Registros de Correos y Configuración del Instructor.
 */

import { 
  Ficha, 
  Aprendiz, 
  RegistroAsistencia, 
  FormatoGFPI176Item, 
  FormatoDesercionItem, 
  EmailLog 
} from '../types/attendance';
import { 
  initialFichas, 
  initialAprendices, 
  generateInitialAttendance, 
  initialGFPI176Records, 
  initialDesercionRecords, 
  initialEmailLogs 
} from '../data/initialData';

const DB_PREFIX = 'sena_gestor_asistencias_v3_';

export interface InstructorConfig {
  nombre: string;
  documentoCc: string;
  correoInstitucional: string; // e.g. "elviserpa@sena.edu.co"
  regional: string;
  centroFormacion: string;
  coordinacionAcademicaCorreo: string;
  coordinacionFormacionCorreo: string;
  bienestarCorreo: string;
}

export const defaultInstructorConfig: InstructorConfig = {
  nombre: 'Elvis Serpa Hernández',
  documentoCc: '1067894512',
  correoInstitucional: 'elviserpa@sena.edu.co',
  regional: 'Regional Córdoba',
  centroFormacion: 'Centro de Comercio, Industria y Turismo CCIT',
  coordinacionAcademicaCorreo: 'coordinacion.academica.ccit@sena.edu.co',
  coordinacionFormacionCorreo: 'coordinacion.formacion.ccit@sena.edu.co',
  bienestarCorreo: 'bienestarccit@sena.edu.co'
};

export class SenaDatabase {
  // Generic safe storage accessors
  private static getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(DB_PREFIX + key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
    }
    return defaultValue;
  }

  private static setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(DB_PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key} to storage:`, e);
    }
  }

  // --- FICHAS ---
  static getFichas(): Ficha[] {
    const list = this.getItem<Ficha[]>('fichas', initialFichas);
    return list;
  }

  static saveFichas(fichas: Ficha[]): void {
    this.setItem('fichas', fichas);
  }

  static deleteFicha(fichaId: string): void {
    // 1. Remove ficha from list
    const currentFichas = this.getFichas().filter(f => f.id !== fichaId);
    this.saveFichas(currentFichas);

    // 2. Remove all apprentices belonging to this ficha
    const currentAprendices = this.getAprendices().filter(a => a.fichaId !== fichaId);
    this.saveAprendices(currentAprendices);

    // 3. Remove all attendance records belonging to this ficha
    const currentAsistencias = this.getAsistencias().filter(r => r.fichaId !== fichaId);
    this.saveAsistencias(currentAsistencias);

    // 4. Remove all GFPI-F-176 records belonging to this ficha
    const currentGfpi = this.getGfpiRecords().filter(r => r.fichaId !== fichaId);
    this.saveGfpiRecords(currentGfpi);

    // 5. Remove all deserción records belonging to this ficha
    const currentDesercion = this.getDesercionRecords().filter(r => r.fichaId !== fichaId);
    this.saveDesercionRecords(currentDesercion);

    // 6. Remove all email logs belonging to this ficha
    const currentEmails = this.getEmailLogs().filter(e => e.fichaId !== fichaId);
    this.saveEmailLogs(currentEmails);
  }

  // --- APRENDICES (Inicia limpio en [] listo para ejecutar) ---
  static getAprendices(): Aprendiz[] {
    const list = this.getItem<Aprendiz[]>('aprendices', []);
    // Return sorted alphabetically by name
    return [...list].sort((a, b) => a.nombres.localeCompare(b.nombres, 'es', { sensitivity: 'base' }));
  }

  static saveAprendices(aprendices: Aprendiz[]): void {
    this.setItem('aprendices', aprendices);
  }

  // --- ASISTENCIAS (Inicia limpio en []) ---
  static getAsistencias(): RegistroAsistencia[] {
    return this.getItem<RegistroAsistencia[]>('asistencias', []);
  }

  static saveAsistencias(asistencias: RegistroAsistencia[]): void {
    this.setItem('asistencias', asistencias);
  }

  // --- FORMATO GFPI-F-176 (Inicia limpio en []) ---
  static getGfpiRecords(): FormatoGFPI176Item[] {
    return this.getItem<FormatoGFPI176Item[]>('gfpi176', []);
  }

  static saveGfpiRecords(records: FormatoGFPI176Item[]): void {
    this.setItem('gfpi176', records);
  }

  // --- REPORTE GRUPAL DE DESERCIÓN (Inicia limpio en []) ---
  static getDesercionRecords(): FormatoDesercionItem[] {
    return this.getItem<FormatoDesercionItem[]>('desercion', []);
  }

  static saveDesercionRecords(records: FormatoDesercionItem[]): void {
    this.setItem('desercion', records);
  }

  // --- HISTORIAL DE CORREOS / NOTIFICACIONES (Inicia limpio en []) ---
  static getEmailLogs(): EmailLog[] {
    return this.getItem<EmailLog[]>('emails', []);
  }

  static saveEmailLogs(logs: EmailLog[]): void {
    this.setItem('emails', logs);
  }

  // --- CONFIGURACIÓN INSTRUCTOR / OUTLOOK ---
  static getInstructorConfig(): InstructorConfig {
    return this.getItem<InstructorConfig>('instructor_config', defaultInstructorConfig);
  }

  static saveInstructorConfig(config: InstructorConfig): void {
    this.setItem('instructor_config', config);
  }

  // --- BACKUP & RESTORE ---
  static exportFullDatabase(): string {
    const fullBackup = {
      version: '3.0',
      timestamp: new Date().toISOString(),
      fichas: this.getFichas(),
      aprendices: this.getAprendices(),
      asistencias: this.getAsistencias(),
      gfpiRecords: this.getGfpiRecords(),
      desercionRecords: this.getDesercionRecords(),
      emailLogs: this.getEmailLogs(),
      instructorConfig: this.getInstructorConfig()
    };
    return JSON.stringify(fullBackup, null, 2);
  }

  static importFullDatabase(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.fichas) this.saveFichas(data.fichas);
      if (data.aprendices) this.saveAprendices(data.aprendices);
      if (data.asistencias) this.saveAsistencias(data.asistencias);
      if (data.gfpiRecords) this.saveGfpiRecords(data.gfpiRecords);
      if (data.desercionRecords) this.saveDesercionRecords(data.desercionRecords);
      if (data.emailLogs) this.saveEmailLogs(data.emailLogs);
      if (data.instructorConfig) this.saveInstructorConfig(data.instructorConfig);
      return true;
    } catch (e) {
      console.error('Failed to import database:', e);
      return false;
    }
  }

  // --- CLEAR / DELETE LOADED LISTS ---
  static clearLoadedLists(includeFichas: boolean = false): void {
    this.saveAprendices([]);
    this.saveAsistencias([]);
    this.saveGfpiRecords([]);
    this.saveDesercionRecords([]);
    this.saveEmailLogs([]);
    if (includeFichas) {
      this.saveFichas(initialFichas);
    }
  }

  // --- CARGAR DATOS DEMO (Opcional si el usuario desea previsualizar) ---
  static loadSampleDemoData(): void {
    this.saveFichas(initialFichas);
    this.saveAprendices(initialAprendices);
    this.saveAsistencias(generateInitialAttendance());
    this.saveGfpiRecords(initialGFPI176Records);
    this.saveDesercionRecords(initialDesercionRecords);
    this.saveEmailLogs(initialEmailLogs);
    this.saveInstructorConfig(defaultInstructorConfig);
  }

  // --- RESET A ESTADO LIMPIO ---
  static resetDatabase(): void {
    this.saveFichas(initialFichas);
    this.saveAprendices([]);
    this.saveAsistencias([]);
    this.saveGfpiRecords([]);
    this.saveDesercionRecords([]);
    this.saveEmailLogs([]);
    this.saveInstructorConfig(defaultInstructorConfig);
  }
}
