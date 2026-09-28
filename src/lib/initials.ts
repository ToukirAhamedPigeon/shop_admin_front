// src/lib/initials.ts
/** Two letters for an avatar: "Toukir Ahamed" → "TA", "rahim.uddin@x.com" → "RU". */
export const initialsOf = (nameOrAddress: string) => {
  const name = (nameOrAddress || '').split('@')[0].replace(/[._-]+/g, ' ').trim();
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase();
};
