# Botanical Minimal Design Specification

## Philosophy

This design language draws inspiration from botanical illustration and scientific documentation. It combines:

- **Swiss Minimalism**: Clean lines, grid-based layouts, generous whitespace, strict typographic hierarchy
- **Technical Precision**: Monospace accents, terminal-inspired patterns, precise spacing
- **Organic Warmth**: Earthy color palette, stem-like dividers, growth-inspired metaphors

The result feels like a botanist's digital notebook—organized and systematic, but alive with subtle warmth.

---

## Color Palette

| Name    | Hex       | CSS Variable  | Usage                                      |
|---------|-----------|---------------|--------------------------------------------|
| Forest  | `#1a3a2e` | `--forest`    | Primary text, headings, high emphasis      |
| Sage    | `#4a6b5c` | `--sage`      | Secondary text, body copy, nav links       |
| Moss    | `#7a9b89` | `--moss`      | Accent elements, dividers, decorative      |
| Leaf    | `#a8c5b8` | `--leaf`      | Borders, subtle backgrounds, tags          |
| Cream   | `#f4f1ea` | `--cream`     | Page background                            |
| Bark    | `#8b7355` | `--bark`      | Tertiary text, dates, metadata             |

### Color Relationships

- **Primary pair**: Forest on Cream (main content)
- **Secondary pair**: Sage on Cream (supporting content)
- **Accent**: Moss for interactive and decorative elements
- **Subtle**: Leaf for borders and light backgrounds
- **Metadata**: Bark for dates and categorization

---

## Typography

### Font Stack

```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
font-family: ui-monospace, 'SF Mono', Menlo, Monaco, 'Cascadia Mono', monospace; /* for mono */
```

### Scale

| Element          | Size      | Weight    | Tracking       | Color   |
|------------------|-----------|-----------|----------------|---------|
| Page Title (h1)  | 7xl-8xl   | light     | tight          | Forest  |
| Section Title    | xs mono   | normal    | wider, UPPER   | Moss    |
| Card Title (h2)  | 2xl-3xl   | light     | normal         | Forest  |
| Body Text        | lg-xl     | light     | normal         | Sage    |
| Meta Text        | xs mono   | normal    | wider, UPPER   | Bark    |
| Nav Text         | xs-sm mono| normal    | wider          | Sage    |

### Principles

- Large titles use `font-light` for elegance
- Monospace for system/meta elements (dates, labels, navigation)
- Uppercase + letter-spacing for small labels
- Body text maintains comfortable reading width (max-w-2xl)

---

## Spacing

### Base Unit

4px base (Tailwind default). Key spacing values:

| Name   | Value  | Usage                           |
|--------|--------|---------------------------------|
| 1      | 4px    | Tight gaps within components    |
| 2      | 8px    | Tag/badge spacing               |
| 3      | 12px   | Small component padding         |
| 4      | 16px   | Standard padding                |
| 6      | 24px   | Section gaps                    |
| 8      | 32px   | Container padding, large gaps   |
| 10     | 40px   | Article/card padding            |
| 12     | 48px   | Footer/header vertical padding  |
| 16     | 64px   | Major section margins           |
| 20     | 80px   | Main content vertical padding   |
| 24     | 96px   | Philosophy/Connect gap          |
| 32     | 128px  | Footer margin-top               |

### Container

- Max width: `max-w-5xl` (1024px)
- Horizontal padding: `px-8` (32px)
- Content typically left-aligned

---

## Components

### 1. Navigation

**Structure**: Sticky header with logo and links

**Behavior**: On scroll (>20px), the nav compresses:
- Characters in logo/links fade out and collapse (`josiah_nunemaker` → `j_n`)
- Container expands to full width
- Font sizes reduce
- Padding decreases

**States**:
- Default: Full text, centered container
- Scrolled: Abbreviated text, edge-to-edge

**Interactions**:
- Links have underline that grows on hover
- No background blur or border

```
┌──────────────────────────────────────────────────────┐
│  j_nunemaker              ./a  ./w  ./p              │
└──────────────────────────────────────────────────────┘
```

---

### 2. Page Header

**Structure**: Title + stem divider + subtitle

```
Projects
────────
Work cultivated with care and attention to detail
```

**Elements**:
- h1: `text-7xl font-light tracking-tight` in Forest
- Divider: `h-px w-16` in Moss
- Subtitle: `text-xl font-light` in Sage

---

### 3. Article Card (Writing Page)

**Structure**: Horizontal card with left border accent

```
│ Jan 2026
│ The Case for Boring Design
│ Why the best interfaces often go unnoticed...
│ → read article
```

**States**:
- Default: Transparent background, left border in Leaf
- Hover: White background, Moss accent line appears

**Elements**:
- Time: `font-mono text-xs uppercase tracking-wider` in Bark
- Title: `text-3xl font-light` in Forest
- Excerpt: `text-lg leading-relaxed` in Sage
- Link: Arrow link component

**Interactions**:
- Title opacity reduces on group hover
- Whole card is hoverable area

---

### 4. Project Card

**Structure**: Detailed card with header, description, and tags

```
│ ┌─────────────────────────────────────────┐
│ │  Design System 2.0              [view →]│
│ │  Component Library — 2025               │
│ │                                         │
│ │  A comprehensive design system...       │
│ │                                         │
│ │  [React] [TypeScript] [Storybook]       │
│ └─────────────────────────────────────────┘
```

**States**:
- Default: Transparent, left border in Leaf
- Hover: White background, Moss accent appears

**Elements**:
- Title: `text-3xl font-light` in Forest
- Category/Date: `font-mono text-xs uppercase tracking-wider` in Bark
- Description: `text-lg leading-relaxed max-w-2xl` in Sage
- Tags: Tag component (see below)
- Action: Button component (see below)

---

### 5. Focus Card (Homepage)

**Structure**: Numbered feature highlight with left border

```
│ 01
│ Design Systems
│ Growing sustainable component ecosystems that scale
```

**States**:
- Default: Left border in Leaf
- Hover: Border changes to Moss, card slides right 8px, raises z-index

**Elements**:
- Number: `font-mono text-xs uppercase tracking-wider` in Moss
- Title: `font-medium` in Forest
- Description: `text-sm leading-relaxed` in Sage

**Interactions**:
- Uses `transform: translateX(8px)` on hover (not padding change)
- Background becomes Cream on hover to cover siblings

---

### 6. Link Card (Selected Work)

**Structure**: Compact preview linking to full project

```
│  Design System 2.0                              →
│  Component Library — 2025
│  50+ components cultivated for 12 products...
```

**States**:
- Default: Transparent
- Hover: White background

**Elements**:
- Title: `text-2xl font-light` in Forest
- Meta: `font-mono text-xs tracking-wider uppercase` in Bark
- Description: `leading-relaxed` in Sage
- Arrow: Fades in on hover

---

### 7. Arrow Link

**Structure**: Text with arrow prefix

```
→ read article
```

**States**:
- Default: Moss color
- Hover: Slides right 4px

**CSS**:
```css
.arrow-link {
  display: inline-block;
  transition: transform 0.2s ease;
}
.arrow-link:hover {
  transform: translateX(4px);
}
```

---

### 8. Button

**Structure**: Bordered button for actions

```
┌─────────┐
│ view →  │
└─────────┘
```

**States**:
- Default: Forest border and text, transparent background
- Hover: Forest background, white text

**CSS**: `px-4 py-2 font-mono text-xs border transition-colors`

---

### 9. Tag

**Structure**: Technology or category label

**Variants**:

A. **Bordered** (preferred):
```
┌────────┐
│ React  │
└────────┘
```
`px-4 py-1 font-mono text-xs border border-leaf text-forest`

B. **Filled** (use sparingly):
```
┌────────┐
│ React  │ (leaf background)
└────────┘
```
`px-4 py-2 font-mono text-xs bg-leaf text-forest`

---

### 10. Stem Divider

**Structure**: Horizontal line used to separate sections

**Variants**:
- Short: `h-px w-8` or `w-16`
- Medium: `h-px w-24`
- Full: `h-px w-full`

**Color**: Moss (`--moss`)

---

### 11. Section Container

**Structure**: Wrapper for content sections

**Layout**:
- Vertical list: `space-y-1` with `border-l-2 border-leaf`
- Grid: `grid md:grid-cols-2 gap-24` or `md:grid-cols-3 gap-8`

The left border creates a visual "stem" that cards branch from.

---

### 12. Footer

**Structure**: Simple copyright line

```
────────────────────────────────────
© 2026 — grown with care
```

**Elements**:
- Border: `border-t border-leaf`
- Text: `font-mono text-xs tracking-wider` in Moss
- Spacing: `py-12 mt-32`

---

## Interaction Patterns

### Timing

- Fast (instant feedback): `0.2s ease`
- Standard (most transitions): `0.3s ease`
- Slow (complex animations): `0.4s ease`

### Principles

1. **Subtle over dramatic**: Small movements (4-8px), gentle opacity changes
2. **Directional**: Horizontal movement (translateX) for "growth" feel
3. **Purposeful**: Every animation serves to guide attention or confirm interaction
4. **Consistent**: Same easing (`ease`) throughout

### Global Transition

```css
* {
  transition: all 0.2s ease;
}
```

This provides baseline responsiveness while specific components override with custom timings.

---

## Component Relationships

### Page Structure

```
┌─────────────────────────────────────────────────────┐
│ NAV                                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  PAGE HEADER                                        │
│  ──────────                                         │
│                                                     │
│  │ CARD                                             │
│  │ CARD                                             │
│  │ CARD                                             │
│                                                     │
├─────────────────────────────────────────────────────┤
│ FOOTER                                              │
└─────────────────────────────────────────────────────┘
```

### Nesting Rules

- Cards always appear within Section Containers (with left border)
- Tags only appear within Project Cards
- Arrow Links appear in Article Cards and standalone
- Buttons appear in Project Cards and page headers
- Stem Dividers appear in Page Headers and Section titles

### Visual Hierarchy

1. **Page Title** - Largest, lightest weight, establishes context
2. **Card Titles** - Secondary prominence, draw eye to content
3. **Body Text** - Comfortable reading, doesn't compete
4. **Meta Text** - Smallest, provides context without distraction

---

## Animation Spec: Nav Scroll Collapse

The navigation has a special scroll-triggered animation. Here's the detailed behavior:

### HTML Structure

```html
<a class="logo">
  j<span class="fade">osiah</span>_n<span class="fade">unemaker</span>
</a>
<a class="nav-link">
  ./a<span class="fade">bout</span>
</a>
```

### CSS

```css
nav .fade {
  display: inline-block;
  vertical-align: baseline;
  opacity: 1;
  max-width: 500px;
  overflow: hidden;
  transition: opacity 0.4s ease, max-width 0.4s ease;
}

nav.scrolled .fade {
  opacity: 0;
  max-width: 0;
}

nav .nav-container {
  transition: max-width 0.4s ease, padding 0.4s ease;
}

nav.scrolled .nav-container {
  max-width: 100vw;
  padding: 0.75rem 1rem;
}
```

### JavaScript

```javascript
window.addEventListener('scroll', () => {
  if (window.pageYOffset > 20) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});
```

---

## Responsive Considerations

### Breakpoints

Using Tailwind defaults:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px

### Key Adaptations

- Homepage grid: `md:grid-cols-2` for Philosophy/Connect, `md:grid-cols-3` for Focus Cards
- Nav: Same behavior on all sizes (abbreviation helps mobile)
- Cards: Full width on mobile, maintain padding

---

## Implementation Notes

### CSS Custom Properties

Define in `:root` for theming potential:

```css
:root {
  --forest: #1a3a2e;
  --sage: #4a6b5c;
  --moss: #7a9b89;
  --leaf: #a8c5b8;
  --cream: #f4f1ea;
  --bark: #8b7355;
}
```

### Tailwind Considerations

Most styles use Tailwind utilities with inline `style` attributes for colors. For production, consider:
- Extending Tailwind config with custom colors
- Creating component classes for repeated patterns
- Using CSS-in-JS or a component library

### Accessibility

- Ensure sufficient contrast (Forest on Cream passes WCAG AA)
- Maintain focus states for keyboard navigation
- Use semantic HTML (nav, main, article, footer)
- Preserve meaning when animations are disabled
