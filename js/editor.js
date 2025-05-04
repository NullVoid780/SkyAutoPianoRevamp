const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

document.addEventListener('DOMContentLoaded', () => {
    let currentActiveGrid = null;
    const keyboardKeys = document.querySelectorAll('#keyboard td');
    let gridBoxes;
    const editableFields = document.querySelectorAll('.editable-field');
    let currentEditingField = null;
    let originalValue = '';
    let keyMapData = null;
    let hasUnsavedChanges = false;

    // Get the sheet index from the URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const sheetIndex = urlParams.get('sheetIndex');

    // Load sheet data
    let sheetData = null;
    if (sheetIndex !== null) {
        try {
            const listSheet = JSON.parse(
                fs.readFileSync(path.join(__dirname, '..', 'data', 'listSheet.json'), {
                    encoding: 'utf8',
                })
            );
            sheetData = listSheet[sheetIndex];
            
            // Load keymap data
            if (sheetData.keyMap) {
                keyMapData = JSON.parse(
                    fs.readFileSync(path.join(__dirname, '..', 'data', sheetData.keyMap), {
                        encoding: 'utf8',
                    })
                );
            }
            
            // Update field values with sheet data
            updateFieldValues(sheetData);
            
            // Generate grid boxes
            generateGridBoxes(keyMapData);
            
            // Initialize grid with keymap data
            initializeGrid(keyMapData);
            
            // Update gridBoxes reference after generation
            gridBoxes = document.querySelectorAll('.grid-box');
            
            // Add event listeners to grid boxes
            setupGridEventListeners();
        } catch (error) {
            console.error('Error loading sheet data:', error);
        }
    }

    function updateFieldValues(data) {
        if (!data) return;
        
        const fields = {
            name: data.name || 'Untitled',
            author: data.author || 'Unknown',
            transcribedBy: data.transcribedBy || 'Unknown',
            bpm: data.bpm || '120'
        };

        editableFields.forEach(field => {
            const fieldType = field.getAttribute('data-field');
            if (fields[fieldType]) {
                field.querySelector('.field-value').textContent = fields[fieldType];
            }
        });
    }

    function generateGridBoxes(keyMapData) {
        if (!keyMapData) return;

        const gridContainer = document.querySelector('.grid-boxes');
        const timestamps = Object.keys(keyMapData).sort((a, b) => parseInt(a) - parseInt(b));
        
        // Clear existing grid boxes
        gridContainer.innerHTML = '';
        
        // Create a box for every timestamp in the keymap
        timestamps.forEach((timeMs, index) => {
            const gridColumn = document.createElement('div');
            gridColumn.className = 'grid-column';
            
            const gridBox = document.createElement('div');
            gridBox.className = 'grid-box';
            gridBox.setAttribute('data-time', timeMs);
            // Add animation delay based on index
            gridBox.style.animationDelay = `${index * 0.05}s`;
            
            // Create grid dots
            for (let j = 0; j < 15; j++) {
                const dot = document.createElement('div');
                dot.setAttribute('data-key', '');
                gridBox.appendChild(dot);
            }
            
            const timestamp = document.createElement('div');
            timestamp.className = 'timestamp';
            // Show time in seconds with milliseconds
            const seconds = Math.floor(parseInt(timeMs) / 1000);
            const ms = parseInt(timeMs) % 1000;
            timestamp.textContent = `${seconds}.${ms.toString().padStart(3, '0')}s`;
            
            gridColumn.appendChild(gridBox);
            gridColumn.appendChild(timestamp);
            gridContainer.appendChild(gridColumn);
        });
    }

    function initializeGrid(keyMapData) {
        if (!keyMapData) return;

        const timestamps = Object.keys(keyMapData).sort((a, b) => parseInt(a) - parseInt(b));
        const gridBoxes = document.querySelectorAll('.grid-box');
        
        gridBoxes.forEach((box) => {
            // Clear existing keys
            const dots = box.querySelectorAll('div');
            dots.forEach(dot => dot.setAttribute('data-key', ''));

            // Get exact timestamp for this grid box
            const timeMs = box.getAttribute('data-time');
            
            // Update grid box with key data if it exists
            if (keyMapData[timeMs] && keyMapData[timeMs].length > 0) {
                keyMapData[timeMs].forEach(key => {
                    const keyIndex = getKeyIndex(key);
                    if (keyIndex >= 0 && keyIndex < dots.length) {
                        dots[keyIndex].setAttribute('data-key', key);
                    }
                });
            }
        });
    }

    function getKeyIndex(key) {
        const keyMap = {
            'y': 0, 'u': 1, 'i': 2, 'o': 3, 'p': 4,
            'h': 5, 'j': 6, 'k': 7, 'l': 8, ';': 9,
            'n': 10, 'm': 11, ',': 12, '.': 13, '/': 14
        };
        return keyMap[key];
    }

    function updateGridBox(box, keys) {
        const dots = box.querySelectorAll('div');
        dots.forEach(dot => dot.setAttribute('data-key', ''));
        
        keys.forEach(key => {
            const keyIndex = getKeyIndex(key);
            if (keyIndex >= 0 && keyIndex < dots.length) {
                dots[keyIndex].setAttribute('data-key', key);
            }
        });
    }

    function saveKeyMapChanges() {
        if (!hasUnsavedChanges || !sheetData || !keyMapData) return;

        try {
            // Save keymap changes
            fs.writeFileSync(
                path.join(__dirname, '..', 'data', sheetData.keyMap),
                JSON.stringify(keyMapData),
                { mode: 0o666 }
            );

            // Notify the main window to update its keymap data
            ipcRenderer.send('keymap-updated', {
                index: parseInt(sheetIndex)
            });
            
            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'save-success-message';
            successMessage.textContent = 'Sheet saved successfully!';
            successMessage.style.position = 'fixed';
            successMessage.style.top = '20px';
            successMessage.style.left = '50%';
            successMessage.style.transform = 'translateX(-50%)';
            successMessage.style.backgroundColor = '#4CAF50';
            successMessage.style.color = 'white';
            successMessage.style.padding = '10px 20px';
            successMessage.style.borderRadius = '4px';
            successMessage.style.zIndex = '1000';
            document.body.appendChild(successMessage);

            // Remove the message after 2 seconds
            setTimeout(() => {
                document.body.removeChild(successMessage);
            }, 2000);

            hasUnsavedChanges = false;
            
            // Hide edit buttons
            const buttons = document.querySelector('#keyboard .edit-buttons');
            buttons.classList.remove('visible');
        } catch (error) {
            console.error('Error saving keymap:', error);
            alert('Failed to save changes to the music sheet');
        }
    }

    function setupGridEventListeners() {
        // Grid click handler
        gridBoxes.forEach(box => {
            box.addEventListener('click', () => {
                const timeMs = box.getAttribute('data-time');
                if (!keyMapData[timeMs]) {
                    keyMapData[timeMs] = [];
                }
                
                // Remove active state from previously selected grid
                if (currentActiveGrid) {
                    currentActiveGrid.classList.remove('active');
                    // Clear keyboard highlights
                    clearKeyboardHighlights();
                }
                
                currentActiveGrid = box;
                currentActiveGrid.classList.add('active');
                
                // Highlight keyboard keys for this timestamp
                highlightKeyboardKeys(timeMs);
                
                // Show edit buttons
                const buttons = document.querySelector('#keyboard .edit-buttons');
                buttons.classList.add('visible');
            });
        });
    }

    // Add these new functions
    function clearKeyboardHighlights() {
        keyboardKeys.forEach(key => {
            key.classList.remove('active');
        });
    }

    function highlightKeyboardKeys(timeMs) {
        clearKeyboardHighlights();
        
        if (keyMapData[timeMs] && keyMapData[timeMs].length > 0) {
            keyMapData[timeMs].forEach(key => {
                const keyElement = findKeyElement(key);
                if (keyElement) {
                    keyElement.classList.add('active');
                }
            });
        }
    }

    function findKeyElement(keyValue) {
        return Array.from(keyboardKeys).find(key => 
            key.querySelector('input').value.toLowerCase() === keyValue.toLowerCase()
        );
    }

    // Update keyboard click handler
    keyboardKeys.forEach(key => {
        key.addEventListener('click', () => {
            if (!currentActiveGrid || !keyMapData) return;
            
            const keyValue = key.querySelector('input').value.toLowerCase();
            const timeMs = currentActiveGrid.getAttribute('data-time');
            
            if (!keyMapData[timeMs]) {
                keyMapData[timeMs] = [];
            }
            
            const keyIndex = keyMapData[timeMs].indexOf(keyValue);
            if (keyIndex === -1) {
                keyMapData[timeMs].push(keyValue);
                key.classList.add('active');
            } else {
                keyMapData[timeMs].splice(keyIndex, 1);
                key.classList.remove('active');
            }
            
            updateGridBox(currentActiveGrid, keyMapData[timeMs]);
            hasUnsavedChanges = true;
        });
    });

    // Add event listeners for editable fields
    editableFields.forEach(field => {
        field.addEventListener('click', () => {
            startEditing(field);
        });
    });

    function startEditing(field) {
        if (currentEditingField) {
            cancelEditing();
        }

        currentEditingField = field;
        field.classList.add('editing');
        const valueSpan = field.querySelector('.field-value');
        originalValue = valueSpan.textContent;
        valueSpan.contentEditable = true;
        valueSpan.classList.add('editing');
        valueSpan.focus();

        // Show edit buttons
        const buttons = document.querySelector('#keyboard .edit-buttons');
        buttons.classList.add('visible');

        // Select text content for easy editing
        const range = document.createRange();
        range.selectNodeContents(valueSpan);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

    function saveEditing() {
        if (!currentEditingField || !sheetData) return;

        const field = currentEditingField;
        const fieldType = field.getAttribute('data-field');
        const valueSpan = field.querySelector('.field-value');
        let newValue = valueSpan.textContent.trim();

        // Validate BPM to be a number
        if (fieldType === 'bpm') {
            const bpmValue = parseInt(newValue);
            if (isNaN(bpmValue) || bpmValue <= 0) {
                alert('Please enter a valid BPM number (must be greater than 0)');
                valueSpan.textContent = originalValue;
                cancelEditing();
                return;
            }
            newValue = bpmValue; // Store as integer, not string
        }

        // Update the sheet data
        sheetData[fieldType] = newValue;

        try {
            // Read current listSheet.json
            const listSheet = JSON.parse(
                fs.readFileSync(path.join(__dirname, '..', 'data', 'listSheet.json'), {
                    encoding: 'utf8',
                })
            );

            // Update the specific sheet
            listSheet[sheetIndex] = sheetData;

            // Save back to file
            fs.writeFileSync(
                path.join(__dirname, '..', 'data', 'listSheet.json'),
                JSON.stringify(listSheet, null, 4)
            );

            // Notify the main window to update its display
            ipcRenderer.send('update-sheet-list', {
                index: parseInt(sheetIndex),
                data: sheetData
            });

            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'save-success-message';
            successMessage.textContent = 'Changes saved successfully!';
            successMessage.style.position = 'fixed';
            successMessage.style.top = '20px';
            successMessage.style.left = '50%';
            successMessage.style.transform = 'translateX(-50%)';
            successMessage.style.backgroundColor = '#4CAF50';
            successMessage.style.color = 'white';
            successMessage.style.padding = '10px 20px';
            successMessage.style.borderRadius = '4px';
            successMessage.style.zIndex = '1000';
            document.body.appendChild(successMessage);

            // Remove the message after 2 seconds
            setTimeout(() => {
                document.body.removeChild(successMessage);
            }, 2000);

            // End editing mode
            endEditing();
        } catch (error) {
            console.error('Error saving sheet data:', error);
            alert('Failed to save changes to the sheet');
            valueSpan.textContent = originalValue;
            endEditing();
        }
    }

    function cancelEditing() {
        if (!currentEditingField) return;
        
        const valueSpan = currentEditingField.querySelector('.field-value');
        valueSpan.textContent = originalValue;
        endEditing();
    }

    function endEditing() {
        if (!currentEditingField) return;

        const valueSpan = currentEditingField.querySelector('.field-value');
        valueSpan.contentEditable = false;
        valueSpan.classList.remove('editing');
        currentEditingField.classList.remove('editing');
        
        // Hide edit buttons
        const buttons = document.querySelector('#keyboard .edit-buttons');
        buttons.classList.remove('visible');
        
        currentEditingField = null;
        originalValue = '';
    }

    // Add event listeners for save and cancel buttons
    const saveBtn = document.querySelector('#keyboard .save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (currentEditingField) {
                saveEditing();
            } else if (hasUnsavedChanges) {
                saveKeyMapChanges();
            }
        });
    }

    const cancelBtn = document.querySelector('#keyboard .cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (currentEditingField) {
                cancelEditing();
            } else if (hasUnsavedChanges) {
                if (confirm('Discard changes to the music sheet?')) {
                    initializeGrid(keyMapData);
                    hasUnsavedChanges = false;
                    const buttons = document.querySelector('#keyboard .edit-buttons');
                    buttons.classList.remove('visible');
                }
            }
        });
    }

    // Add keyboard mapping
    const validKeys = {
        'y': 'y', 'u': 'u', 'i': 'i', 'o': 'o', 'p': 'p',
        'h': 'h', 'j': 'j', 'k': 'k', 'l': 'l', ';': ';',
        'n': 'n', 'm': 'm', ',': ',', '.': '.', '/': '/'
    };

    // Add keyboard input handler
    document.addEventListener('keydown', (e) => {
        // Don't handle keys if we're editing a field
        if (currentEditingField) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                saveEditing();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEditing();
            }
            return;
        }

        const key = e.key.toLowerCase();
        
        // Handle Escape key for grid selection
        if (key === 'escape') {
            const buttons = document.querySelector('#keyboard .edit-buttons');
            buttons.classList.remove('visible');
            if (currentActiveGrid) {
                currentActiveGrid.classList.remove('active');
                clearKeyboardHighlights();
            }
            currentActiveGrid = null;
            return;
        }

        // Handle Ctrl+S for saving
        if (e.ctrlKey && key === 's') {
            e.preventDefault();
            if (hasUnsavedChanges) {
                saveKeyMapChanges();
            }
            return;
        }

        // Only process if it's a valid key and we have an active grid
        if (validKeys[key] && currentActiveGrid && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault(); // Prevent default key behavior

            const timeMs = currentActiveGrid.getAttribute('data-time');
            if (!keyMapData[timeMs]) {
                keyMapData[timeMs] = [];
            }

            // Find the corresponding keyboard key element
            const keyElement = findKeyElement(key);
            
            // Toggle the key in the current timestamp
            const keyIndex = keyMapData[timeMs].indexOf(key);
            if (keyIndex === -1) {
                // Add the key
                keyMapData[timeMs].push(key);
                if (keyElement) {
                    keyElement.classList.add('active');
                }
            } else {
                // Remove the key
                keyMapData[timeMs].splice(keyIndex, 1);
                if (keyElement) {
                    keyElement.classList.remove('active');
                }
            }

            // Update the grid display
            updateGridBox(currentActiveGrid, keyMapData[timeMs]);
            hasUnsavedChanges = true;

            // Visual feedback for the keyboard key
            if (keyElement) {
                keyElement.classList.add('pressed');
                setTimeout(() => {
                    keyElement.classList.remove('pressed');
                }, 100);
            }
        }
    });

    // Add keyboard key release handler for visual feedback
    document.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (validKeys[key]) {
            const keyElement = findKeyElement(key);
            if (keyElement) {
                keyElement.classList.remove('pressed');
            }
        }
    });
}); 