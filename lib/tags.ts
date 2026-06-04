export function normalizeTags(tags: unknown): string[] {
  if (!tags) return [];

  if (Array.isArray(tags)) {
    return tags.map(String).map((tag) => tag.trim()).filter(Boolean);
  }

  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) {
        return parsed.map(String).map((tag) => tag.trim()).filter(Boolean);
      }
    } catch {
      return tags.split(",").map((tag) => tag.trim()).filter(Boolean);
    }
  }

  return [];
}

export function tagsToJson(tags: string | string[] | undefined): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map(String).filter(Boolean);
  return tags.split(",").map((tag) => tag.trim()).filter(Boolean);
}
