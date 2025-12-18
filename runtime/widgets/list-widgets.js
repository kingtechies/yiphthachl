/**
 * Yiphthachl List Widgets
 * Widgets for displaying lists and grids of content
 */

import { Widget, StatefulWidget } from './base-widget.js';

/**
 * ListView - A scrollable list of items
 */
export class ListView extends Widget {
    build() {
        const container = document.createElement('div');
        container.className = 'yiph-listview';
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: ${this.props.gap || 8}px;
            overflow-y: auto;
            ${this.props.height ? `max-height: ${this.props.height}px;` : ''}
        `;

        if (this.props.items && this.props.builder) {
            this.props.items.forEach((item, index) => {
                const child = this.props.builder(item, index);
                if (child) {
                    container.appendChild(child.mount());
                }
            });
        } else {
            this.children.forEach(child => {
                container.appendChild(child.mount());
            });
        }

        return container;
    }
}

/**
 * GridView - A grid layout of items
 */
export class GridView extends Widget {
    build() {
        const columns = this.props.columns || 2;
        const gap = this.props.gap || 16;

        const container = document.createElement('div');
        container.className = 'yiph-gridview';
        container.style.cssText = `
            display: grid;
            grid-template-columns: repeat(${columns}, 1fr);
            gap: ${gap}px;
            ${this.props.height ? `max-height: ${this.props.height}px; overflow-y: auto;` : ''}
        `;

        if (this.props.items && this.props.builder) {
            this.props.items.forEach((item, index) => {
                const child = this.props.builder(item, index);
                if (child) {
                    container.appendChild(child.mount());
                }
            });
        } else {
            this.children.forEach(child => {
                container.appendChild(child.mount());
            });
        }

        return container;
    }
}

/**
 * ListTile - A single row in a list with leading, title, subtitle, and trailing
 */
export class ListTile extends Widget {
    build() {
        const tile = document.createElement('div');
        tile.className = 'yiph-list-tile';
        tile.style.cssText = `
            display: flex;
            align-items: center;
            gap: 16px;
            padding: ${this.props.dense ? '8px' : '12px'} 16px;
            background: ${this.props.selected ? '#334155' : 'transparent'};
            border-radius: 8px;
            cursor: ${this.props.onTap ? 'pointer' : 'default'};
            transition: background 0.15s ease;
        `;

        // Leading widget (icon, avatar, etc.)
        if (this.props.leading) {
            const leading = document.createElement('div');
            leading.style.flexShrink = '0';
            leading.appendChild(this.props.leading.mount());
            tile.appendChild(leading);
        }

        // Content (title and subtitle)
        const content = document.createElement('div');
        content.style.cssText = `
            flex: 1;
            min-width: 0;
        `;

        if (this.props.title) {
            const title = document.createElement('div');
            title.style.cssText = `
                font-size: 14px;
                font-weight: 500;
                color: #f1f5f9;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            `;
            title.textContent = this.props.title;
            content.appendChild(title);
        }

        if (this.props.subtitle) {
            const subtitle = document.createElement('div');
            subtitle.style.cssText = `
                font-size: 12px;
                color: #9ca3af;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                margin-top: 2px;
            `;
            subtitle.textContent = this.props.subtitle;
            content.appendChild(subtitle);
        }

        tile.appendChild(content);

        // Trailing widget
        if (this.props.trailing) {
            const trailing = document.createElement('div');
            trailing.style.flexShrink = '0';
            trailing.appendChild(this.props.trailing.mount());
            tile.appendChild(trailing);
        }

        // Hover and click handlers
        tile.addEventListener('mouseenter', () => {
            if (this.props.onTap) {
                tile.style.background = '#334155';
            }
        });
        tile.addEventListener('mouseleave', () => {
            tile.style.background = this.props.selected ? '#334155' : 'transparent';
        });

        if (this.props.onTap) {
            tile.addEventListener('click', this.props.onTap);
        }

        return tile;
    }
}

/**
 * ExpandableList - A list with collapsible sections
 */
export class ExpandableList extends StatefulWidget {
    initState() {
        return {
            expandedSections: new Set(this.props.initiallyExpanded || [])
        };
    }

    build() {
        const container = document.createElement('div');
        container.className = 'yiph-expandable-list';

        this.props.sections?.forEach((section, index) => {
            const sectionEl = document.createElement('div');
            sectionEl.className = 'yiph-expandable-section';

            const isExpanded = this.state.expandedSections.has(index);

            // Header
            const header = document.createElement('button');
            header.style.cssText = `
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 14px 16px;
                font-size: 14px;
                font-weight: 600;
                color: #f1f5f9;
                background: #1e293b;
                border: none;
                border-radius: ${isExpanded ? '8px 8px 0 0' : '8px'};
                cursor: pointer;
                transition: all 0.2s ease;
            `;

            const headerContent = document.createElement('div');
            headerContent.style.cssText = 'display: flex; align-items: center; gap: 12px;';

            if (section.icon) {
                const icon = document.createElement('span');
                icon.className = 'material-icons';
                icon.textContent = section.icon;
                icon.style.fontSize = '20px';
                headerContent.appendChild(icon);
            }

            const title = document.createElement('span');
            title.textContent = section.title || '';
            headerContent.appendChild(title);

            const arrow = document.createElement('span');
            arrow.className = 'material-icons';
            arrow.textContent = 'expand_more';
            arrow.style.cssText = `
                font-size: 20px;
                transform: rotate(${isExpanded ? 180 : 0}deg);
                transition: transform 0.2s ease;
            `;

            header.appendChild(headerContent);
            header.appendChild(arrow);
            sectionEl.appendChild(header);

            // Content
            const content = document.createElement('div');
            content.style.cssText = `
                display: ${isExpanded ? 'block' : 'none'};
                padding: 8px;
                background: #0f172a;
                border-radius: 0 0 8px 8px;
            `;

            section.items?.forEach(item => {
                if (typeof item === 'string') {
                    const itemEl = document.createElement('div');
                    itemEl.textContent = item;
                    itemEl.style.cssText = `
                        padding: 10px 16px;
                        color: #e2e8f0;
                        font-size: 14px;
                    `;
                    content.appendChild(itemEl);
                } else if (item.mount) {
                    content.appendChild(item.mount());
                }
            });

            sectionEl.appendChild(content);

            header.addEventListener('click', () => {
                const expanded = new Set(this.state.expandedSections);
                if (expanded.has(index)) {
                    expanded.delete(index);
                } else {
                    expanded.add(index);
                }
                this.setState({ expandedSections: expanded });
            });

            container.appendChild(sectionEl);

            // Add spacing between sections
            if (index < this.props.sections.length - 1) {
                const spacer = document.createElement('div');
                spacer.style.height = '8px';
                container.appendChild(spacer);
            }
        });

        return container;
    }
}

/**
 * Card - A styled card container
 */
export class Card extends Widget {
    build() {
        const card = document.createElement('div');
        card.className = 'yiph-card';

        const elevation = this.props.elevation || 1;
        const shadows = {
            0: 'none',
            1: '0 1px 3px rgba(0,0,0,0.2)',
            2: '0 4px 6px rgba(0,0,0,0.2)',
            3: '0 10px 20px rgba(0,0,0,0.2)',
            4: '0 15px 30px rgba(0,0,0,0.25)'
        };

        card.style.cssText = `
            padding: ${this.props.padding || 16}px;
            background: ${this.props.color || '#1e293b'};
            border-radius: ${this.props.borderRadius || 12}px;
            box-shadow: ${shadows[elevation] || shadows[1]};
            ${this.props.border ? `border: 1px solid ${this.props.borderColor || '#334155'};` : ''}
        `;

        this.children.forEach(child => {
            card.appendChild(child.mount());
        });

        if (this.props.onTap) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', this.props.onTap);
        }

        return card;
    }
}

// Export all list widgets
export const listWidgets = {
    ListView,
    GridView,
    ListTile,
    ExpandableList,
    Card
};

// Helper functions
export function listView(items, builder, props = {}) {
    return new ListView({ ...props, items, builder });
}

export function gridView(items, builder, props = {}) {
    return new GridView({ ...props, items, builder });
}

export function listTile(props = {}) {
    return new ListTile(props);
}

export function expandableList(sections, props = {}) {
    return new ExpandableList({ ...props, sections });
}

export function card(props = {}, children = []) {
    const widget = new Card(props);
    children.forEach(child => widget.addChild(child));
    return widget;
}
