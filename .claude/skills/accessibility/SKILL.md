---
name: accessibility
description: Ensures user-facing UI meets WCAG 2.2 Level AA accessibility standards. Use when building, changing, or reviewing any user-facing interface — pages, components, forms, HTML/CSS/JSX/TSX/Vue/Svelte, or design systems. Do not apply to pure backend, CLI, or data work with no rendered UI.
---

# Accessibility (WCAG 2.2 AA)

Make everything usable by everyone — including people who use screen readers, navigate by keyboard only, or have low vision or color blindness. The standard to meet is **WCAG 2.2, Level AA**. WCAG is organized around four principles, remembered as **POUR**: Perceivable, Operable, Understandable, Robust.

## When to apply this skill

Apply whenever the task builds, changes, or reviews something a person sees or interacts with: a page, screen, component, form, modal, table, or navigation, and any front-end code (HTML, CSS/Tailwind, JSX/TSX, Vue, Svelte). Do not apply to pure backend, CLI, or data-pipeline work that renders no user interface.

## Checklist — enforce every item

### Perceivable
1. **Use semantic HTML first** (`<button>`, `<a href>`, `<nav>`, `<main>`, `<label>`, headings in order). Never a `<div>` with a click handler where a button or link belongs.
2. **Text contrast ≥ 4.5:1** for normal text, **≥ 3:1 for large text** (≥ 24px, or ≥ 18.66px bold).
3. **Non-text contrast ≥ 3:1** for UI borders, icons, and focus indicators.
4. **Every image has appropriate `alt`.** Decorative images get `alt=""`; icon-only buttons get an `aria-label`.
5. **Never rely on color alone** to convey meaning or state.

### Operable
6. **Fully keyboard operable** (Tab / Shift+Tab / Enter / Space / arrows); no keyboard traps; logical order; no positive `tabindex`.
7. **Visible focus indicator** on every interactive element; never remove the outline without a replacement.
8. **Touch/click targets ≥ 24×24 CSS px** (or with adequate spacing).
9. **Respect `prefers-reduced-motion`**; provide pause/stop for motion longer than 5 seconds.

### Understandable
10. **Form inputs have real labels** (`<label for>` or wrapping `<label>` — a placeholder is not a label); group related fields with `<fieldset>`/`<legend>`.
11. **Errors identified in text**, tied to the field (`aria-describedby`), with guidance on how to fix — not color alone.
12. **Set `<html lang>`**, a unique descriptive `<title>`, and a "skip to main content" link.
13. **Reflow and zoom:** usable at 320px width and 200% text zoom, with no horizontal scrolling.

### Robust
14. **Use ARIA correctly and sparingly** — prefer native HTML; keep roles/states (`aria-expanded`, `aria-current`, `aria-live`) in sync.
15. **Accessible authentication:** don't require solving a puzzle or transcribing a code as the only way to log in; allow paste and password managers.

## How to verify

Run an automated checker (axe-core, Lighthouse, or WAVE) **and** do a manual keyboard pass plus a screen-reader check (NVDA or VoiceOver). Automated tools catch only about 30–40% of issues.

## How to respond

- **When building UI:** apply these by default.
- **When reviewing UI:** report each issue with its file/line and the specific item, then the fix.

## Sources
- WCAG 2.2 spec: https://www.w3.org/TR/WCAG22/
- How to Meet WCAG (quick reference): https://www.w3.org/WAI/WCAG22/quickref/
- ARIA Authoring Practices Guide: https://www.w3.org/WAI/ARIA/apg/
- WebAIM contrast checker: https://webaim.org/resources/contrastchecker/