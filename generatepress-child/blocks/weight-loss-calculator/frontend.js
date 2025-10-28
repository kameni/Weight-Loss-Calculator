/* global jQuery */
(function($){
    /**
     * Smooth number tween utility using requestAnimationFrame.
     */
    function animateNumber($el, to, duration){
      const start = parseInt(($el.text()||'0').replace(/[^\d]/g,''),10) || 0;
      const diff = to - start;
      if (diff === 0) return;
      const t0 = performance.now();
      function step(t){
        const p = Math.min((t - t0) / duration, 1);
        const val = Math.round(start + diff * (0.5 - Math.cos(Math.PI*p)/2)); // easeInOut
        $el.text('-' + val);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
  
    /**
     * Initialize a single block instance by DOM node.
     */
    function init($root){
      const min = parseInt($root.data('min'),10);
      const max = parseInt($root.data('max'),10);
      const current = parseInt($root.data('current'),10);
  
      const $slider = $root.find('.gp-wlc__slider');
      const $weight = $root.find('.gp-wlc__current-weight');
      const $loss   = $root.find('.gp-wlc__loss');
      const $visual = $root.find('.gp-wlc__visual-inner');
      const $clip   = $root.find('.gp-wlc__clip');
      const $divider= $root.find('.gp-wlc__divider');
      const $cta    = $root.find('.gp-wlc__cta');
  
      // jQuery UI Slider for weight input
      $slider.slider({
        min: min,
        max: max,
        value: current,
        slide: function(_e, ui){
          $weight.text(ui.value);
          $slider.attr('aria-valuenow', ui.value);
          // Calculate potential weight loss: 15% of current weight
          const potential = Math.round(ui.value * 0.15);
          animateNumber($loss, potential, 400);
  
          // Move before/after mask proportionally: center at 50%, but reflect position
          const pct = (ui.value - min) / (max - min);
          $clip.css('width', (pct*100) + '%');
          $divider.css('left', (pct*100) + '%');
  
          // Persist selected weight on the CTA for funnel tracking
          $cta.attr('data-weight', ui.value);
        }
      });
  
      // Initialize display values on load
      const initPotential = Math.round(current * 0.15);
      $loss.text('-' + initPotential);
      const initPct = (current - min) / (max - min);
      $clip.css('width', (initPct*100) + '%');
      $divider.css('left', (initPct*100) + '%');
  
      // Before/after scrub — drag knob horizontally inside the visual container
      let dragging = false;
      $divider.on('mousedown touchstart', function(e){ dragging = true; e.preventDefault(); });
  
      $(window).on('mousemove touchmove', function(e){
        if(!dragging) return;
        const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
        const rect = $visual[0].getBoundingClientRect();
        const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
        const pct = x / rect.width;
        $clip.css('width', (pct*100) + '%');
        $divider.css('left', (pct*100) + '%');
      }).on('mouseup touchend', function(){ dragging = false; });
  
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
      $('.gp-wlc').each(function(){ init($(this)); });
    });
  })(jQuery);
  