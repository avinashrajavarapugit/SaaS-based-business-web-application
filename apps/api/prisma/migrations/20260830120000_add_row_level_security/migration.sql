-- Tenant isolation enforced by Postgres itself, independent of application code.
--
-- FORCE is required: without it the table owner (which is the role the app
-- connects as) bypasses every policy, and the whole thing is decorative.
--
-- current_setting(..., true) returns NULL when the variable is unset, so the
-- comparison yields NULL and no rows match. Forgetting to set the tenant fails
-- closed rather than exposing everything.

ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "Document"
  USING ("organizationId" = current_setting('app.current_organization_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));

ALTER TABLE "Invite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invite" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "Invite"
  USING ("organizationId" = current_setting('app.current_organization_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));
