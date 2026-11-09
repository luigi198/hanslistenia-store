// Generates admin login credentials: a strong random password, its argon2id
// hash and a session signing secret. Run: npm run admin:credentials <username>
// Imports use explicit .ts paths because Node runs this file directly. The npm
// script disables MODULE_TYPELESS_PACKAGE_JSON: Node only warns that it reparses
// the imported src/*.ts files as ESM, which is expected and harmless here.
import { generatePassword, hashPassword } from "../src/domain/auth/password.ts";
import { generateSessionSecret } from "../src/domain/auth/session-token.ts";

const EXIT_USAGE = 64; // EX_USAGE from sysexits.h

const username = process.argv[2]?.trim().toLowerCase();
if (!username) {
  process.stderr.write("Usage: npm run admin:credentials <username>\n");
  process.exit(EXIT_USAGE);
}

const password = generatePassword();
const passwordHash = await hashPassword(password);

process.stdout.write(`
1) Put these in .env.local and in Vercel (Project → Settings → Environment
   Variables), then redeploy:

ADMIN_USERNAME=${username}
ADMIN_PASSWORD_HASH=${passwordHash}
SESSION_SECRET=${generateSessionSecret()}

2) Give this password to the admin over a different channel than the
   username. It is not stored anywhere — if lost, run this script again.

Password: ${password}

Running this again replaces the credentials: the old password stops working
and changing SESSION_SECRET signs out every open session.
`);
