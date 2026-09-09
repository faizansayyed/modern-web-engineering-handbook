# Frontend Interview Q&A — HTML & CSS

> A practical interview guide with clear explanations, real-world examples, code snippets, common mistakes, and production-oriented scenarios.

---

## HTML — Simple & Tricky Questions

*15 questions*

### 1. What is the difference between `async` and `defer` on a script tag?

**Difficulty:** Tricky

When the browser reads HTML top-to-bottom, it normally **stops everything** when it hits a `<script>` tag, downloads it, runs it, then continues. Both `async` and `defer` stop that pause — but differently.

> 🏠 **Analogy:** Reading a book. A normal script = stopping to answer a phone call mid-sentence. **defer** = writing "call back later" — finish the book first, then call. **async** = answer the call the moment it rings, even if you're mid-sentence.

| Type | Downloads while page loads? | When does it run? | Order kept? |
| --- | --- | --- | --- |
| Normal script | ❌ Blocks everything | Right away — blocks page | Yes |
| `async` | ✅ Background | As soon as download finishes — may pause parsing | ❌ No |
| `defer` | ✅ Background | After ALL HTML is read — before page is shown | ✅ Yes |

> ✅ **Simple rule:** Use `defer` for your own app scripts (need DOM ready). Use `async` for independent scripts like Google Analytics that don't depend on other scripts.

> ⚠️ **If you write both together** — the browser uses `async`. `defer` is only a fallback for very old browsers.

---

### 2. What is `srcset`? What is the difference between `w` and `x` descriptors?

**Difficulty:** Medium

`srcset` lets you give the browser **multiple versions of the same image**. The browser picks the best one for the device screen.

- **x descriptors** — based on screen pixel density (1x = normal, 2x = retina/high-DPI)
- **w descriptors** — based on the image's actual pixel width. Works with `sizes` to pick the best match for both screen width AND pixel density.

```html
<!-- x descriptor: fixed-size UI (logos, icons) -->
<img src="logo.jpg" srcset="logo@2x.jpg 2x" alt="Logo">

<!-- w descriptor + sizes: content images (RECOMMENDED) -->
<img
  src="photo-800.jpg"
  srcset="photo-400.jpg 400w, photo-800.jpg 800w, photo-1600.jpg 1600w"
  sizes="(max-width: 600px) 100vw, 50vw"
  alt="My photo"
>
```

> 🔥 **Tricky browser behavior:** Once a browser downloads a high-res image and caches it, it will NOT downgrade to a lower-res version even if the screen gets smaller. It only upgrades, never downgrades.

---

### 3. What fires first: `DOMContentLoaded` or `window.load`?

**Difficulty:** Easy

**DOMContentLoaded** fires first — when the browser finishes reading HTML and building the DOM. Images and CSS may still be loading.

**window.load** fires last — when EVERYTHING is done: HTML, images, CSS, fonts, iframes.

> 🏠 **Analogy:** Building a house — DOMContentLoaded = walls are up. window.load = furniture and paintings are all inside too.

> ⚠️ **Sneaky trap:** CSS stylesheets can delay DOMContentLoaded! If a `<script>` tag appears after a `<link stylesheet>`, the browser waits for the CSS before running the script. This chains the wait to DOMContentLoaded.

---

### 4. What is the difference between `display:none`, `visibility:hidden`, and `opacity:0`?

**Difficulty:** Tricky

All three make something invisible — but they work very differently under the hood.

| Method | Space on page? | Screen reader reads? | Still clickable? |
| --- | --- | --- | --- |
| `display:none` | ❌ Gone | ❌ No | ❌ No |
| `hidden` attribute | ❌ Gone | ❌ No | ❌ No |
| `visibility:hidden` | ✅ Blank space stays | ❌ No | ❌ No |
| `opacity:0` | ✅ Space stays | ✅ YES — reads it! | ✅ YES — clickable! |
| `aria-hidden="true"` | ✅ Visible on screen | ❌ Skipped | ✅ Yes |

> 🔥 **Big danger with opacity:0** — the element is invisible BUT still takes clicks! Malicious sites use this for "invisible button" attacks (clickjacking). Never use `opacity:0` to hide interactive elements.

---

### 5. Why is `innerHTML` dangerous? What should you use instead?

**Difficulty:** Hard

`innerHTML` writes raw HTML into the page. If you include user-supplied text, the browser will **execute any HTML/scripts inside it**. This is an XSS (Cross-Site Scripting) attack.

```html
// ❌ DANGEROUS — userInput could be: <img src=x onerror="stealCookies()">
document.getElementById('name').innerHTML = userInput;
// Browser runs the onerror script!

// ✅ SAFE — shows as plain text, never executes as HTML
document.getElementById('name').textContent = userInput;
```

> ✅ **Simple rule:**
> - User text → always use `textContent`
> - Your own trusted HTML → `innerHTML` is okay
> - Must display user-submitted HTML (rich text editor) → sanitize with **DOMPurify** first

---

### 6. What are `data-*` attributes? When should you use and avoid them?

**Difficulty:** Easy

`data-*` attributes store custom information on HTML elements. You read them in JS via `element.dataset`.

```html
<button data-product-id="42" data-price="19.99">Add to cart</button>

<script>
  btn.addEventListener('click', () => {
    console.log(btn.dataset.productId); // "42"
    console.log(btn.dataset.price);     // "19.99"
  });
</script>
```

> ⚠️ **Don't use them for:**
> - Secrets or passwords — anyone can see them in DevTools
> - Objects or arrays — must be JSON.stringified (always strings)
> - Data you read thousands of times per second — a plain JS object is faster

---

### 7. What is the `<template>` element? How is it different from a hidden div?

**Difficulty:** Medium

The `<template>` element holds HTML that the browser parses but **completely ignores until you use it**. Images don't download, scripts don't run.

A hidden div (`display:none`) IS part of the live page — images download, scripts run, IDs must be unique.

```html
<template id="card-tpl">
  <div class="card">
    <img src="..."> <!-- does NOT load yet -->
    <p>Card content</p>
  </div>
</template>

<script>
  const tpl = document.querySelector('#card-tpl');
  const copy = tpl.content.cloneNode(true);
  document.body.appendChild(copy); // NOW it activates and image loads
</script>
```

---

### 8. Why should external links use `rel="noopener noreferrer"`?

**Difficulty:** Medium

When you open a link with `target="_blank"`, the new tab can **reach back and control the original tab** via `window.opener`. A malicious site can redirect your original page to a phishing site.

```html
<!-- Malicious page could do: -->
window.opener.location = 'https://fake-bank.com';

<!-- ✅ Fix: add noopener to all external links -->
<a href="https://external.com" target="_blank" rel="noopener noreferrer">
  Visit site
</a>
```

> ✅ **noopener** = blocks access to window.opener. **noreferrer** = also hides your page URL from the destination (and implies noopener). Chrome 88+ applies noopener automatically for cross-origin links, but still write it for older browsers.

---

### 9. What do `tabindex` values 0, -1, and positive numbers do?

**Difficulty:** Medium

| Value | What it does | Use it? |
| --- | --- | --- |
| `0` | Makes any element focusable via Tab — in natural reading order | ✅ Yes |
| `-1` | Focusable by JS only (`.focus()`) — NOT in tab order | ✅ Yes |
| `1, 2, 3…` | Creates a special priority order BEFORE all tabindex=0 elements | ❌ Avoid |

> 🔥 **Never use positive tabindex values.** They cause Tab to jump around in confusing ways that break keyboard navigation for all users.

> 💡 **tabindex="-1" use case:** When a modal opens, call `element.focus()` in JS to move focus inside. The element is programmatically focusable but doesn't appear in the Tab order on its own.

---

### 10. What is the difference between `textContent` and `innerText`?

**Difficulty:** Tricky

|  | textContent | innerText |
| --- | --- | --- |
| Returns | All text, including hidden elements | Only visible text (respects CSS) |
| Speed | ✅ Fast — no layout needed | ⚠️ Slower — triggers a reflow |
| Newlines | Preserves raw whitespace | Respects CSS layout (block elements = newlines) |

> ✅ **Default: use `textContent`** — it's faster. Use `innerText` only when you need to match exactly what the user sees on screen (e.g., copy-to-clipboard).

---

### 11. What is Shadow DOM? Explain it simply.

**Difficulty:** Hard

Shadow DOM is a **private, isolated HTML/CSS bubble** you can attach inside an element. CSS outside cannot affect it. CSS inside cannot leak out.

> 🏠 **Analogy:** A fish tank inside your house. Decorations inside the tank (Shadow DOM) don't follow your house's interior design rules. They're separate worlds.

```js
const shadow = element.attachShadow({ mode: 'open' });
shadow.innerHTML = `
  <style>p { color: red; }</style> <!-- only affects this shadow -->
  <p>I am isolated!</p>
`;
```

> ⚠️ **One exception:** CSS custom properties (like `--my-color`) DO pierce the shadow boundary. This is intentional — use variables to theme Web Components from outside.

---

### 12. What is the default `type` of a `<button>`? Why does this cause bugs?

**Difficulty:** Tricky

A `<button>` without a `type` attribute defaults to `type="submit"`. It will **submit any form it's inside**.

> 🔥 **Classic bug:** A "Close modal" button inside a form, no type attribute → clicking Close accidentally submits the form.

```html
<!-- ❌ Submits the form! -->
<button>Close</button>

<!-- ✅ Does nothing by default (needs JS to do something) -->
<button type="button">Close</button>

<!-- ✅ Explicit submit -->
<button type="submit">Save</button>
```

---

### 13. What does `loading="lazy"` do on images? What is the big mistake with it?

**Difficulty:** Tricky

`loading="lazy"` tells the browser: *"Don't download this image until the user scrolls near it."* Great for speeding up initial page load.

> 🔥 **Most common mistake:** Adding `loading="lazy"` to the hero image at the top of the page. This IS the most important image — making it lazy delays it and **destroys your Google LCP score**.

```html
<!-- ❌ WRONG on the hero/banner image -->
<img src="hero.jpg" loading="lazy" alt="Welcome">

<!-- ✅ Hero image should load with high priority -->
<img src="hero.jpg" fetchpriority="high" alt="Welcome">

<!-- ✅ Lazy is correct for images below the fold -->
<img src="product.jpg" loading="lazy" alt="Product">
```

---

### 14. What is semantic HTML and why does it matter?

**Difficulty:** Easy

Semantic HTML means using the **right tag for the right purpose**. Tags like `<nav>`, `<main>`, `<button>`, `<article>` tell both the browser and assistive tech what the content IS — not just how it looks.

```html
<!-- ❌ Non-semantic — just boxes with no meaning -->
<div class="header">
  <div class="nav">...</div>
</div>

<!-- ✅ Semantic — browser and screen readers understand the structure -->
<header>
  <nav>...</nav>
</header>
<main>
  <article>...</article>
</main>
```

> ✅ **Benefits:** Screen readers navigate by landmarks. Google better understands your content. `<button>` is keyboard-operable by default — a `<div>` is not (you'd need to add all that behavior manually).

---

### 15. What is the difference between `id` and `class`?

**Difficulty:** Easy

|  | id | class |
| --- | --- | --- |
| Unique? | ✅ Only one per page | ❌ Use on many elements |
| CSS | `#myId` (high specificity) | `.myClass` (lower specificity) |
| URL linking | ✅ `href="#section"` works | ❌ Cannot link to it |
| Multiple per element | ❌ One only | ✅ Many: `class="btn btn-primary"` |

> ✅ Use `id` for page landmarks, form field labels (`for="myId"`), and JS targeting one element. Use `class` for everything else — styling and grouping elements.

---

## CSS — Simple & Tricky Questions

*15 questions*

### 1. How does CSS specificity work? Which rule wins when two conflict?

**Difficulty:** Tricky

Every CSS rule has a score. The rule with the **higher score wins**, regardless of order in the file.

| Selector type | Score | Example |
| --- | --- | --- |
| Inline style | 1000 | `style="color:red"` |
| ID | 100 | `#header` |
| Class / pseudo-class / attribute | 10 | `.btn`, `:hover` |
| Element / pseudo-element | 1 | `p`, `::before` |
| Universal `*` | 0 | `*` |

> ⚠️ **Tricky newer selectors:** `:is()` takes the specificity of its strongest argument. But `:where()` always has ZERO specificity — great for base styles you want to be easily overridden.

---

### 2. Why does `z-index` sometimes not work even when set to 9999?

**Difficulty:** Hard

This happens because of **stacking contexts**. When an element creates its own stacking context, its children's z-index only competes inside that little bubble — not with the whole page.

> 🏠 **Analogy:** Think of floors in a building. A z-index is a seat number. Seat "9999" on Floor 1 is still below Floor 2's seat "1". The floor (stacking context) beats the seat number.

**Things that create a stacking context:** `opacity < 1`, `transform`, `filter`, `position + z-index`, `will-change`.

> 🔥 **Classic bug:** A modal with z-index:9999 still appears BEHIND a dropdown because the dropdown's parent has `transform`. Fix: render the modal at the root of the document (a "portal" in React terms).

---

### 3. What is margin collapse? When does it happen and when doesn't it?

**Difficulty:** Tricky

When two vertical block margins touch, they **merge into the larger one** instead of adding together.

```js
<p style="margin-bottom: 20px">First</p>
<p style="margin-top: 30px">Second</p>
/* Gap between them = 30px (NOT 50px!) */
```

> ✅ **Collapse does NOT happen when:**

Parent is a flex or grid container
Element is absolutely positioned or floated
Parent has `overflow: hidden`, border, or padding between parent and child
Horizontal margins — NEVER collapse
> - Parent is a flex or grid container
> - Element is absolutely positioned or floated
> - Parent has `overflow: hidden`, border, or padding between parent and child
> - Horizontal margins — NEVER collapse

---

### 4. What is `will-change`? What is right and wrong about how people use it?

**Difficulty:** Hard

`will-change` is a hint to the browser: *"I'm about to animate this — get a GPU layer ready."* Without it, there's a first-frame stutter when the animation starts.

> 🔥 **Wrong uses (very common):**

Adding it to every element — each element gets its own GPU layer (huge memory waste)
`will-change: all` — meaningless
Leaving it on permanently — only needed just before animation
> - Adding it to every element — each element gets its own GPU layer (huge memory waste)
> - `will-change: all` — meaningless
> - Leaving it on permanently — only needed just before animation

```js
/* ✅ Correct: add before animation, remove after */
element.addEventListener('mouseenter', () => {
  element.style.willChange = 'transform';
});
element.addEventListener('animationend', () => {
  element.style.willChange = 'auto'; // clean up!
});
```

---

### 5. What are CSS custom properties (variables)? How are they different from Sass variables?

**Difficulty:** Medium

```js
:root { --brand-color: #0066cc; }
.button { background: var(--brand-color); }

/* Change entire theme at runtime with one JS line */
document.documentElement.style.setProperty('--brand-color', '#ff0000');
```

| Feature | CSS Custom Properties | Sass Variables ($var) |
| --- | --- | --- |
| Change at runtime? | ✅ Yes — live in browser | ❌ No — compiled away at build time |
| Change with media queries? | ✅ Yes | ❌ No |
| Read/write from JS? | ✅ Yes | ❌ No |
| Inherited in DOM? | ✅ Yes | ❌ No |

---

### 6. Why is animating `transform` faster than animating `top/left`?

**Difficulty:** Hard

Changing `top`/`left` → browser recalculates the whole page layout. Slow.

Changing `transform`/`opacity` → browser just moves a GPU texture. No layout recalc. Instant.

| Property | Triggers layout? | Performance |
| --- | --- | --- |
| width, height, top, left | ✅ Yes (expensive) | 🔴 Slow |
| color, background | ❌ No | 🟡 Medium |
| transform, opacity | ❌ No (compositor only) | 🟢 Fastest |

> ✅ Use `translateX()` instead of `left`. Use `scaleX()` instead of `width`. These go to the GPU compositor and never touch layout.

---

### 7. What is `clamp()`? Write a simple fluid typography example.

**Difficulty:** Medium

`clamp(min, preferred, max)` = use the preferred value, but never go below min or above max. Great for values that should grow/shrink with screen size.

```css
/* Font: min 1rem, grows with viewport, max 2rem — no media queries needed */
h1 { font-size: clamp(1rem, 4vw, 2rem); }

/* Padding that shrinks on small screens */
.card { padding: clamp(1rem, 5vw, 3rem); }

/* Container: full width on mobile, max 1200px on desktop */
.container { width: min(100% - 2rem, 1200px); margin-inline: auto; }
```

---

### 8. What is CSS `@layer`? Why is it useful?

**Difficulty:** Hard

`@layer` organizes CSS into named groups with a clear priority order. Higher layers always win — **regardless of specificity**.

> 🏠 **Analogy:** Floors in a building. Floor 3 (utilities) always beats Floor 1 (reset) — no specificity fights.

```css
/* Declare order: utilities always beats base, base beats reset */
@layer reset, base, utilities;

@layer reset   { * { margin: 0; } }
@layer base    { p { font-size: 1rem; color: gray; } }
@layer utilities { .text-red { color: red; } } /* always wins */
```

> 💡 **Styles outside any layer beat all layers.** Your own unlayered CSS always overrides library styles in layers — no `!important` needed.

---

### 9. What is the CSS `:has()` selector? What problem does it solve?

**Difficulty:** Medium

`:has()` is the long-awaited **parent selector**. Style a parent based on what's inside it — something CSS couldn't do before.

```js
/* Style a form-group that has an invalid input inside */
.form-group:has(input:invalid) { border: 2px solid red; }

/* Card with no image gets padding; card with image gets none */
.card:has(img) { padding: 0; }

/* Bold list items that have nested lists */
li:has(> ul) { font-weight: bold; }
```

> ✅ Before `:has()`, you needed JavaScript to add a class when a child state changed. Now CSS handles it natively. Works in all modern browsers.

---

### 10. What are CSS container queries? How are they different from media queries?

**Difficulty:** Hard

**Media queries** respond to the viewport (browser window) width. **Container queries** respond to the width of the *parent element*.

> 🏠 **Analogy:** **🏠 Real problem:** A card in a narrow sidebar needs vertical layout. Same card in a wide main area needs horizontal layout. Same viewport size — but different context. Container queries solve this.

```css
/* Step 1: Mark the parent as a container */
.card-wrapper { container-type: inline-size; }

/* Step 2: Style based on container width */
@container (min-width: 400px) {
  .card { flex-direction: row; } /* horizontal when container is wide */
}
```

---

### 11. What is `aspect-ratio` and how does it prevent layout shift?

**Difficulty:** Medium

Before images load, the browser doesn't know their height. This causes a layout jump when the image appears. `aspect-ratio` tells the browser the shape in advance, so it reserves the right space.

```css
img {
  width: 100%;
  aspect-ratio: 16 / 9; /* reserves height before image loads */
  object-fit: cover;
}

/* Old "padding-top hack" — no longer needed */
.old-way { position: relative; padding-top: 56.25%; }
```

> ✅ Always set both `width` and `height` attributes on `<img>` tags too — browsers use them to reserve space before CSS loads.

---

### 12. What is `content-visibility: auto`? How does it speed up pages?

**Difficulty:** Hard

`content-visibility: auto` tells the browser: *"Skip layout and paint work for off-screen elements."* It's like native lazy-rendering for CSS.

> 🏠 **Analogy:** Theatre backstage — actors don't need full costumes until they walk on stage. Off-screen elements don't get rendered until they scroll into view.

```css
.article-card {
  content-visibility: auto;
  /* Give height estimate so scrollbar stays correct */
  contain-intrinsic-size: 0 300px;
}
```

> ⚠️ Without `contain-intrinsic-size`, off-screen elements collapse to 0 height, causing the scrollbar to jump as you scroll.

---

### 13. What is the difference between Flexbox and CSS Grid? When do you use each?

**Difficulty:** Easy

|  | Flexbox | CSS Grid |
| --- | --- | --- |
| Direction | One axis: row OR column | Two axes: rows AND columns |
| Control comes from | Children decide their size | Parent defines the tracks |
| Best for | Navigation, button groups, centering items | Page layout, card grids, 2D alignment |

```css
/* Flexbox: items in a row */
.nav { display: flex; align-items: center; gap: 1rem; }

/* Grid: card grid that auto-fills */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}
```

> ✅ **Quick rule:** "Items in a line?" → Flexbox. "Need rows AND columns to align?" → Grid. You can mix them — Grid for page layout, Flexbox inside each card.

---

### 14. What is the CSS `contain` property? Why does it help performance?

**Difficulty:** Hard

`contain` tells the browser: *"This element and its children are independent. Changes inside don't affect anything outside."* The browser can then skip work on the rest of the page.

```css
.card { contain: content; }
/* contain: content = layout + paint + style contained */

/* Now when one card changes, browser only re-renders THAT card */
/* Without contain: the whole page might need recalculation */
```

> ✅ A page with 100 cards: without `contain`, changing one card might reflow all 100. With `contain: content`, only the changed card is recalculated.

---

### 15. What is CSS `subgrid` and when do you need it?

**Difficulty:** Hard

A nested grid creates its own column/row definitions — it doesn't align with the outer grid. `subgrid` lets the inner grid borrow the outer grid's tracks.

> 🏠 **Analogy:** **🏠 Real case:** A card grid where card titles, bodies, and footers must align across all cards in a row, no matter how much text each has. Subgrid makes all rows align automatically.

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto 1fr auto; /* title | body | footer */
}
.card {
  grid-row: span 3;
  display: grid;
  grid-template-rows: subgrid; /* borrows parent's row heights */
}
/* All card titles/bodies/footers now line up across columns */
```

---

## Responsive Design

*8 questions*

### 1. What does `<meta name="viewport">` do and why do you need it?

**Difficulty:** Easy

Without this tag, mobile browsers pretend they're 980px wide and show a tiny zoomed-out desktop site. This tag says: **"Match the actual device width."**

```js
<meta name="viewport" content="width=device-width, initial-scale=1">
```

> 🔥 **Never add `user-scalable=no`** — it prevents zoom, breaking accessibility for low-vision users. This also violates WCAG 1.4.4 and hurts Google rankings.

---

### 2. What is the difference between px, em, rem, vw, vh, dvh?

**Difficulty:** Medium

| Unit | Relative to | Best used for |
| --- | --- | --- |
| `px` | Screen pixels | Borders, box-shadows, breakpoints |
| `em` | Current element font-size | Button padding that scales with font |
| `rem` | Root (html) font-size — usually 16px | Typography, spacing — consistent everywhere |
| `vw / vh` | Viewport width / height | Full-screen sections, hero banners |
| `dvh` | Dynamic viewport height (adjusts as mobile browser UI shows/hides) | Full-height mobile layouts (fixes iOS address bar bug) |

> ✅ On iOS, `100vh` includes the address bar height and overflows. Use `100dvh` for mobile full-screen layouts.

---

### 3. What is mobile-first CSS? Why is it preferred?

**Difficulty:** Easy

**Mobile-first:** Base CSS is for small screens. Add `min-width` media queries to enhance for larger screens.

```css
.card { flex-direction: column; }   /* base: mobile */
@media (min-width: 768px) {
  .card { flex-direction: row; }    /* enhancement: tablet+ */
}
```

> ✅ Mobile users download less CSS — the base is already lean. Desktop users have faster networks and more power to handle the extra styles. Tailwind, Bootstrap, and most modern frameworks are mobile-first.

---

### 4. What are OS preference media features: `prefers-color-scheme`, `prefers-reduced-motion`?

**Difficulty:** Medium

```css
/* Auto dark mode based on OS setting */
@media (prefers-color-scheme: dark) {
  body { background: #0d1117; color: #e6edf3; }
}

/* Disable ALL animations for users with motion sensitivity */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}

/* High contrast for users who need it */
@media (prefers-contrast: more) {
  .btn { border: 2px solid black; }
}
```

> 💡 Always also provide a manual toggle in your UI. OS preference is the default — users should be able to override it per-site.

---

### 5. When do you use `<picture>` instead of just `srcset`?

**Difficulty:** Medium

`srcset`: same image at different sizes — browser picks best. `<picture>`: you have full control — different formats, different crops per screen.

```html
<picture>
  <source type="image/avif" srcset="hero.avif"> <!-- newest browsers -->
  <source type="image/webp" srcset="hero.webp"> <!-- modern browsers -->
  <source media="(max-width: 600px)" srcset="hero-portrait.jpg"> <!-- mobile crop -->
  <img src="hero.jpg" alt="Welcome"> <!-- fallback -->
</picture>
```

> ✅ **Rule:** Same image, different sizes → `srcset`. Different crop/format/subject → `<picture>`.

---

### 6. How do you make a responsive grid without any media queries?

**Difficulty:** Hard

```css
.grid {
  display: grid;
  /* Creates as many columns as fit, each at least 250px wide */
  grid-template-columns: repeat(auto-fill, minmax(min(250px, 100%), 1fr));
  gap: 1.5rem;
}
```

Result: 1 column on mobile, 2-3 on tablet, 4+ on desktop. Zero media queries needed. The grid figures it out based on available space.

> ✅ `min(250px, 100%)` prevents overflow on very narrow screens — the column will never be wider than its container.

---

### 7. What are the most common responsive design mistakes?

**Difficulty:** Medium

- **Hardcoded pixel widths** wider than the screen → horizontal scroll
- **Disabling user zoom** → accessibility violation
- **Lazy loading hero images** → terrible LCP score
- **Not using logical CSS properties** → breaks RTL language layouts
- **Device-based breakpoints** (320px, 768px) → devices change constantly. Break where content breaks instead.
- **Serving oversized images** → 3MB image for a 300px slot wastes bandwidth

---

### 8. How do you make a table responsive on mobile without ugly horizontal scrolling?

**Difficulty:** Medium

```css
/* Card layout: each row becomes its own card on mobile */
@media (max-width: 600px) {
  thead { display: none; }
  tr { display: block; margin-bottom: 1rem; border: 1px solid #ccc; border-radius: 8px; }
  td { display: flex; justify-content: space-between; padding: 8px 12px; }
  td::before { content: attr(data-label); font-weight: bold; }
}

<!-- HTML: label each cell -->
<td data-label="Name">John Smith</td>
<td data-label="Email">john@example.com</td>
```

---

## Accessibility — WCAG

*8 questions*

### 1. What is WCAG? What are the 4 POUR principles and 3 levels?

**Difficulty:** Easy

| Principle | Simple meaning |
| --- | --- |
| **P**erceivable | All content can be seen or heard (alt text, captions) |
| **O**perable | All features work with keyboard, not just mouse |
| **U**nderstandable | Text is readable, errors are clear, pages are consistent |
| **R**obust | Works with current and future screen readers |

**Levels:** A = bare minimum. **AA = legal standard for most apps.** AAA = gold standard.

---

### 2. What is alt text? What should you write?

**Difficulty:** Easy

```html
<!-- ❌ Missing — screen reader says the filename -->
<img src="photo_2024_final.jpg">

<!-- ❌ Too vague -->
<img src="chart.png" alt="image">

<!-- ✅ Descriptive and meaningful -->
<img src="chart.png" alt="Bar chart showing 40% revenue growth in Q3 2024">

<!-- ✅ Decorative image — empty alt so screen reader skips it -->
<img src="decorative-swoosh.svg" alt="">
```

> ✅ Describe the PURPOSE, not just what the image shows. "Woman smiling" → bad. "Customer support agent ready to help" → good. Purely decorative images get `alt=""` (empty, not missing).

---

### 3. What is keyboard accessibility? What elements are focusable by default?

**Difficulty:** Easy

Every feature must work using only a keyboard — no mouse needed. Essential for motor-impaired users.

**Focusable by default:** `<a href>`, `<button>`, `<input>`, `<select>`, `<textarea>`, `<details>`

> 🔥 **Most common mistake:** Using a `<div>` as a button. Divs are NOT focusable and NOT keyboard activatable. Use `<button>` — you get keyboard support, focus styles, and screen reader announcement for free.

> ✅ Never use `outline: none` on focused elements without providing a replacement focus style. Keyboard users NEED to see where focus is.

---

### 4. What is a focus trap? How do you implement it in a modal?

**Difficulty:** Hard

A focus trap keeps keyboard focus **inside a modal** while it's open — so Tab doesn't reach invisible content behind the modal.

```js
function trapFocus(modal) {
  const focusable = modal.querySelectorAll('button, input, [href], [tabindex="0"]');
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();  // wrap to end
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus(); // wrap to start
    }
  });
  first.focus(); // move focus IN when modal opens
}
```

> ✅ **Easiest way:** Use the native `<dialog>` HTML element with `dialog.showModal()`. It handles focus trapping, Escape key, and screen reader role automatically — all built in.

---

### 5. What is `aria-live`? When do you use `polite` vs `assertive`?

**Difficulty:** Hard

Screen readers only announce content when you navigate to it. If content changes dynamically (loading results, notifications), `aria-live` says: *"Announce this change automatically."*

| Value | Behavior | Use for |
| --- | --- | --- |
| `polite` | Waits until user is done, then announces | Save confirmations, search results loaded |
| `assertive` | Interrupts immediately | Critical errors, session timeout warnings only |

```html
<!-- MUST be in DOM before you add text to it -->
<div aria-live="polite" id="status"></div>

document.getElementById('status').textContent = 'Your changes were saved!';
```

> 🔥 If you create the live region and add text simultaneously, screen readers often miss it. Always put the empty region in the HTML on page load, then update it later with JS.

---

### 6. What is color contrast ratio? What does WCAG require?

**Difficulty:** Medium

Contrast ratio measures how readable text is against its background. 1:1 = same color (invisible). 21:1 = black on white (maximum).

| Content | WCAG AA minimum |
| --- | --- |
| Normal text | 4.5:1 |
| Large text (18pt+) | 3:1 |
| UI components (buttons, inputs) | 3:1 |

> ⚠️ **Most common failures:** light gray text on white, placeholder text inside inputs (usually too faint), white text on light-colored buttons. Use WebAIM Contrast Checker or Chrome DevTools to verify.

---

### 7. What is the "first rule of ARIA"?

**Difficulty:** Easy

> 💡 **First Rule of ARIA:** "If you can use a native HTML element that already has the semantics and behavior built in, use it — don't use ARIA to rebuild it."

```html
<!-- ❌ Wrong: div + ARIA to fake a button -->
<div role="button" tabindex="0" onclick="save()">Save</div>
<!-- Still needs manual keyboard handlers for Enter and Space -->

<!-- ✅ Right: real button — keyboard, focus, role all built-in -->
<button onclick="save()">Save</button>
```

> 🔥 Adding `role="button"` to a div does NOT make it keyboard-activatable. You still have to manually add Enter/Space key listeners. A real `<button>` gives you all of that for free.

---

### 8. What are the new WCAG 2.2 requirements every developer should know?

**Difficulty:** Hard

| Requirement | Plain English |
| --- | --- |
| Focus Not Obscured (AA) | Sticky header/footer can't fully cover a focused button — user must see it |
| Target Size Minimum (AA) | Tap targets must be at least 24×24 CSS pixels |
| Dragging Movements (AA) | Drag-and-drop must also have a click alternative |
| Consistent Help (A) | Help link or chat widget must be in the same spot on every page |
| Redundant Entry (A) | Don't ask users to type the same info twice in a multi-step form |
| Accessible Authentication (AA) | Login must allow paste and password managers — no solve-a-puzzle CAPTCHAs |

---

## SEO — Technical Frontend

*6 questions*

### 1. What are Core Web Vitals? What does each measure?

**Difficulty:** Easy

Google's 3 measurements of real user experience. They affect your Google search ranking.

| Metric | Measures | Good score |
| --- | --- | --- |
| **LCP** — Largest Contentful Paint | How fast the main content loads (hero image or big heading) | Under 2.5 seconds |
| **INP** — Interaction to Next Paint | How fast the page responds when you click or type | Under 200ms |
| **CLS** — Cumulative Layout Shift | How much content jumps unexpectedly while loading | Under 0.1 |

> 💡 INP replaced FID in March 2024. It measures ALL interactions during the page session — much harder to fake a good score than the old FID.

---

### 2. Why does a JavaScript SPA have SEO problems? How do you fix it?

**Difficulty:** Hard

Google crawls in two waves. Wave 1: reads HTML immediately. Wave 2: runs JavaScript — this can take days or weeks. JS-rendered content may not be indexed for a long time.

> ⚠️ **Solutions (best to worst for SEO):**

**SSG** — pre-build all HTML at deploy time. Best performance. Great for blogs/marketing.
**SSR** — generate HTML on the server per request. Good for dynamic user-specific pages.
**ISR** — regenerate static pages in background (Next.js). Best of both worlds.
**CSR only** — worst for SEO. Only okay for behind-login pages Google won't crawl.
> - **SSG** — pre-build all HTML at deploy time. Best performance. Great for blogs/marketing.
> - **SSR** — generate HTML on the server per request. Good for dynamic user-specific pages.
> - **ISR** — regenerate static pages in background (Next.js). Best of both worlds.
> - **CSR only** — worst for SEO. Only okay for behind-login pages Google won't crawl.

---

### 3. What is a canonical tag? When do you need it?

**Difficulty:** Medium

The canonical tag tells Google: *"This is the official version of this page."* Prevents duplicate content penalties when the same content has multiple URLs.

```js
<link rel="canonical" href="https://example.com/shoes">

<!-- Needed when you have: -->
<!-- example.com/shoes vs example.com/shoes?color=blue -->
<!-- example.com vs www.example.com -->
<!-- example.com/shoes vs example.com/shoes/ (trailing slash) -->
```

> ✅ Every page should have a self-referencing canonical. Safest default — won't hurt anything and prevents accidental duplicates.

---

### 4. What is structured data (JSON-LD)? What does it unlock on Google?

**Difficulty:** Medium

Structured data is machine-readable info you add to your page. Google reads it and shows **rich results** in search — star ratings, price, availability.

```css
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Running Shoes",
  "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.7", "reviewCount": "842" },
  "offers": { "@type": "Offer", "price": "79.99", "priceCurrency": "USD" }
}
</script>
```

This makes star ratings, price, and stock status appear directly in the Google search result — significantly increasing click-through rate.

---

### 5. What causes layout shift (CLS) and how do you fix it?

**Difficulty:** Medium

| Cause | Fix |
| --- | --- |
| Images with no width/height | Always add `width` and `height` to every `<img>` |
| Ads with no reserved space | Give ad slots a `min-height` before the ad loads |
| Web fonts swapping | Use `font-display: optional` + preload fonts |
| Content injected above existing content | Insert below fold or inside pre-sized containers |

```html
<!-- ❌ No dimensions — page jumps when image loads -->
<img src="banner.jpg" alt="Banner">

<!-- ✅ Dimensions reserved — no jump -->
<img src="banner.jpg" width="1200" height="400" alt="Banner">
```

---

### 6. What is the difference between `preload`, `prefetch`, and `preconnect`?

**Difficulty:** Medium

| Hint | What it does | Use for |
| --- | --- | --- |
| `preconnect` | Connect to a server now so it's ready when needed | Google Fonts, external API, CDN |
| `preload` | Download this file NOW — needed very soon | Hero image, critical font, above-fold CSS |
| `prefetch` | Download in the background — might need it next page | Next-page resources user is likely to visit |

```js
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preload" as="image" href="hero.webp" fetchpriority="high">
<link rel="prefetch" href="/about">
```

---

## Performance — Core Web Vitals

*8 questions*

### 1. What is render-blocking CSS and how do you fix it?

**Difficulty:** Hard

Every `<link rel="stylesheet">` pauses the browser from showing anything until that CSS downloads. Fix: inline critical (above-fold) styles, load the rest asynchronously.

```js
<!-- Critical CSS inline — loads instantly with HTML -->
<style> header, .hero { /* above-fold styles only */ } </style>

<!-- Non-critical CSS loads without blocking -->
<link rel="stylesheet" href="full.css" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="full.css"></noscript>
```

> 💡 The `media="print"` trick: print stylesheets don't block screen rendering. When the file loads, we switch it back to `all`.

---

### 2. What is the browser's main thread? Why does blocking it cause slowness?

**Difficulty:** Hard

The main thread does everything: runs JS, handles clicks, calculates layout, paints. It can only do **one thing at a time**. Tasks over 50ms make user interactions wait in a queue — the page feels frozen.

> ✅ **Solutions:**

**Break long tasks** into chunks, yield to browser in between
**Web Workers** for heavy calculations (don't touch DOM)
**Virtualize long lists** — only render visible items
> - **Break long tasks** into chunks, yield to browser in between
> - **Web Workers** for heavy calculations (don't touch DOM)
> - **Virtualize long lists** — only render visible items

```js
async function processLargeList(items) {
  for (let i = 0; i < items.length; i++) {
    processItem(items[i]);
    if (i % 50 === 0) {
      await new Promise(r => setTimeout(r, 0)); // yield to browser
    }
  }
}
```

---

### 3. What is layout thrashing? Give a simple example and fix.

**Difficulty:** Hard

Reading a layout property forces the browser to recalculate layout. If you then write and read again in a loop, the browser recalculates every single iteration. 100 iterations = 100 forced layouts.

```js
// ❌ SLOW: read then write in loop (forces layout 100x)
items.forEach(item => {
  const h = item.offsetHeight; // READ — forces layout
  item.style.height = h * 2 + 'px'; // WRITE — invalidates it
});

// ✅ FAST: all reads first, then all writes
const heights = Array.from(items).map(el => el.offsetHeight); // batch reads
items.forEach((el, i) => { el.style.height = heights[i] * 2 + 'px'; }); // batch writes
```

---

### 4. What is `font-display`? Which value is best for performance?

**Difficulty:** Medium

| Value | What happens while font loads | Good for |
| --- | --- | --- |
| `block` | Invisible text for 3 seconds | Almost never |
| `swap` | Shows fallback font immediately, swaps when ready | Body text where a swap is acceptable |
| `fallback` | Shows fallback for 100ms, swaps if font loads in 3s | Headings |
| `optional` | Uses font only if already cached, never swaps | Best CLS score ✅ |

> ✅ Use `font-display: optional` + `<link rel="preload">`. The preload makes the font usually cached on first visit. Optional means it never causes a layout shift.

---

### 5. What is code splitting? How does it speed up a web app?

**Difficulty:** Medium

Instead of sending all JS in one huge file, code splitting breaks it into smaller chunks that load only when needed.

> 🏠 **Analogy:** Instead of giving someone the entire encyclopedia, give them just the volume they asked for. Request more volumes as needed.

```js
// Without code splitting: 500KB downloads on every page
import HeavyChart from './Chart';

// With code splitting: Chart (~200KB) only downloads when this component renders
const Chart = React.lazy(() => import('./Chart'));
```

---

### 6. What is the correct caching strategy for a production web app?

**Difficulty:** Hard

| File | Cache setting | Why |
| --- | --- | --- |
| index.html | `no-cache` | Must always check for new app version |
| app.abc123.js (hashed) | Cache forever (1 year) | Hash changes with every build — old URLs are dead |
| Service Worker | `no-cache` | Browser must always check for SW updates |
| API responses | `no-store` | User-specific data, never cache in shared proxies |

> 🔥 **Classic bug:** If you cache index.html for 1 year, users run the old version of your app even after deployment. Cache HTML with `no-cache`. Cache hashed bundles forever.

---

### 7. What is `requestAnimationFrame`? When should you use it instead of `setTimeout`?

**Difficulty:** Medium

`requestAnimationFrame(fn)` calls your function right before the next screen repaint — ~60 times per second on a 60Hz display. Perfectly synchronized with the display.

```js
// ❌ setTimeout — not synced with screen, can cause jank
function animate() { element.style.transform = `translateX(${x++}px)`; setTimeout(animate, 16); }

// ✅ rAF — synced with screen refresh rate
function animate() { element.style.transform = `translateX(${x++}px)`; requestAnimationFrame(animate); }
requestAnimationFrame(animate);
```

> ✅ rAF also automatically pauses when the tab is hidden — saves battery. `setTimeout` keeps running in background tabs.

---

### 8. What is tree shaking? Why doesn't it work with `require()`?

**Difficulty:** Medium

Tree shaking removes JavaScript code you never use from your final bundle at build time.

```js
// ✅ ES Modules — tree-shakable (build tool knows exactly what you use)
import { format } from 'date-fns';  // only 'format' goes in the bundle

// ❌ CommonJS require — NOT tree-shakable
const dateFns = require('date-fns');
dateFns[someVariable](); // build tool can't know at compile time which function runs!
```

> 💡 Tree shaking only works with `import/export` (ES Modules) because those are static — the build tool knows before running the code what is and isn't used.

---

## Frontend Security — XSS & CSP

*8 questions*

### 1. What is XSS? Explain the 3 types simply.

**Difficulty:** Hard

XSS is when an attacker gets their JavaScript to run in another user's browser on your website. Once their code runs, they can steal cookies, capture keystrokes, or redirect users.

| Type | How it works |
| --- | --- |
| **Stored XSS** | Attacker saves script in your database (e.g., a comment). Every user who views it gets attacked. |
| **Reflected XSS** | Script is in the URL. Server echoes it back in the response. |
| **DOM-based XSS** | Client-side JS reads URL/form data and writes it to the DOM unsafely. |

> ✅ **Prevention:** Never put user data in `innerHTML` or `eval()`. Use `textContent`. If you must render user HTML, sanitize with DOMPurify first.

---

### 2. What is a Content Security Policy (CSP)? Explain it simply.

**Difficulty:** Hard

CSP is an HTTP header your server sends that tells the browser: *"Only run scripts/load images from these approved sources."* Even if an attacker injects a script tag, the browser refuses to run it.

> 🏠 **Analogy:** A VIP guest list for your website. Only approved scripts get in. Everything not on the list gets blocked at the door.

```js
Content-Security-Policy:
  default-src 'self';             /* load from own domain only */
  script-src 'self' 'nonce-ABC';  /* scripts need our domain OR matching nonce */
  img-src 'self' https:;          /* images from our domain or any HTTPS */
  frame-ancestors 'none';         /* nobody can embed us in iframe (stops clickjacking) */

<script nonce="ABC">alert('allowed')</script>  /* ✅ runs */
<script>stealData()</script>                    /* ❌ blocked — no nonce */
```

---

### 3. What is CSRF? How does `SameSite` cookie attribute prevent it?

**Difficulty:** Hard

CSRF tricks a logged-in user into making an unintended request to your site. The attacker's site has a hidden form that submits to your site. Your server sees the user's cookie and processes it thinking it's legitimate.

> 🏠 **Analogy:** You're logged into your bank. You visit an attacker's site that secretly submits a "transfer $500" form to your bank in the background. Your bank sees your cookie and processes it.

| SameSite value | What it does |
| --- | --- |
| `Strict` | Cookie NEVER sent from other sites. Strongest. May break SSO flows. |
| `Lax` | Cookie sent only for top-level link clicks. Blocks hidden form submissions. Chrome default. |
| `None` | Cookie sent everywhere. No protection. Must use Secure. |

---

### 4. What is clickjacking and how do you prevent it?

**Difficulty:** Medium

Clickjacking places your site in an invisible iframe on an attacker's page. Their fake buttons sit underneath your real buttons. Users think they're clicking an "Enter to win" button but they're actually clicking "Delete account."

```js
/* Tell browsers: don't allow your site in iframes */
Content-Security-Policy: frame-ancestors 'none'

/* Allow your own site to frame itself: */
Content-Security-Policy: frame-ancestors 'self'

/* Older header (still useful for older browsers): */
X-Frame-Options: DENY
```

---

### 5. What is SRI (Subresource Integrity) and when must you use it?

**Difficulty:** Medium

SRI lets the browser verify that a file from a CDN **hasn't been tampered with**. You add a hash of the expected file. If the CDN is hacked and the file changes, the browser refuses to run it.

```js
<!-- Without SRI: if CDN is hacked, malicious code runs on your site -->
<script src="https://cdn.example.com/jquery.min.js"></script>

<!-- With SRI: browser rejects the file if it doesn't match the hash -->
<script
  src="https://cdn.example.com/jquery.min.js"
  integrity="sha384-abc123..."
  crossorigin="anonymous">
</script>
```

> ✅ Required whenever you load scripts or styles from a CDN you don't control.

---

### 6. Should you store auth tokens in localStorage or cookies? Why?

**Difficulty:** Hard

> 🔥 **Don't store sensitive auth tokens in localStorage.** Any JavaScript on the page can read it. One XSS vulnerability = all tokens stolen instantly.

|  | localStorage | HttpOnly Cookie |
| --- | --- | --- |
| JS can read it? | ✅ Yes (danger) | ❌ No (safe from XSS) |
| Sent auto to server? | ❌ Must use JS | ✅ Automatically |
| XSS risk | 🔴 High | ✅ Protected |

> ✅ Store session tokens in cookies with `HttpOnly; Secure; SameSite=Strict`. Protects against both XSS and CSRF.

---

### 7. What are `HttpOnly`, `Secure`, and `SameSite` cookie flags?

**Difficulty:** Easy

| Flag | What it does | Protects against |
| --- | --- | --- |
| `HttpOnly` | JS cannot read this cookie | XSS cookie theft |
| `Secure` | Cookie only sent over HTTPS | Man-in-the-middle |
| `SameSite=Strict` | Cookie never sent from other sites | CSRF attacks |

```js
Set-Cookie: sessionId=abc123; HttpOnly; Secure; SameSite=Strict; Max-Age=3600
```

---

### 8. What is prototype pollution? Give a simple attack example.

**Difficulty:** Hard

In JavaScript, every plain object inherits from `Object.prototype`. If an attacker injects a property into `Object.prototype`, every plain object in your app suddenly gets that property.

```js
// Attack via user JSON with __proto__:
const bad = JSON.parse('{"__proto__": {"isAdmin": true}}');
Object.assign({}, bad); // poisons Object.prototype

// Now every plain object has isAdmin = true:
const obj = {};
console.log(obj.isAdmin); // true — polluted!

// Auth check bypassed:
if (user.isAdmin) { showAdminPanel(); } // attacker gets in!
```

> ✅ **Fixes:** Use `Object.create(null)` for lookup objects. Reject keys named `__proto__` in user input. Use `Map` for user key-value data. Keep lodash updated.

---

## Browser Rendering Pipeline

*6 questions*

### 1. How does a browser turn HTML/CSS into what you see? Walk through the steps.

**Difficulty:** Hard

1. **Receives HTML** → reads top-to-bottom, builds the DOM tree (element structure)
2. **Receives CSS** → builds the CSSOM tree. The browser won't show anything until this is done.
3. **Combine DOM + CSSOM** → Render Tree (only visible elements + their computed styles)
4. **Layout (Reflow)** → calculates exact position and size of every element
5. **Paint** → draws pixels: colors, text, borders, shadows
6. **Composite** → layers sent to GPU, combined, shown on screen

> 💡 **Performance insight:** Animations using only `transform` and `opacity` skip steps 4 and 5 entirely — straight to the GPU compositor. That's why they're smooth even on slow devices.

---

### 2. What is the JavaScript Event Loop? Explain it simply with code.

**Difficulty:** Tricky

JavaScript is single-threaded. The event loop manages what runs next:

- **Call Stack** — synchronous code runs immediately
- **Microtask Queue** — Promises (`.then()`). Runs after EVERY task before anything else.
- **Macrotask Queue** — `setTimeout`, click events. Runs one at a time after microtasks.

```js
console.log('1');  // sync — runs first
setTimeout(() => console.log('2'), 0); // macrotask — runs last
Promise.resolve().then(() => console.log('3')); // microtask
console.log('4');  // sync — runs second

// Output: 1, 4, 3, 2
// Why? Sync first → ALL microtasks → one macrotask → repeat
```

> ⚠️ **Tricky:** Microtasks drain COMPLETELY before the screen can update. A Promise chain that keeps adding more microtasks will freeze the UI — no repaints, no click handling.

---

### 3. What is CORS? Why does it exist and how does it work?

**Difficulty:** Hard

CORS (Cross-Origin Resource Sharing) blocks JavaScript from reading responses from a different domain — unless that domain explicitly says "I trust you."

> 🏠 **Analogy:** **🏠 Why it exists:** Without CORS, any website could make calls to your bank's API using your cookies and read your account data. CORS requires the bank to explicitly say "this other website is allowed."

```js
/* Server must send these to allow cross-origin access: */
Access-Control-Allow-Origin: https://my-app.com
Access-Control-Allow-Methods: GET, POST, PUT
Access-Control-Allow-Headers: Content-Type, Authorization
```

> 💡 CORS is enforced by the BROWSER only. It doesn't protect your API from direct curl/Postman requests. You still need authentication for API security.

---

### 4. What is a Web Worker? What can and can't it do?

**Difficulty:** Medium

A Web Worker runs JavaScript on a **separate background thread** so it doesn't freeze the main page. Perfect for heavy calculations like image processing, data sorting, or encryption.

```js
// main.js
const worker = new Worker('worker.js');
worker.postMessage({ data: largeDataset });
worker.onmessage = (e) => { console.log('Done:', e.data); };

// worker.js — runs without blocking the page
self.onmessage = (e) => {
  const result = doHeavyWork(e.data.data);
  self.postMessage(result);
};
```

| Workers CAN | Workers CANNOT |
| --- | --- |
| Run JS, fetch requests | Touch the DOM |
| Use IndexedDB | Access window or document |
| Message main thread | Use localStorage |

---

### 5. What is a Service Worker? How is it different from a Web Worker?

**Difficulty:** Hard

A Service Worker acts as a **proxy between your app and the network**. It intercepts every network request and can serve cached responses — making apps work offline.

|  | Web Worker | Service Worker |
| --- | --- | --- |
| Purpose | CPU-heavy background tasks | Network proxy, offline, caching, push notifications |
| Lifetime | While tab is open | Persists across tab opens/closes |
| Scope | Per page | Per origin (shared across all tabs) |

> ✅ Service Workers power Progressive Web Apps (PWAs) — cache assets and API responses, serve them instantly with no internet.

---

### 6. What is the preload scanner? Why do dynamically injected resources get a delay?

**Difficulty:** Hard

When the main parser pauses (hit a sync script), the browser launches a **preload scanner** to look ahead in raw HTML and start downloading future resources in parallel.

> ⚠️ **Preload scanner cannot see:**

Resources added by JavaScript (`document.createElement('script')`)
CSS background-image URLs
Lazy-loaded images

These get a discovery delay. Add `<link rel="preload">` in the HTML head for any critical resource the scanner would otherwise miss.
> - Resources added by JavaScript (`document.createElement('script')`)
> - CSS background-image URLs
> - Lazy-loaded images

---

## Scalability — Frontend Architecture

*6 questions*

### 1. How do you manage CSS in a large project? What are the options?

**Difficulty:** Hard

| Approach | In simple terms | Best when |
| --- | --- | --- |
| **BEM** | Naming convention: Block__Element--Modifier. No tooling needed. | Multi-team, any framework |
| **CSS Modules** | Build tool scopes class names per file. No naming conflicts. | React/Vue component apps |
| **CSS-in-JS** | Write CSS in JavaScript files. Styles live with the component. | Heavy runtime theming |
| **Tailwind** | Pre-built utility classes. Style in HTML. Zero dead CSS. | Product teams, rapid dev |
| **CSS @layer** | Native browser layers with clear priority. No runtime cost. | Modern design systems |

---

### 2. What is progressive enhancement? Give a simple example.

**Difficulty:** Medium

Start with something that works for everyone, then add better features for capable browsers on top. Core content always works — even without JavaScript.

```html
<!-- Step 1: Works with plain HTML, no JS needed -->
<form action="/search" method="GET">
  <input type="search" name="q">
  <button type="submit">Search</button>
</form>

// Step 2: JS enhancement — autocomplete suggestions for modern browsers
if ('fetch' in window) {
  input.addEventListener('input', fetchSuggestions);
}
```

> ✅ Even if JS fails to load, the form still works. This is critical for government, healthcare, and financial apps that must be reliable everywhere.

---

### 3. How do you write CSS that works for both left-to-right and right-to-left languages?

**Difficulty:** Hard

Arabic, Hebrew, and Persian read right-to-left. Use **logical CSS properties** — they automatically flip for RTL.

```html
<html dir="rtl" lang="ar">

/* ❌ Old way — breaks RTL */
.card { padding-left: 1rem; margin-right: 2rem; text-align: left; }

/* ✅ Logical properties — auto-flips for RTL */
.card {
  padding-inline-start: 1rem; /* left in LTR, right in RTL */
  margin-inline-end: 2rem;    /* right in LTR, left in RTL */
  text-align: start;          /* left in LTR, right in RTL */
}
```

> ✅ Swap: `padding-left` → `padding-inline-start`, `margin-right` → `margin-inline-end`, `border-left` → `border-inline-start`. RTL support becomes almost automatic.

---

### 4. What is virtual scrolling? Why do you need it for long lists?

**Difficulty:** Hard

Rendering 10,000 list items creates 10,000 DOM nodes — slow to create and heavy on memory. Virtual scrolling renders only what's visible on screen plus a small buffer.

> 🏠 **Analogy:** Looking through a window at the world. Only what's in the window frame exists. Everything else gets created as you move the window (scroll).

```js
const ITEM_H = 50;
const visibleCount = Math.ceil(containerHeight / ITEM_H) + 2;

container.addEventListener('scroll', () => {
  const start = Math.floor(container.scrollTop / ITEM_H);
  renderItems(allItems.slice(start, start + visibleCount));
  list.style.transform = `translateY(${start * ITEM_H}px)`;
});
spacer.style.height = `${allItems.length * ITEM_H}px`; // total scroll height
```

---

### 5. What is a design system? What are its key building blocks?

**Difficulty:** Medium

A design system is a shared library of reusable components, design values, and rules that multiple teams use to build consistent products faster.

1. **Design tokens** — CSS variables for all colors, spacing, font sizes, radii, shadows
2. **Primitive components** — Button, Input, Badge (pure UI, no business logic)
3. **Compound components** — Modal, DatePicker, Select (behavior + primitives)
4. **Page templates** — Login page, dashboard layout, empty states

```js
:root { --color-primary: #0066cc; --spacing-4: 1rem; --radius-md: 6px; }

/* Components use tokens — never raw values */
.btn { background: var(--color-primary); padding: var(--spacing-2) var(--spacing-4); }
```

---

### 6. What is a micro-frontend and what CSS problems does it create?

**Difficulty:** Hard

Micro-frontends split a big frontend into smaller pieces — each owned and deployed by a different team. Same concept as microservices, but for the UI layer.

> ⚠️ **CSS problems:**

**Class collisions** — Team A's `.button` conflicts with Team B's. Fix: Shadow DOM, CSS Modules, or namespaced BEM.
**Multiple CSS resets** — each team imports normalize.css, causing double-reset conflicts
**z-index wars** — each team uses their own numbers; modals overlap each other randomly
**Duplicate fonts** — all 5 teams load the same font separately
**Design drift** — teams use slightly different colors/spacing without a shared token system
> - **Class collisions** — Team A's `.button` conflicts with Team B's. Fix: Shadow DOM, CSS Modules, or namespaced BEM.
> - **Multiple CSS resets** — each team imports normalize.css, causing double-reset conflicts
> - **z-index wars** — each team uses their own numbers; modals overlap each other randomly
> - **Duplicate fonts** — all 5 teams load the same font separately
> - **Design drift** — teams use slightly different colors/spacing without a shared token system

---

## Enterprise Scenarios — Walk-throughs

*8 questions*

### 1. SCENARIO: Your page's LCP is 4.2 seconds. Walk through how you diagnose and fix it.

**Difficulty:** Hard

**Step 1 — Find the LCP element:** Chrome DevTools → Performance tab → record load → look for the LCP marker → it shows exactly which element is causing the delay.

| Cause found | Fix |
| --- | --- |
| Hero image has `loading="lazy"` | Remove it. Use `fetchpriority="high"` instead. |
| Image injected by JS (not in HTML) | Add `<link rel="preload" as="image">` in head |
| Image is a 3MB JPEG | Convert to WebP/AVIF, add srcset with proper sizes |
| Image not served from CDN | Move static assets to CDN — TTFB should be under 100ms |
| Server is slow (TTFB > 800ms) | Add caching, use SSG or edge rendering |
| Render-blocking CSS/JS in head | Inline critical CSS, defer non-critical scripts |

> ✅ **Tools:** Lighthouse (DevTools), WebPageTest (waterfall view), PageSpeed Insights (real Google CrUX data).

---

### 2. SCENARIO: Users see a white flash before dark mode loads. How do you fix it?

**Difficulty:** Hard

This is called **FOWT (Flash of Wrong Theme)**. The page renders in light mode before JS loads and reads the saved dark mode preference.

**Fix: add a tiny blocking script in the HTML head BEFORE any CSS renders:**

```html
<head>
  <!-- Must be blocking (no async/defer) and BEFORE stylesheet links -->
  <script>
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = saved || (prefersDark ? 'dark' : 'light');
  </script>
  <link rel="stylesheet" href="styles.css">
</head>

/* CSS responds to the data attribute */
[data-theme="dark"]  { --bg: #0d1117; --text: #e6edf3; }
[data-theme="light"] { --bg: #fff;    --text: #111; }
body { background: var(--bg); color: var(--text); }
```

> 💡 This is the only case where a sync inline script in `<head>` is recommended. It's tiny (3-4 lines) so the blocking penalty is negligible — and it completely prevents the flash.

---

### 3. SCENARIO: A third-party analytics script makes the page feel slow. What do you do?

**Difficulty:** Hard

**Step 1 — Confirm it:** Chrome DevTools → Performance → record page → Bottom-Up tab → sort by "Self Time" → look for the third-party script URL in long tasks.

**Step 2 — Delay it until after first user interaction:**

```js
let loaded = false;
function loadAnalytics() {
  if (loaded) return;
  loaded = true;
  const s = document.createElement('script');
  s.src = 'https://analytics.example.com/sdk.js';
  s.async = true;
  document.head.appendChild(s);
}

// Only load after user actually interacts — not on page load
['click', 'scroll', 'keydown'].forEach(ev =>
  window.addEventListener(ev, loadAnalytics, { once: true, passive: true })
);
```

> ✅ Analytics that fire on interaction still capture meaningful events. Your LCP and initial page load are not blocked. This pattern is used by major e-commerce sites.

---

### 4. SCENARIO: Your CSS bundle is 500KB. How do you find and reduce the bloat?

**Difficulty:** Hard

1. **Find unused CSS:** Chrome DevTools → More Tools → Coverage → refresh → see red (unused) bars in CSS files
2. **Enable PurgeCSS:** Removes classes not found in HTML/JS at build time
3. **Audit big imports:** Are you importing an entire UI library to use 3 components?
4. **Remove duplicate vendor prefixes:** `-webkit-transform` not needed for modern browsers
5. **Split CSS per route:** Only load component CSS on pages that use those components
6. **Enable Brotli compression:** CSS compresses 80-90% — 500KB → ~60KB over the network

> 💡 **Targets:** Critical above-fold CSS <14KB. Total CSS <50KB gzipped. With Brotli, even 200KB of CSS becomes ~25KB in transit.

---

### 5. SCENARIO: Accessibility audit gives your forms a failing grade. What is your fix plan?

**Difficulty:** Hard

1. **Every input has a visible `<label>`** — not just placeholder text (placeholder disappears when you type)
2. **Error messages linked** to the input via `aria-describedby`
3. **Invalid fields** marked with `aria-invalid="true"`
4. **Required fields** have `required` attribute + visible indicator (explain what * means)
5. **On submit with errors** — move focus to the first invalid field or error summary
6. **Related inputs grouped** in `<fieldset>` + `<legend>` (radio buttons, checkboxes)
7. **Add `autocomplete` attributes** — helps password managers and speeds up forms

```html
<div class="field">
  <label for="email">Email <span aria-hidden="true">*</span></label>
  <input id="email" type="email" autocomplete="email"
         required aria-required="true" aria-invalid="true"
         aria-describedby="email-error">
  <p id="email-error" role="alert">Enter a valid email address.</p>
</div>
```

---

### 6. SCENARIO: Page INP is 450ms. How do you get it under 200ms?

**Difficulty:** Hard

**Step 1 — Find slow interactions:** Chrome DevTools → Performance → click around the page → look for red interaction markers.

| Problem | Fix |
| --- | --- |
| Click handler does heavy work (300ms) | Show optimistic UI instantly, do heavy work after visual update |
| Search runs query on every keystroke | Debounce — wait until user stops typing for 200ms |
| Long task blocking thread when user clicks | Break task into chunks, yield with setTimeout(0) |
| 5000+ DOM nodes causing slow reflow | Virtualize the list, remove off-screen DOM |

```js
const debouncedSearch = debounce(async (q) => {
  const results = await fetchResults(q);
  renderResults(results);
}, 200);

searchInput.addEventListener('input', (e) => {
  showLoadingSpinner(); // immediate visual feedback
  debouncedSearch(e.target.value);
}, { passive: true });
```

---

### 7. SCENARIO: Your site needs to support multiple languages including Arabic. What changes do you make?

**Difficulty:** Hard

```html
<!-- Set language and direction on html element -->
<html lang="ar" dir="rtl"> <!-- Arabic -->
<html lang="en">           <!-- English -->

/* Use logical properties — auto-flip for RTL */
.sidebar { margin-inline-end: 2rem; }   /* right in LTR, left in RTL */
.icon    { padding-inline-start: 8px; } /* left in LTR, right in RTL */

/* Different fonts per language */
:lang(ar) { font-family: 'Noto Sans Arabic', sans-serif; }
:lang(ja) { font-family: 'Noto Sans JP', sans-serif; line-height: 1.9; }
```

---

### 8. SCENARIO: Users report the page "jumps" while loading. How do you track down CLS?

**Difficulty:** Hard

**Step 1 — Measure it:** Chrome DevTools → Performance → record load → look for red "Layout Shift" markers in the Experience row → click to see which element moved.

**Step 2 — Fix by cause:**

- **Images jumping:** Add `width` and `height` attributes — browser reserves space before image loads
- **Ad slot appearing:** Give the container `min-height: 250px` before the ad loads
- **Font swap causing reflow:** Use `font-display: optional` + font preload + match fallback metrics with `size-adjust`
- **Dynamic content pushes things down:** Insert new content below visible area, or inside a pre-sized container

---
