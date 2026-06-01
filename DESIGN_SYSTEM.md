# AreaIntel — Design System

The implementation contract for `DESIGN_PHILOSOPHY.md`. Tokens are expressed as CSS custom properties so they can be dropped into `:root` and referenced everywhere. Values are chosen to (a) match AreaIntel's existing look, (b) meet WCAG AA contrast, and (c) formalize the trust/status language.

> **Scope guardrail:** this system changes *presentation only*. No scoring, recommendation logic, API, data source, or workflow changes.

---

## 1. Color tokens

### Brand & neutral
```css
:root {
  /* Brand */
  --ai-navy-900: #0b1c2e;   /* deepest surface (assistant, terminal) */
  --ai-navy-800: #0e2238;
  --ai-navy-700: #103450;
  --ai-ink:      #0f2233;   /* primary text on light */
  --ai-teal-600: #0e7490;   /* single brand accent */
  --ai-teal-500: #14b8a6;
  --ai-gold:     #f3c744;   /* liberty mark / NYC accent only */

  /* Neutrals (light report canvas) */
  --ai-bg:        #f4f7f9;  /* app background */
  --ai-surface:   #ffffff;  /* cards */
  --ai-surface-2: #f7fbfc;  /* subtle fills */
  --ai-border:    #d8e2e8;  /* hairlines */
  --ai-muted:     #5a6b75;  /* secondary text (>=4.5:1 on white) */
  --ai-muted-2:   #6b7c86;
}
```

### Status system (semantic — never decorative)
Each status has three roles: **fg** (text/icon, AA on its tint), **bg** (tint), **accent** (dot/bar/border). Status is rendered as **dot + label + color** — never color alone.

| Status | Meaning | Token prefix | fg | bg | accent |
|---|---|---|---|---|---|
| **Verified** | Backed by live, fetched data | `--st-verified-*` | `#08724a` | `#e5f7ef` | `#0e9f6e` |
| **Modeled** | Output of AreaIntel's model | `--st-modeled-*` | `#9a5b09` | `#fff4e2` | `#e0a23a` |
| **Estimated** | Derived heuristic / proxy | `--st-estimated-*` | `#0f5f9a` | `#e7f1fb` | `#2f8fd6` |
| **Research In Progress** | Loading / pending fetch | `--st-research-*` | `#51606b` | `#eef2f6` | `#8aa0b4` |
| **Risk** | Negative / caution signal | `--st-risk-*` | `#963226` | `#f9e4df` | `#d9534f` |

```css
:root {
  --st-verified-fg:#08724a; --st-verified-bg:#e5f7ef; --st-verified-accent:#0e9f6e;
  --st-modeled-fg:#9a5b09;  --st-modeled-bg:#fff4e2;  --st-modeled-accent:#e0a23a;
  --st-estimated-fg:#0f5f9a;--st-estimated-bg:#e7f1fb; --st-estimated-accent:#2f8fd6;
  --st-research-fg:#51606b; --st-research-bg:#eef2f6;  --st-research-accent:#8aa0b4;
  --st-risk-fg:#963226;     --st-risk-bg:#f9e4df;      --st-risk-accent:#d9534f;
}
```

**Migration from current code:** `status-connected → Verified`, `status-modeled → Modeled`, `status-refreshing → Research In Progress`. Add **Estimated** (blue) and **Risk** (red) as new states. The signals strip, evidence cards, source pills, compare table, exec PDF, and assistant context all consume these same tokens.

## 2. Status vocabulary (copy rules)

**Never write:** `Unknown` · `Data Unavailable` · `Not Known`.
**Instead write (escalating):**
- `Needs Validation` — we have a value but it's modeled/estimated.
- `Additional Verification Recommended` — directional; confirm before relying.
- `Research In Progress` — fetch pending.
- `Site Visit Required` — only on‑site observation resolves it (e.g., true foot traffic, frontage).
- `Due Diligence Required` — legal/financial/operator items outside our data.

"Confidence" copy always carries: *"= how much of this report is backed by live data, not the odds of success."*

## 3. Typography scale

Stack (system-first; optional Inter): `font-family: "Inter", -apple-system, "Segoe UI", Roboto, system-ui, sans-serif;` Numbers use `font-variant-numeric: tabular-nums;`

| Token | rem (clamp) | Use |
|---|---|---|
| `--fs-display` | `clamp(1.7rem, 2.6vw, 2.6rem)` | Report hero title (max 2–3 lines, `text-wrap:balance`, `overflow-wrap:break-word`) |
| `--fs-h2` | `clamp(1.25rem,1.8vw,1.6rem)` | Panel headings |
| `--fs-h3` | `1.05rem` | Card headings |
| `--fs-metric` | `clamp(1.6rem,2.4vw,2.4rem)` | Big numbers (tabular) |
| `--fs-body` | `0.95rem` | Body |
| `--fs-sm` | `0.84rem` | Secondary |
| `--fs-label` | `0.72rem` | Uppercase labels (`letter-spacing:.06em`) |
| `--fs-micro` | `0.68rem` | Chips, footnotes |

Line-height: headings `1.1`, body `1.5`, labels `1.2`. **Rule:** every metric pairs a `--fs-metric` value with a `--fs-label` caption — no naked numbers.

## 4. Spacing scale (4px base)
```css
--sp-1:4px; --sp-2:8px; --sp-3:12px; --sp-4:16px; --sp-5:20px;
--sp-6:24px; --sp-8:32px; --sp-10:40px; --sp-12:48px; --sp-16:64px;
```
Card padding `--sp-4/--sp-5`; section gap `--sp-5/--sp-6`; page gutters `--sp-5` mobile → `--sp-8` desktop. Bottom clearance for the floating assistant: `--sp-16` + safe-area.

## 5. Radius, elevation, motion
```css
--radius-sm:10px; --radius:14px; --radius-lg:20px; --radius-pill:999px;
--shadow-card: 0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.06);
--shadow-pop:  0 28px 70px rgba(5,16,28,.5);
--ease: cubic-bezier(.2,.7,.2,1); --dur:160ms;   /* reduced-motion: 0 */
```
Premium = restraint: shadows are soft and few; motion is ≤200ms and disabled under `prefers-reduced-motion`.

## 6. Card system

One base, four variants — all share radius, border, padding, `--shadow-card`, `break-inside:avoid` for print.
- **`.card`** — white surface, hairline border.
- **`.card--metric`** — label (`--fs-label`) on top, value (`--fs-metric`, tabular) below, optional meter; **tooltip via `title`** explaining higher‑vs‑lower + source.
- **`.card--decision`** — top accent bar in the decision's status color; the badge is the loudest element.
- **`.card--feature`** — dark (`--ai-navy-800`) for the "intelligence" surfaces (e.g., market‑pressure score) with white text — explicitly excluded from the white‑card rule that caused the contrast bug.

Every `.card--metric` MUST have a visible caption and a `title` tooltip. This is how we kill "what does this number mean?".

## 7. Button system

| Variant | Use | Light surface | Dark/hero surface |
|---|---|---|---|
| `.btn--primary` | The one main action | teal→navy fill, white text | solid `#f3f8fb`, navy text |
| `.btn--secondary` | Supporting actions | white, teal border/text | glass `rgba(255,255,255,.1)` |
| `.btn--ghost` | Tertiary/inline | transparent, muted text | same |
| `.btn--danger` | Destructive (rare) | red border/text | — |

Rules: `min-height:40px` (44px touch target on mobile), `--radius-sm`, `--fs-sm`/800, visible `:focus-visible` ring, `:disabled` 0.5 opacity + `not-allowed`. A button group (e.g., the hero toolbar) is one visual set — consistent height, gap `--sp-2`, wraps gracefully.

## 8. Form system
- Inputs: `--radius-sm`, hairline border, `min-height:42px`, label above (never placeholder‑as‑label), `:focus-visible` teal ring.
- **Inline validation with our vocabulary**, not errors-as-blame: unsupported location → *"🗽 AreaIntel currently covers New York City only…"*.
- Numeric inputs: tabular, right‑aligned where columnar.
- Help text uses `--fs-sm` `--ai-muted`; warnings use `--st-modeled-fg`.

## 9. Table system (comparison & methodology)
- Header row: `--fs-label` uppercase, `--ai-muted`, 2px bottom border.
- Row hairlines `--ai-border`; zebra optional via `--ai-surface-2`.
- **Best‑cell highlight** uses `--st-verified-bg`/`fg`.
- First column sticky on mobile; horizontal scroll with a fade affordance.
- Status cells render the chip (dot+label+color). Decision cells use the decision badge.

## 10. Status component (the atom)
```html
<span class="status status--verified"><i class="status__dot"></i>Verified</span>
```
- `.status` chip: `--radius-pill`, `--fs-micro`/800, `padding:5px 9px`, `display:inline-flex; gap:6px`.
- `.status__dot`: 7px, `background:currentColor`; **Research In Progress** dot pulses (`statusPulse`, off under reduced‑motion).
- Mapping classes: `.status--verified / --modeled / --estimated / --research / --risk` pull the three role tokens.

## 11. Surfaces & layout
- **Report canvas:** `--ai-bg`, max content width ~1200px, 12‑col mental grid, generous gutters.
- **Sidebar (controls):** dark navy; holds brand, NYC notice, search steps, saved reports.
- **Assistant:** `--ai-navy-800` panel, dark chat, bottom‑right; never overlaps content (page reserves `--sp-16` bottom clearance).
- **Hero:** single column — title block (full width) then a wrapping action toolbar. Never a 2‑col grid that starves the title.

## 12. PDF / report design
- Executive Summary PDF (default): 1–2 pages, the section‑2 decision funnel; status colors preserved via `print-color-adjust:exact`; branded header (mark + business · area · date) and a footer disclaimer.
- Full Report PDF (secondary): the complete funnel; map/controls/assistant hidden.
- Print typography mirrors screen tokens at print sizes; cards `break-inside:avoid`.
- The PDF is a **client‑ready artifact** — same trust language, no interactive chrome.

## 13. Accessibility checklist (enforced)
- Text ≥ 4.5:1, large/UI ≥ 3:1. No color‑only meaning. Visible focus. Keyboard‑complete. `aria-live` on async + assistant. Touch targets ≥ 44px. Honors `prefers-reduced-motion`. Tooltips are supplementary, never the only source of a label.

## 14. Definition of done (every screen)
Nothing clipped · nothing white‑on‑white · every number labeled + sourced · one primary action · status = dot+label+color · responsive at 390/820/1180/1440 · print parity · `pageerror` = 0.
