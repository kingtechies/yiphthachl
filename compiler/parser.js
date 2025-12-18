/**
 * Yiphthachl Parser
 * Converts tokens from the lexer into an Abstract Syntax Tree (AST)
 */

import { TokenType } from './tokenizer.js';
import * as AST from './ast-nodes.js';

export class ParseError extends Error {
    constructor(message, token) {
        super(message);
        this.name = 'ParseError';
        this.token = token;
        this.line = token?.line;
        this.column = token?.column;
    }
}

export class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.current = 0;
        this.errors = [];
    }

    parse() {
        const statements = [];

        try {
            while (!this.isAtEnd()) {
                const stmt = this.parseStatement();
                if (stmt) {
                    statements.push(stmt);
                }
            }
        } catch (error) {
            this.errors.push(error);
        }

        return {
            ast: new AST.ProgramNode(statements),
            errors: this.errors
        };
    }

    parseStatement() {
        this.skipNewlines();
        if (this.isAtEnd()) return null;

        const token = this.peek();

        // Skip comments
        if (token.type === TokenType.COMMENT) {
            const comment = this.advance();
            return new AST.CommentNode(comment.value);
        }

        // App declaration
        if (token.type === TokenType.WIDGET_TYPE && token.value === 'app') {
            return this.parseAppDeclaration();
        }

        // Screen definition
        if (token.type === TokenType.WIDGET_TYPE && token.value === 'screen') {
            return this.parseScreen();
        }

        // Variable declaration
        if (token.type === TokenType.VARIABLE_DECL) {
            return this.parseVariableDeclaration();
        }

        // Function declaration
        if (token.type === TokenType.FUNCTION_DECL) {
            return this.parseFunctionDeclaration();
        }

        // Conditionals
        if (token.type === TokenType.CONDITIONAL) {
            return this.parseIfStatement();
        }

        // Loops
        if (token.type === TokenType.LOOP) {
            return this.parseLoop();
        }

        // Event handlers
        if (token.type === TokenType.EVENT_TYPE) {
            return this.parseEventHandler();
        }

        // Widget creation (generic)
        if (token.type === TokenType.WIDGET_TYPE) {
            return this.parseWidget();
        }

        // Identifier could be function call or assignment
        if (token.type === TokenType.IDENTIFIER) {
            return this.parseIdentifierStatement();
        }

        // Math operations
        if (token.type === TokenType.OPERATOR) {
            return this.parseMathOperation();
        }

        // Skip unknown tokens
        this.advance();
        return null;
    }

    // ==================== APP & SCREENS ====================

    parseAppDeclaration() {
        this.advance(); // consume 'app' keyword

        // Look for app name
        let appName = 'My App';
        if (this.check(TokenType.STRING)) {
            appName = this.advance().value;
        } else if (this.check(TokenType.IDENTIFIER)) {
            // Collect identifier words
            const words = [];
            while (this.check(TokenType.IDENTIFIER)) {
                words.push(this.advance().value);
            }
            appName = words.join(' ');
        }

        this.skipNewlines();

        const screens = [];
        const config = {};

        // Parse app body
        if (this.check(TokenType.INDENT)) {
            this.advance(); // consume INDENT

            while (!this.check(TokenType.DEDENT) && !this.isAtEnd()) {
                const stmt = this.parseStatement();
                if (stmt) {
                    if (stmt.type === 'Screen') {
                        screens.push(stmt);
                    } else {
                        // Store other configs
                        config.body = config.body || [];
                        config.body.push(stmt);
                    }
                }
            }

            if (this.check(TokenType.DEDENT)) {
                this.advance();
            }
        }

        return new AST.AppDeclarationNode(appName, screens, config);
    }

    parseScreen() {
        this.advance(); // consume 'screen' keyword

        let screenName = 'main';
        let isMain = false;

        // Check for screen name or "main screen"
        const raw = this.previous().raw || '';
        if (raw.includes('main')) {
            isMain = true;
            screenName = 'main';
        }

        if (this.check(TokenType.STRING)) {
            screenName = this.advance().value;
        } else if (this.check(TokenType.IDENTIFIER)) {
            const words = [];
            while (this.check(TokenType.IDENTIFIER) && !this.peekIs('with', 'using')) {
                words.push(this.advance().value);
            }
            if (words.length > 0) {
                screenName = words.join(' ');
            }
        }

        this.skipNewlines();

        const body = [];

        // Parse screen body
        if (this.check(TokenType.INDENT)) {
            this.advance();

            while (!this.check(TokenType.DEDENT) && !this.isAtEnd()) {
                const stmt = this.parseStatement();
                if (stmt) {
                    body.push(stmt);
                }
            }

            if (this.check(TokenType.DEDENT)) {
                this.advance();
            }
        }

        return new AST.ScreenNode(screenName, body, isMain);
    }

    // ==================== VARIABLES ====================

    parseVariableDeclaration() {
        const declToken = this.advance();
        const isState = declToken.value === 'remember' || declToken.value === 'store';

        // Get variable name
        let varName = '';
        const nameWords = [];

        while (this.check(TokenType.IDENTIFIER) && !this.isAssignmentKeyword()) {
            nameWords.push(this.advance().value);
        }
        varName = nameWords.join(' ').toLowerCase().replace(/\s+/g, '_');

        // Skip "to", "as", "equals", etc.
        if (this.check(TokenType.ASSIGNMENT)) {
            this.advance();
        }

        // Parse the value
        const value = this.parseExpression();

        return new AST.VariableDeclarationNode(varName, value, isState);
    }

    isAssignmentKeyword() {
        if (!this.check(TokenType.ASSIGNMENT) && !this.check(TokenType.IDENTIFIER)) {
            return false;
        }
        const val = this.peek().value.toLowerCase();
        return ['to', 'as', 'equals', 'be', 'is'].includes(val);
    }

    // ==================== EXPRESSIONS ====================

    parseExpression() {
        return this.parseLogicalOr();
    }

    parseLogicalOr() {
        let left = this.parseLogicalAnd();

        while (this.checkComparison('or')) {
            this.advance();
            const right = this.parseLogicalAnd();
            left = new AST.LogicalExpressionNode('or', left, right);
        }

        return left;
    }

    parseLogicalAnd() {
        let left = this.parseComparison();

        while (this.checkComparison('and')) {
            this.advance();
            const right = this.parseComparison();
            left = new AST.LogicalExpressionNode('and', left, right);
        }

        return left;
    }

    parseComparison() {
        let left = this.parseAddition();

        while (this.check(TokenType.COMPARISON)) {
            const op = this.advance().value;
            const right = this.parseAddition();
            left = new AST.ComparisonExpressionNode(op, left, right);
        }

        return left;
    }

    parseAddition() {
        let left = this.parseMultiplication();

        while (this.checkOperator('add', 'subtract', '+', '-')) {
            const op = this.advance().value;
            const right = this.parseMultiplication();
            left = new AST.BinaryExpressionNode(op, left, right);
        }

        return left;
    }

    parseMultiplication() {
        let left = this.parseUnary();

        while (this.checkOperator('multiply', 'divide', 'modulo', '*', '/', '%')) {
            const op = this.advance().value;
            const right = this.parseUnary();
            left = new AST.BinaryExpressionNode(op, left, right);
        }

        return left;
    }

    parseUnary() {
        if (this.checkOperator('not', '!', '-')) {
            const op = this.advance().value;
            const operand = this.parseUnary();
            return new AST.UnaryExpressionNode(op, operand);
        }

        return this.parsePrimary();
    }

    parsePrimary() {
        const token = this.peek();

        // String literal
        if (token.type === TokenType.STRING) {
            return new AST.StringLiteralNode(this.advance().value);
        }

        // Number literal
        if (token.type === TokenType.NUMBER) {
            return new AST.NumberLiteralNode(this.advance().value);
        }

        // Boolean literal
        if (token.type === TokenType.BOOLEAN) {
            return new AST.BooleanLiteralNode(this.advance().value);
        }

        // Color literal
        if (token.type === TokenType.COLOR) {
            return new AST.ColorLiteralNode(this.advance().value);
        }

        // Array literal
        if (token.type === TokenType.OPERATOR && token.value === '[') {
            return this.parseArrayLiteral();
        }

        // Identifier (variable reference or function call)
        if (token.type === TokenType.IDENTIFIER) {
            return this.parseIdentifierExpression();
        }

        // Default to null for unknown
        this.advance();
        return new AST.StringLiteralNode('');
    }

    parseArrayLiteral() {
        this.advance(); // consume '['
        const elements = [];

        while (!this.isAtEnd() && !(this.peek().type === TokenType.OPERATOR && this.peek().value === ']')) {
            elements.push(this.parseExpression());

            // Skip commas
            if (this.peek().type === TokenType.OPERATOR && this.peek().value === ',') {
                this.advance();
            }
        }

        // Consume ']'
        if (this.peek().type === TokenType.OPERATOR && this.peek().value === ']') {
            this.advance();
        }

        return new AST.ArrayLiteralNode(elements);
    }

    parseIdentifierExpression() {
        const words = [];
        while (this.check(TokenType.IDENTIFIER) && !this.isEndOfExpression()) {
            words.push(this.advance().value);
        }
        const name = words.join('_').toLowerCase();
        return new AST.VariableReferenceNode(name);
    }

    isEndOfExpression() {
        if (this.isAtEnd()) return true;
        const t = this.peek();
        return t.type === TokenType.NEWLINE ||
            t.type === TokenType.DEDENT ||
            t.type === TokenType.ASSIGNMENT ||
            (t.type === TokenType.IDENTIFIER && ['to', 'as', 'with', 'and', 'or'].includes(t.value.toLowerCase()));
    }

    // ==================== FUNCTIONS ====================

    parseFunctionDeclaration() {
        this.advance(); // consume function declaration keyword

        // Get function name
        let funcName = '';
        if (this.check(TokenType.STRING)) {
            funcName = this.advance().value;
        } else {
            const words = [];
            while (this.check(TokenType.IDENTIFIER) && !this.peekIs('that', 'takes', 'with')) {
                words.push(this.advance().value);
            }
            funcName = words.join('_').toLowerCase();
        }

        // Parse parameters
        const params = [];
        if (this.peekIs('that', 'takes', 'with')) {
            this.advance(); // consume 'that takes' or 'with'

            // Collect parameter names
            while (this.check(TokenType.IDENTIFIER)) {
                const paramWords = [];
                while (this.check(TokenType.IDENTIFIER) && !this.peekIs('and', ',')) {
                    paramWords.push(this.advance().value);
                }
                if (paramWords.length > 0) {
                    params.push(paramWords.join('_').toLowerCase());
                }

                // Skip 'and' or ','
                if (this.peekIs('and', ',')) {
                    this.advance();
                }
            }
        }

        this.skipNewlines();

        // Parse function body
        const body = [];
        if (this.check(TokenType.INDENT)) {
            this.advance();

            while (!this.check(TokenType.DEDENT) && !this.isAtEnd() && !this.peekEndFunction()) {
                const stmt = this.parseStatement();
                if (stmt) {
                    body.push(stmt);
                }
            }

            if (this.check(TokenType.DEDENT)) {
                this.advance();
            }
        }

        return new AST.FunctionDeclarationNode(funcName, params, body);
    }

    peekEndFunction() {
        const t = this.peek();
        return t.type === TokenType.IDENTIFIER &&
            t.raw?.toLowerCase().includes('end function');
    }

    // ==================== CONTROL FLOW ====================

    parseIfStatement() {
        this.advance(); // consume 'if' keyword

        // Parse condition
        const condition = this.parseExpression();

        this.skipNewlines();

        // Parse consequent (if body)
        const consequent = [];
        if (this.check(TokenType.INDENT)) {
            this.advance();

            while (!this.check(TokenType.DEDENT) && !this.isAtEnd() &&
                !this.checkConditional('else', 'elseif')) {
                const stmt = this.parseStatement();
                if (stmt) {
                    consequent.push(stmt);
                }
            }

            if (this.check(TokenType.DEDENT)) {
                this.advance();
            }
        }

        // Parse alternate (else/else-if)
        let alternate = null;
        if (this.check(TokenType.CONDITIONAL)) {
            const condType = this.peek().value;
            if (condType === 'elseif') {
                alternate = this.parseIfStatement();
            } else if (condType === 'else') {
                this.advance(); // consume 'else'
                this.skipNewlines();

                const elseBody = [];
                if (this.check(TokenType.INDENT)) {
                    this.advance();

                    while (!this.check(TokenType.DEDENT) && !this.isAtEnd()) {
                        const stmt = this.parseStatement();
                        if (stmt) {
                            elseBody.push(stmt);
                        }
                    }

                    if (this.check(TokenType.DEDENT)) {
                        this.advance();
                    }
                }
                alternate = elseBody;
            }
        }

        return new AST.IfStatementNode(condition, consequent, alternate);
    }

    parseLoop() {
        const loopToken = this.advance();
        const loopType = loopToken.value;

        if (loopType === 'for') {
            return this.parseForLoop();
        } else if (loopType === 'while') {
            return this.parseWhileLoop();
        } else if (loopType === 'repeat') {
            return this.parseRepeatLoop();
        }

        return null;
    }

    parseForLoop() {
        // "for each X in Y"
        let iteratorName = 'item';
        let iterable = null;

        // Get iterator name
        if (this.check(TokenType.IDENTIFIER)) {
            const words = [];
            while (this.check(TokenType.IDENTIFIER) && !this.peekIs('in', 'of')) {
                words.push(this.advance().value);
            }
            iteratorName = words.join('_').toLowerCase();
        }

        // Skip 'in' or 'of'
        if (this.peekIs('in', 'of')) {
            this.advance();
        }

        // Get iterable
        iterable = this.parseExpression();

        this.skipNewlines();

        // Parse loop body
        const body = [];
        if (this.check(TokenType.INDENT)) {
            this.advance();

            while (!this.check(TokenType.DEDENT) && !this.isAtEnd()) {
                const stmt = this.parseStatement();
                if (stmt) {
                    body.push(stmt);
                }
            }

            if (this.check(TokenType.DEDENT)) {
                this.advance();
            }
        }

        return new AST.ForLoopNode(iteratorName, iterable, body);
    }

    parseWhileLoop() {
        const condition = this.parseExpression();

        this.skipNewlines();

        const body = [];
        if (this.check(TokenType.INDENT)) {
            this.advance();

            while (!this.check(TokenType.DEDENT) && !this.isAtEnd()) {
                const stmt = this.parseStatement();
                if (stmt) {
                    body.push(stmt);
                }
            }

            if (this.check(TokenType.DEDENT)) {
                this.advance();
            }
        }

        return new AST.WhileLoopNode(condition, body);
    }

    parseRepeatLoop() {
        // "repeat N times"
        let count = new AST.NumberLiteralNode(1);

        if (this.check(TokenType.NUMBER)) {
            count = new AST.NumberLiteralNode(this.advance().value);
        } else if (this.check(TokenType.IDENTIFIER)) {
            count = this.parseIdentifierExpression();
        }

        // Skip 'times'
        if (this.peekIs('times', 'time')) {
            this.advance();
        }

        this.skipNewlines();

        const body = [];
        if (this.check(TokenType.INDENT)) {
            this.advance();

            while (!this.check(TokenType.DEDENT) && !this.isAtEnd()) {
                const stmt = this.parseStatement();
                if (stmt) {
                    body.push(stmt);
                }
            }

            if (this.check(TokenType.DEDENT)) {
                this.advance();
            }
        }

        return new AST.RepeatLoopNode(count, body);
    }

    // ==================== WIDGETS ====================

    parseWidget() {
        const widgetToken = this.advance();
        const widgetType = widgetToken.value;

        switch (widgetType) {
            case 'scaffold':
                return this.parseScaffold();
            case 'appBar':
                return this.parseAppBar();
            case 'column':
                return this.parseColumn();
            case 'row':
                return this.parseRow();
            case 'center':
                return this.parseCenter();
            case 'container':
                return this.parseContainer();
            case 'text':
                return this.parseText();
            case 'button':
                return this.parseButton();
            case 'image':
                return this.parseImage();
            case 'icon':
                return this.parseIcon();
            case 'textField':
                return this.parseTextField();
            case 'listView':
                return this.parseListView();
            case 'bottomNav':
                return this.parseBottomNav();
            default:
                return this.parseGenericWidget(widgetType);
        }
    }

    parseScaffold() {
        let appBar = null;
        let body = null;
        let bottomNav = null;

        this.skipNewlines();

        if (this.check(TokenType.INDENT)) {
            this.advance();

            while (!this.check(TokenType.DEDENT) && !this.isAtEnd()) {
                const token = this.peek();

                if (token.type === TokenType.WIDGET_TYPE) {
                    const widget = this.parseWidget();

                    if (widget) {
                        if (widget.type === 'AppBar') {
                            appBar = widget;
                        } else if (widget.type === 'BottomNavigation') {
                            bottomNav = widget;
                        } else if (widget.type === 'Column' || widget.type === 'Row' ||
                            widget.type === 'Center' || widget.type === 'Container') {
                            body = widget;
                        } else {
                            // Wrap single widget in body
                            if (!body) {
                                body = new AST.ColumnNode([widget]);
                            } else if (body.children) {
                                body.children.push(widget);
                            }
                        }
                    }
                } else {
                    // Check for "in the body" keyword
                    if (token.type === TokenType.IDENTIFIER &&
                        token.raw?.toLowerCase().includes('body')) {
                        this.advance();
                        this.skipNewlines();
                        if (this.check(TokenType.INDENT)) {
                            body = this.parseWidgetBody();
                        }
                    } else {
                        const stmt = this.parseStatement();
                        if (stmt && stmt.type !== 'Comment') {
                            if (!body) {
                                body = new AST.ColumnNode([]);
                            }
                            if (body.children) {
                                body.children.push(stmt);
                            }
                        }
                    }
                }
            }

            if (this.check(TokenType.DEDENT)) {
                this.advance();
            }
        }

        return new AST.ScaffoldNode(appBar, body, bottomNav);
    }

    parseWidgetBody() {
        this.advance(); // consume INDENT
        const children = [];

        while (!this.check(TokenType.DEDENT) && !this.isAtEnd()) {
            const stmt = this.parseStatement();
            if (stmt) {
                children.push(stmt);
            }
        }

        if (this.check(TokenType.DEDENT)) {
            this.advance();
        }

        return new AST.ColumnNode(children);
    }

    parseAppBar() {
        let title = null;
        const styles = {};

        // Look for title text
        if (this.check(TokenType.STRING)) {
            title = new AST.TextNode(new AST.StringLiteralNode(this.advance().value));
        } else if (this.peekIs('that', 'with')) {
            this.advance();
            if (this.check(TokenType.STRING)) {
                title = new AST.TextNode(new AST.StringLiteralNode(this.advance().value));
            }
        }

        return new AST.AppBarNode(title, null, [], styles);
    }

    parseColumn() {
        const children = [];
        const styles = {};

        this.skipNewlines();

        if (this.check(TokenType.INDENT)) {
            this.advance();

            while (!this.check(TokenType.DEDENT) && !this.isAtEnd()) {
                const stmt = this.parseStatement();
                if (stmt) {
                    children.push(stmt);
                }
            }

            if (this.check(TokenType.DEDENT)) {
                this.advance();
            }
        }

        return new AST.ColumnNode(children, 'start', styles);
    }

    parseRow() {
        const children = [];
        const styles = {};

        this.skipNewlines();

        if (this.check(TokenType.INDENT)) {
            this.advance();

            while (!this.check(TokenType.DEDENT) && !this.isAtEnd()) {
                const stmt = this.parseStatement();
                if (stmt) {
                    children.push(stmt);
                }
            }

            if (this.check(TokenType.DEDENT)) {
                this.advance();
            }
        }

        return new AST.RowNode(children, 'start', styles);
    }

    parseCenter() {
        this.skipNewlines();

        let child = null;

        if (this.check(TokenType.INDENT)) {
            this.advance();
            child = this.parseStatement();

            while (!this.check(TokenType.DEDENT) && !this.isAtEnd()) {
                this.parseStatement(); // consume extra statements
            }

            if (this.check(TokenType.DEDENT)) {
                this.advance();
            }
        }

        return new AST.CenterNode(child);
    }

    parseContainer() {
        const children = [];
        const styles = {};

        this.skipNewlines();

        if (this.check(TokenType.INDENT)) {
            this.advance();

            while (!this.check(TokenType.DEDENT) && !this.isAtEnd()) {
                const stmt = this.parseStatement();
                if (stmt) {
                    children.push(stmt);
                }
            }

            if (this.check(TokenType.DEDENT)) {
                this.advance();
            }
        }

        return new AST.ContainerNode(children, styles);
    }

    parseText() {
        let content = new AST.StringLiteralNode('');
        const styles = {};

        // Get text content
        if (this.check(TokenType.STRING)) {
            content = new AST.StringLiteralNode(this.advance().value);
        } else if (this.peekIs('that', 'says', 'saying', 'shows', 'displaying')) {
            this.advance();
            // Skip additional connecting words like "the"
            while (this.peekIs('the', 'a', 'an')) {
                this.advance();
            }
            if (this.check(TokenType.STRING)) {
                content = new AST.StringLiteralNode(this.advance().value);
            } else if (this.check(TokenType.IDENTIFIER)) {
                // Handle variable references like "counter" or "display"
                content = this.parseIdentifierExpression();
            }
        }

        // Parse inline styles
        while (this.check(TokenType.STYLE_PROPERTY) || this.check(TokenType.COLOR)) {
            this.parseInlineStyle(styles);
        }

        this.skipNewlines();

        // Parse block styles
        if (this.check(TokenType.INDENT)) {
            this.advance();

            while (!this.check(TokenType.DEDENT) && !this.isAtEnd()) {
                if (this.check(TokenType.STYLE_PROPERTY) || this.check(TokenType.COLOR)) {
                    this.parseInlineStyle(styles);
                }
                this.skipNewlines();
                if (!this.check(TokenType.STYLE_PROPERTY) && !this.check(TokenType.COLOR)) {
                    break;
                }
            }

            if (this.check(TokenType.DEDENT)) {
                this.advance();
            }
        }

        return new AST.TextNode(content, styles);
    }

    parseButton() {
        let label = new AST.StringLiteralNode('Button');
        let onPressed = null;
        const styles = {};

        // Get button label
        if (this.check(TokenType.STRING)) {
            label = new AST.StringLiteralNode(this.advance().value);
        } else if (this.peekIs('that', 'says', 'saying')) {
            this.advance();
            if (this.check(TokenType.STRING)) {
                label = new AST.StringLiteralNode(this.advance().value);
            }
        }

        // Check for event handler
        while (this.check(TokenType.EVENT_TYPE) || this.check(TokenType.STYLE_PROPERTY) ||
            this.check(TokenType.COLOR)) {
            if (this.check(TokenType.EVENT_TYPE)) {
                onPressed = this.parseEventAction();
            } else {
                this.parseInlineStyle(styles);
            }
        }

        this.skipNewlines();

        // Parse block content
        if (this.check(TokenType.INDENT)) {
            this.advance();

            while (!this.check(TokenType.DEDENT) && !this.isAtEnd()) {
                if (this.check(TokenType.EVENT_TYPE)) {
                    onPressed = this.parseEventAction();
                } else if (this.check(TokenType.STYLE_PROPERTY) || this.check(TokenType.COLOR)) {
                    this.parseInlineStyle(styles);
                }
                this.skipNewlines();
            }

            if (this.check(TokenType.DEDENT)) {
                this.advance();
            }
        }

        return new AST.ButtonNode(label, onPressed, styles);
    }

    parseImage() {
        let source = new AST.StringLiteralNode('');
        const styles = {};

        // Get image source
        if (this.check(TokenType.STRING)) {
            source = new AST.StringLiteralNode(this.advance().value);
        } else if (this.peekIs('from')) {
            this.advance();
            if (this.check(TokenType.STRING)) {
                source = new AST.StringLiteralNode(this.advance().value);
            }
        }

        // Parse styles
        while (this.check(TokenType.STYLE_PROPERTY) || this.check(TokenType.NUMBER)) {
            this.parseInlineStyle(styles);
        }

        return new AST.ImageNode(source, '', styles);
    }

    parseIcon() {
        let name = 'star';
        let size = 24;
        let color = null;

        if (this.check(TokenType.STRING)) {
            name = this.advance().value;
        } else if (this.check(TokenType.IDENTIFIER)) {
            name = this.advance().value;
        }

        return new AST.IconNode(name, size, color);
    }

    parseTextField() {
        let placeholder = '';
        const styles = {};

        if (this.check(TokenType.STRING)) {
            placeholder = this.advance().value;
        }

        return new AST.TextFieldNode(placeholder, null, null, styles);
    }

    parseListView() {
        const items = [];
        let itemRenderer = null;

        this.skipNewlines();

        if (this.check(TokenType.INDENT)) {
            this.advance();

            while (!this.check(TokenType.DEDENT) && !this.isAtEnd()) {
                const stmt = this.parseStatement();
                if (stmt) {
                    items.push(stmt);
                }
            }

            if (this.check(TokenType.DEDENT)) {
                this.advance();
            }
        }

        return new AST.ListViewNode(items, itemRenderer);
    }

    parseBottomNav() {
        const items = [];

        this.skipNewlines();

        if (this.check(TokenType.INDENT)) {
            this.advance();

            while (!this.check(TokenType.DEDENT) && !this.isAtEnd()) {
                if (this.check(TokenType.IDENTIFIER) || this.check(TokenType.STRING)) {
                    const item = this.parseBottomNavItem();
                    if (item) {
                        items.push(item);
                    }
                }
                this.skipNewlines();
            }

            if (this.check(TokenType.DEDENT)) {
                this.advance();
            }
        }

        return new AST.BottomNavigationNode(items);
    }

    parseBottomNavItem() {
        let label = '';
        let icon = 'circle';

        // Get label
        if (this.check(TokenType.STRING)) {
            label = this.advance().value;
        } else if (this.check(TokenType.IDENTIFIER)) {
            const words = [];
            while (this.check(TokenType.IDENTIFIER) && !this.peekIs('with', 'icon')) {
                words.push(this.advance().value);
            }
            label = words.join(' ');
        }

        // Get icon
        if (this.peekIs('with', 'icon')) {
            this.advance();
            if (this.peekIs('icon')) this.advance();
            if (this.check(TokenType.STRING)) {
                icon = this.advance().value;
            } else if (this.check(TokenType.IDENTIFIER)) {
                icon = this.advance().value;
            }
        }

        return new AST.BottomNavItemNode(label, icon);
    }

    parseGenericWidget(widgetType) {
        const props = {};
        const children = [];
        const styles = {};
        const events = {};

        this.skipNewlines();

        if (this.check(TokenType.INDENT)) {
            this.advance();

            while (!this.check(TokenType.DEDENT) && !this.isAtEnd()) {
                const stmt = this.parseStatement();
                if (stmt) {
                    children.push(stmt);
                }
            }

            if (this.check(TokenType.DEDENT)) {
                this.advance();
            }
        }

        return new AST.WidgetNode(widgetType, props, children, styles, events);
    }

    // ==================== STYLES ====================

    parseInlineStyle(styles) {
        const token = this.peek();

        if (token.type === TokenType.COLOR) {
            styles.color = this.advance().value;
            return;
        }

        if (token.type === TokenType.STYLE_PROPERTY) {
            const prop = this.advance().value;

            // Get value
            let value = null;
            if (this.check(TokenType.NUMBER)) {
                value = this.advance().value;
            } else if (this.check(TokenType.STRING)) {
                value = this.advance().value;
            } else if (this.check(TokenType.COLOR)) {
                value = this.advance().value;
            } else if (this.check(TokenType.IDENTIFIER)) {
                value = this.advance().value;
            }

            styles[prop] = value;
        }
    }

    // ==================== EVENTS ====================

    parseEventHandler() {
        const eventToken = this.advance();
        const eventType = eventToken.value;

        const actions = [];

        this.skipNewlines();

        if (this.check(TokenType.INDENT)) {
            this.advance();

            while (!this.check(TokenType.DEDENT) && !this.isAtEnd()) {
                const action = this.parseAction();
                if (action) {
                    actions.push(action);
                }
            }

            if (this.check(TokenType.DEDENT)) {
                this.advance();
            }
        } else {
            // Single line action
            const action = this.parseAction();
            if (action) {
                actions.push(action);
            }
        }

        return new AST.EventHandlerNode(eventType, null, actions);
    }

    parseEventAction() {
        this.advance(); // consume event keyword
        return this.parseAction();
    }

    parseAction() {
        const token = this.peek();

        // "show message"
        if (token.type === TokenType.IDENTIFIER &&
            (token.value.includes('show') || token.value.includes('message'))) {
            this.advance();
            if (this.check(TokenType.STRING)) {
                return new AST.ShowMessageNode(new AST.StringLiteralNode(this.advance().value));
            }
        }

        // "go to" navigation
        if (token.type === TokenType.IDENTIFIER &&
            (token.value.includes('go') || token.value.includes('navigate'))) {
            this.advance();
            // Skip "to"
            if (this.peekIs('to')) this.advance();

            let screenName = '';
            if (this.check(TokenType.STRING)) {
                screenName = this.advance().value;
            } else if (this.check(TokenType.IDENTIFIER)) {
                const words = [];
                while (this.check(TokenType.IDENTIFIER)) {
                    words.push(this.advance().value);
                }
                screenName = words.join(' ');
            }

            return new AST.NavigateNode(screenName);
        }

        // Variable assignment or math operation
        if (token.type === TokenType.OPERATOR || token.type === TokenType.VARIABLE_DECL) {
            return this.parseStatement();
        }

        return null;
    }

    // ==================== IDENTIFIER STATEMENTS ====================

    parseIdentifierStatement() {
        // Could be assignment, function call, or standalone expression
        const words = [];
        while (this.check(TokenType.IDENTIFIER) && !this.isAssignmentKeyword()) {
            words.push(this.advance().value);
        }

        if (this.isAssignmentKeyword()) {
            // It's an assignment
            this.advance(); // consume 'to', 'as', etc.
            const value = this.parseExpression();
            return new AST.AssignmentNode(
                new AST.VariableReferenceNode(words.join('_').toLowerCase()),
                value
            );
        }

        // Otherwise treat as variable reference
        return new AST.VariableReferenceNode(words.join('_').toLowerCase());
    }

    // ==================== MATH OPERATIONS ====================

    parseMathOperation() {
        const opToken = this.advance();
        const operator = opToken.value;

        // Get value
        const value = this.parseExpression();

        // Get target (after "to" or "from")
        let target = null;
        if (this.peekIs('to', 'from')) {
            this.advance();
            target = this.parseExpression();
        }

        if (target) {
            // Create assignment with binary operation
            return new AST.AssignmentNode(
                target,
                new AST.BinaryExpressionNode(operator, target, value)
            );
        }

        return new AST.BinaryExpressionNode(operator, value, new AST.NumberLiteralNode(0));
    }

    // ==================== HELPER METHODS ====================

    peek() {
        return this.tokens[this.current] || { type: TokenType.EOF, value: '' };
    }

    previous() {
        return this.tokens[this.current - 1] || { type: TokenType.EOF, value: '' };
    }

    advance() {
        if (!this.isAtEnd()) {
            this.current++;
        }
        return this.previous();
    }

    check(type) {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    checkComparison(...values) {
        if (!this.check(TokenType.COMPARISON) && !this.check(TokenType.LOGICAL)) {
            return false;
        }
        return values.includes(this.peek().value);
    }

    checkOperator(...values) {
        if (!this.check(TokenType.OPERATOR)) return false;
        return values.includes(this.peek().value);
    }

    checkConditional(...values) {
        if (!this.check(TokenType.CONDITIONAL)) return false;
        return values.includes(this.peek().value);
    }

    peekIs(...values) {
        const token = this.peek();
        const lowerValue = (token.value || '').toString().toLowerCase();
        const lowerRaw = (token.raw || '').toLowerCase();
        return values.some(v => lowerValue === v.toLowerCase() || lowerRaw.includes(v.toLowerCase()));
    }

    isAtEnd() {
        return this.peek().type === TokenType.EOF;
    }

    skipNewlines() {
        while (this.check(TokenType.NEWLINE)) {
            this.advance();
        }
    }
}

/**
 * Parse Yiphthachl source code into an AST
 * @param {Token[]} tokens - Array of tokens from the tokenizer
 * @returns {{ ast: ProgramNode, errors: Error[] }}
 */
export function parse(tokens) {
    const parser = new Parser(tokens);
    return parser.parse();
}
