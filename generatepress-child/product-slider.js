(() => {
    'use strict';

    const onReady = (callback) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    };

    onReady(() => {
        const sliders = document.querySelectorAll('.wlc-product-slider');
        if (!sliders.length) {
            return;
        }

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        sliders.forEach((slider) => {
            const track = slider.querySelector('[data-slider-track]');
            if (!track) {
                return;
            }

            const slides = Array.from(track.children);
            if (!slides.length) {
                return;
            }

            const dotsContainer = slider.querySelector('.wlc-product-slider__dots');
            const prevButton = slider.querySelector('[data-action="prev"]');
            const nextButton = slider.querySelector('[data-action="next"]');
            const dots = [];
            let currentIndex = 0;
            let resizeTimer = null;

            if (dotsContainer) {
                dotsContainer.innerHTML = '';
            }

            slides.forEach((_, index) => {
                if (!dotsContainer) {
                    return;
                }

                const dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'wlc-product-slider__dot';
                dot.setAttribute('data-target-index', String(index));
                dot.setAttribute('aria-label', `Show slide ${index + 1}`);
                dotsContainer.appendChild(dot);
                dots.push(dot);
            });

            const updateDots = () => {
                dots.forEach((dot, index) => {
                    if (!dot) {
                        return;
                    }

                    if (index === currentIndex) {
                        dot.classList.add('is-active');
                        dot.setAttribute('aria-current', 'true');
                    } else {
                        dot.classList.remove('is-active');
                        dot.removeAttribute('aria-current');
                    }
                });
            };

            const updateNavState = () => {
                const singleSlide = slides.length <= 1;

                slider.classList.toggle('wlc-product-slider--single', singleSlide);

                if (prevButton) {
                    prevButton.disabled = singleSlide;
                }

                if (nextButton) {
                    nextButton.disabled = singleSlide;
                }

                if (dotsContainer) {
                    dotsContainer.classList.toggle('is-hidden', singleSlide);
                }
            };

            const goToSlide = (index, { animate = true } = {}) => {
                if (!slides.length) {
                    return;
                }

                const total = slides.length;
                currentIndex = (index + total) % total;

                if (!animate || prefersReducedMotion) {
                    track.style.transition = 'none';
                } else {
                    track.style.transition = '';
                }

                const offset = slides[currentIndex].offsetLeft;
                track.style.transform = `translateX(-${offset}px)`;

                if (!animate || prefersReducedMotion) {
                    requestAnimationFrame(() => {
                        track.style.transition = '';
                    });
                }

                updateDots();
                updateNavState();
            };

            slider.classList.add('wlc-product-slider--ready');
            goToSlide(0, { animate: false });

            if (prevButton) {
                prevButton.addEventListener('click', () => {
                    goToSlide(currentIndex - 1);
                });
            }

            if (nextButton) {
                nextButton.addEventListener('click', () => {
                    goToSlide(currentIndex + 1);
                });
            }

            dots.forEach((dot) => {
                dot.addEventListener('click', (event) => {
                    const target = event.currentTarget;
                    const targetIndex = parseInt(target.getAttribute('data-target-index') || '0', 10);

                    if (!Number.isNaN(targetIndex)) {
                        goToSlide(targetIndex);
                    }
                });
            });

            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = window.setTimeout(() => {
                    goToSlide(currentIndex, { animate: false });
                }, 150);
            });
        });
    });
})();
