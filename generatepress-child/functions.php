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
    $path   = get_theme_file_path('blocks/weight-loss-calculator');
    $result = register_block_type($path);
    if (is_wp_error($result)) {
        error_log('WLC register error: ' . $result->get_error_message() . ' (path: ' . $path . ')');
    }
});

/**
 * Load jQuery UI Slider (editor + front) only when needed.
 */
add_action('enqueue_block_assets', function () {
    $should_load = is_admin();

    if (!$should_load && is_singular()) {
        $post = get_post();
        if ($post && has_block('generatepress-child/weight-loss-calculator', $post)) {
            $should_load = true;
        }
    }

    if ($should_load) {
        wp_enqueue_script('jquery-ui-slider');
        wp_enqueue_style('jquery-ui-base', 'https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css', [], '1.13.2');
        wp_enqueue_script(
            'jquery-ui-touch-punch',
            'https://cdnjs.cloudflare.com/ajax/libs/jqueryui-touch-punch/0.2.3/jquery.ui.touch-punch.min.js',
            ['jquery', 'jquery-ui-slider'],
            '0.2.3',
            true
        );
    }
});