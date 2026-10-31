# HPCL LPG Tech Audit Autofiller

> Fill the HPCL Distributor Request Form grid automatically from a
> CSV sheet — no more typing regulator audit rows by hand.

![Version](https://img.shields.io/badge/version-1.1.0-blue)
![Manifest](https://img.shields.io/badge/manifest-V3-green)
![License](https://img.shields.io/badge/license-LicenseWala%20Subscription-purple)

---

## What it does

LPG distributors file regulator defect audits on the HPCL Tech Audit
portal (`lpgtechaudit.hpcl.co.in`). Each audit means adding rows to the
Distributor Request Form one by one — serial number, CM/L number,
batch number, defect type, consumer name, contact, remarks.

**HPCL LPG Tech Audit Autofiller** does that work for you:

- **CSV upload** — upload your regulator defect sheet (`.csv`) and the
  panel reads every row automatically.
- **Automatic row filling** — rows are added and filled on the form
  grid for you, including the defect-type dropdown (partial matching,
  e.g. "Leak" matches "Leakage").
- **CML list sync** — the panel keeps a CML list widget with custom
  editing, so CM/L numbers stay consistent across audits.
- **Smart safety checks** — duplicate consumer entries are removed and
  blank rows are skipped before filling starts.
- **Auto-generation** — if CM/L or Batch numbers are blank in your
  sheet, realistic values are generated in the correct format
  (7-digit CM/L, `ABMMYY` batch pattern).
- **License protected** — the panel activates with a LicenseWala
  subscription license key and locks automatically when the license
  expires or is blocked.

## How it works

1. Install the extension (see below).
2. Open the HPCL Distributor Request Form — the autofiller panel
   appears on the page.
3. Enter your LicenseWala license key in the panel and click
   **Activate**. (First time only; the license stays saved.)
4. Upload your defect sheet (`.csv`) and click **Start**.
5. Rows fill automatically. Review, then submit on the portal.

## Installation

### Option A — Load unpacked (recommended for now)

1. Download this repository (Code → Download ZIP) and extract it.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the extracted folder.

### Option B — Packaged install

The repository also ships a packaged `hpcl_autofiller.crx` with a
registry install script (`setup_extension.reg`) for multi-computer
deployment, and self-hosted updates via `updates.xml`. See
`autofiller_setup.md` for the detailed installation guide.

> After a version update, the packaged install only picks up the new
> version once the CRX and `updates.xml` are rebuilt for that release.

## Incognito mode

The autofiller also works in Incognito windows:

1. Open `chrome://extensions`, find this extension, and turn on
   **Allow in Incognito**. (Chrome keeps this off by default, and no
   extension can turn it on by itself.)
2. That's it — the license you activated in a normal window works in
   Incognito too, because the extension shares one license state
   (`"incognito": "spanning"` in the manifest).

## License activation

A valid **LicenseWala subscription license** is required. Keys are
issued from the LicenseWala portal
([licensescript.netlify.app](https://licensescript.netlify.app/)).

- Enter your key in the panel's license section and click
  **Activate**. The key is verified online against the LicenseWala
  server, together with an anonymous device identifier.
- While unlicensed, file upload and Start stay disabled — the panel
  cannot fill anything until a valid license is active.
- If the license expires or is blocked, the panel locks again and
  stops any running autofill. Your sheet data is untouched; activate a
  valid license to continue.
- Use **Buy / Renew License** in the panel to reach the LicenseWala
  portal, or **Remove license** to sign out of the current key.

## Preparing your CSV sheet

Save your Excel sheet as **CSV (Comma delimited)**. Headers can be in
any order — the panel matches them by keyword, case-insensitively.
A `sample_audit_template.csv` is included in this repository.

| Header keyword | Target form field | Example |
|---|---|---|
| SerialNo / Serial / SrNo | Regulator serial number | `A123456` |
| CmlNo / CM/L / BIS | CM/L or BIS licence number | `8473928` (blank = auto-generated) |
| BatchNo / Batch | Batch number (ABMMYY) | `AA0525` (blank = auto-generated) |
| DefectType / Defect | Type of defect (dropdown) | `Leakage` / `Broken` |
| ConsumerName / Name | Consumer name | `BIWI JAHIDA KHATUN` |
| ContactNo / Contact / Mobile | Consumer contact number | `9999888877` |
| Remarks / Remark / Note | Remarks | `Replaced regulator` |

## Privacy

- Your CSV data is processed locally in the browser on the portal
  page. It is never uploaded to any server by this extension.
- Only the license key and an anonymous device identifier are sent to
  the LicenseWala server, solely for license verification.
- No data is sold, no advertisers, no third-party tracking.

## Project layout

| File | Purpose |
|---|---|
| `manifest.json` | MV3 manifest (portal match, permissions). |
| `content.js` | The panel + autofill engine + license gating. |
| `hpcl_autofiller.crx` | Packaged build for managed installs. |
| `updates.xml` | Self-hosted update manifest for the packaged build. |
| `setup_extension.reg` | Registry script for multi-computer deployment. |
| `sample_audit_template.csv` | Sample sheet with correct headers. |
| `cml_list.json` | CML list data for the sync widget. |
| `autofiller_setup.md` | Detailed installation guide. |

## Changelog

### v1.1.0

- LicenseWala license gating: panel locks until a verified license
  key is activated; file upload and Start stay disabled while locked;
  background re-verification with grace for transient network issues;
  no bypass paths of any kind.

### v1.0.2 and earlier

- CML Sync widget with custom editing, packaged CRX install, and
  registry-based multi-computer deployment.

## Support

- License keys and subscriptions: [LicenseWala portal](https://licensescript.netlify.app/)
- Email: support@licensewala.com

---

Built for LPG distributors filing HPCL regulator audits.
