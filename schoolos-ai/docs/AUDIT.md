# Codebase audit (Phase 1)

Source: copy of the finished marketing-page clone (`skooly-clone/`, left untouched). Stack: Vite 8, React 19, Tailwind v4, Fontsource fonts, lucide-react. **No router, no backend, no database, no auth, no forms** (except the Skooly sales chat widget).

## Inventory and classification

| Item | Class | Decision |
|---|---|---|
| `src/index.css` (tokens, fonts, motion, `card-soft`, reveal/orb keyframes) | Keep | Design system for both marketing site and app |
| `ScrollReveal`, `AnimatedCounter`, `Buttons`, `HeroShowcase`, `DashboardMock` | Keep / Modify | Reused on the marketing pages; buttons now route internally |
| `Header.jsx` | Modify | Skooly nav, mega-menu links to ~60 non-existent pages, language pill (inert), external login/register. Rebuilt around real internal routes |
| `Footer.jsx` | Modify | Skooly columns, country links, app-store badges, Skooly email. Replaced |
| `pages/Home.jsx` | Modify | All copy is Skooly's; fabricated-looking testimonials and country/fee claims removed. Rewritten for SchoolOS AI |
| `Wordmark.jsx`, `assets.js` | Modify | Skooly wordmark replaced with SchoolOS AI logo |
| `config.js` | Remove | Held every external Skooly URL |
| `ChatWidget.jsx` | Remove | Skooly sales form; no backend, would be a dead feature |
| `color-parity.css` | Remove | Generated from Skooly's CSSOM; only needed for pixel parity |
| `index.html`, `package.json`, `README.md` | Modify | Rebrand |
| Other routes | Create | Only `/` existed. Every other page below is new |

## Missing and created
Router, auth + permissions, seeded data store with persistence, 4 portals (admin, teacher, student, parent), shared UI kit (tables, modals, forms, charts, toasts), AI demo engines, demo-mode login and role switcher.

## Skooly references found (all removed in this project)
`index.html` meta, `package.json` name, `config.js` URLs (login/register/help/youtube/app stores/email), `Footer` (email, country list, copyright), `Home` copy and testimonials, `Wordmark`/`assets` logo, `ChatWidget` copy and storage key, `README`.
