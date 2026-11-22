import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

type Valor = string | number | null | undefined;

/**
 * Filtros de pantalla guardados en la query string en vez de en `useState`.
 *
 * Por qué: un filtro en estado local se pierde al recargar, al volver con "atrás" desde el detalle
 * de un partido y no se puede mandar por link. En la URL sobrevive a las tres cosas.
 *
 * - `get(k)` devuelve '' si el parámetro no está, así se usa directo como `value` de un select.
 * - `set({ a: 'x', b: null })` escribe varios a la vez (uno solo navega una vez) y borra los vacíos,
 *   para que la URL no se llene de `?fase=&estado=`. Usa `replace`: cambiar un filtro no agrega
 *   una entrada al historial, así "atrás" vuelve a la pantalla anterior y no al filtro anterior.
 *
 * Al cambiar un filtro padre, limpiá los hijos en el mismo `set` (competencia → temporada → fase).
 * No lo hagas en un `useEffect` que escuche al padre: ese efecto corre también al montar y borra
 * los hijos que venían en el link.
 */
export function useFiltrosURL<K extends string>() {
  const [searchParams, setSearchParams] = useSearchParams();

  const get = useCallback((clave: K) => searchParams.get(clave) ?? '', [searchParams]);

  const set = useCallback(
    (cambios: Partial<Record<K, Valor>>) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          for (const [clave, valor] of Object.entries(cambios) as Array<[string, Valor]>) {
            if (valor === null || valor === undefined || valor === '') params.delete(clave);
            else params.set(clave, String(valor));
          }
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return { get, set };
}
