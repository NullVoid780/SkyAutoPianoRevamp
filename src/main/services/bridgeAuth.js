
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

const BRIDGE_PATH = path.join(app.getPath('appData'), 'SkyPianoHub', 'bridge.json');

export const BridgeAuth = {
    getToken() {
        try {
            if (!fs.existsSync(BRIDGE_PATH)) {
                return null;
            }

            const content = fs.readFileSync(BRIDGE_PATH, 'utf-8');
            const data = JSON.parse(content);

            if (!data || !data.token || !data.userId || !data.backendUrl || !data.machineId || !data.userAgent) {
                return null;
            }

            return {
                token: data.token,
                userId: data.userId,
                backendUrl: data.backendUrl,
                machineId: data.machineId,
                userAgent: data.userAgent
            };
        } catch (err) {
            console.error('BridgeAuth failed to read token:', err);
            return null;
        }
    },
    hasBridgeFile() {
        return fs.existsSync(BRIDGE_PATH);
    }
};
