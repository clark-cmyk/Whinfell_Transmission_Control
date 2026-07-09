**Here's the clean migration plan**, written for Grok Build. You can save this as a markdown file.

---

**# Cousins Cleanup & Migration Plan**

**Objective:**  
Audit both repositories, identify every valuable piece of functionality from `Whinfell_BUILD_Cousins`, safely migrate it into the main `Whinfell_Transmission_Control` project, rename things cleanly, and remove all legacy "BUILD-COUSINS" references.

**Current State (Confirmed from GitHub):**
- `Whinfell_BUILD_Cousins` contains the real pipeline code (`whinfell_pipeline/`, `run_csv_download.py`, `data_dictionary.yaml`, daily scripts, score calculation logic, china_policy_track).
- The main project still has old numbered folders and references to "BUILD-COUSINS" in its build version string.

### Phase 0: Full Inventory (Must Do First)

Go through **every file** in both repos and create an inventory table with these columns:
- Original path
- Purpose
- Must Keep? (Yes / No)
- Proposed new path/name in main project
- Notes

**Priority files/folders to catalog:**
- `whinfell_pipeline/` (entire folder)
- `whinfell_pipeline/data_dictionary.yaml`
- `run_csv_download.py`
- `run_batch_collect.py`
- `whinfell_daily_am.sh` + `whinfell_daily_eod.sh`
- `04_Score_Calculation/` 
- `china_policy_track/`
- All `.command` launcher files
- Any scripts in the `scripts/` folder

### Phase 1: Safe Migration

1. Copy all "Must Keep" items from Cousins into the main project.
2. Rename folders and files to modern, clean names (no more `01_`, `08_`, `BUILD-COUSINS`).
3. Update every internal reference to the new paths and names.
4. Make sure the full CSV → hydration → dashboard data flow still works.

### Phase 2: Cleanup

- Remove all references to "BUILD-COUSINS" from version strings, comments, and READMEs.
- Delete or archive purely legacy folders (`01_Strategy_Docs/`, `02_Prompt_Library/`, old `.app` bundles, etc.).
- Update main README with new clean structure.

---

This plan tells Grok Build exactly what to do while still giving it the responsibility to check everything.

Would you like me to make any adjustments before you use it?