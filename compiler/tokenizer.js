/**
 * Yiphthachl Lexer/Tokenizer
 * Converts plain English code into tokens
 */

import * as Keywords from './keywords.js';

// Token types
export const TokenType = {
    // Literals
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    BOOLEAN: 'BOOLEAN',
    IDENTIFIER: 'IDENTIFIER',

    // Keywords
    KEYWORD: 'KEYWORD',

    // Operators
    OPERATOR: 'OPERATOR',
    COMPARISON: 'COMPARISON',
    LOGICAL: 'LOGICAL',

    // Structure
    NEWLINE: 'NEWLINE',
    INDENT: 'INDENT',
    DEDENT: 'DEDENT',
    EOF: 'EOF',

    // Special
    COMMENT: 'COMMENT',

    // UI/Widget tokens
    WIDGET_TYPE: 'WIDGET_TYPE',
    STYLE_PROPERTY: 'STYLE_PROPERTY',
    EVENT_TYPE: 'EVENT_TYPE',
    COLOR: 'COLOR',

    // Actions
    VARIABLE_DECL: 'VARIABLE_DECL',
    FUNCTION_DECL: 'FUNCTION_DECL',
    FUNCTION_CALL: 'FUNCTION_CALL',
    CONDITIONAL: 'CONDITIONAL',
    LOOP: 'LOOP',
    ASSIGNMENT: 'ASSIGNMENT'
};

export class Token {
    constructor(type, value, line, column, raw = null) {
        this.type = type;
        this.value = value;
        this.line = line;
        this.column = column;
        this.raw = raw || value; // Original text
    }

    toString() {
        return `Token(${this.type}, "${this.value}", line=${this.line})`;
    }
}

export class Tokenizer {
    constructor(source) {
        this.source = source;
        this.tokens = [];
        this.current = 0;
        this.line = 1;
        this.column = 1;
        this.indentStack = [0];
    }

    tokenize() {
        while (!this.isAtEnd()) {
            this.scanToken();
        }

        // Handle remaining dedents
        while (this.indentStack.length > 1) {
            this.indentStack.pop();
            this.addToken(TokenType.DEDENT, '');
        }

        this.addToken(TokenType.EOF, '');
        return this.tokens;
    }

    scanToken() {
        // Skip whitespace (but track for indentation at line start)
        if (this.column === 1) {
            this.handleIndentation();
        } else {
            this.skipWhitespace();
        }

        if (this.isAtEnd()) return;

        const char = this.peek();

        // Comments
        if (char === '#') {
            this.scanComment();
            return;
        }

        // Newlines
        if (char === '\n') {
            this.addToken(TokenType.NEWLINE, '\n');
            this.advance();
            this.line++;
            this.column = 1;
            return;
        }

        // Strings
        if (char === '"' || char === "'") {
            this.scanString(char);
            return;
        }

        // Numbers
        if (this.isDigit(char)) {
            this.scanNumber();
            return;
        }

        // Words/Keywords/Identifiers
        if (this.isAlpha(char)) {
            this.scanWord();
            return;
        }

        // Operators
        if (this.isOperator(char)) {
            this.scanOperator();
            return;
        }

        // Skip unknown characters
        this.advance();
    }

    handleIndentation() {
        let indent = 0;
        while (this.peek() === ' ' || this.peek() === '\t') {
            indent += this.peek() === '\t' ? 4 : 1;
            this.advance();
        }

        // Skip blank lines
        if (this.peek() === '\n' || this.peek() === '#') {
            return;
        }

        const currentIndent = this.indentStack[this.indentStack.length - 1];

        if (indent > currentIndent) {
            this.indentStack.push(indent);
            this.addToken(TokenType.INDENT, '');
        } else if (indent < currentIndent) {
            while (this.indentStack.length > 1 &&
                this.indentStack[this.indentStack.length - 1] > indent) {
                this.indentStack.pop();
                this.addToken(TokenType.DEDENT, '');
            }
        }
    }

    scanComment() {
        let comment = '';
        this.advance(); // Skip #
        while (!this.isAtEnd() && this.peek() !== '\n') {
            comment += this.advance();
        }
        this.addToken(TokenType.COMMENT, comment.trim());
    }

    scanString(quote) {
        let value = '';
        this.advance(); // Skip opening quote

        while (!this.isAtEnd() && this.peek() !== quote) {
            if (this.peek() === '\n') {
                this.line++;
                this.column = 1;
            }
            if (this.peek() === '\\' && this.peekNext() === quote) {
                this.advance();
            }
            value += this.advance();
        }

        if (!this.isAtEnd()) {
            this.advance(); // Skip closing quote
        }

        this.addToken(TokenType.STRING, value);
    }

    scanNumber() {
        let value = '';

        while (this.isDigit(this.peek())) {
            value += this.advance();
        }

        // Decimal
        if (this.peek() === '.' && this.isDigit(this.peekNext())) {
            value += this.advance(); // .
            while (this.isDigit(this.peek())) {
                value += this.advance();
            }
        }

        this.addToken(TokenType.NUMBER, parseFloat(value));
    }

    scanWord() {
        let word = '';
        const startColumn = this.column;

        // Collect the full phrase (multiple words for keyword matching)
        while (this.isAlphaNumeric(this.peek()) || this.peek() === ' ') {
            if (this.peek() === ' ') {
                // Look ahead to see if this forms a known phrase
                const ahead = this.lookAheadWord();
                const possiblePhrase = word + ' ' + ahead;

                if (this.isKnownPhrase(possiblePhrase)) {
                    word += this.advance(); // Include space
                    continue;
                } else {
                    break;
                }
            }
            word += this.advance();
        }

        word = word.trim().toLowerCase();

        // Match against keyword categories
        const tokenType = this.categorizeWord(word);
        this.addToken(tokenType.type, tokenType.value, word);
    }

    lookAheadWord() {
        let word = '';
        let pos = this.current;

        // Skip current space
        if (this.source[pos] === ' ') pos++;

        while (pos < this.source.length && this.isAlphaNumeric(this.source[pos])) {
            word += this.source[pos];
            pos++;
        }

        return word.toLowerCase();
    }

    isKnownPhrase(phrase) {
        return Keywords.ALL_KEYWORDS.has(phrase.toLowerCase());
    }

    categorizeWord(word) {
        const lowerWord = word.toLowerCase();

        // Check booleans
        if (lowerWord === 'true' || lowerWord === 'yes') {
            return { type: TokenType.BOOLEAN, value: true };
        }
        if (lowerWord === 'false' || lowerWord === 'no') {
            return { type: TokenType.BOOLEAN, value: false };
        }

        // Check color names
        if (Keywords.COLOR_NAMES[lowerWord]) {
            return { type: TokenType.COLOR, value: Keywords.COLOR_NAMES[lowerWord] };
        }

        // Check variable declaration
        if (Keywords.VARIABLE_KEYWORDS.includes(lowerWord)) {
            return { type: TokenType.VARIABLE_DECL, value: lowerWord };
        }

        // Check assignment
        if (Keywords.ASSIGNMENT_KEYWORDS.includes(lowerWord)) {
            return { type: TokenType.ASSIGNMENT, value: lowerWord };
        }

        // Check function keywords
        for (const kw of Keywords.FUNCTION_KEYWORDS) {
            if (lowerWord.startsWith(kw)) {
                return { type: TokenType.FUNCTION_DECL, value: lowerWord };
            }
        }

        // Check conditionals
        for (const [key, phrases] of Object.entries(Keywords.CONDITIONAL_KEYWORDS)) {
            if (phrases.some(p => lowerWord === p || lowerWord.startsWith(p))) {
                return { type: TokenType.CONDITIONAL, value: key };
            }
        }

        // Check loops
        for (const [key, phrases] of Object.entries(Keywords.LOOP_KEYWORDS)) {
            if (phrases.some(p => lowerWord === p || lowerWord.startsWith(p))) {
                return { type: TokenType.LOOP, value: key };
            }
        }

        // Check comparisons
        for (const [key, phrases] of Object.entries(Keywords.COMPARISON_KEYWORDS)) {
            if (phrases.includes(lowerWord)) {
                return { type: TokenType.COMPARISON, value: key };
            }
        }

        // Check math operations
        for (const [key, phrases] of Object.entries(Keywords.MATH_KEYWORDS)) {
            if (phrases.includes(lowerWord)) {
                return { type: TokenType.OPERATOR, value: key };
            }
        }

        // Check UI widgets
        for (const [key, phrases] of Object.entries(Keywords.UI_KEYWORDS)) {
            if (phrases.some(p => lowerWord.includes(p))) {
                return { type: TokenType.WIDGET_TYPE, value: key };
            }
        }

        // Check style properties
        for (const [key, phrases] of Object.entries(Keywords.STYLE_KEYWORDS)) {
            if (phrases.some(p => lowerWord.includes(p))) {
                return { type: TokenType.STYLE_PROPERTY, value: key };
            }
        }

        // Check events
        for (const [key, phrases] of Object.entries(Keywords.EVENT_KEYWORDS)) {
            if (phrases.some(p => lowerWord === p || lowerWord.startsWith(p))) {
                return { type: TokenType.EVENT_TYPE, value: key };
            }
        }

        // Default to identifier
        return { type: TokenType.IDENTIFIER, value: word };
    }

    scanOperator() {
        const char = this.advance();
        let op = char;

        // Check for multi-character operators
        if ((char === '=' || char === '!' || char === '<' || char === '>') &&
            this.peek() === '=') {
            op += this.advance();
        }

        this.addToken(TokenType.OPERATOR, op);
    }

    // Helper methods
    isAtEnd() {
        return this.current >= this.source.length;
    }

    peek() {
        if (this.isAtEnd()) return '\0';
        return this.source[this.current];
    }

    peekNext() {
        if (this.current + 1 >= this.source.length) return '\0';
        return this.source[this.current + 1];
    }

    advance() {
        this.column++;
        return this.source[this.current++];
    }

    skipWhitespace() {
        while (this.peek() === ' ' || this.peek() === '\t' || this.peek() === '\r') {
            this.advance();
        }
    }

    isDigit(char) {
        return char >= '0' && char <= '9';
    }

    isAlpha(char) {
        return (char >= 'a' && char <= 'z') ||
            (char >= 'A' && char <= 'Z') ||
            char === '_';
    }

    isAlphaNumeric(char) {
        return this.isAlpha(char) || this.isDigit(char);
    }

    isOperator(char) {
        return '+-*/%=<>!&|'.includes(char);
    }

    addToken(type, value, raw = null) {
        this.tokens.push(new Token(type, value, this.line, this.column, raw));
    }
}
