import fs from "fs";
import path from "node:path";
import { ensureDirectory } from "../../common/fileSystem.js";

const builtInThemes = [
    {
        id: "classic",
        name: "Classic Editor",
        isCustom: false,
        light: {
            "background-color": "#ffffff",
            "font-color": "#1f2937",
            "grid-color": "#f3f4f6",
            "hover-color": "#e5e7eb",
            "active-color": "#3b82f6",
            "dot-color": "#d1d5db",
            "border-color": "#9ca3af",
            "edit-bg": "#ffffff",
            "success-color": "#10b981",
            "error-color": "#ef4444"
        },
        dark: {
            "background-color": "#121212",
            "font-color": "#f3f4f6",
            "grid-color": "#27272a",
            "hover-color": "#3f3f46",
            "active-color": "#3b82f6",
            "dot-color": "#52525b",
            "border-color": "#52525b",
            "edit-bg": "#18181b",
            "success-color": "#10b981",
            "error-color": "#ef4444"
        }
    },
    {
        id: "midnight",
        name: "Midnight Editor",
        isCustom: false,
        light: {
            "background-color": "#f8fafc",
            "font-color": "#0f172a",
            "grid-color": "#e2e8f0",
            "hover-color": "#cbd5e1",
            "active-color": "#6366f1",
            "dot-color": "#94a3b8",
            "border-color": "#64748b",
            "edit-bg": "#ffffff",
            "success-color": "#22c55e",
            "error-color": "#ef4444"
        },
        dark: {
            "background-color": "#0f172a",
            "font-color": "#f8fafc",
            "grid-color": "#1e293b",
            "hover-color": "#334155",
            "active-color": "#818cf8",
            "dot-color": "#475569",
            "border-color": "#64748b",
            "edit-bg": "#0f172a",
            "success-color": "#22c55e",
            "error-color": "#ef4444"
        }
    },
    {
        id: "forest",
        name: "Forest Editor",
        isCustom: false,
        light: {
            "background-color": "#f1f5f2",
            "font-color": "#2c3e2e",
            "grid-color": "#e5ebe7",
            "hover-color": "#d1dfd4",
            "active-color": "#4caf50",
            "dot-color": "#9eb8a1",
            "border-color": "#a8c0ab",
            "edit-bg": "#ffffff",
            "success-color": "#2e7d32",
            "error-color": "#d32f2f"
        },
        dark: {
            "background-color": "#121a14",
            "font-color": "#e8f0ea",
            "grid-color": "#1a241b",
            "hover-color": "#243226",
            "active-color": "#66bb6a",
            "dot-color": "#38523b",
            "border-color": "#38523b",
            "edit-bg": "#121a14",
            "success-color": "#4caf50",
            "error-color": "#f44336"
        }
    },
    {
        id: "sunset",
        name: "Sunset Editor",
        isCustom: false,
        light: {
            "background-color": "#fffdf5",
            "font-color": "#5c3a21",
            "grid-color": "#fdeeb5",
            "hover-color": "#fcdb77",
            "active-color": "#ff9800",
            "dot-color": "#f3c053",
            "border-color": "#e6ad3e",
            "edit-bg": "#ffffff",
            "success-color": "#4caf50",
            "error-color": "#f44336"
        },
        dark: {
            "background-color": "#2c1c16",
            "font-color": "#fcecd2",
            "grid-color": "#42281c",
            "hover-color": "#593626",
            "active-color": "#ff9800",
            "dot-color": "#6b422e",
            "border-color": "#6b422e",
            "edit-bg": "#2c1c16",
            "success-color": "#81c784",
            "error-color": "#e57373"
        }
    },
    {
        id: "arctic",
        name: "Arctic Editor",
        isCustom: false,
        light: {
            "background-color": "#f0f8ff",
            "font-color": "#1c3c5a",
            "grid-color": "#e1f0fa",
            "hover-color": "#c4e2f5",
            "active-color": "#00bcd4",
            "dot-color": "#8bc4e8",
            "border-color": "#76b7e0",
            "edit-bg": "#ffffff",
            "success-color": "#4caf50",
            "error-color": "#f44336"
        },
        dark: {
            "background-color": "#0a192f",
            "font-color": "#e6f1ff",
            "grid-color": "#112240",
            "hover-color": "#233554",
            "active-color": "#00bcd4",
            "dot-color": "#304363",
            "border-color": "#304363",
            "edit-bg": "#0a192f",
            "success-color": "#4caf50",
            "error-color": "#f44336"
        }
    },
    {
        id: "sakura",
        name: "Sakura Editor",
        isCustom: false,
        light: {
            "background-color": "#fff5f8",
            "font-color": "#5a2a3b",
            "grid-color": "#ffe4ec",
            "hover-color": "#ffc6d9",
            "active-color": "#e91e63",
            "dot-color": "#f5a2bf",
            "border-color": "#eb8eb1",
            "edit-bg": "#ffffff",
            "success-color": "#4caf50",
            "error-color": "#f44336"
        },
        dark: {
            "background-color": "#2b161f",
            "font-color": "#fce4ed",
            "grid-color": "#422130",
            "hover-color": "#592a40",
            "active-color": "#e91e63",
            "dot-color": "#6e3350",
            "border-color": "#6e3350",
            "edit-bg": "#2b161f",
            "success-color": "#81c784",
            "error-color": "#e57373"
        }
    },
    {
        id: "obsidian",
        name: "Obsidian Editor",
        isCustom: false,
        light: {
            "background-color": "#e8e8e8",
            "font-color": "#121212",
            "grid-color": "#d4d4d4",
            "hover-color": "#b8b8b8",
            "active-color": "#000000",
            "dot-color": "#8a8a8a",
            "border-color": "#737373",
            "edit-bg": "#ffffff",
            "success-color": "#2e7d32",
            "error-color": "#d32f2f"
        },
        dark: {
            "background-color": "#050505",
            "font-color": "#f0f0f0",
            "grid-color": "#141414",
            "hover-color": "#292929",
            "active-color": "#ffffff",
            "dot-color": "#404040",
            "border-color": "#404040",
            "edit-bg": "#050505",
            "success-color": "#4caf50",
            "error-color": "#f44336"
        }
    }
];

export class EditorThemeService {
    constructor(appDirectory) {
        this.appDirectory = appDirectory;
        this.configDirectory = path.join(appDirectory, "config");
        this.themesPath = path.join(this.configDirectory, "editor-themes.json");
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
            console.error("EditorThemeService", "Failed to load custom editor themes", error);
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
        const newId = `custom-editor-${Date.now()}`;
        
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
            
            if (!imported.name || !imported.light || !imported.dark || imported.type !== "skyautopiano-editor-theme") {
                throw new Error("Invalid editor theme format");
            }
            
            const newId = `custom-editor-${Date.now()}`;
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
            console.error("EditorThemeService", "Failed to import editor theme", error);
            throw error;
        }
    }

    exportTheme(id) {
        const theme = this.getTheme(id);
        if (!theme) throw new Error("Theme not found");
        
        const exportData = {
            name: theme.name,
            light: theme.light,
            dark: theme.dark,
            version: "1.0",
            type: "skyautopiano-editor-theme"
        };
        
        return JSON.stringify(exportData, null, 4);
    }
}
