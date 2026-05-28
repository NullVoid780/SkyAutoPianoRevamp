/**
 * Theme Editor ViewModel
 */
const { ipcRenderer } = require("electron");

let currentContext = 'app'; // 'app' or 'editor'

const state = {
    app: {
        allThemes: [],
        activeThemeConfig: { activeId: null, mode: 'dark' },
        currentEditingId: null,
        currentMode: 'dark',
        currentThemeData: null,
        history: { past: [], future: [], MAX_HISTORY: 50 }
    },
    editor: {
        allThemes: [],
        activeThemeConfig: { activeId: null, mode: 'dark' },
        currentEditingId: null,
        currentMode: 'dark',
        currentThemeData: null,
        history: { past: [], future: [], MAX_HISTORY: 50 }
    }
};

function getState() { return state[currentContext]; }

// UI Elements
const els = {};

function initEls() {
    els.builtinList = document.getElementById('builtin-themes-list');
    els.customList = document.getElementById('custom-themes-list');
    els.themeName = document.getElementById('current-theme-name');
    els.themeBadge = document.getElementById('theme-status-badge');
    els.editorOverlay = document.getElementById('editor-overlay');
    els.customActions = document.getElementById('custom-theme-actions');
    els.appPreviewFrame = document.getElementById('app-preview-mockup');
    els.editorPreviewFrame = document.getElementById('editor-preview-mockup');
    els.colorInputs = document.querySelectorAll('input[type="color"]');
    els.hexInputs = document.querySelectorAll('.hex-input');
    els.tabBtns = document.querySelectorAll('.editor-tab-btn');
    els.tabContents = document.querySelectorAll('.editor-tab-content');
    els.btnUndo = document.getElementById('btn-undo');
    els.btnRedo = document.getElementById('btn-redo');
    els.btnSave = document.getElementById('btn-save');
    els.btnCreate = document.getElementById('btn-create-theme');
    els.btnDupOverlay = document.getElementById('btn-duplicate-overlay');
    els.btnDuplicate = document.getElementById('btn-duplicate');
    els.btnRename = document.getElementById('btn-rename');
    els.btnDelete = document.getElementById('btn-delete');
    els.btnImport = document.getElementById('btn-import');
    els.btnExport = document.getElementById('btn-export');
    els.previewLight = document.getElementById('preview-light');
    els.previewDark = document.getElementById('preview-dark');
    els.renameDialog = document.getElementById('rename-dialog');
    els.renameInput = document.getElementById('rename-input');
    els.btnRenameConfirm = document.getElementById('btn-rename-confirm');
    els.btnRenameCancel = document.getElementById('btn-rename-cancel');
    els.contextBtns = document.querySelectorAll('.context-btn');
}

async function init() {
    initEls();
    await loadAllContexts();
    setupEventListeners();

    switchContext('app');
}

async function loadAllContexts() {
    state.app.allThemes = await ipcRenderer.invoke("get-themes");
    state.app.activeThemeConfig = await ipcRenderer.invoke("get-active-theme");

    state.editor.allThemes = await ipcRenderer.invoke("get-editor-themes");
    state.editor.activeThemeConfig = await ipcRenderer.invoke("get-active-editor-theme");
}

async function loadThemes() {
    const s = getState();
    if (currentContext === 'app') {
        s.allThemes = await ipcRenderer.invoke("get-themes");
        s.activeThemeConfig = await ipcRenderer.invoke("get-active-theme");
    } else {
        s.allThemes = await ipcRenderer.invoke("get-editor-themes");
        s.activeThemeConfig = await ipcRenderer.invoke("get-active-editor-theme");
    }
    renderThemeLists();
}

function switchContext(ctx) {
    currentContext = ctx;

    els.contextBtns.forEach(b => {
        if (b.getAttribute('data-context') === ctx) b.classList.add('active');
        else b.classList.remove('active');
    });

    document.getElementById('app-theme-interface').style.display = ctx === 'app' ? 'block' : 'none';
    document.getElementById('editor-theme-interface').style.display = ctx === 'editor' ? 'block' : 'none';

    els.appPreviewFrame.style.display = ctx === 'app' ? 'block' : 'none';
    els.editorPreviewFrame.style.display = ctx === 'editor' ? 'flex' : 'none';

    const s = getState();
    if (!s.currentEditingId) {
        if (s.activeThemeConfig && s.activeThemeConfig.mode) {
            s.currentMode = s.activeThemeConfig.mode;
        }
        if (s.activeThemeConfig && s.activeThemeConfig.activeId) {
            selectTheme(s.activeThemeConfig.activeId);
            setPreviewMode(s.activeThemeConfig.mode);
        } else if (s.allThemes.length > 0) {
            selectTheme(s.allThemes[0].id);
        }
    } else {
        renderThemeLists();
        updateUIForSelectedTheme();
    }
}

function renderThemeLists() {
    const s = getState();
    els.builtinList.innerHTML = '';
    els.customList.innerHTML = '';

    s.allThemes.forEach(theme => {
        const isActive = theme.id === s.activeThemeConfig.activeId;
        const isEditing = theme.id === s.currentEditingId;

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
    const s = getState();
    const theme = s.allThemes.find(t => t.id === id);
    if (!theme) return;

    s.currentEditingId = id;
    s.currentThemeData = JSON.parse(JSON.stringify(theme));
    clearHistory();

    updateUIForSelectedTheme();

    if (id !== s.activeThemeConfig.activeId) {
        const eventName = currentContext === 'app' ? "set-active-theme" : "set-active-editor-theme";
        ipcRenderer.send(eventName, { id, mode: s.currentMode });
        s.activeThemeConfig.activeId = id;
        renderThemeLists();
    }
}

function updateUIForSelectedTheme() {
    const s = getState();
    if (!s.currentThemeData) return;

    const theme = s.currentThemeData;
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

    els.previewLight.classList.toggle('active', s.currentMode === 'light');
    els.previewDark.classList.toggle('active', s.currentMode === 'dark');
    updateHistoryButtons();
}

function loadColorsIntoEditor() {
    const s = getState();
    if (!s.currentThemeData) return;
    const colors = s.currentThemeData[s.currentMode];

    const currentInterfaceId = currentContext === 'app' ? 'app-theme-interface' : 'editor-theme-interface';
    const interfaceEl = document.getElementById(currentInterfaceId);
    if (!interfaceEl) return;

    const contextColorInputs = interfaceEl.querySelectorAll('input[type="color"]');
    const contextHexInputs = interfaceEl.querySelectorAll('.hex-input');

    contextColorInputs.forEach((input, index) => {
        const varName = input.getAttribute('data-var');
        if (colors[varName]) {
            input.value = colors[varName];
            contextHexInputs[index].value = colors[varName];
        }
    });
}

function saveHistoryState() {
    const s = getState();
    if (!s.currentThemeData) return;
    s.history.past.push(JSON.parse(JSON.stringify(s.currentThemeData[s.currentMode])));
    if (s.history.past.length > s.history.MAX_HISTORY) {
        s.history.past.shift();
    }
    s.history.future = [];
    updateHistoryButtons();
    els.btnSave.disabled = false;
}

function undo() {
    const s = getState();
    if (s.history.past.length === 0) return;

    s.history.future.push(JSON.parse(JSON.stringify(s.currentThemeData[s.currentMode])));
    const previousState = s.history.past.pop();
    s.currentThemeData[s.currentMode] = previousState;

    loadColorsIntoEditor();
    applyPreviewTheme();
    updateHistoryButtons();
    els.btnSave.disabled = false;

    debouncedSave();
}

function redo() {
    const s = getState();
    if (s.history.future.length === 0) return;

    s.history.past.push(JSON.parse(JSON.stringify(s.currentThemeData[s.currentMode])));
    const nextState = s.history.future.pop();
    s.currentThemeData[s.currentMode] = nextState;

    loadColorsIntoEditor();
    applyPreviewTheme();
    updateHistoryButtons();
    els.btnSave.disabled = false;

    debouncedSave();
}

function clearHistory() {
    const s = getState();
    s.history.past = [];
    s.history.future = [];
    updateHistoryButtons();
}

function updateHistoryButtons() {
    const s = getState();
    els.btnUndo.disabled = s.history.past.length === 0;
    els.btnRedo.disabled = s.history.future.length === 0;
}

function applyPreviewTheme() {
    const s = getState();
    if (!s.currentThemeData) return;
    const colors = s.currentThemeData[s.currentMode];

    const targetFrame = currentContext === 'app' ? els.appPreviewFrame : els.editorPreviewFrame;

    for (const [key, value] of Object.entries(colors)) {
        targetFrame.style.setProperty(`--${key}`, value);
    }

    if (s.currentMode === 'dark') {
        targetFrame.classList.add('dark-mode');
    } else {
        targetFrame.classList.remove('dark-mode');
    }
}

function setPreviewMode(mode) {
    const s = getState();
    s.currentMode = mode;
    els.previewLight.classList.toggle('active', mode === 'light');
    els.previewDark.classList.toggle('active', mode === 'dark');

    loadColorsIntoEditor();
    applyPreviewTheme();

    if (s.activeThemeConfig.activeId === s.currentEditingId && s.activeThemeConfig.mode !== mode) {
        const eventName = currentContext === 'app' ? "set-active-theme" : "set-active-editor-theme";
        ipcRenderer.send(eventName, { id: s.currentEditingId, mode });
        s.activeThemeConfig.mode = mode;
    }
}

async function saveTheme() {
    const s = getState();
    if (!s.currentThemeData || !s.currentThemeData.isCustom) return;

    const endpoint = currentContext === 'app' ? "update-theme" : "update-editor-theme";
    const success = await ipcRenderer.invoke(endpoint, s.currentEditingId, {
        light: s.currentThemeData.light,
        dark: s.currentThemeData.dark
    });

    if (success) {
        els.btnSave.disabled = true;
        if (s.activeThemeConfig.activeId === s.currentEditingId) {
            const eventName = currentContext === 'app' ? "set-active-theme" : "set-active-editor-theme";
            ipcRenderer.send(eventName, { id: s.currentEditingId, mode: s.activeThemeConfig.mode });
        }
        await loadThemes();
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
    const s = getState();
    const varName = input.getAttribute('data-var');
    const val = input.value;

    saveHistoryState();
    hexInput.value = val;
    s.currentThemeData[s.currentMode][varName] = val;

    applyPreviewTheme();
    debouncedSave();
}

function handleHexChange(hexInput, colorInput) {
    const s = getState();
    let val = hexInput.value;
    if (!val.startsWith('#')) val = '#' + val;

    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        saveHistoryState();
        colorInput.value = val;
        const varName = colorInput.getAttribute('data-var');
        s.currentThemeData[s.currentMode][varName] = val;

        applyPreviewTheme();
        debouncedSave();
    }
}

async function createTheme(themeName) {
    if (!themeName) return;
    const endpoint = currentContext === 'app' ? "create-theme" : "create-editor-theme";
    const baseId = currentContext === 'app' ? 'classic' : 'classic';
    const theme = await ipcRenderer.invoke(endpoint, themeName, baseId);
    await loadThemes();
    selectTheme(theme.id);
}

async function duplicateTheme() {
    const s = getState();
    if (!s.currentEditingId) return;
    const endpoint = currentContext === 'app' ? "duplicate-theme" : "duplicate-editor-theme";
    const theme = await ipcRenderer.invoke(endpoint, s.currentEditingId);
    if (theme) {
        await loadThemes();
        selectTheme(theme.id);
    }
}

async function deleteTheme() {
    const s = getState();
    if (!s.currentEditingId || !s.currentThemeData.isCustom) return;
    if (confirm(`Are you sure you want to delete '${s.currentThemeData.name}'?`)) {
        const endpoint = currentContext === 'app' ? "delete-theme" : "delete-editor-theme";
        await ipcRenderer.invoke(endpoint, s.currentEditingId);

        if (s.activeThemeConfig.activeId === s.currentEditingId) {
            const eventName = currentContext === 'app' ? "set-active-theme" : "set-active-editor-theme";
            ipcRenderer.send(eventName, { id: s.allThemes[0].id, mode: s.activeThemeConfig.mode });
        }

        await loadThemes();
        selectTheme(s.allThemes[0].id);
    }
}

let dialogAction = null;

function openRenameDialog() {
    const s = getState();
    if (!s.currentEditingId || !s.currentThemeData.isCustom) return;
    dialogAction = 'rename';
    document.querySelector('#rename-dialog h3').textContent = 'Rename Theme';
    els.btnRenameConfirm.textContent = 'Rename';
    els.renameInput.value = s.currentThemeData.name;
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
    const s = getState();
    const inputValue = els.renameInput.value.trim();
    if (!inputValue) return;

    if (dialogAction === 'rename') {
        if (inputValue !== s.currentThemeData.name) {
            const endpoint = currentContext === 'app' ? "rename-theme" : "rename-editor-theme";
            await ipcRenderer.invoke(endpoint, s.currentEditingId, inputValue);
            await loadThemes();
            els.themeName.textContent = inputValue;
            s.currentThemeData.name = inputValue;
        }
    } else if (dialogAction === 'create') {
        await createTheme(inputValue);
    }

    closeRenameDialog();
}

async function importTheme() {
    const dialogEndpoint = currentContext === 'app' ? "show-theme-import-dialog" : "show-editor-theme-import-dialog";
    const jsonStr = await ipcRenderer.invoke(dialogEndpoint);
    if (!jsonStr) return;

    try {
        const importEndpoint = currentContext === 'app' ? "import-theme" : "import-editor-theme";
        const newTheme = await ipcRenderer.invoke(importEndpoint, jsonStr);
        notie.alert({ type: 1, text: "Theme imported successfully!" });
        await loadThemes();
        selectTheme(newTheme.id);
    } catch (err) {
        notie.alert({ type: 3, text: "Failed to import theme. Invalid format." });
    }
}

async function exportTheme() {
    const s = getState();
    if (!s.currentEditingId) return;
    try {
        const exportEndpoint = currentContext === 'app' ? "export-theme" : "export-editor-theme";
        const jsonStr = await ipcRenderer.invoke(exportEndpoint, s.currentEditingId);
        const prefix = currentContext === 'editor' ? 'editor_' : '';
        await ipcRenderer.invoke("save-exported-file", {
            filePath: `${prefix}${s.currentThemeData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_theme.json`,
            content: jsonStr
        });
        notie.alert({ type: 1, text: "Theme exported successfully!" });
    } catch (err) {
    }
}

function setupEventListeners() {
    els.contextBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            switchContext(this.getAttribute('data-context'));
        });
    });

    els.tabBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const parentContainer = this.closest('.theme-interface');
            const btns = parentContainer.querySelectorAll('.editor-tab-btn');
            const contents = parentContainer.querySelectorAll('.editor-tab-content');

            btns.forEach(b => b.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            this.classList.add('active');

            const tabId = this.getAttribute('data-tab');
            const targetContent = document.getElementById(tabId);
            if (targetContent) targetContent.classList.add('active');
        });
    });

    els.colorInputs.forEach((input, index) => {
        input.addEventListener('input', () => handleColorChange(input, els.hexInputs[index]));
    });

    els.hexInputs.forEach((input, index) => {
        input.addEventListener('change', () => handleHexChange(input, els.colorInputs[index]));
        input.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') handleHexChange(input, els.colorInputs[index]);
        });
    });

    const highlightMap = {
        'bg-primary': ['.mockup-window'],
        'text-primary': ['.mockup-window'],
        'text-secondary': ['.mockup-card-info', '.mockup-controls'],
        'text-muted': ['.mockup-muted', '.mockup-card-info i', '.mockup-search'],
        'accent-primary': ['.mockup-accent', '.mockup-active-control'],
        'nav-bg': ['.mockup-nav'],
        'nav-active': ['.mockup-tab.active'],
        'nav-inactive': ['.mockup-tab:not(.active)'],
        'card-bg': ['.mockup-card'],
        'card-border': ['.mockup-card'],
        'search-bg': ['.mockup-search'],
        'search-border': ['.mockup-search'],
        'player-bg': ['.mockup-footer'],
        'progress-color': ['.mockup-progress-bar', '.mockup-progress-bar::after'],
        'control-active': ['.mockup-active-control'],

        // Editor mockups
        'background-color': ['.editor-mockup'],
        'font-color': ['.mockup-editable'],
        'grid-color': ['.mockup-grid-normal'],
        'hover-color': ['.mockup-grid-hover'],
        'active-color': ['.mockup-grid-active'],
        'dot-color': ['.mockup-dot:not(.mockup-dot-active)'],
        'border-color': ['.mockup-editor-bottom', '.mockup-editing'],
        'edit-bg': ['.mockup-editing'],
        'success-color': ['.mockup-btn-save'],
        'error-color': ['.mockup-btn-cancel']
    };

    const colorRows = document.querySelectorAll('.color-row');
    colorRows.forEach(row => {
        row.addEventListener('mouseenter', () => {
            const colorInput = row.querySelector('input[type="color"]');
            if (colorInput) {
                const varName = colorInput.getAttribute('data-var');
                const targets = highlightMap[varName];
                const frame = currentContext === 'app' ? els.appPreviewFrame : els.editorPreviewFrame;

                if (targets) {
                    targets.forEach(selector => {
                        const elsToHighlight = frame.querySelectorAll(selector);
                        if (frame.matches(selector)) {
                            frame.classList.add('highlight-preview');
                        }
                        elsToHighlight.forEach(el => el.classList.add('highlight-preview'));
                    });
                }
            }
        });

        row.addEventListener('mouseleave', () => {
            const frame = currentContext === 'app' ? els.appPreviewFrame : els.editorPreviewFrame;
            const highlighted = frame.querySelectorAll('.highlight-preview');
            highlighted.forEach(el => el.classList.remove('highlight-preview'));
            frame.classList.remove('highlight-preview');
        });
    });

    els.btnUndo.addEventListener('click', undo);
    els.btnRedo.addEventListener('click', redo);
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'z') {
            if (e.shiftKey) redo();
            else undo();
        }
    });

    els.btnSave.addEventListener('click', () => {
        clearTimeout(saveTimeout);
        saveTheme();
        notie.alert({ type: 1, text: "Theme saved", time: 2 });
    });

    els.btnCreate.addEventListener('click', openCreateDialog);
    els.btnDupOverlay.addEventListener('click', duplicateTheme);
    els.btnDuplicate.addEventListener('click', duplicateTheme);
    els.btnDelete.addEventListener('click', deleteTheme);
    els.btnRename.addEventListener('click', openRenameDialog);

    els.btnImport.addEventListener('click', importTheme);
    els.btnExport.addEventListener('click', exportTheme);

    els.previewLight.addEventListener('click', () => setPreviewMode('light'));
    els.previewDark.addEventListener('click', () => setPreviewMode('dark'));

    els.btnRenameCancel.addEventListener('click', closeRenameDialog);
    els.btnRenameConfirm.addEventListener('click', confirmDialogAction);
    els.renameInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') confirmDialogAction();
        if (e.key === 'Escape') closeRenameDialog();
    });
}

document.addEventListener('DOMContentLoaded', init);
