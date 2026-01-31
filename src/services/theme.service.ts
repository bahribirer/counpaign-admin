export class ThemeService {
    static applyTheme(theme: string) {
        const root = document.documentElement;

        // Mobil App Design Tokens (Zinc + Brand Red)
        root.style.setProperty('--surface-ground', '#09090B'); // Dark Background
        root.style.setProperty('--surface-card', '#18181B');   // Dark Surface
        root.style.setProperty('--surface-border', '#27272A'); // Zinc 800
        root.style.setProperty('--text-color', '#FFFFFF');     // Pure White
        root.style.setProperty('--text-color-secondary', '#A1A1AA'); // Zinc 400

        const brandRed = '#EE2C2C';
        const brandIndigo = '#6366F1';
        const brandTeal = '#009688';

        switch (theme) {
            case 'stock':
                root.style.setProperty('--p-primary-500', '#1b4d3e');
                root.style.setProperty('--p-primary-color', '#1b4d3e');
                root.style.setProperty('--primary-color', '#1b4d3e');
                break;

            case 'starbucks':
                root.style.setProperty('--p-primary-500', '#00704A');
                root.style.setProperty('--p-primary-color', '#00704A');
                root.style.setProperty('--primary-color', '#00704A');
                break;

            case 'counpaign':
            default:
                root.style.setProperty('--p-primary-500', brandRed);
                root.style.setProperty('--p-primary-color', brandRed);
                root.style.setProperty('--primary-color', brandRed);
                root.style.setProperty('--primary-100', 'rgba(238, 44, 44, 0.1)');
                root.style.setProperty('--primary-color-text', '#ffffff');
                break;
        }

        // Expose utility colors
        root.style.setProperty('--brand-red', brandRed);
        root.style.setProperty('--brand-indigo', brandIndigo);
        root.style.setProperty('--brand-teal', brandTeal);
    }
}
