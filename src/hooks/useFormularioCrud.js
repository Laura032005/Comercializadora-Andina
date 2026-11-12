import { useState } from 'react';

// Estado y envío de un formulario con validación.
export function useFormularioCrud(inicial, validar) {
  const [valores, setValores] = useState(inicial);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');

  function cambiar(e) {
    const { name, value, type, checked } = e.target;
    setValores((v) => ({ ...v, [name]: type === 'checkbox' ? checked : value }));
    setErrores((er) => ({ ...er, [name]: undefined }));
    setErrorGeneral('');
  }

  // accion(valores) se ejecuta solo si no hay errores. Devuelve true si salió bien.
  async function enviar(e, accion) {
    e?.preventDefault();
    const errs = validar ? validar(valores) : {};
    setErrores(errs);
    if (Object.keys(errs).length > 0) return false;
    setEnviando(true);
    setErrorGeneral('');
    try {
      await accion(valores);
      return true;
    } catch (err) {
      setErrorGeneral(err.message);
      return false;
    } finally {
      setEnviando(false);
    }
  }

  return { valores, setValores, errores, enviando, errorGeneral, cambiar, enviar };
}
