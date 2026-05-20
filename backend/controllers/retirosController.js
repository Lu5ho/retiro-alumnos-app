const db = require('../db');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const pdfDir = path.join(__dirname, '..', 'pdfs');

// Promisifica consultas SQL para poder usar async/await.
const query = (sql, params = []) => new Promise((resolve, reject) => {
  db.query(sql, params, (err, results) => {
    if (err) {
      reject(err);
      return;
    }

    resolve(results);
  });
});

const formatearFechaHora = (fecha = new Date()) => ({
  fecha: fecha.toLocaleDateString('es-CL'),
  hora: fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false })
});

// Construye el nombre del archivo del reporte diario usando la fecha local.
const obtenerNombreArchivoReporteDiario = (fecha = new Date()) => {
  const inicio = obtenerInicioDelDia(fecha);
  const fechaArchivo = `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, '0')}-${String(inicio.getDate()).padStart(2, '0')}`;
  return `reporte-diario-${fechaArchivo}.pdf`;
};

// Crea la carpeta de PDFs si todavía no existe.
const asegurarDirectorio = () => new Promise((resolve, reject) => {
  fs.mkdir(pdfDir, { recursive: true }, err => {
    if (err) {
      reject(err);
      return;
    }

    resolve();
  });
});

// Evita que el mismo reporte se genere dos veces dentro del mismo proceso.
let reporteDiarioEnProceso = false;

const dibujarTabla = (doc, filas, columnas, inicioY) => {
  let y = inicioY;

  // Dibuja filas con bordes y reimprime encabezado si hay salto de página.
  const dibujarFila = (celdas, esEncabezado = false) => {
    const altoFila = Math.max(24, ...celdas.map((texto, indice) => doc.heightOfString(String(texto || ''), {
      width: columnas[indice].width - 12,
      align: columnas[indice].align || 'left'
    }) + 12));

    const renderFila = (valores, alto, encabezado) => {
      let x = doc.page.margins.left;

      valores.forEach((texto, indice) => {
        const columna = columnas[indice];
        if (encabezado) {
          doc.rect(x, y, columna.width, alto).fillAndStroke('#d9e2f3', '#666666');
          doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10).text(String(texto || ''), x + 6, y + 6, {
            width: columna.width - 12,
            align: columna.align || 'left'
          });
        } else {
          doc.rect(x, y, columna.width, alto).stroke('#666666');
          doc.fillColor('#000000').font('Helvetica').fontSize(9).text(String(texto || ''), x + 6, y + 6, {
            width: columna.width - 12,
            align: columna.align || 'left'
          });
        }

        x += columna.width;
      });

      y += alto;
    };

    if (y + altoFila > doc.page.height - doc.page.margins.bottom) {
      const encabezado = columnas.map(columna => columna.label);
      const altoEncabezado = Math.max(24, ...encabezado.map((texto, indice) => doc.heightOfString(String(texto || ''), {
        width: columnas[indice].width - 12,
        align: columnas[indice].align || 'left'
      }) + 12));

      doc.addPage();
      y = doc.page.margins.top;
      renderFila(encabezado, altoEncabezado, true);
    }

    renderFila(celdas, altoFila, esEncabezado);
  };

  dibujarFila(columnas.map(columna => columna.label), true);
  filas.forEach(fila => dibujarFila(fila));

  return y;
};

const generarPdfRegistro = ({ alumno, tipoMovimiento, motivo, fecha, hora, nombreArchivo }) => new Promise((resolve, reject) => {
  fs.mkdir(pdfDir, { recursive: true }, err => {
    if (err) {
      reject(err);
      return;
    }

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(path.join(pdfDir, nombreArchivo));

    stream.on('finish', resolve);
    stream.on('error', reject);
    doc.on('error', reject);

    doc.pipe(stream);

    doc.fontSize(20).text('Registro de ingreso o salida', { align: 'center' });
    doc.moveDown(1.5);
    doc.fontSize(12).text(`Fecha: ${fecha}`);
    doc.text(`Hora: ${hora}`);
    doc.text(`Tipo de movimiento: ${tipoMovimiento}`);
    doc.text(`Alumno: ${alumno.nombre} ${alumno.apellidos}`);
    doc.text(`Curso: ${alumno.curso}`);
    doc.moveDown(1);
    doc.text('Motivo:');
    doc.moveDown(0.5);
    doc.fontSize(11).text(motivo || 'Sin motivo informado', { indent: 18, lineGap: 4 });

    doc.end();
  });
});

const obtenerInicioDelDia = (fecha = new Date()) => {
  const inicio = new Date(fecha);
  inicio.setHours(0, 0, 0, 0);
  return inicio;
};

// Define el corte del reporte diario a las 14:00.
const obtenerCorteReporte = (fecha = new Date()) => {
  const corte = new Date(fecha);
  corte.setHours(14, 0, 0, 0);
  return corte;
};

// Genera el PDF diario con todos los movimientos entre las 00:00 y las 14:00.
const generarReporteDiario = async (fechaReferencia = new Date()) => {
  await asegurarDirectorio();

  const inicio = obtenerInicioDelDia(fechaReferencia);
  const corte = obtenerCorteReporte(fechaReferencia);
  const nombreArchivo = obtenerNombreArchivoReporteDiario(fechaReferencia);
  const archivoPdf = path.join(pdfDir, nombreArchivo);

  if (fs.existsSync(archivoPdf)) {
    return {
      nombreArchivo,
      archivoPdf,
      cantidad: 0,
      omitido: true
    };
  }

  const movimientos = await query(
    `
      SELECT
        r.fecha,
        r.tipo_movimiento,
        r.motivo,
        a.nombre,
        a.apellidos,
        a.curso
      FROM retiros r
      INNER JOIN alumnos a ON a.id = r.alumno_id
      WHERE r.fecha >= ?
        AND r.fecha < ?
      ORDER BY r.fecha ASC, r.id ASC
    `,
    [inicio, corte]
  );

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
    const stream = fs.createWriteStream(archivoPdf);

    stream.on('finish', () => resolve({ nombreArchivo, archivoPdf, cantidad: movimientos.length }));
    stream.on('error', reject);
    doc.on('error', reject);

    doc.pipe(stream);

    doc.fontSize(18).font('Helvetica-Bold').text('Reporte diario de movimientos', { align: 'center' });
    doc.moveDown(0.4);
    doc.fontSize(11).font('Helvetica').text(`Fecha del reporte: ${inicio.toLocaleDateString('es-CL')}`, { align: 'center' });
    doc.text('Rango considerado: 00:00 a 14:00', { align: 'center' });
    doc.moveDown(1);

    const columnas = [
      { label: 'Hora', width: 55, align: 'center' },
      { label: 'Tipo', width: 65, align: 'center' },
      { label: 'Alumno', width: 140, align: 'left' },
      { label: 'Curso', width: 85, align: 'left' },
      { label: 'Motivo', width: 190, align: 'left' }
    ];

    if (movimientos.length === 0) {
      doc.fontSize(11).text('No se registraron movimientos en este rango horario.');
    } else {
      const filas = movimientos.map(movimiento => {
        const fechaMovimiento = new Date(movimiento.fecha);
        const hora = fechaMovimiento.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
        return [
          hora,
          movimiento.tipo_movimiento || 'Salida',
          `${movimiento.nombre} ${movimiento.apellidos}`,
          movimiento.curso,
          movimiento.motivo || ''
        ];
      });

      dibujarTabla(doc, filas, columnas, doc.y);
    }

    doc.end();
  });
};

const asegurarColumnaTipoMovimiento = () => new Promise((resolve, reject) => {
  // Agrega la columna tipo_movimiento si aún no existe en la tabla retiros.
  const sql = `
    SELECT COUNT(*) AS total
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'retiros'
      AND COLUMN_NAME = 'tipo_movimiento'
  `;

  db.query(sql, (err, results) => {
    if (err) {
      reject(err);
      return;
    }

    if (results[0].total > 0) {
      resolve();
      return;
    }

    db.query("ALTER TABLE retiros ADD COLUMN tipo_movimiento VARCHAR(20) NOT NULL DEFAULT 'Salida' AFTER alumno_id", alterErr => {
      if (alterErr) {
        reject(alterErr);
        return;
      }

      resolve();
    });
  });
});

const inicializarProgramadorReporte = (() => {
  let programado = false;

  return () => {
    if (programado) {
      return;
    }

    programado = true;

    // Ejecuta el reporte si el servidor arrancó a las 14:00 o después y aún no existe.
    const ejecutarReporteSiCorresponde = async () => {
      if (reporteDiarioEnProceso) {
        return;
      }

      const ahora = new Date();
      const corte = obtenerCorteReporte(ahora);

      if (ahora < corte) {
        return;
      }

      reporteDiarioEnProceso = true;

      try {
        const resultado = await generarReporteDiario(ahora);
        if (resultado.omitido) {
          console.log('El reporte diario de hoy ya existía y no se regeneró.');
        } else {
          console.log('Reporte diario generado correctamente');
        }
      } catch (error) {
        console.error('Error al generar el reporte diario:', error);
      } finally {
        reporteDiarioEnProceso = false;
      }
    };

    // Programa el siguiente disparo diario a las 14:00 y luego se vuelve a agendar solo.
    const programarSiguienteEjecucion = () => {
      const ahora = new Date();
      const siguienteEjecucion = obtenerCorteReporte(ahora);

      if (siguienteEjecucion <= ahora) {
        siguienteEjecucion.setDate(siguienteEjecucion.getDate() + 1);
      }

      const demora = siguienteEjecucion.getTime() - ahora.getTime();

      setTimeout(async () => {
        try {
          const resultado = await generarReporteDiario(new Date());
          if (resultado.omitido) {
            console.log('El reporte diario de hoy ya existía y no se regeneró.');
          } else {
            console.log('Reporte diario generado correctamente');
          }
        } catch (error) {
          console.error('Error al generar el reporte diario:', error);
        } finally {
          programarSiguienteEjecucion();
        }
      }, demora);
    };

    ejecutarReporteSiCorresponde()
      .finally(() => {
        programarSiguienteEjecucion();
      });
  };
})();

exports.autorizarRetiro = (req, res) => {
  // Guarda un movimiento individual para que luego entre en el reporte diario.
  const { alumno_id, motivo, tipo_movimiento = 'Salida' } = req.body;

  if (!alumno_id) {
    return res.status(400).json({ mensaje: 'Falta el alumno' });
  }

  const fechaBase = new Date();
  const { fecha, hora } = formatearFechaHora(fechaBase);

  const sql = `
    INSERT INTO retiros (alumno_id, tipo_movimiento, motivo, fecha, autorizado)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [alumno_id, tipo_movimiento, motivo, fechaBase, true], (err) => {
    if (err) {
      return res.status(500).json({ mensaje: 'Error al autorizar retiro' });
    }

    res.json({
      mensaje: 'Movimiento registrado correctamente',
      fecha,
      hora
    });
  });
};

exports.generarReporteDiario = generarReporteDiario;
exports.asegurarColumnaTipoMovimiento = asegurarColumnaTipoMovimiento;
exports.inicializarProgramadorReporte = inicializarProgramadorReporte;
