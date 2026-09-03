export type ThemeColors = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
};

export type ThemePreset = {
  name: string;
  light: Partial<ThemeColors>;
  dark: Partial<ThemeColors>;
};

export const THEME_STORAGE_KEY = 'mini-property-theme';

export const themePresets: ThemePreset[] = [
  {
    name: 'MiNi Purple',
    light: {
      background: '0 0% 100%',
      primary: '262.1 83.3% 57.8%',
      accent: '270 95.2% 92.2%',
    },
    dark: {
      background: '222.2 84% 4.9%',
      primary: '263.4 70% 65%',
      accent: '262.1 40% 22%',
    },
  },
  {
    name: 'Forest',
    light: {
      background: '120 10% 98%',
      primary: '142.1 76.2% 36.3%',
      accent: '140 30% 94%',
    },
    dark: {
      background: '140 25% 9%',
      primary: '142.1 70.2% 45.3%',
      accent: '140 20% 15%',
    },
  },
  {
    name: 'Sunset',
    light: {
      background: '30 50% 98%',
      primary: '24.6 95% 53.1%',
      accent: '30 90% 95%',
    },
    dark: {
      background: '20 20% 8%',
      primary: '24.6 95% 53.1%',
      accent: '20 25% 14%',
    },
  },
  {
    name: 'Ocean',
    light: {
      background: '200 20% 98%',
      primary: '205.1 100% 39.4%',
      accent: '200 40% 95%',
    },
    dark: {
      background: '205 30% 10%',
      primary: '205.1 90% 50.4%',
      accent: '205 25% 16%',
    },
  },
  {
    name: 'Ruby',
    light: {
      background: '350 80% 98%',
      primary: '346.8 77.2% 49.8%',
      accent: '350 90% 95%',
    },
    dark: {
      background: '350 40% 10%',
      primary: '346.8 77.2% 49.8%',
      accent: '350 30% 16%',
    },
  },
  {
    name: 'Lime',
    light: {
      background: '70 20% 98%',
      primary: '70 89% 54%',
      accent: '70 90% 95%',
    },
    dark: {
      background: '70 30% 7%',
      primary: '70 89% 54%',
      accent: '70 40% 12%',
    },
  },
];

export function generateThemeCss(theme: ThemePreset) {
  const lightCss = Object.entries(theme.light)
    .map(([key, value]) => `--${key}: ${value};`)
    .join('\n');
  const darkCss = Object.entries(theme.dark)
    .map(([key, value]) => `--${key}: ${value};`)
    .join('\n');

  return `
    :root {
      ${lightCss}
    }
    .dark {
      ${darkCss}
    }
  `;
}
