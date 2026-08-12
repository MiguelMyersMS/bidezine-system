-- ═══════════════════════════════════════════════════════════════════════════════════
-- Bootstrap — map this environment's principals to the Sandbox's roles.
--
-- Kept OUT of db/migrations/ on purpose. The migrations describe the system and are
-- portable to any SQL Server or Fabric SQL database; this file names four specific Entra
-- service principals that exist only in the biDezine tenant. Mixing the two would mean a
-- local test database could never run the same migrations as production.
--
-- The database users themselves were created during provisioning
-- (CREATE USER ... FROM EXTERNAL PROVIDER). This file only assigns role membership.
--
-- Fabric note, verified empirically 2026-08-11: Fabric's own item/workspace RBAC governs
-- ONLY whether a principal may open a connection. It maps into no SQL role and grants no
-- object permission — all four principals hold exactly CONNECT and nothing else until
-- this file runs. That independence is what makes the DENY in migration 002 trustworthy:
-- there is no Fabric-layer permission that can override it.
-- ═══════════════════════════════════════════════════════════════════════════════════

ALTER ROLE app_rw          ADD MEMBER [bidezine-sandbox-app];
ALTER ROLE agent_rw        ADD MEMBER [bidezine-sandbox-agent];
ALTER ROLE runner_evidence ADD MEMBER [bidezine-sandbox-runner];
GO

-- bidezine-sandbox-admin is deliberately NOT given any of these roles. It is db_owner —
-- it applies migrations and nothing else. No application, agent or runner ever connects
-- with it, because db_owner would sail straight through every DENY in migration 002.
GO
