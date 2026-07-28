/**
 * HPCL LPG Tech Audit Form Autofiller - Content Script
 * Injects a modern control panel to parse CSV and automate row additions/fillings.
 */

// Global State
let parsedData = [];
let isAutofilling = false;
let currentFillIndex = 0;
const BATCH_SIZE = 25;

// Suppress known jQuery/portal JS script errors on the page to prevent alert blocks
window.addEventListener("error", function(e) {
    if (e.message && (e.message.includes("Syntax error, unrecognized expression") || e.message.includes("#Name_BIS_LICENCENO#id#") || e.message.includes("#Otherdef#id#"))) {
        e.preventDefault();
        e.stopPropagation();
        return true;
    }
}, true);

// Initialize when page loads
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAutofiller);
} else {
    initAutofiller();
}

function initAutofiller() {
    // Only run on the request form pages
    const isTargetPage = window.location.href.includes("RequestFormDRP.jsp") || 
                         document.body.innerText.includes("Distributor Request Form");
                         
    if (!isTargetPage) return;

    // Create & Inject Control Panel
    injectAutofillPanel();
}

// ==========================================================================
// 1. UI Panel Injector
// ==========================================================================
function injectAutofillPanel() {
    // Remove if already exists
    const existing = document.getElementById("hpcl-autofill-panel");
    if (existing) existing.remove();

    const panel = document.createElement("div");
    panel.id = "hpcl-autofill-panel";
    panel.innerHTML = `
        <div class="panel-handle">
            <span class="panel-title">⚡ Mr.Rahul Script</span>
            <button id="btn-toggle-widget" title="Minimize/Maximize">−</button>
        </div>
        <div id="widget-body" class="widget-body">
            <p class="widget-desc">Upload Regulator defect sheet (.csv) to fill the grid automatically.</p>
            
            <div class="file-picker-wrapper">
                <input type="file" id="autofill-file-input" accept=".csv">
                <label for="autofill-file-input" id="lbl-file-input">
                    📁 Choose CSV File
                </label>
            </div>
            
            <div id="file-info" class="file-info hidden">
                <span id="file-name" class="file-name">template.csv</span>
                <span id="file-rows" class="file-rows">0 rows loaded</span>
            </div>

            <div class="widget-buttons">
                <button id="btn-start-autofill" class="btn-widget-primary" disabled>
                    🚀 Start Auto-Fill
                </button>
                <button id="btn-stop-autofill" class="btn-widget-danger hidden">
                    🛑 Stop
                </button>
            </div>

            <div id="autofill-progress-container" class="progress-bar-container hidden">
                <div class="progress-bar-track">
                    <div id="autofill-progress-bar" class="progress-bar-fill"></div>
                </div>
                <div class="progress-info-labels">
                    <span id="autofill-progress-status">Processing...</span>
                    <span id="autofill-progress-count">0/0</span>
                </div>
            </div>

            <div id="autofill-log" class="autofill-log hidden"></div>
            
            <div style="text-align: center; font-size: 9px; color: #6b7280; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 8px; margin-top: 4px;">
                Copyright © Mr.Rahul Script. All Rights Reserved.
            </div>
        </div>
    `;

    // Inject styles directly in header
    injectStyles();

    document.body.appendChild(panel);

    // Event Bindings
    document.getElementById("btn-toggle-widget").addEventListener("click", toggleWidget);
    document.getElementById("autofill-file-input").addEventListener("change", handleFileSelected);
    document.getElementById("btn-start-autofill").addEventListener("click", startAutofillProcess);
    document.getElementById("btn-stop-autofill").addEventListener("click", stopAutofillProcess);

    // Restore state if saved in localStorage
    restoreStateFromStorage();
}

function toggleWidget() {
    const body = document.getElementById("widget-body");
    const btn = document.getElementById("btn-toggle-widget");
    if (body.classList.contains("minimized")) {
        body.classList.remove("minimized");
        btn.textContent = "−";
    } else {
        body.classList.add("minimized");
        btn.textContent = "+";
    }
}

// Injected CSS Styles
function injectStyles() {
    const styleId = "hpcl-autofill-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
        #hpcl-autofill-panel {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 320px;
            background: rgba(17, 24, 39, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
            z-index: 999999;
            font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
            color: #f3f4f6;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .panel-handle {
            background: linear-gradient(90deg, #1e3a8a, #2563eb);
            padding: 10px 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .panel-title {
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.02em;
        }
        
        #btn-toggle-widget {
            font-size: 16px;
            font-weight: bold;
            color: #ffffff;
            cursor: pointer;
            padding: 0 4px;
            line-height: 1;
        }
        
        .widget-body {
            padding: 14px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-height: 400px;
            overflow-y: auto;
            transition: all 0.3s ease;
        }
        
        .widget-body.minimized {
            display: none !important;
        }
        
        .widget-desc {
            font-size: 11px;
            color: #9ca3af;
            line-height: 1.4;
            margin: 0;
        }
        
        /* File Picker */
        .file-picker-wrapper {
            position: relative;
        }
        
        #autofill-file-input {
            position: absolute;
            width: 100%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
            top: 0;
            left: 0;
        }
        
        #lbl-file-input {
            display: block;
            text-align: center;
            background: #1f2937;
            border: 1px dashed rgba(255, 255, 255, 0.2);
            padding: 10px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        #lbl-file-input:hover {
            background: #374151;
            border-color: #3b82f6;
        }
        
        .file-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.3);
            padding: 8px;
            border-radius: 6px;
            font-size: 11px;
        }
        
        .file-name {
            font-weight: 600;
            color: #60a5fa;
            max-width: 60%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .file-rows {
            color: #9ca3af;
        }
        
        /* Buttons */
        .widget-buttons {
            display: flex;
            gap: 8px;
        }
        
        .btn-widget-primary {
            flex-grow: 1;
            background: #2563eb;
            color: white;
            font-size: 12px;
            font-weight: 600;
            padding: 10px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            transition: background 0.2s ease;
            text-align: center;
        }
        
        .btn-widget-primary:hover:not(:disabled) {
            background: #1d4ed8;
        }
        
        .btn-widget-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .btn-widget-danger {
            background: #ef4444;
            color: white;
            font-size: 12px;
            font-weight: 600;
            padding: 10px 14px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            transition: background 0.2s ease;
        }
        
        .btn-widget-danger:hover {
            background: #dc2626;
        }
        
        /* Progress */
        .progress-bar-container {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-top: 4px;
        }
        
        .progress-bar-track {
            height: 6px;
            background: #374151;
            border-radius: 99px;
            overflow: hidden;
        }
        
        .progress-bar-fill {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #10b981, #059669);
            border-radius: 99px;
            transition: width 0.1s linear;
        }
        
        .progress-info-labels {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #9ca3af;
        }
        
        /* Logs */
        .autofill-log {
            background: #0b0f19;
            border: 1px solid #1f2937;
            padding: 8px;
            border-radius: 6px;
            max-height: 80px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 10px;
            color: #10b981;
            white-space: pre-wrap;
            line-height: 1.4;
        }
        
        .hidden {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
}

// ==========================================================================
// 2. CSV Parser Engine
// ==========================================================================
function handleFileSelected(e) {
    const file = e.target.files[0];
    if (!file) return;

    const lbl = document.getElementById("lbl-file-input");
    const fileInfo = document.getElementById("file-info");
    const fileNameEl = document.getElementById("file-name");
    const fileRowsEl = document.getElementById("file-rows");
    const btnStart = document.getElementById("btn-start-autofill");

    lbl.innerHTML = `📁 Change File`;
    fileNameEl.textContent = file.name;

    // Reset index on loading a new file
    currentFillIndex = 0;
    btnStart.textContent = "🚀 Start Auto-Fill";

    const reader = new FileReader();
    reader.onload = function(evt) {
        const text = evt.target.result;
        const rawData = parseCSV(text);
        
        // Filter out blank and duplicate records by Consumer Number
        const uniqueRecords = [];
        const seenNos = new Set();
        
        rawData.forEach(row => {
            const keys = Object.keys(row);
            
            const consumerNoKey = keys.find(h => {
                const clean = h.trim().toLowerCase().replace(/[\s_\-\.]/g, '');
                return clean.includes("consumerno") || 
                       clean.includes("customerno") || 
                       clean.includes("consumerid") || 
                       clean.includes("customerid") ||
                       clean === "consumerno" ||
                       clean === "customerno";
            });
            
            const nameKey = keys.find(h => {
                const clean = h.trim().toLowerCase().replace(/[\s_\-\.]/g, '');
                return clean === "customername" || clean === "consumername" || clean === "name";
            });

            const consumerNo = consumerNoKey ? row[consumerNoKey].toString().trim().replace(/^'/, '') : "";
            const name = nameKey ? row[nameKey].toString().trim() : "";
            
            // Check if blank
            if (!consumerNo || !name) {
                return; // skip blank entry
            }
            
            // Check duplicate
            if (seenNos.has(consumerNo)) {
                return; // skip duplicate
            }
            
            seenNos.add(consumerNo);
            uniqueRecords.push(row);
        });

        parsedData = uniqueRecords;
        saveStateToStorage(file.name);
        
        if (parsedData.length > 0) {
            fileRowsEl.textContent = `${parsedData.length} records loaded`;
            fileInfo.classList.remove("hidden");
            btnStart.disabled = false;
        } else {
            alert("No valid rows parsed. Make sure Name and Consumer No are not blank.");
            btnStart.disabled = true;
        }
    };
    reader.readAsText(file, "UTF-8");
}

function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return [];
    
    // Parse headers
    const headers = parseCSVLine(lines[0]);
    const records = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = parseCSVLine(line);
        const record = {};
        
        headers.forEach((header, index) => {
            record[header] = values[index] !== undefined ? values[index] : '';
        });
        
        records.push(record);
    }
    return records;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    
    // Clean up surrounding quotes and trim
    return result.map(v => v.replace(/^"|"$/g, '').trim());
}

// Mapping flexible headers to HPCL fields
function mapCSVRecord(record) {
    const mapped = {
        SerialNo: "",
        CmlNo: "CM/L ", // Prefix default
        BatchNo: "",
        DefectType: "",
        ConsumerName: "",
        ContactNo: "",
        Remarks: "Ok"
    };

    for (let key in record) {
        const k = key.toLowerCase().replace(/[\s_\-\.]/g, '');
        const val = record[key].trim();
        
        // Match Regulator Serial Number (Priority to 'Old Regulator No' column)
        if (k.includes("oldregulator") || k === "oldregulatorno") {
            mapped.SerialNo = val.replace(/[\s_\-]/g, '');
        } else if ((k.includes("serial") || k.includes("regulatorno") || k.includes("srno")) && !k.includes("newregulator")) {
            // Only write if we haven't matched oldregulator specifically
            if (!mapped.SerialNo) {
                mapped.SerialNo = val.replace(/[\s_\-]/g, '');
            }
        }
        
        // Match CML / License
        if (k.includes("cml") || k.includes("bis") || k.includes("license")) {
            if (val.toLowerCase().startsWith("cm/l")) {
                mapped.CmlNo = val;
            } else {
                mapped.CmlNo = "CM/L " + val;
            }
        } 
        
        // Match Batch No
        if (k.includes("batch")) {
            mapped.BatchNo = val;
        } 
        
        // Match Defect Type
        if (k.includes("defect") || k.includes("type")) {
            mapped.DefectType = val;
        } 
        
        // Match Consumer Name (Excel has 'Customer Name')
        if (k === "customername" || k === "consumername" || k.includes("name")) {
            // Keep priority for customername/consumername over generic 'name'
            if (k === "customername" || k === "consumername" || !mapped.ConsumerName) {
                mapped.ConsumerName = val;
            }
        } 
        
        // Match Contact Number (Excel has 'Consumer Contact No.')
        if (k === "consumercontactno" || k === "customercontactno" || k.includes("contact") || k.includes("mobile") || k.includes("phone")) {
            if (k === "consumercontactno" || k === "customercontactno" || !mapped.ContactNo) {
                mapped.ContactNo = val;
            }
        } 
        
        // Match Remarks
        if (k.includes("remark") || k.includes("note")) {
            mapped.Remarks = val;
        }
    }

    // Generate random fallbacks for CM/L and Batch No. if empty or not valid
    if (!mapped.CmlNo || mapped.CmlNo === "CM/L " || mapped.CmlNo === "CM/L") {
        mapped.CmlNo = generateRandomCmlNo();
    }
    if (!mapped.BatchNo || mapped.BatchNo === "") {
        mapped.BatchNo = generateRandomBatchNo();
    }

    // Auto-determine Remarks based on DefectType if remarks are blank or default "Ok"
    if (!mapped.Remarks || mapped.Remarks.toLowerCase() === "ok" || mapped.Remarks.trim() === "") {
        mapped.Remarks = determineRemarksFromDefect(mapped.DefectType);
    }

    return mapped;
}

function generateRandomBatchNo() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const ab = letters.charAt(Math.floor(Math.random() * 26)) + letters.charAt(Math.floor(Math.random() * 26));
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const year = String(Math.floor(Math.random() * 3) + 24); // 24, 25, 26
    return ab + month + year;
}

function generateRandomCmlNo() {
    // Specific registered supplier CM/L numbers provided by the user
    const validCmls = [
        "9354585",    // United Associates
        "8230360",    // Mauria Udyog Ltd
        "8926296",    // Raghav Die Casting
        "9205063",    // Hari Engineering Works
        "8700103212"  // Shivansh Machinery Company LLP
    ];
    const index = Math.floor(Math.random() * validCmls.length);
    return validCmls[index];
}

function determineRemarksFromDefect(defectType) {
    if (!defectType) return "Ok";
    
    const defectLower = defectType.toLowerCase().trim();
    
    if (defectLower.includes("leak")) {
        return "Leakage";
    }
    if (defectLower.includes("damage") || defectLower.includes("damege")) {
        return "Regulator damage";
    }
    if (defectLower.includes("knob")) {
        return "Knob defect";
    }
    if (defectLower.includes("fitment")) {
        return "Fitment issues";
    }
    if (defectLower.includes("packaging")) {
        return "Packaging defect";
    }
    
    return "Ok";
}

// ==========================================================================
// 3. Browser Automation Core
// ==========================================================================
async function startAutofillProcess() {
    if (parsedData.length === 0) return;
    
    isAutofilling = true;
    
    // UI states updating
    document.getElementById("btn-start-autofill").classList.add("hidden");
    document.getElementById("btn-stop-autofill").classList.remove("hidden");
    
    const progressContainer = document.getElementById("autofill-progress-container");
    const progressBar = document.getElementById("autofill-progress-bar");
    const statusText = document.getElementById("autofill-progress-status");
    const countText = document.getElementById("autofill-progress-count");
    
    const logBox = document.getElementById("autofill-log");
    
    progressContainer.classList.remove("hidden");
    logBox.classList.remove("hidden");
    
    // Determine bounds for this 25-item batch
    const batchEndIndex = Math.min(currentFillIndex + BATCH_SIZE, parsedData.length);
    
    // Only clear logs if it's the very first batch start
    if (currentFillIndex === 0) {
        logBox.innerHTML = "";
        log("Initializing form automation...");
    }
    
    log(`Starting batch fill: rows ${currentFillIndex + 1} to ${batchEndIndex}...`);
    
    try {
        // Step 1: Ensure enough rows exist for this batch
        log(`Generating grid rows. Target: ${batchEndIndex}...`);
        statusText.textContent = "Creating rows...";
        await ensureGridRows(batchEndIndex);
        
        // Step 2: Fill rows in this batch range
        log("Filling rows with details...");
        const rows = getFormRows();
        
        for (let i = currentFillIndex; i < batchEndIndex; i++) {
            if (!isAutofilling) {
                log("Autofill paused.");
                break;
            }
            
            const tr = rows[i];
            if (!tr) continue;

            // Sanitize `#id#` placeholders in element attributes for this row
            sanitizeRowPlaceholders(tr, i);
            
            const record = mapCSVRecord(parsedData[i]);
            
            // Highlight active row temporarily
            const originalBg = tr.style.backgroundColor;
            tr.style.backgroundColor = "rgba(59, 130, 246, 0.15)";
            
            fillFormRow(tr, record);
            
            // Wait 10ms to let browser draw before clearing highlighting
            await new Promise(r => setTimeout(r, 10));
            tr.style.backgroundColor = originalBg;
            
            // Progress Updates
            const percent = ((i + 1) / parsedData.length) * 100;
            progressBar.style.width = `${percent}%`;
            countText.textContent = `${i + 1}/${parsedData.length}`;
            statusText.textContent = `Filling rows...`;
            
            if ((i + 1) % 5 === 0 || i === batchEndIndex - 1) {
                log(`Filled row ${i + 1} of ${parsedData.length}`);
            }
        }
        
        if (isAutofilling) {
            currentFillIndex = batchEndIndex;
            if (currentFillIndex >= parsedData.length) {
                log("🎉 Form Auto-Fill complete!");
                statusText.textContent = "Finished!";
                currentFillIndex = 0; // reset for next run
                clearStateStorage();
                const btnStart = document.getElementById("btn-start-autofill");
                btnStart.textContent = "🚀 Start Auto-Fill";
                alert(`Auto-filled all ${parsedData.length} rows successfully. Please review the details before clicking Save/Submit!`);
            } else {
                log(`⏸️ Paused after filling ${currentFillIndex} rows.`);
                statusText.textContent = "Paused";
                saveStateToStorage();
                const nextBatchEnd = Math.min(currentFillIndex + BATCH_SIZE, parsedData.length);
                const btnStart = document.getElementById("btn-start-autofill");
                btnStart.textContent = `▶️ Resume Auto-Fill (${currentFillIndex + 1}-${nextBatchEnd})`;
                alert(`Autofill Paused: Successfully filled 25 rows (Total: ${currentFillIndex}/${parsedData.length}).\nClick 'Resume' to continue with the next batch.`);
            }
        }
        
    } catch (err) {
        log(`❌ Error: ${err.message}`);
        statusText.textContent = "Failed";
        console.error(err);
        alert("Autofill stopped due to error: " + err.message);
    } finally {
        stopAutofillProcess();
    }
}

function stopAutofillProcess() {
    isAutofilling = false;
    document.getElementById("btn-start-autofill").classList.remove("hidden");
    document.getElementById("btn-stop-autofill").classList.add("hidden");
}

function log(msg) {
    const logBox = document.getElementById("autofill-log");
    logBox.textContent += `[${new Date().toLocaleTimeString()}] ${msg}\n`;
    logBox.scrollTop = logBox.scrollHeight;
}

// Ensure the HTML grid has enough rows
async function ensureGridRows(targetCount) {
    const addButton = findAddButton();
    if (!addButton) {
        throw new Error("Could not locate the '+ Click to Add' button. Ensure you are logged in on the request form.");
    }
    
    let rows = getFormRows();
    let prevCount = rows.length;
    let attemptsWithoutChange = 0;
    
    while (rows.length < targetCount) {
        if (!isAutofilling) return;
        
        addButton.click();
        
        // Wait for DOM to register the add
        await new Promise(r => setTimeout(r, 80));
        
        rows = getFormRows();
        
        // Safety lock in case clicking "+ Click to Add" fails to add elements
        if (rows.length === prevCount) {
            attemptsWithoutChange++;
            if (attemptsWithoutChange > 15) {
                throw new Error("Add row button is unresponsive. Cannot generate new rows.");
            }
        } else {
            prevCount = rows.length;
            attemptsWithoutChange = 0;
        }
    }
}

function getFormRows() {
    // Find rows containing audit inputs
    const allRows = Array.from(document.querySelectorAll("table tr"));
    return allRows.filter(tr => {
        // Ignore hidden rows / template rows
        if (tr.style.display === "none" || tr.classList.contains("hidden") || tr.offsetHeight === 0) {
            return false;
        }
        const inputs = tr.querySelectorAll("input, select, textarea");
        // An active row has at least 5-6 input fields
        return inputs.length >= 5;
    });
}

function findAddButton() {
    const elements = Array.from(document.querySelectorAll("a, button, span, div, img, input"));
    
    // 1. Check direct text or value match
    for (let el of elements) {
        // Check input value (for button/submit inputs)
        if (el.tagName === 'INPUT' && el.value && el.value.toLowerCase().includes("add")) {
            return el;
        }
        if (el.textContent && el.textContent.toLowerCase().includes("add")) {
            return el;
        }
    }
    
    // 2. Check image sources or input src containing add keywords
    for (let el of elements) {
        if ((el.tagName === 'IMG' || el.tagName === 'INPUT') && el.src && (el.src.includes("add") || el.src.includes("plus"))) {
            // Return anchor wrap
            if (el.parentElement.tagName === 'A' || el.parentElement.tagName === 'BUTTON') {
                return el.parentElement;
            }
            return el;
        }
    }

    // 3. Fallback: Check for class names or onclick containing add row keyword
    for (let el of elements) {
        const className = el.className ? el.className.toString().toLowerCase() : "";
        const onclickAttr = el.getAttribute ? (el.getAttribute("onclick") || "").toString().toLowerCase() : "";
        if (className.includes("addrow") || className.includes("add-row") || onclickAttr.includes("addrow") || onclickAttr.includes("add-row")) {
            return el;
        }
    }
    
    return null;
}

function sanitizeRowPlaceholders(tr, rowIndex) {
    let actualIndex = rowIndex + 1;
    const inputs = Array.from(tr.querySelectorAll("input, select, textarea"));
    
    // Try to find any input that already has a number suffix in its ID
    for (let el of inputs) {
        if (el.id) {
            const match = el.id.match(/\d+$/);
            if (match) {
                actualIndex = parseInt(match[0]);
                break;
            }
        }
    }
    
    // Replace #id# or other placeholders in all inputs of this row
    inputs.forEach(el => {
        const attrs = ["onchange", "onclick", "id", "name"];
        attrs.forEach(attrName => {
            const attrVal = el.getAttribute(attrName);
            if (attrVal && (attrVal.includes("#id#") || attrVal.includes("[id]"))) {
                const newVal = attrVal.replace(/#id#/g, actualIndex).replace(/\[id\]/g, actualIndex);
                el.setAttribute(attrName, newVal);
                
                // Recompile event handlers to make sure browser binds the new code
                if (attrName === "onchange") {
                    el.onchange = new Function("event", newVal);
                } else if (attrName === "onclick") {
                    el.onclick = new Function("event", newVal);
                }
            }
        });
    });
}

// ==========================================================================
// 4. Element Autofilling Engine
// ==========================================================================
function fillFormRow(tr, record) {
    const cells = tr.cells || tr.querySelectorAll("td");
    if (!cells || cells.length < 8) return;
    
    // 1. Serial No. of Regulator (Cell index 2)
    const serialInput = cells[2].querySelector("input");
    if (serialInput && record.SerialNo !== undefined) {
        setElementValue(serialInput, record.SerialNo);
    }
    
    // 2. CM/L No. (Cell index 3)
    const cmlInputs = Array.from(cells[3].querySelectorAll("input"));
    const cmlInput = cmlInputs.length > 1 ? cmlInputs.find(inp => !inp.readOnly) || cmlInputs[1] : cmlInputs[0];
    if (cmlInput && record.CmlNo !== undefined) {
        // Remove prefix word 'CM/L' or any other letters, keeping only the number digits
        const cleanCml = record.CmlNo.toString().toUpperCase().replace(/CM\/L/g, '').replace(/[^0-9]/g, '').trim();
        setElementValue(cmlInput, cleanCml);
    }
    
    // 3. Batch No. (Cell index 4)
    const batchInput = cells[4].querySelector("input");
    if (batchInput && record.BatchNo !== undefined) {
        setElementValue(batchInput, record.BatchNo);
    }
    
    // 4. Type of Defect (Cell index 5)
    const selectEl = cells[5].querySelector("select");
    if (selectEl && record.DefectType !== undefined) {
        setSelectOption(selectEl, record.DefectType);
    }
    
    // 5. Consumer Name (Cell index 6)
    const nameInput = cells[6].querySelector("input");
    if (nameInput && record.ConsumerName !== undefined) {
        setElementValue(nameInput, record.ConsumerName);
    }
    
    // 6. Consumer Contact No. (Cell index 7)
    const contactInput = cells[7].querySelector("input");
    if (contactInput && record.ContactNo !== undefined) {
        setElementValue(contactInput, record.ContactNo);
    }
    
    // 7. Remarks (Cell index 8)
    const remarksInput = cells[8].querySelector("input, textarea");
    if (remarksInput && record.Remarks !== undefined) {
        setElementValue(remarksInput, record.Remarks);
    }
}

function setElementValue(element, value) {
    element.value = value;
    // Dispatch events to activate site hooks
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
}

function setSelectOption(selectEl, defectVal) {
    if (!defectVal) return;
    
    const options = Array.from(selectEl.options);
    let selectedOptionValue = "";

    // 1. Try Exact match (text or value)
    let match = options.find(opt => 
        opt.value.toLowerCase() === defectVal.toLowerCase() || 
        opt.text.toLowerCase().trim() === defectVal.toLowerCase()
    );

    // 2. Try Partial text containment (e.g. "leak" matches "body leakage")
    if (!match) {
        match = options.find(opt => 
            opt.text.toLowerCase().includes(defectVal.toLowerCase()) || 
            opt.value.toLowerCase().includes(defectVal.toLowerCase())
        );
    }

    if (match) {
        selectedOptionValue = match.value;
    } else {
        // Fallback: If no match, try using option at index 1 (usually first valid defect option)
        if (options.length > 1) {
            selectedOptionValue = options[1].value;
        }
    }

    if (selectedOptionValue) {
        selectEl.value = selectedOptionValue;
        selectEl.dispatchEvent(new Event("change", { bubbles: true }));
    }
}

// ==========================================================================
// 5. Local Storage State Persistence Helpers
// ==========================================================================
function saveStateToStorage(fileName) {
    try {
        localStorage.setItem("hpcl_autofill_parsedData", JSON.stringify(parsedData));
        localStorage.setItem("hpcl_autofill_currentFillIndex", currentFillIndex.toString());
        if (fileName) {
            localStorage.setItem("hpcl_autofill_fileName", fileName);
        }
    } catch (e) {
        console.error("Failed to save state to localStorage:", e);
    }
}

function restoreStateFromStorage() {
    try {
        const savedData = localStorage.getItem("hpcl_autofill_parsedData");
        const savedIndex = localStorage.getItem("hpcl_autofill_currentFillIndex");
        const savedFileName = localStorage.getItem("hpcl_autofill_fileName");
        
        if (savedData && savedFileName) {
            parsedData = JSON.parse(savedData);
            currentFillIndex = parseInt(savedIndex) || 0;
            
            const fileInfo = document.getElementById("file-info");
            const fileNameEl = document.getElementById("file-name");
            const fileRowsEl = document.getElementById("file-rows");
            const btnStart = document.getElementById("btn-start-autofill");
            const lbl = document.getElementById("lbl-file-input");
            
            lbl.innerHTML = `📁 Change File`;
            fileNameEl.textContent = savedFileName;
            fileRowsEl.textContent = `${parsedData.length} records loaded`;
            fileInfo.classList.remove("hidden");
            btnStart.disabled = false;
            
            const nextBatchEnd = Math.min(currentFillIndex + BATCH_SIZE, parsedData.length);
            if (currentFillIndex > 0) {
                if (currentFillIndex >= parsedData.length) {
                    btnStart.textContent = "🚀 Start Auto-Fill";
                    currentFillIndex = 0;
                    saveStateToStorage();
                } else {
                    btnStart.textContent = `▶️ Resume Auto-Fill (${currentFillIndex + 1}-${nextBatchEnd})`;
                    
                    // Show progress UI
                    const progressContainer = document.getElementById("autofill-progress-container");
                    const progressBar = document.getElementById("autofill-progress-bar");
                    const statusText = document.getElementById("autofill-progress-status");
                    const countText = document.getElementById("autofill-progress-count");
                    
                    progressContainer.classList.remove("hidden");
                    statusText.textContent = "Paused";
                    countText.textContent = `${currentFillIndex}/${parsedData.length}`;
                    progressBar.style.width = `${(currentFillIndex / parsedData.length) * 100}%`;
                }
            } else {
                btnStart.textContent = "🚀 Start Auto-Fill";
            }
        }
    } catch (e) {
        console.error("Failed to restore state from localStorage:", e);
    }
}

function clearStateStorage() {
    try {
        localStorage.removeItem("hpcl_autofill_parsedData");
        localStorage.removeItem("hpcl_autofill_currentFillIndex");
        localStorage.removeItem("hpcl_autofill_fileName");
    } catch (e) {
        console.error("Failed to clear localStorage state:", e);
    }
}
