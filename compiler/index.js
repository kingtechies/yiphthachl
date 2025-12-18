/**
 * Yiphthachl Compiler
 * Main entry point for the Yiphthachl programming language compiler
 */

import { Tokenizer } from './tokenizer.js';
import { Parser } from './parser.js';
import { WebGenerator } from './web-generator.js';

export class YiphthachlCompiler {
    constructor(options = {}) {
        this.options = {
            target: 'web',      // 'web' or 'native'
            minify: false,
            debug: false,
            ...options
        };
    }

    /**
     * Compile Yiphthachl source code to target output
     * @param {string} source - The Yiphthachl source code
     * @returns {{ success: boolean, output: object, errors: Error[] }}
     */
    compile(source) {
        const result = {
            success: false,
            output: null,
            errors: [],
            warnings: [],
            tokens: null,
            ast: null
        };

        try {
            // Step 1: Tokenize
            if (this.options.debug) {
                console.log('🔤 Tokenizing...');
            }
            const tokenizer = new Tokenizer(source);
            result.tokens = tokenizer.tokenize();

            if (this.options.debug) {
                console.log(`   Found ${result.tokens.length} tokens`);
            }

            // Step 2: Parse
            if (this.options.debug) {
                console.log('🌳 Parsing...');
            }
            const parser = new Parser(result.tokens);
            const parseResult = parser.parse();
            result.ast = parseResult.ast;

            if (parseResult.errors.length > 0) {
                result.errors.push(...parseResult.errors);
                return result;
            }

            if (this.options.debug) {
                console.log(`   Built AST with ${result.ast.statements.length} top-level statements`);
            }

            // Step 3: Generate code
            if (this.options.debug) {
                console.log('⚡ Generating code...');
            }

            if (this.options.target === 'web') {
                const generator = new WebGenerator();
                result.output = generator.generate(result.ast);
            } else {
                throw new Error(`Unsupported target: ${this.options.target}`);
            }

            if (this.options.debug) {
                console.log('✅ Compilation complete!');
            }

            result.success = true;

        } catch (error) {
            result.errors.push(error);
        }

        return result;
    }

    /**
     * Quick compile to get just the HTML output
     * @param {string} source - The Yiphthachl source code
     * @returns {string} - The generated HTML
     */
    compileToHtml(source) {
        const result = this.compile(source);
        if (!result.success) {
            throw new Error(result.errors.map(e => e.message).join('\n'));
        }
        return result.output.html;
    }

    /**
     * Validate source code without generating output
     * @param {string} source - The Yiphthachl source code
     * @returns {{ valid: boolean, errors: Error[], warnings: string[] }}
     */
    validate(source) {
        const result = {
            valid: true,
            errors: [],
            warnings: []
        };

        try {
            const tokenizer = new Tokenizer(source);
            const tokens = tokenizer.tokenize();

            const parser = new Parser(tokens);
            const parseResult = parser.parse();

            if (parseResult.errors.length > 0) {
                result.valid = false;
                result.errors = parseResult.errors;
            }

        } catch (error) {
            result.valid = false;
            result.errors.push(error);
        }

        return result;
    }
}

/**
 * Compile Yiphthachl source code (convenience function)
 * @param {string} source - The Yiphthachl source code
 * @param {object} options - Compiler options
 * @returns {{ success: boolean, output: object, errors: Error[] }}
 */
export function compile(source, options = {}) {
    const compiler = new YiphthachlCompiler(options);
    return compiler.compile(source);
}

/**
 * Quick compile to HTML (convenience function)
 * @param {string} source - The Yiphthachl source code
 * @returns {string} - The generated HTML
 */
export function compileToHtml(source) {
    const compiler = new YiphthachlCompiler();
    return compiler.compileToHtml(source);
}

// Re-export components
export { Tokenizer, Token, TokenType } from './tokenizer.js';
export { Parser, ParseError } from './parser.js';
export { WebGenerator } from './web-generator.js';
export * as AST from './ast-nodes.js';
