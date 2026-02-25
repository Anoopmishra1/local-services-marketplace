/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
        extend: {
            colors: {
                primary: { DEFAULT: '#6C63FF', light: '#EDE9FE', dark: '#4F46E5' },
                success: '#10B981',
                warning: '#F59E0B',
                danger: '#EF4444',
                info: '#3B82F6',
            },
        },
    },
    plugins: [],
};
