import { createHandler } from './core.mjs';
// Standalone experimental endpoint; JWT verified again using Auth getUser in core.
Deno.serve(createHandler({ env: (name: string) => Deno.env.get(name) }));
