-- 14-oct-2026 — Pausar los borradores de observación de la IA de WhatsApp (dueño: «Sí»).
-- Gastaban una llamada de IA por cada mensaje entrante y agotaron el límite mensual de Anthropic sin enseñar nada
-- (base de conocimiento vacía, 26 de 2,090 revisados). Se reactivan poniendo true cuando haya conocimiento aprobado.
alter table public.whatsapp_ia_config add column if not exists borradores_observacion boolean not null default false;
comment on column public.whatsapp_ia_config.borradores_observacion is
  'Si es true, en modo observacion la IA redacta un borrador por mensaje (whatsapp_ia_episodios). En pausa (false) desde el 14-oct-2026 para ahorrar IA.';
