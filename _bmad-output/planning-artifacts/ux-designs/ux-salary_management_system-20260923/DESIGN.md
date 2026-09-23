---
colors:
  primary: '#1976d2'
  secondary: '#9c27b0'
  background: '#f4f6f8'
  surface: '#ffffff'
  error: '#d32f2f'
  text_primary: '#111827'
  text_secondary: '#6b7280'
typography:
  family: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
  weights:
    regular: 400
    medium: 500
    bold: 700
rounded:
  default: '8px'
  button: '6px'
  card: '12px'
spacing:
  base: '8px'
  container: '24px'
  section: '32px'
components:
  appbar:
    elevation: 0
    bg: '{colors.surface}'
    color: '{colors.text_primary}'
  sidebar:
    width: '260px'
    bg: '{colors.surface}'
  table:
    header_bg: '#f9fafb'
status: final
updated: 2026-09-23
---

# Salary Management System: Visual Identity

## Brand & Style
The system is an internal tool designed for efficiency and clarity. The style is **professional, minimal, and crisp**. It relies on high legibility, generous whitespace, and subtle shadows to create an elegant and frictionless experience for HR admins and employees alike. 

## Colors
We use a refined Material UI palette with a softer, modern background to reduce eye strain during prolonged data entry and review.
- **Primary:** `{colors.primary}` — Used for primary actions, active states, and key highlights.
- **Background:** `{colors.background}` — A soft gray to contrast with stark white data cards.
- **Surface:** `{colors.surface}` — Pure white for all data-bearing containers (cards, tables, modals).
- **Text:** `{colors.text_primary}` for readability; `{colors.text_secondary}` for auxiliary data.

## Typography
- **Font Family:** `{typography.family}`
- We prioritize `Inter` for its excellent legibility in dense data tables and numeric displays (like salary figures). `Roboto` acts as the native Material UI fallback.

## Layout & Spacing
- **Base Unit:** `{spacing.base}`
- **Page Container Padding:** `{spacing.container}`
- **Section Gap:** `{spacing.section}`
- **Navigation:** Fixed sidebar (`{components.sidebar.width}`) for HR admins, top App Bar for employees.

## Elevation & Depth
- **Flat by Default:** We minimize drop shadows to avoid visual clutter. 
- **Cards/Tables:** Use a subtle border (`1px solid #e5e7eb`) and soft rounding (`{rounded.card}`) instead of heavy shadows.
- **Modals/Drawers:** Use a pronounced shadow (`box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1)`) to pull focus.

## Shapes
- **Corners:** Soft, modern rounding. Cards get `{rounded.card}`, while interactive elements like buttons and inputs get `{rounded.button}`.

## Components
- **Data Tables:** `{components.table.header_bg}` for table headers to distinct them from data rows. Rows have a subtle hover effect (e.g., `#f3f4f6`).
- **Buttons:** Filled for primary actions (e.g., "Generate Payslips"), outlined for secondary (e.g., "Cancel").
- **Inputs:** Material UI "outlined" variant for a clean, bounded look.

## Do's and Don'ts
- **Do** align currency values (INR) strictly to the right in data tables.
- **Do** use skeleton loaders for tables during bulk operations.
- **Don't** use loud background colors; keep the canvas neutral so the data stands out.
- **Don't** use dense layouts; give data room to breathe to prevent misreading numbers.
