# Overtime Gestión Organizaciones

Panel para los organizadores de torneos y ligas. Es la herramienta más compleja del ecosistema, permitiendo configurar toda la estructura competitiva.

## 🚀 Funcionalidades Principales
- **Estructura Competitiva**: Crear Competencias -> Temporadas -> Fases -> Grupos.
- **Gestión de Equipos y Jugadores**: Validar listas de buena fe, fichajes y perfiles.
- **Programación de Partidos**: Crear fixture, asignar horarios y canchas.
- **Modo Ranked**: Configuración de torneos tipo "League" con ELO y equipos efímeros.
- **Notificaciones**: Aprobar inscripciones de equipos y resultados cargados por DTs.

## 🛠 Tech Stack
- **Framework**: React
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS

## 📂 Estructura
```
src/
  features/
    competencias/   # Core del negocio
    ranked/         # Nuevo módulo competitivo
    partidos/       # Gestión de fixture
    solicitudes/    # Aprobaciones
```

## ⚡ Setup
1. `npm install`
2. `npm start`
