import { useEffect, useState } from 'react';
import { useCarga } from '../../hooks/useCarga';
import { ventasDelDia } from '../../services/reportesService';
import { Alerta, Cargando, Encabezado } from '../../components/ui';
import { fechaISO, formatoFecha, formatoMoneda, formatoNumero } from '../../utils/formato';

const INTERVALO_ACTUALIZACION = 30000; // 30 s

// HU19 - Consultar ventas del día (gerente)
export default function VentasDiaPage() {
  const hoy = fechaISO();
  const [fecha, setFecha] = useState(hoy);
  const [actualizado, setActualizado] = useState(null);
  const esHoy = fecha === hoy;

  const { datos, setDatos, cargando, error, recargar } = useCarga(async () => {
    const r = await ventasDelDia(fecha);
    setActualizado(new Date());
    return r;
  }, [fecha]);

  // Para el día actual, los datos se refrescan solos (reflejan pedidos recién confirmados).
  useEffect(() => {
    if (!esHoy) return undefined;
    const t = setInterval(() => {
      ventasDelDia(fecha)
        .then((r) => {
          setDatos(r);
          setActualizado(new Date());
        })
        .catch(() => {});
    }, INTERVALO_ACTUALIZACION);
    return () => clearInterval(t);
  }, [esHoy, fecha, setDatos]);

  const numeroPedidos = Number(datos?.numeroPedidos) || 0;
  const totalVendido = Number(datos?.totalVendido) || 0;
  const ticketPromedio = numeroPedidos > 0 ? totalVendido / numeroPedidos : 0;

  return (
    <>
      <Encabezado
        titulo="Ventas del día"
        descripcion={esHoy ? 'Se actualiza automáticamente al confirmarse nuevos pedidos.' : `Ventas del ${formatoFecha(`${fecha}T12:00:00`)}`}
      />

      <div className="tarjeta filtros">
        <div className="campo campo-angosto">
          <label htmlFor="fecha">Fecha</label>
          <input id="fecha" type="date" value={fecha} max={hoy} onChange={(e) => e.target.value && setFecha(e.target.value)} />
        </div>
        {!esHoy && (
          <button type="button" className="btn btn-secundario" onClick={() => setFecha(hoy)}>Ver hoy</button>
        )}
        <button type="button" className="btn btn-secundario" onClick={recargar} disabled={cargando}>
          {cargando ? 'Actualizando…' : 'Actualizar'}
        </button>
      </div>

      {cargando && !datos ? (
        <Cargando />
      ) : error && !datos ? (
        <Alerta>{error}</Alerta>
      ) : (
        <>
          <div className="grid-kpi">
            <div className="kpi">
              <p className="kpi-etiqueta">Total vendido</p>
              <p className="kpi-valor">{formatoMoneda(totalVendido)}</p>
            </div>
            <div className="kpi">
              <p className="kpi-etiqueta">Pedidos confirmados</p>
              <p className="kpi-valor">{formatoNumero(numeroPedidos)}</p>
            </div>
            <div className="kpi">
              <p className="kpi-etiqueta">Valor promedio por pedido</p>
              <p className="kpi-valor">{formatoMoneda(ticketPromedio)}</p>
            </div>
          </div>
          {actualizado && (
            <p className="texto-suave" style={{ fontSize: '0.8rem' }}>
              Última actualización: {actualizado.toLocaleTimeString('es-CO')}
            </p>
          )}
        </>
      )}
    </>
  );
}
