/**
 * Yiphthachl Base Widget
 * Foundation class for all widgets in the Yiphthachl framework
 */

let widgetIdCounter = 0;

export class Widget {
    constructor(props = {}) {
        this.id = `widget_${++widgetIdCounter}`;
        this.props = props;
        this.element = null;
        this.children = [];
        this.parent = null;
        this.state = {};
        this.mounted = false;
    }

    /**
     * Build the widget (override in subclasses)
     */
    build() {
        return this.createElement('div');
    }

    /**
     * Create a DOM element
     */
    createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        element.id = this.id;

        // Apply attributes
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key === 'className') {
                element.className = value;
            } else if (key.startsWith('on') && typeof value === 'function') {
                const event = key.slice(2).toLowerCase();
                element.addEventListener(event, value);
            } else {
                element.setAttribute(key, value);
            }
        });

        // Add content
        if (typeof content === 'string') {
            element.textContent = content;
        } else if (content instanceof Widget) {
            element.appendChild(content.mount());
        } else if (Array.isArray(content)) {
            content.forEach(child => {
                if (child instanceof Widget) {
                    element.appendChild(child.mount());
                } else if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                }
            });
        }

        return element;
    }

    /**
     * Mount the widget to the DOM
     */
    mount(container = null) {
        if (this.mounted && this.element) {
            return this.element;
        }

        this.element = this.build();

        if (container) {
            container.appendChild(this.element);
        }

        this.mounted = true;
        this.didMount();

        return this.element;
    }

    /**
     * Unmount the widget from the DOM
     */
    unmount() {
        if (this.element && this.element.parentNode) {
            this.willUnmount();
            this.element.parentNode.removeChild(this.element);
            this.mounted = false;
            this.element = null;
        }
    }

    /**
     * Update the widget
     */
    update(newProps = {}) {
        this.props = { ...this.props, ...newProps };

        if (this.mounted && this.element) {
            const newElement = this.build();
            this.element.parentNode.replaceChild(newElement, this.element);
            this.element = newElement;
            this.didUpdate();
        }
    }

    /**
     * Set internal state and trigger update
     */
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.update();
    }

    /**
     * Lifecycle: Called after mount
     */
    didMount() { }

    /**
     * Lifecycle: Called before unmount
     */
    willUnmount() { }

    /**
     * Lifecycle: Called after update
     */
    didUpdate() { }

    /**
     * Add a child widget
     */
    addChild(child) {
        child.parent = this;
        this.children.push(child);
        return this;
    }

    /**
     * Remove a child widget
     */
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index > -1) {
            child.unmount();
            child.parent = null;
            this.children.splice(index, 1);
        }
        return this;
    }

    /**
     * Get computed styles
     */
    getStyles() {
        const baseStyles = {};

        // Width and height
        if (this.props.width) {
            baseStyles.width = typeof this.props.width === 'number'
                ? `${this.props.width}px`
                : this.props.width;
        }
        if (this.props.height) {
            baseStyles.height = typeof this.props.height === 'number'
                ? `${this.props.height}px`
                : this.props.height;
        }

        // Padding and margin
        if (this.props.padding) {
            baseStyles.padding = typeof this.props.padding === 'number'
                ? `${this.props.padding}px`
                : this.props.padding;
        }
        if (this.props.margin) {
            baseStyles.margin = typeof this.props.margin === 'number'
                ? `${this.props.margin}px`
                : this.props.margin;
        }

        // Colors
        if (this.props.color) {
            baseStyles.color = this.props.color;
        }
        if (this.props.backgroundColor || this.props.background) {
            baseStyles.backgroundColor = this.props.backgroundColor || this.props.background;
        }

        // Border radius
        if (this.props.borderRadius || this.props.rounded) {
            const radius = this.props.borderRadius || this.props.rounded;
            baseStyles.borderRadius = typeof radius === 'number'
                ? `${radius}px`
                : radius;
        }

        // Custom styles
        if (this.props.style) {
            Object.assign(baseStyles, this.props.style);
        }

        return baseStyles;
    }
}

/**
 * Stateful Widget - For widgets that manage their own state
 */
export class StatefulWidget extends Widget {
    constructor(props = {}) {
        super(props);
        this.state = this.initState();
    }

    /**
     * Initialize state (override in subclasses)
     */
    initState() {
        return {};
    }

    /**
     * Set state and trigger rebuild
     */
    setState(newState) {
        this.state = { ...this.state, ...newState };

        if (this.mounted) {
            const newElement = this.build();
            if (this.element && this.element.parentNode) {
                this.element.parentNode.replaceChild(newElement, this.element);
            }
            this.element = newElement;
        }
    }
}

/**
 * Create a widget from a plain object definition
 */
export function createWidget(definition) {
    const widget = new Widget(definition.props);

    if (definition.build) {
        widget.build = definition.build.bind(widget);
    }

    if (definition.didMount) {
        widget.didMount = definition.didMount.bind(widget);
    }

    if (definition.willUnmount) {
        widget.willUnmount = definition.willUnmount.bind(widget);
    }

    return widget;
}
