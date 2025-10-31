<?php
// Load child stylesheet (parent is auto-loaded by GeneratePress).
add_action('wp_enqueue_scripts', function () {
    $path = get_stylesheet_directory() . '/style.css';
    wp_enqueue_style('generatepress-child', get_stylesheet_uri(), [], file_exists($path) ? filemtime($path) : null);
});

/**
 * Register Weight Loss Calculator block via its block.json
 */
add_action('init', function () {
    $path = get_theme_file_path('blocks/weight-loss-calculator');

    if (!file_exists($path . '/render.php')) {
        error_log('WLC register error: render.php not found for block in ' . $path);
        return;
    }

    $render_callback = require $path . '/render.php';
    if (!is_callable($render_callback)) {
        error_log('WLC register error: render callback missing or invalid for block in ' . $path);
        return;
    }

    $frontend_handle = 'generatepress-child-weight-loss-calculator-frontend';
    $frontend_asset = $path . '/frontend.asset.php';

    if (file_exists($frontend_asset)) {
        $asset = include $frontend_asset;

        if (!wp_script_is('jquery-ui-touch-punch', 'registered')) {
            wp_register_script(
                'jquery-ui-touch-punch',
                'https://cdnjs.cloudflare.com/ajax/libs/jqueryui-touch-punch/0.2.3/jquery.ui.touch-punch.min.js',
                ['jquery', 'jquery-ui-slider'],
                '0.2.3',
                true
            );
        }

        $dependencies = isset($asset['dependencies']) ? $asset['dependencies'] : [];

        if (!in_array('jquery-ui-touch-punch', $dependencies, true)) {
            $dependencies[] = 'jquery-ui-touch-punch';
        }

        wp_register_script(
            $frontend_handle,
            get_theme_file_uri('blocks/weight-loss-calculator/frontend.js'),
            $dependencies,
            isset($asset['version']) ? $asset['version'] : filemtime($path . '/frontend.js'),
            true
        );
    }

    $args = [
        'render_callback' => $render_callback,
    ];

    if (wp_script_is($frontend_handle, 'registered')) {
        $args['view_script_handles'] = [$frontend_handle];
    }

    $result = register_block_type($path, $args);

    if (is_wp_error($result)) {
        error_log('WLC register error: ' . $result->get_error_message() . ' (path: ' . $path . ')');
    }
});

/**
 * Load jQuery UI Slider (editor + front) only when needed.
 */
add_action('enqueue_block_assets', function () {
    if (is_admin()) {
        return;
    }

    $should_load = false;

    if (is_singular()) {
        $post = get_post();
        if ($post && has_block('generatepress-child/weight-loss-calculator', $post)) {
            $should_load = true;
        }
    }

    if ($should_load) {
        wp_enqueue_style('jquery-ui-base', 'https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css', [], '1.13.2');
    }
});

add_action('enqueue_block_editor_assets', function () {
    wp_enqueue_script('jquery');
    wp_enqueue_script('jquery-ui-slider');
    if (wp_script_is('jquery-ui-touch-punch', 'registered')) {
        wp_enqueue_script('jquery-ui-touch-punch');
    }
    wp_enqueue_style('jquery-ui-base', 'https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css', [], '1.13.2');

    $handle = 'generatepress-child-weight-loss-calculator-editor';
    if (wp_script_is($handle, 'registered') && !wp_script_is($handle, 'enqueued')) {
        wp_enqueue_script($handle);
    }

    if (wp_script_is($handle, 'enqueued')) {
        wp_localize_script($handle, 'generatepressChildWlc', [
            'placeholders' => [
                'before' => get_theme_file_uri('blocks/weight-loss-calculator/placeholders/before.jpg'),
                'after'  => get_theme_file_uri('blocks/weight-loss-calculator/placeholders/after.jpg'),
            ],
        ]);
    }
});

/**
 * Register shortcode that outputs the product slider.
 */
add_shortcode('product_slider', function ($atts = []) {
    $atts = shortcode_atts([
        'pre_text' => '',
        'header1'  => '',
        'header2'  => '',
    ], $atts, 'product_slider');

    $atts = array_map(static function ($value) {
        if (is_string($value)) {
            return trim(wp_kses_post($value));
        }

        return $value;
    }, $atts);

    $pre_text = $atts['pre_text'];
    $header1  = $atts['header1'];
    $header2  = $atts['header2'];

    $query = new WP_Query([
        'post_type'      => 'product',
        'posts_per_page' => -1,
        'orderby'        => ['menu_order' => 'ASC', 'title' => 'ASC'],
    ]);

    if (!$query->have_posts()) {
        return '';
    }

    $script_path = get_stylesheet_directory() . '/product-slider.js';
    wp_enqueue_script(
        'generatepress-child-product-slider',
        get_stylesheet_directory_uri() . '/product-slider.js',
        [],
        file_exists($script_path) ? filemtime($script_path) : null,
        true
    );

    static $instance = 0;
    $instance++;
    $slider_id = 'wlc-product-slider-' . $instance;

    ob_start();
    ?>
    <section class="wlc-product-slider" id="<?php echo esc_attr($slider_id); ?>" aria-label="Product options">
        <div class="wlc-product-slider__inner">
            <?php if ($pre_text !== '') : ?>
                <p class="wlc-product-slider__pre-text"><?php echo wp_kses_post($pre_text); ?></p>
            <?php endif; ?>

            <?php if ($header1 !== '' || $header2 !== '') : ?>
                <h2 class="wlc-product-slider__heading">
                    <?php if ($header1 !== '') : ?>
                        <span class="wlc-product-slider__heading-line wlc-product-slider__heading-line--primary"><?php echo wp_kses_post($header1); ?></span>
                    <?php endif; ?>
                    <?php if ($header2 !== '') : ?>
                        <span class="wlc-product-slider__heading-line wlc-product-slider__heading-line--accent"><?php echo wp_kses_post($header2); ?></span>
                    <?php endif; ?>
                </h2>
            <?php endif; ?>

            <div class="wlc-product-slider__viewport">
                <button class="wlc-product-slider__nav wlc-product-slider__nav--prev" type="button" data-action="prev" aria-label="Previous product">
                    <span aria-hidden="true">&#8592;</span>
                </button>
                <div class="wlc-product-slider__track" data-slider-track>
                    <?php
                    $slide_index = 0;
                    while ($query->have_posts()) :
                        $query->the_post();

                        $product_name = get_field('product_name') ?: get_the_title();
                        $tagline      = get_field('tagline');
                        $price_object = get_field_object('price');
                        $price_value  = '';
                        $price_prefix = '$';
                        $price_suffix = '/month';

                        if ($price_object) {
                            $raw_value = isset($price_object['value']) ? $price_object['value'] : '';
                            if ($raw_value !== '' && $raw_value !== null) {
                                $price_value = is_numeric($raw_value)
                                    ? number_format((float) $raw_value, (strpos((string) $raw_value, '.') !== false) ? 2 : 0, '.', ',')
                                    : (string) $raw_value;
                            }

                            if (!empty($price_object['prepend'])) {
                                $price_prefix = (string) $price_object['prepend'];
                            }

                            if (!empty($price_object['append'])) {
                                $price_suffix = (string) $price_object['append'];
                            } else {
                                $price_suffix = '';
                            }
                        }

                        if ($price_value === '') {
                            $price_prefix = '';
                            $price_suffix = '';
                        }

                        $price_text   = get_field('price_text');
                        $benefits_raw = get_field('benefits');
                        $benefits     = [];

                        if (is_array($benefits_raw)) {
                            $benefits = array_filter(array_map('trim', $benefits_raw));
                        } elseif (is_string($benefits_raw) && $benefits_raw !== '') {
                            $benefits = array_map('trim', explode('\n', $benefits_raw));
                        }

                        $cta_text_raw = get_field('cta_button_text');
                        $cta_text     = is_string($cta_text_raw) ? trim($cta_text_raw) : '';

                        $cta_link_field = get_field('cta_link');
                        $cta_url        = '';
                        $cta_target     = '';

                        if (is_array($cta_link_field)) {
                            $cta_url    = isset($cta_link_field['url']) ? (string) $cta_link_field['url'] : '';
                            $cta_target = isset($cta_link_field['target']) ? (string) $cta_link_field['target'] : '';

                            if ($cta_text === '' && !empty($cta_link_field['title'])) {
                                $cta_text = (string) $cta_link_field['title'];
                            }
                        } elseif (is_string($cta_link_field)) {
                            $cta_url = trim($cta_link_field);
                        }

                        $cta_href = $cta_url !== '' ? $cta_url : '';
                        $cta_rel  = '';

                        if ($cta_target === '_blank') {
                            $cta_rel = 'noopener noreferrer';
                        }

                        $is_popular = get_field('popular');
                        $badge_text = get_field('badge_text');

                        $category_name = '';
                        $category_taxonomies = ['product-category', 'product_category', 'category'];

                        foreach ($category_taxonomies as $taxonomy) {
                            $category_terms = get_the_terms(get_the_ID(), $taxonomy);

                            if (!is_wp_error($category_terms) && !empty($category_terms)) {
                                $category_name = (string) $category_terms[0]->name;
                                break;
                            }
                        }

                        $image_id  = get_post_thumbnail_id();
                        $image_url = $image_id ? wp_get_attachment_image_url($image_id, 'large') : '';
                        $image_alt = $image_id ? get_post_meta($image_id, '_wp_attachment_image_alt', true) : '';

                        $brand_terms = get_the_terms(get_the_ID(), 'brand');
                        $brand_name  = (!is_wp_error($brand_terms) && !empty($brand_terms)) ? $brand_terms[0]->name : '';

                        $slide_index++;
                        ?>
                        <div class="wlc-product-slider__slide" data-slide-index="<?php echo esc_attr($slide_index - 1); ?>">
                            <article class="wlc-product-card" aria-roledescription="slide" aria-label="<?php echo esc_attr($product_name); ?>">
                                <?php if ($is_popular && !empty($badge_text)) : ?>
                                    <span class="wlc-product-card__badge"><?php echo esc_html($badge_text); ?></span>
                                <?php elseif ($category_name !== '') : ?>
                                    <span class="wlc-product-card__badge"><?php echo esc_html(sprintf('Brand %s', $category_name)); ?></span>
                                <?php endif; ?>

                                <div class="wlc-product-card__media">
                                    <?php if (!empty($brand_name)) : ?>
                                        <span class="wlc-product-card__brand"><?php echo esc_html($brand_name); ?></span>
                                    <?php endif; ?>

                                    <?php if (!empty($image_url)) : ?>
                                        <img src="<?php echo esc_url($image_url); ?>" alt="<?php echo esc_attr($image_alt ?: $product_name); ?>" loading="lazy" />
                                    <?php endif; ?>
                                </div>

                                <div class="wlc-product-card__body">
                                    <h3 class="wlc-product-card__title"><?php echo esc_html($product_name); ?></h3>

                                    <?php if (!empty($tagline)) : ?>
                                        <p class="wlc-product-card__tagline"><?php echo esc_html($tagline); ?></p>
                                    <?php endif; ?>

                                    <?php if ($price_value !== '') : ?>
                                        <div class="wlc-product-card__price">
                                            <span class="wlc-product-card__price-amount"><?php echo esc_html(trim($price_prefix . $price_value)); ?></span>
                                            <?php if (!empty($price_suffix)) : ?>
                                                <span class="wlc-product-card__price-suffix"><?php echo esc_html($price_suffix); ?></span>
                                            <?php endif; ?>
                                        </div>
                                    <?php endif; ?>

                                    <?php if (!empty($price_text)) : ?>
                                        <p class="wlc-product-card__price-text"><?php echo esc_html($price_text); ?></p>
                                    <?php endif; ?>

                                    <?php if (!empty($benefits)) : ?>
                                        <ul class="wlc-product-card__benefits">
                                            <?php foreach ($benefits as $benefit) : ?>
                                                <li>
                                                    <span aria-hidden="true"></span>
                                                    <span><?php echo esc_html($benefit); ?></span>
                                                </li>
                                            <?php endforeach; ?>
                                        </ul>
                                    <?php endif; ?>

                                    <?php if ($cta_text !== '') : ?>
                                        <a class="wlc-product-card__cta"
                                           href="<?php echo esc_url($cta_href !== '' ? $cta_href : '#'); ?>"<?php echo $cta_target !== '' ? ' target="' . esc_attr($cta_target) . '"' : ''; ?><?php echo $cta_rel !== '' ? ' rel="' . esc_attr($cta_rel) . '"' : ''; ?>>
                                            <span><?php echo esc_html($cta_text); ?></span>
                                            <span class="wlc-product-card__cta-arrow" aria-hidden="true">&#8594;</span>
                                        </a>
                                    <?php endif; ?>
                                </div>
                            </article>
                        </div>
                    <?php endwhile; ?>
                </div>
                <button class="wlc-product-slider__nav wlc-product-slider__nav--next" type="button" data-action="next" aria-label="Next product">
                    <span aria-hidden="true">&#8594;</span>
                </button>
            </div>

            <div class="wlc-product-slider__dots" role="tablist" aria-label="Product selection"></div>
        </div>
    </section>
    <?php

    wp_reset_postdata();

    return (string) ob_get_clean();
});
