import { Ficha, Aprendiz, RegistroAsistencia, FormatoGFPI176Item, FormatoDesercionItem, EmailLog } from '../types/attendance';

export const initialFichas: Ficha[] = [
  {
    id: 'f-3534716',
    codigo: '3534716',
    programa: 'GESTION DEL DESARROLLO ADMINISTRATIVO E INNOVACION',
    nivel: 'Tecnólogo',
    jornada: 'Diurna',
    regional: 'Regional Córdoba',
    centroFormacion: 'Centro de Comercio, Industria y Turismo CCIT',
    horario: '07:00 a 13:00',
    fechaInicio: '2026-02-01',
    fechaFin: '2027-08-01',
    instructorLider: 'Elvis Serpa Hernández',
    instructorCc: '1067894512',
    estadoFicha: 'EN EJECUCION',
    fechaReporte: '19/09/2026'
  },
  {
    id: 'f-2827103',
    codigo: '2827103',
    programa: 'Análisis y Desarrollo de Software (ADSO)',
    nivel: 'Tecnólogo',
    jornada: 'Diurna',
    regional: 'Regional Córdoba',
    centroFormacion: 'Centro de Comercio, Industria y Turismo CCIT',
    horario: '07:00 a 13:00',
    fechaInicio: '2026-01-20',
    fechaFin: '2027-07-20',
    instructorLider: 'Elvis Serpa Hernández',
    instructorCc: '1067894512',
    estadoFicha: 'EN EJECUCION',
    fechaReporte: '19/09/2026'
  },
  {
    id: 'f-2901452',
    codigo: '2901452',
    programa: 'Gestión Integral del Transporte',
    nivel: 'Tecnólogo',
    jornada: 'Nocturna',
    regional: 'Regional Córdoba',
    centroFormacion: 'Centro de Comercio, Industria y Turismo CCIT',
    horario: '18:00 a 22:00',
    fechaInicio: '2026-03-01',
    fechaFin: '2027-09-01',
    instructorLider: 'Elvis Serpa Hernández',
    instructorCc: '1067894512',
    estadoFicha: 'EN EJECUCION',
    fechaReporte: '19/09/2026'
  },
  {
    id: 'f-2754890',
    codigo: '2754890',
    programa: 'Contabilización de Operaciones Comerciales y Financieras',
    nivel: 'Técnico Laboral',
    jornada: 'Mixta',
    regional: 'Regional Córdoba',
    centroFormacion: 'Centro de Comercio, Industria y Turismo CCIT',
    horario: '13:00 a 18:00',
    fechaInicio: '2026-02-15',
    fechaFin: '2026-12-15',
    instructorLider: 'Elvis Serpa Hernández',
    instructorCc: '1067894512',
    estadoFicha: 'EN EJECUCION',
    fechaReporte: '19/09/2026'
  }
];

export const initialAprendices: Aprendiz[] = [
  // Ficha 3534716 (GESTION DEL DESARROLLO ADMINISTRATIVO E INNOVACION - Reporte de Aprendices de la imagen)
  {
    id: 'ap-sofia-01',
    fichaId: 'f-3534716',
    tipoDocumento: 'CC',
    documento: '1003049636',
    nombres: 'LEIDYS ESTHER',
    apellidos: 'ROMERO PEREZ',
    celular: '3122705787',
    telefono: '3122705787',
    correo: 'romeroleidys579@gmail.com',
    estadoSena: 'EN FORMACION',
    estado: 'ACTIVO'
  },
  {
    id: 'ap-sofia-02',
    fichaId: 'f-3534716',
    tipoDocumento: 'CC',
    documento: '1003141783',
    nombres: 'LINA MARIA',
    apellidos: 'MAUSSA RODRIGUEZ',
    celular: '3127224926',
    telefono: '3127224926',
    correo: 'linamaussa2693@gmail.com',
    estadoSena: 'EN FORMACION',
    estado: 'EN_RIESGO_PREVENTIVO' // con 1-2 inasistencias para probar GFPI-F-176
  },
  {
    id: 'ap-sofia-03',
    fichaId: 'f-3534716',
    tipoDocumento: 'CC',
    documento: '1003466597',
    nombres: 'KARINA',
    apellidos: 'SOTELO SANCHEZ',
    celular: '3244740906',
    telefono: '3244740906',
    correo: 'karinasotelosanchez19@gmail.com',
    estadoSena: 'EN FORMACION',
    estado: 'ACTIVO' // con retardos para probar exhortación
  },
  {
    id: 'ap-sofia-04',
    fichaId: 'f-3534716',
    tipoDocumento: 'CC',
    documento: '1004322712',
    nombres: 'MISHELL LORENA',
    apellidos: 'MEZA OROZCO',
    celular: '3002885198',
    telefono: '3002885198',
    correo: 'michellmezaorozco@gmail.com',
    estadoSena: 'EN FORMACION',
    estado: 'ACTIVO'
  },
  {
    id: 'ap-sofia-05',
    fichaId: 'f-3534716',
    tipoDocumento: 'CC',
    documento: '1062427945',
    nombres: 'YULIANA',
    apellidos: 'CARDENAS MORA',
    celular: '3104626553',
    telefono: '3104626553',
    correo: 'cardenasy555@gmail.com',
    estadoSena: 'RETIRO VOLUNTARIO',
    estado: 'DESERCION_REPORTADA' // retiro / inasistencia prolongada
  },
  {
    id: 'ap-sofia-06',
    fichaId: 'f-3534716',
    tipoDocumento: 'CC',
    documento: '1062428134',
    nombres: 'VIVIANA VANESSA',
    apellidos: 'MENDEZ SANCHEZ',
    celular: '3006883753',
    telefono: '3006883753',
    correo: 'vannemendez22@gmail.com',
    estadoSena: 'EN FORMACION',
    estado: 'ACTIVO'
  },
  // Ficha 2827103 (ADSO)
  {
    id: 'ap-01',
    fichaId: 'f-2827103',
    documento: '1067451230',
    tipoDocumento: 'CC',
    nombres: 'Carlos Andrés',
    apellidos: 'Mendoza Polo',
    correo: 'carlos.mendoza@soy.sena.edu.co',
    telefono: '3104523311',
    contactoAcudiente: 'Marta Polo (Madre)',
    telefonoAcudiente: '3128904561',
    estado: 'ACTIVO'
  },
  {
    id: 'ap-02',
    fichaId: 'f-2827103',
    documento: '1068994321',
    tipoDocumento: 'CC',
    nombres: 'Valentina',
    apellidos: 'Ramos Morales',
    correo: 'vramos.morales@soy.sena.edu.co',
    telefono: '3147781290',
    contactoAcudiente: 'José Ramos (Padre)',
    telefonoAcudiente: '3167721100',
    estado: 'EN_RIESGO_PREVENTIVO' // 1-2 inasistencias
  },
  {
    id: 'ap-03',
    fichaId: 'f-2827103',
    documento: '1065123984',
    tipoDocumento: 'CC',
    nombres: 'Mateo Alejandro',
    apellidos: 'Gómez Dávila',
    correo: 'mgomez.davila@soy.sena.edu.co',
    telefono: '3008914567',
    contactoAcudiente: 'Carmen Dávila (Madre)',
    telefonoAcudiente: '3116543219',
    estado: 'DESERCION_REPORTADA' // >= 3 inasistencias consecutivas
  },
  {
    id: 'ap-04',
    fichaId: 'f-2827103',
    documento: '1003456712',
    tipoDocumento: 'TI',
    nombres: 'Daniela Sofía',
    apellidos: 'Montiel Vergara',
    correo: 'dani.montiel@soy.sena.edu.co',
    telefono: '3189912345',
    contactoAcudiente: 'Elena Vergara',
    telefonoAcudiente: '3157771234',
    estado: 'ACTIVO'
  },
  {
    id: 'ap-05',
    fichaId: 'f-2827103',
    documento: '1069332187',
    tipoDocumento: 'CC',
    nombres: 'Jorge Luis',
    apellidos: 'Castillo Sierra',
    correo: 'jorge.castillo@soy.sena.edu.co',
    telefono: '3205561122',
    contactoAcudiente: 'Roberto Castillo',
    telefonoAcudiente: '3142218899',
    estado: 'ACTIVO' // con retardo frecuente
  },
  {
    id: 'ap-06',
    fichaId: 'f-2827103',
    documento: '1066890123',
    tipoDocumento: 'CC',
    nombres: 'María Camila',
    apellidos: 'Paternina Díaz',
    correo: 'mcpaternina@soy.sena.edu.co',
    telefono: '3114457788',
    contactoAcudiente: 'Luz Díaz',
    telefonoAcudiente: '3109988771',
    estado: 'EN_RIESGO_PREVENTIVO'
  },
  // Ficha 2901452 (Transporte)
  {
    id: 'ap-07',
    fichaId: 'f-2901452',
    documento: '1064789321',
    tipoDocumento: 'CC',
    nombres: 'Andrés Felipe',
    apellidos: 'Zúñiga López',
    correo: 'afelipe.zuniga@soy.sena.edu.co',
    telefono: '3123345566',
    estado: 'ACTIVO'
  },
  {
    id: 'ap-08',
    fichaId: 'f-2901452',
    documento: '1069876543',
    tipoDocumento: 'CC',
    nombres: 'Lina Marcela',
    apellidos: 'Benítez Correa',
    correo: 'lbenitez.correa@soy.sena.edu.co',
    telefono: '3138890011',
    estado: 'EN_RIESGO_PREVENTIVO'
  },
  {
    id: 'ap-09',
    fichaId: 'f-2901452',
    documento: '1063214569',
    tipoDocumento: 'CC',
    nombres: 'Julián David',
    apellidos: 'Narváez Flórez',
    correo: 'jnarvaez.florez@soy.sena.edu.co',
    telefono: '3176654321',
    estado: 'DESERCION_REPORTADA'
  },
  // Ficha 2754890 (Contabilidad)
  {
    id: 'ap-10',
    fichaId: 'f-2754890',
    documento: '1061987654',
    tipoDocumento: 'CC',
    nombres: 'Estefanía',
    apellidos: 'Salgado Petro',
    correo: 'esalgado.petro@soy.sena.edu.co',
    telefono: '3156678899',
    estado: 'ACTIVO'
  },
  {
    id: 'ap-11',
    fichaId: 'f-2754890',
    documento: '1068112233',
    tipoDocumento: 'TI',
    nombres: 'Samuel Eduardo',
    apellidos: 'Hoyos Bula',
    correo: 'shoyos.bula@soy.sena.edu.co',
    telefono: '3190012233',
    estado: 'ACTIVO'
  }
];

// Asistencias de los últimos 5 días lectivos para Ficha 2827103
// Usaremos fechas de la semana actual
export const generateInitialAttendance = (): RegistroAsistencia[] => {
  const records: RegistroAsistencia[] = [];
  const dates = ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25'];

  // --- Ficha 3534716 (GESTION DEL DESARROLLO ADMINISTRATIVO E INNOVACION - Imagen) ---
  // Leidys Esther Romero Perez: P todos los días
  dates.forEach(d => {
    records.push({
      id: `att-apsofia01-${d}`,
      fichaId: 'f-3534716',
      aprendizId: 'ap-sofia-01',
      fecha: d,
      estado: 'P',
      horaLlegada: '06:55'
    });
  });

  // Lina Maria Maussa Rodriguez: P, P, P, NA, NA (2 inasistencias -> Alerta GFPI-F-176)
  records.push(
    { id: 'att-apsofia02-1', fichaId: 'f-3534716', aprendizId: 'ap-sofia-02', fecha: dates[0], estado: 'P', horaLlegada: '07:00' },
    { id: 'att-apsofia02-2', fichaId: 'f-3534716', aprendizId: 'ap-sofia-02', fecha: dates[1], estado: 'P', horaLlegada: '07:02' },
    { id: 'att-apsofia02-3', fichaId: 'f-3534716', aprendizId: 'ap-sofia-02', fecha: dates[2], estado: 'P', horaLlegada: '07:00' },
    { id: 'att-apsofia02-4', fichaId: 'f-3534716', aprendizId: 'ap-sofia-02', fecha: dates[3], estado: 'NA', observacion: 'Inasistencia sin justificar' },
    { id: 'att-apsofia02-5', fichaId: 'f-3534716', aprendizId: 'ap-sofia-02', fecha: dates[4], estado: 'NA', observacion: 'Segunda inasistencia consecutiva' }
  );

  // Karina Sotelo Sanchez: R, P, R, P, R (Retardos continuos)
  records.push(
    { id: 'att-apsofia03-1', fichaId: 'f-3534716', aprendizId: 'ap-sofia-03', fecha: dates[0], estado: 'R', horaLlegada: '07:25', minutosRetardo: 25 },
    { id: 'att-apsofia03-2', fichaId: 'f-3534716', aprendizId: 'ap-sofia-03', fecha: dates[1], estado: 'P', horaLlegada: '07:00' },
    { id: 'att-apsofia03-3', fichaId: 'f-3534716', aprendizId: 'ap-sofia-03', fecha: dates[2], estado: 'R', horaLlegada: '07:30', minutosRetardo: 30 },
    { id: 'att-apsofia03-4', fichaId: 'f-3534716', aprendizId: 'ap-sofia-03', fecha: dates[3], estado: 'P', horaLlegada: '06:58' },
    { id: 'att-apsofia03-5', fichaId: 'f-3534716', aprendizId: 'ap-sofia-03', fecha: dates[4], estado: 'R', horaLlegada: '07:35', minutosRetardo: 35, observacion: 'Retardo por transporte intermunicipal' }
  );

  // Mishell Lorena Meza Orozco: P todos los días
  dates.forEach(d => {
    records.push({
      id: `att-apsofia04-${d}`,
      fichaId: 'f-3534716',
      aprendizId: 'ap-sofia-04',
      fecha: d,
      estado: 'P',
      horaLlegada: '06:50'
    });
  });

  // Yuliana Cardenas Mora: P, P, NA, NA, NA (3 inasistencias -> Causal de Deserción)
  records.push(
    { id: 'att-apsofia05-1', fichaId: 'f-3534716', aprendizId: 'ap-sofia-05', fecha: dates[0], estado: 'P', horaLlegada: '07:05' },
    { id: 'att-apsofia05-2', fichaId: 'f-3534716', aprendizId: 'ap-sofia-05', fecha: dates[1], estado: 'P', horaLlegada: '07:00' },
    { id: 'att-apsofia05-3', fichaId: 'f-3534716', aprendizId: 'ap-sofia-05', fecha: dates[2], estado: 'NA', observacion: 'No se presenta a formación' },
    { id: 'att-apsofia05-4', fichaId: 'f-3534716', aprendizId: 'ap-sofia-05', fecha: dates[3], estado: 'NA', observacion: 'Manifiesta retiro voluntario' },
    { id: 'att-apsofia05-5', fichaId: 'f-3534716', aprendizId: 'ap-sofia-05', fecha: dates[4], estado: 'NA', observacion: '3er día de inasistencia continua' }
  );

  // Viviana Vanessa Mendez Sanchez: P todos los días
  dates.forEach(d => {
    records.push({
      id: `att-apsofia06-${d}`,
      fichaId: 'f-3534716',
      aprendizId: 'ap-sofia-06',
      fecha: d,
      estado: 'P',
      horaLlegada: '06:58'
    });
  });

  // --- Ficha 2827103 (ADSO) ---
  // Carlos Mendoza: Siempre presente
  dates.forEach(d => {
    records.push({
      id: `att-ap01-${d}`,
      fichaId: 'f-2827103',
      aprendizId: 'ap-01',
      fecha: d,
      estado: 'P',
      horaLlegada: '06:55',
      observacion: 'Participación activa'
    });
  });

  // Valentina Ramos: P, P, P, NA, NA (2 inasistencias -> Alerta temprana GFPI-F-176)
  records.push(
    { id: 'att-ap02-1', fichaId: 'f-2827103', aprendizId: 'ap-02', fecha: dates[0], estado: 'P', horaLlegada: '07:00' },
    { id: 'att-ap02-2', fichaId: 'f-2827103', aprendizId: 'ap-02', fecha: dates[1], estado: 'P', horaLlegada: '07:05' },
    { id: 'att-ap02-3', fichaId: 'f-2827103', aprendizId: 'ap-02', fecha: dates[2], estado: 'P', horaLlegada: '07:00' },
    { id: 'att-ap02-4', fichaId: 'f-2827103', aprendizId: 'ap-02', fecha: dates[3], estado: 'NA', observacion: 'Sin justificación reportada en la mañana' },
    { id: 'att-ap02-5', fichaId: 'f-2827103', aprendizId: 'ap-02', fecha: dates[4], estado: 'NA', observacion: 'Segunda inasistencia consecutiva. Se contactó acudiente' }
  );

  // Mateo Gómez: P, P, NA, NA, NA (3 inasistencias consecutivas -> Deserción Art. 30 / Reporte Grupal)
  records.push(
    { id: 'att-ap03-1', fichaId: 'f-2827103', aprendizId: 'ap-03', fecha: dates[0], estado: 'P', horaLlegada: '07:10' },
    { id: 'att-ap03-2', fichaId: 'f-2827103', aprendizId: 'ap-03', fecha: dates[1], estado: 'P', horaLlegada: '07:02' },
    { id: 'att-ap03-3', fichaId: 'f-2827103', aprendizId: 'ap-03', fecha: dates[2], estado: 'NA', observacion: 'No se presenta a clase' },
    { id: 'att-ap03-4', fichaId: 'f-2827103', aprendizId: 'ap-03', fecha: dates[3], estado: 'NA', observacion: 'No responde celular' },
    { id: 'att-ap03-5', fichaId: 'f-2827103', aprendizId: 'ap-03', fecha: dates[4], estado: 'NA', observacion: 'Cumple 3 días continuos injustificados' }
  );

  // Daniela Montiel: P, P, P, P, P
  dates.forEach(d => {
    records.push({
      id: `att-ap04-${d}`,
      fichaId: 'f-2827103',
      aprendizId: 'ap-04',
      fecha: d,
      estado: 'P',
      horaLlegada: '06:50'
    });
  });

  // Jorge Luis Castillo: R, P, R, P, R (Retardos reiterados -> Exhortación de puntualidad por correo)
  records.push(
    { id: 'att-ap05-1', fichaId: 'f-2827103', aprendizId: 'ap-05', fecha: dates[0], estado: 'R', horaLlegada: '07:35', minutosRetardo: 35, observacion: 'Congestión en transporte público' },
    { id: 'att-ap05-2', fichaId: 'f-2827103', aprendizId: 'ap-05', fecha: dates[1], estado: 'P', horaLlegada: '06:58' },
    { id: 'att-ap05-3', fichaId: 'f-2827103', aprendizId: 'ap-05', fecha: dates[2], estado: 'R', horaLlegada: '07:25', minutosRetardo: 25, observacion: 'Retardo de 25 min' },
    { id: 'att-ap05-4', fichaId: 'f-2827103', aprendizId: 'ap-05', fecha: dates[3], estado: 'P', horaLlegada: '07:00' },
    { id: 'att-ap05-5', fichaId: 'f-2827103', aprendizId: 'ap-05', fecha: dates[4], estado: 'R', horaLlegada: '07:40', minutosRetardo: 40, observacion: 'Tercer retardo de la semana. Se envía exhortación' }
  );

  // María Camila Paternina: P, P, P, P, NA (1 inasistencia)
  records.push(
    { id: 'att-ap06-1', fichaId: 'f-2827103', aprendizId: 'ap-06', fecha: dates[0], estado: 'P', horaLlegada: '07:05' },
    { id: 'att-ap06-2', fichaId: 'f-2827103', aprendizId: 'ap-06', fecha: dates[1], estado: 'P', horaLlegada: '07:00' },
    { id: 'att-ap06-3', fichaId: 'f-2827103', aprendizId: 'ap-06', fecha: dates[2], estado: 'P', horaLlegada: '07:10' },
    { id: 'att-ap06-4', fichaId: 'f-2827103', aprendizId: 'ap-06', fecha: dates[3], estado: 'P', horaLlegada: '06:55' },
    { id: 'att-ap06-5', fichaId: 'f-2827103', aprendizId: 'ap-06', fecha: dates[4], estado: 'NA', observacion: 'Primera inasistencia no avisada' }
  );

  // Ficha 2901452 registros
  dates.forEach(d => {
    records.push({
      id: `att-ap07-${d}`,
      fichaId: 'f-2901452',
      aprendizId: 'ap-07',
      fecha: d,
      estado: 'P',
      horaLlegada: '17:55'
    });
  });

  records.push(
    { id: 'att-ap08-1', fichaId: 'f-2901452', aprendizId: 'ap-08', fecha: dates[3], estado: 'NA', observacion: 'Cruce con turno de trabajo' },
    { id: 'att-ap08-2', fichaId: 'f-2901452', aprendizId: 'ap-08', fecha: dates[4], estado: 'NA', observacion: 'Segunda inasistencia' }
  );

  records.push(
    { id: 'att-ap09-1', fichaId: 'f-2901452', aprendizId: 'ap-09', fecha: dates[1], estado: 'NA' },
    { id: 'att-ap09-2', fichaId: 'f-2901452', aprendizId: 'ap-09', fecha: dates[2], estado: 'NA' },
    { id: 'att-ap09-3', fichaId: 'f-2901452', aprendizId: 'ap-09', fecha: dates[3], estado: 'NA' },
    { id: 'att-ap09-4', fichaId: 'f-2901452', aprendizId: 'ap-09', fecha: dates[4], estado: 'NA' }
  );

  return records;
};

export const initialGFPI176Records: FormatoGFPI176Item[] = [
  {
    id: 'gfpi-01',
    fechaRegistro: '2026-09-25',
    fichaId: 'f-2827103',
    aprendizId: 'ap-02',
    documentoAprendiz: '1068994321',
    nombreAprendiz: 'Valentina Ramos Morales',
    situacionRiesgo: 'Segunda inasistencia injustificada en la semana e intermitencia en entrega de evidencias de análisis.',
    categoriaTabla1: 'Motivos económicos',
    causaTabla1: 'Tuve que dedicarme a trabajar por no contar con apoyo económico para dedicarme a estudiar',
    escaloCaso: true,
    aQuienEscalo: 'Al coordinador de formación quien designa a un integrante del equipo de bienestar al aprendiz del centro de formación.',
    accionesAdelantadas: 'Comunicación telefónica con la aprendiz y su acudiente. Se brindó asesoría para postulación a monitoría SENA y apoyo de transporte.',
    estadoFinalTrimestre: 'En seguimiento preventivo',
    instructor: 'Elvis Serpa Hernández'
  },
  {
    id: 'gfpi-02',
    fechaRegistro: '2026-09-25',
    fichaId: 'f-2901452',
    aprendizId: 'ap-08',
    documentoAprendiz: '1069876543',
    nombreAprendiz: 'Lina Marcela Benítez Correa',
    situacionRiesgo: 'Inasistencia a dos jornadas formativas por turnos rotativos en su empresa.',
    categoriaTabla1: 'Motivos laborales',
    causaTabla1: 'Cruce de actividades laborales con actividades formativas',
    escaloCaso: true,
    aQuienEscalo: 'Coordinador académico - Equipo de instructores de la ficha',
    accionesAdelantadas: 'Acuerdo de flexibilización y entrega de evidencias asincrónicas a través de la plataforma institucional.',
    estadoFinalTrimestre: 'Continuó en formación (Superado)',
    instructor: 'Elvis Serpa Hernández'
  }
];

export const initialDesercionRecords: FormatoDesercionItem[] = [
  {
    id: 'des-01',
    fechaReporte: '2026-09-25',
    fichaId: 'f-2827103',
    aprendizId: 'ap-03',
    documentoAprendiz: '1065123984',
    apellidosNombres: 'Gómez Dávila Mateo Alejandro',
    correo: 'mgomez.davila@soy.sena.edu.co',
    tipoNovedadCodigo: '3.1',
    tipoNovedadTexto: 'Incumplimiento - Inasistencia 3 días consecutivos o más sin justificación',
    causaCodigo: 18,
    causaTexto: 'No Tiene Tiempo para Asistir a la Formación',
    fechaDesercion: '2026-09-25',
    observaciones: 'El aprendiz acumuló 3 días consecutivos de inasistencia (23, 24 y 25 de septiembre). Se realizaron llamadas y correos sin respuesta satisfactoria ni radicación de soportes válidos conforme al Art. 28.',
    estadoEnvio: 'Enviado a Coordinación'
  },
  {
    id: 'des-02',
    fechaReporte: '2026-09-25',
    fichaId: 'f-2901452',
    aprendizId: 'ap-09',
    documentoAprendiz: '1063214569',
    apellidosNombres: 'Narváez Flórez Julián David',
    correo: 'jnarvaez.florez@soy.sena.edu.co',
    tipoNovedadCodigo: '3.1',
    tipoNovedadTexto: 'Incumplimiento - Inasistencia 3 días consecutivos o más sin justificación',
    causaCodigo: 5,
    causaTexto: 'Por Trabajo',
    fechaDesercion: '2026-09-24',
    observaciones: 'Cuatro días consecutivos de inasistencia en jornada nocturna. Manifiesta haber suscrito contrato laboral incompatible con la formación.',
    estadoEnvio: 'Enviado a Coordinación'
  }
];

export const initialEmailLogs: EmailLog[] = [
  {
    id: 'em-01',
    fecha: '2026-09-25 08:30:15',
    tipo: 'EXHORTACION_RETARDO',
    destinatario: 'jorge.castillo@soy.sena.edu.co',
    asunto: 'SENA CCIT - Exhortación al cumplimiento del horario de formación (Ficha 2827103)',
    cuerpo: 'Apreciado(a) aprendiz Jorge Luis Castillo Sierra: Nos permitimos recordarle el cumplimiento estricto del horario de formación (07:00 a 13:00) conforme al Artículo 8 Numeral 5 del Reglamento del Aprendiz SENA. En la fecha se registró un retardo de 40 minutos...',
    fichaId: 'f-2827103',
    aprendizId: 'ap-05',
    aprendizNombre: 'Jorge Luis Castillo Sierra'
  },
  {
    id: 'em-02',
    fecha: '2026-09-25 09:15:00',
    tipo: 'ALERTA_PREVENCION_1_2',
    destinatario: 'vramos.morales@soy.sena.edu.co',
    copia: 'bienestarccit@sena.edu.co',
    asunto: 'Ruta de Prevención a la Deserción GFPI-PR-001 - Indagación Inasistencia (Ficha 2827103)',
    cuerpo: 'Estimada Valentina Ramos Morales: En cumplimiento del protocolo GFPI-PR-001, nos comunicamos con el fin de indagar sobre las inasistencias registradas los días 24 y 25 de septiembre. Lo invitamos a acercarse a la Coordinación o responder este correo para articular apoyos socioeconómicos...',
    fichaId: 'f-2827103',
    aprendizId: 'ap-02',
    aprendizNombre: 'Valentina Ramos Morales'
  },
  {
    id: 'em-03',
    fecha: '2026-09-25 10:00:22',
    tipo: 'REPORTE_DESERCION_3_MAS',
    destinatario: 'coordinacion.formacion.ccit@sena.edu.co',
    copia: 'coordinacion.academica.ccit@sena.edu.co',
    asunto: 'REPORTE OFICIAL DE DESERCIÓN - Ficha 2827103 ADSO (Art. 30 Acuerdo 09 de 2024)',
    cuerpo: 'Señor Coordinador de Formación Profesional, con copia a Coordinación Académica: En cumplimiento del Artículo 30 y 31 del Reglamento del Aprendiz SENA y del Protocolo GFPI-PR-001, remito el Reporte Grupal de Deserción correspondiente al aprendiz Mateo Alejandro Gómez Dávila (CC 1065123984) por acumular 3 días consecutivos de inasistencia injustificada...',
    fichaId: 'f-2827103',
    aprendizId: 'ap-03',
    aprendizNombre: 'Mateo Alejandro Gómez Dávila'
  }
];
