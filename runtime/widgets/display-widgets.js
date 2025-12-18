/**
 * Yiphthachl Display Widgets
 * Widgets for displaying content and feedback
 */

import { Widget, StatefulWidget } from './base-widget.js';

/**
 * Avatar - A circular avatar image
 */
export class Avatar extends Widget {
    build() {
        const size = this.props.size || 48;

        const container = document.createElement('div');
        container.className = 'yiph-avatar';
        container.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            overflow: hidden;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        `;

        if (this.props.src) {
            const img = document.createElement('img');
            img.src = this.props.src;
            img.alt = this.props.alt || '';
            img.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: cover;
            `;
            img.onerror = () => {
                container.innerHTML = this.getInitials();
            };
            container.appendChild(img);
        } else {
            container.innerHTML = `
                <span style="color: white; font-size: ${size * 0.4}px; font-weight: 600;">
                    ${this.getInitials()}
                </span>
            `;
        }

        return container;
    }

    getInitials() {
        const name = this.props.name || 'User';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
}

/**
 * Badge - A small status badge
 */
export class Badge extends Widget {
    build() {
        const colors = {
            primary: { bg: '#6366f1', text: '#ffffff' },
            success: { bg: '#10b981', text: '#ffffff' },
            warning: { bg: '#f59e0b', text: '#000000' },
            error: { bg: '#ef4444', text: '#ffffff' },
            info: { bg: '#0ea5e9', text: '#ffffff' },
            default: { bg: '#475569', text: '#ffffff' }
        };

        const color = colors[this.props.variant] || colors.default;

        const badge = document.createElement('span');
        badge.className = 'yiph-badge';
        badge.textContent = this.props.text || this.props.label || '';
        badge.style.cssText = `
            display: inline-flex;
            align-items: center;
            padding: 4px 8px;
            font-size: 11px;
            font-weight: 600;
            border-radius: 9999px;
            background: ${color.bg};
            color: ${color.text};
        `;

        return badge;
    }
}

/**
 * ProgressBar - A horizontal progress indicator
 */
export class ProgressBar extends Widget {
    build() {
        const value = Math.min(100, Math.max(0, this.props.value || 0));
        const height = this.props.height || 8;
        const color = this.props.color || '#6366f1';

        const container = document.createElement('div');
        container.className = 'yiph-progress';
        container.style.cssText = `
            width: 100%;
            height: ${height}px;
            background: #334155;
            border-radius: ${height / 2}px;
            overflow: hidden;
        `;

        const bar = document.createElement('div');
        bar.style.cssText = `
            width: ${value}%;
            height: 100%;
            background: ${color};
            border-radius: ${height / 2}px;
            transition: width 0.3s ease;
        `;

        container.appendChild(bar);

        if (this.props.showLabel) {
            const label = document.createElement('div');
            label.textContent = `${Math.round(value)}%`;
            label.style.cssText = `
                margin-top: 4px;
                font-size: 12px;
                color: #9ca3af;
                text-align: center;
            `;
            const wrapper = document.createElement('div');
            wrapper.appendChild(container);
            wrapper.appendChild(label);
            return wrapper;
        }

        return container;
    }
}

/**
 * Spinner - A loading spinner
 */
export class Spinner extends Widget {
    build() {
        const size = this.props.size || 32;
        const color = this.props.color || '#6366f1';

        const spinner = document.createElement('div');
        spinner.className = 'yiph-spinner';
        spinner.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            border: 3px solid #334155;
            border-top-color: ${color};
            border-radius: 50%;
            animation: yiph-spin 0.8s linear infinite;
        `;

        // Add keyframes if not already added
        if (!document.getElementById('yiph-spinner-styles')) {
            const style = document.createElement('style');
            style.id = 'yiph-spinner-styles';
            style.textContent = `
                @keyframes yiph-spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        return spinner;
    }
}

/**
 * Divider - A horizontal or vertical divider
 */
export class Divider extends Widget {
    build() {
        const isVertical = this.props.vertical || false;
        const color = this.props.color || '#334155';
        const thickness = this.props.thickness || 1;

        const divider = document.createElement('div');
        divider.className = 'yiph-divider';

        if (isVertical) {
            divider.style.cssText = `
                width: ${thickness}px;
                height: ${this.props.height || '100%'};
                background: ${color};
                flex-shrink: 0;
            `;
        } else {
            divider.style.cssText = `
                width: 100%;
                height: ${thickness}px;
                background: ${color};
                margin: ${this.props.margin || 16}px 0;
            `;
        }

        return divider;
    }
}

/**
 * Chip - A compact element for tags or selections
 */
export class Chip extends StatefulWidget {
    initState() {
        return {
            selected: this.props.selected || false
        };
    }

    build() {
        const chip = document.createElement('button');
        chip.className = 'yiph-chip';

        const bgColor = this.state.selected
            ? (this.props.selectedColor || '#6366f1')
            : (this.props.color || '#334155');

        chip.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            font-size: 13px;
            font-weight: 500;
            color: ${this.state.selected ? '#ffffff' : '#e2e8f0'};
            background: ${bgColor};
            border: none;
            border-radius: 9999px;
            cursor: pointer;
            transition: all 0.2s ease;
        `;

        if (this.props.icon) {
            const icon = document.createElement('span');
            icon.className = 'material-icons';
            icon.textContent = this.props.icon;
            icon.style.fontSize = '16px';
            chip.appendChild(icon);
        }

        const label = document.createElement('span');
        label.textContent = this.props.label || '';
        chip.appendChild(label);

        if (this.props.onDelete && this.state.selected) {
            const deleteBtn = document.createElement('span');
            deleteBtn.className = 'material-icons';
            deleteBtn.textContent = 'close';
            deleteBtn.style.cssText = `
                font-size: 16px;
                margin-left: 2px;
                opacity: 0.7;
            `;
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.props.onDelete();
            });
            chip.appendChild(deleteBtn);
        }

        if (this.props.selectable !== false) {
            chip.addEventListener('click', () => {
                this.setState({ selected: !this.state.selected });
                if (this.props.onSelect) {
                    this.props.onSelect(!this.state.selected);
                }
            });
        }

        return chip;
    }
}

/**
 * Tooltip - A popup text on hover
 */
export class Tooltip extends Widget {
    build() {
        const container = document.createElement('div');
        container.className = 'yiph-tooltip-container';
        container.style.cssText = `
            position: relative;
            display: inline-flex;
        `;

        // Child content
        if (this.props.child) {
            container.appendChild(this.props.child.mount());
        } else if (this.children.length > 0) {
            container.appendChild(this.children[0].mount());
        }

        const tooltip = document.createElement('div');
        tooltip.className = 'yiph-tooltip';
        tooltip.textContent = this.props.text || '';
        tooltip.style.cssText = `
            position: absolute;
            ${this.props.position === 'bottom' ? 'top: 100%; margin-top: 8px;' : 'bottom: 100%; margin-bottom: 8px;'}
            left: 50%;
            transform: translateX(-50%);
            padding: 6px 10px;
            font-size: 12px;
            color: white;
            background: #1f2937;
            border-radius: 6px;
            white-space: nowrap;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.2s ease, visibility 0.2s ease;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;

        container.appendChild(tooltip);

        container.addEventListener('mouseenter', () => {
            tooltip.style.opacity = '1';
            tooltip.style.visibility = 'visible';
        });

        container.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
            tooltip.style.visibility = 'hidden';
        });

        return container;
    }
}

/**
 * CircularProgress - A circular progress indicator
 */
export class CircularProgress extends Widget {
    build() {
        const size = this.props.size || 48;
        const strokeWidth = this.props.strokeWidth || 4;
        const value = Math.min(100, Math.max(0, this.props.value || 0));
        const color = this.props.color || '#6366f1';

        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (value / 100) * circumference;

        const container = document.createElement('div');
        container.className = 'yiph-circular-progress';
        container.style.cssText = `
            position: relative;
            width: ${size}px;
            height: ${size}px;
        `;

        container.innerHTML = `
            <svg width="${size}" height="${size}" style="transform: rotate(-90deg);">
                <circle
                    cx="${size / 2}"
                    cy="${size / 2}"
                    r="${radius}"
                    fill="none"
                    stroke="#334155"
                    stroke-width="${strokeWidth}"
                />
                <circle
                    cx="${size / 2}"
                    cy="${size / 2}"
                    r="${radius}"
                    fill="none"
                    stroke="${color}"
                    stroke-width="${strokeWidth}"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="${offset}"
                    stroke-linecap="round"
                    style="transition: stroke-dashoffset 0.3s ease;"
                />
            </svg>
        `;

        if (this.props.showValue) {
            const label = document.createElement('div');
            label.textContent = `${Math.round(value)}%`;
            label.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: ${size * 0.25}px;
                font-weight: 600;
                color: #f1f5f9;
            `;
            container.appendChild(label);
        }

        return container;
    }
}

// Export all display widgets
export const displayWidgets = {
    Avatar,
    Badge,
    ProgressBar,
    Spinner,
    Divider,
    Chip,
    Tooltip,
    CircularProgress
};

// Helper functions
export function avatar(props = {}) {
    return new Avatar(props);
}

export function badge(text, variant = 'default') {
    return new Badge({ text, variant });
}

export function progressBar(value, props = {}) {
    return new ProgressBar({ ...props, value });
}

export function spinner(props = {}) {
    return new Spinner(props);
}

export function divider(props = {}) {
    return new Divider(props);
}

export function chip(label, props = {}) {
    return new Chip({ ...props, label });
}

export function tooltip(text, child, props = {}) {
    return new Tooltip({ ...props, text, child });
}

export function circularProgress(value, props = {}) {
    return new CircularProgress({ ...props, value });
}
