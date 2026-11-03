import { useEffect, useState } from 'react';

// Devuelve el valor solo después de que deja de cambiar durante `espera` ms.
export function useDebounce(valor, espera = 350) {
  const [retrasado, setRetrasado] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setRetrasado(valor), espera);
    return () => clearTimeout(t);
  }, [valor, espera]);
  return retrasado;
}
