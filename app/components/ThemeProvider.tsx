"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react"

export type Theme = "light" | "dark" | "system"
export type ResolvedTheme = "light" | "dark"

const STORAGE_KEY = "itsm-theme"
const STORAGE_EVENT = "itsm-theme-change"

interface ThemeContextValue {
   /** What the user chose (may be "system"). */
   theme: Theme
   /** What is actually applied right now. */
   resolvedTheme: ResolvedTheme
   setTheme: (theme: Theme) => void
   /** Advances system -> light -> dark -> system. */
   cycleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/*
 * Theme lives in localStorage + the OS media query, i.e. genuinely external
 * state. `useSyncExternalStore` subscribes to both instead of syncing with a
 * setState-in-effect, and gives us cross-tab sync via the `storage` event.
 *
 * Both snapshots return primitives, so they are stable for Object.is — which
 * is what keeps useSyncExternalStore from looping.
 */

function subscribeTheme(onStoreChange: () => void) {
   window.addEventListener(STORAGE_EVENT, onStoreChange)
   window.addEventListener("storage", onStoreChange) // other tabs
   return () => {
      window.removeEventListener(STORAGE_EVENT, onStoreChange)
      window.removeEventListener("storage", onStoreChange)
   }
}

function getThemeSnapshot(): Theme {
   try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored === "light" || stored === "dark" || stored === "system") return stored
   } catch {
      // Private mode / storage disabled.
   }
   return "system"
}

function getThemeServerSnapshot(): Theme {
   return "system"
}

function subscribeSystem(onStoreChange: () => void) {
   const media = window.matchMedia("(prefers-color-scheme: dark)")
   media.addEventListener("change", onStoreChange)
   return () => media.removeEventListener("change", onStoreChange)
}

function getSystemSnapshot(): boolean {
   return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function getSystemServerSnapshot(): boolean {
   return false
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
   const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot)
   const systemPrefersDark = useSyncExternalStore(subscribeSystem, getSystemSnapshot, getSystemServerSnapshot)

   const resolvedTheme: ResolvedTheme = theme === "system" ? (systemPrefersDark ? "dark" : "light") : theme

   // Sync the DOM only — no React state involved.
   useEffect(() => {
      const root = document.documentElement
      root.classList.toggle("dark", resolvedTheme === "dark")
      root.style.colorScheme = resolvedTheme
   }, [resolvedTheme])

   const setTheme = useCallback((next: Theme) => {
      try {
         window.localStorage.setItem(STORAGE_KEY, next)
      } catch {
         // Ignore storage failures; the theme still applies for this session.
      }
      window.dispatchEvent(new Event(STORAGE_EVENT))
   }, [])

   const cycleTheme = useCallback(() => {
      setTheme(theme === "system" ? "light" : theme === "light" ? "dark" : "system")
   }, [theme, setTheme])

   const value = useMemo(
      () => ({ theme, resolvedTheme, setTheme, cycleTheme }),
      [theme, resolvedTheme, setTheme, cycleTheme],
   )

   return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
   const ctx = useContext(ThemeContext)
   if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>")
   return ctx
}

/**
 * Blocking script injected before paint so a dark-mode visitor never sees a
 * white flash. Keep STORAGE_KEY and this string in sync.
 */
export const themeInitScript = `
(function(){
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var dark = stored === 'dark' || (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {}
})();
`
