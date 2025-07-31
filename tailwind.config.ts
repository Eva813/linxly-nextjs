import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: ["class"],
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			backgroundImage: {
				'auth-dark-gradient': "radial-gradient(circle at center,  rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 20, 0.9) 50%, rgba(0, 0, 50, 0.8) 100%)",
			},
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
				"slide-in-right": {
					"0%": { transform: "translateX(100%)" },
					"100%": { transform: "translateX(0)" },
				},
				"slide-out-right": {
					"0%": { transform: "translateX(0)" },
					"100%": { transform: "translateX(100%)" },
				},
				"progress-sm": {
					"0%": { width: "0%", opacity: "1" },
					"80%": { width: "100%", opacity: "1" },
					"100%": { width: "100%", opacity: "0" },
				},
				"progress-md": {
					"0%": { width: "0%", opacity: "1" },
					"80%": { width: "100%", opacity: "1" },
					"100%": { width: "100%", opacity: "0" },
				},
				"slow-bounce": {
					'0%, 100%': { transform: 'translateY(-25%)', 'animation-timing-function': 'cubic-bezier(0.8, 0, 1, 1)' },
					'50%': { transform: 'translateY(0)', 'animation-timing-function': 'cubic-bezier(0, 0, 0.2, 1)' },
					// "0%": {
					// 	transform: "translateY(0)"
					// },
					// "25%": {
					// 	transform: "translateY(-12px)"
					// },
					// "50%": {
					// 	transform: "translateY(0)"
					// },
					// "75%": {
					// 	transform: "translateY(-6px)"
					// },
					// "100%": {
					// 	transform: "translateY(0)"
					// }
				},
			},
			animation: {
				highlight: 'highlight 2s ease-out forwards',
				"pulse-strong": 'pulse-strong 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				"swing-left": "swing-left 1.5s ease-in-out",
				"swing-right": "swing-right 1.5s ease-in-out",
				"slide-in-right": "slide-in-right 0.3s ease-out forwards",
				"slide-out-right": "slide-out-right 0.3s ease-out forwards",
				"progress-sm": "progress-sm 0.8s ease-in-out forwards",
				"progress-md": "progress-md 1.2s ease-in-out forwards",
				"slow-bounce": "slow-bounce 1.5s ease-in-out infinite",
			}
		},
		variants: {
			extend: {
				borderColor: ['focus'],
				boxShadow: ['focus']
			}
		},
	},
	plugins: [],
} satisfies Config;

export default config;
