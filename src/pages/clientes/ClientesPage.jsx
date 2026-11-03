import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PERMISOS } from '../../config/roles';
import { useCarga } from '../../hooks/useCarga';
import { listarClientes } from '../../services/clientesService';
import { Alerta, Cargando, Encabezado, Paginacion, Vacio } from '../../components/ui';
import { NOMBRE_TIPO_CLIENTE } from '../../utils/formato';

// HU02 - Consultar cliente
export default function ClientesPage() {
  const { tieneRol } = useAuth();
  const [params, setParams] = useSearchParams();
  const criterio = params.get('criterio') || 'nombre';
  const texto = params.get('q') || '';
  const pagina = Number(params.get('pagina') || 0);

  const [criterioForm, setCriterioForm] = useState(criterio);
  const [textoForm, setTextoForm] = useState(texto);

  const { datos, cargando, error, recargar } = useCarga(
    () => listarClientes({ [criterio]: texto.trim() || undefined, page: pagina }),
    [criterio, texto, pagina]
  );

  function buscar(e) {
    e.preventDefault();
    const nuevos = new URLSearchParams();
    if (textoForm.trim()) {
      nuevos.set('criterio', criterioForm);
      nuevos.set('q', textoForm.trim());
    }
    setParams(nuevos);
  }

  function limpiar() {
    setTextoForm('');
    setParams({});
  }

  function cambiarPagina(p) {
    const nuevos = new URLSearchParams(params);
    nuevos.set('pagina', p);
    setParams(nuevos);
  }

  const clientes = datos?.items ?? [];

  return (
    <>
      <Encabezado titulo="Clientes" descripcion="Busca un cliente por identificación o por nombre.">
        {tieneRol(PERMISOS.clientesEditar) && (
          <Link to="/clientes/nuevo" className="btn">+ Nuevo cliente</Link>
        )}
      </Encabezado>

      <form className="tarjeta filtros" onSubmit={buscar}>
        <div className="campo campo-angosto">
          <label htmlFor="criterio">Buscar por</label>
          <select id="criterio" value={criterioForm} onChange={(e) => setCriterioForm(e.target.value)}>
            <option value="nombre">Nombre</option>
            <option value="identificacion">Identificación</option>
          </select>
        </div>
        <div className="campo">
          <label htmlFor="q">{criterioForm === 'nombre' ? 'Nombre (o parte del nombre)' : 'Número de identificación'}</label>
          <input
            id="q"
            type="search"
            value={textoForm}
            onChange={(e) => setTextoForm(e.target.value)}
            placeholder={criterioForm === 'nombre' ? 'Ej. Distribuidora' : 'Ej. 1075123456'}
          />
        </div>
        <button type="submit" className="btn">Buscar</button>
        {texto && (
          <button type="button" className="btn btn-secundario" onClick={limpiar}>Limpiar</button>
        )}
      </form>

      <div className="tarjeta tarjeta-sin-padding">
        {cargando ? (
          <Cargando />
        ) : error ? (
          <div style={{ padding: '1rem' }}>
            <Alerta>
              {error}{' '}
              <button type="button" className="btn-link" onClick={recargar}>Reintentar</button>
            </Alerta>
          </div>
        ) : clientes.length === 0 ? (
          <Vacio titulo={texto ? 'No se encontró ningún cliente' : 'Aún no hay clientes registrados'}>
            {texto ? `No hay clientes que coincidan con "${texto}".` : 'Registra el primer cliente para empezar.'}
          </Vacio>
        ) : (
          <>
            <div className="tabla-contenedor">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Identificación</th>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Teléfono</th>
                    <th>Correo</th>
                    <th className="acciones">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((c) => (
                    <tr key={c.id}>
                      <td>{c.identificacion}</td>
                      <td>{c.nombre}</td>
                      <td>
                        <span className={`badge ${c.tipo === 'MAYORISTA' ? '' : 'badge-gris'}`}>
                          {NOMBRE_TIPO_CLIENTE[c.tipo] || c.tipo}
                        </span>
                      </td>
                      <td>{c.telefono}</td>
                      <td>{c.correo}</td>
                      <td className="acciones">
                        <Link to={`/clientes/${c.id}`} className="btn btn-secundario btn-sm">Ver</Link>
                        {tieneRol(PERMISOS.clientesEditar) && (
                          <Link to={`/clientes/${c.id}/editar`} className="btn btn-secundario btn-sm">Editar</Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Paginacion
              pagina={datos.pagina}
              totalPaginas={datos.totalPaginas}
              totalElementos={datos.totalElementos}
              onCambiar={cambiarPagina}
            />
          </>
        )}
      </div>
    </>
  );
}
