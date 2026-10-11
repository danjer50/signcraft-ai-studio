-- Local test fixture: one active admin account, applied by `npm run test:server`
-- to wrangler's LOCAL D1 state only. The values are TEST-ONLY and match the
-- deterministic secrets written to .dev.vars by scripts/test-env.mjs:
--   email     admin@studio.test
--   password  StudioTest!Passw0rd
--
-- password_hash = sha256hex(base64url(PBKDF2-SHA256(password, salt, 600000)) + "." + pepper)
-- with salt a1b2c3d4e5f60718293a4b5c6d7e8f90 and pepper test-only-pepper-9f8e7d6c5b4a.
-- Recompute with Node if the password, salt or pepper ever change:
--   node -e "const {pbkdf2Sync,createHash}=require('node:crypto');const p='StudioTest!Passw0rd',s='a1b2c3d4e5f60718293a4b5c6d7e8f90',pepper='test-only-pepper-9f8e7d6c5b4a';const ch=pbkdf2Sync(Buffer.from(p.normalize('NFKC'),'utf8'),Buffer.from(s,'hex'),600000,32,'sha256').toString('base64url');console.log(createHash('sha256').update(ch+'.'+pepper,'utf8').digest('hex'))"
INSERT INTO accounts (id, email, role, status, salt, password_hash, created_at, updated_at, last_login_at)
VALUES (
  'seed-admin-0001',
  'admin@studio.test',
  'admin',
  'active',
  'a1b2c3d4e5f60718293a4b5c6d7e8f90',
  '17af9a6dd38ccb34908ef80445ead6f5711517ba79026b026e820ff74f369299',
  '2026-01-01T00:00:00.000Z',
  '2026-01-01T00:00:00.000Z',
  NULL
);
