import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDatos } from '../../hooks/useDatos';
import { useFormulario } from '../../hooks/useFormulario';
import usuariosService from '../../services/usuariosService';
import { ROLES } from '../../services/catalogos';
import { validarUsuarioForm } from '../../utils/validaciones';
import { Aviso, Campo, EncabezadoPagina, EstadoDatos, Insignia, Modal } from '../../components/UI';

export default function UsuariosPage() {
  const { usuario: yo } = useAuth();
  const { datos, cargando, error, recargar } = useDatos(() => usuariosService.listar());
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState(null); // null = cerrado, {} = nuevo
  const [aviso, setAviso] = useState(null);

  const texto = busqueda.trim().toLowerCase();
  const usuarios = (datos ?? []).filter(
    (u) => !texto || u.username.toLowerCase().includes(texto) || u.nombre.toLowerCase().includes(texto)
  );

  async function cambiarEstado(u) {
    try {
      await usuariosService.cambiarEstado(u.id, !u.activo);
      setAviso({ tipo: 'exito', texto: `Usuario ${u.username} ${u.activo ? 'desactivado' : 'activado'}.` });
      recargar();
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.message });
    }
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Usuarios"
        descripcion="Personas que pueden entrar al sistema y su rol."
        acciones={<button type="button" className="btn" onClick={() => setEditando({})}>Nuevo usuario</button>}
      />
      <Aviso aviso={aviso} onCerrar={() => setAviso(null)} />

      <div className="filtros">
        <input type="search" placeholder="Buscar por usuario o nombre" aria-label="Buscar usuarios" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      </div>

      <EstadoDatos cargando={cargando && !datos} error={error} vacio={usuarios.length === 0} onReintentar={recargar}>
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Estado</th><th className="acciones">Acciones</th></tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>@{u.username}</td>
                  <td>{u.nombre}</td>
                  <td>{ROLES[u.rol] ?? u.rol}</td>
                  <td>{u.activo ? <Insignia tono="exito">Activo</Insignia> : <Insignia>Inactivo</Insignia>}</td>
                  <td className="acciones">
                    <button type="button" className="btn-enlace" onClick={() => setEditando(u)}>Editar</button>
                    {u.username !== yo.username && (
                      <button type="button" className="btn-enlace" onClick={() => cambiarEstado(u)}>
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EstadoDatos>

      <Modal titulo={editando?.id ? `Editar @${editando.username}` : 'Nuevo usuario'} abierto={Boolean(editando)} onCerrar={() => setEditando(null)}>
        {editando && (
          <UsuarioForm
            usuario={editando}
            onCancelar={() => setEditando(null)}
            onGuardado={(u) => {
              setEditando(null);
              setAviso({ tipo: 'exito', texto: `Usuario ${u.username} guardado.` });
              recargar();
            }}
          />
        )}
      </Modal>
    </>
  );
}

function UsuarioForm({ usuario, onGuardado, onCancelar }) {
  const esNuevo = !usuario.id;
  const { valores, errores, enviando, errorGeneral, cambiar, enviar } = useFormulario(
    { username: usuario.username ?? '', nombre: usuario.nombre ?? '', rol: usuario.rol ?? 'VENDEDOR', password: '' },
    (v) => validarUsuarioForm(v, esNuevo)
  );

  const guardar = (e) =>
    enviar(e, async (v) => {
      const u = esNuevo ? await usuariosService.crear(v) : await usuariosService.actualizar(usuario.id, v);
      onGuardado(u);
    });

  return (
    <form onSubmit={guardar} noValidate className="formulario">
      {errorGeneral && <div className="alerta-error" role="alert">{errorGeneral}</div>}
      <Campo id="u-username" label="Usuario" error={errores.username} ayuda={esNuevo ? 'Con este nombre inicia sesión. No se puede cambiar después.' : undefined}>
        <input id="u-username" name="username" value={valores.username} onChange={cambiar} disabled={!esNuevo} maxLength={50} autoComplete="off" />
      </Campo>
      <Campo id="u-nombre" label="Nombre completo" error={errores.nombre}>
        <input id="u-nombre" name="nombre" value={valores.nombre} onChange={cambiar} maxLength={100} />
      </Campo>
      <Campo id="u-rol" label="Rol" error={errores.rol}>
        <select id="u-rol" name="rol" value={valores.rol} onChange={cambiar}>
          {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </Campo>
      <Campo id="u-password" label={esNuevo ? 'Contraseña' : 'Nueva contraseña'} error={errores.password} ayuda={esNuevo ? 'Mínimo 6 caracteres.' : 'Déjala vacía para no cambiarla.'}>
        <input id="u-password" name="password" type="password" value={valores.password} onChange={cambiar} autoComplete="new-password" />
      </Campo>
      <div className="formulario-acciones">
        <button type="button" className="btn btn-secundario" onClick={onCancelar} disabled={enviando}>Cancelar</button>
        <button type="submit" className="btn" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </form>
  );
}
