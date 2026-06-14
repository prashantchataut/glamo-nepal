import { hash, compare } from "bcryptjs";

const password = "glamo@admin$";

async function main() {
  const hashed = await hash(password, 12);
  console.log("Hash:", hashed);
  const match = await compare(password, hashed);
  console.log("Verify:", match);
}

main().catch(console.error);