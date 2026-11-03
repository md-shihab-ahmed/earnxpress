DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'earnxpress_admin') THEN
    CREATE USER earnxpress_admin WITH PASSWORD 'earnxpress_dev_secret' SUPERUSER;
  ELSE
    ALTER USER earnxpress_admin WITH PASSWORD 'earnxpress_dev_secret' SUPERUSER;
  END IF;
END
$$;

SELECT 'CREATE DATABASE earnxpress_db OWNER earnxpress_admin'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'earnxpress_db')\gexec

GRANT ALL PRIVILEGES ON DATABASE earnxpress_db TO earnxpress_admin;
