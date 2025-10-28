<?php
/**
 * Dynamic render for the Weight Loss Calculator block.
 */

return function ($attributes, $content, $block) {
    $attrs = wp_parse_args($attributes, [
        'heading' => 'How much weight can you lose',
        'headingTag' => 'h2',
        'headingColor' => '',
        'headingFontSize' => '',
        'buttonText' => 'Get started',
        'buttonUrl' => '#',
        'supportingText' => 'Get pre-approved in under 90 seconds!',
        'supportingColor' => '',
        'supportingFontSize' => '',
        'beforeImage' => ['url' => ''],
        'afterImage'  => ['url' => ''],
        'minWeight' => 100,
        'maxWeight' => 400,
        'currentWeight' => 288,
        'gradientBg' => 'linear-gradient(135deg,#f6a27b 0%, #f46f6f 100%)',
    ]);

    $before_url = !empty($attrs['beforeImage']['url'])
      ? esc_url($attrs['beforeImage']['url'])
      : esc_url(get_stylesheet_directory_uri() . '/blocks/weight-loss-calculator/placeholders/before.jpg');

    $after_url = !empty($attrs['afterImage']['url'])
      ? esc_url($attrs['afterImage']['url'])
      : esc_url(get_stylesheet_directory_uri() . '/blocks/weight-loss-calculator/placeholders/after.jpg');

    $uid = 'gp-wlc-' . wp_generate_uuid4();

    // Heading inline styles
    $heading_styles = [];
    if (!empty($attrs['headingColor'])) {
        $heading_styles[] = 'color:' . esc_attr($attrs['headingColor']);
    }
    if (!empty($attrs['headingFontSize'])) {
        $heading_styles[] = 'font-size:' . esc_attr($attrs['headingFontSize']);
    }
    $heading_style_attr = $heading_styles ? ' style="' . esc_attr(implode(';', $heading_styles)) . '"' : '';

    // Support text inline styles
    $support_styles = [];
    if (!empty($attrs['supportingColor'])) {
        $support_styles[] = 'color:' . esc_attr($attrs['supportingColor']);
    }
    if (!empty($attrs['supportingFontSize'])) {
        $support_styles[] = 'font-size:' . esc_attr($attrs['supportingFontSize']);
    }
    $support_style_attr = $support_styles ? ' style="' . esc_attr(implode(';', $support_styles)) . '"' : '';

    $tag = in_array(strtolower($attrs['headingTag']), ['h1','h2','h3','h4','h5','h6'], true) ? strtolower($attrs['headingTag']) : 'h2';

    ob_start();
    ?>
    <div id="<?php echo esc_attr($uid); ?>"
         class="gp-wlc"
         data-min="<?php echo (int) $attrs['minWeight']; ?>"
         data-max="<?php echo (int) $attrs['maxWeight']; ?>"
         data-current="<?php echo (int) $attrs['currentWeight']; ?>"
         style="--gp-wlc-bg: <?php echo esc_attr($attrs['gradientBg']); ?>;">

      <div class="gp-wlc__grid">
        <div class="gp-wlc__visual">
          <div class="gp-wlc__visual-inner">
            <img class="gp-wlc__img gp-wlc__img--after" src="<?php echo $after_url; ?>" alt="After">
            <div class="gp-wlc__clip">
              <img class="gp-wlc__img gp-wlc__img--before" src="<?php echo $before_url; ?>" alt="Before">
            </div>
            <div class="gp-wlc__divider">
              <button class="gp-wlc__knob" type="button" aria-label="Drag to compare before/after">
                <span class="gp-wlc__chevrons">‹ ›</span>
              </button>
            </div>
            <span class="gp-wlc__label gp-wlc__label--before">Before</span>
            <span class="gp-wlc__label gp-wlc__label--after">After</span>
          </div>
        </div>

        <div class="gp-wlc__controls">
          <<?php echo $tag . $heading_style_attr; ?> class="gp-wlc__heading">
            <?php echo esc_html($attrs['heading']); ?>
          </<?php echo $tag; ?>>

          <div class="gp-wlc__field">
            <label class="gp-wlc__labeltext">Your current weight:</label>
            <div class="gp-wlc__value">
              <span class="gp-wlc__current-weight"><?php echo (int) $attrs['currentWeight']; ?></span> lbs
            </div>
            <div class="gp-wlc__slider"
                 role="slider"
                 aria-valuemin="<?php echo (int) $attrs['minWeight']; ?>"
                 aria-valuemax="<?php echo (int) $attrs['maxWeight']; ?>"
                 aria-valuenow="<?php echo (int) $attrs['currentWeight']; ?>"></div>
          </div>

          <div class="gp-wlc__field">
            <label class="gp-wlc__labeltext">Weight loss potential:</label>
            <div class="gp-wlc__value gp-wlc__value--accent">
              <span class="gp-wlc__loss">-0</span> lbs
            </div>
          </div>

          <div class="gp-wlc__cta-wrap">
            <a class="gp-wlc__cta button"
               href="<?php echo esc_url($attrs['buttonUrl']); ?>"
               data-weight="<?php echo (int) $attrs['currentWeight']; ?>">
              <?php echo esc_html($attrs['buttonText']); ?>
            </a>
            <div class="gp-wlc__support"<?php echo $support_style_attr; ?>>
              <?php echo esc_html($attrs['supportingText']); ?>
            </div>
          </div>
        </div>
      </div>
    </div>
    <?php

    return ob_get_clean();
};

