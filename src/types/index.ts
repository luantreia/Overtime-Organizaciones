// Barrel file to provide a single import path `src/types` for legacy relative imports.
// Re-export general UI types and the specialized solicitudesEdicion types
// from a single entry point. Keep definitions centralized to avoid
// duplicate symbol exports.
export * from '../shared/utils/types/types';
export * from '../shared/utils/types/solicitudesEdicion';
