
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { app } from 'electron';
import { BridgeAuth } from './bridgeAuth.js';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

export class SheetSyncService {
    constructor() {
        this.localSheetsDir = path.join(app.getAppPath(), 'data');
        if (!fs.existsSync(this.localSheetsDir)) {
            try {
                fs.mkdirSync(this.localSheetsDir, { recursive: true });
            } catch (e) {
                this.localSheetsDir = path.join(app.getPath('userData'), 'data');
                fs.mkdirSync(this.localSheetsDir, { recursive: true });
            }
        }
    }
    async syncSheets() {
        const auth = BridgeAuth.getToken();
        if (!auth) {
            return { success: false, error: 'Auth required' };
        }

        // Use dynamic URL
        const BACKEND_URL = auth.backendUrl;

        // Function to create client
        const createClient = (token) => {
            return axios.create({
                baseURL: BACKEND_URL,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-User-Id': auth.userId,
                    'X-Machine-Id': auth.machineId,
                    'User-Agent': auth.userAgent
                }
            });
        };

        try {
            let client = createClient(auth.token);
            let listRes;
            try {
                listRes = await client.get(`/list/${auth.userId}`);
            } catch (err) {
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    console.log('Token expired, attempting refresh...');
                    const refreshRes = await axios.get(`${BACKEND_URL}/auth/token`, {
                        headers: {
                            'X-User-Id': auth.userId,
                            'X-Machine-Id': auth.machineId,
                            'User-Agent': auth.userAgent
                        }
                    });
                    const newToken = refreshRes.data.token;
                    client = createClient(newToken);
                    listRes = await client.get(`/list/${auth.userId}`);
                } else {
                    throw err;
                }
            }

            const cloudFiles = listRes.data.files || [];
            const localFiles = fs.readdirSync(this.localSheetsDir);

            let downloadedCount = 0;
            let skippedCount = 0;

            for (const filename of cloudFiles) {
                // Always update listSheet.json, otherwise only download new files
                if (!localFiles.includes(filename) || filename === 'listSheet.json') {
                    console.log(`Downloading ${filename}...`);
                    try {
                        const downloadRes = await client.get(`/download/${auth.userId}/${filename}`, {
                            responseType: 'stream'
                        });

                        const destPath = path.join(this.localSheetsDir, filename);
                        const writer = createWriteStream(destPath);
                        await pipeline(downloadRes.data, writer);
                        downloadedCount++;
                    } catch (err) {
                        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                            // Retry once with new token if we didn't already
                            const refreshRes = await axios.get(`${BACKEND_URL}/auth/token`, {
                                headers: {
                                    'X-User-Id': auth.userId,
                                    'X-Machine-Id': auth.machineId,
                                    'User-Agent': auth.userAgent
                                }
                            });
                            const newToken = refreshRes.data.token;
                            client = createClient(newToken);
                            const downloadRes = await client.get(`/download/${auth.userId}/${filename}`, {
                                responseType: 'stream'
                            });
                            const destPath = path.join(this.localSheetsDir, filename);
                            const writer = createWriteStream(destPath);
                            await pipeline(downloadRes.data, writer);
                            downloadedCount++;
                        } else {
                            console.error(`Failed to download ${filename}:`, err.message);
                        }
                    }
                } else {
                    skippedCount++;
                }
            }

            return {
                success: true,
                downloaded: downloadedCount,
                skipped: skippedCount,
                totalCloud: cloudFiles.length
            };

        } catch (err) {
            console.error('Sync failed:', err);
            // Return specific error if refresh failed
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                return { success: false, error: 'Token expired' };
            }
            return { success: false, error: err.message };
        }
    }
    async uploadSheet(filePath) {
        // ... (uploadSheet implementation would need similar retry logic, skipping for brevity as sync was the priority) 
        const auth = BridgeAuth.getToken();
        if (!auth) {
            return { success: false, error: 'Auth required' };
        }

        const BACKEND_URL = auth.backendUrl;

        try {
            const filename = path.basename(filePath);
            const formData = new FormData();
            const fileBuffer = fs.readFileSync(filePath);
            const blob = new Blob([fileBuffer]);

            formData.append('file', blob, filename);
            formData.append('user', auth.userId);

            const createClient = (token) => {
                return axios.create({
                    baseURL: BACKEND_URL,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-User-Id': auth.userId,
                        'X-Machine-Id': auth.machineId,
                        'User-Agent': auth.userAgent
                    }
                });
            };

            let client = createClient(auth.token);
            try {
                await client.post('/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } catch (err) {
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    console.log('Token expired during upload, refreshing...');
                    const refreshRes = await axios.get(`${BACKEND_URL}/auth/token`, {
                        headers: {
                            'X-User-Id': auth.userId,
                            'X-Machine-Id': auth.machineId,
                            'User-Agent': auth.userAgent
                        }
                    });
                    client = createClient(refreshRes.data.token);
                    await client.post('/upload', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                } else {
                    throw err;
                }
            }

            return { success: true };
        } catch (err) {
            console.error('Upload failed:', err);
            return { success: false, error: err.message };
        }
    }

    getSyncStatus() {
        const auth = BridgeAuth.getToken();
        if (!auth) {
            if (BridgeAuth.hasBridgeFile()) {
                return { status: 'expired', message: 'Session expired. Login to SkyPianoHub.' };
            }
            return { status: 'missing', message: 'SkyPianoHub not detected or not logged in.' };
        }
        return { status: 'ready', message: 'Ready to sync.' };
    }
}
