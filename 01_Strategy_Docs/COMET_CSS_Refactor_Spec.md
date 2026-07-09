# COMET CSS Refactor Spec — Whinfell Transmission Control (Phase 2.3)

Goal: Make the console feel like a Koyfin-style dashboard using a clean, grid-based CSS shell (header + left nav + central widget grid), without copying proprietary assets. [web:22][web:19]

---

## 1. Global shell

Use a full-height flex shell with a dark canvas and central dashboard area.

```css
.wtc-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #020617; /* near-black, Koyfin-ish dark */
  color: #e5e7eb;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.wtc-main {
  display: flex;
  flex: 1;
}
```

---

## 2. Layout: left nav + dashboard

Left side: narrow nav rail.  
Right side: main dashboard using a vertical stack and grid rows. [web:22]

```css
.wtc-nav {
  width: 220px;
  border-right: 1px solid #1e293b;
  background: #030712;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wtc-dashboard {
  flex: 1;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
```

---

## 3. Header bar

Top band: app name on the left, search + actions on the right.

```css
.wtc-header {
  height: 44px;
  padding: 0 16px;
  border-bottom: 1px solid #1e293b;
  background: #020617;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.wtc-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wtc-app-name {
  font-weight: 600;
  letter-spacing: 0.02em;
}

.wtc-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
```

---

## 4. Search box + actions

Make the search input and Docs/Refresh actions into proper controls.

```css
.wtc-search {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 4px;
  background: #0f172a;
  border: 1px solid #1e293b;
}

.wtc-search input[type="text"],
.wtc-search input[type="search"] {
  border: none;
  outline: none;
  background: transparent;
  color: #e5e7eb;
  font-size: 13px;
  flex: 1;
}

.wtc-search-icon {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 1px solid #475569;
}

.wtc-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.wtc-btn {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #1e293b;
  background: #0f172a;
  color: #e5e7eb;
  font-size: 12px;
  cursor: pointer;
}

.wtc-btn-primary {
  border-color: #22c55e;
  background: #16a34a;
  color: #0b1120;
}
```

---

## 5. Nav items

Turn NAVIGATION / VIEWS / TOOLS etc. into a vertical list of nav items.

```css
.wtc-nav-section-title {
  font-size: 11px;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}

.wtc-nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.wtc-nav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px;
  border-radius: 4px;
  color: #cbd5f5;
  font-size: 12px;
  cursor: pointer;
}

.wtc-nav-item:hover {
  background: #0f172a;
}

.wtc-nav-item-active {
  background: #1e293b;
  color: #f9fafb;
}
```

---

## 6. Widget grid rows

Use grid rows for the central cockpit: Operator, Status, Scenario, Layer 3, Spread, etc. [web:15]

```css
.wtc-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
}

.wtc-row-3col {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px 12px;
}

.wtc-row-full {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
```

---

## 7. Widget cards

Card shell used across all “Node Cockpits” / controls.

```css
.wtc-widget {
  background: #020617;
  border-radius: 8px;
  border: 1px solid #1e293b;
  padding: 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.wtc-widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 500;
  color: #e5e7eb;
}

.wtc-widget-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
}
```

---

## 8. Form controls inside widgets

Normalize labels, inputs, selects, and textareas.

```css
.wtc-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.wtc-label {
  font-size: 11px;
  color: #9ca3af;
}

.wtc-input,
.wtc-select,
.wtc-textarea {
  width: 100%;
  border-radius: 4px;
  border: 1px solid #1e293b;
  background: #0b1120;
  color: #e5e7eb;
  font-size: 12px;
  padding: 4px 6px;
}

.wtc-textarea {
  min-height: 60px;
  resize: vertical;
}
```

---

## 9. KPI chips / status tags

Use pill chips for Operator Precision, Transmission State, etc.

```css
.wtc-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.wtc-chip {
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid #1e293b;
  font-size: 11px;
  color: #e5e7eb;
}

.wtc-chip-ok {
  border-color: #22c55e;
  background: #022c22;
}

.wtc-chip-warn {
  border-color: #f97316;
  background: #451a03;
}

.wtc-chip-risk {
  border-color: #ef4444;
  background: #450a0a;
}
```

---

## 10. Links (Koyfin / Barchart / Docs)

Style the “Open Koyfin / Open Barchart / Master Data Dictionary” links as inline toolbar items.

```css
.wtc-link-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 11px;
}

.wtc-link {
  color: #38bdf8;
  text-decoration: none;
}

.wtc-link:hover {
  text-decoration: underline;
}
```

---

## 11. Freshness / status strip

Use a low-height strip for “Freshness — Imported” and similar statuses.

```css
.wtc-status-strip {
  height: 24px;
  padding: 0 16px;
  border-top: 1px solid #1e293b;
  background: #020617;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #9ca3af;
}
```

---

## 12. Responsive adjustments (optional)

For narrower widths, stack nav and dashboard.

```css
@media (max-width: 900px) {
  .wtc-main {
    flex-direction: column;
  }

  .wtc-nav {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #1e293b;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .wtc-dashboard {
    padding: 8px 10px;
  }

  .wtc-row,
  .wtc-row-3col {
    grid-template-columns: 1fr;
  }
}
```

---