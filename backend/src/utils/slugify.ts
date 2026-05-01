export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateUniqueSlug(
  base: string,
  existing: string[] = []
): string {
  let slug = slugify(base);
  if (!existing.includes(slug)) return slug;

  let counter = 1;
  while (existing.includes(`${slug}-${counter}`)) {
    counter++;
  }
  return `${slug}-${counter}`;
}