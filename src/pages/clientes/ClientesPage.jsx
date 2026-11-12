import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDatos } from '../../hooks/useDatos';
import clientesService from '../../services/clientesService';
import ventasService from '../../services/ventasService';
import { TIPOS_CLIENTE } from '../../services/catalogos';
import { formatoFecha, formatoMoneda } from '../../utils/formato';
import { Aviso, EncabezadoPagina, EstadoDatos, Insignia, Modal } from '../../components/UI';
import ClienteForm from './ClienteForm';

// Junta cada cliente con el resumen de sus compras (historial digital por cliente).
async function cargarClientes() {
  const [clientes, ventas] = await Promise.all([clientesService.listar(), ventasService.listar()]);
  const resumen = {};
  ventas
    .filter((v) => v.estado !== 'ANULADA')
    .forEach((v) => {
      const r = (resumen[v.clienteId] ??= { compras: 0, total: 0, ultima: null });
      r.compras += 1;
      r.total += v.total;
      if (!r.ultima || v.fecha > r.ultima) r.ultima = v.fecha;
    });
  return clientes.map((c) => ({ ...c, ...(resumen[c.id] ?? { compras: 0, total: 0, ultima: null }) }));
}

export default function ClientesPage() {
  const { usuario } = useAuth();
  const puedeEditar = usuario.rol !== 'GERENTE';
  const { datos, cargando, error, recargar } = useDatos(cargarClientes);
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState('');
  const [orden, setOrden] = useState('nombre');
  const [editando, setEditando] = useState(null);
  const [aviso, setAviso] = useState(null);

  const texto = busqueda.trim().toLowerCase();
  const clientes = (datos ?? [])
    .filter((c) => (!tipo || c.tipo === tipo) && (!texto || c.nombre.toLowerCase().includes(texto) || c.documento.includes(texto)))
    .sort((a, b) => (orden === 'total' ? b.total - a.total : a.nombre.localeCompare(b.nombre)));

  return (
    <>
      <EncabezadoPagina
        titulo="Clientes"
        descripcion="Clientes finales y mayoristas, con lo que han comprado."
        acciones={puedeEditar && <button type="button" className="btn" onClick={() => setEditando({})}>Nuevo cliente</button>}
      />
      <Aviso aviso={aviso} onCerrar={() => setAviso(null)} />

      <div className="filtros">
        <input type="search" placeholder="Buscar por nombre o documento" aria-label="Buscar clientes" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        <select aria-label="Filtrar por tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {Object.entries(TIPOS_CLIENTE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select aria-label="Ordenar" value={orden} onChange={(e) => setOrden(e.target.value)}>
          <option value="nombre">Ordenar por nombre</option>
          <option value="total">Mejores clientes primero</option>
        </select>
      </div>

      <EstadoDatos cargando={cargando && !datos} error={error} vacio={clientes.length === 0} onReintentar={recargar}>
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Cliente</th><th>Documento</th><th>Tipo</th><th>Teléfono</th>
                <th className="num">Compras</th><th className="num">Total comprado</th><th>Última compra</th>
                <th className="acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td><Link to={`/clientes/${c.id}`}>{c.nombre}</Link></td>
                  <td>{c.documento}</td>
                  <td>{c.tipo === 'MAYORISTA' ? <Insignia tono="info">Mayorista</Insignia> : 'Final'}</td>
                  <td>{c.telefono || '—'}</td>
                  <td className="num">{c.compras}</td>
                  <td className="num">{formatoMoneda(c.total)}</td>
                  <td>{formatoFecha(c.ultima, false)}</td>
                  <td className="acciones">
                    <Link className="btn-enlace" to={`/clientes/${c.id}`}>Historial</Link>
                    {puedeEditar && <button type="button" className="btn-enlace" onClick={() => setEditando(c)}>Editar</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EstadoDatos>

      <Modal titulo={editando?.id ? `Editar ${editando.nombre}` : 'Nuevo cliente'} abierto={Boolean(editando)} onCerrar={() => setEditando(null)}>
        {editando && (
          <ClienteForm
            cliente={editando}
            onCancelar={() => setEditando(null)}
            onGuardado={(c) => {
              setEditando(null);
              setAviso({ tipo: 'exito', texto: `Cliente ${c.nombre} guardado.` });
              recargar();
            }}
          />
        )}
      </Modal>
    </>
  );
}
