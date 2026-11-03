#!/bin/sh
set -e
PGDATA=/mnt/host/d/earnxpress_pgdata
mkdir -p "$PGDATA" /run/postgresql
chown -R postgres:postgres "$PGDATA" /run/postgresql
if [ ! -f "$PGDATA/PG_VERSION" ]; then
  su -s /bin/sh postgres -c "initdb -D $PGDATA -E UTF8"
  echo "host all all 0.0.0.0/0 trust" >> "$PGDATA/pg_hba.conf"
  echo "listen_addresses = '*'" >> "$PGDATA/postgresql.conf"
fi
su -s /bin/sh postgres -c "pg_ctl -D $PGDATA -l $PGDATA/logfile start"
sleep 2
su -s /bin/sh postgres -c 'createdb earnxpress' || true
su -s /bin/sh postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD 'postgres';\"" || true
echo "POSTGRES_READY"
