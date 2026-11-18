---
name: ux
description: Applies UX best practices (Nielsen's usability heuristics) so interfaces are clear, consistent, and forgiving. Use when building, changing, or reviewing anything a person sees or interacts with — UIs, pages, components, forms, flows, or dashboards. Do not apply to pure backend or data work with no user-facing surface.
---

# UX (Usability)

Build interfaces that are clear, consistent, and forgiving, so people can accomplish their goals without confusion or frustration. Anchored on **Nielsen's 10 Usability Heuristics**, the long-standing foundation of usable design.

## When to apply this skill

Apply whenever building, changing, or reviewing anything a person sees or interacts with: a UI, page, screen, component, form, flow, table, or dashboard, and any front-end work. Do not apply to pure backend, CLI, or data-pipeline work with no user-facing surface.

## Checklist — enforce every item

1. **Give immediate feedback on every action.** Buttons show active/loading/disabled states; anything taking over ~1 second shows a spinner or progress indicator.
2. **Design all four states for any data view:** loading, empty (explain it + a clear next action), error (plain cause + retry), and populated. Never ship only the happy path.
3. **Prevent errors before they happen.** Disable invalid actions, validate inline as the user types, and confirm or offer undo for destructive actions.
4. **Write helpful error messages** in plain language — what went wrong and how to fix it — placed next to the field at fault. No codes or stack traces.
5. **Always provide an exit** — cancel, back, close, and undo on every flow or modal. Never trap the user.
6. **Be consistent.** Reuse the same components, labels, icons, and patterns; identical actions look and behave identically; follow platform conventions.
7. **Provide sensible defaults and preserve user input.** Pre-fill likely values, never silently discard entered data, and don't re-ask for what the system already knows.
8. **Establish clear visual hierarchy.** One primary action per screen; group related items; use whitespace and size so the eye lands on what matters first.
9. **Meet accessibility (WCAG 2.2 AA)** — contrast, keyboard operability, visible focus, real labels, adequate target sizes. (See the `accessibility` skill for specifics.)
10. **Make system state and location obvious** — active nav, breadcrumbs, step indicators, and saving/saved status.
11. **Reduce cognitive load** — recognition over recall; use progressive disclosure to tuck advanced options away; keep forms short.
12. **Support efficiency for repeat users** — shortcuts, bulk actions, and search/filter on long lists; ensure the layout works at mobile width with no horizontal scroll.

## How to respond

- **When building UI:** apply these by default.
- **When reviewing UI:** report each issue with its file/line and the specific item, then the fix.

## Sources
- Nielsen's 10 Usability Heuristics: https://www.nngroup.com/articles/ten-usability-heuristics/
- NN/g Error-Message Guidelines: https://www.nngroup.com/articles/error-message-guidelines/
- NN/g Empty States: https://www.nngroup.com/articles/empty-state-interface-design/
- Laws of UX: https://lawsofux.com/