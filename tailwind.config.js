/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    // Disable Preflight to prevent conflicts with PrimeFlex grid
    corePlugins: {
        preflight: false,
    },
    theme: {
        extend: {
            colors: {
                coffee: {
                    50: '#FDFBF7',
                    100: '#FFF8E1',
                    200: '#F5F0EB',
                    300: '#F0EBE3',
                    400: '#D7CCC8',
                    500: '#BCAAA4',
                    600: '#A1887F',
                    700: '#795548',
                    800: '#5D4037',
                    900: '#3E2723',
                    gold: '#DAA520',
                }
            },
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
