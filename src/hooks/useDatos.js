import { useCallback, useEffect, useRef, useState } from 'react';

// Carga datos de un servicio y expone { datos, cargando, error, recargar }.
// `cargar` debe ser una función async; `deps` indica cuándo volver a cargar.
export function useDatos(cargar, deps = []) {
  const [estado, setEstado] = useState({ datos: null, cargando: true, error: '' });
  const peticion = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recargar = useCallback(async () => {
    const id = ++peticion.current;
    setEstado((e) => ({ ...e, cargando: true, error: '' }));
    try {
      const datos = await cargar();
      if (id === peticion.current) setEstado({ datos, cargando: false, error: '' });
    } catch (err) {
      if (id === peticion.current) setEstado((e) => ({ ...e, cargando: false, error: err.message }));
    }
  }, deps);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { ...estado, recargar };
}
