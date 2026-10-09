# AI BOARD experimental backend

This code is committed for review on `feature/ai-board-plan-iphone-x-plus` only. Do not apply `schema.sql` or deploy `ai-board-chat` to production without owner authorization. `bde-diagnostico` is not changed.

The schema was checked against the existing production schema through read-only metadata queries. Its executable tests use isolated PostgreSQL via PGlite, with fixtures representing the legacy tables and policies. These tests do not replace staging validation against actual Auth bindings and order assignments.

## Access rules

- `ai_board_cases` exposes only cases owned by the current Auth user / active actor, or linked to an order currently assigned to that actor. An active actor binding and diagnostic permission are mandatory.
- Sessions belong to one Auth user and one existing diagnostic. Another technician cannot see that user's conversations, even if both are assigned to the case.
- Every history read and reservation checks current case access. Removing an assignment revokes history access unless the actor owns the case.
- Browser clients can create/read/delete their sessions. They can only read turns; assistant replies can only be written by the server. No browser service-role key.
- `ai_board_reserve` is a narrowly scoped SECURITY DEFINER RPC because direct turn inserts would let clients forge replies. It validates Auth ownership/case access, holds a user advisory lock, and creates exactly one pending turn per request UUID. Unauthenticated execution is revoked.
- `ai_board_finish` is SECURITY INVOKER and executable by service_role only. It never overwrites a completed turn. The Edge Function verifies the Auth user again and reads the session under the caller's JWT before persisting a reply.
- Limits: 10 new attempts per calendar minute and 80 per day per Auth user, including failed provider calls. Retries of the same request UUID do not consume another slot. Provider timeout: 45 seconds. Pending leases: 2 minutes.

## Test environment setup

1. Use a separate Supabase development project/branch with the existing schema and synthetic Auth actors; never copy client unlock codes or personal data.
2. Review and apply `schema.sql` there. It is a test schema proposal, outside `migrations`, because it has not been validated on staging yet.
3. Configure the new function with `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and the existing provider's `ANTHROPIC_API_KEY`. Never put server credentials in frontend files. `AI_BOARD_ALLOWED_ORIGINS` is an explicit comma-separated staging origin allowlist. `AI_BOARD_CLAUDE_MODEL` can select a supported model; default matches the existing service, `claude-sonnet-4-6`.
4. Deploy only `ai-board-chat` to that development environment with gateway JWT verification enabled. The handler additionally calls Auth `/user` and rejects anonymous identities.
5. Test with two users, assignment revocation, expired sessions, quota, failed requests and refresh. Then audit policies/grants before requesting production authorization.

## Data and limitations

The endpoint accepts only a message, a session UUID, a request UUID, explicit consent and optional symptoms/battery/current measurements. It never reads whole repair orders, customer records, panic logs or Library records. It stores minimized messages and measurements, and loads up to seven prior completed pairs into the model context (maximum context character budget 18,000). The browser displays the latest 40 turns without writing message content to localStorage/sessionStorage.

Pattern redaction is not exhaustive anonymization. Technicians must send technical data only. Names or freeform addresses without labels can escape automatic redaction. Existing broad legacy diagnosis policies are not rewritten by this proposal.

No automatic knowledge publication or unverified case retrieval is enabled. The separate system prompt treats AI output as unverified and prohibits invented electrical references and probability percentages. Model output still needs human review.

Permanent deletion is available through session DELETE with RLS, cascading to turns. There is no automatic retention cleanup yet; agree retention before staging stores real case data. Provider generation is mocked in automated tests; no real Anthropic request or cost was incurred.

## Reproducible checks

From `tests/ai-board`: `npm ci`, `npx playwright install chromium`, `npm test`. Backend/database only: `npm run test:backend`.

References: https://supabase.com/docs/guides/database/postgres/row-level-security ; https://supabase.com/docs/guides/functions/auth ; https://platform.claude.com/docs/en/api/messages ; https://platform.claude.com/docs/en/api/errors
