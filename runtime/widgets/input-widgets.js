/**
 * Yiphthachl Input Widgets
 * Extended input widgets for forms and user interaction
 */

import { Widget, StatefulWidget } from './base-widget.js';

/**
 * Checkbox - A toggleable checkbox
 */
export class Checkbox extends StatefulWidget {
    initState() {
        return {
            checked: this.props.checked || false
        };
    }

    build() {
        const size = this.props.size || 20;

        const container = document.createElement('label');
        container.className = 'yiph-checkbox';
        container.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            user-select: none;
        `;

        const checkbox = document.createElement('div');
        checkbox.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            border: 2px solid ${this.state.checked ? '#6366f1' : '#475569'};
            border-radius: 4px;
            background: ${this.state.checked ? '#6366f1' : 'transparent'};
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        `;

        if (this.state.checked) {
            checkbox.innerHTML = `<span class="material-icons" style="color: white; font-size: ${size - 4}px;">check</span>`;
        }

        container.appendChild(checkbox);

        if (this.props.label) {
            const label = document.createElement('span');
            label.textContent = this.props.label;
            label.style.color = '#f1f5f9';
            container.appendChild(label);
        }

        container.addEventListener('click', () => {
            this.setState({ checked: !this.state.checked });
            if (this.props.onChange) {
                this.props.onChange(this.state.checked);
            }
        });

        return container;
    }
}

/**
 * Switch - A toggle switch
 */
export class Switch extends StatefulWidget {
    initState() {
        return {
            on: this.props.value || false
        };
    }

    build() {
        const width = this.props.width || 48;
        const height = this.props.height || 24;
        const thumbSize = height - 4;

        const container = document.createElement('div');
        container.className = 'yiph-switch';
        container.style.cssText = `
            width: ${width}px;
            height: ${height}px;
            border-radius: ${height / 2}px;
            background: ${this.state.on ? '#6366f1' : '#475569'};
            cursor: pointer;
            transition: background 0.2s ease;
            position: relative;
        `;

        const thumb = document.createElement('div');
        thumb.style.cssText = `
            width: ${thumbSize}px;
            height: ${thumbSize}px;
            border-radius: 50%;
            background: white;
            position: absolute;
            top: 2px;
            left: ${this.state.on ? width - thumbSize - 2 : 2}px;
            transition: left 0.2s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;

        container.appendChild(thumb);

        container.addEventListener('click', () => {
            this.setState({ on: !this.state.on });
            if (this.props.onChange) {
                this.props.onChange(this.state.on);
            }
        });

        return container;
    }
}

/**
 * Slider - A range slider
 */
export class Slider extends StatefulWidget {
    initState() {
        return {
            value: this.props.value || 50
        };
    }

    build() {
        const min = this.props.min || 0;
        const max = this.props.max || 100;
        const step = this.props.step || 1;

        const container = document.createElement('div');
        container.className = 'yiph-slider';
        container.style.cssText = `
            width: 100%;
            padding: 8px 0;
        `;

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = this.state.value;
        slider.style.cssText = `
            width: 100%;
            height: 4px;
            border-radius: 2px;
            background: linear-gradient(to right, #6366f1 0%, #6366f1 ${((this.state.value - min) / (max - min)) * 100}%, #475569 ${((this.state.value - min) / (max - min)) * 100}%, #475569 100%);
            appearance: none;
            outline: none;
            cursor: pointer;
        `;

        slider.addEventListener('input', (e) => {
            this.setState({ value: parseFloat(e.target.value) });
            if (this.props.onChange) {
                this.props.onChange(this.state.value);
            }
        });

        container.appendChild(slider);

        if (this.props.showValue) {
            const valueLabel = document.createElement('span');
            valueLabel.textContent = this.state.value;
            valueLabel.style.cssText = `
                display: block;
                text-align: center;
                color: #9ca3af;
                font-size: 12px;
                margin-top: 4px;
            `;
            container.appendChild(valueLabel);
        }

        return container;
    }
}

/**
 * Dropdown - A select dropdown
 */
export class Dropdown extends StatefulWidget {
    initState() {
        return {
            value: this.props.value || '',
            isOpen: false
        };
    }

    build() {
        const container = document.createElement('div');
        container.className = 'yiph-dropdown';
        container.style.cssText = `
            position: relative;
            width: ${this.props.width || '100%'};
        `;

        const button = document.createElement('button');
        button.className = 'yiph-dropdown-button';
        button.style.cssText = `
            width: 100%;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 14px;
            color: ${this.state.value ? '#f1f5f9' : '#9ca3af'};
            background: #1e293b;
            border: 2px solid #475569;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
        `;

        const selectedOption = this.props.options?.find(o => o.value === this.state.value);
        button.innerHTML = `
            <span>${selectedOption?.label || this.props.placeholder || 'Select...'}</span>
            <span class="material-icons" style="font-size: 18px;">expand_more</span>
        `;

        button.addEventListener('click', () => {
            this.setState({ isOpen: !this.state.isOpen });
        });

        container.appendChild(button);

        if (this.state.isOpen && this.props.options) {
            const dropdown = document.createElement('div');
            dropdown.className = 'yiph-dropdown-menu';
            dropdown.style.cssText = `
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                margin-top: 4px;
                background: #1e293b;
                border: 1px solid #475569;
                border-radius: 8px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.3);
                z-index: 100;
                max-height: 200px;
                overflow-y: auto;
            `;

            this.props.options.forEach(option => {
                const item = document.createElement('div');
                item.style.cssText = `
                    padding: 10px 16px;
                    color: ${option.value === this.state.value ? '#6366f1' : '#f1f5f9'};
                    cursor: pointer;
                    transition: background 0.15s ease;
                `;
                item.textContent = option.label;

                item.addEventListener('mouseenter', () => {
                    item.style.background = '#334155';
                });
                item.addEventListener('mouseleave', () => {
                    item.style.background = 'transparent';
                });
                item.addEventListener('click', () => {
                    this.setState({ value: option.value, isOpen: false });
                    if (this.props.onChange) {
                        this.props.onChange(option.value);
                    }
                });

                dropdown.appendChild(item);
            });

            container.appendChild(dropdown);
        }

        return container;
    }
}

/**
 * RadioButton - A radio button group
 */
export class RadioGroup extends StatefulWidget {
    initState() {
        return {
            selected: this.props.value || null
        };
    }

    build() {
        const container = document.createElement('div');
        container.className = 'yiph-radio-group';
        container.style.cssText = `
            display: flex;
            flex-direction: ${this.props.horizontal ? 'row' : 'column'};
            gap: 12px;
        `;

        this.props.options?.forEach(option => {
            const radio = document.createElement('label');
            radio.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                color: #f1f5f9;
            `;

            const circle = document.createElement('div');
            const isSelected = this.state.selected === option.value;
            circle.style.cssText = `
                width: 20px;
                height: 20px;
                border: 2px solid ${isSelected ? '#6366f1' : '#475569'};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            `;

            if (isSelected) {
                const dot = document.createElement('div');
                dot.style.cssText = `
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: #6366f1;
                `;
                circle.appendChild(dot);
            }

            const label = document.createElement('span');
            label.textContent = option.label;

            radio.appendChild(circle);
            radio.appendChild(label);

            radio.addEventListener('click', () => {
                this.setState({ selected: option.value });
                if (this.props.onChange) {
                    this.props.onChange(option.value);
                }
            });

            container.appendChild(radio);
        });

        return container;
    }
}

/**
 * TextArea - Multi-line text input
 */
export class TextArea extends StatefulWidget {
    initState() {
        return {
            value: this.props.value || '',
            isFocused: false
        };
    }

    build() {
        const textarea = document.createElement('textarea');
        textarea.className = 'yiph-textarea';
        textarea.placeholder = this.props.placeholder || '';
        textarea.value = this.state.value;
        textarea.rows = this.props.rows || 4;

        textarea.style.cssText = `
            width: 100%;
            padding: 12px 16px;
            font-size: 14px;
            font-family: inherit;
            line-height: 1.5;
            color: #f1f5f9;
            background: #1e293b;
            border: 2px solid ${this.state.isFocused ? '#6366f1' : '#475569'};
            border-radius: 8px;
            outline: none;
            resize: ${this.props.resize || 'vertical'};
            transition: border-color 0.2s ease;
        `;

        textarea.addEventListener('input', (e) => {
            this.setState({ value: e.target.value });
            if (this.props.onChange) {
                this.props.onChange(e.target.value);
            }
        });

        textarea.addEventListener('focus', () => {
            this.setState({ isFocused: true });
        });

        textarea.addEventListener('blur', () => {
            this.setState({ isFocused: false });
        });

        return textarea;
    }
}

// Export all input widgets
export const inputWidgets = {
    Checkbox,
    Switch,
    Slider,
    Dropdown,
    RadioGroup,
    TextArea
};

// Helper functions
export function checkbox(props = {}) {
    return new Checkbox(props);
}

export function toggleSwitch(props = {}) {
    return new Switch(props);
}

export function slider(props = {}) {
    return new Slider(props);
}

export function dropdown(options, props = {}) {
    return new Dropdown({ ...props, options });
}

export function radioGroup(options, props = {}) {
    return new RadioGroup({ ...props, options });
}

export function textArea(props = {}) {
    return new TextArea(props);
}
