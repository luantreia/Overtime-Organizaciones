import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../../utils/authFetch';

interface SearchResult {
  _id: string;
  nombre: string;
  alias?: string;
  foto?: string;
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const data = await authFetch<SearchResult[]>(`/jugadores?search=${encodeURIComponent(query)}&limit=5`);
        setResults(data);
        setShowResults(true);
      } catch (error) {
        console.error('Error searching players:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (id: string) => {
    // Navigate to player profile or edit page
    // Since we don't have a global player edit page yet, we might need to create one or use a modal.
    // For now, let's assume we want to go to a player detail view.
    // But wait, the plan says "Poder buscar un jugador ... y editarlo".
    // Maybe navigate to /jugadores/:id if it exists, or open a modal.
    // I'll navigate to /jugadores/:id for now, assuming we will create that route or it exists.
    // Actually, `overtime-gestion-organizaciones` doesn't seem to have a global player list page in the navbar.
    // It has `Competencias`, `Partidos`, `Organizacion`.
    // Maybe I should open a modal to edit the player directly.
    
    // For this iteration, I'll just log it and maybe show a toast "Feature coming soon" or navigate to a placeholder.
    // Or better, navigate to `/jugadores/${id}` and I'll ensure that route exists later.
    console.log('Selected player:', id);
    setShowResults(false);
    setQuery('');
    // navigate(`/jugadores/${id}`); 
    // Since we don't have the route yet, let's just alert.
    alert(`Seleccionaste al jugador ${id}. La edición global se implementará pronto.`);
  };

  return (
    <div className="relative w-full max-w-md" ref={wrapperRef}>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        <input
          type="text"
          className="block w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pl-10 pr-3 text-sm placeholder-slate-500 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="Buscar jugador (nombre, alias, DNI)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setShowResults(true); }}
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
          <ul className="max-h-60 overflow-auto py-1">
            {results.map((player) => (
              <li
                key={player._id}
                className="cursor-pointer px-4 py-2 hover:bg-slate-100"
                onClick={() => handleSelect(player._id)}
              >
                <div className="flex items-center">
                  {player.foto ? (
                    <img src={player.foto} alt="" className="h-8 w-8 rounded-full object-cover mr-3" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center mr-3 text-xs font-bold text-slate-500">
                      {player.nombre.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-900">{player.nombre}</p>
                    {player.alias && <p className="text-xs text-slate-500">{player.alias}</p>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {showResults && results.length === 0 && query.length >= 2 && !loading && (
        <div className="absolute z-50 mt-1 w-full rounded-md bg-white p-4 text-center text-sm text-slate-500 shadow-lg ring-1 ring-black ring-opacity-5">
          No se encontraron jugadores.
        </div>
      )}
    </div>
  );
}
