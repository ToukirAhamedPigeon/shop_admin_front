// src/modules/settings/app-settings/components/SettingsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { SettingsSidebar } from './SettingsSidebar';
import { SettingsContent } from './SettingsContent';
import { fetchSettings } from '@/redux/slices/settingsSlice';
import { setTheme } from '@/redux/slices/themeSlice';
import { useSettings } from '@/hooks/useSettings';
import type { AppDispatch } from '@/redux/store';
import ConfirmDialog from '@/components/custom/ConfirmDialog';
import { useAppSelector } from '@/hooks/useRedux';

export const SettingsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [activeCategory, setActiveCategory] = useState('Theme');
  const [dirty, setDirty] = useState(false);
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);

  // Switching category drops unsaved edits, so ask first.
  const selectCategory = (key: string) => {
    if (key === activeCategory) return;
    if (dirty) setPendingCategory(key);
    else setActiveCategory(key);
  };
  const handleDirtyChange = useCallback((value: boolean) => setDirty(value), []);
  const { data, loading } = useAppSelector((state) => state.settings);

  const user = useAppSelector((state) => state.auth.user);
  
  const isDeveloper = user?.roles?.some(role => 
    role.toLowerCase() === 'developer'
  ) ?? false;

  const {
    updateThemeSettings,
    updateGeneralSettings,
    updateBrandingSettings,
    resetThemeSettings,
    resetGeneralSettings
  } = useSettings();

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  // These functions now handle FormData with files
  const handleUpdateTheme = async (settings: any) => {
    // settings will contain SidebarBgFile and LoginBgFile as File objects
    await updateThemeSettings(settings);
    // Saving dark mode here is an explicit choice: apply it now, like the header toggle.
    if (typeof settings?.dark_mode === 'boolean') dispatch(setTheme(settings.dark_mode ? 'dark' : 'light'));
  };

  const handleUpdateGeneral = async (settings: any) => {
    await updateGeneralSettings(settings);
  };

  const handleUpdateBranding = async (settings: any) => {
    // settings will contain LogoFile and FaviconFile as File objects
    await updateBrandingSettings(settings);
  };

  const handleResetTheme = async () => {
    await resetThemeSettings();
  };

  const handleResetGeneral = async () => {
    await resetGeneralSettings();
  };

  useEffect(() => {
    if (activeCategory === 'Branding' && !isDeveloper) {
      setActiveCategory('Theme');
    }
  }, [activeCategory, isDeveloper]);

  const shell = 'flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs md:h-[calc(100vh-12rem)] md:min-h-[560px] md:flex-row';

  if (loading && !data) {
    return (
      <div className={shell} aria-busy>
        <div className="hidden w-64 shrink-0 space-y-2 border-r border-border p-3 md:block">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex animate-pulse items-start gap-2.5 rounded-lg px-3 py-2.5">
              <div className="size-7 rounded-md bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-2/3 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1 animate-pulse space-y-5 bg-background p-6">
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-4 w-72 rounded bg-muted" />
          <div className="h-48 rounded-xl bg-muted/70" />
          <div className="h-24 rounded-xl bg-muted/70" />
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className="shrink-0 md:h-full">
        <SettingsSidebar
          activeCategory={activeCategory}
          onSelect={selectCategory}
          isDeveloper={isDeveloper}
          dirtyCategory={dirty ? activeCategory : null}
        />
      </div>

      <div className="min-w-0 flex-1 overflow-hidden bg-background">
        <SettingsContent
          key={activeCategory}
          onDirtyChange={handleDirtyChange}
          category={activeCategory}
          data={data}
          loading={loading}
          isDeveloper={isDeveloper}
          onUpdateTheme={handleUpdateTheme}
          onUpdateGeneral={handleUpdateGeneral}
          onUpdateBranding={handleUpdateBranding}
          onResetTheme={handleResetTheme}
          onResetGeneral={handleResetGeneral}
        />
      </div>

      <ConfirmDialog
        open={pendingCategory !== null}
        onCancel={() => setPendingCategory(null)}
        onConfirm={() => {
          if (pendingCategory) setActiveCategory(pendingCategory);
          setPendingCategory(null);
          setDirty(false);
        }}
        title="Discard unsaved changes?"
        variant="warning"
        confirmLabel="Discard and switch"
      >
        <p>Your edits on this page haven't been saved. Switching will throw them away.</p>
      </ConfirmDialog>
    </div>
  );
};