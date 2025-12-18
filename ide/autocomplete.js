/**
 * Yiphthachl Autocomplete
 * Intelligent code completion for the IDE
 */

// Autocomplete suggestions organized by context
const suggestions = {
    // Top-level commands
    root: [
        { text: 'create an app called', type: 'keyword', description: 'Create a new app' },
        { text: 'on the main screen', type: 'keyword', description: 'Define the main screen' },
        { text: 'define screen called', type: 'keyword', description: 'Define a new screen' },
        { text: 'set', type: 'keyword', description: 'Create a variable' },
        { text: 'remember', type: 'keyword', description: 'Create a reactive state variable' },
        { text: 'give function called', type: 'keyword', description: 'Define a function' },
        { text: '# ', type: 'comment', description: 'Add a comment' }
    ],

    // Screen/scaffold content
    screen: [
        { text: 'use a scaffold with', type: 'widget', description: 'Use a scaffold layout' },
        { text: 'a title bar that says', type: 'widget', description: 'Add a title bar' },
        { text: 'in the body', type: 'keyword', description: 'Define the body content' },
        { text: 'a bottom navigation with', type: 'widget', description: 'Add bottom navigation' }
    ],

    // Layout widgets
    layout: [
        { text: 'put a column with', type: 'widget', description: 'Vertical layout' },
        { text: 'put a row with', type: 'widget', description: 'Horizontal layout' },
        { text: 'in the center', type: 'widget', description: 'Center content' },
        { text: 'a container with', type: 'widget', description: 'Container wrapper' },
        { text: 'add some space of', type: 'widget', description: 'Add spacing' }
    ],

    // Content widgets
    widgets: [
        { text: 'a text that says', type: 'widget', description: 'Display text' },
        { text: 'a button that says', type: 'widget', description: 'Add a button' },
        { text: 'an image from', type: 'widget', description: 'Display an image' },
        { text: 'an icon of', type: 'widget', description: 'Display an icon' },
        { text: 'a text field', type: 'widget', description: 'Text input field' },
        { text: 'a checkbox', type: 'widget', description: 'Checkbox input' },
        { text: 'a switch', type: 'widget', description: 'Toggle switch' },
        { text: 'a slider', type: 'widget', description: 'Slider control' },
        { text: 'a card with', type: 'widget', description: 'Card container' },
        { text: 'show a list of items from', type: 'widget', description: 'Display a list' }
    ],

    // Style modifiers
    styles: [
        { text: 'make it bold', type: 'style', description: 'Bold text' },
        { text: 'make it italic', type: 'style', description: 'Italic text' },
        { text: 'make the size', type: 'style', description: 'Set font size' },
        { text: 'make the width', type: 'style', description: 'Set width' },
        { text: 'make the height', type: 'style', description: 'Set height' },
        { text: 'make the background', type: 'style', description: 'Set background color' },
        { text: 'color it', type: 'style', description: 'Set text color' },
        { text: 'round the corners by', type: 'style', description: 'Border radius' },
        { text: 'add some padding of', type: 'style', description: 'Add padding' },
        { text: 'align center', type: 'style', description: 'Center align' },
        { text: 'align left', type: 'style', description: 'Left align' },
        { text: 'align right', type: 'style', description: 'Right align' }
    ],

    // Events
    events: [
        { text: 'when pressed', type: 'event', description: 'On button press' },
        { text: 'when clicked', type: 'event', description: 'On click' },
        { text: 'when changed', type: 'event', description: 'On value change' },
        { text: 'when submitted', type: 'event', description: 'On form submit' }
    ],

    // Actions
    actions: [
        { text: 'show message', type: 'action', description: 'Show alert message' },
        { text: 'go to', type: 'action', description: 'Navigate to screen' },
        { text: 'go back', type: 'action', description: 'Go to previous screen' },
        { text: 'update the screen', type: 'action', description: 'Refresh the UI' },
        { text: 'add', type: 'action', description: 'Add to a value' },
        { text: 'subtract', type: 'action', description: 'Subtract from a value' },
        { text: 'set', type: 'action', description: 'Set a variable' }
    ],

    // Control flow
    control: [
        { text: 'if', type: 'keyword', description: 'Conditional statement' },
        { text: 'otherwise if', type: 'keyword', description: 'Else if' },
        { text: 'otherwise', type: 'keyword', description: 'Else clause' },
        { text: 'end if', type: 'keyword', description: 'End conditional' },
        { text: 'for each', type: 'keyword', description: 'Loop through items' },
        { text: 'repeat', type: 'keyword', description: 'Repeat N times' },
        { text: 'while', type: 'keyword', description: 'While loop' },
        { text: 'end repeat', type: 'keyword', description: 'End loop' },
        { text: 'end for', type: 'keyword', description: 'End for loop' }
    ],

    // End blocks
    ends: [
        { text: 'end column', type: 'keyword', description: 'Close column' },
        { text: 'end row', type: 'keyword', description: 'Close row' },
        { text: 'end center', type: 'keyword', description: 'Close center' },
        { text: 'end card', type: 'keyword', description: 'Close card' },
        { text: 'end scaffold', type: 'keyword', description: 'Close scaffold' },
        { text: 'end screen', type: 'keyword', description: 'Close screen' },
        { text: 'end body', type: 'keyword', description: 'Close body' },
        { text: 'end when', type: 'keyword', description: 'Close event handler' },
        { text: 'end function', type: 'keyword', description: 'Close function' },
        { text: 'end bottom navigation', type: 'keyword', description: 'Close bottom nav' }
    ],

    // Colors
    colors: [
        { text: 'red', type: 'color', description: '#EF4444' },
        { text: 'orange', type: 'color', description: '#F97316' },
        { text: 'yellow', type: 'color', description: '#EAB308' },
        { text: 'green', type: 'color', description: '#22C55E' },
        { text: 'blue', type: 'color', description: '#3B82F6' },
        { text: 'indigo', type: 'color', description: '#6366F1' },
        { text: 'purple', type: 'color', description: '#A855F7' },
        { text: 'pink', type: 'color', description: '#EC4899' },
        { text: 'white', type: 'color', description: '#FFFFFF' },
        { text: 'black', type: 'color', description: '#000000' },
        { text: 'gray', type: 'color', description: '#6B7280' },
        { text: 'emerald', type: 'color', description: '#10B981' },
        { text: 'teal', type: 'color', description: '#14B8A6' },
        { text: 'cyan', type: 'color', description: '#06B6D4' },
        { text: 'rose', type: 'color', description: '#F43F5E' }
    ],

    // Icons (Material Icons)
    icons: [
        { text: 'home', type: 'icon' },
        { text: 'search', type: 'icon' },
        { text: 'person', type: 'icon' },
        { text: 'settings', type: 'icon' },
        { text: 'favorite', type: 'icon' },
        { text: 'star', type: 'icon' },
        { text: 'check', type: 'icon' },
        { text: 'close', type: 'icon' },
        { text: 'add', type: 'icon' },
        { text: 'remove', type: 'icon' },
        { text: 'menu', type: 'icon' },
        { text: 'arrow_back', type: 'icon' },
        { text: 'arrow_forward', type: 'icon' },
        { text: 'email', type: 'icon' },
        { text: 'phone', type: 'icon' },
        { text: 'location_on', type: 'icon' },
        { text: 'calendar_today', type: 'icon' },
        { text: 'notifications', type: 'icon' }
    ]
};

/**
 * Autocomplete engine
 */
export class Autocomplete {
    constructor(textarea, container) {
        this.textarea = textarea;
        this.container = container;
        this.popup = null;
        this.selectedIndex = 0;
        this.currentSuggestions = [];
        this.isOpen = false;

        this.init();
    }

    init() {
        // Create popup element
        this.popup = document.createElement('div');
        this.popup.className = 'yiph-autocomplete-popup';
        this.popup.style.cssText = `
            position: absolute;
            display: none;
            background: #1e293b;
            border: 1px solid #475569;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            max-height: 250px;
            overflow-y: auto;
            z-index: 1000;
            min-width: 300px;
        `;
        this.container.appendChild(this.popup);

        // Listen for input
        this.textarea.addEventListener('input', () => this.onInput());
        this.textarea.addEventListener('keydown', (e) => this.onKeydown(e));
        this.textarea.addEventListener('blur', () => {
            setTimeout(() => this.hide(), 150);
        });
    }

    onInput() {
        const { word, context } = this.getContext();

        if (!word || word.length < 1) {
            this.hide();
            return;
        }

        const filtered = this.getSuggestions(word, context);

        if (filtered.length > 0) {
            this.show(filtered);
        } else {
            this.hide();
        }
    }

    onKeydown(e) {
        if (!this.isOpen) {
            // Trigger autocomplete on Ctrl+Space
            if (e.ctrlKey && e.key === ' ') {
                e.preventDefault();
                this.onInput();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectNext();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.selectPrevious();
                break;
            case 'Enter':
            case 'Tab':
                e.preventDefault();
                this.insertSelected();
                break;
            case 'Escape':
                this.hide();
                break;
        }
    }

    getContext() {
        const cursorPos = this.textarea.selectionStart;
        const text = this.textarea.value;
        const textBeforeCursor = text.substring(0, cursorPos);

        // Get current line
        const lines = textBeforeCursor.split('\n');
        const currentLine = lines[lines.length - 1];

        // Get current word
        const words = currentLine.split(/\s+/);
        const currentWord = words[words.length - 1] || '';

        // Determine context based on text
        let context = 'root';
        const lowerText = textBeforeCursor.toLowerCase();

        if (lowerText.includes('color it') || lowerText.includes('make the background')) {
            context = 'colors';
        } else if (lowerText.includes('icon of')) {
            context = 'icons';
        } else if (lowerText.includes('when pressed') || lowerText.includes('when clicked')) {
            context = 'actions';
        } else if (lowerText.includes('in the body') || lowerText.includes('column with') || lowerText.includes('row with')) {
            context = 'widgets';
        } else if (lowerText.includes('scaffold with')) {
            context = 'screen';
        } else if (currentLine.trim().startsWith('make') || currentWord.startsWith('make')) {
            context = 'styles';
        } else if (currentWord.startsWith('end')) {
            context = 'ends';
        }

        return { word: currentWord.toLowerCase(), context };
    }

    getSuggestions(query, context) {
        // Combine relevant suggestion categories
        let candidates = [];

        // Always include context-specific suggestions
        if (suggestions[context]) {
            candidates = [...candidates, ...suggestions[context]];
        }

        // Add common suggestions based on context
        if (context === 'widgets') {
            candidates = [...candidates, ...suggestions.layout, ...suggestions.styles];
        } else if (context === 'actions') {
            candidates = [...candidates, ...suggestions.control];
        }

        // Add ends if we're deep in nesting
        candidates = [...candidates, ...suggestions.ends];

        // Filter by query
        return candidates.filter(s =>
            s.text.toLowerCase().includes(query)
        ).slice(0, 10);
    }

    show(items) {
        this.currentSuggestions = items;
        this.selectedIndex = 0;
        this.isOpen = true;

        this.popup.innerHTML = items.map((item, index) => `
            <div class="yiph-autocomplete-item ${index === 0 ? 'selected' : ''}" data-index="${index}">
                <span class="yiph-autocomplete-text">${item.text}</span>
                ${item.description ? `<span class="yiph-autocomplete-desc">${item.description}</span>` : ''}
            </div>
        `).join('');

        // Position popup
        const coords = this.getCaretCoordinates();
        this.popup.style.left = `${coords.left}px`;
        this.popup.style.top = `${coords.top + 20}px`;
        this.popup.style.display = 'block';

        // Add click handlers
        this.popup.querySelectorAll('.yiph-autocomplete-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this.selectedIndex = index;
                this.insertSelected();
            });
        });
    }

    hide() {
        this.isOpen = false;
        this.popup.style.display = 'none';
    }

    selectNext() {
        if (this.selectedIndex < this.currentSuggestions.length - 1) {
            this.selectedIndex++;
            this.updateSelection();
        }
    }

    selectPrevious() {
        if (this.selectedIndex > 0) {
            this.selectedIndex--;
            this.updateSelection();
        }
    }

    updateSelection() {
        this.popup.querySelectorAll('.yiph-autocomplete-item').forEach((item, index) => {
            item.classList.toggle('selected', index === this.selectedIndex);
        });
    }

    insertSelected() {
        const suggestion = this.currentSuggestions[this.selectedIndex];
        if (!suggestion) return;

        const cursorPos = this.textarea.selectionStart;
        const text = this.textarea.value;

        // Find the start of the current word
        let wordStart = cursorPos;
        while (wordStart > 0 && !/\s/.test(text[wordStart - 1])) {
            wordStart--;
        }

        // Replace current word with suggestion
        const before = text.substring(0, wordStart);
        const after = text.substring(cursorPos);

        this.textarea.value = before + suggestion.text + ' ' + after;

        // Move cursor to end of inserted text
        const newPos = wordStart + suggestion.text.length + 1;
        this.textarea.selectionStart = this.textarea.selectionEnd = newPos;

        // Trigger input event
        this.textarea.dispatchEvent(new Event('input'));

        this.hide();
    }

    getCaretCoordinates() {
        // Simple approximation - in a real implementation you'd use a library
        const rect = this.textarea.getBoundingClientRect();
        const style = getComputedStyle(this.textarea);
        const lineHeight = parseInt(style.lineHeight);

        const text = this.textarea.value.substring(0, this.textarea.selectionStart);
        const lines = text.split('\n');
        const currentLineNumber = lines.length;
        const currentColumn = lines[lines.length - 1].length;

        return {
            left: rect.left + currentColumn * 8 + parseInt(style.paddingLeft),
            top: rect.top + currentLineNumber * lineHeight + parseInt(style.paddingTop) - this.textarea.scrollTop
        };
    }
}

/**
 * Add autocomplete styles
 */
export function injectAutocompleteStyles() {
    if (document.getElementById('yiph-autocomplete-styles')) return;

    const style = document.createElement('style');
    style.id = 'yiph-autocomplete-styles';
    style.textContent = `
        .yiph-autocomplete-popup::-webkit-scrollbar {
            width: 6px;
        }
        .yiph-autocomplete-popup::-webkit-scrollbar-thumb {
            background: #475569;
            border-radius: 3px;
        }
        .yiph-autocomplete-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            cursor: pointer;
            transition: background 0.1s ease;
        }
        .yiph-autocomplete-item:hover,
        .yiph-autocomplete-item.selected {
            background: #334155;
        }
        .yiph-autocomplete-text {
            color: #f1f5f9;
            font-family: 'JetBrains Mono', monospace;
            font-size: 13px;
        }
        .yiph-autocomplete-desc {
            color: #64748b;
            font-size: 11px;
            margin-left: 12px;
        }
    `;
    document.head.appendChild(style);
}

export function createAutocomplete(textarea, container) {
    injectAutocompleteStyles();
    return new Autocomplete(textarea, container);
}
