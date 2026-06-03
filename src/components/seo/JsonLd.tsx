function sanitizeJsonLd(json: string): string {
  return json
    .replace(/</g, "\\u003c")
    .replace(/]]>/g, "\\u005d\\u005d\\u003e")
    .replace(/-->/g, "\\u002d\\u002d\\u003e");
}

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(JSON.stringify(data)) }}
    />
  );
}
