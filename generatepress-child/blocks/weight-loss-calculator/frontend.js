/* global jQuery */
(function($){
    /**
     * Smooth number tween utility using requestAnimationFrame.
     */
    function animateNumber($el, to, duration){
      const prev = $el.data('wlcAnimFrame');
      if (prev) {
        cancelAnimationFrame(prev);
        $el.removeData('wlcAnimFrame');
      }

      const start = parseInt(($el.text()||'0').replace(/[^\d]/g,''),10) || 0;
      const diff = to - start;
      if (diff === 0) {
        $el.text('-' + to);
        return;
      }

      const t0 = performance.now();
      function step(t){
        const p = Math.min((t - t0) / duration, 1);
        const val = Math.round(start + diff * (0.5 - Math.cos(Math.PI*p)/2)); // easeInOut
        $el.text('-' + val);
        if (p < 1) {
          const raf = requestAnimationFrame(step);
          $el.data('wlcAnimFrame', raf);
        } else {
          $el.removeData('wlcAnimFrame');
        }
      }

      const raf = requestAnimationFrame(step);
      $el.data('wlcAnimFrame', raf);
    }
  
    /**
     * Initialize a single block instance by DOM node.
     */
    function init($root){
      let min = parseInt($root.data('min'),10);
      let max = parseInt($root.data('max'),10);
      const current = parseInt($root.data('current'),10);

      if (!isFinite(min)) {
        min = 0;
      }
      if (!isFinite(max)) {
        max = min + 1;
      }

      const hasRange = isFinite(max) && isFinite(min) && max > min;
      const sliderMax = hasRange ? max : min + 1;

      function clampToRange(value){
        if (!isFinite(value)) return min;
        if (!hasRange) return min;
        return Math.min(Math.max(value, min), max);
      }

      function safePct(value){
        if (!hasRange) {
          return 0;
        }
        return (value - min) / (max - min);
      }
  
      const $slider  = $root.find('.gp-wlc__slider');
      const $weight  = $root.find('.gp-wlc__current-weight');
      const $loss    = $root.find('.gp-wlc__loss');
      const $visual  = $root.find('.gp-wlc__visual-inner');
      const $clip    = $root.find('.gp-wlc__clip');
      const $divider = $root.find('.gp-wlc__divider');
      const $cta     = $root.find('.gp-wlc__cta');

      function setClip(pct){
        const pctSafe = Math.min(Math.max(pct, 0), 1) * 100;
        $clip.css('width', pctSafe + '%');
        $divider.css('left', pctSafe + '%');
      }

      function setLossInstant($el, value){
        const prev = $el.data('wlcAnimFrame');
        if (prev) {
          cancelAnimationFrame(prev);
          $el.removeData('wlcAnimFrame');
        }
        $el.text('-' + value);
      }

      let lastValue = clampToRange(current);

      function updateUI(value, options){
        const opts = $.extend({
          updateSlider: true,
          animateLoss: true,
          clipPct: null
        }, options);

        const clamped = clampToRange(value);
        if (opts.updateSlider && $slider.data('ui-slider')) {
          $slider.slider('value', clamped);
        }

        $weight.text(clamped);
        $slider.attr('aria-valuenow', clamped);

        const potential = Math.round(clamped * 0.15);
        if (opts.animateLoss && clamped !== lastValue) {
          animateNumber($loss, potential, 400);
        } else {
          setLossInstant($loss, potential);
        }

        const pct = opts.clipPct !== null
          ? opts.clipPct
          : (hasRange ? 1 - safePct(clamped) : 0);
        setClip(pct);

        $cta.attr('data-weight', clamped);
        lastValue = clamped;
      }
  
      // jQuery UI Slider for weight input
      $slider.slider({
        min: min,
        max: sliderMax,
        value: clampToRange(current),
        slide: function(_e, ui){
          const value = clampToRange(ui.value);
          updateUI(value, {
            updateSlider: false,
            animateLoss: true
          });
        }
      });

      // Initialize display values on load
      const initialValue = clampToRange(current);
      updateUI(initialValue, { animateLoss: false });

      // Before/after scrub — drag knob horizontally inside the visual container
      let dragging = false;
      function updateFromPointer(e){
        const touch = e.touches && e.touches[0];
        const clientX = touch ? touch.clientX : e.clientX;
        const rect = $visual[0].getBoundingClientRect();
        const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
        const pct = rect.width ? (x / rect.width) : 0;
        const valueFromPct = hasRange
          ? (min + (1 - pct) * (max - min))
          : min;
        updateUI(valueFromPct, {
          animateLoss: false,
          clipPct: pct
        });
      }

      function startDrag(e){
        dragging = true;
        updateFromPointer(e);
        e.preventDefault();
      }

      $divider.on('mousedown touchstart', startDrag);
      $visual.on('mousedown touchstart', startDrag);

      $(window).on('mousemove touchmove', function(e){
        if(!dragging) return;
        updateFromPointer(e);
      }).on('mouseup touchend touchcancel', function(){ dragging = false; });
  
      // Optional: click-through capture of weight (example use — replace with your analytics/funnel code)
      $cta.on('click', function(){
        // Example: append selected weight to URL as query param if href is same-origin or '#'
        try {
          const href = $(this).attr('href') || '#';
          const w = $cta.attr('data-weight') || current;
          if (href === '#' || href.indexOf('#') === 0) return; // do nothing for placeholder links
          const u = new URL(href, window.location.origin);
          u.searchParams.set('weight', w);
          $(this).attr('href', u.toString());
        } catch(_e){}
      });
    }
  
    // Boot all instances (front-end)
    jQuery(function($){
      // Skip initialization inside the block editor so the editing UI remains
      // controllable by the React edit component (otherwise the front-end
      // slider wiring hijacks events and prevents block selection/removal).
      if (
        document.body &&
        (document.body.classList.contains('block-editor-page') || document.body.classList.contains('wp-admin'))
      ) {
        return;
      }

      $('.gp-wlc').each(function(){ init($(this)); });
    });
  })(jQuery);
  