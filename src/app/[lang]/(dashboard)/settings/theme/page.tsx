
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

// Simple fallback translations to avoid server-only import issues
const translations = {
  title: "Theme Settings",
  description: "Customize your application appearance and typography",
  colorScheme: "Color Scheme",
  typography: "Typography"
};

type ThemeColors = {
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

type ThemePreset = {
  name: string;
  light: Partial<ThemeColors>;
  dark: Partial<ThemeColors>;
};

const themePresets: ThemePreset[] = [
  {
    name: 'Default',
    light: {
      background: '0 0% 100%',
      primary: '221.2 83.2% 53.3%',
      accent: '210 40% 96.1%',
    },
    dark: {
      background: '222.2 84% 4.9%',
      primary: '217.2 91.2% 59.8%',
      accent: '217.2 32.6% 17.5%',
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
    }
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
      }
  }
];

const fontPresets = [
  { name: 'Inter', variable: 'var(--font-sans)', className: 'font-sans' },
  { name: 'Lora', variable: 'var(--font-serif)', className: 'font-serif' },
  { name: 'Roboto Mono', variable: 'var(--font-mono)', className: 'font-mono' },
  { name: 'Playfair Display', variable: 'var(--font-playfair)', className: 'font-playfair' },
  { name: 'Oswald', variable: 'var(--font-oswald)', className: 'font-oswald' },
  { name: 'Lato', variable: 'var(--font-lato)', className: 'font-lato' },
];

function generateThemeCss(theme: ThemePreset) {
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

export default function ThemePage() {
  const { toast } = useToast();
  const [selectedTheme, setSelectedTheme] = useState(themePresets[0].name);
  const [selectedFont, setSelectedFont] = useState(fontPresets[0].name);

  const applyTheme = (theme: ThemePreset) => {
    const themeCss = generateThemeCss(theme);
    
    let styleSheet = document.getElementById('dynamic-theme-styles');
    if (!styleSheet) {
        styleSheet = document.createElement('style');
        styleSheet.id = 'dynamic-theme-styles';
        document.head.appendChild(styleSheet);
    }
    styleSheet.innerHTML = themeCss;

    setSelectedTheme(theme.name);
    toast({
      title: `${theme.name} Theme Applied!`,
      description: 'Your new color scheme has been activated.',
    });
  };

  const applyFont = (font: typeof fontPresets[0]) => {
    // We need to set the font family on the body, not the html element
    document.body.style.fontFamily = font.variable;
    setSelectedFont(font.name);
    toast({
      title: `${font.name} Font Applied!`,
      description: 'The application font has been updated.',
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{translations.title}</CardTitle>
        <CardDescription>
          {translations.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
            <h3 className="text-lg font-medium mb-4">{translations.colorScheme}</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {themePresets.map((theme) => (
                <button key={theme.name} onClick={() => applyTheme(theme)}>
                <Card
                    className={cn(
                    'cursor-pointer transition-all hover:shadow-lg',
                    selectedTheme === theme.name &&
                        'ring-2 ring-primary ring-offset-2 ring-offset-background'
                    )}
                >
                    <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                        <span>{theme.name}</span>
                        {selectedTheme === theme.name && (
                            <Check className="h-5 w-5 text-primary" />
                        )}
                    </CardTitle>
                    </CardHeader>
                    <CardContent>
                    <div className="flex -space-x-2 overflow-hidden rounded-md">
                        <div
                        className="h-12 w-12 rounded-full border-4 border-background"
                        style={{ backgroundColor: `hsl(${theme.light.primary})` }}
                        />
                        <div
                        className="h-12 w-12 rounded-full border-4 border-background"
                        style={{ backgroundColor: `hsl(${theme.light.accent})` }}
                        />
                        <div
                        className="h-12 w-12 rounded-full border-4 border-background"
                        style={{ backgroundColor: `hsl(${theme.dark.background})` }}
                        />
                    </div>
                    </CardContent>
                </Card>
                </button>
            ))}
            </div>
        </div>

        <Separator />

        <div>
            <h3 className="text-lg font-medium mb-4">{translations.typography}</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {fontPresets.map((font) => (
                    <button key={font.name} onClick={() => applyFont(font)}>
                        <Card
                            className={cn(
                            'cursor-pointer transition-all hover:shadow-lg h-full',
                            selectedFont === font.name &&
                                'ring-2 ring-primary ring-offset-2 ring-offset-background'
                            )}
                        >
                            <CardHeader>
                            <CardTitle className="flex items-center justify-between text-base">
                                <span>{font.name}</span>
                                {selectedFont === font.name && (
                                    <Check className="h-5 w-5 text-primary" />
                                )}
                            </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className={cn("text-lg", font.className)}>
                                    The quick brown fox jumps over the lazy dog.
                                </p>
                            </CardContent>
                        </Card>
                    </button>
                ))}
            </div>
        </div>

      </CardContent>
    </Card>
  );
}
