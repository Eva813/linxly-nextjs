import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate";


const config: Config = {
	darkMode: ["class"],
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			container: {
				center: true,
				padding: {
					DEFAULT: '1rem',
					sm: '2rem',
					lg: '4rem',
					xl: '5rem',
					'2xl': '6rem',
				},
				screens: {
					sm: '640px',
					md: '768px',
					lg: '1024px',
					xl: '1280px',
					'2xl': '1536px',
				},
			},
			colors: {
				background: 'var(--background)',
				foreground: 'hsl(var(--foreground))',
				inputFocus: '#fff',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: {
					DEFAULT: 'var(--primary)',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'var(--secondary)',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				third: {
					DEFAULT: 'var(--third)',
				},
				light: {
					DEFAULT: 'var(--light)'
				},
				muted: {
					DEFAULT: 'var(--muted)',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'var(--accent)',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'var(--secondary)',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				},
				'flow-dark': '#2B2B2B',
				'flow-darker': '#1e1e1e',
				'flow-border': '#333333',
				'flow-dark-hover': '#3E3E3E',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				highlight: {
					'0%': { backgroundColor: '#edf1fa' },
					'100%': { backgroundColor: 'transparent' },
				},
				"pulse-strong": {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.5' },
				},
				spin: {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' },
				},
				"swing-left": {
					"0%": { transform: "rotate(-15deg)" },
					"50%": { transform: "rotate(-25deg)" },
					"100%": { transform: "rotate(-15deg)" },
				},
				"swing-right": {
					"0%": { transform: "rotate(5deg)" },
					"50%": { transform: "rotate(-5deg)" },
					"100%": { transform: "rotate(5deg)" },
				},
			}
		},
		variants: {
			extend: {
				borderColor: ['focus'],
				boxShadow: ['focus']
			}
		},
		animation: {
			highlight: 'highlight 2s ease-out forwards', // 動畫持續時間和效果
			"pulse-strong": 'pulse-strong 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
			spin: 'spin 1s linear infinite',
			"swing-left": "swing-left 1.5s ease-in-out",
			"swing-right": "swing-right 1.5s ease-in-out",
		}
	},
	plugins: [tailwindAnimate],
};
export default config;
