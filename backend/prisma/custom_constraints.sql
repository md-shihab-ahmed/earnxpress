ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "chk_task_slots_valid";
ALTER TABLE "Task" ADD CONSTRAINT "chk_task_slots_valid" 
CHECK ("availableSlots" >= 0 AND "availableSlots" <= "totalSlots" AND "totalSlots" > 0);

ALTER TABLE "DemoLedgerAccount" DROP CONSTRAINT IF EXISTS "chk_demo_balance_non_negative";
ALTER TABLE "DemoLedgerAccount" ADD CONSTRAINT "chk_demo_balance_non_negative" 
CHECK ("balanceCents" >= 0 OR "accountType" IN ('DEMO_SYSTEM_FAUCET_POOL', 'DEMO_SYSTEM_REVENUE'));

CREATE OR REPLACE FUNCTION enforce_audit_immutability()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable. UPDATE and DELETE operations are forbidden.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON "AuditLog";
CREATE TRIGGER trg_audit_logs_immutable
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION enforce_audit_immutability();
