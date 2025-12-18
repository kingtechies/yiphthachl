/**
 * Yiphthachl Syntax Highlighter
 * Provides syntax highlighting for the Yiphthachl language
 */

// Syntax patterns for highlighting
const patterns = {
    // Comments
    comment: {
        pattern: /#.*/g,
        className: 'syntax-comment'
    },

    // Strings
    string: {
        pattern: /"[^"]*"|'[^']*'/g,
        className: 'syntax-string'
    },

    // Numbers
    number: {
        pattern: /\b\d+(\.\d+)?\b/g,
        className: 'syntax-number'
    },

    // Keywords
    keyword: {
        pattern: /\b(create|set|let|make|define|remember|store|give|function|called|if|otherwise|else|end|when|while|for|each|repeat|times|in|to|as|with|that|the|an?|is|are|and|or|not|true|false|return|from|show|go|back|update|add|subtract|multiply|divide)\b/gi,
        className: 'syntax-keyword'
    },

    // Widget types
    widget: {
        pattern: /\b(app|screen|scaffold|column|row|center|container|text|button|image|icon|text field|checkbox|switch|slider|dropdown|list|grid|card|dialog|snackbar|modal|title bar|bottom navigation|drawer|tab bar)\b/gi,
        className: 'syntax-widget'
    },

    // Style properties
    property: {
        pattern: /\b(bold|italic|underline|size|width|height|color|background|padding|margin|rounded|shadow|align|center|left|right)\b/gi,
        className: 'syntax-property'
    },

    // Events
    event: {
        pattern: /\b(pressed|clicked|changed|submitted|hovered|focused|tapped)\b/gi,
        className: 'syntax-event'
    },

    // Colors
    color: {
        pattern: /\b(red|orange|yellow|green|blue|purple|pink|white|black|gray|grey|indigo|violet|cyan|teal|emerald|amber|rose|slate)\b/gi,
        className: 'syntax-color'
    }
};

/**
 * Highlight Yiphthachl source code
 */
export function highlight(code) {
    if (!code) return '';

    let highlighted = escapeHtml(code);

    // Apply patterns in order (strings and comments first to avoid conflicts)
    const orderedPatterns = [
        'comment',
        'string',
        'number',
        'widget',
        'property',
        'event',
        'color',
        'keyword'
    ];

    // Create placeholder tokens to avoid re-matching
    const tokens = [];
    let tokenIndex = 0;

    orderedPatterns.forEach(patternName => {
        const { pattern, className } = patterns[patternName];
        highlighted = highlighted.replace(pattern, (match) => {
            const token = `__TOKEN_${tokenIndex++}__`;
            tokens.push({
                token,
                replacement: `<span class="${className}">${match}</span>`
            });
            return token;
        });
    });

    // Replace tokens with actual spans
    tokens.forEach(({ token, replacement }) => {
        highlighted = highlighted.replace(token, replacement);
    });

    return highlighted;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Create a highlighted code element
 */
export function createHighlightedElement(code) {
    const pre = document.createElement('pre');
    pre.className = 'yiph-code';
    pre.innerHTML = highlight(code);
    return pre;
}

/**
 * Add syntax highlighting CSS
 */
export function injectHighlightStyles() {
    if (document.getElementById('yiph-syntax-styles')) return;

    const style = document.createElement('style');
    style.id = 'yiph-syntax-styles';
    style.textContent = `
        .yiph-code {
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
            font-size: 13px;
            line-height: 1.6;
            background: #0f172a;
            color: #e2e8f0;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
        }

        .syntax-comment {
            color: #64748b;
            font-style: italic;
        }

        .syntax-string {
            color: #a5d6a7;
        }

        .syntax-number {
            color: #ffcc80;
        }

        .syntax-keyword {
            color: #c792ea;
            font-weight: 500;
        }

        .syntax-widget {
            color: #82aaff;
        }

        .syntax-property {
            color: #f78c6c;
        }

        .syntax-event {
            color: #89ddff;
        }

        .syntax-color {
            color: #ffcb6b;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Real-time syntax highlighting for a textarea
 */
export class SyntaxHighlightedEditor {
    constructor(textarea, overlay) {
        this.textarea = textarea;
        this.overlay = overlay;
        this.debounceTimer = null;

        injectHighlightStyles();
        this.init();
    }

    init() {
        // Initial highlight
        this.updateHighlight();

        // Update on input
        this.textarea.addEventListener('input', () => {
            this.scheduleUpdate();
        });

        // Keep scroll in sync
        this.textarea.addEventListener('scroll', () => {
            this.overlay.scrollTop = this.textarea.scrollTop;
            this.overlay.scrollLeft = this.textarea.scrollLeft;
        });
    }

    scheduleUpdate() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
            this.updateHighlight();
        }, 50);
    }

    updateHighlight() {
        const code = this.textarea.value;
        this.overlay.innerHTML = highlight(code);
    }
}

export function createEditor(textarea, overlay) {
    return new SyntaxHighlightedEditor(textarea, overlay);
}
