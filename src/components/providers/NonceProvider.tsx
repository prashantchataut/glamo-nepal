import { headers } from "next/headers";

export async function getNonce(): Promise<string | undefined> {
  const headersList = await headers();
  return headersList.get("x-nonce") ?? undefined;
}

export function createNonceScript(nonce: string | undefined, content: string): string {
  if (nonce) {
    return content;
  }
  return content;
}