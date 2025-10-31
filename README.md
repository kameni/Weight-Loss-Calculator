# Weight Loss Calculator – GeneratePress Child Theme

The **Weight Loss Calculator** project is a purpose-built child theme for [GeneratePress](https://generatepress.com/) that adds an interactive weight-loss assessment block and a rich product carousel for WordPress sites. It is designed for marketers, wellness brands, and clinics that want to showcase transformation journeys and related product offerings within a fast, accessible WordPress experience.

## Highlights
- **Gutenberg block:** Drag-and-drop “Weight Loss Calculator” block that combines a weight-loss estimator with a before/after image scrubber.
- **Animated interactions:** Smooth number tweens, draggable comparison slider, and responsive layout that works from desktop to mobile.
- **WooCommerce-ready slider:** `[product_slider]` shortcode renders a branded slider powered by WooCommerce products and Advanced Custom Fields data.
- **Theme-friendly:** Inherits GeneratePress styling conventions while shipping focused CSS for the calculator and slider components.
- **No build steps:** Ships with compiled JavaScript and CSS so you can install and activate immediately.

## Requirements
| Component | Version / Notes |
|-----------|-----------------|
| WordPress | 6.5 or newer (tested up to 6.8) |
| PHP       | 7.4+ (matches theme header requirements) |
| Parent theme | [GeneratePress](https://generatepress.com/) 3.x installed and active |
| Plugins   | *Recommended:* [Advanced Custom Fields](https://www.advancedcustomfields.com/) for product metadata, WooCommerce (or a product CPT) for slider content |
| Browser support | Modern evergreen browsers; graceful fallbacks for reduced-motion preferences |

## Installation & Setup
1. **Install the parent theme** if you haven’t already (Appearance → Themes → Add New → search for “GeneratePress”).
2. **Upload this child theme**:
   - Copy the `generatepress-child` directory into `wp-content/themes/`, or
   - Zip the folder and upload it via Appearance → Themes → Add New → Upload.
3. **Activate the child theme** from the Themes screen.
4. **Install supporting plugins** (optional but recommended):
   - Advanced Custom Fields for product field management.
   - WooCommerce if you want to source slider slides from products.
5. **Flush caches** (if applicable) to ensure new scripts and styles are served.

### Register the Product Fields
If you plan to use the product slider, create ACF fields (or equivalent meta fields) with the following keys on your product post type:
- `product_name` (Text) – Fallback is the post title.
- `tagline` (Text).
- `price` (ACF field with `prepend`, `append`, and `value` support).
- `price_text` (Text).
- `benefits` (Repeater or Textarea with newline separation).
- `cta_button_text` (Text).
- `cta_link` (Link field).
- `popular` (True/False).
- `badge_text` (Text).

The slider will automatically read featured images, taxonomy terms (`brand`, `product-category`, etc.), and these fields to build each slide.

## Using the Weight Loss Calculator Block
1. Open the WordPress block editor for any post or page.
2. Search for **“Weight Loss Calculator”** in the block inserter (category: *Design*).
3. Configure the block from the sidebar Inspector:
   - **Heading, supporting text, and call-to-action** copy.
   - **Button link** that receives the visitor’s selected weight and loss potential as query parameters.
   - **Before / after images** (placeholders are bundled if you skip this step).
   - **Weight range** (minimum, maximum, and default value) to match your program.
   - **Styling tweaks** including gradient background and text colors.
4. Publish or update the page. On the front-end, visitors can drag the slider, scrub the before/after divider, and click the CTA to continue.

### Accessibility & UX Notes
- Slider controls include ARIA roles and keyboard support inherited from jQuery UI.
- The before/after scrubber is draggable with mouse or touch.
- Motion-sensitive users benefit from reduced animation when `prefers-reduced-motion` is detected.

## Using the Product Slider Shortcode
Embed the shortcode anywhere shortcodes are supported (classic editor, blocks, widgets):

```text
[product_slider pre_text="Programs" header1="Choose your plan" header2="Tailored to you" limit="3"]
```

Supported attributes:
- `pre_text` – Optional pill-style text rendered above the heading.
- `header1` / `header2` – Primary and accent heading lines stacked vertically.
- `limit` – Maximum number of products to display (omit for all).

The slider automatically:
- Enqueues `product-slider.js` for touch/drag interactions.
- Generates accessible navigation controls and pagination dots.
- Displays a “peek” preview of the upcoming card on larger screens.

### Content Tips
- Assign the `brand` taxonomy (or customize within the template) to show brand badges.
- Populate featured images with high-resolution, transparent PNGs for the best results.
- Use the `popular` boolean and `badge_text` to highlight featured offerings.

## Customization
- **Styling:** Override or extend `style.css` in the child theme, or add rules via the Customizer. Calculator-specific CSS lives in `blocks/weight-loss-calculator/style.css` and `editor.css`.
- **JavaScript behavior:**
  - Weight Loss Calculator front-end logic is in `blocks/weight-loss-calculator/frontend.js` (jQuery-based).
  - Editor-specific logic resides in `blocks/weight-loss-calculator/editor.js`.
  - Product slider interactions are handled in `product-slider.js` (vanilla JS).
- **Templates:** Adjust the server-rendered markup via `blocks/weight-loss-calculator/render.php` or the product slider output inside `functions.php`.

## FAQ
**Does the block work without WooCommerce?**
Yes. The calculator block is self-contained. Only the product slider shortcode expects WooCommerce (or a compatible “product” custom post type).

**Can I track user selections?**
The calculator’s CTA adds `weight` and `loss` query parameters to outbound links. Extend this in `frontend.js` to send analytics events or custom conversions.

**Is there a build pipeline?**
No build tooling ships with the project. You can edit the JavaScript/CSS directly or introduce your preferred bundler if you need advanced workflows.

## Support & Contributions
This repository is provided as a reference implementation. Feel free to fork it, customize it for your projects, and open issues or pull requests with improvements.

## License
This child theme inherits the GPLv2+ license from GeneratePress. See `style.css` for licensing metadata.
