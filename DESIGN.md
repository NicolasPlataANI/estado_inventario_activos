# Design System Specification: The Civic Luminary

## 1. Overview & Creative North Star
This design system is a departure from the cold, sterile aesthetics typical of institutional platforms. It is built upon the **"Civic Luminary"** creative north star—an approach that treats government and infrastructure data not as a bureaucratic ledger, but as a warm, transparent, and authoritative architectural layer.

The system breaks the "template" look by eschewing traditional grids in favor of **Tonal Layering** and **Intentional Asymmetry**. We move away from the heavy lifting of black lines and borders, instead using the warmth of the cream palette and the energy of the orange accents to create a sense of light and depth. The goal is a "High-End Editorial" experience: one where whitespace is a functional component and typography carries the weight of the brand's authority.

---

## 2. Colors
Our palette is a sophisticated blend of sun-drenched earth tones and professional slates. It is designed to feel warm yet disciplined.

*   **Primary (`#a04100`) & Primary Container (`#fa6f18`):** Use these for moments of high action and energy. The transition between these two creates a "glow" effect rather than a flat fill.
*   **Surface (`#fff8f4`) & Surface Containers:** These are the bedrock of the system. We avoid pure white in favor of these cream-based neutrals to reduce eye strain and provide a premium "paper" feel.
*   **Secondary (`#4e6073`):** Reserved for technical data, secondary actions, and providing a cooling contrast to the warmth of the primary orange.

### The "No-Line" Rule
**Designers are prohibited from using 1px solid borders to define sections.** Boundaries must be established through color shifts. A `surface-container-low` (`#fdf2e9`) section sitting on a `surface` (`#fff8f4`) background provides enough contrast to signify a new area without the visual "noise" of a line.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
1.  **Base Layer:** `surface`
2.  **Structural Sections:** `surface-container`
3.  **Interactive Cards:** `surface-container-lowest` (pure white) to provide a "lifted" appearance.

### The "Glass & Gradient" Rule
To elevate the experience beyond standard UI, use **Glassmorphism** for floating elements (like top navigation bars or sticky headers). Apply a `surface` color at 80% opacity with a `20px` backdrop-blur. For hero sections, use subtle linear gradients transitioning from `primary` to `primary_container` at a 135-degree angle to inject "soul" into the professional layout.

---

## 3. Typography
The typography system balances the geometric authority of **Public Sans** with the utilitarian precision of **Inter**.

*   **Display & Headlines (Public Sans):** These are your "Editorial" voices. Use `display-lg` (3.5rem) with generous letter-spacing to create a sense of scale and institutional importance. Headlines should feel architectural—solid and unmoving.
*   **Title & Body (Inter):** Inter handles the "Human" side of the interface. Use `body-lg` (1rem) for general reading to maintain high legibility.
*   **Hierarchy as Identity:** By utilizing high contrast between the massive `display` sizes and the tightly-set `label` sizes, we convey a brand that is both visionary (large) and detail-oriented (small).

---

## 4. Elevation & Depth
Depth in this design system is achieved through **Tonal Layering** rather than heavy-handed shadows.

*   **The Layering Principle:** Avoid the "floating" look unless an element is truly temporary (like a menu). Instead, stack tiers. Place a `surface-container-lowest` card on top of a `surface-container-low` background. The subtle shift in cream tones creates a natural, soft lift.
*   **Ambient Shadows:** When a float is required, shadows must be extra-diffused. Use a blur of `32px` to `48px` with an opacity of no more than 6%. The shadow color should be a tinted version of our `on-surface` color (`#1f1b16`) to mimic natural sunlight.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility in complex data tables, use the `outline-variant` token at **15% opacity**. A 100% opaque border is a failure of the layout's spatial logic.
*   **Glassmorphism & Depth:** Use semi-transparent layers to allow background colors to "bleed" through. This creates an integrated feel, making the UI feel like one cohesive piece of architecture rather than disparate parts pasted together.

---

## 5. Components

### Buttons
*   **Primary:** High-pill shape (`rounded-full`). Use a gradient fill from `primary` to `primary-container`. Typography is `label-md` in `on-primary` (White).
*   **Secondary:** `outline-variant` Ghost Border (20% opacity) with `primary` text. No fill.
*   **States:** On hover, the primary button should shift 2px upward with a subtle `ambient-shadow`.

### Cards & Lists
*   **The Divider Ban:** Never use a horizontal line to separate list items. Use vertical whitespace (from the `xl` spacing scale) or a subtle alternating background shift between `surface-container` and `surface-container-low`.
*   **Card Styling:** Use `rounded-lg` (1rem). Cards should primarily be `surface-container-lowest` to pop against the cream backgrounds.

### Input Fields
*   **Style:** Minimalist. A soft `surface-container-high` fill with a `ghost-border` that becomes a 2px `primary` underline only on focus. This mimics the "institutional" feel of high-end stationery.

### Chips
*   **Action Chips:** Use `secondary-container` with `on-secondary-container` text. Keep corners at `rounded-md` to distinguish them from the fully rounded buttons.

### Additional Signature Component: The "Data Totem"
In an infrastructure context, use large-scale vertical "Data Totems"—tall, slim containers using `surface-container-highest` to display key KPIs. This breaks the horizontal rhythm of the cards and adds an editorial feel.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical padding to create visual interest (e.g., more padding at the top of a card than the bottom).
*   **Do** lean into the "Warmth." Ensure the cream background is the dominant color, not white.
*   **Do** use `display-lg` typography for page titles to establish clear, authoritative hierarchy.

### Don't
*   **Don't** use standard "drop shadows" (e.g., 0px 4px 10px Black). They feel "off-the-shelf" and cheap.
*   **Don't** use 1px solid borders for layout containers. 
*   **Don't** use pure black for text. Always use `on-surface` (`#1f1b16`) to maintain the tonal warmth of the system.
*   **Don't** crowd elements. If the layout feels tight, increase the whitespace by one step on the scaling system. This is an institutional portal; it should feel "spacious" and "unhurried."