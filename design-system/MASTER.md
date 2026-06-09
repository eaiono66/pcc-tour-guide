# PCC Smart Itinerary — Design System MASTER
> Source of truth for all UI work. Claude Code must read this file before generating any screen, component, or style.

---

## Brand Identity

**Product:** PCC Smart Itinerary Builder
**Platform:** React Native / Expo (mobile-first, iOS + Android)
**Audience:** International tourists visiting the Polynesian Cultural Center, Laie, Hawaii
**Tone:** Warm, adventurous, trustworthy, culturally respectful — not corporate, not generic travel app

---

## Color Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#6B2D1E` | Header bar, primary brand surfaces |
| `--color-cta-primary` | `#E8622A` | Primary action buttons (Build My Day, Save & Share) |
| `--color-cta-secondary` | `#FFFFFF` | Outlined/ghost buttons (Share with Friends) |
| `--color-accent` | `#00C2B5` | Progress indicators, highlights, "Don't miss" tags, active states |
| `--color-background` | `#F5EFE8` | Main app background (warm cream — never pure white) |
| `--color-surface` | `#FFFFFF` | Cards, modals, itinerary items |
| `--color-surface-warm` | `#FDF6EE` | Upgrade cards, secondary surfaces |
| `--color-text-primary` | `#1A1A1A` | Headings, event titles |
| `--color-text-secondary` | `#5C5044` | Subtitles, timestamps, location labels |
| `--color-text-muted` | `#9B8E82` | Supporting copy, meta labels |
| `--color-border` | `#E8DDD4` | Dividers, card borders |
| `--color-tag-bg` | `#FFF3E8` | Activity tag backgrounds (Paddle a Canoe, etc.) |
| `--color-tag-text` | `#C4551A` | Activity tag text |
| `--color-urgency` | `#F5A623` | Urgency labels ("Don't miss", "Once daily") |

**Rules:**
- Never use pure white (`#FFFFFF`) as a page background — always use `--color-background`
- Never use generic blue as a primary color
- The teal accent (`#00C2B5`) is for highlights only — never as a dominant surface color
- Dark mode is NOT supported in v1

---

## Typography

**Heading Font:** `Playfair Display` (warm, editorial, cultural weight)
**Body Font:** `Inter` (clean, readable, modern — works at small sizes on mobile)

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@300;400;500;600&display=swap');
```

| Scale | Font | Weight | Size | Usage |
|-------|------|--------|------|-------|
| Display | Playfair Display | 700 | 28–32px | Screen titles (PLAN MY DAY) |
| H1 | Playfair Display | 600 | 22–26px | Section headers (WHO'S JOINING YOU?) |
| H2 | Inter | 600 | 18px | Event titles (Huki — A Canoe Celebration) |
| Body | Inter | 400 | 14–15px | Descriptions, instructions |
| Label | Inter | 500 | 11–12px | Tags, timestamps, location chips |
| Mono | Do NOT use monospace fonts | — | — | Remove all monospace from body copy |

**Rules:**
- Remove all monospace/typewriter fonts from body text and descriptions — these are placeholders, not final typography
- Uppercase tracking (`letter-spacing: 0.1em`) is appropriate for section labels only (e.g. "AOTEAROA", "DINING")
- Body text should never be uppercase

---

## Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `space-xs` | 4px | Icon gaps, tight inline spacing |
| `space-sm` | 8px | Tag padding, label gaps |
| `space-md` | 16px | Standard component padding |
| `space-lg` | 24px | Section spacing |
| `space-xl` | 32px | Screen-level vertical rhythm |
| `space-2xl` | 48px | Hero areas |

---

## Component Patterns

### Header Bar
- Background: `--color-primary` (#6B2D1E)
- "POLYNESIAN CULTURAL CENTER" — Inter 500, 11px, uppercase, letter-spacing 0.15em, white
- "PLAN MY DAY" — Playfair Display 700, 28px, white
- Settings icon: top-right, rounded square button, semi-transparent white background

### Primary CTA Button
- Background: `--color-cta-primary` (#E8622A)
- Text: Inter 600, 13px, uppercase, letter-spacing 0.08em, white
- Border radius: 12px
- Height: 56px
- Full width with 16px horizontal margin
- Accent line: 2px `--color-accent` (#00C2B5) along bottom edge

### Ghost/Secondary Button
- Background: transparent
- Border: 1.5px `--color-text-secondary`
- Text: Inter 600, 13px, uppercase, letter-spacing 0.08em
- Border radius: 12px
- Height: 56px

### Photo Selection Cards (Group Type)
- Full-bleed image background with dark gradient overlay (bottom 50%)
- Label: Inter 700, 14px, uppercase, white
- Sublabel: Inter 400, 12px, white 80% opacity
- Border radius: 12px
- Aspect ratio: roughly 1:1 for 2-column grid

### Itinerary Timeline Item (compact)
- Left: timestamp (Inter 600, 13px, `--color-text-primary`)
- Middle: location label (Inter 500, 11px, uppercase, `--color-text-muted`) + event name (Inter 600, 15px)
- Divider: 1px `--color-border`
- No card elevation — flat list style

### Itinerary Feature Card (hero event)
- Full-width image, ~200px height, border radius 12px
- Overlay badge: location chip (top-left), time (top-right)
- Event title: Playfair Display 600, 20px
- Description: Inter 400, 13px, `--color-text-secondary`
- Activity tags: pill shape, `--color-tag-bg` / `--color-tag-text`
- Urgency row: `--color-urgency` icon + Inter 500, 12px text

### Upgrade / Promo Card
- Background: `--color-surface-warm`
- Border: 1.5px `--color-border`
- Border radius: 16px
- Label: Inter 600, 11px, uppercase, `--color-cta-primary`, letter-spacing 0.12em
- Heading: Playfair Display 700, 26px
- Body: Inter 400, 14px
- CTA button: full-width primary button inside card

### Progress Indicator
- Dot row: active dot `--color-cta-primary`, inactive dots `--color-border`
- Step label: Inter 400, 13px, `--color-text-muted`

### Floating Chat Button
- Background: `--color-primary`
- Icon: white chat bubble SVG (Lucide or Heroicons — no emoji)
- Position: bottom-right, 24px margin
- Size: 52px circle
- Shadow: 0 4px 12px rgba(0,0,0,0.2)

---

## Motion & Interaction

- Screen transitions: slide-in from right (forward), slide-out to right (back) — 280ms ease-out
- Card press: scale(0.97), 120ms
- Button press: opacity 0.85, 100ms
- Scroll-triggered entrance: fade-up, 200ms, staggered 60ms between items
- Always respect `prefers-reduced-motion` — disable entrance animations, keep functional transitions only

---

## Anti-Patterns (Never Do)

- No monospace fonts in body copy or descriptions
- No pure white backgrounds
- No generic blue as a primary or CTA color
- No emoji used as icons — use SVG (Heroicons or Lucide only)
- No AI purple/pink gradients
- No dark mode in v1
- No complex multi-step booking flows on a single screen
- No generic stock photography — PCC has real cultural photography, use it
- No tight line-height on body text (minimum 1.5)

---

## Accessibility

- Minimum contrast ratio: 4.5:1 for all body text
- Touch targets: minimum 44x44px
- Focus states visible for all interactive elements
- All images require alt text describing cultural context
- Urgency labels must not rely on color alone — always pair with an icon or text

---

## Page-Specific Notes

### Onboarding / Group Selection Screen
- Photo cards are the hero — keep images large and real
- "BUILD MY DAY FOR ME" skip option stays prominent — don't bury it

### Itinerary Results Screen
- Mix of feature cards (hero events) and compact timeline rows — do not flatten everything to one style
- "Don't miss" urgency should feel helpful, not pushy
- Walk time indicators between events are high value — keep them visible

### Upgrade / Dining Screen
- Upgrade card sits below the itinerary — it should feel like a natural recommendation, not an ad
- Use `--color-surface-warm` to distinguish it from the main timeline without feeling intrusive
