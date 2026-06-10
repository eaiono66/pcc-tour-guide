# PCC Smart Itinerary Builder

A guest-facing concept app that generates a personalized Polynesian Cultural Center day plan. Built with React Native and Expo.

---

## What it does

"Not knowing what to do" or feeling lost is the #3 complaint among self-guided PCC guests — and nothing currently exists to solve it. Guests arrive with a ticket and no clear path through the park. Shows conflict, villages are spread out, and meal windows get missed.

The Smart Itinerary Builder fixes that from three inputs: arrival time, group type, and ticket level.

Guests get:
- **Day Planner** — a full itinerary sequenced around real show times and walking distance between villages
- **Insider Picks** — spots and moments most self-guided guests walk right past, drawn from guide knowledge
- **Smart Upgrade Moments** — upgrade prompt placed at the end of the personalized plan, when the guest can already picture their evening

---

## How the AI works

A hybrid engine — deterministic logic where correctness matters, generative AI where personality matters.

**Rule-based scheduling core** handles the hard constraints: show times, village walking order, ticket-tier access, and time-window conflicts. Every generated itinerary is guaranteed to be physically possible.

**Claude** handles everything that should feel human: adapting tone and pacing to the group type (honeymooners get a different day than a family with toddlers), selecting insider picks, and writing the upgrade moment — timed for peak engagement.

One focused Claude call per itinerary. Cheaper and faster than asking an LLM to brute-force a schedule.

---

## Tech stack

- React Native / Expo
- Claude Sonnet (Anthropic API)
- Rule-based scheduling engine (custom)
- PCC brand assets and real show schedule data

---

## Status

Prototype — concept demo built on PCC's actual show schedule and brand system. Proposed to leadership as a guest-experience initiative.

---

## Demo

Built against PCC's internal show schedule and brand system. Contact [ezra.aiono@gmail.com](mailto:ezra.aiono@gmail.com) to request a demo.

Portfolio: [eaiono66.github.io](https://eaiono66.github.io)
