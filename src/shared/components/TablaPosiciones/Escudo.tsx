import React from 'react';

/**
 * Paleta fija para el círculo de iniciales cuando el equipo no tiene escudo cargado. Ocho tonos,
 * elegidos para leerse bien con texto blanco encima y no chocar con los verdes/rojos/ámbar que
 * ya tienen significado en esta tabla (clasifica, elimina, provisoria). Determinística por id:
 * el mismo equipo siempre cae en el mismo color, no cambia entre renders ni entre pantallas.
 */
const PALETA = ['#0e7490', '#7c3aed', '#b45309', '#0d9488', '#be185d', '#4338ca', '#166534', '#9a3412'];

const colorPara = (semilla: string): string => {
  let hash = 0;
  for (let i = 0; i < semilla.length; i++) {
    hash = (hash * 31 + semilla.charCodeAt(i)) | 0;
  }
  return PALETA[Math.abs(hash) % PALETA.length];
};

const iniciales = (nombre: string): string => {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
};

interface EscudoProps {
  nombre: string;
  /** id o nombre: lo que haya, para que el color sea estable. */
  semilla: string;
  src?: string | null;
  size?: number;
}

/** Círculo de escudo: la imagen si existe, si no las iniciales sobre un color estable. */
export const Escudo: React.FC<EscudoProps> = ({ nombre, semilla, src, size = 22 }) => {
  const estilo = { width: size, height: size, fontSize: Math.max(8, size * 0.42) };
  if (src) {
    return (
      <img
        src={src}
        alt=""
        style={estilo}
        className="rounded-full object-cover flex-shrink-0 bg-slate-100"
      />
    );
  }
  return (
    <span
      style={{ ...estilo, background: colorPara(semilla) }}
      className="rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white leading-none"
      aria-hidden
    >
      {iniciales(nombre)}
    </span>
  );
};
