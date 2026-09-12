export const CATEGORY_COLORS: Record<string, string> = {
  All: "#000000",
  Books: "#4D7CFE",
  Electronics: "#FFDE59",
  Furniture: "#FF6B9D",
  Cycles: "#FF6B35",
  Clothing: "#A78BFA",
  Sports: "#00D9A5",
  Other: "#B9FF66",
};

export const CATEGORIES = [
  "All",
  "Books",
  "Electronics",
  "Furniture",
  "Cycles",
  "Clothing",
  "Sports",
  "Other",
] as const;

export function categoryBg(category: string): string {
  return CATEGORY_COLORS[category] ?? "#FFFFFF";
}

export function categoryTextOn(bg: string): string {
  return bg === "#000000" || bg === "#4D7CFE" ? "#FFFFFF" : "#000000";
}
