// Genera y descarga un archivo CSV (separador ";" para que Excel en español lo abra bien).
function escapar(valor) {
  const texto = valor === null || valor === undefined ? '' : String(valor);
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

export function descargarCSV(nombreArchivo, columnas, filas) {
  const encabezado = columnas.map((c) => escapar(c.titulo)).join(';');
  const cuerpo = filas.map((fila) => columnas.map((c) => escapar(c.valor(fila))).join(';'));
  const contenido = '﻿' + [encabezado, ...cuerpo].join('\r\n');

  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}
