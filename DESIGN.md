# Palantir Design System

> Operational software design with rigorous structure and dark analytical clarity. Palantir’s application styling guidance and Blueprint-derived UI patterns create interfaces that feel mission-critical, customizable, and uncompromisingly functional.

---

## 1. Visual Theme & Atmosphere

### Overall Aesthetic
Palantir’s platform-facing design language is about **real-world operational seriousness**. Through Foundry application styling guidance and Blueprint-based UI patterns, the system prioritizes accessible color, flexible theming, and clear widget structure. It should feel like software used for consequential work, not lightweight productivity tooling.

### Mood & Feeling
- **Operational**: interfaces should feel designed for decisions, monitoring, and action
- **Structured**: sections, widgets, and states need strong visual logic
- **Customizable**: the system is meant to support many applications while staying coherent
- **Professional**: dense information must remain polished and production-grade
- **Accessible**: Blueprint colors and intents are chosen with WCAG in mind

### Design Density
**Medium-high density**. Palantir surfaces often carry widgets, tables, actions, and status information. The design needs to stay clear, aligned, and easy to theme across varied applications.

### Visual Character
- Dark analytical surfaces balanced by clean intent colors
- Strong use of Blueprint blues, reds, greens, oranges, and grays
- Compact controls with low radii and crisp boundaries
- Section and page backgrounds used strategically to segment workflows
- Utility over ornament in every interaction

---

## 2. Color Palette & Roles

### Blueprint Core Colors

| Token | Hex | Role |
|-------|-----|------|
| `--blue-5` | `#137CBD` | Primary interactive color |
| `--blue-4` | `#2B95D6` | Hover / active emphasis |
| `--green-5` | `#0F9960` | Success state |
| `--orange-5` | `#D9822B` | Warning / attention |
| `--red-5` | `#DB3737` | Error / destructive |

### Dark UI Neutrals

| Token | Hex | Role |
|-------|-----|------|
| `--dark-gray-1` | `#182026` | Primary dark background |
| `--dark-gray-2` | `#202B33` | Secondary surface |
| `--dark-gray-3` | `#293742` | Card and widget background |
| `--dark-gray-4` | `#30404D` | Borders and separators |
| `--gray-1` | `#5C7080` | Secondary text |
| `--gray-5` | `#BFCCD6` | Light text on dark surfaces |

### Light UI Neutrals

| Token | Hex | Role |
|-------|-----|------|
| `--light-gray-5` | `#F5F8FA` | Light background |
| `--light-gray-4` | `#EBF1F5` | Subtle panel surface |
| `--light-gray-2` | `#D8E1E8` | Border and divider |
| `--dark-text` | `#182026` | Primary text on light |

### Color Usage Rules
- Use Blueprint intent colors consistently with meaning.
- Let background shades segment pages, sections, and widgets.
- Avoid arbitrary custom colors unless they are intentionally saved and reused across a module.
- Support both light and dark modes with equivalent semantic clarity.

---

## 3. Typography Rules

### Font Stack

```css
/* Blueprint-style application typography */
--font-sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
             Helvetica, Arial, sans-serif;
--font-mono: 'SF Mono', 'Roboto Mono', Menlo, Consolas, monospace;
```

### Type Scale

| Element | Size | Weight | Line Height | Letter Spacing | Usage |
|---------|------|--------|-------------|----------------|-------|
| Page Title | 32px | 700 | 1.15 | -0.02em | App-level heading |
| Section Title | 24px | 600 | 1.2 | -0.01em | Section header |
| Widget Title | 18px | 600 | 1.3 | 0 | Widget / card title |
| Body | 14px | 400 | 1.5 | 0 | Default application text |
| Small Body | 12px | 400 | 1.45 | 0 | Metadata and helper text |
| Label | 12px | 600 | 1.3 | 0.01em | Buttons, fields, tags |
| Code | 12px | 400 | 1.45 | 0 | Technical identifiers |

### Typography Philosophy
Palantir application styling is **pragmatic and dense**. Text exists to support operational clarity and should feel consistent, compact, and dependable.

### Practical Rules
- Use headings to segment workflows clearly.
- Keep widget titles short and literal.
- Use monospace for IDs, technical values, and code-like content.
- Do not rely on type drama; rely on structure and semantic color.

---

## 4. Component Stylings

### Buttons

#### Primary Button
```css
.button-primary {
  background: #137CBD;
  color: #FFFFFF;
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 3px;
  font: 600 12px/1 system-ui, sans-serif;
}

.button-primary:hover {
  background: #106BA3;
}
```

#### Default Button
```css
.button-default {
  background: #293742;
  color: #F5F8FA;
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid #30404D;
  border-radius: 3px;
  font-weight: 600;
}

.button-default:hover {
  background: #30404D;
}
```

#### Intent Buttons
```css
.button-success {
  background: #0F9960;
  color: #FFFFFF;
}

.button-warning {
  background: #D9822B;
  color: #FFFFFF;
}

.button-danger {
  background: #DB3737;
  color: #FFFFFF;
}
```

### Inputs

#### Text Input
```css
.input {
  width: 100%;
  min-height: 32px;
  padding: 0 10px;
  background: #202B33;
  color: #F5F8FA;
  border: 1px solid #30404D;
  border-radius: 3px;
  font: 400 12px/1.2 system-ui, sans-serif;
}

.input:focus {
  outline: none;
  border-color: #137CBD;
  box-shadow: 0 0 0 2px rgba(19, 124, 189, 0.16);
}
```

### Panels and Widgets

#### Widget Card
```css
.widget {
  background: #293742;
  color: #F5F8FA;
  border: 1px solid #30404D;
  border-radius: 4px;
  padding: 16px;
}
```

#### Section Background
```css
.section {
  background: #202B33;
  border-radius: 6px;
  padding: 20px;
}
```

---

## 5. Layout Principles

### Layout Rules
- Use pages, sections, and widgets as the primary structural units.
- Let section headers clearly distinguish groups of actions or information.
- Keep widgets aligned and consistently spaced across dashboards.
- Use saved colors or shared classes when creating multi-page visual consistency.

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | `4px` | Tight alignment |
| `--space-2` | `8px` | Dense layout spacing |
| `--space-3` | `12px` | Default compact grouping |
| `--space-4` | `16px` | Widget padding |
| `--space-5` | `20px` | Section padding |
| `--space-6` | `24px` | Larger block spacing |

---

## 6. Depth & Elevation

### Surface Hierarchy

| Level | Treatment | Use |
|-------|-----------|-----|
| Page background | dark gray | Global backdrop |
| Section | slightly lighter or darker than page | Logical grouping |
| Widget | bordered panel | Focused unit of work |
| Intent callout | intent color or tinted background | Alerts and actions |

### Shadow System

```css
.shadow-widget {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
}

.shadow-overlay {
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);
}
```

### Depth Rules
- Use borders and contrast before large shadow.
- Keep overlays clearly elevated from section and page backgrounds.
- Use custom background colors and saved colors intentionally across modules.

---

## 7. Do's and Don'ts

### Do
- Use Blueprint intent colors with semantic discipline.
- Keep widgets compact, aligned, and operationally clear.
- Support strong contrast in both light and dark themes.
- Reuse classes and shared styling for app-wide consistency.
- Let headers and backgrounds segment workflows cleanly.

### Don't
- Decorate mission-critical tools with unnecessary flourish.
- Use custom colors randomly across widgets and pages.
- Blur the distinction between page, section, and widget surfaces.
- Oversize controls beyond their operational context.
- Depend on color alone where labels or icons are needed.

---

## 8. Responsive Behavior

### Responsive Rules
- Collapse dense widget grids into single-column flows before content becomes unreadable.
- Preserve compact control sizes while maintaining touch usability where needed.
- Keep section headers visible and clear on smaller screens.
- Simplify background variation if it hurts readability on mobile.
- Ensure intent colors remain discernible in both modes.

### Mobile Character
Palantir-style mobile views should still feel operational and deliberate. Even when simplified, they must preserve clear widget boundaries, intent-driven actions, and strong contrast.

---

## 9. Agent Prompt Guide

### Quick Reference
- **Mood**: operational, serious, structured, themeable
- **Core system**: Blueprint-style intent colors + dark analytical surfaces
- **Typography**: compact system sans
- **Layout**: page / section / widget hierarchy
- **Components**: low-radius buttons, compact inputs, intent-driven states

### Prompt Snippet

```text
Design this interface in the style of Palantir's application styling guidance and Blueprint-based UI. Use dark analytical surfaces, compact low-radius controls, clear page/section/widget hierarchy, and intent colors like Blueprint blue, green, orange, and red for semantic meaning. The result should feel mission-critical, customizable, and operationally rigorous rather than decorative or consumer-friendly.
```
