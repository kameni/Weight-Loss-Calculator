/* global wp */
(() => {
  if (!wp || !wp.blocks || !wp.element) return;

  const el = wp.element.createElement;
  const { registerBlockType } = wp.blocks;
  const { Fragment, useEffect, useMemo } = wp.element;
  const be = wp.blockEditor || wp.editor;
  const { InspectorControls, MediaUpload, MediaUploadCheck, useBlockProps } = be || {};
  const {
    PanelBody,
    TextControl,
    SelectControl,
    ColorPalette,
    Button,
    RangeControl
  } = wp.components || {};
  const UnitControl = (wp.components && (wp.components.__experimentalUnitControl || wp.components.UnitControl)) || null;

  if (!InspectorControls || !useBlockProps || !PanelBody || !TextControl || !SelectControl || !ColorPalette || !Button || !RangeControl) {
    return;
  }

  const COLORS = [
    { name: 'Default', color: '' },
    { name: 'White', color: '#ffffff' },
    { name: 'Near Black', color: '#1a1a1a' }
  ];

  function toNumber(value, fallback) {
    const next = parseInt(value, 10);
    return Number.isFinite(next) ? next : fallback;
  }

  registerBlockType('generatepress-child/weight-loss-calculator', {
    edit: function Edit(props) {
      const { attributes, setAttributes } = props;
      const blockProps = useBlockProps({ className: 'gp-wlc gp-wlc--editor' });
      const { attributes, setAttributes, isSelected } = props;
      const selected = typeof isSelected === 'boolean' ? isSelected : true;
      const blockProps = useBlockProps({ className: 'gp-wlc gp-wlc--editor' });
      const rootRef = useRef();

      useEffect(() => {
        const node = rootRef.current;
        const $ = window.jQuery;
        if (!node || !$) return;

        const $wrap = $(node);
        let min = parseInt(attributes.minWeight || 100, 10);
        let max = parseInt(attributes.maxWeight || 400, 10);
        const cur = parseInt(attributes.currentWeight || min, 10);

        if (!isFinite(min)) {
          min = 0;
        }
        if (!isFinite(max)) {
          max = min + 1;
        }

        const hasRange = isFinite(max) && isFinite(min) && max > min;
        const sliderMax = hasRange ? max : min + 1;

        function clampToRange(value) {
          if (!isFinite(value)) return min;
          if (!hasRange) return min;
          return Math.min(Math.max(value, min), max);
        }

      const minWeight = useMemo(() => toNumber(attributes.minWeight, 100), [attributes.minWeight]);
      const maxWeight = useMemo(() => {
        const max = toNumber(attributes.maxWeight, 400);
        return max > minWeight ? max : minWeight + 1;
      }, [attributes.maxWeight, minWeight]);

      const currentWeight = useMemo(() => {
        const value = toNumber(attributes.currentWeight, minWeight);
        if (value < minWeight) return minWeight;
        if (value > maxWeight) return maxWeight;
        return value;
      }, [attributes.currentWeight, minWeight, maxWeight]);

      useEffect(() => {
        if (currentWeight !== attributes.currentWeight) {
          setAttributes({ currentWeight });
        function computePct(value) {
          if (!hasRange) return 0;
          return (value - min) / (max - min);
        }

        // jQuery UI slider
        const $slider = $wrap.find('.gp-wlc__slider');
        const $divider = $wrap.find('.gp-wlc__divider');
        const $visual  = $wrap.find('.gp-wlc__visual-inner');

        let dragging = false;

        function onMove(clientX) {
          const rect = $visual[0].getBoundingClientRect();
          const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
          const pct = rect.width ? x / rect.width : 0;
          updateScrub($wrap, pct);
        }

        const down = (e) => { dragging = true; e.preventDefault(); };
        const up = () => { dragging = false; };
        const move = (e) => {
          if (!dragging) return;
          const cx = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
          onMove(cx);
        };

        const cleanup = () => {
          if ($slider.data('uiSlider')) $slider.slider('destroy');
          $divider.off('mousedown touchstart', down);
          $(window).off('mousemove touchmove', move).off('mouseup touchend', up);
        };

        // Always reflect the current weight even if the block is not selected.
        const loss = Math.round(sliderValue * 0.15);
        $wrap.find('.gp-wlc__current-weight').text(sliderValue);
        $wrap.find('.gp-wlc__loss').text('-' + loss);
        updateScrub($wrap, computePct(sliderValue));

        cleanup();

        if (!selected) {
          return cleanup;
        }
      }, [currentWeight, attributes.currentWeight, setAttributes]);

      const loss = Math.round(currentWeight * 0.15);
        $slider.slider({
          min,
          max: sliderMax,
          value: sliderValue,
          slide: function (_e, ui) {
            const nextValue = clampToRange(ui.value);
            setAttributes({ currentWeight: nextValue });
            $wrap.find('.gp-wlc__current-weight').text(nextValue);
            const lossValue = Math.round(nextValue * 0.15);
            $wrap.find('.gp-wlc__loss').text('-' + lossValue);
            updateScrub($wrap, computePct(nextValue));
          }
        });

        $divider.on('mousedown touchstart', down);
        $(window).on('mousemove touchmove', move).on('mouseup touchend', up);

        return cleanup;
      }, [attributes.minWeight, attributes.maxWeight, attributes.currentWeight, selected, setAttributes]);

      function updateScrub($wrap, pct) {
        const safe = !isFinite(pct) ? 0 : Math.max(0, Math.min(1, pct));
        $wrap.find('.gp-wlc__clip').css('width', (safe * 100) + '%');
        $wrap.find('.gp-wlc__divider').css('left', (safe * 100) + '%');
      }

      const headingStyle = {
        color: attributes.headingColor || undefined,
        fontSize: attributes.headingFontSize || undefined
      };
      const HeadingTag = attributes.headingTag || 'h2';

      const supportStyle = {
        color: attributes.supportingColor || undefined,
        fontSize: attributes.supportingFontSize || undefined
      };

      const beforeUrl = (attributes.beforeImage && attributes.beforeImage.url) || '';
      const afterUrl = (attributes.afterImage && attributes.afterImage.url) || '';

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
            options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((t) => ({ label: t.toUpperCase(), value: t })),
            onChange: (v) => setAttributes({ headingTag: v })
          }),
          el('div', { style: { marginBottom: '8px' } }, 'Color'),
          el(ColorPalette, {
            colors: COLORS,
            value: attributes.headingColor || '',
            onChange: (c) => setAttributes({ headingColor: c || '' })
          }),
          UnitControl
            ? el(UnitControl, {
                label: 'Font size',
                value: attributes.headingFontSize || '',
                onChange: (v) => setAttributes({ headingFontSize: v || '' }),
                units: [{ value: 'px', label: 'px' }]
              })
            : null
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
          UnitControl
            ? el(UnitControl, {
                label: 'Supporting text size',
                value: attributes.supportingFontSize || '',
                onChange: (v) => setAttributes({ supportingFontSize: v || '' }),
                units: [{ value: 'px', label: 'px' }]
              })
            : null
        ),
        el(
          PanelBody,
          { title: 'Images', initialOpen: false },
          el(MediaUploadCheck, null,
            el(MediaUpload, {
              onSelect: (m) => setAttributes({ beforeImage: { url: m.url, id: m.id } }),
              allowedTypes: ['image'],
              render: ({ open }) => el(Button, { onClick: open, variant: 'secondary' }, beforeUrl ? 'Replace Before Image' : 'Select Before Image')
            })
          ),
          beforeUrl
            ? el(Button, {
                isLink: true,
                onClick: () => setAttributes({ beforeImage: { url: '', id: null } })
              }, 'Remove before image')
            : null,
          el('div', { style: { height: '8px' } }),
          el(MediaUploadCheck, null,
            el(MediaUpload, {
              onSelect: (m) => setAttributes({ afterImage: { url: m.url, id: m.id } }),
              allowedTypes: ['image'],
              render: ({ open }) => el(Button, { onClick: open, variant: 'secondary' }, afterUrl ? 'Replace After Image' : 'Select After Image')
            })
          ),
          afterUrl
            ? el(Button, {
                isLink: true,
                onClick: () => setAttributes({ afterImage: { url: '', id: null } })
              }, 'Remove after image')
            : null
        ),
        el(
          PanelBody,
          { title: 'Weights', initialOpen: false },
          el(TextControl, {
            type: 'number',
            label: 'Minimum weight',
            value: String(minWeight),
            onChange: (v) => setAttributes({ minWeight: toNumber(v, 100) })
          }),
          el(TextControl, {
            type: 'number',
            label: 'Maximum weight',
            value: String(maxWeight),
            onChange: (v) => setAttributes({ maxWeight: toNumber(v, minWeight + 1) })
          })
        )
      );

      const preview = el(
        'div',
        Object.assign({}, blockProps, {
          style: Object.assign({}, blockProps.style || {}, {
            '--gp-wlc-bg': attributes.gradientBg || undefined
          })
        }),
        el('div', { className: 'gp-wlc__grid' },
          el('div', { className: 'gp-wlc__visual' },
            el('div', { className: 'gp-wlc__visual-inner' },
              el('div', {
                className: 'gp-wlc__img gp-wlc__img--after',
                style: afterUrl ? { backgroundImage: `url(${afterUrl})` } : null
              }),
              el('div', { className: 'gp-wlc__clip' },
                el('div', {
                  className: 'gp-wlc__img gp-wlc__img--before',
                  style: beforeUrl ? { backgroundImage: `url(${beforeUrl})` } : null
                })
              ),
              el('div', { className: 'gp-wlc__divider' },
                el('div', { className: 'gp-wlc__knob' },
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
                el('span', { className: 'gp-wlc__current-weight' }, String(currentWeight)),
                ' lbs'
              ),
              el(RangeControl, {
                label: 'Adjust weight',
                value: currentWeight,
                min: minWeight,
                max: maxWeight,
                onChange: (value) => setAttributes({ currentWeight: toNumber(value, currentWeight) })
              })
            ),
            el('div', { className: 'gp-wlc__field' },
              el('label', { className: 'gp-wlc__labeltext' }, 'Weight loss potential:'),
              el('div', { className: 'gp-wlc__value gp-wlc__value--accent' },
                el('span', { className: 'gp-wlc__loss' }, '-' + loss),
                ' lbs'
              )
            ),
            el('div', { className: 'gp-wlc__cta-wrap' },
              el('a', { className: 'gp-wlc__cta button', href: attributes.buttonUrl || '#', 'data-weight': currentWeight }, attributes.buttonText || 'Get started'),
              el('div', { className: 'gp-wlc__support', style: supportStyle }, attributes.supportingText || '')
            )
          )
        )
      );

      return el(Fragment, null, inspector, preview);
    },
    save: function Save() {
      return null;
    }
  });
})();
