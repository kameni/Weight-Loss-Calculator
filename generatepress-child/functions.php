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
