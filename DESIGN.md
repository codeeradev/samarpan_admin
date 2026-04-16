# Design Brief: Samarpan Hospital Admin Panel

## Tone & Purpose
Refined, minimal, professional medical dashboard. Precision-focused UI for healthcare data management. Trustworthy, calm, authoritative.

## Primary Differentiation
Card-based layout with precise data hierarchy, soft medical blue accents, teal secondary actions. Clean typography, subtle shadows. Purpose-driven hierarchy over decoration.

## Color Palette

| Token | OKLCH | Purpose |
|-------|-------|---------|
| Primary | 0.68 0.18 231 | Sky blue — primary actions, highlights, key metrics |
| Secondary | 0.65 0.14 167 | Teal — secondary actions, accents, confirmation states |
| Background | 0.98 0.02 245 | Off-white — main surface, reduces eye strain |
| Foreground | 0.15 0.02 228 | Slate — body text, data labels |
| Card | 1.0 0 0 | White — elevated card surfaces, modals, popovers |
| Muted | 0.95 0.02 228 | Light blue-grey — disabled states, secondary text |
| Destructive | 0.55 0.22 25 | Red — alerts, delete actions, errors |
| Border | 0.92 0.01 245 | Subtle light — card borders, dividers |
| Chart 1–5 | Blue, Teal, Green, Gold, Red | Data visualization palette (medical dashboard) |

## Typography
- **Display**: Space Grotesk (bold, geometric, modern) — page titles, section headers
- **Body**: Plus Jakarta Sans (friendly, readable, humanist) — labels, descriptions, body copy
- **Mono**: System monospace — code snippets, data values

## Structural Zones

| Zone | Treatment |
|------|-----------|
| Sidebar | Solid white `bg-sidebar`, 1px border-right `border-sidebar-border`, dark text `text-sidebar-foreground` |
| Header/Topbar | Solid white `bg-card` with `border-b border-border`, search input, profile dropdown |
| Main Content | `bg-background` off-white, card-based sections with `shadow-card` |
| Cards | `bg-card` white, `shadow-card`, 10px radius, 1px `border-border` |
| Modals | `bg-card` with `shadow-elevated`, 12px radius, semi-transparent overlay |
| Footer | Light blue-grey `bg-muted/10` with `border-t border-border` (if used) |

## Spacing & Rhythm
- Base unit: 4px
- Padding: 16px (cards), 24px (sections), 12px (form inputs)
- Gap: 16px (flex layouts), 8px (tight groups)
- Margins: 20px (section stacking), 32px (major sections)

## Component Patterns
- **Buttons**: Primary (blue `bg-primary`, white text), Secondary (teal `bg-secondary`), Ghost (border only)
- **Tables**: Striped rows `bg-muted/5`, hover `bg-muted/10`, 1px `border-border` dividers
- **Inputs**: `bg-input` light, `border-input`, focus ring `ring-primary`, `rounded-lg` 10px
- **Status Badges**: Success (green), Warning (amber), Pending (blue), Completed (teal)
- **Icons**: Lucide React, 20px size, `text-foreground` or `text-primary`

## Motion
- Default transition: `transition-smooth` (all 0.3s cubic-bezier)
- Entrance: Fade + subtle scale (opacity 0→1, scale 0.95→1)
- Hover: Color shift on interactive elements, subtle shadow increase
- Focus: Ring + color change on form inputs

## Constraints
- No gradients or glass-morphism effects
- No animations on page load (only user-triggered)
- High contrast: AA+ WCAG compliance
- Light mode only (no dark mode for v1)
- Max 2 font families
- Max 5 core colors (palette is tight, medical focus)

## Signature Detail
Soft rounded corners (10px base) paired with minimal shadows create clean, approachable medical UI. Teal secondary actions provide visual distinction from primary blue. Typography hierarchy uses weight + size, not just color, for accessibility.
