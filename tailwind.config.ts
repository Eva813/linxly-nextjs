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
				background: 'hsl(var(--background))',
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
					DEFAULT: '#cad5f0',
				},
				light: {
					DEFAULT: '#edf1fa',
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
			}
		},
		variants: {
			extend: {
				borderColor: ['focus'],
				boxShadow: ['focus']
			}
		}
	},
	plugins: [tailwindAnimate],
};
export default config;
