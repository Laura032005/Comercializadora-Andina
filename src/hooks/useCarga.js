import { useCallback, useEffect, useRef, useState } from 'react';

// Ejecuta una función asíncrona y expone { datos, cargando, error, recargar }.
// Se vuelve a ejecutar cuando cambian las dependencias.
export function useCarga(funcion, dependencias = [], { activo = true } = {}) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(activo);
  const [error, setError] = useState('');
  const idPeticion = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ejecutar = useCallback(funcion, dependencias);

  const recargar = useCallback(async () => {
    const id = ++idPeticion.current;
    setCargando(true);
    setError('');
    try {
      const resultado = await ejecutar();
      if (id === idPeticion.current) setDatos(resultado);
    } catch (e) {
      if (id === idPeticion.current) setError(e.message || 'Ocurrió un error inesperado.');
    } finally {
      if (id === idPeticion.current) setCargando(false);
    }
  }, [ejecutar]);

  useEffect(() => {
    if (activo) recargar();
  }, [recargar, activo]);

  return { datos, setDatos, cargando, error, recargar };
}
