# AreaIntel — Design Philosophy

> **Brand promise:** *Know before you open.*
> AreaIntel turns messy local market signals into a single, defensible decision a non‑expert can act on — and trust.

This document defines *why* AreaIntel looks and behaves the way it does. It governs every screen, the PDF, and the assistant. `DESIGN_SYSTEM.md` defines *how* (the tokens). When the two disagree, philosophy wins and the system is corrected.

---

## 1. Who we serve

| User | What they fear | What earns their trust |
|---|---|---|
| Restaurant owner | Signing a lease that sinks their savings | Plain English, honest uncertainty, a clear "do this next" |
| Retail operator | Picking the wrong corner | Side‑by‑side comparison, foot‑traffic logic shown |
| Franchise buyer | Failing a site‑approval committee | An exportable, sourced, board‑ready artifact |
| CRE advisor | Looking sloppy in front of a client | White‑label‑quality output, no overclaiming |
| Small‑business investor | Betting on a hunch | Evidence separated from estimate, a track to verify |

**Design implication:** the product must read as *advisory*, not *oracle*. Every screen answers three questions in order — **What's the call? · How sure are we? · What do I do next?**

## 2. The five inspirations, and what we take from each

- **Bloomberg Terminal** — density with a legend. Information‑dense is fine *if every value has a defined meaning.* No naked numbers.
- **Palantir** — provenance is a first‑class citizen. Show where each signal came from and how fresh it is.
- **Placer.ai** — make spatial/behavioral data feel intuitive and confident without faking precision.
- **Stripe** — calm, generous spacing; one accent color doing a lot of work; documentation‑grade clarity.
- **Linear / Vercel / Notion** — restraint, speed, perfect alignment; the interface disappears and the decision remains.

We are **Bloomberg's rigor with Stripe's calm.** Dense where it must be, quiet everywhere else.

## 3. Trust principles (non‑negotiable)

1. **Honesty over polish.** A confident-looking wrong number is the worst outcome. Modeled values must *look* modeled.
2. **Provenance always visible.** Every signal carries a state: *Verified · Modeled · Estimated · Research In Progress · Risk.* Color is reinforced by a label and a dot (never color alone — accessibility).
3. **Confidence ≠ probability.** "Confidence" measures **live‑data coverage**, not the odds of success. This distinction is stated wherever confidence appears.
4. **Name the gap, don't hide it.** We never say *Unknown / Data Unavailable / Not Known.* We say *Needs Validation · Additional Verification Recommended · Site Visit Required · Due Diligence Required.* The unknown becomes a task, not a dead end.
5. **No invented precision.** Foot traffic, revenue, and rent are modeled ranges. We never render a fake exact count.
6. **The scope is the truth.** AreaIntel is NYC‑only today. We say so plainly, near the logo and the search — credibility comes from stating limits, not papering over them.

## 4. Information hierarchy

Every report resolves top‑to‑bottom as a **decision funnel**:

```
1  IDENTITY      Who/where  → hero: business + location, scope notice
2  THE CALL      Decision · Success probability · Confidence · Next action
3  PROVENANCE    Signals-in-this-report strip (Verified/Modeled/Checking)
4  EVIDENCE      Why it may work · Risks · Foot traffic · Competition
5  ALTERNATIVES  Better-fit concepts, comparison
6  DILIGENCE     What still needs verification, methodology
7  ACT           Export · Compare · Save/Share · Ask · Request Advisor
```

A first‑time user should be able to stop after section 2 and be right. Sections 3–7 reward the skeptic. Nothing important hides below the fold *of section 2.*

## 5. Decision‑making principles

- **One primary call per screen.** The decision badge is the loudest object. Everything else supports it.
- **Always offer the next move.** A verdict without an action is a dead end; pair every decision with "what to do."
- **Make uncertainty productive.** Low confidence routes the user toward verification (Site Visit Required, Request Advisor Review), never toward a shrug.
- **Comparison is the real job.** Operators choose between sites. Ranking and side‑by‑side are core, not extras.

## 6. Visual identity

- **Tone:** institutional, quiet, exact. "A research desk, not a marketing page."
- **Light report / dark intelligence.** The report canvas is light and legible (long reading, print parity). The assistant and command surfaces are dark navy — they read as the "terminal."
- **Liberty mark + "NYC Edition."** The torch mark and the 🗽 scope notice make the NYC‑only reality a feature of focus, not an apology.
- **Accent discipline.** Teal is the single brand accent. The five status colors are *semantic*, never decorative — if something is amber, it means *modeled*, everywhere.
- **Typography = credibility.** Tight, balanced headlines; numbers in a tabular, confident weight; body text sized for trust at a glance.

## 7. Accessibility as trust

- Minimum **4.5:1** contrast for text, **3:1** for large text and UI affordances. No white‑on‑white, ever (the audited `business-count` bug is the canonical anti‑pattern).
- **Status is never color‑only** — dot + label + color, so it survives color‑blindness and grayscale print.
- Visible focus rings; full keyboard path; `aria-live` on async report regions and the assistant.
- Mobile‑first: the decision (section 2) and the assistant must be fully usable one‑handed on a 390px screen.

## 8. What "premium" means here

Premium is **not** gradients and motion. It is: nothing clipped, nothing ambiguous, nothing overclaimed, everything aligned to a grid, and every number explainable in one sentence. If a franchise committee, a broker, and a first‑time owner all trust the same screen, we've won.
