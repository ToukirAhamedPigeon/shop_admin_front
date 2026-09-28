// src/modules/mail/components/mailFormat.ts

export { initialsOf } from '@/lib/initials';

/** Plain text of an HTML body. DOMParser builds an inert document: no scripts run. */
export const htmlToText = (html: string) => {
  // Space after block ends and <br> so "<p>Hi</p><p>There</p>" reads "Hi There".
  const spaced = (html || '').replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|tr|blockquote)>/gi, '$& ');
  return (new DOMParser().parseFromString(spaced, 'text/html').body.textContent || '').replace(/\s+/g, ' ').trim();
};
