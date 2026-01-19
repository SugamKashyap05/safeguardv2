/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#4F46E5", // Indigo 600
                secondary: "#EC4899", // Pink 500 - Kid friendly
                background: "#F3F4F6", // Gray 100
                surface: "#FFFFFF",
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
