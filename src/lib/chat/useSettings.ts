import { useEffect, useState } from "react";
import type { Settings } from "./types";
import { DEFAULT_SETTINGS } from "./providers";
import { loadSettings, saveSettings } from "./storage";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setHydrated(true);
  }, []);

  const update = (next: Settings) => {
    setSettings(next);
    saveSettings(next);
  };

  return { settings, update, hydrated };
}
