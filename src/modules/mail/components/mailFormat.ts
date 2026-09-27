// src/modules/mail/components/mailFormat.ts

/** Two letters for an avatar, from the local part of an address. */
export const initialsOf = (address: string) => {
  const name = address.split('@')[0].replace(/[._-]+/g, ' ').trim();
  const parts = name.split(' ').filter(Boolean);
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase();
};
