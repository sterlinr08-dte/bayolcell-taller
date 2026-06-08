// Configuración de conexión al mismo Supabase del ERP/Taller BAYOL CELL.
// La clave "publishable" es pública por diseño (la misma del taller). No pongas
// aquí la clave secreta ni la API key de Claude — esa vive solo en Supabase.
window.BDE_CONFIG = {
  SUPABASE_URL: 'https://vkhwdvjtowrhkhqavnvk.supabase.co',
  SUPABASE_KEY: 'sb_publishable_PynS5ZjKoQ36HCpguVzxaw_KZOlagtz',
  // Dominio de correo interno para el login (usuario -> usuario@bayolcell.app)
  AUTH_DOMAIN: 'bayolcell.app',
  EDGE_FUNCTION: 'bde-diagnostico',
  EDGE_TERMICO: 'bde-termico',
  EDGE_VISUAL: 'bde-visual',
  STORAGE_BUCKET: 'diagnostico-img',
  // Esquemáticos REEFOX (Fase 5). Cambia esta URL por la que usas para entrar.
  REEFOX_URL: 'https://www.reefox.net'
};
