// Hook genérico para formularios: valores, errores por campo, "tocados" y errores del servidor.
import { useCallback, useState } from 'react';

export default function useFormulario(valoresIniciales, validadores) {
  const [valores, setValores] = useState(valoresIniciales);
  const [errores, setErrores] = useState({});
  const [tocados, setTocados] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');

  const validarCampo = useCallback(
    (nombre, valor, todos) => (validadores[nombre] ? validadores[nombre](valor, todos) : ''),
    [validadores],
  );

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      const nuevos = { ...valores, [name]: value };
      setValores(nuevos);
      setErrorGeneral('');
      setErrores((er) => {
        const siguiente = { ...er };
        if (tocados[name]) siguiente[name] = validarCampo(name, value, nuevos);
        else delete siguiente[name]; // limpia errores del servidor al editar
        // la confirmación depende de la contraseña
        if (name === 'contrasena' && tocados.confirmacion) {
          siguiente.confirmacion = validarCampo('confirmacion', nuevos.confirmacion, nuevos);
        }
        return siguiente;
      });
    },
    [valores, tocados, validarCampo],
  );

  const handleBlur = useCallback(
    (e) => {
      const { name, value } = e.target;
      setTocados((t) => ({ ...t, [name]: true }));
      setErrores((er) => ({ ...er, [name]: validarCampo(name, value, valores) }));
    },
    [valores, validarCampo],
  );

  // Valida todo; devuelve true si el formulario es válido.
  const validarTodo = useCallback(() => {
    const nuevos = {};
    Object.keys(validadores).forEach((nombre) => {
      const msg = validarCampo(nombre, valores[nombre], valores);
      if (msg) nuevos[nombre] = msg;
    });
    setErrores(nuevos);
    setTocados(Object.fromEntries(Object.keys(validadores).map((n) => [n, true])));
    return Object.keys(nuevos).length === 0;
  }, [validadores, validarCampo, valores]);

  // Muestra los errores por campo que mandó el back (400 con `errores`).
  const aplicarErroresServidor = useCallback((erroresServidor = {}) => {
    setErrores((er) => ({ ...er, ...erroresServidor }));
  }, []);

  const limpiarCampo = useCallback((nombre) => {
    setValores((v) => ({ ...v, [nombre]: '' }));
  }, []);

  return {
    valores,
    errores,
    errorGeneral,
    setErrorGeneral,
    handleChange,
    handleBlur,
    validarTodo,
    aplicarErroresServidor,
    limpiarCampo,
  };
}
