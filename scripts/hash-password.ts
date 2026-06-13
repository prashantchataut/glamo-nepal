import { hash } from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("Usage: npx tsx scripts/hash-password.ts <password>");
  console.error("       node --import tsx scripts/hash-password.ts <password>");
  process.exit(1);
}

hash(password, 12)
  .then((hashed) => {
    console.log("Add this to your .env.local:");
    console.log(`ADMIN_PASSWORD_HASH=${hashed}`);
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });