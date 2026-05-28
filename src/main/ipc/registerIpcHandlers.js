import fs from "fs";
import path from "node:path";
import { ipcMain, dialog } from "electron/main";

/**
 * Register IPC handlers for the main process.
 * @param {Object} deps dependencies
 * @param {import("../controllers/windowController.js").WindowController} deps.windowController
 * @param {import("../services/configService.js").ConfigService} deps.configService
 * @param {import("../services/autoPlayService.js").AutoPlayService} deps.autoPlayService
 * @param {import("../services/updateService.js").UpdateService} deps.updateService
 * @param {import("../services/themeService.js").ThemeService} deps.themeService
 * @param {import("../services/editorThemeService.js").EditorThemeService} deps.editorThemeService
 */
export function registerIpcHandlers({ windowController, configService, autoPlayService, updateService, themeService, editorThemeService }) {
	const appDirectory = windowController.appDirectory;

	ipcMain.on("changeSetting", () => {
		const updatedConfig = configService.reloadFromDisk();
		const { mainWindow, editorWindow, settingWindow } = windowController;

		for (const win of [mainWindow, editorWindow, settingWindow]) {
			if (win && !win.isDestroyed()) {
				win.webContents.send("config-updated", updatedConfig);
			}
		}
	});

	ipcMain.on("set-theme", (_, theme) => {
		configService.updateThemeConfig({ activeId: theme });

		if (windowController.editorWindow && !windowController.editorWindow.isDestroyed()) {
			windowController.editorWindow.webContents.send("theme-changed", theme);
		}
	});

	// Theme System Handlers
	ipcMain.handle("get-themes", () => {
		return themeService.getAllThemes();
	});

	ipcMain.handle("get-active-theme", () => {
		return configService.value.theme;
	});

	ipcMain.on("set-active-theme", (_, { id, mode }) => {
		configService.updateThemeConfig({ activeId: id, mode });
		const themeData = themeService.getTheme(id);
		
		const { mainWindow, editorWindow, settingsWindow, themeWindow } = windowController;
		for (const win of [mainWindow, editorWindow, settingsWindow, themeWindow]) {
			if (win && !win.isDestroyed()) {
				win.webContents.send("theme-changed", { themeData, mode });
			}
		}
	});

	ipcMain.handle("create-theme", (_, name, baseId) => {
		return themeService.createCustomTheme(name, baseId);
	});

	ipcMain.handle("update-theme", (_, id, partial) => {
		return themeService.updateTheme(id, partial);
	});

	ipcMain.handle("rename-theme", (_, id, newName) => {
		return themeService.renameTheme(id, newName);
	});

	ipcMain.handle("duplicate-theme", (_, id) => {
		return themeService.duplicateTheme(id);
	});

	ipcMain.handle("delete-theme", (_, id) => {
		return themeService.deleteTheme(id);
	});

	ipcMain.handle("export-theme", (_, id) => {
		return themeService.exportTheme(id);
	});

	ipcMain.handle("import-theme", (_, jsonString) => {
		return themeService.importTheme(jsonString);
	});

	ipcMain.handle("show-theme-import-dialog", async () => {
		const win = windowController.themeWindow ?? windowController.mainWindow;
		const result = await dialog.showOpenDialog(win, {
			properties: ['openFile'],
			filters: [{ name: "SkyAutoPiano Theme", extensions: ["json"] }],
		});
		
		if (!result.canceled && result.filePaths.length > 0) {
			return fs.readFileSync(result.filePaths[0], 'utf-8');
		}
		return null;
	});

	// Editor Theme System Handlers
	ipcMain.handle("get-editor-themes", () => {
		return editorThemeService.getAllThemes();
	});

	ipcMain.handle("get-active-editor-theme", () => {
		return configService.value.editorTheme;
	});

	ipcMain.on("set-active-editor-theme", (_, { id, mode }) => {
		configService.updateEditorThemeConfig({ activeId: id, mode });
		const themeData = editorThemeService.getTheme(id);
		
		const { editorWindow, themeWindow } = windowController;
		for (const win of [editorWindow, themeWindow]) {
			if (win && !win.isDestroyed()) {
				win.webContents.send("editor-theme-changed", { themeData, mode });
			}
		}
	});

	ipcMain.handle("create-editor-theme", (_, name, baseId) => {
		return editorThemeService.createCustomTheme(name, baseId);
	});

	ipcMain.handle("update-editor-theme", (_, id, partial) => {
		return editorThemeService.updateTheme(id, partial);
	});

	ipcMain.handle("rename-editor-theme", (_, id, newName) => {
		return editorThemeService.renameTheme(id, newName);
	});

	ipcMain.handle("duplicate-editor-theme", (_, id) => {
		return editorThemeService.duplicateTheme(id);
	});

	ipcMain.handle("delete-editor-theme", (_, id) => {
		return editorThemeService.deleteTheme(id);
	});

	ipcMain.handle("export-editor-theme", (_, id) => {
		return editorThemeService.exportTheme(id);
	});

	ipcMain.handle("import-editor-theme", (_, jsonString) => {
		return editorThemeService.importTheme(jsonString);
	});

	ipcMain.handle("show-editor-theme-import-dialog", async () => {
		const win = windowController.themeWindow ?? windowController.mainWindow;
		const result = await dialog.showOpenDialog(win, {
			properties: ['openFile'],
			filters: [{ name: "SkyAutoPiano Editor Theme", extensions: ["json"] }],
		});
		
		if (!result.canceled && result.filePaths.length > 0) {
			return fs.readFileSync(result.filePaths[0], 'utf-8');
		}
		return null;
	});

	ipcMain.on("openThemeEditor", () => {
		windowController.openThemeEditorWindow();
	});

	ipcMain.on("play", (event, data) => {
		const win = windowController.mainWindow;
		if (!win || win.isDestroyed()) return;

		if (data.isPlay && configService.value.panel.minimizeOnPlay) {
			win.minimize();
		}

		autoPlayService.handlePlayRequest(win, data);
	});

	ipcMain.on("longPressMode", (_, value) => {
		configService.updatePanel({ longPressMode: Boolean(value) });
	});

	ipcMain.on("changeSpeed", (_, value) => {
		configService.updatePanel({ speed: Number(value) });
	});

	ipcMain.on("changeDelayNext", (_, value) => {
		configService.updatePanel({ delayNext: Number(value) });
	});

	ipcMain.on("openSetting", () => {
		windowController.openSettingsWindow();
	});

	ipcMain.on("openSheetEditor", (_, args) => {
		windowController.openSheetEditor(args?.sheetIndex ?? 0);
	});

	ipcMain.on("check-update", async (event) => {
		try {
			const info = await updateService.getVersionInfo();
			event.reply("update-check-response", {
				available: info.currentVersion !== info.latestVersion,
				currentVersion: info.currentVersion,
				latestVersion: info.latestVersion,
			});
		} catch (error) {
			event.reply("update-check-response", {
				available: false,
				error: true,
			});
		}
	});

	ipcMain.on("start-update", async (event) => {
		try {
			const metadata = await updateService.getPackageMetadata();
			const moduleUpdateNeeded =
				metadata.remote.module_version !== metadata.local.module_version ||
				!fs.existsSync(path.join(appDirectory, "node_modules", ".bin"));

			if (moduleUpdateNeeded) {
				await updateService.performModuleUpdate(metadata.remote);
			}

			const result = await updateService.performUpdate({ isManualUpdate: true });
			event.reply("update-status", {
				success: result,
				moduleUpdated: moduleUpdateNeeded,
			});
		} catch (error) {
			console.error("IPC", "Manual update failed", error);
			event.reply("update-status", {
				success: false,
				error: "Failed to complete update. Please try again later.",
			});
		}
	});

	ipcMain.on("update-sheet-list", (_, { index, data }) => {
		try {
			const listSheetPath = path.join(appDirectory, "data", "listSheet.json");
			const sheets = JSON.parse(fs.readFileSync(listSheetPath, "utf-8"));
			sheets[index] = data;
			fs.writeFileSync(listSheetPath, JSON.stringify(sheets, null, 4));

			const win = windowController.mainWindow;
			if (win && !win.isDestroyed()) {
				win.webContents.send("sheet-list-updated", { index, data });
			}
		} catch (error) {
			console.error("IPC", "Failed to update sheet list", error);
		}
	});

	ipcMain.on("keymap-updated", (_, { index }) => {
		const win = windowController.mainWindow;
		if (win && !win.isDestroyed()) {
			win.webContents.send("keymap-updated", { index });
		}
	});

	ipcMain.handle("show-export-dialog", async () => {
		const win = windowController.editorWindow ?? windowController.mainWindow;
		const result = await dialog.showSaveDialog(win, {
			filters: [{ name: "Sky Sheet", extensions: ["json", "txt"] }],
		});
		return result;
	});

	ipcMain.handle("save-exported-file", async (_, { filePath, content }) => {
		try {
			fs.writeFileSync(filePath, content, "utf-8");
			return { success: true };
		} catch (error) {
			return { success: false, error: error.message };
		}
	});
}
