# HPCL LPG Tech Audit Autofiller - Installation Guide

This Chrome Extension helps you automatically fill the **Distributor Request Form** grid on the HPCL Tech Audit portal using a local CSV spreadsheet.

---

## 📂 extension Files

The extension folder `hpcl_autofiller/` contains:
1. `manifest.json`: Configuration mapping scripts to `lpgtechaudit.hpcl.co.in`.
2. `content.js`: Automation script that injects the upload panel, parses files, clicks "+ Click to Add", and fills the inputs.
3. `sample_audit_template.csv`: A sample sheet demonstrating correct header names.

---

## 🛠️ Step 1: Install in Google Chrome (Developer Mode)

Chrome Extensions that are not downloaded from the Web Store can be easily loaded locally:

1. Open **Google Chrome**.
2. Type or paste **`chrome://extensions/`** in the address bar and press Enter.
3. In the top-right corner, **turn ON the toggle** for **`Developer mode`**.
4. In the top-left corner, click **`Load unpacked`**.
5. A folder browser window will open. Navigate to the folder:
   `c:\Users\USER\Music\Retulator entry tol\hpcl_autofiller`
6. Select the **`hpcl_autofiller`** folder and click **Select Folder**.
7. The extension **"HPCL LPG Tech Audit Autofiller"** will now appear in your list!

---

## 📊 Step 2: Prepare your Excel/CSV Sheet

You can maintain your records in Excel. When saving, click **File -> Save As -> CSV (Comma delimited) (\*.csv)**.

Make sure your Excel sheet contains the following column headers (the headers can be in any order, and the script is smart enough to match keywords case-insensitively):

| Header Keyword (any of these will match) | Target Form Field | Example Value |
| --- | --- | --- |
| **SerialNo** / *Serial* / *SrNo* | Serial No. of Regulator (A123456) | `A123456` |
| **CmlNo** / *CM/L* / *BIS* | CM/L No. or BIS Licence No. | `8473928` (or leave empty for auto-generation) |
| **BatchNo** / *Batch* | Batch No. (ABMMYY) | `AA0525` (or leave empty for auto-generation) |
| **DefectType** / *Defect* | Type of Defect (dropdown selector) | `Leakage` / `Broken` |
| **ConsumerName** / *Name* | Consumer Name | `BIWI JAHIDA KHATUN` |
| **ContactNo** / *Contact* / *Mobile* | Consumer Contact No. | `9999888877` |
| **Remarks** / *Remark* / *Note* | Remarks | `Replaced regulator` |

*Note: For the "Type of Defect" dropdown, the script is smart enough to do partial matching (e.g., if you write "Leak", it will select "Leakage" or "Body Leakage" option).*

---

## 🚀 Step 3: Smart Features (New Updates!)

### 1. Auto-Clean & Safety Checks
- **No Duplicate Entries**: The extension scans your uploaded sheet and automatically removes duplicate consumer entries based on their consumer number to prevent multiple submissions.
- **No Blank Entries**: The extension skips rows where the Consumer Name or Consumer Number are blank, preventing bad submissions.

### 2. Auto-Generation of CM/L and Batch Numbers
- If your sheet has blank or missing values for `CM/L No` or `Batch No. (ABMMYY)`:
  - **CM/L**: The extension automatically generates a realistic 7-digit CM/L license number (e.g. `CM/L 9182736`).
  - **Batch No**: The extension automatically generates a randomized batch number matching the correct `ABMMYY` pattern (e.g. `XY0825`).

### 3. Batch Filling (25 rows at a time)
- To prevent browser crashes and ensure HPCL portal stability, the extension fills **25 rows at a time** and then pauses.
- Once paused, you will see a popup/alert and the button will change to:
  `▶️ Resume Auto-Fill (26-50)`
- Simply review the first 25 filled rows, click **Resume Auto-Fill**, and the next 25 rows will be generated and populated instantly.
