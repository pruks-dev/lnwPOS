/** @type {import('tailwindcss').Config} */
export default {
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'./node_modules/.svelte-kit/**/*.{html,js,svelte,ts}'
	],
	theme: {
		extend: {
			colors: {
				bitcoin: '#f7931a',
				lnwblue: '#00a3e0'
			}
		}
	},
	plugins: []
};