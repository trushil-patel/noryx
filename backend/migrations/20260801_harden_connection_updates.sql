-- Prevent authenticated clients from mutating requester/addressee identifiers or
-- bypassing the backend's constrained accept/decline operation.
drop policy if exists "Recipients answer connection requests" on public.connections;
revoke update on public.connections from anon, authenticated;
