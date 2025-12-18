/**
 * Yiphthachl Navigation Widgets
 * Widgets for navigation and app structure
 */

import { Widget, StatefulWidget } from './base-widget.js';

/**
 * AppBar - Top app bar with title and actions
 */
export class AppBar extends Widget {
    build() {
        const height = this.props.height || 56;
        const bgColor = this.props.backgroundColor || 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';

        const appBar = document.createElement('header');
        appBar.className = 'yiph-appbar';
        appBar.style.cssText = `
            display: flex;
            align-items: center;
            height: ${height}px;
            padding: 0 16px;
            background: ${bgColor};
            color: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            position: sticky;
            top: 0;
            z-index: 100;
        `;

        // Leading widget (usually back button or menu)
        if (this.props.leading) {
            const leading = document.createElement('div');
            leading.style.marginRight = '16px';
            leading.appendChild(this.props.leading.mount());
            appBar.appendChild(leading);
        }

        // Title
        if (this.props.title) {
            const title = document.createElement('h1');
            title.style.cssText = `
                flex: 1;
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                letter-spacing: -0.02em;
            `;

            if (typeof this.props.title === 'string') {
                title.textContent = this.props.title;
            } else {
                title.appendChild(this.props.title.mount());
            }

            appBar.appendChild(title);
        }

        // Actions
        if (this.props.actions && this.props.actions.length > 0) {
            const actions = document.createElement('div');
            actions.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
            `;

            this.props.actions.forEach(action => {
                actions.appendChild(action.mount());
            });

            appBar.appendChild(actions);
        }

        return appBar;
    }
}

/**
 * BottomNavigation - Bottom navigation bar
 */
export class BottomNavigation extends StatefulWidget {
    initState() {
        return {
            selectedIndex: this.props.selectedIndex || 0
        };
    }

    build() {
        const nav = document.createElement('nav');
        nav.className = 'yiph-bottom-nav';
        nav.style.cssText = `
            display: flex;
            justify-content: space-around;
            align-items: center;
            height: 64px;
            background: #1e293b;
            border-top: 1px solid #334155;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 100;
        `;

        this.props.items?.forEach((item, index) => {
            const isSelected = index === this.state.selectedIndex;

            const button = document.createElement('button');
            button.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                padding: 8px 16px;
                background: transparent;
                border: none;
                color: ${isSelected ? '#6366f1' : '#9ca3af'};
                cursor: pointer;
                transition: color 0.2s ease;
                min-width: 64px;
            `;

            const icon = document.createElement('span');
            icon.className = 'material-icons';
            icon.textContent = item.icon || 'circle';
            icon.style.fontSize = '24px';

            const label = document.createElement('span');
            label.textContent = item.label || '';
            label.style.cssText = `
                font-size: 11px;
                font-weight: ${isSelected ? '600' : '500'};
            `;

            button.appendChild(icon);
            button.appendChild(label);

            button.addEventListener('click', () => {
                this.setState({ selectedIndex: index });
                if (this.props.onSelect) {
                    this.props.onSelect(index);
                }
                if (item.onTap) {
                    item.onTap();
                }
            });

            nav.appendChild(button);
        });

        return nav;
    }
}

/**
 * TabBar - A horizontal tab navigation
 */
export class TabBar extends StatefulWidget {
    initState() {
        return {
            selectedIndex: this.props.selectedIndex || 0
        };
    }

    build() {
        const container = document.createElement('div');
        container.className = 'yiph-tabbar';
        container.style.cssText = `
            display: flex;
            background: #1e293b;
            border-bottom: 1px solid #334155;
            overflow-x: auto;
        `;

        this.props.tabs?.forEach((tab, index) => {
            const isSelected = index === this.state.selectedIndex;

            const tabButton = document.createElement('button');
            tabButton.style.cssText = `
                flex: ${this.props.stretch ? 1 : 'none'};
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 14px 20px;
                font-size: 14px;
                font-weight: ${isSelected ? '600' : '500'};
                color: ${isSelected ? '#6366f1' : '#9ca3af'};
                background: transparent;
                border: none;
                border-bottom: 2px solid ${isSelected ? '#6366f1' : 'transparent'};
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;
            `;

            if (tab.icon) {
                const icon = document.createElement('span');
                icon.className = 'material-icons';
                icon.textContent = tab.icon;
                icon.style.fontSize = '18px';
                tabButton.appendChild(icon);
            }

            const label = document.createElement('span');
            label.textContent = tab.label || '';
            tabButton.appendChild(label);

            tabButton.addEventListener('click', () => {
                this.setState({ selectedIndex: index });
                if (this.props.onSelect) {
                    this.props.onSelect(index);
                }
            });

            container.appendChild(tabButton);
        });

        return container;
    }
}

/**
 * Drawer - A slide-out navigation drawer
 */
export class Drawer extends StatefulWidget {
    initState() {
        return {
            isOpen: this.props.isOpen || false
        };
    }

    build() {
        const container = document.createElement('div');
        container.className = 'yiph-drawer-container';

        // Backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            opacity: ${this.state.isOpen ? 1 : 0};
            visibility: ${this.state.isOpen ? 'visible' : 'hidden'};
            transition: opacity 0.3s ease, visibility 0.3s ease;
            z-index: 200;
        `;
        backdrop.addEventListener('click', () => {
            this.close();
        });

        // Drawer
        const drawer = document.createElement('div');
        drawer.className = 'yiph-drawer';
        drawer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: ${this.props.width || 280}px;
            height: 100%;
            background: #1e293b;
            transform: translateX(${this.state.isOpen ? 0 : -100}%);
            transition: transform 0.3s ease;
            z-index: 201;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
        `;

        // Header
        if (this.props.header) {
            const header = document.createElement('div');
            header.style.cssText = `
                padding: 24px 16px;
                background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            `;
            header.appendChild(this.props.header.mount());
            drawer.appendChild(header);
        }

        // Items
        if (this.props.items) {
            const list = document.createElement('div');
            list.style.padding = '8px';

            this.props.items.forEach(item => {
                const menuItem = document.createElement('button');
                menuItem.style.cssText = `
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 12px 16px;
                    font-size: 14px;
                    color: #e2e8f0;
                    background: transparent;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    text-align: left;
                    transition: background 0.15s ease;
                `;

                if (item.icon) {
                    const icon = document.createElement('span');
                    icon.className = 'material-icons';
                    icon.textContent = item.icon;
                    menuItem.appendChild(icon);
                }

                const label = document.createElement('span');
                label.textContent = item.label || '';
                menuItem.appendChild(label);

                menuItem.addEventListener('mouseenter', () => {
                    menuItem.style.background = '#334155';
                });
                menuItem.addEventListener('mouseleave', () => {
                    menuItem.style.background = 'transparent';
                });
                menuItem.addEventListener('click', () => {
                    if (item.onTap) item.onTap();
                    this.close();
                });

                list.appendChild(menuItem);
            });

            drawer.appendChild(list);
        }

        container.appendChild(backdrop);
        container.appendChild(drawer);

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
 * Breadcrumbs - Navigation breadcrumbs
 */
export class Breadcrumbs extends Widget {
    build() {
        const container = document.createElement('nav');
        container.className = 'yiph-breadcrumbs';
        container.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
        `;

        this.props.items?.forEach((item, index) => {
            const isLast = index === this.props.items.length - 1;

            const crumb = document.createElement(isLast ? 'span' : 'a');
            crumb.textContent = item.label || '';
            crumb.style.cssText = `
                color: ${isLast ? '#f1f5f9' : '#6366f1'};
                text-decoration: none;
                cursor: ${isLast ? 'default' : 'pointer'};
            `;

            if (!isLast && item.onTap) {
                crumb.addEventListener('click', item.onTap);
            }

            container.appendChild(crumb);

            if (!isLast) {
                const separator = document.createElement('span');
                separator.className = 'material-icons';
                separator.textContent = 'chevron_right';
                separator.style.cssText = `
                    font-size: 18px;
                    color: #64748b;
                `;
                container.appendChild(separator);
            }
        });

        return container;
    }
}

// Export all navigation widgets
export const navigationWidgets = {
    AppBar,
    BottomNavigation,
    TabBar,
    Drawer,
    Breadcrumbs
};

// Helper functions
export function appBar(title, props = {}) {
    return new AppBar({ ...props, title });
}

export function bottomNavigation(items, props = {}) {
    return new BottomNavigation({ ...props, items });
}

export function tabBar(tabs, props = {}) {
    return new TabBar({ ...props, tabs });
}

export function drawer(items, props = {}) {
    return new Drawer({ ...props, items });
}

export function breadcrumbs(items, props = {}) {
    return new Breadcrumbs({ ...props, items });
}
