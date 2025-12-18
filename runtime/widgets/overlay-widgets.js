/**
 * Yiphthachl Overlay Widgets
 * Widgets for modals, dialogs, and overlays
 */

import { Widget, StatefulWidget } from './base-widget.js';

/**
 * Dialog - A modal dialog
 */
export class Dialog extends StatefulWidget {
    initState() {
        return {
            isOpen: this.props.isOpen || false
        };
    }

    build() {
        const container = document.createElement('div');
        container.className = 'yiph-dialog-container';

        if (!this.state.isOpen) {
            container.style.display = 'none';
            return container;
        }

        // Backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.2s ease;
        `;

        if (this.props.dismissible !== false) {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    this.close();
                }
            });
        }

        // Dialog box
        const dialog = document.createElement('div');
        dialog.className = 'yiph-dialog';
        dialog.style.cssText = `
            width: ${this.props.width || 400}px;
            max-width: 90vw;
            max-height: 80vh;
            background: #1e293b;
            border-radius: 16px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.4);
            overflow: hidden;
            animation: slideIn 0.2s ease;
        `;

        // Title
        if (this.props.title) {
            const header = document.createElement('div');
            header.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px 20px;
                border-bottom: 1px solid #334155;
            `;

            const title = document.createElement('h3');
            title.textContent = this.props.title;
            title.style.cssText = `
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: #f1f5f9;
            `;

            header.appendChild(title);

            if (this.props.showClose !== false) {
                const closeBtn = document.createElement('button');
                closeBtn.innerHTML = '<span class="material-icons">close</span>';
                closeBtn.style.cssText = `
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    background: transparent;
                    border: none;
                    border-radius: 6px;
                    color: #9ca3af;
                    cursor: pointer;
                    transition: all 0.15s ease;
                `;
                closeBtn.addEventListener('mouseenter', () => {
                    closeBtn.style.background = '#334155';
                    closeBtn.style.color = '#f1f5f9';
                });
                closeBtn.addEventListener('mouseleave', () => {
                    closeBtn.style.background = 'transparent';
                    closeBtn.style.color = '#9ca3af';
                });
                closeBtn.addEventListener('click', () => this.close());
                header.appendChild(closeBtn);
            }

            dialog.appendChild(header);
        }

        // Content
        const content = document.createElement('div');
        content.style.cssText = `
            padding: 20px;
            overflow-y: auto;
            max-height: 60vh;
        `;

        if (this.props.content) {
            if (typeof this.props.content === 'string') {
                content.innerHTML = this.props.content;
                content.style.color = '#e2e8f0';
            } else {
                content.appendChild(this.props.content.mount());
            }
        }

        this.children.forEach(child => {
            content.appendChild(child.mount());
        });

        dialog.appendChild(content);

        // Actions
        if (this.props.actions && this.props.actions.length > 0) {
            const actions = document.createElement('div');
            actions.style.cssText = `
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                padding: 16px 20px;
                border-top: 1px solid #334155;
            `;

            this.props.actions.forEach(action => {
                const btn = document.createElement('button');
                btn.textContent = action.text || action.label;
                btn.style.cssText = `
                    padding: 10px 20px;
                    font-size: 14px;
                    font-weight: 500;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    ${action.primary
                        ? 'background: #6366f1; color: white; border: none;'
                        : 'background: transparent; color: #e2e8f0; border: 1px solid #475569;'}
                `;
                btn.addEventListener('click', () => {
                    if (action.onPressed || action.handler) {
                        (action.onPressed || action.handler)();
                    }
                    if (action.closeDialog !== false) {
                        this.close();
                    }
                });
                actions.appendChild(btn);
            });

            dialog.appendChild(actions);
        }

        backdrop.appendChild(dialog);
        container.appendChild(backdrop);

        return container;
    }

    open() {
        this.setState({ isOpen: true });
    }

    close() {
        this.setState({ isOpen: false });
        if (this.props.onClose) {
            this.props.onClose();
        }
    }
}

/**
 * BottomSheet - A bottom sliding panel
 */
export class BottomSheet extends StatefulWidget {
    initState() {
        return {
            isOpen: this.props.isOpen || false
        };
    }

    build() {
        const container = document.createElement('div');
        container.className = 'yiph-bottom-sheet-container';

        // Backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            opacity: ${this.state.isOpen ? 1 : 0};
            visibility: ${this.state.isOpen ? 'visible' : 'hidden'};
            transition: opacity 0.3s ease, visibility 0.3s ease;
            z-index: 1000;
        `;

        backdrop.addEventListener('click', () => {
            if (this.props.dismissible !== false) {
                this.close();
            }
        });

        // Sheet
        const sheet = document.createElement('div');
        sheet.className = 'yiph-bottom-sheet';
        sheet.style.cssText = `
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            background: #1e293b;
            border-radius: 24px 24px 0 0;
            max-height: ${this.props.maxHeight || 80}vh;
            transform: translateY(${this.state.isOpen ? 0 : 100}%);
            transition: transform 0.3s ease;
            z-index: 1001;
            overflow: hidden;
        `;

        // Handle
        const handle = document.createElement('div');
        handle.style.cssText = `
            display: flex;
            justify-content: center;
            padding: 12px;
        `;
        handle.innerHTML = `
            <div style="width: 40px; height: 4px; background: #475569; border-radius: 2px;"></div>
        `;
        sheet.appendChild(handle);

        // Content
        const content = document.createElement('div');
        content.style.cssText = `
            padding: 0 20px 24px;
            overflow-y: auto;
            max-height: calc(${this.props.maxHeight || 80}vh - 50px);
        `;

        if (this.props.title) {
            const title = document.createElement('h3');
            title.textContent = this.props.title;
            title.style.cssText = `
                margin: 0 0 16px;
                font-size: 18px;
                font-weight: 600;
                color: #f1f5f9;
            `;
            content.appendChild(title);
        }

        this.children.forEach(child => {
            content.appendChild(child.mount());
        });

        sheet.appendChild(content);

        container.appendChild(backdrop);
        container.appendChild(sheet);

        return container;
    }

    open() {
        this.setState({ isOpen: true });
    }

    close() {
        this.setState({ isOpen: false });
        if (this.props.onClose) {
            this.props.onClose();
        }
    }
}

/**
 * Snackbar - A temporary message at the bottom
 */
export class Snackbar extends Widget {
    build() {
        const colors = {
            default: { bg: '#334155', text: '#f1f5f9' },
            success: { bg: '#059669', text: '#ffffff' },
            error: { bg: '#dc2626', text: '#ffffff' },
            warning: { bg: '#d97706', text: '#ffffff' },
            info: { bg: '#0284c7', text: '#ffffff' }
        };

        const color = colors[this.props.variant] || colors.default;

        const snackbar = document.createElement('div');
        snackbar.className = 'yiph-snackbar';
        snackbar.style.cssText = `
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 20px;
            background: ${color.bg};
            color: ${color.text};
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            z-index: 2000;
            animation: slideUp 0.3s ease;
        `;

        // Icon
        if (this.props.icon) {
            const icon = document.createElement('span');
            icon.className = 'material-icons';
            icon.textContent = this.props.icon;
            icon.style.fontSize = '20px';
            snackbar.appendChild(icon);
        }

        // Message
        const message = document.createElement('span');
        message.textContent = this.props.message || '';
        message.style.fontSize = '14px';
        snackbar.appendChild(message);

        // Action
        if (this.props.action) {
            const action = document.createElement('button');
            action.textContent = this.props.action.text || 'UNDO';
            action.style.cssText = `
                margin-left: 8px;
                padding: 6px 12px;
                font-size: 13px;
                font-weight: 600;
                color: ${color.text};
                background: rgba(255,255,255,0.1);
                border: none;
                border-radius: 4px;
                cursor: pointer;
            `;
            action.addEventListener('click', () => {
                if (this.props.action.handler) {
                    this.props.action.handler();
                }
                this.dismiss();
            });
            snackbar.appendChild(action);
        }

        // Auto dismiss
        if (this.props.duration !== 0) {
            setTimeout(() => {
                this.dismiss();
            }, this.props.duration || 3000);
        }

        // Add animation keyframes
        if (!document.getElementById('yiph-snackbar-styles')) {
            const style = document.createElement('style');
            style.id = 'yiph-snackbar-styles';
            style.textContent = `
                @keyframes slideUp {
                    from {
                        transform: translateX(-50%) translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(-50%) translateY(0);
                        opacity: 1;
                    }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideIn {
                    from {
                        transform: scale(0.95) translateY(-20px);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1) translateY(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        this._element = snackbar;
        return snackbar;
    }

    dismiss() {
        if (this._element) {
            this._element.style.animation = 'slideUp 0.3s ease reverse';
            setTimeout(() => {
                if (this._element && this._element.parentNode) {
                    this._element.parentNode.removeChild(this._element);
                }
            }, 300);
        }
    }

    static show(message, options = {}) {
        const snackbar = new Snackbar({ message, ...options });
        document.body.appendChild(snackbar.build());
        return snackbar;
    }
}

/**
 * Modal - A full modal overlay
 */
export class Modal extends StatefulWidget {
    initState() {
        return {
            isOpen: this.props.isOpen || false
        };
    }

    build() {
        const container = document.createElement('div');
        container.className = 'yiph-modal-container';

        if (!this.state.isOpen) {
            container.style.display = 'none';
            return container;
        }

        // Backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.2s ease;
        `;

        if (this.props.dismissible !== false) {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    this.close();
                }
            });
        }

        // Content wrapper
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
            width: ${this.props.width || 'auto'};
            max-width: 90vw;
            max-height: 90vh;
            overflow: auto;
            animation: slideIn 0.2s ease;
        `;

        this.children.forEach(child => {
            wrapper.appendChild(child.mount());
        });

        backdrop.appendChild(wrapper);
        container.appendChild(backdrop);

        return container;
    }

    open() {
        this.setState({ isOpen: true });
    }

    close() {
        this.setState({ isOpen: false });
        if (this.props.onClose) {
            this.props.onClose();
        }
    }
}

// Export all overlay widgets
export const overlayWidgets = {
    Dialog,
    BottomSheet,
    Snackbar,
    Modal
};

// Helper functions
export function dialog(props = {}) {
    return new Dialog(props);
}

export function bottomSheet(props = {}, children = []) {
    const widget = new BottomSheet(props);
    children.forEach(child => widget.addChild(child));
    return widget;
}

export function snackbar(message, options = {}) {
    return Snackbar.show(message, options);
}

export function modal(props = {}, children = []) {
    const widget = new Modal(props);
    children.forEach(child => widget.addChild(child));
    return widget;
}
