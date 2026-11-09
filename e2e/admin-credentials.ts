// Fixed, non-secret credentials used only by the E2E server.
// Regenerate the hash with: node -e "import('./src/domain/auth/password.ts')
//   .then(m => m.hashPassword('<password>')).then(console.log)"
export const E2E_ADMIN = {
  username: "admin-e2e",
  password: "e2e-admin-password-not-secret",
  passwordHash:
    "argon2id:v=19:m=19456,t=2,p=1:XTnFyPOfYRqGqRhNFi3M0A:ZuUgLTND3Us1V_4PRdHnJeGTRRSuYiTh7uzTSVaiJ0Y",
};
