# Astryx UI Component Library

This project has @astryxdesign/core, @astryxdesign/theme-neutral, and 
@astryxdesign/cli installed.

When building or editing any UI component (buttons, forms, modals, dropdowns, 
tables, dialogs, navigation), check Astryx first before writing custom HTML/CSS:

1. Run `npm run astryx -- component --list` to see available components.
2. Prefer an Astryx component over a hand-written one when it fits the need.
3. Style Astryx components using our existing theme tokens (sand/cream palette, 
   Fraunces/DM Mono/Satoshi fonts) via CSS custom property overrides — do not 
   adopt Astryx's default theme wholesale.
4. Do NOT swap out existing working components just to use Astryx — only use 
   it for new components, or ones already being rebuilt for another reason.
5. Always show the raw git diff after any change, no summaries.

If Astryx doesn't have a suitable component, write it by hand as usual.
