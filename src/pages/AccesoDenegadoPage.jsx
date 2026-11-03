import { Link } from 'react-router-dom';

export default function AccesoDenegadoPage() {
  return (
    <div className="tarjeta pagina-mensaje">
      <p className="pagina-mensaje-codigo">403</p>
      <h1>Acceso no permitido</h1>
      <p className="texto-suave">Tu rol no tiene permiso para ver esta sección.</p>
      <Link to="/inicio" className="btn">Volver al inicio</Link>
    </div>
  );
}
