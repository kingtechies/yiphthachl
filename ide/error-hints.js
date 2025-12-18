/**
 * Yiphthachl Error Hints
 * Friendly error messages and hints for developers
 */

// Error patterns and their friendly messages
const errorPatterns = [
    {
        pattern: /unexpected token/i,
        message: "There's something unexpected in your code",
        hint: "Check for missing quotes, parentheses, or typos."
    },
    {
        pattern: /undefined reference|not defined/i,
        message: "You're using something that doesn't exist yet",
        hint: "Make sure you've defined this variable or function before using it."
    },
    {
        pattern: /missing end/i,
        message: "You forgot to close something",
        hint: "Add 'end column', 'end row', 'end screen', or the appropriate end keyword."
    },
    {
        pattern: /expected string/i,
        message: "Text needs to be in quotes",
        hint: "Wrap your text in double quotes like \"Hello World\"."
    },
    {
        pattern: /invalid color/i,
        message: "That color name isn't recognized",
        hint: "Try colors like: red, blue, green, purple, indigo, or emerald."
    },
    {
        pattern: /unknown widget/i,
        message: "That widget type doesn't exist",
        hint: "Common widgets: text, button, image, column, row, card, scaffold."
    }
];

// Suggestion patterns for common mistakes
const suggestionPatterns = [
    {
        pattern: /creat /i,
        suggestion: "create",
        message: "Did you mean 'create'?"
    },
    {
        pattern: /colum /i,
        suggestion: "column",
        message: "Did you mean 'column'?"
    },
    {
        pattern: /buttton/i,
        suggestion: "button",
        message: "Did you mean 'button'?"
    },
    {
        pattern: /scafold/i,
        suggestion: "scaffold",
        message: "Did you mean 'scaffold'?"
    },
    {
        pattern: /backround/i,
        suggestion: "background",
        message: "Did you mean 'background'?"
    }
];

/**
 * Get a friendly error message
 */
export function getFriendlyError(error) {
    const errorString = error.message || String(error);

    for (const { pattern, message, hint } of errorPatterns) {
        if (pattern.test(errorString)) {
            return {
                message,
                hint,
                original: errorString,
                line: error.line || null
            };
        }
    }

    return {
        message: "Something went wrong",
        hint: "Check your code for typos or missing keywords.",
        original: errorString,
        line: error.line || null
    };
}

/**
 * Check for typos and suggest corrections
 */
export function checkForTypos(code) {
    const suggestions = [];

    for (const { pattern, suggestion, message } of suggestionPatterns) {
        const match = code.match(pattern);
        if (match) {
            const lines = code.substring(0, match.index).split('\n');
            suggestions.push({
                line: lines.length,
                column: lines[lines.length - 1].length + 1,
                original: match[0],
                suggestion,
                message
            });
        }
    }

    return suggestions;
}

/**
 * Validate Yiphthachl code structure
 */
export function validateStructure(code) {
    const issues = [];
    const lines = code.split('\n');

    // Track open blocks
    const openBlocks = [];
    const blockKeywords = {
        'screen': 'end screen',
        'scaffold': 'end scaffold',
        'column': 'end column',
        'row': 'end row',
        'center': 'end center',
        'body': 'end body',
        'card': 'end card',
        'if': 'end if',
        'for': 'end for',
        'while': 'end while',
        'repeat': 'end repeat',
        'function': 'end function',
        'when': 'end when',
        'bottom navigation': 'end bottom navigation'
    };

    lines.forEach((line, lineNumber) => {
        const trimmed = line.trim().toLowerCase();

        // Check for opening blocks
        for (const [keyword, endKeyword] of Object.entries(blockKeywords)) {
            if (trimmed.includes(keyword) && !trimmed.includes('end ')) {
                // Check if it's actually opening a block (has "with" or ends the statement)
                if (trimmed.includes(' with') || trimmed.endsWith(keyword)) {
                    openBlocks.push({ keyword, endKeyword, line: lineNumber + 1 });
                }
            }
        }

        // Check for closing blocks
        if (trimmed.startsWith('end ')) {
            if (openBlocks.length === 0) {
                issues.push({
                    type: 'error',
                    line: lineNumber + 1,
                    message: `Unexpected '${trimmed}'`,
                    hint: "There's no matching opening block for this 'end'."
                });
            } else {
                const lastBlock = openBlocks[openBlocks.length - 1];
                if (trimmed === lastBlock.endKeyword) {
                    openBlocks.pop();
                } else {
                    issues.push({
                        type: 'warning',
                        line: lineNumber + 1,
                        message: `Expected '${lastBlock.endKeyword}' but found '${trimmed}'`,
                        hint: `The '${lastBlock.keyword}' on line ${lastBlock.line} should be closed first.`
                    });
                }
            }
        }
    });

    // Check for unclosed blocks
    for (const block of openBlocks) {
        issues.push({
            type: 'error',
            line: block.line,
            message: `'${block.keyword}' was never closed`,
            hint: `Add '${block.endKeyword}' to close this block.`
        });
    }

    return issues;
}

/**
 * Create an error display element
 */
export function createErrorDisplay(error) {
    const friendly = getFriendlyError(error);

    const container = document.createElement('div');
    container.className = 'yiph-error-display';
    container.innerHTML = `
        <div class="yiph-error-icon">❌</div>
        <div class="yiph-error-content">
            <div class="yiph-error-message">${friendly.message}</div>
            <div class="yiph-error-hint">${friendly.hint}</div>
            ${friendly.line ? `<div class="yiph-error-location">Line ${friendly.line}</div>` : ''}
        </div>
    `;

    return container;
}

/**
 * Create a hint tooltip
 */
export function createHintTooltip(hint, position) {
    const tooltip = document.createElement('div');
    tooltip.className = 'yiph-hint-tooltip';
    tooltip.textContent = hint;
    tooltip.style.cssText = `
        position: absolute;
        left: ${position.left}px;
        top: ${position.top}px;
        padding: 8px 12px;
        background: #1e293b;
        color: #f1f5f9;
        border: 1px solid #475569;
        border-radius: 6px;
        font-size: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1000;
    `;

    return tooltip;
}

/**
 * Inject error display styles
 */
export function injectErrorStyles() {
    if (document.getElementById('yiph-error-styles')) return;

    const style = document.createElement('style');
    style.id = 'yiph-error-styles';
    style.textContent = `
        .yiph-error-display {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 12px 16px;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid #ef4444;
            border-radius: 8px;
            margin: 8px 0;
        }
        .yiph-error-icon {
            font-size: 20px;
        }
        .yiph-error-message {
            color: #fca5a5;
            font-weight: 600;
            margin-bottom: 4px;
        }
        .yiph-error-hint {
            color: #9ca3af;
            font-size: 13px;
        }
        .yiph-error-location {
            color: #64748b;
            font-size: 11px;
            margin-top: 4px;
        }
        
        .yiph-warning-display {
            background: rgba(245, 158, 11, 0.1);
            border-color: #f59e0b;
        }
        .yiph-warning-display .yiph-error-message {
            color: #fcd34d;
        }
    `;
    document.head.appendChild(style);
}

export { errorPatterns, suggestionPatterns };
