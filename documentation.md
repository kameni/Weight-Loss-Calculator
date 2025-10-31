# Technical Documentation

This document outlines the internal structure, dependencies, and extension points for the **Weight Loss Calculator – GeneratePress Child Theme**. It is intended for developers who need to maintain or customize the child theme beyond the end-user configuration described in the README.

## Overview
The project is a classic WordPress child theme that augments GeneratePress with:
- A dynamic Gutenberg block (`generatepress-child/weight-loss-calculator`) with both React-powered editor code and PHP-rendered front-end markup.
- A shortcode-driven product slider fed by Advanced Custom Fields (ACF) metadata.
- Supporting JavaScript and CSS delivered without a build pipeline.

### Key Technologies
- **WordPress APIs:** `register_block_type`, `WP_Query`, shortcode API, enqueue hooks.
- **JavaScript:** Gutenberg block editor APIs, jQuery, jQuery UI Slider, vanilla ES2015+ for the product carousel.
- **CSS:** Plain CSS stored alongside each component for isolation.

## Directory Structure
```
Weight-Loss-Calculator/
├── README.md
├── documentation.md
└── generatepress-child/
    ├── blocks/
    │   └── weight-loss-calculator/
    │       ├── block.json          # Block manifest
    │       ├── editor.js           # Block editor behaviour
    │       ├── editor.css          # Block editor styles
    │       ├── frontend.js         # Front-end calculator logic
    │       ├── style.css           # Front-end styles scoped to the block
    │       ├── render.php          # Dynamic render callback factory
    │       ├── editor.asset.php    # Generated dependency metadata for editor.js
    │       ├── frontend.asset.php  # Generated dependency metadata for frontend.js
    │       └── placeholders/
    │           ├── before.jpg
    │           └── after.jpg
    ├── functions.php               # Child theme bootstrap and shortcode registration
    ├── product-slider.js           # Vanilla JS slider implementation
    ├── screenshot.png              # Theme preview (WordPress admin)
    └── style.css                   # Theme header + global styles
```

## Bootstrapping Flow
1. **Child styles:** `functions.php` enqueues `style.css` via `wp_enqueue_scripts`.
2. **Block registration:** On `init`, the child theme:
   - Loads the render callback from `blocks/weight-loss-calculator/render.php`.
   - Registers the block using its `block.json` manifest.
   - Registers/enqueues front-end scripts listed in `frontend.asset.php`, ensuring `jquery-ui-touch-punch` is available for touch dragging.
   - Associates the registered script handle with the block’s `view_script_handles` for on-demand loading.
3. **Shared assets:** `enqueue_block_assets` conditionally loads the jQuery UI base stylesheet on the front end when a calculator block is present on the current singular post.
4. **Editor assets:** `enqueue_block_editor_assets` ensures `jquery`, `jquery-ui-slider`, the block’s editor script, and an inline localization (`generatepressChildWlc`) are available in the block editor.
5. **Front-end slider assets:** The product slider shortcode enqueues `product-slider.js` on-demand when the shortcode is rendered.

## Gutenberg Block Architecture
### block.json
Defines the block namespace, supported attributes, styles, editor assets, and spacing support. Any new attributes must be added here **and** handled in the PHP render logic and editor UI.

### Editor Component (`editor.js`)
- Registers the block using Gutenberg’s `registerBlockType` API.
- Uses the block editor’s Inspector controls to expose configuration for headings, button copy, colors, weight limits, and media selection.
- Maintains a live jQuery UI slider instance to provide WYSIWYG feedback inside the editor while respecting block selection state.
- Localizes placeholder image URLs via `generatepressChildWlc.placeholders`.

**Extending tips:**
- To add a new control, create an attribute in `block.json`, expose it in the Inspector, and pass it to the render callback.
- Editor-only styling lives in `editor.css`. If you add new classes in `editor.js`, ensure the editor stylesheet covers them for parity with the front-end experience.

### Render Callback (`render.php`)
- Returns a closure compatible with the `register_block_type` API.
- Merges runtime attributes with defaults using `wp_parse_args`.
- Outputs semantic markup with ARIA roles for the slider and CTA.
- Exposes dynamic data via `data-*` attributes consumed by the front-end script (`data-min`, `data-max`, `data-current`).
- Adds inline styles for colors and font sizes only when provided.

**Extending tips:**
- Keep ARIA attributes and data attributes synchronized with any new dynamic features.
- If you introduce new dynamic values required by JavaScript, add them as `data-` attributes and update `frontend.js` accordingly.

### Front-End Script (`frontend.js`)
- Wraps logic in an IIFE and ensures it does not run inside the block editor (`block-editor-page` guard).
- Initializes jQuery UI slider for weight selection with normalization, clamp logic, and real-time updates.
- Animates the “weight loss potential” number via `requestAnimationFrame` easing.
- Syncs the before/after scrubber by positioning the clip mask, overlay, and divider as the slider moves.
- Stores the latest slider selections on the CTA element via `data-weight` and `data-loss` attributes for reuse by downstream integrations.
- Enhances CTA links by appending `weight` and `loss` query parameters to outbound URLs.

**Calculation details:**
- The potential loss is derived by multiplying the normalized slider value by the `LOSS_MULTIPLIER` constant (`0.15` by default) and rounding to the nearest whole number.
- Update the constant near the top of `frontend.js` to tune the percentage or inject alternate business logic.

**Extending tips:**
- Reuse the helper functions (`normalizeValue`, `updateUI`) when adding analytics or third-party integrations.
- If you introduce asynchronous operations, ensure cleanup cancels pending animation frames (`$el.data('wlcAnimFrame')`).

## Product Slider Shortcode
Registered in `functions.php` as `[product_slider]`.

### Query & Data Preparation
- Runs a `WP_Query` against the `product` post type with optional limit and meta-based ordering (`order` meta key).
- Sanitizes shortcode attributes and fallback defaults.
- Reads display data from ACF field helpers (`get_field`, `get_field_object`). The shortcode assumes ACF is active; without it the PHP helpers are undefined and execution will fatal. Provide compatibility shims before loading the theme if you need to run without ACF.
- Captures featured image, brand/category terms, and builds CTA metadata (`href`, `target`, `rel`).

### Markup & Identifiers
- Outputs a `section.wlc-product-slider` wrapper with a unique ID (`wlc-product-slider-{n}`) for each shortcode instance.
- Builds navigation buttons, a track wrapper, and individual slide cards (`.wlc-product-card`).
- Includes placeholder classes for state transitions (`--visible`, `--next`) consumed by the JavaScript animation logic.

### JavaScript Controller (`product-slider.js`)
- Autoloads on `DOMContentLoaded` and initializes every `.wlc-product-slider` instance on the page.
- Supports:
  - Keyboard- and pointer-accessible navigation buttons.
  - Pagination dots synchronized with the current slide index.
  - Touch dragging with pointer capture logic that differentiates vertical scroll gestures.
  - Reduced-motion respect via `prefers-reduced-motion` media query.
  - Responsive “peek next card” layout using CSS custom properties (`--wlc-next-card-*`).
- Prevents accidental clicks during drag interactions by suppressing click events when a drag threshold is met.

**Extending tips:**
- Modify transition timing, easing, or layout thresholds in `product-slider.js` and mirror any layout shifts in `style.css`.
- To fetch remote data, replace the `WP_Query` loop with REST API output and adapt the JS to expect the new markup.

## Dependency Management
- Script dependencies are tracked via `.asset.php` files generated by `wp-scripts` tooling. When editing JS files manually, bump the version by deleting the `.asset.php` or update the returned `version` value to bust caches.
- jQuery UI Touch Punch is registered manually to support touch dragging on mobile devices.

## Extending the Theme
### Adding Another Block
1. Create a new folder under `blocks/{your-block}` with `block.json`, JS, and CSS files.
2. Duplicate the registration logic in `functions.php`, ensuring the render callback is callable and the asset handles are unique.
3. Run `wp-scripts build` (or your preferred bundler) to regenerate `.asset.php` dependencies if you author the scripts with ESNext modules.

### Customizing the Slider Query
- The shortcode targets the `product` post type and orders entries by the numeric `order` meta key. Populate that meta value to control slide sequencing.
- Use WordPress filters to intercept the slider output, e.g.
  ```php
  add_filter('wlc_product_slider_query_args', function($args, $atts) {
      $args['tax_query'][] = [
          'taxonomy' => 'brand',
          'field'    => 'slug',
          'terms'    => ['featured'],
      ];
      return $args;
  }, 10, 2);
  ```
- Wrap the existing query creation in `functions.php` with `apply_filters` if you need reusable extension points.

### Tracking Calculator Interactions
- Hook into the CTA click in `frontend.js` to dispatch events to Google Analytics, Meta Pixel, etc.
- Alternatively, observe attribute changes (`MutationObserver`) on `.gp-wlc` to capture slider interactions without editing the core script.

## Testing & Quality Assurance
- **Browser testing:** Verify the calculator and slider in Chrome, Firefox, Safari, and mobile WebKit.
- **Accessibility checks:** Use keyboard navigation to ensure focus indicators remain visible, and run automated audits (Lighthouse, axe) to catch contrast issues.
- **Performance:** The assets are unminified for readability; consider minifying in production or enabling server-level compression.

## Deployment Notes
- Treat the child theme as immutable in production. Version control changes and deploy via Git, SFTP, or your CI/CD pipeline.
- When updating JavaScript or CSS, increment file modification times (WordPress automatically uses `filemtime` for cache-busting in `functions.php`).

## Support
For questions or contributions, open an issue or pull request on the repository. When reporting bugs, include WordPress/PHP versions, a list of active plugins, and console/network logs if JavaScript behaviour is affected.
