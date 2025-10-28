/* global wp, jQuery */
(() => {
  if (!wp || !wp.blocks || !wp.element) return;

  const el = wp.element.createElement;
  const { registerBlockType } = wp.blocks;
  const { Fragment, useEffect, useRef } = wp.element;
  const be = wp.blockEditor || wp.editor;
  const { InspectorControls, MediaUpload, MediaUploadCheck, useBlockProps } = be || {};
  const { PanelBody, TextControl, SelectControl, ColorPalette, Button } = wp.components || {};
  const UnitControl = (wp.components && (wp.components.__experimentalUnitControl || wp.components.UnitControl)) || null;

  // If any essential API is missing, bail to avoid fatal parse errors in editor.
  if (!InspectorControls || !useBlockProps || !PanelBody || !TextControl || !SelectControl || !ColorPalette || !Button) return;

  const COLORS = [
    { name: 'Default', color: '' },
    { name: 'White', color: '#ffffff' },
    { name: 'Near Black', color: '#1a1a1a' }
  ];

  registerBlockType('generatepress-child/weight-loss-calculator', {
    edit: function Edit(props) {
      const { attributes, setAttributes } = props;
      const blockProps = useBlockProps({ className: 'gp-wlc gp-wlc--editor' });
      const rootRef = useRef();

      useEffect(() => {
        const node = rootRef.current;
        const $ = window.jQuery;
        if (!node || !$) return;

        const $wrap = $(node);
        const min = parseInt(attributes.minWeight || 100, 10);
        const max = parseInt(attributes.maxWeight || 400, 10);
        const cur = parseInt(attributes.currentWeight || min, 10);

        // jQuery UI slider
        const $slider = $wrap.find('.gp-wlc__slider');
        if ($slider.data('uiSlider')) $slider.slider('destroy');
        $slider.slider({
          min, max, value: cur,
          slide: function (_e, ui) {
            setAttributes({ currentWeight: ui.value });
            $wrap.find('.gp-wlc__current-weight').text(ui.value);
            const loss = Math.round(ui.value * 0.15);
            $wrap.find('.gp-wlc__loss').text('-' + loss);
            const pct = (ui.value - min) / (max - min);
            updateScrub($wrap, pct);
          }
        });

        // before/after scrub (drag divider)
        const $divider = $wrap.find('.gp-wlc__divider');
        const $visual  = $wrap.find('.gp-wlc__visual-inner');
        let dragging = false;

        function onMove(clientX) {
          const rect = $visual[0].getBoundingClientRect();
          const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
          const pct = x / rect.width;
          updateScrub($wrap, pct);
        }

        function down(e) { dragging = true; e.preventDefault(); }
        function up() { dragging = false; }
        function move(e) {
          if (!dragging) return;
          const cx = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
          onMove(cx);
        }

        $divider.on('mousedown touchstart', down);
        $(window).on('mousemove touchmove', move).on('mouseup touchend', up);

        // initial paint
        const loss = Math.round(cur * 0.15);
        $wrap.find('.gp-wlc__loss').text('-' + loss);
        updateScrub($wrap, (cur - min) / (max - min));

        return () => {
          if ($slider.data('uiSlider')) $slider.slider('destroy');
          $divider.off('mousedown touchstart', down);
          $(window).off('mousemove touchmove', move).off('mouseup touchend', up);
        };
      }, [attributes.minWeight, attributes.maxWeight, attributes.currentWeight]);

      function updateScrub($wrap, pct) {
        $wrap.find('.gp-wlc__clip').css('width', (pct * 100) + '%');
        $wrap.find('.gp-wlc__divider').css('left', (pct * 100) + '%');
      }

      const headingStyle = {
        color: attributes.headingColor || undefined,
        fontSize: attributes.headingFontSize || undefined
      };
      const HeadingTag = attributes.headingTag || 'h2';

      // Inspector panels
      const inspector = el(
        InspectorControls,
        null,
        el(
          PanelBody,
          { title: 'Heading', initialOpen: true },
          el(TextControl, {
            label: 'Text',
            value: attributes.heading || '',
            onChange: (v) => setAttributes({ heading: v })
          }),
          el(SelectControl, {
            label: 'HTML Tag',
            value: attributes.headingTag || 'h2',
            options: ['h1','h2','h3','h4','h5','h6'].map(t => ({ label: t.toUpperCase(), value: t })),
            onChange: (v) => setAttributes({ headingTag: v })
          }),
          el('div', { style: { marginBottom: '8px' } }, 'Color'),
          el(ColorPalette, {
            colors: COLORS,
            value: attributes.headingColor || '',
            onChange: (c) => setAttributes({ headingColor: c || '' })
          }),
          UnitControl ? el(UnitControl, {
            label: 'Font size',
            value: attributes.headingFontSize || '',
            onChange: (v) => setAttributes({ headingFontSize: v || '' }),
            units: [{ value: 'px', label: 'px' }]
          }) : null
        ),
        el(
          PanelBody,
          { title: 'Call to Action', initialOpen: false },
          el(TextControl, {
            label: 'Button text',
            value: attributes.buttonText || '',
            onChange: (v) => setAttributes({ buttonText: v })
          }),
          el(TextControl, {
            label: 'Button link',
            value: attributes.buttonUrl || '',
            onChange: (v) => setAttributes({ buttonUrl: v })
          }),
          el(TextControl, {
            label: 'Supporting text',
            value: attributes.supportingText || '',
            onChange: (v) => setAttributes({ supportingText: v })
          }),
          el('div', { style: { marginTop: '8px' } }, 'Supporting text color'),
          el(ColorPalette, {
            colors: COLORS,
            value: attributes.supportingColor || '',
            onChange: (c) => setAttributes({ supportingColor: c || '' })
          }),
          UnitControl ? el(UnitControl, {
            label: 'Supporting text size',
            value: attributes.supportingFontSize || '',
            onChange: (v) => setAttributes({ supportingFontSize: v || '' }),
            units: [{ value: 'px', label: 'px' }]
          }) : null
        ),
        el(
          PanelBody,
          { title: 'Images', initialOpen: false },
          el(MediaUploadCheck, null,
            el(MediaUpload, {
              onSelect: (m) => setAttributes({ beforeImage: { url: m.url, id: m.id } }),
              allowedTypes: ['image'],
              render: ({ open }) => el(Button, { onClick: open, variant: 'secondary' }, 'Select Before Image')
            })
          ),
          el('div', { style: { height: '8px' } }),
          el(MediaUploadCheck, null,
            el(MediaUpload, {
              onSelect: (m) => setAttributes({ afterImage: { url: m.url, id: m.id } }),
              allowedTypes: ['image'],
              render: ({ open }) => el(Button, { onClick: open, variant: 'secondary' }, 'Select After Image')
            })
          )
        ),
        el(
          PanelBody,
          { title: 'Slider', initialOpen: false },
          el(TextControl, {
            type: 'number',
            label: 'Min weight',
            value: attributes.minWeight,
            onChange: (v) => setAttributes({ minWeight: parseInt(v || 100, 10) })
          }),
          el(TextControl, {
            type: 'number',
            label: 'Max weight',
            value: attributes.maxWeight,
            onChange: (v) => setAttributes({ maxWeight: parseInt(v || 400, 10) })
          }),
          el(TextControl, {
            type: 'number',
            label: 'Default current',
            value: attributes.currentWeight,
            onChange: (v) => setAttributes({ currentWeight: parseInt(v || 288, 10) })
          })
        )
      );

      // Preview (same structure as front)
      return el(
        Fragment,
        null,
        inspector,
        el(
          'div',
          Object.assign({}, blockProps, { ref: rootRef }),
          el('div', { className: 'gp-wlc__grid' },
            el('div', { className: 'gp-wlc__visual' },
              el('div', { className: 'gp-wlc__visual-inner' },
                el('img', { className: 'gp-wlc__img gp-wlc__img--after', src: (attributes.afterImage && attributes.afterImage.url) || '', alt: 'After' }),
                el('div', { className: 'gp-wlc__clip' },
                  el('img', { className: 'gp-wlc__img gp-wlc__img--before', src: (attributes.beforeImage && attributes.beforeImage.url) || '', alt: 'Before' })
                ),
                el('div', { className: 'gp-wlc__divider' },
                  el('button', { className: 'gp-wlc__knob', type: 'button' },
                    el('span', { className: 'gp-wlc__chevrons' }, '‹ ›')
                  )
                ),
                el('span', { className: 'gp-wlc__label gp-wlc__label--before' }, 'Before'),
                el('span', { className: 'gp-wlc__label gp-wlc__label--after' }, 'After')
              )
            ),
            el('div', { className: 'gp-wlc__controls' },
              el(HeadingTag, { className: 'gp-wlc__heading', style: headingStyle }, attributes.heading || ''),
              el('div', { className: 'gp-wlc__field' },
                el('label', { className: 'gp-wlc__labeltext' }, 'Your current weight:'),
                el('div', { className: 'gp-wlc__value' },
                  el('span', { className: 'gp-wlc__current-weight' }, String(attributes.currentWeight || '')),
                  ' lbs'
                ),
                el('div', { className: 'gp-wlc__slider' })
              ),
              el('div', { className: 'gp-wlc__field' },
                el('label', { className: 'gp-wlc__labeltext' }, 'Weight loss potential:'),
                el('div', { className: 'gp-wlc__value gp-wlc__value--accent' },
                  el('span', { className: 'gp-wlc__loss' }, '-0'),
                  ' lbs'
                )
              ),
              el('div', { className: 'gp-wlc__cta-wrap' },
                el('a', { className: 'gp-wlc__cta button', href: attributes.buttonUrl || '#', 'data-weight': attributes.currentWeight || '' }, attributes.buttonText || 'Get started'),
                el('div', {
                  className: 'gp-wlc__support',
                  style: {
                    color: attributes.supportingColor || undefined,
                    fontSize: attributes.supportingFontSize || undefined
                  }
                }, attributes.supportingText || 'Get pre-approved in under 90 seconds!')
              )
            )
          )
        )
      );
    }
  });
})();