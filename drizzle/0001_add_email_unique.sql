-- drizzle/0001_add_email_unique.sql
-- Migration: Add UNIQUE constraint on clients.email.
-- Existing databases may contain duplicate emails, so we dedupe first
-- (keep the row with the lowest created_at) before adding the constraint.

-- Step 1: Remove duplicate emails, keeping only the oldest row for each email.
DELETE FROM clients
WHERE rowid NOT IN (
  SELECT MIN(rowid)
  FROM clients
  WHERE email IS NOT NULL
  GROUP BY email
);

-- Step 2: Drop the old non-unique index on email (if it exists).
DROP INDEX IF EXISTS idx_clients_email;

-- Step 3: Create the UNIQUE index on email (matches the schema.ts definition).
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_email_unique ON clients (email);
