/**
 * Yiphthachl Core Widgets
 * The 10 essential widgets for building apps
 */

import { Widget, StatefulWidget } from './base-widget.js';

// ==================== LAYOUT WIDGETS ====================

/**
 * Container - A box that can contain other widgets
 */
export class Container extends Widget {
    build() {
        const styles = {
            ...this.getStyles(),
            display: 'block',
        };

        const element = this.createElement('div', {
            className: 'yiph-container',
            style: styles
        });

        // Add children
        this.children.forEach(child => {
            element.appendChild(child.mount());
        });

        return element;
    }
}

/**
 * Column - Arranges children vertically
 */
export class Column extends Widget {
    build() {
        const alignment = this.props.alignment || 'start';
        const crossAlignment = this.props.crossAlignment || 'stretch';
        const gap = this.props.gap || 12;

        const alignMap = {
            'start': 'flex-start',
            'center': 'center',
            'end': 'flex-end',
            'between': 'space-between',
            'around': 'space-around'
        };

        const styles = {
            ...this.getStyles(),
            display: 'flex',
            flexDirection: 'column',
            justifyContent: alignMap[alignment] || alignment,
            alignItems: alignMap[crossAlignment] || crossAlignment,
            gap: `${gap}px`
        };

        const element = this.createElement('div', {
            className: 'yiph-column',
            style: styles
        });

        this.children.forEach(child => {
            element.appendChild(child.mount());
        });

        return element;
    }
}

/**
 * Row - Arranges children horizontally
 */
export class Row extends Widget {
    build() {
        const alignment = this.props.alignment || 'start';
        const crossAlignment = this.props.crossAlignment || 'center';
        const gap = this.props.gap || 12;

        const alignMap = {
            'start': 'flex-start',
            'center': 'center',
            'end': 'flex-end',
            'between': 'space-between',
            'around': 'space-around'
        };

        const styles = {
            ...this.getStyles(),
            display: 'flex',
            flexDirection: 'row',
            justifyContent: alignMap[alignment] || alignment,
            alignItems: alignMap[crossAlignment] || crossAlignment,
            gap: `${gap}px`
        };

        const element = this.createElement('div', {
            className: 'yiph-row',
            style: styles
        });

        this.children.forEach(child => {
            element.appendChild(child.mount());
        });

        return element;
    }
}

/**
 * Center - Centers its child
 */
export class Center extends Widget {
    build() {
        const styles = {
            ...this.getStyles(),
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flex: this.props.expand ? 1 : undefined
        };

        const element = this.createElement('div', {
            className: 'yiph-center',
            style: styles
        });

        if (this.props.child) {
            element.appendChild(this.props.child.mount());
        } else if (this.children.length > 0) {
            element.appendChild(this.children[0].mount());
        }

        return element;
    }
}

// ==================== CONTENT WIDGETS ====================

/**
 * Text - Displays text
 */
export class Text extends Widget {
    build() {
        const styles = {
            ...this.getStyles(),
            fontWeight: this.props.bold ? 'bold' : undefined,
            fontStyle: this.props.italic ? 'italic' : undefined,
            textDecoration: this.props.underline ? 'underline' : undefined,
            fontSize: this.props.size ? `${this.props.size}px` : undefined,
            textAlign: this.props.align || undefined,
            lineHeight: this.props.lineHeight || 1.5
        };

        return this.createElement('span', {
            className: 'yiph-text',
            style: styles
        }, this.props.text || this.props.content || '');
    }
}

/**
 * Button - A clickable button
 */
export class Button extends StatefulWidget {
    initState() {
        return {
            isPressed: false,
            isHovered: false
        };
    }

    build() {
        const baseStyles = {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: this.props.background || 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
            color: this.props.color || '#ffffff',
            boxShadow: '0 2px 4px rgba(99, 102, 241, 0.3)',
            ...this.getStyles()
        };

        // Hover/pressed states
        if (this.state.isHovered) {
            baseStyles.transform = 'translateY(-2px)';
            baseStyles.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)';
        }
        if (this.state.isPressed) {
            baseStyles.transform = 'translateY(0)';
        }

        const element = this.createElement('button', {
            className: 'yiph-button',
            style: baseStyles,
            onClick: (e) => {
                if (this.props.onPressed) {
                    this.props.onPressed(e);
                }
            },
            onMouseEnter: () => this.setState({ isHovered: true }),
            onMouseLeave: () => this.setState({ isHovered: false, isPressed: false }),
            onMouseDown: () => this.setState({ isPressed: true }),
            onMouseUp: () => this.setState({ isPressed: false })
        }, this.props.text || this.props.label || 'Button');

        // Add icon if present
        if (this.props.icon) {
            const icon = document.createElement('span');
            icon.className = 'material-icons';
            icon.style.marginRight = '8px';
            icon.textContent = this.props.icon;
            element.prepend(icon);
        }

        return element;
    }
}

/**
 * Image - Displays an image
 */
export class Image extends Widget {
    build() {
        const styles = {
            maxWidth: '100%',
            height: 'auto',
            objectFit: this.props.fit || 'cover',
            ...this.getStyles()
        };

        const element = this.createElement('img', {
            className: 'yiph-image',
            style: styles,
            src: this.props.src || this.props.source || '',
            alt: this.props.alt || ''
        });

        element.onerror = () => {
            element.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23334155" width="100" height="100"/><text fill="%2394a3b8" x="50" y="55" text-anchor="middle" font-size="12">Image</text></svg>';
        };

        return element;
    }
}

/**
 * Icon - Displays an icon
 */
export class Icon extends Widget {
    build() {
        const styles = {
            fontSize: `${this.props.size || 24}px`,
            color: this.props.color || 'inherit',
            ...this.getStyles()
        };

        return this.createElement('span', {
            className: 'yiph-icon material-icons',
            style: styles
        }, this.props.name || this.props.icon || 'star');
    }
}

// ==================== INPUT WIDGETS ====================

/**
 * TextField - A text input field
 */
export class TextField extends StatefulWidget {
    initState() {
        return {
            value: this.props.value || '',
            isFocused: false
        };
    }

    build() {
        const styles = {
            width: '100%',
            padding: '12px 16px',
            fontSize: '16px',
            border: `2px solid ${this.state.isFocused ? '#6366f1' : '#475569'}`,
            borderRadius: '8px',
            backgroundColor: '#1e293b',
            color: '#f1f5f9',
            outline: 'none',
            transition: 'all 0.2s ease',
            boxShadow: this.state.isFocused ? '0 0 0 3px rgba(99, 102, 241, 0.2)' : 'none',
            ...this.getStyles()
        };

        const element = document.createElement('input');
        element.id = this.id;
        element.type = this.props.type || 'text';
        element.className = 'yiph-textfield';
        element.placeholder = this.props.placeholder || '';
        element.value = this.state.value;

        Object.assign(element.style, styles);

        element.addEventListener('input', (e) => {
            this.setState({ value: e.target.value });
            if (this.props.onChange) {
                this.props.onChange(e.target.value);
            }
        });

        element.addEventListener('focus', () => {
            this.setState({ isFocused: true });
            if (this.props.onFocus) this.props.onFocus();
        });

        element.addEventListener('blur', () => {
            this.setState({ isFocused: false });
            if (this.props.onBlur) this.props.onBlur();
        });

        return element;
    }
}

// ==================== NAVIGATION WIDGETS ====================

/**
 * Scaffold - The main layout structure with app bar and body
 */
export class Scaffold extends Widget {
    build() {
        const styles = {
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            backgroundColor: this.props.backgroundColor || '#0f172a',
            ...this.getStyles()
        };

        const element = this.createElement('div', {
            className: 'yiph-scaffold',
            style: styles
        });

        // App bar
        if (this.props.appBar) {
            element.appendChild(this.props.appBar.mount());
        }

        // Body
        const body = document.createElement('div');
        body.className = 'yiph-scaffold-body';
        body.style.flex = '1';
        body.style.overflowY = 'auto';
        body.style.padding = '16px';

        if (this.props.body) {
            body.appendChild(this.props.body.mount());
        }
        this.children.forEach(child => {
            body.appendChild(child.mount());
        });

        element.appendChild(body);

        // Bottom navigation
        if (this.props.bottomNav) {
            element.appendChild(this.props.bottomNav.mount());
        }

        // Floating action button
        if (this.props.floatingButton) {
            const fab = this.props.floatingButton.mount();
            fab.style.position = 'fixed';
            fab.style.bottom = this.props.bottomNav ? '80px' : '24px';
            fab.style.right = '24px';
            element.appendChild(fab);
        }

        return element;
    }
}

// ==================== WIDGET EXPORTS ====================

export const widgets = {
    Container,
    Column,
    Row,
    Center,
    Text,
    Button,
    Image,
    Icon,
    TextField,
    Scaffold
};

// Helper functions to create widgets easily
export function column(props = {}, children = []) {
    const widget = new Column(props);
    children.forEach(child => widget.addChild(child));
    return widget;
}

export function row(props = {}, children = []) {
    const widget = new Row(props);
    children.forEach(child => widget.addChild(child));
    return widget;
}

export function center(child, props = {}) {
    const widget = new Center({ ...props, child });
    return widget;
}

export function text(content, props = {}) {
    return new Text({ ...props, text: content });
}

export function button(label, onPressed, props = {}) {
    return new Button({ ...props, label, onPressed });
}

export function image(src, props = {}) {
    return new Image({ ...props, src });
}

export function icon(name, props = {}) {
    return new Icon({ ...props, name });
}

export function textField(props = {}) {
    return new TextField(props);
}

export function scaffold(props = {}) {
    return new Scaffold(props);
}

export function container(props = {}, children = []) {
    const widget = new Container(props);
    children.forEach(child => widget.addChild(child));
    return widget;
}
