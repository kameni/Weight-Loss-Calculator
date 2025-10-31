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
            let currentTranslate = 0;
            let isTouchDragging = false;
            let dragStartX = 0;
            let dragInitialTranslate = 0;
            let dragStartY = 0;
            let dragDirection = null;
            let dragPreventClick = false;
            let activePointerId = null;

            const isMobileViewport = () => window.matchMedia('(max-width: 768px)').matches;

            const preventClickHandler = (event) => {
                if (!dragPreventClick) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();
            };

            slider.addEventListener('click', preventClickHandler, true);

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

            const resetNextCardLayout = () => {
                slider.classList.remove('wlc-product-slider--show-next-card');
                slider.style.removeProperty('--wlc-next-card-offset');
                slider.style.removeProperty('--wlc-next-card-peek');
            };

            const updateNextCardLayout = () => {
                if (!viewport || !slides.length) {
                    resetNextCardLayout();
                    return;
                }

                const currentSlide = slides[currentIndex];
                const currentCard = currentSlide ? currentSlide.querySelector('.wlc-product-card') : null;
                if (!currentCard) {
                    resetNextCardLayout();
                    return;
                }

                const viewportWidth = viewport.clientWidth;
                const cardWidth = currentCard.offsetWidth;
                const peekPadding = 120;
                const maxOffset = Math.max(0, viewportWidth - peekPadding);
                const desiredOffset = cardWidth + 50;
                const nextOffset = Math.min(desiredOffset, maxOffset);
                const peekWidth = Math.max(0, viewportWidth - nextOffset);
                const isTabletViewport = window.matchMedia('(max-width: 768px)').matches;
                const isNarrowViewport = window.matchMedia('(max-width: 400px)').matches;

                if (slides.length <= 1) {
                    resetNextCardLayout();
                    return;
                }

                if (isNarrowViewport) {
                    const desiredPeek = 12;
                    const effectiveCardWidth = Math.min(cardWidth, viewportWidth);
                    const narrowPeek = Math.min(desiredPeek, Math.max(0, viewportWidth - Math.max(0, effectiveCardWidth - desiredPeek)));

                    if (narrowPeek <= 0) {
                        resetNextCardLayout();
                        return;
                    }

                    const narrowOffset = Math.max(0, effectiveCardWidth - narrowPeek);

                    slider.style.setProperty('--wlc-next-card-offset', `${narrowOffset}px`);
                    slider.style.setProperty('--wlc-next-card-peek', `${narrowPeek}px`);
                    slider.classList.add('wlc-product-slider--show-next-card');
                    return;
                }

                if (isTabletViewport) {
                    const desiredPeek = Math.min(48, Math.max(20, viewportWidth * 0.14));
                    const effectiveCardWidth = Math.min(cardWidth, viewportWidth);
                    const tabletPeek = Math.min(desiredPeek, Math.max(0, viewportWidth - Math.max(0, effectiveCardWidth - desiredPeek)));

                    if (tabletPeek <= 0) {
                        resetNextCardLayout();
                        return;
                    }

                    const tabletOffset = Math.max(0, effectiveCardWidth - tabletPeek);

                    slider.style.setProperty('--wlc-next-card-offset', `${tabletOffset}px`);
                    slider.style.setProperty('--wlc-next-card-peek', `${tabletPeek}px`);
                    slider.classList.add('wlc-product-slider--show-next-card');
                    return;
                }

                const shouldShowNext = slides.length > 1 && viewportWidth > peekPadding && peekWidth > 0;

                if (!shouldShowNext) {
                    resetNextCardLayout();
                    return;
                }

                slider.style.setProperty('--wlc-next-card-offset', `${nextOffset}px`);
                slider.style.setProperty('--wlc-next-card-peek', `${peekWidth}px`);
                slider.classList.add('wlc-product-slider--show-next-card');
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

                updateNextCardLayout();

                const offset = slides[currentIndex].offsetLeft;
                currentTranslate = -offset;
                track.style.transform = `translateX(${currentTranslate}px)`;

                if (!animate || prefersReducedMotion) {
                    requestAnimationFrame(() => {
                        track.style.transition = '';
                    });
                }

                applySlideClasses();
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

            const startDrag = (clientX, clientY = 0) => {
                if (!track || !isMobileViewport()) {
                    return false;
                }

                isTouchDragging = true;
                dragStartX = clientX;
                dragStartY = clientY;
                dragInitialTranslate = currentTranslate;
                dragPreventClick = false;
                dragDirection = null;

                track.style.transition = 'none';
                return true;
            };

            const moveDrag = (clientX, clientY = null, originalEvent = null) => {
                if (!isTouchDragging || !track) {
                    return;
                }

                const deltaX = clientX - dragStartX;
                const deltaY = clientY === null ? 0 : clientY - dragStartY;

                if (!dragDirection) {
                    if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
                        dragDirection = 'horizontal';
                    } else if (Math.abs(deltaY) > 10) {
                        dragDirection = 'vertical';
                    }
                }

                if (dragDirection === 'vertical') {
                    return;
                }

                const delta = deltaX;

                if (!dragPreventClick && Math.abs(delta) > 5) {
                    dragPreventClick = true;
                }

                if (dragDirection === 'horizontal' && originalEvent && originalEvent.cancelable) {
                    originalEvent.preventDefault();
                }

                const nextTranslate = dragInitialTranslate + delta;
                currentTranslate = nextTranslate;
                track.style.transform = `translateX(${nextTranslate}px)`;
            };

            const finishDrag = (clientX, cancelled = false) => {
                if (!isTouchDragging || !track) {
                    return;
                }

                isTouchDragging = false;
                dragDirection = null;

                const delta = cancelled ? 0 : clientX - dragStartX;
                const threshold = 50;

                track.style.transition = '';

                if (Math.abs(delta) >= threshold) {
                    if (delta < 0) {
                        goToSlide(currentIndex + 1);
                    } else {
                        goToSlide(currentIndex - 1);
                    }
                } else {
                    goToSlide(currentIndex);
                }

                if (dragPreventClick) {
                    window.setTimeout(() => {
                        dragPreventClick = false;
                    }, 0);
                }
            };

            const handlePointerDown = (event) => {
                if (event.pointerType && event.pointerType !== 'touch') {
                    return;
                }

                if (!startDrag(event.clientX, event.clientY)) {
                    return;
                }

                activePointerId = event.pointerId;
                const target = event.currentTarget;
                target.setPointerCapture?.(event.pointerId);
            };

            const handlePointerMove = (event) => {
                if (activePointerId !== event.pointerId) {
                    return;
                }

                moveDrag(event.clientX, event.clientY, event);
            };

            const handlePointerEnd = (event) => {
                if (activePointerId !== event.pointerId) {
                    return;
                }

                const target = event.currentTarget;
                target.releasePointerCapture?.(event.pointerId);
                activePointerId = null;

                finishDrag(event.clientX, event.type === 'pointercancel');
            };

            const handleTouchStart = (event) => {
                if (!event.touches || !event.touches.length) {
                    return;
                }

                const touch = event.touches[0];
                if (!startDrag(touch.clientX, touch.clientY)) {
                    return;
                }

                activePointerId = 'touch';
            };

            const handleTouchMove = (event) => {
                if (!event.touches || !event.touches.length || activePointerId !== 'touch') {
                    return;
                }

                const touch = event.touches[0];
                moveDrag(touch.clientX, touch.clientY, event);
            };

            const handleTouchEnd = (event) => {
                if (activePointerId !== 'touch') {
                    return;
                }

                const touch = event.changedTouches && event.changedTouches[0];
                const clientX = touch ? touch.clientX : dragStartX;
                activePointerId = null;

                finishDrag(clientX, event.type === 'touchcancel');
            };

            if (viewport) {
                if (window.PointerEvent) {
                    viewport.addEventListener('pointerdown', handlePointerDown, { passive: true });
                    viewport.addEventListener('pointermove', handlePointerMove, { passive: false });
                    viewport.addEventListener('pointerup', handlePointerEnd, { passive: true });
                    viewport.addEventListener('pointercancel', handlePointerEnd, { passive: true });
                } else {
                    viewport.addEventListener('touchstart', handleTouchStart, { passive: true });
                    viewport.addEventListener('touchmove', handleTouchMove, { passive: false });
                    viewport.addEventListener('touchend', handleTouchEnd, { passive: true });
                    viewport.addEventListener('touchcancel', handleTouchEnd, { passive: true });
                }
            }

            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = window.setTimeout(() => {
                    goToSlide(currentIndex, { animate: false });
                }, 150);
            });
        });
    });
})();
