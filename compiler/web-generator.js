/**
 * Yiphthachl Web Code Generator
 * Generates HTML, CSS, and JavaScript from the AST
 */

import * as AST from './ast-nodes.js';

export class WebGenerator {
    constructor() {
        this.html = [];
        this.css = [];
        this.js = [];
        this.stateVariables = new Map();
        this.componentId = 0;
        this.indentLevel = 0;
    }

    generate(ast) {
        if (ast.type !== 'Program') {
            throw new Error('Expected Program node');
        }

        // Initialize base styles
        this.generateBaseStyles();

        // Process all statements
        for (const stmt of ast.statements) {
            this.generateStatement(stmt);
        }

        return this.buildOutput();
    }

    generateStatement(node) {
        if (!node) return '';

        switch (node.type) {
            case 'AppDeclaration':
                return this.generateApp(node);
            case 'Screen':
                return this.generateScreen(node);
            case 'VariableDeclaration':
                return this.generateVariableDeclaration(node);
            case 'Assignment':
                return this.generateAssignment(node);
            case 'IfStatement':
                return this.generateIfStatement(node);
            case 'ForLoop':
                return this.generateForLoop(node);
            case 'WhileLoop':
                return this.generateWhileLoop(node);
            case 'RepeatLoop':
                return this.generateRepeatLoop(node);
            case 'FunctionDeclaration':
                return this.generateFunctionDeclaration(node);
            case 'FunctionCall':
                return this.generateFunctionCall(node);
            case 'EventHandler':
                return this.generateEventHandler(node);
            case 'ShowMessage':
                return `alert(${this.generateExpression(node.message)});`;
            case 'Navigate':
                return `navigateTo('${node.screenName}');`;
            case 'GoBack':
                return 'goBack();';
            default:
                // Try as widget
                if (this.isWidgetNode(node)) {
                    return this.generateWidget(node);
                }
                return '';
        }
    }

    isWidgetNode(node) {
        const widgetTypes = [
            'Scaffold', 'AppBar', 'Column', 'Row', 'Center', 'Container',
            'Text', 'Button', 'Image', 'Icon', 'TextField', 'ListView',
            'GridView', 'Card', 'BottomNavigation', 'Widget', 'Spacer'
        ];
        return widgetTypes.includes(node.type);
    }

    // ==================== APP & SCREENS ====================

    generateApp(node) {
        const appId = this.nextId('app');

        // Add app container
        this.html.push(`<div id="${appId}" class="yiph-app">`);

        // Generate screens
        for (const screen of node.screens) {
            this.generateScreen(screen);
        }

        // Generate any body content from config
        if (node.config?.body) {
            for (const stmt of node.config.body) {
                const result = this.generateStatement(stmt);
                if (result && typeof result === 'string' && result.startsWith('<')) {
                    this.html.push(result);
                }
            }
        }

        this.html.push('</div>');

        // Initialize app in JS
        this.js.push(`
// Initialize app: ${node.name}
document.addEventListener('DOMContentLoaded', function() {
    console.log('${node.name} initialized');
    initializeApp();
});
`);

        return appId;
    }

    generateScreen(node) {
        const screenId = this.nextId('screen');
        const className = node.isMain ? 'yiph-screen yiph-screen-active' : 'yiph-screen';

        this.html.push(`<div id="${screenId}" class="${className}" data-screen="${node.name}">`);

        for (const child of node.body) {
            const result = this.generateStatement(child);
            if (result && typeof result === 'string' && result.startsWith('<')) {
                this.html.push(result);
            }
        }

        this.html.push('</div>');

        return screenId;
    }

    // ==================== WIDGETS ====================

    generateWidget(node) {
        switch (node.type) {
            case 'Scaffold':
                return this.generateScaffold(node);
            case 'AppBar':
                return this.generateAppBar(node);
            case 'Column':
                return this.generateColumn(node);
            case 'Row':
                return this.generateRow(node);
            case 'Center':
                return this.generateCenter(node);
            case 'Container':
                return this.generateContainer(node);
            case 'Text':
                return this.generateText(node);
            case 'Button':
                return this.generateButton(node);
            case 'Image':
                return this.generateImage(node);
            case 'Icon':
                return this.generateIcon(node);
            case 'TextField':
                return this.generateTextField(node);
            case 'ListView':
                return this.generateListView(node);
            case 'Card':
                return this.generateCard(node);
            case 'BottomNavigation':
                return this.generateBottomNav(node);
            case 'Spacer':
                return this.generateSpacer(node);
            case 'Widget':
                return this.generateGenericWidget(node);
            default:
                return '';
        }
    }

    generateScaffold(node) {
        const scaffoldId = this.nextId('scaffold');
        let html = `<div id="${scaffoldId}" class="yiph-scaffold">`;

        // App bar
        if (node.appBar) {
            html += this.generateAppBar(node.appBar);
        }

        // Body
        html += '<div class="yiph-scaffold-body">';
        if (node.body) {
            const bodyHtml = this.generateWidget(node.body);
            html += bodyHtml;
        }
        html += '</div>';

        // Bottom navigation
        if (node.bottomNav) {
            html += this.generateBottomNav(node.bottomNav);
        }

        html += '</div>';
        this.html.push(html);
        return html;
    }

    generateAppBar(node) {
        const appBarId = this.nextId('appbar');
        const styles = this.generateStyles(node.styles);

        let titleHtml = '';
        if (node.title) {
            if (node.title.type === 'Text') {
                titleHtml = `<span class="yiph-appbar-title">${this.generateExpression(node.title.content)}</span>`;
            } else {
                titleHtml = `<span class="yiph-appbar-title">${this.generateExpression(node.title)}</span>`;
            }
        }

        return `<header id="${appBarId}" class="yiph-appbar" style="${styles}">${titleHtml}</header>`;
    }

    generateColumn(node) {
        const colId = this.nextId('column');
        const styles = this.generateStyles(node.styles);

        let html = `<div id="${colId}" class="yiph-column" style="${styles}">`;

        for (const child of node.children) {
            if (this.isWidgetNode(child)) {
                html += this.generateWidget(child);
            } else {
                const stmt = this.generateStatement(child);
                if (typeof stmt === 'string' && stmt.startsWith('<')) {
                    html += stmt;
                }
            }
        }

        html += '</div>';
        return html;
    }

    generateRow(node) {
        const rowId = this.nextId('row');
        const styles = this.generateStyles(node.styles);

        let html = `<div id="${rowId}" class="yiph-row" style="${styles}">`;

        for (const child of node.children) {
            if (this.isWidgetNode(child)) {
                html += this.generateWidget(child);
            } else {
                const stmt = this.generateStatement(child);
                if (typeof stmt === 'string' && stmt.startsWith('<')) {
                    html += stmt;
                }
            }
        }

        html += '</div>';
        return html;
    }

    generateCenter(node) {
        const centerId = this.nextId('center');
        const styles = this.generateStyles(node.styles);

        let childHtml = '';
        if (node.child) {
            if (this.isWidgetNode(node.child)) {
                childHtml = this.generateWidget(node.child);
            }
        }

        return `<div id="${centerId}" class="yiph-center" style="${styles}">${childHtml}</div>`;
    }

    generateContainer(node) {
        const containerId = this.nextId('container');
        const styles = this.generateStyles(node.styles);

        let html = `<div id="${containerId}" class="yiph-container" style="${styles}">`;

        for (const child of node.children) {
            if (this.isWidgetNode(child)) {
                html += this.generateWidget(child);
            }
        }

        html += '</div>';
        return html;
    }

    generateText(node) {
        const textId = this.nextId('text');
        const styles = this.generateTextStyles(node.styles);
        const content = this.generateExpression(node.content);

        return `<span id="${textId}" class="yiph-text" style="${styles}">${content}</span>`;
    }

    generateButton(node) {
        const buttonId = this.nextId('button');
        const styles = this.generateButtonStyles(node.styles);
        const label = this.generateExpression(node.label);

        let onclick = '';
        if (node.onPressed) {
            if (node.onPressed.type === 'ShowMessage') {
                onclick = `onclick="alert(${this.generateExpression(node.onPressed.message)})"`;
            } else if (node.onPressed.type === 'Navigate') {
                onclick = `onclick="navigateTo('${node.onPressed.screenName}')"`;
            } else if (node.onPressed.type === 'EventHandler') {
                const actions = node.onPressed.actions.map(a => this.generateStatement(a)).join(';');
                onclick = `onclick="${actions}"`;
            }
        }

        return `<button id="${buttonId}" class="yiph-button" style="${styles}" ${onclick}>${label}</button>`;
    }

    generateImage(node) {
        const imageId = this.nextId('image');
        const styles = this.generateStyles(node.styles);
        const src = this.generateExpression(node.source);

        return `<img id="${imageId}" class="yiph-image" style="${styles}" src="${src}" alt="${node.alt}" />`;
    }

    generateIcon(node) {
        const iconId = this.nextId('icon');
        // Using Material Icons or custom icon font
        return `<span id="${iconId}" class="yiph-icon material-icons" style="font-size: ${node.size}px; color: ${node.color || 'inherit'};">${node.name}</span>`;
    }

    generateTextField(node) {
        const fieldId = this.nextId('textfield');
        const styles = this.generateStyles(node.styles);

        return `<input id="${fieldId}" class="yiph-textfield" style="${styles}" type="text" placeholder="${node.placeholder}" />`;
    }

    generateListView(node) {
        const listId = this.nextId('listview');
        const styles = this.generateStyles(node.styles);

        let html = `<div id="${listId}" class="yiph-listview" style="${styles}">`;

        for (const item of node.items) {
            if (this.isWidgetNode(item)) {
                html += `<div class="yiph-listview-item">${this.generateWidget(item)}</div>`;
            }
        }

        html += '</div>';
        return html;
    }

    generateCard(node) {
        const cardId = this.nextId('card');
        const styles = this.generateStyles(node.styles);

        let html = `<div id="${cardId}" class="yiph-card" style="${styles}">`;

        for (const child of node.children) {
            if (this.isWidgetNode(child)) {
                html += this.generateWidget(child);
            }
        }

        html += '</div>';
        return html;
    }

    generateBottomNav(node) {
        const navId = this.nextId('bottomnav');

        let html = `<nav id="${navId}" class="yiph-bottom-nav">`;

        for (let i = 0; i < node.items.length; i++) {
            const item = node.items[i];
            const activeClass = i === node.selectedIndex ? 'active' : '';
            html += `
                <button class="yiph-bottom-nav-item ${activeClass}" onclick="selectNavItem(${i})">
                    <span class="material-icons">${item.icon}</span>
                    <span class="yiph-bottom-nav-label">${item.label}</span>
                </button>
            `;
        }

        html += '</nav>';
        return html;
    }

    generateSpacer(node) {
        return `<div class="yiph-spacer" style="height: ${node.size}px;"></div>`;
    }

    generateGenericWidget(node) {
        const widgetId = this.nextId(node.widgetType);
        const styles = this.generateStyles(node.styles);

        let html = `<div id="${widgetId}" class="yiph-widget yiph-${node.widgetType}" style="${styles}">`;

        for (const child of node.children) {
            if (this.isWidgetNode(child)) {
                html += this.generateWidget(child);
            }
        }

        html += '</div>';
        return html;
    }

    // ==================== VARIABLES ====================

    generateVariableDeclaration(node) {
        const varName = node.name;
        const value = this.generateExpression(node.value);

        if (node.isState) {
            // Reactive state
            this.stateVariables.set(varName, value);
            this.js.push(`
let _state_${varName} = ${value};
function get_${varName}() { return _state_${varName}; }
function set_${varName}(newValue) {
    _state_${varName} = newValue;
    updateUI();
}
`);
        } else {
            this.js.push(`let ${varName} = ${value};`);
        }

        return '';
    }

    generateAssignment(node) {
        const target = this.generateExpression(node.target);
        const value = this.generateExpression(node.value);

        if (this.stateVariables.has(node.target.name)) {
            return `set_${node.target.name}(${value});`;
        }

        return `${target} = ${value};`;
    }

    // ==================== EXPRESSIONS ====================

    generateExpression(node) {
        if (!node) return '""';

        switch (node.type) {
            case 'StringLiteral':
                return `"${node.value.replace(/"/g, '\\"')}"`;
            case 'NumberLiteral':
                return String(node.value);
            case 'BooleanLiteral':
                return String(node.value);
            case 'ColorLiteral':
                return `"${node.value}"`;
            case 'ArrayLiteral':
                return `[${node.elements.map(e => this.generateExpression(e)).join(', ')}]`;
            case 'ObjectLiteral':
                const props = Object.entries(node.properties)
                    .map(([k, v]) => `${k}: ${this.generateExpression(v)}`)
                    .join(', ');
                return `{ ${props} }`;
            case 'VariableReference':
                if (this.stateVariables.has(node.name)) {
                    return `get_${node.name}()`;
                }
                return node.name;
            case 'BinaryExpression':
                return this.generateBinaryExpression(node);
            case 'UnaryExpression':
                return this.generateUnaryExpression(node);
            case 'LogicalExpression':
                return this.generateLogicalExpression(node);
            case 'ComparisonExpression':
                return this.generateComparisonExpression(node);
            case 'FunctionCall':
                return this.generateFunctionCall(node);
            default:
                return '""';
        }
    }

    generateBinaryExpression(node) {
        const left = this.generateExpression(node.left);
        const right = this.generateExpression(node.right);
        const op = this.getBinaryOperator(node.operator);
        return `(${left} ${op} ${right})`;
    }

    generateUnaryExpression(node) {
        const operand = this.generateExpression(node.operand);
        const op = node.operator === 'not' ? '!' : node.operator;
        return `${op}${operand}`;
    }

    generateLogicalExpression(node) {
        const left = this.generateExpression(node.left);
        const right = this.generateExpression(node.right);
        const op = node.operator === 'and' ? '&&' : '||';
        return `(${left} ${op} ${right})`;
    }

    generateComparisonExpression(node) {
        const left = this.generateExpression(node.left);
        const right = this.generateExpression(node.right);
        const op = this.getComparisonOperator(node.operator);
        return `(${left} ${op} ${right})`;
    }

    getBinaryOperator(op) {
        const ops = {
            'add': '+',
            'subtract': '-',
            'multiply': '*',
            'divide': '/',
            'modulo': '%',
            '+': '+',
            '-': '-',
            '*': '*',
            '/': '/',
            '%': '%'
        };
        return ops[op] || op;
    }

    getComparisonOperator(op) {
        const ops = {
            'equals': '===',
            'notEquals': '!==',
            'greaterThan': '>',
            'lessThan': '<',
            'greaterOrEqual': '>=',
            'lessOrEqual': '<='
        };
        return ops[op] || op;
    }

    // ==================== CONTROL FLOW ====================

    generateIfStatement(node) {
        const condition = this.generateExpression(node.condition);
        let code = `if (${condition}) {\n`;

        for (const stmt of node.consequent) {
            code += '  ' + this.generateStatement(stmt) + '\n';
        }

        code += '}';

        if (node.alternate) {
            if (Array.isArray(node.alternate)) {
                code += ' else {\n';
                for (const stmt of node.alternate) {
                    code += '  ' + this.generateStatement(stmt) + '\n';
                }
                code += '}';
            } else {
                code += ' else ' + this.generateIfStatement(node.alternate);
            }
        }

        this.js.push(code);
        return code;
    }

    generateForLoop(node) {
        const iterator = node.iteratorName;
        const iterable = this.generateExpression(node.iterable);

        let code = `for (const ${iterator} of ${iterable}) {\n`;

        for (const stmt of node.body) {
            code += '  ' + this.generateStatement(stmt) + '\n';
        }

        code += '}';
        this.js.push(code);
        return code;
    }

    generateWhileLoop(node) {
        const condition = this.generateExpression(node.condition);

        let code = `while (${condition}) {\n`;

        for (const stmt of node.body) {
            code += '  ' + this.generateStatement(stmt) + '\n';
        }

        code += '}';
        this.js.push(code);
        return code;
    }

    generateRepeatLoop(node) {
        const count = this.generateExpression(node.count);

        let code = `for (let i = 0; i < ${count}; i++) {\n`;

        for (const stmt of node.body) {
            code += '  ' + this.generateStatement(stmt) + '\n';
        }

        code += '}';
        this.js.push(code);
        return code;
    }

    // ==================== FUNCTIONS ====================

    generateFunctionDeclaration(node) {
        const params = node.parameters.join(', ');

        let code = `function ${node.name}(${params}) {\n`;

        for (const stmt of node.body) {
            const stmtCode = this.generateStatement(stmt);
            if (stmtCode) {
                code += '  ' + stmtCode + '\n';
            }
        }

        code += '}';
        this.js.push(code);
        return code;
    }

    generateFunctionCall(node) {
        const args = node.arguments.map(a => this.generateExpression(a)).join(', ');
        return `${node.name}(${args})`;
    }

    // ==================== EVENT HANDLERS ====================

    generateEventHandler(node) {
        const handlerId = this.nextId('handler');
        const actions = node.actions.map(a => this.generateStatement(a)).join(';\n  ');

        this.js.push(`
function ${handlerId}() {
  ${actions}
}
`);

        return handlerId;
    }

    // ==================== STYLES ====================

    generateStyles(styles) {
        if (!styles || Object.keys(styles).length === 0) return '';

        const cssProps = [];

        for (const [prop, value] of Object.entries(styles)) {
            const cssProp = this.toCssProp(prop);
            const cssValue = this.toCssValue(prop, value);
            if (cssProp && cssValue) {
                cssProps.push(`${cssProp}: ${cssValue}`);
            }
        }

        return cssProps.join('; ');
    }

    generateTextStyles(styles) {
        const cssProps = [];

        if (styles.bold) {
            cssProps.push('font-weight: bold');
        }
        if (styles.italic) {
            cssProps.push('font-style: italic');
        }
        if (styles.underline) {
            cssProps.push('text-decoration: underline');
        }
        if (styles.fontSize) {
            cssProps.push(`font-size: ${styles.fontSize}px`);
        }
        if (styles.color) {
            cssProps.push(`color: ${styles.color}`);
        }

        return cssProps.join('; ');
    }

    generateButtonStyles(styles) {
        const cssProps = [];

        if (styles.background) {
            cssProps.push(`background-color: ${styles.background}`);
        }
        if (styles.color) {
            cssProps.push(`color: ${styles.color}`);
        }
        if (styles.rounded) {
            cssProps.push(`border-radius: ${styles.rounded}px`);
        }
        if (styles.width) {
            cssProps.push(`width: ${styles.width}px`);
        }
        if (styles.height) {
            cssProps.push(`height: ${styles.height}px`);
        }

        return cssProps.join('; ');
    }

    toCssProp(prop) {
        const map = {
            'width': 'width',
            'height': 'height',
            'color': 'color',
            'background': 'background-color',
            'padding': 'padding',
            'margin': 'margin',
            'fontSize': 'font-size',
            'rounded': 'border-radius',
            'border': 'border',
            'shadow': 'box-shadow'
        };
        return map[prop] || prop;
    }

    toCssValue(prop, value) {
        if (value === null || value === undefined) return null;

        // Numeric values that need units
        const needsPixels = ['width', 'height', 'padding', 'margin', 'fontSize', 'rounded'];
        if (needsPixels.includes(prop) && typeof value === 'number') {
            return `${value}px`;
        }

        return String(value);
    }

    // ==================== BASE STYLES ====================

    generateBaseStyles() {
        this.css.push(`
/* Yiphthachl Base Styles */
:root {
    --yiph-primary: #6366f1;
    --yiph-primary-light: #818cf8;
    --yiph-primary-dark: #4f46e5;
    --yiph-background: #0f172a;
    --yiph-surface: #1e293b;
    --yiph-surface-light: #334155;
    --yiph-text: #f1f5f9;
    --yiph-text-secondary: #94a3b8;
    --yiph-border: #475569;
    --yiph-success: #22c55e;
    --yiph-warning: #f59e0b;
    --yiph-error: #ef4444;
    --yiph-shadow: 0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -2px rgba(0,0,0,0.2);
    --yiph-transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--yiph-background);
    color: var(--yiph-text);
    min-height: 100vh;
}

.yiph-app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.yiph-screen {
    display: none;
    flex-direction: column;
    min-height: 100vh;
}

.yiph-screen-active {
    display: flex;
}

.yiph-scaffold {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--yiph-background);
}

.yiph-scaffold-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
}

.yiph-appbar {
    display: flex;
    align-items: center;
    height: 56px;
    padding: 0 16px;
    background: linear-gradient(135deg, var(--yiph-primary) 0%, var(--yiph-primary-dark) 100%);
    color: white;
    box-shadow: var(--yiph-shadow);
    position: sticky;
    top: 0;
    z-index: 100;
}

.yiph-appbar-title {
    font-size: 20px;
    font-weight: 600;
    letter-spacing: -0.02em;
}

.yiph-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.yiph-row {
    display: flex;
    flex-direction: row;
    gap: 12px;
    align-items: center;
}

.yiph-center {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
}

.yiph-container {
    padding: 16px;
    border-radius: 12px;
    background: var(--yiph-surface);
}

.yiph-text {
    line-height: 1.5;
}

.yiph-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 600;
    border: none;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--yiph-primary) 0%, var(--yiph-primary-light) 100%);
    color: white;
    cursor: pointer;
    transition: var(--yiph-transition);
    box-shadow: 0 2px 4px rgba(99, 102, 241, 0.3);
}

.yiph-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.yiph-button:active {
    transform: translateY(0);
}

.yiph-image {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    object-fit: cover;
}

.yiph-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.yiph-textfield {
    width: 100%;
    padding: 12px 16px;
    font-size: 16px;
    border: 2px solid var(--yiph-border);
    border-radius: 8px;
    background: var(--yiph-surface);
    color: var(--yiph-text);
    transition: var(--yiph-transition);
}

.yiph-textfield:focus {
    outline: none;
    border-color: var(--yiph-primary);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.yiph-listview {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.yiph-listview-item {
    padding: 12px;
    background: var(--yiph-surface);
    border-radius: 8px;
    transition: var(--yiph-transition);
}

.yiph-listview-item:hover {
    background: var(--yiph-surface-light);
}

.yiph-card {
    padding: 16px;
    background: var(--yiph-surface);
    border-radius: 12px;
    box-shadow: var(--yiph-shadow);
}

.yiph-bottom-nav {
    display: flex;
    justify-content: space-around;
    align-items: center;
    height: 64px;
    background: var(--yiph-surface);
    border-top: 1px solid var(--yiph-border);
    position: sticky;
    bottom: 0;
}

.yiph-bottom-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 16px;
    border: none;
    background: transparent;
    color: var(--yiph-text-secondary);
    cursor: pointer;
    transition: var(--yiph-transition);
}

.yiph-bottom-nav-item:hover,
.yiph-bottom-nav-item.active {
    color: var(--yiph-primary);
}

.yiph-bottom-nav-label {
    font-size: 12px;
    font-weight: 500;
}

.yiph-spacer {
    flex-shrink: 0;
}

/* Animations */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideIn {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

.yiph-animate-fade-in {
    animation: fadeIn 0.3s ease-out;
}

.yiph-animate-slide-in {
    animation: slideIn 0.3s ease-out;
}
`);
    }

    // ==================== OUTPUT ====================

    buildOutput() {
        // Generate runtime JS
        const runtimeJs = `
// Yiphthachl Runtime
let currentScreen = 'main';

function initializeApp() {
    // Show first screen
    const screens = document.querySelectorAll('.yiph-screen');
    if (screens.length > 0) {
        screens[0].classList.add('yiph-screen-active');
    }
}

function navigateTo(screenName) {
    document.querySelectorAll('.yiph-screen').forEach(s => {
        s.classList.remove('yiph-screen-active');
    });
    
    const targetScreen = document.querySelector(\`[data-screen="\${screenName}"]\`);
    if (targetScreen) {
        targetScreen.classList.add('yiph-screen-active');
        currentScreen = screenName;
    }
}

function goBack() {
    window.history.back();
}

function selectNavItem(index) {
    document.querySelectorAll('.yiph-bottom-nav-item').forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
}

function updateUI() {
    // Re-render reactive elements
    console.log('UI Updated');
}

${this.js.join('\n')}
`;

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Yiphthachl App</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <style>
${this.css.join('\n')}
    </style>
</head>
<body>
${this.html.join('\n')}
    <script>
${runtimeJs}
    </script>
</body>
</html>`;

        return {
            html,
            css: this.css.join('\n'),
            js: runtimeJs
        };
    }

    // ==================== UTILITIES ====================

    nextId(prefix = 'el') {
        return `${prefix}_${++this.componentId}`;
    }
}

/**
 * Generate HTML/CSS/JS from an AST
 * @param {object} ast - The AST to generate code from
 * @returns {{ html: string, css: string, js: string }}
 */
export function generate(ast) {
    const generator = new WebGenerator();
    return generator.generate(ast);
}
