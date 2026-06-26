---
name: Open Spot
colors:
  surface: "#f9f9f9"
  surface-dim: "#dadada"
  surface-bright: "#f9f9f9"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f3f3f3"
  surface-container: "#eeeeee"
  surface-container-high: "#e8e8e8"
  surface-container-highest: "#e2e2e2"
  on-surface: "#1b1b1b"
  on-surface-variant: "#4c4546"
  inverse-surface: "#303030"
  inverse-on-surface: "#f1f1f1"
  outline: "#7e7576"
  outline-variant: "#cfc4c5"
  surface-tint: "#5e5e5e"
  primary: "#000000"
  on-primary: "#ffffff"
  primary-container: "#1b1b1b"
  on-primary-container: "#848484"
  inverse-primary: "#c6c6c6"
  secondary: "#5e5e5e"
  on-secondary: "#ffffff"
  secondary-container: "#e3e2e2"
  on-secondary-container: "#646464"
  tertiary: "#000000"
  on-tertiary: "#ffffff"
  tertiary-container: "#1b1b1b"
  on-tertiary-container: "#848484"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  primary-fixed: "#e2e2e2"
  primary-fixed-dim: "#c6c6c6"
  on-primary-fixed: "#1b1b1b"
  on-primary-fixed-variant: "#474747"
  secondary-fixed: "#e3e2e2"
  secondary-fixed-dim: "#c7c6c6"
  on-secondary-fixed: "#1b1c1c"
  on-secondary-fixed-variant: "#464747"
  tertiary-fixed: "#e2e2e2"
  tertiary-fixed-dim: "#c6c6c6"
  on-tertiary-fixed: "#1b1b1b"
  on-tertiary-fixed-variant: "#474747"
  background: "#f9f9f9"
  on-background: "#1b1b1b"
  surface-variant: "#e2e2e2"
typography:
  display-hero:
    fontFamily: Archivo Narrow
    fontSize: 48px
    fontWeight: "700"
    lineHeight: "1.1"
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Archivo Narrow
    fontSize: 32px
    fontWeight: "700"
    lineHeight: "1.2"
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Archivo Narrow
    fontSize: 24px
    fontWeight: "700"
    lineHeight: "1.2"
    letterSpacing: -0.02em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "300"
    lineHeight: "1.6"
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "300"
    lineHeight: "1.5"
    letterSpacing: 0em
  cta-link:
    fontFamily: Archivo Narrow
    fontSize: 16px
    fontWeight: "700"
    lineHeight: "1.2"
    letterSpacing: 0.02em
  label-xs:
    fontFamily: Archivo Narrow
    fontSize: 12px
    fontWeight: "600"
    lineHeight: "1"
    letterSpacing: 0.05em
spacing:
  margin-mobile: 1.25rem
  margin-desktop: 4rem
  gutter: 1rem
  section-gap: 5rem
  stack-sm: 0.5rem
  stack-md: 1.5rem
---

## Brand & Style

The design system is rooted in a **High-Contrast Minimalist** aesthetic, drawing inspiration from high-end editorial magazines and brutalist architecture. It serves as a stark, neutral canvas for skateboarding photography, ensuring that the vibrancy of the sport is the only source of color in the interface.

The target audience consists of skateboarders and action sports riders who value authenticity, speed, and clarity. The UI evokes a sense of "urban luxury"—it is raw yet refined, prioritizing high-legibility and a structural "frame" that never competes with user-generated content. All decorative elements are stripped away to focus on the essential vertical rhythm of spot-finding and navigation.

## Colors

This design system utilizes a strict monochrome palette.

- **Primary Black (#000000):** Used for all headlines, primary text, navigation backgrounds, and stroke weights.
- **Pure White (#FFFFFF):** Used for the primary surface background to create maximum "negative space."
- **Neutral Grey (#767676):** Used sparingly for secondary metadata, footer dividers, and the thin utility bar text.

Color is strictly prohibited in UI elements (no success greens or error reds). Interactive states are communicated through typographic weight shifts and underlines.

## Typography

The typographic system relies on a high-contrast pairing between **Archivo Narrow** and **Inter**.

Headlines use Archivo Narrow with bold weights and tight tracking to create an impactful, "newsprint" feel. All headlines should be set in uppercase to reinforce the architectural structure of the layout.

Body text uses Inter with a light weight (300) and standard sentence-case to provide a breathable, legible reading experience against the dense headlines. CTAs are always bold, uppercase, and underlined.

## Layout & Spacing

The layout follows a **Fluid Grid** model with generous vertical whitespace (section-gap) to separate discrete modules.

- **Hero Sections:** Always full-bleed (edge-to-edge) to emphasize the photography.
- **Columns:** On mobile, a 2-column grid is used for the "Featured Grid." On desktop, this scales to a 4-column or 6-column layout.
- **Vertical Rhythm:** Elements within a module use a tight "stack-sm" (8px), while distinct modules are separated by "section-gap" (80px) to maintain an editorial feel.
- **Sticky Header:** The primary header remains fixed at the top, preceded by a 32px thin utility bar in black.

## Elevation & Depth

This design system avoids all shadows, blurs, and gradients. Depth is achieved purely through **Tonal Layering** and **High-Contrast Outlines**.

- **Level 0:** Pure white background.
- **Level 1:** Content cards or sections defined by 1px solid black borders (no shadows).
- **Overlays:** Full-screen flyouts or mega-menus use solid white backgrounds that slide over content, obscuring the view entirely to maintain focus.
- **Imagery:** High-fidelity photography provides the only sense of three-dimensional depth within the frame.

## Shapes

The shape language is strictly **Sharp (0px)**. All containers, buttons (links), and image frames must have hard 90-degree corners. This reinforces the brutalist, industrial nature of the skateboarding environment. Rounding or softening of corners is not permitted under any circumstances.

## Components

### CTAs & Buttons

There are no traditional "pill" or "filled" buttons. All actions are **Typographic Links**.

- **Style:** Archivo Narrow Bold, Uppercase, with a 1.5pt black underline.
- **Hover/Active:** On interaction, the text or underline may shift weight or slightly offset, but the color remains black.

### Header & Navigation

- **Utility Bar:** A thin (32px) black strip at the very top for region selection and secondary links in white label-xs text.
- **Primary Header:** Sticky white bar with a black logo and thin line icons.
- **Mega-Menu:** A full-width flyout that triggers from the header, using a multi-column layout for "Spots," "Community," and "Gear."

### Cards & Grids

- **Featured Grid:** Images are housed in sharp-edged containers. Typography (Spot Name, Distance) is placed directly beneath the image in a vertical stack.
- **Hero Carousel:** A full-bleed image background with centered or bottom-left aligned white typography.

### Form Elements

- **Input Fields:** 1px solid black bottom-border only (no box). Placeholder text is Inter Light in grey.
- **Checkboxes/Radios:** Square 1px black strokes. A solid black fill indicates the "selected" state.

### Iconography

- **Style:** 1px weight, monochrome line icons. No fills. Icons should be used sparingly and always accompanied by labels where possible.
