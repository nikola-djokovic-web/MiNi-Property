import type { Config } from 'tailwindcss';

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [255 * f(0), 255 * f(8), 255 * f(4)];
}

// Helper to convert HSL string to RGB values for Tailwind
function withPrimaryRgb(config: Config) {
    const primaryHsl = 'var(--primary)'; // e.g., "221.2 83.2% 53.3%"
    const match = primaryHsl.match(/(\d+(\.\d+)?)\s+(\d+(\.\d+)?)%\s+(\d+(\.\d+)?)%/);

    if (config.theme?.extend?.colors) {
      const primaryColor = config.theme.extend.colors.primary;
      if (typeof primaryColor === 'object' && primaryColor !== null && 'DEFAULT' in primaryColor) {
        const hslString = primaryColor.DEFAULT;
        const hslMatch = hslString.match(/hsl\((\d+(\.\d+)?)\s(\d+(\.\d+)?)%\s(\d+(\.\d+)?)%\)/);

        if (hslMatch) {
            const [h, s, l] = [parseFloat(hslMatch[1]), parseFloat(hslMatch[3]), parseFloat(hslMatch[5])];
            const [r, g, b] = hslToRgb(h, s, l);
            
            if (!config.theme.extend.colors) {
                config.theme.extend.colors = {};
            }
             // @ts-ignore
             config.theme.extend.colors.primary.rgb = `${r} ${g} ${b}`;
        }
      }
    }
    return config;
}

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          // @ts-ignore
          rgb: 'var(--primary-rgb)'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        yellow: {
          '500': '#f59e0b',
          foreground: '#ffffff',
        },
        green: {
          '600': '#16a34a',
          foreground: '#ffffff',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('tailwindcss-debug-screens')],
} satisfies Config;
