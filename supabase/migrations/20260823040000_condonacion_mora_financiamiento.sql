-- Soporte para PERDONAR (condonar) mora con registro de quien y por que.
-- Antes la mora vencida se "perdia" sola cuando el capital cubria la cuota
-- (bug); ahora la mora se congela por cuota vencida y solo baja al cobrarse
-- o al condonarse explicitamente. Una condonacion se guarda como una fila
-- en financiamiento_pagos con tipo='condonacion', monto=0, mora=0 y el monto
-- perdonado en mora_condonada (mas la nota con el motivo y recibido_por con
-- quien lo hizo).
alter table public.financiamiento_pagos add column if not exists tipo text not null default 'pago';
alter table public.financiamiento_pagos add column if not exists mora_condonada numeric not null default 0;
comment on column public.financiamiento_pagos.tipo is 'pago | condonacion. Las condonaciones perdonan mora (monto=0, mora=0, mora_condonada>0).';
comment on column public.financiamiento_pagos.mora_condonada is 'Mora perdonada en esta fila (solo filas tipo=condonacion).';
