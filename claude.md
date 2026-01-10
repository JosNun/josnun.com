# josnun.com

Personal site for Josiah Nunemaker built with Astro.

## Design System: Botanical Minimal

A plant-inspired minimalist design combining Swiss cleanliness, technical precision, and organic warmth.

### Colors
- **Forest** `#1a3a2e` - Primary text, headings
- **Sage** `#4a6b5c` - Secondary text, body copy
- **Moss** `#7a9b89` - Accents, dividers
- **Leaf** `#a8c5b8` - Borders, subtle backgrounds
- **Cream** `#f4f1ea` - Page background
- **Bark** `#8b7355` - Metadata, dates

### Key Features
- Nav collapses on scroll (`josiah_nunemaker` → `j_n`)
- Stem-line dividers and left-border card accents
- Subtle microinteractions (arrow links shift, cards slide)
- MDX blog posts with content collections

## Commands

```bash
pnpm dev      # Start dev server
pnpm build    # Build for production
pnpm preview  # Preview production build
```

## Structure

```
src/
├── components/   # Nav, PageHeader, ArticleCard, ArrowLink, StemDivider, Footer
├── content/      # MDX blog posts in writing/
├── layouts/      # BaseLayout, PostLayout
├── pages/        # index, writing/*, rss.xml
└── styles/       # global.css with CSS vars and animations
```

## Deployment

Static output for Cloudflare Pages:
- Build command: `pnpm build`
- Output directory: `dist`

## Reference

Design prototypes and full spec in `inspiration/` folder.
