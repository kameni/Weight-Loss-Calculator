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
            const viewport = slider.querySelector('.wlc-product-slider__viewport');
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

            const visibleSlideClass = 'wlc-product-slider__slide--visible';
            const nextSlideClass = 'wlc-product-slider__slide--next';
            const visibleCardClass = 'wlc-product-card--visible';
            const nextCardClass = 'wlc-product-card--next';

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

            const clearSlideClasses = () => {
                slides.forEach((slide) => {
                    slide.classList.remove(visibleSlideClass, nextSlideClass);

                    const card = slide.querySelector('.wlc-product-card');
                    if (card) {
                        card.classList.remove(visibleCardClass, nextCardClass);
                    }
                });
            };

            const applySlideClasses = () => {
                if (!slides.length) {
                    return;
                }

                const total = slides.length;
                const nextIndex = total > 1 ? (currentIndex + 1) % total : -1;

                const currentSlide = slides[currentIndex];
                if (currentSlide) {
                    currentSlide.classList.add(visibleSlideClass);

                    const currentCard = currentSlide.querySelector('.wlc-product-card');
                    if (currentCard) {
                        currentCard.classList.add(visibleCardClass);
                    }
                }

                if (nextIndex !== -1) {
                    const nextSlide = slides[nextIndex];
                    if (nextSlide) {
                        nextSlide.classList.add(nextSlideClass);

                        const nextCard = nextSlide.querySelector('.wlc-product-card');
                        if (nextCard) {
                            nextCard.classList.add(nextCardClass);
                        }
                    }
                }
            };

            const updateNextCardLayout = () => {
                if (!viewport || !slides.length) {
                    slider.classList.remove('wlc-product-slider--show-next-card');
                    slider.style.removeProperty('--wlc-next-card-offset');
                    return;
                }

                const currentSlide = slides[currentIndex];
                const currentCard = currentSlide ? currentSlide.querySelector('.wlc-product-card') : null;
                if (!currentCard) {
                    slider.classList.remove('wlc-product-slider--show-next-card');
                    slider.style.removeProperty('--wlc-next-card-offset');
                    return;
                }

                const viewportWidth = viewport.clientWidth;
                const cardWidth = currentCard.offsetWidth;
                const peekPadding = 120;
                const maxOffset = Math.max(0, viewportWidth - peekPadding);
                const desiredOffset = cardWidth + 50;
                const nextOffset = Math.min(desiredOffset, maxOffset);

                slider.style.setProperty('--wlc-next-card-offset', `${nextOffset}px`);

                const shouldShowNext = slides.length > 1 && viewportWidth > peekPadding && viewportWidth > nextOffset;
                slider.classList.toggle('wlc-product-slider--show-next-card', shouldShowNext);
            };

            const goToSlide = (index, { animate = true } = {}) => {
                if (!slides.length) {
                    return;
                }

                clearSlideClasses();

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

                applySlideClasses();
                updateNextCardLayout();
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
