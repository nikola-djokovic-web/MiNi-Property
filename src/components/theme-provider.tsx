"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"
import { generateThemeCss, THEME_STORAGE_KEY, themePresets } from "@/lib/theme-presets"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  React.useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    const theme = themePresets.find((preset) => preset.name === savedTheme) ?? themePresets[0]
    let styleSheet = document.getElementById("dynamic-theme-styles")

    if (!styleSheet) {
      styleSheet = document.createElement("style")
      styleSheet.id = "dynamic-theme-styles"
      document.head.appendChild(styleSheet)
    }

    styleSheet.textContent = generateThemeCss(theme)
  }, [])

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
