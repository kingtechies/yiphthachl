/**
 * Yiphthachl Animation Engine
 * Animation system for smooth transitions and effects
 */

// Easing functions
export const easings = {
    linear: t => t,
    easeIn: t => t * t,
    easeOut: t => 1 - (1 - t) * (1 - t),
    easeInOut: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    easeInCubic: t => t * t * t,
    easeOutCubic: t => 1 - Math.pow(1 - t, 3),
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    easeInQuart: t => t * t * t * t,
    easeOutQuart: t => 1 - Math.pow(1 - t, 4),
    easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
    bounce: t => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    },
    elastic: t => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 :
            -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
    }
};

/**
 * Animation class for animating properties
 */
export class Animation {
    constructor(options = {}) {
        this.target = options.target;
        this.duration = options.duration || 300;
        this.easing = options.easing || 'easeOut';
        this.delay = options.delay || 0;
        this.properties = options.properties || {};
        this.onUpdate = options.onUpdate || null;
        this.onComplete = options.onComplete || null;

        this.startTime = null;
        this.startValues = {};
        this.isRunning = false;
        this.animationFrame = null;
    }

    /**
     * Start the animation
     */
    start() {
        if (this.isRunning) return this;

        // Capture start values
        if (this.target instanceof Element) {
            const computedStyle = getComputedStyle(this.target);
            Object.keys(this.properties).forEach(prop => {
                this.startValues[prop] = this.getCurrentValue(this.target, prop, computedStyle);
            });
        }

        this.isRunning = true;

        setTimeout(() => {
            this.startTime = performance.now();
            this.tick();
        }, this.delay);

        return this;
    }

    /**
     * Animation tick
     */
    tick() {
        if (!this.isRunning) return;

        const elapsed = performance.now() - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);
        const easedProgress = this.getEasedValue(progress);

        // Update properties
        Object.keys(this.properties).forEach(prop => {
            const endValue = this.properties[prop];
            const startValue = this.startValues[prop];
            const currentValue = this.interpolate(startValue, endValue, easedProgress);
            this.setProperty(prop, currentValue);
        });

        if (this.onUpdate) {
            this.onUpdate(easedProgress);
        }

        if (progress < 1) {
            this.animationFrame = requestAnimationFrame(() => this.tick());
        } else {
            this.isRunning = false;
            if (this.onComplete) {
                this.onComplete();
            }
        }
    }

    /**
     * Stop the animation
     */
    stop() {
        this.isRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        return this;
    }

    /**
     * Get current property value
     */
    getCurrentValue(element, prop, computedStyle) {
        const value = computedStyle[prop];
        const numMatch = value?.match(/^(-?\d*\.?\d+)/);
        return numMatch ? parseFloat(numMatch[1]) : 0;
    }

    /**
     * Get eased value
     */
    getEasedValue(progress) {
        const easingFn = typeof this.easing === 'function'
            ? this.easing
            : easings[this.easing] || easings.easeOut;
        return easingFn(progress);
    }

    /**
     * Interpolate between values
     */
    interpolate(start, end, progress) {
        if (typeof end === 'number') {
            return start + (end - start) * progress;
        }

        // Handle color interpolation
        if (typeof end === 'string' && end.startsWith('#')) {
            return this.interpolateColor(start, end, progress);
        }

        return end;
    }

    /**
     * Interpolate colors
     */
    interpolateColor(start, end, progress) {
        const startRGB = this.hexToRgb(start);
        const endRGB = this.hexToRgb(end);

        const r = Math.round(startRGB.r + (endRGB.r - startRGB.r) * progress);
        const g = Math.round(startRGB.g + (endRGB.g - startRGB.g) * progress);
        const b = Math.round(startRGB.b + (endRGB.b - startRGB.b) * progress);

        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * Convert hex to RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    /**
     * Set property on target
     */
    setProperty(prop, value) {
        if (this.target instanceof Element) {
            const unit = this.getUnit(prop);
            this.target.style[prop] = typeof value === 'number' ? `${value}${unit}` : value;
        }
    }

    /**
     * Get CSS unit for property
     */
    getUnit(prop) {
        const pxProps = ['width', 'height', 'top', 'left', 'right', 'bottom',
            'margin', 'padding', 'fontSize', 'borderRadius', 'borderWidth'];
        return pxProps.some(p => prop.toLowerCase().includes(p.toLowerCase())) ? 'px' : '';
    }
}

/**
 * Animation presets
 */
export const presets = {
    fadeIn: (target, options = {}) => new Animation({
        target,
        duration: options.duration || 300,
        easing: options.easing || 'easeOut',
        properties: { opacity: 1 }
    }),

    fadeOut: (target, options = {}) => new Animation({
        target,
        duration: options.duration || 300,
        easing: options.easing || 'easeOut',
        properties: { opacity: 0 }
    }),

    slideInLeft: (target, options = {}) => new Animation({
        target,
        duration: options.duration || 300,
        easing: options.easing || 'easeOut',
        properties: {
            transform: 'translateX(0)',
            opacity: 1
        }
    }),

    slideInRight: (target, options = {}) => new Animation({
        target,
        duration: options.duration || 300,
        easing: options.easing || 'easeOut',
        properties: {
            transform: 'translateX(0)',
            opacity: 1
        }
    }),

    slideInUp: (target, options = {}) => new Animation({
        target,
        duration: options.duration || 300,
        easing: options.easing || 'easeOut',
        properties: {
            transform: 'translateY(0)',
            opacity: 1
        }
    }),

    scaleIn: (target, options = {}) => new Animation({
        target,
        duration: options.duration || 300,
        easing: options.easing || 'easeOut',
        properties: {
            transform: 'scale(1)',
            opacity: 1
        }
    }),

    bounce: (target, options = {}) => new Animation({
        target,
        duration: options.duration || 600,
        easing: 'bounce',
        properties: {
            transform: 'translateY(0)'
        }
    })
};

/**
 * Animate helper function
 */
export function animate(target, properties, options = {}) {
    const animation = new Animation({
        target,
        properties,
        ...options
    });
    return animation.start();
}

/**
 * Stagger animations
 */
export function stagger(targets, properties, options = {}) {
    const delay = options.staggerDelay || 50;
    const animations = [];

    targets.forEach((target, index) => {
        const animation = new Animation({
            target,
            properties,
            delay: index * delay,
            ...options
        });
        animations.push(animation);
        animation.start();
    });

    return animations;
}

/**
 * CSS Transition helper
 */
export function transition(element, properties, duration = 300, easing = 'ease') {
    const props = Object.keys(properties).join(', ');
    element.style.transition = `${props} ${duration}ms ${easing}`;

    Object.entries(properties).forEach(([prop, value]) => {
        element.style[prop] = value;
    });

    return new Promise(resolve => {
        element.addEventListener('transitionend', resolve, { once: true });
        setTimeout(resolve, duration + 50); // Fallback
    });
}
