export class ThemeService {
    static applyTheme(theme: string) {
        const root = document.documentElement;

        // ☕ "The Stock" Coffee / Latte Light Theme
        root.style.setProperty('--surface-ground', '#FDFBF7');   // Warm Cream Background
        root.style.setProperty('--surface-card', '#FFFFFF');      // White Cards
        root.style.setProperty('--surface-border', '#F0EBE3');    // Light Coffee Border
        root.style.setProperty('--surface-hover', '#FFF3E0');     // Warm Hover
        root.style.setProperty('--text-color', '#3E2723');        // Dark Coffee Brown
        root.style.setProperty('--text-color-secondary', '#795548'); // Medium Brown

        // Highlight / Focus
        root.style.setProperty('--highlight-bg', '#FFF8E1');
        root.style.setProperty('--highlight-text-color', '#5D4037');
        root.style.setProperty('--focus-ring', '0 0 0 2px #FDFBF7, 0 0 0 4px #DAA520');

        switch (theme) {
            case 'stock':
                root.style.setProperty('--p-primary-500', '#1b4d3e');
                root.style.setProperty('--p-primary-color', '#1b4d3e');
                root.style.setProperty('--primary-color', '#1b4d3e');
                root.style.setProperty('--primary-color-text', '#FFFFFF');
                break;

            case 'starbucks':
                root.style.setProperty('--p-primary-500', '#00704A');
                root.style.setProperty('--p-primary-color', '#00704A');
                root.style.setProperty('--primary-color', '#00704A');
                root.style.setProperty('--primary-color-text', '#FFFFFF');
                break;

            case 'counpaign':
            default:
                root.style.setProperty('--p-primary-500', '#DAA520');
                root.style.setProperty('--p-primary-color', '#DAA520');
                root.style.setProperty('--primary-color', '#DAA520');
                root.style.setProperty('--primary-100', 'rgba(218, 165, 32, 0.1)');
                root.style.setProperty('--primary-color-text', '#FFFFFF');
                break;
        }

        // Expose utility colors (adjusted for Coffee theme)
        root.style.setProperty('--brand-red', '#EE2C2C');
        root.style.setProperty('--brand-indigo', '#6366F1');
        root.style.setProperty('--brand-teal', '#009688');
    }
}
