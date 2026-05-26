/**
 * Sky Auto Piano - Theme Applicator
 * Applies custom theme CSS variables to the document root.
 */

const electronIpc = require("electron").ipcRenderer;

/**
 * Apply theme variables to the document root
 * @param {Object} themeData The full theme object
 * @param {string} mode 'light' or 'dark'
 */
function applyTheme(themeData, mode) {
    if (!themeData) return;
    
    const colors = themeData[mode];
    if (!colors) return;
    
    const root = document.documentElement;
    
    // Apply all color variables from the theme
    for (const [key, value] of Object.entries(colors)) {
        root.style.setProperty(`--${key}`, value);
    }
    
    // Toggle the dark-mode class on body for any legacy CSS rules that still rely on it
    if (mode === "dark") {
        document.body.classList.add("dark-mode");
    } else {
        document.body.classList.remove("dark-mode");
    }
}

/**
 * Fetch the active theme from the main process and apply it
 */
async function applyThemeFromConfig() {
    try {
        const activeThemeConfig = await electronIpc.invoke("get-active-theme");
        if (!activeThemeConfig) return;
        
        const themes = await electronIpc.invoke("get-themes");
        const activeThemeData = themes.find(t => t.id === activeThemeConfig.activeId) || themes[0];
        
        applyTheme(activeThemeData, activeThemeConfig.mode);
    } catch (error) {
        console.error("Failed to apply theme from config:", error);
    }
}

// Listen for live theme updates from the main process
electronIpc.on("theme-changed", (event, data) => {
    // If the data is an object with themeData and mode (new system)
    if (data && typeof data === 'object' && data.themeData) {
        applyTheme(data.themeData, data.mode);
    } 
    // Fallback for legacy light/dark toggle (just mode string)
    else if (typeof data === 'string') {
        applyThemeFromConfig();
    }
});

// Auto-apply on load
document.addEventListener("DOMContentLoaded", applyThemeFromConfig);

module.exports = {
    applyTheme,
    applyThemeFromConfig
};
