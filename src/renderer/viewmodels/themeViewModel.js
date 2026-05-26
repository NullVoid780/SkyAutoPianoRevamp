/**
 * Theme Editor ViewModel
 */
const { ipcRenderer } = require("electron");

let allThemes = [];
let activeThemeConfig = { activeId: null, mode: 'dark' };
let currentEditingId = null;
let currentMode = 'dark'; // Mode used for previewing in the editor
let currentThemeData = null; // The theme currently loaded in the editor

// Undo/Redo history per theme
const history = {
    past: [],
    future: [],
    MAX_HISTORY: 50
};

// UI Elements
const els = {
    builtinList: document.getElementById('builtin-themes-list'),
    customList: document.getElementById('custom-themes-list'),
    themeName: document.getElementById('current-theme-name'),
    themeBadge: document.getElementById('theme-status-badge'),
    editorOverlay: document.getElementById('editor-overlay'),
    customActions: document.getElementById('custom-theme-actions'),
    previewFrame: document.getElementById('preview-frame'),
    colorInputs: document.querySelectorAll('input[type="color"]'),
    hexInputs: document.querySelectorAll('.hex-input'),
    accordions: document.querySelectorAll('.accordion-header'),
    btnUndo: document.getElementById('btn-undo'),
    btnRedo: document.getElementById('btn-redo'),
    btnSave: document.getElementById('btn-save'),
    btnCreate: document.getElementById('btn-create-theme'),
    btnDupOverlay: document.getElementById('btn-duplicate-overlay'),
    btnDuplicate: document.getElementById('btn-duplicate'),
    btnRename: document.getElementById('btn-rename'),
    btnDelete: document.getElementById('btn-delete'),
    btnImport: document.getElementById('btn-import'),
    btnExport: document.getElementById('btn-export'),
    previewLight: document.getElementById('preview-light'),
    previewDark: document.getElementById('preview-dark'),
    renameDialog: document.getElementById('rename-dialog'),
    renameInput: document.getElementById('rename-input'),
    btnRenameConfirm: document.getElementById('btn-rename-confirm'),
    btnRenameCancel: document.getElementById('btn-rename-cancel')
};

// Initialize
async function init() {
    await loadThemes();
    setupEventListeners();
    
    // Select the active theme by default
    if (activeThemeConfig.activeId) {
        selectTheme(activeThemeConfig.activeId);
        setPreviewMode(activeThemeConfig.mode);
    } else {
        selectTheme(allThemes[0].id);
    }
}

async function loadThemes() {
    allThemes = await ipcRenderer.invoke("get-themes");
    activeThemeConfig = await ipcRenderer.invoke("get-active-theme");
    renderThemeLists();
}

function renderThemeLists() {
    els.builtinList.innerHTML = '';
    els.customList.innerHTML = '';

    allThemes.forEach(theme => {
        const isActive = theme.id === activeThemeConfig.activeId;
        const isEditing = theme.id === currentEditingId;
        
        const div = document.createElement('div');
        div.className = `theme-item ${isEditing ? 'active' : ''} ${isActive ? 'active-theme' : ''}`;
        div.innerHTML = `
            <span>${theme.name}</span>
            <i class="bi bi-check-circle-fill" title="Active Theme"></i>
        `;
        div.onclick = () => selectTheme(theme.id);

        if (theme.isCustom) {
            els.customList.appendChild(div);
        } else {
            els.builtinList.appendChild(div);
        }
    });
}

function selectTheme(id) {
    const theme = allThemes.find(t => t.id === id);
    if (!theme) return;

    currentEditingId = id;
    currentThemeData = JSON.parse(JSON.stringify(theme)); // Deep copy
    clearHistory();
    
    // Update UI
    els.themeName.textContent = theme.name;
    els.themeBadge.textContent = theme.isCustom ? "Custom" : "Built-in";
    els.themeBadge.style.backgroundColor = theme.isCustom ? "var(--accent-primary)" : "var(--bg-tertiary)";
    els.themeBadge.style.color = theme.isCustom ? "#fff" : "var(--text-secondary)";
    
    els.editorOverlay.style.display = theme.isCustom ? "none" : "flex";
    els.customActions.style.display = theme.isCustom ? "flex" : "none";
    els.btnSave.disabled = true;

    renderThemeLists();
    loadColorsIntoEditor();
    applyPreviewTheme();
    
    // If selecting a theme, apply it globally immediately for a seamless experience
    if (id !== activeThemeConfig.activeId) {
        ipcRenderer.send("set-active-theme", { id, mode: currentMode });
        activeThemeConfig.activeId = id;
        renderThemeLists();
    }
}

function loadColorsIntoEditor() {
    if (!currentThemeData) return;
    const colors = currentThemeData[currentMode];
    
    els.colorInputs.forEach((input, index) => {
        const varName = input.getAttribute('data-var');
        if (colors[varName]) {
            input.value = colors[varName];
            els.hexInputs[index].value = colors[varName];
        }
    });
}

// History Management
function saveHistoryState() {
    if (!currentThemeData) return;
    history.past.push(JSON.parse(JSON.stringify(currentThemeData[currentMode])));
    if (history.past.length > history.MAX_HISTORY) {
        history.past.shift();
    }
    history.future = [];
    updateHistoryButtons();
    els.btnSave.disabled = false;
}

function undo() {
    if (history.past.length === 0) return;
    
    history.future.push(JSON.parse(JSON.stringify(currentThemeData[currentMode])));
    const previousState = history.past.pop();
    currentThemeData[currentMode] = previousState;
    
    loadColorsIntoEditor();
    applyPreviewTheme();
    updateHistoryButtons();
    els.btnSave.disabled = false;
    
    // Auto-save logic (debounced)
    debouncedSave();
}

function redo() {
    if (history.future.length === 0) return;
    
    history.past.push(JSON.parse(JSON.stringify(currentThemeData[currentMode])));
    const nextState = history.future.pop();
    currentThemeData[currentMode] = nextState;
    
    loadColorsIntoEditor();
    applyPreviewTheme();
    updateHistoryButtons();
    els.btnSave.disabled = false;
    
    // Auto-save logic (debounced)
    debouncedSave();
}

function clearHistory() {
    history.past = [];
    history.future = [];
    updateHistoryButtons();
}

function updateHistoryButtons() {
    els.btnUndo.disabled = history.past.length === 0;
    els.btnRedo.disabled = history.future.length === 0;
}

// Live Preview applying
function applyPreviewTheme() {
    if (!currentThemeData) return;
    const colors = currentThemeData[currentMode];
    
    // Apply to preview frame
    for (const [key, value] of Object.entries(colors)) {
        els.previewFrame.style.setProperty(`--${key}`, value);
    }
    
    if (currentMode === 'dark') {
        els.previewFrame.classList.add('dark-mode');
    } else {
        els.previewFrame.classList.remove('dark-mode');
    }
}

function setPreviewMode(mode) {
    currentMode = mode;
    els.previewLight.classList.toggle('active', mode === 'light');
    els.previewDark.classList.toggle('active', mode === 'dark');
    
    loadColorsIntoEditor();
    applyPreviewTheme();
    
    // Sync mode with global app
    if (activeThemeConfig.activeId === currentEditingId && activeThemeConfig.mode !== mode) {
        ipcRenderer.send("set-active-theme", { id: currentEditingId, mode });
        activeThemeConfig.mode = mode;
    }
}

// Actions
async function saveTheme() {
    if (!currentThemeData || !currentThemeData.isCustom) return;
    
    const success = await ipcRenderer.invoke("update-theme", currentEditingId, {
        light: currentThemeData.light,
        dark: currentThemeData.dark
    });
    
    if (success) {
        els.btnSave.disabled = true;
        // If this is the active theme, broadcast change
        if (activeThemeConfig.activeId === currentEditingId) {
            ipcRenderer.send("set-active-theme", { id: currentEditingId, mode: activeThemeConfig.mode });
        }
        await loadThemes(); // reload to sync
    }
}

let saveTimeout;
function debouncedSave() {
    clearTimeout(saveTimeout);
    els.btnSave.disabled = false;
    saveTimeout = setTimeout(() => {
        saveTheme();
    }, 800);
}

function handleColorChange(input, hexInput) {
    const varName = input.getAttribute('data-var');
    const val = input.value;
    
    saveHistoryState();
    hexInput.value = val;
    currentThemeData[currentMode][varName] = val;
    
    applyPreviewTheme();
    debouncedSave();
}

function handleHexChange(hexInput, colorInput) {
    let val = hexInput.value;
    if (!val.startsWith('#')) val = '#' + val;
    
    // Simple hex validation
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        saveHistoryState();
        colorInput.value = val;
        const varName = colorInput.getAttribute('data-var');
        currentThemeData[currentMode][varName] = val;
        
        applyPreviewTheme();
        debouncedSave();
    }
}

async function createTheme(themeName) {
    if (!themeName) return;
    // Use 'classic' as a safe color template, but the name will be user's input
    const theme = await ipcRenderer.invoke("create-theme", themeName, 'classic');
    await loadThemes();
    selectTheme(theme.id);
}

async function duplicateTheme() {
    if (!currentEditingId) return;
    const theme = await ipcRenderer.invoke("duplicate-theme", currentEditingId);
    if (theme) {
        await loadThemes();
        selectTheme(theme.id);
    }
}

async function deleteTheme() {
    if (!currentEditingId || !currentThemeData.isCustom) return;
    if (confirm(`Are you sure you want to delete '${currentThemeData.name}'?`)) {
        await ipcRenderer.invoke("delete-theme", currentEditingId);
        
        // If we deleted the active theme, fallback to default
        if (activeThemeConfig.activeId === currentEditingId) {
            ipcRenderer.send("set-active-theme", { id: allThemes[0].id, mode: activeThemeConfig.mode });
        }
        
        await loadThemes();
        selectTheme(allThemes[0].id);
    }
}

// Input Dialog Logic (Reusing Rename Dialog UI)
let dialogAction = null;

function openRenameDialog() {
    if (!currentEditingId || !currentThemeData.isCustom) return;
    dialogAction = 'rename';
    document.querySelector('#rename-dialog h3').textContent = 'Rename Theme';
    els.btnRenameConfirm.textContent = 'Rename';
    els.renameInput.value = currentThemeData.name;
    els.renameDialog.classList.add('show');
    els.renameInput.focus();
}

function openCreateDialog() {
    dialogAction = 'create';
    document.querySelector('#rename-dialog h3').textContent = 'Create New Theme';
    els.btnRenameConfirm.textContent = 'Create';
    els.renameInput.value = '';
    els.renameDialog.classList.add('show');
    els.renameInput.focus();
}

function closeRenameDialog() {
    els.renameDialog.classList.remove('show');
    dialogAction = null;
}

async function confirmDialogAction() {
    const inputValue = els.renameInput.value.trim();
    if (!inputValue) return;

    if (dialogAction === 'rename') {
        if (inputValue !== currentThemeData.name) {
            await ipcRenderer.invoke("rename-theme", currentEditingId, inputValue);
            await loadThemes();
            els.themeName.textContent = inputValue;
            currentThemeData.name = inputValue;
        }
    } else if (dialogAction === 'create') {
        await createTheme(inputValue);
    }
    
    closeRenameDialog();
}

async function importTheme() {
    const jsonStr = await ipcRenderer.invoke("show-theme-import-dialog");
    if (!jsonStr) return; // Canceled
    
    try {
        const newTheme = await ipcRenderer.invoke("import-theme", jsonStr);
        notie.alert({ type: 1, text: "Theme imported successfully!" });
        await loadThemes();
        selectTheme(newTheme.id);
    } catch (err) {
        notie.alert({ type: 3, text: "Failed to import theme. Invalid format." });
    }
}

async function exportTheme() {
    if (!currentEditingId) return;
    try {
        const jsonStr = await ipcRenderer.invoke("export-theme", currentEditingId);
        await ipcRenderer.invoke("save-exported-file", {
            filePath: `${currentThemeData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_theme.json`,
            content: jsonStr
        });
        notie.alert({ type: 1, text: "Theme exported successfully!" });
    } catch (err) {
        // If user cancels save dialog, save-exported-file logic in main needs to handle it or we ignore
    }
}

// Event Listeners Setup
function setupEventListeners() {
    // Accordion
    els.accordions.forEach(acc => {
        acc.addEventListener('click', function() {
            this.parentElement.classList.toggle('active');
        });
    });

    // Open first accordion by default
    if(els.accordions.length > 0) els.accordions[0].parentElement.classList.add('active');

    // Color Inputs
    els.colorInputs.forEach((input, index) => {
        input.addEventListener('input', () => handleColorChange(input, els.hexInputs[index]));
    });

    els.hexInputs.forEach((input, index) => {
        input.addEventListener('change', () => handleHexChange(input, els.colorInputs[index]));
        input.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') handleHexChange(input, els.colorInputs[index]);
        });
    });

    // History
    els.btnUndo.addEventListener('click', undo);
    els.btnRedo.addEventListener('click', redo);
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'z') {
            if (e.shiftKey) redo();
            else undo();
        }
    });

    // Save
    els.btnSave.addEventListener('click', () => {
        clearTimeout(saveTimeout);
        saveTheme();
        notie.alert({ type: 1, text: "Theme saved", time: 2 });
    });

    // Actions
    els.btnCreate.addEventListener('click', openCreateDialog);
    els.btnDupOverlay.addEventListener('click', duplicateTheme);
    els.btnDuplicate.addEventListener('click', duplicateTheme);
    els.btnDelete.addEventListener('click', deleteTheme);
    els.btnRename.addEventListener('click', openRenameDialog);
    
    // Import / Export
    els.btnImport.addEventListener('click', importTheme);
    els.btnExport.addEventListener('click', exportTheme);

    // Preview Mode
    els.previewLight.addEventListener('click', () => setPreviewMode('light'));
    els.previewDark.addEventListener('click', () => setPreviewMode('dark'));

    // Input Dialog (Rename/Create)
    els.btnRenameCancel.addEventListener('click', closeRenameDialog);
    els.btnRenameConfirm.addEventListener('click', confirmDialogAction);
    els.renameInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') confirmDialogAction();
        if (e.key === 'Escape') closeRenameDialog();
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', init);
