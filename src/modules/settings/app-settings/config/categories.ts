// D:\shop\shop_admin_front\src\modules\settings\app-settings\config\categories.ts
export const CATEGORY_CONFIG = {
  Theme: {
    displayName: 'Theme & Appearance',
    icon: 'PaintBucket',
    description: 'Customize the look and feel of your application',
    order: 1,
    isUserSpecific: true
  },
  Branding: {
    displayName: 'Branding',
    icon: 'Tag',
    description: 'Configure your brand identity (Global - Developer only)',
    order: 2,
    isUserSpecific: false
  },
  General: {
    displayName: 'General',
    icon: 'Settings',
    description: 'Configure general application settings',
    order: 3,
    isUserSpecific: true
  }
};

export const CATEGORY_ORDER = ['Theme', 'Branding', 'General'];