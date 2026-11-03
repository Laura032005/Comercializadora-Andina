import { Link } from 'react-router-dom';

export default function NoEncontradaPage() {
  return (
    <div className="tarjeta pagina-mensaje">
      <p className="pagina-mensaje-codigo">404</p>
      <h1>Página no encontrada</h1>
      <p className="texto-suave">La dirección que buscas no existe.</p>
      <Link to="/inicio" className="btn">Volver al inicio</Link>
    </div>
  );
}
