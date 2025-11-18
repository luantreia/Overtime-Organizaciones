# Estadísticas de Partido - Componentes Compartidos

Este módulo proporciona componentes reutilizables para mostrar estadísticas de partidos de softball/béisbol en aplicaciones React con TypeScript.

## Funcionalidad

Los componentes permiten visualizar estadísticas de partidos en diferentes vistas:
- **Vista General**: Resumen con tarjetas de estadísticas totales, gráficos de distribución y tabla comparativa por equipos.
- **Vista por Equipos**: Detalles estadísticos agrupados por equipo con gráficos comparativos.
- **Vista por Jugadores**: Tabla detallada de estadísticas individuales de cada jugador.

Soporta dos modos de estadísticas:
- **Automático**: Estadísticas calculadas automáticamente por sets del partido.
- **Manual**: Estadísticas capturadas manualmente por el usuario.

## Componentes Principales

### EstadisticasPartidoModal
Componente modal principal que agrupa todas las vistas de estadísticas.

```tsx
import { EstadisticasPartidoModal } from './shared/components/EstadisticasPartidoModal';

function MiComponente() {
  const [modalAbierto, setModalAbierto] = useState(false);

  return (
    <>
      <button onClick={() => setModalAbierto(true)}>
        Ver Estadísticas
      </button>

      <EstadisticasPartidoModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        partidoId="id-del-partido"
        partido={{
          _id: "id-del-partido",
          modoEstadisticas: "automatico",
          modoVisualizacion: "automatico"
        }}
      />
    </>
  );
}
```

### Componentes Individuales

#### renderEstadisticasGenerales
Renderiza la vista general con resumen, gráficos y tabla.

#### renderEstadisticasEquipos
Renderiza estadísticas agrupadas por equipos.

#### renderEstadisticasJugadores
Renderiza tabla de estadísticas por jugador.

## Dependencias

### Requeridas
- React 16+
- TypeScript
- Tailwind CSS (para estilos)
- Recharts (para gráficos)

### Opcionales
- Sistema de autenticación para `authFetch`

## Configuración

### Servicio de API
El módulo incluye un servicio genérico que puedes adaptar:

```typescript
// En estadisticasService.ts
const authFetch = async <T>(url: string, options?: RequestInit): Promise<T> => {
  // Implementa tu lógica de autenticación aquí
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // Si usas JWT
      ...options?.headers,
    },
    ...options,
  });
  return response.json();
};
```

### URLs de API
Configura las URLs base para las llamadas a la API:

```typescript
const API_BASE = 'https://tu-api.com/api';

// Ejemplos de endpoints esperados:
// GET /set-partido?partido=${partidoId}
// GET /estadisticas/jugador-set?set=${setId}
// GET /estadisticas/manual?partido=${partidoId}
```

## Tipos de Datos

### Estadísticas Automáticas
- `ResumenEstadisticasAutomaticas`: Estadísticas calculadas por sets
- `EstadisticaSetResumen`: Resumen de un set específico
- `EstadisticaJugadorSetResumen`: Estadísticas de un jugador en un set

### Estadísticas Manuales
- `ResumenEstadisticasManual`: Estadísticas capturadas manualmente
- `EstadisticaManualEquipo`: Estadísticas agregadas por equipo
- `EstadisticaManualJugador`: Estadísticas de un jugador específico

## Modo de Uso

1. **Importa el componente principal:**
   ```tsx
   import { EstadisticasPartidoModal } from './ruta/al/modulo';
   ```

2. **Pasa las props requeridas:**
   - `isOpen`: Boolean para controlar la visibilidad del modal
   - `onClose`: Función para cerrar el modal
   - `partidoId`: ID del partido para cargar estadísticas
   - `partido`: Objeto opcional con configuración del partido

3. **Personaliza según necesites:**
   - Modo automático/manual
   - Vista seleccionada (general, equipos, jugadores)

## Ejemplo Completo

```tsx
import React, { useState } from 'react';
import { EstadisticasPartidoModal } from './shared/components/EstadisticasPartidoModal';

export function PartidoCard({ partido }: { partido: any }) {
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false);

  return (
    <div className="partido-card">
      <h3>{partido.nombre}</h3>
      <button
        onClick={() => setMostrarEstadisticas(true)}
        className="btn btn-primary"
      >
        📊 Ver Estadísticas
      </button>

      <EstadisticasPartidoModal
        isOpen={mostrarEstadisticas}
        onClose={() => setMostrarEstadisticas(false)}
        partidoId={partido._id}
        partido={partido}
      />
    </div>
  );
}
```

## Personalización

Los componentes usan Tailwind CSS para estilos. Puedes personalizar:
- Colores y temas modificando las clases CSS
- Layout ajustando las clases de grid y spacing
- Gráficos modificando las props de Recharts

## Notas de Desarrollo

- El módulo está diseñado para ser autónomo y reutilizable
- Incluye manejo de errores y estados de carga
- Compatible con React hooks y TypeScript strict
- Optimizado para rendimiento con lazy loading de datos