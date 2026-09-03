
'use client';

import { useEffect, useState } from 'react';
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
import { useTranslation } from '@/hooks/use-translation';
import {
  generateThemeCss,
  THEME_STORAGE_KEY,
  themePresets,
  type ThemePreset,
} from '@/lib/theme-presets';

const fontPresets = [
  { name: 'Inter', variable: 'var(--font-sans)', className: 'font-sans' },
  { name: 'Lora', variable: 'var(--font-serif)', className: 'font-serif' },
  { name: 'Roboto Mono', variable: 'var(--font-mono)', className: 'font-mono' },
  { name: 'Playfair Display', variable: 'var(--font-playfair)', className: 'font-playfair' },
  { name: 'Oswald', variable: 'var(--font-oswald)', className: 'font-oswald' },
  { name: 'Lato', variable: 'var(--font-lato)', className: 'font-lato' },
];

export default function ThemePage() {
  const { toast } = useToast();
  const { dict } = useTranslation();
  const [selectedTheme, setSelectedTheme] = useState(themePresets[0].name);
  const [selectedFont, setSelectedFont] = useState(fontPresets[0].name);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme) setSelectedTheme(savedTheme);
  }, []);

  const applyTheme = (theme: ThemePreset) => {
    const themeCss = generateThemeCss(theme);
    
    let styleSheet = document.getElementById('dynamic-theme-styles');
    if (!styleSheet) {
        styleSheet = document.createElement('style');
        styleSheet.id = 'dynamic-theme-styles';
        document.head.appendChild(styleSheet);
    }
    styleSheet.innerHTML = themeCss;
    localStorage.setItem(THEME_STORAGE_KEY, theme.name);

    setSelectedTheme(theme.name);
    toast({
      title: (dict?.settings?.theme?.themeApplied || "{name} Theme Applied!").replace("{name}", theme.name),
      description: dict?.settings?.theme?.themeAppliedDescription || 'Your new color scheme has been activated.',
    });
  };

  const applyFont = (font: typeof fontPresets[0]) => {
    // We need to set the font family on the body, not the html element
    document.body.style.fontFamily = font.variable;
    setSelectedFont(font.name);
    toast({
      title: (dict?.settings?.theme?.fontApplied || "{name} Font Applied!").replace("{name}", font.name),
      description: dict?.settings?.theme?.fontAppliedDescription || 'The application font has been updated.',
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dict?.settings?.theme?.title || "Customize Theme"}</CardTitle>
        <CardDescription>
          {dict?.settings?.theme?.description || "Personalize the look and feel of your application."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
            <h3 className="text-lg font-medium mb-4">{dict?.settings?.theme?.colorScheme || "Color Scheme"}</h3>
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
            <h3 className="text-lg font-medium mb-4">{dict?.settings?.theme?.typography || "Typography"}</h3>
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
                                    {dict?.settings?.theme?.pangram || "The quick brown fox jumps over the lazy dog."}
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
