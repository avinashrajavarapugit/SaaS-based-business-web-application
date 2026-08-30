-- Runs once, on an empty data directory.
--
-- POSTGRES_USER is created as a SUPERUSER, and superusers bypass row-level
-- security unconditionally -- FORCE ROW LEVEL SECURITY does not change that.
-- The application therefore connects as a separate, deliberately unprivileged
-- role so its RLS policies are actually enforced.

CREATE ROLE saas_app WITH
  LOGIN
  PASSWORD 'saas_app'
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOBYPASSRLS;

-- saas_app owns the schema so Prisma migrations can create objects, while
-- remaining subject to RLS because it is not a superuser.
ALTER SCHEMA public OWNER TO saas_app;
GRANT ALL ON SCHEMA public TO saas_app;
