import fs from "fs";
import path from "node:path";
import { ensureDirectory } from "../../common/fileSystem.js";

const builtInThemes = [
    {
        id: "classic",
        name: "Classic",
        isCustom: false,
        light: {
            "bg-primary": "#ffffff",
            "bg-secondary": "#0f172a",
            "bg-tertiary": "#f3f4f6",
            "text-primary": "#2c3e50",
            "text-secondary": "#4b5563",
            "text-muted": "#94a3b8",
            "text-accent": "#3b83f6",
            "accent-primary": "#3b83f6",
            "accent-error": "#e74c3c",
            "accent-success": "#27ae60",
            "accent-warning": "#f59e0b",
            "card-bg": "#ffffff",
            "card-border": "#e5e7eb",
            "player-bg": "#ffffff",
            "progress-color": "#3b83f6",
            "control-active": "#3b83f6",
            "search-bg": "#ffffff",
            "search-border": "#e5e7eb",
            "btn-primary-bg": "#3b83f6",
            "btn-primary-text": "#ffffff",
            "btn-secondary-bg": "#f3f4f6",
            "btn-secondary-text": "#2c3e50",
            "nav-bg": "#ffffff",
            "nav-active": "#3b83f6",
            "nav-inactive": "#94a3b8"
        },
        dark: {
            "bg-primary": "#171717",
            "bg-secondary": "#05012c",
            "bg-tertiary": "#2e2e2e",
            "text-primary": "#a8b2d1",
            "text-secondary": "#cbd5e1",
            "text-muted": "#94a3b8",
            "text-accent": "#588e97",
            "accent-primary": "#588e97",
            "accent-error": "#f44336",
            "accent-success": "#4CAF50",
            "accent-warning": "#fbbf24",
            "card-bg": "#1a1a1a",
            "card-border": "#2e2e2e",
            "player-bg": "#171717",
            "progress-color": "#588e97",
            "control-active": "#588e97",
            "search-bg": "#1a1a1a",
            "search-border": "#2e2e2e",
            "btn-primary-bg": "#588e97",
            "btn-primary-text": "#ffffff",
            "btn-secondary-bg": "#2e2e2e",
            "btn-secondary-text": "#a8b2d1",
            "nav-bg": "#1a1a1a",
            "nav-active": "#588e97",
            "nav-inactive": "#a8b2d1"
        }
    },
    {
        id: "midnight-blue",
        name: "Midnight Blue",
        isCustom: false,
        light: {
            "bg-primary": "#f5f7fa",
            "bg-secondary": "#eaeef4",
            "bg-tertiary": "#dde3ec",
            "text-primary": "#1e2a3b",
            "text-secondary": "#4a5568",
            "text-muted": "#718096",
            "text-accent": "#2b6cb0",
            "accent-primary": "#3182ce",
            "accent-error": "#e53e3e",
            "accent-success": "#38a169",
            "accent-warning": "#d69e2e",
            "card-bg": "#ffffff",
            "card-border": "#e2e8f0",
            "player-bg": "#edf2f7",
            "progress-color": "#3182ce",
            "control-active": "#3182ce",
            "search-bg": "#f0f4f8",
            "search-border": "#cbd5e0",
            "btn-primary-bg": "#3182ce",
            "btn-primary-text": "#ffffff",
            "btn-secondary-bg": "#e2e8f0",
            "btn-secondary-text": "#2d3748",
            "nav-bg": "#1a2744",
            "nav-active": "#3182ce",
            "nav-inactive": "#718096"
        },
        dark: {
            "bg-primary": "#0f172a",
            "bg-secondary": "#1e293b",
            "bg-tertiary": "#334155",
            "text-primary": "#f8fafc",
            "text-secondary": "#cbd5e1",
            "text-muted": "#94a3b8",
            "text-accent": "#60a5fa",
            "accent-primary": "#3b82f6",
            "accent-error": "#ef4444",
            "accent-success": "#22c55e",
            "accent-warning": "#f59e0b",
            "card-bg": "#1e293b",
            "card-border": "#334155",
            "player-bg": "#0f172a",
            "progress-color": "#3b82f6",
            "control-active": "#60a5fa",
            "search-bg": "#1e293b",
            "search-border": "#334155",
            "btn-primary-bg": "#3b82f6",
            "btn-primary-text": "#ffffff",
            "btn-secondary-bg": "#334155",
            "btn-secondary-text": "#f8fafc",
            "nav-bg": "#0f172a",
            "nav-active": "#3b82f6",
            "nav-inactive": "#64748b"
        }
    },
    {
        id: "forest",
        name: "Forest",
        isCustom: false,
        light: {
            "bg-primary": "#f1f5f2",
            "bg-secondary": "#e5ebe7",
            "bg-tertiary": "#d2dcd6",
            "text-primary": "#1b2d22",
            "text-secondary": "#3e5246",
            "text-muted": "#6a8274",
            "text-accent": "#2f855a",
            "accent-primary": "#276749",
            "accent-error": "#c53030",
            "accent-success": "#2f855a",
            "accent-warning": "#b7791f",
            "card-bg": "#ffffff",
            "card-border": "#cbd5e1",
            "player-bg": "#e5ebe7",
            "progress-color": "#2f855a",
            "control-active": "#2f855a",
            "search-bg": "#ffffff",
            "search-border": "#cbd5e1",
            "btn-primary-bg": "#276749",
            "btn-primary-text": "#ffffff",
            "btn-secondary-bg": "#e5ebe7",
            "btn-secondary-text": "#1b2d22",
            "nav-bg": "#1b2d22",
            "nav-active": "#38a169",
            "nav-inactive": "#6a8274"
        },
        dark: {
            "bg-primary": "#121a15",
            "bg-secondary": "#1a261e",
            "bg-tertiary": "#27382c",
            "text-primary": "#e2e8f0",
            "text-secondary": "#a0aec0",
            "text-muted": "#718096",
            "text-accent": "#68d391",
            "accent-primary": "#48bb78",
            "accent-error": "#f56565",
            "accent-success": "#48bb78",
            "accent-warning": "#ecc94b",
            "card-bg": "#1a261e",
            "card-border": "#27382c",
            "player-bg": "#121a15",
            "progress-color": "#48bb78",
            "control-active": "#68d391",
            "search-bg": "#1a261e",
            "search-border": "#27382c",
            "btn-primary-bg": "#48bb78",
            "btn-primary-text": "#121a15",
            "btn-secondary-bg": "#27382c",
            "btn-secondary-text": "#e2e8f0",
            "nav-bg": "#121a15",
            "nav-active": "#48bb78",
            "nav-inactive": "#4a5568"
        }
    },
    {
        id: "sunset",
        name: "Sunset",
        isCustom: false,
        light: {
            "bg-primary": "#fffaf0",
            "bg-secondary": "#feebc8",
            "bg-tertiary": "#fbd38d",
            "text-primary": "#4a1c1c",
            "text-secondary": "#7b341e",
            "text-muted": "#a05e45",
            "text-accent": "#dd6b20",
            "accent-primary": "#c05621",
            "accent-error": "#e53e3e",
            "accent-success": "#38a169",
            "accent-warning": "#d69e2e",
            "card-bg": "#ffffff",
            "card-border": "#fbd38d",
            "player-bg": "#feebc8",
            "progress-color": "#dd6b20",
            "control-active": "#dd6b20",
            "search-bg": "#ffffff",
            "search-border": "#fbd38d",
            "btn-primary-bg": "#c05621",
            "btn-primary-text": "#ffffff",
            "btn-secondary-bg": "#feebc8",
            "btn-secondary-text": "#4a1c1c",
            "nav-bg": "#7b341e",
            "nav-active": "#ed8936",
            "nav-inactive": "#a05e45"
        },
        dark: {
            "bg-primary": "#2d161a",
            "bg-secondary": "#411d23",
            "bg-tertiary": "#5a2630",
            "text-primary": "#fed7d7",
            "text-secondary": "#fc8181",
            "text-muted": "#e53e3e",
            "text-accent": "#f6ad55",
            "accent-primary": "#dd6b20",
            "accent-error": "#fc8181",
            "accent-success": "#68d391",
            "accent-warning": "#fbd38d",
            "card-bg": "#411d23",
            "card-border": "#5a2630",
            "player-bg": "#2d161a",
            "progress-color": "#ed8936",
            "control-active": "#f6ad55",
            "search-bg": "#411d23",
            "search-border": "#5a2630",
            "btn-primary-bg": "#dd6b20",
            "btn-primary-text": "#ffffff",
            "btn-secondary-bg": "#5a2630",
            "btn-secondary-text": "#fed7d7",
            "nav-bg": "#2d161a",
            "nav-active": "#ed8936",
            "nav-inactive": "#9b2c2c"
        }
    },
    {
        id: "arctic",
        name: "Arctic",
        isCustom: false,
        light: {
            "bg-primary": "#f8fafc",
            "bg-secondary": "#f1f5f9",
            "bg-tertiary": "#e2e8f0",
            "text-primary": "#0f172a",
            "text-secondary": "#334155",
            "text-muted": "#64748b",
            "text-accent": "#0ea5e9",
            "accent-primary": "#0284c7",
            "accent-error": "#ef4444",
            "accent-success": "#10b981",
            "accent-warning": "#f59e0b",
            "card-bg": "#ffffff",
            "card-border": "#e2e8f0",
            "player-bg": "#f1f5f9",
            "progress-color": "#0ea5e9",
            "control-active": "#0ea5e9",
            "search-bg": "#ffffff",
            "search-border": "#e2e8f0",
            "btn-primary-bg": "#0284c7",
            "btn-primary-text": "#ffffff",
            "btn-secondary-bg": "#e2e8f0",
            "btn-secondary-text": "#0f172a",
            "nav-bg": "#0f172a",
            "nav-active": "#38bdf8",
            "nav-inactive": "#64748b"
        },
        dark: {
            "bg-primary": "#0b1120",
            "bg-secondary": "#1e293b",
            "bg-tertiary": "#334155",
            "text-primary": "#f8fafc",
            "text-secondary": "#cbd5e1",
            "text-muted": "#94a3b8",
            "text-accent": "#38bdf8",
            "accent-primary": "#0ea5e9",
            "accent-error": "#f87171",
            "accent-success": "#34d399",
            "accent-warning": "#fbbf24",
            "card-bg": "#1e293b",
            "card-border": "#334155",
            "player-bg": "#0b1120",
            "progress-color": "#0ea5e9",
            "control-active": "#38bdf8",
            "search-bg": "#1e293b",
            "search-border": "#334155",
            "btn-primary-bg": "#0ea5e9",
            "btn-primary-text": "#ffffff",
            "btn-secondary-bg": "#334155",
            "btn-secondary-text": "#f8fafc",
            "nav-bg": "#0b1120",
            "nav-active": "#38bdf8",
            "nav-inactive": "#475569"
        }
    },
    {
        id: "sakura",
        name: "Sakura",
        isCustom: false,
        light: {
            "bg-primary": "#fdf2f8",
            "bg-secondary": "#fce7f3",
            "bg-tertiary": "#fbcfe8",
            "text-primary": "#831843",
            "text-secondary": "#9d174d",
            "text-muted": "#be185d",
            "text-accent": "#db2777",
            "accent-primary": "#be185d",
            "accent-error": "#e11d48",
            "accent-success": "#10b981",
            "accent-warning": "#f59e0b",
            "card-bg": "#ffffff",
            "card-border": "#fbcfe8",
            "player-bg": "#fce7f3",
            "progress-color": "#db2777",
            "control-active": "#db2777",
            "search-bg": "#ffffff",
            "search-border": "#fbcfe8",
            "btn-primary-bg": "#be185d",
            "btn-primary-text": "#ffffff",
            "btn-secondary-bg": "#fbcfe8",
            "btn-secondary-text": "#831843",
            "nav-bg": "#831843",
            "nav-active": "#f472b6",
            "nav-inactive": "#be185d"
        },
        dark: {
            "bg-primary": "#2e1026",
            "bg-secondary": "#4a1a3e",
            "bg-tertiary": "#702b5e",
            "text-primary": "#fdf2f8",
            "text-secondary": "#fbcfe8",
            "text-muted": "#f472b6",
            "text-accent": "#ec4899",
            "accent-primary": "#db2777",
            "accent-error": "#fb7185",
            "accent-success": "#34d399",
            "accent-warning": "#fbbf24",
            "card-bg": "#4a1a3e",
            "card-border": "#702b5e",
            "player-bg": "#2e1026",
            "progress-color": "#db2777",
            "control-active": "#ec4899",
            "search-bg": "#4a1a3e",
            "search-border": "#702b5e",
            "btn-primary-bg": "#db2777",
            "btn-primary-text": "#ffffff",
            "btn-secondary-bg": "#702b5e",
            "btn-secondary-text": "#fdf2f8",
            "nav-bg": "#2e1026",
            "nav-active": "#ec4899",
            "nav-inactive": "#831843"
        }
    },
    {
        id: "obsidian",
        name: "Obsidian",
        isCustom: false,
        light: {
            "bg-primary": "#fafafa",
            "bg-secondary": "#f4f4f5",
            "bg-tertiary": "#e4e4e7",
            "text-primary": "#18181b",
            "text-secondary": "#3f3f46",
            "text-muted": "#71717a",
            "text-accent": "#d4af37",
            "accent-primary": "#c5a017",
            "accent-error": "#dc2626",
            "accent-success": "#16a34a",
            "accent-warning": "#ea580c",
            "card-bg": "#ffffff",
            "card-border": "#e4e4e7",
            "player-bg": "#f4f4f5",
            "progress-color": "#c5a017",
            "control-active": "#c5a017",
            "search-bg": "#ffffff",
            "search-border": "#e4e4e7",
            "btn-primary-bg": "#18181b",
            "btn-primary-text": "#d4af37",
            "btn-secondary-bg": "#e4e4e7",
            "btn-secondary-text": "#18181b",
            "nav-bg": "#18181b",
            "nav-active": "#d4af37",
            "nav-inactive": "#71717a"
        },
        dark: {
            "bg-primary": "#000000",
            "bg-secondary": "#121212",
            "bg-tertiary": "#27272a",
            "text-primary": "#f4f4f5",
            "text-secondary": "#d4d4d8",
            "text-muted": "#a1a1aa",
            "text-accent": "#d4af37",
            "accent-primary": "#b48c0b",
            "accent-error": "#ef4444",
            "accent-success": "#22c55e",
            "accent-warning": "#f97316",
            "card-bg": "#121212",
            "card-border": "#27272a",
            "player-bg": "#000000",
            "progress-color": "#d4af37",
            "control-active": "#e5c453",
            "search-bg": "#121212",
            "search-border": "#27272a",
            "btn-primary-bg": "#d4af37",
            "btn-primary-text": "#000000",
            "btn-secondary-bg": "#27272a",
            "btn-secondary-text": "#f4f4f5",
            "nav-bg": "#000000",
            "nav-active": "#d4af37",
            "nav-inactive": "#52525b"
        }
    }
];

export class ThemeService {
    constructor(appDirectory) {
        this.appDirectory = appDirectory;
        this.configDirectory = path.join(appDirectory, "config");
        this.themesPath = path.join(this.configDirectory, "themes.json");
        ensureDirectory(this.configDirectory);
        
        this.customThemes = this.#loadThemesFromDisk();
    }

    #loadThemesFromDisk() {
        try {
            if (!fs.existsSync(this.themesPath)) {
                fs.writeFileSync(this.themesPath, JSON.stringify([], null, 4), "utf-8");
                return [];
            }
            return JSON.parse(fs.readFileSync(this.themesPath, "utf-8"));
        } catch (error) {
            console.error("ThemeService", "Failed to load custom themes", error);
            return [];
        }
    }

    #persist() {
        fs.writeFileSync(this.themesPath, JSON.stringify(this.customThemes, null, 4), "utf-8");
    }

    getAllThemes() {
        return [...builtInThemes, ...this.customThemes];
    }

    getTheme(id) {
        return this.getAllThemes().find(t => t.id === id);
    }

    createCustomTheme(name, baseId) {
        const baseTheme = this.getTheme(baseId) || builtInThemes[0];
        const newId = `custom-${Date.now()}`;
        
        const newTheme = {
            id: newId,
            name: name || `Copy of ${baseTheme.name}`,
            isCustom: true,
            light: { ...baseTheme.light },
            dark: { ...baseTheme.dark }
        };

        this.customThemes.push(newTheme);
        this.#persist();
        return newTheme;
    }

    updateTheme(id, partial) {
        const themeIndex = this.customThemes.findIndex(t => t.id === id);
        if (themeIndex === -1) return false;

        const theme = this.customThemes[themeIndex];
        if (partial.light) theme.light = { ...theme.light, ...partial.light };
        if (partial.dark) theme.dark = { ...theme.dark, ...partial.dark };
        if (partial.name) theme.name = partial.name;

        this.#persist();
        return true;
    }

    renameTheme(id, newName) {
        return this.updateTheme(id, { name: newName });
    }

    duplicateTheme(id) {
        const baseTheme = this.getTheme(id);
        if (!baseTheme) return null;
        return this.createCustomTheme(`${baseTheme.name} (Copy)`, id);
    }

    deleteTheme(id) {
        const initialLength = this.customThemes.length;
        this.customThemes = this.customThemes.filter(t => t.id !== id);
        if (this.customThemes.length !== initialLength) {
            this.#persist();
            return true;
        }
        return false;
    }

    importTheme(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            
            // Basic validation
            if (!imported.name || !imported.light || !imported.dark) {
                throw new Error("Invalid theme format");
            }
            
            const newId = `custom-${Date.now()}`;
            const newTheme = {
                id: newId,
                name: `${imported.name} (Imported)`,
                isCustom: true,
                light: imported.light,
                dark: imported.dark
            };
            
            this.customThemes.push(newTheme);
            this.#persist();
            return newTheme;
        } catch (error) {
            console.error("ThemeService", "Failed to import theme", error);
            throw error;
        }
    }

    exportTheme(id) {
        const theme = this.getTheme(id);
        if (!theme) throw new Error("Theme not found");
        
        // Exclude internal id and isCustom flag for export
        const exportData = {
            name: theme.name,
            light: theme.light,
            dark: theme.dark,
            version: "1.0",
            type: "skyautopiano-theme"
        };
        
        return JSON.stringify(exportData, null, 4);
    }
}
