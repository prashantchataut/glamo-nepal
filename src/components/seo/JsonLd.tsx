function sanitizeJsonLd(json: string): string {
  return json
    .replace(/</g, "\\u003c")
    .replace(/]]>/g, "\\u005d\\u005d\\u003e")
    .replace(/-->/g, "\\u002d\\u002d\\u003e");
}

export function JsonLd({ data, nonce }: { data: Record<string, unknown> | Record<string, unknown>[]; nonce?: string }) {
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(JSON.stringify(data)) }}
    />
  );
}