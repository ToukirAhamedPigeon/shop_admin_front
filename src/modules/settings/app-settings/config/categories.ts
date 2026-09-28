// src/modules/settings/app-settings/config/categories.ts
export const CATEGORY_CONFIG = {
  Theme: {
    displayName: 'Theme & Appearance',
    icon: 'PaintBucket',
    description: 'Colours, images and the look of the app',
    order: 1,
    isUserSpecific: true,
  },
  Branding: {
    displayName: 'Branding',
    icon: 'Tag',
    description: 'Name, logo, favicon and footer (Developer only)',
    order: 2,
    isUserSpecific: false,
  },
  General: {
    displayName: 'General',
    icon: 'Settings',
    description: 'Language, time zone and formats',
    order: 3,
    isUserSpecific: true,
  },
};

export const CATEGORY_ORDER = ['Theme', 'Branding', 'General'];
