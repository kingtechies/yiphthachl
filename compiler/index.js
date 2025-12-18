/**
 * Yiphthachl Compiler
 * Main entry point for the Yiphthachl programming language compiler
 * 
 * Supports:
 * - Web (HTML/CSS/JS)
 * - Android (APK via Kotlin/Jetpack Compose)
 * - iOS (IPA via Swift/SwiftUI)
 * - Windows (EXE via C#/WinUI)
 * - macOS (APP via Swift/SwiftUI)
 */

import { Tokenizer } from './tokenizer.js';
import { Parser } from './parser.js';
import { WebGenerator } from './web-generator.js';

// Native compilation targets
export const CompileTarget = {
    WEB: 'web',
    ANDROID: 'android',
    IOS: 'ios',
    WINDOWS: 'windows',
    MACOS: 'macos'
};

// Check if target is a native platform
const isNativeTarget = (target) => {
    return [CompileTarget.ANDROID, CompileTarget.IOS, CompileTarget.WINDOWS, CompileTarget.MACOS].includes(target);
};

export class YiphthachlCompiler {
    constructor(options = {}) {
        this.options = {
            target: CompileTarget.WEB,
            minify: false,
            debug: false,
            // Native compilation options
            appName: 'YiphthachlApp',
            bundleId: 'com.yiphthachl.app',
            version: '1.0.0',
            buildNumber: 1,
            outputDir: './build',
            ...options
        };

        // Lazy load native compiler
        this.nativeCompiler = null;
    }

    /**
     * Get or create native compiler instance
     * @returns {Promise<NativeCompiler>}
     */
    async getNativeCompiler() {
        if (!this.nativeCompiler) {
            const { NativeCompiler } = await import('../native-compiler/index.js');
            this.nativeCompiler = new NativeCompiler(this.options);
        }
        return this.nativeCompiler;
    }

    /**
     * Parse source code to AST (shared step for all targets)
     * @param {string} source - The Yiphthachl source code
     * @returns {{ success: boolean, ast: object, tokens: array, errors: Error[] }}
     */
    parse(source) {
        const result = {
            success: false,
            ast: null,
            tokens: null,
            errors: [],
            warnings: []
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

            result.success = true;

        } catch (error) {
            result.errors.push(error);
        }

        return result;
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
            // Parse source
            const parseResult = this.parse(source);
            result.tokens = parseResult.tokens;
            result.ast = parseResult.ast;

            if (!parseResult.success) {
                result.errors = parseResult.errors;
                return result;
            }

            // Generate code for web target (synchronous)
            if (this.options.target === CompileTarget.WEB) {
                if (this.options.debug) {
                    console.log('⚡ Generating web code...');
                }
                const generator = new WebGenerator();
                result.output = generator.generate(result.ast);
                result.success = true;

                if (this.options.debug) {
                    console.log('✅ Compilation complete!');
                }
            } else if (isNativeTarget(this.options.target)) {
                // For native targets, return AST and instruct to use compileAsync
                result.errors.push(new Error(
                    `Native compilation requires async. Use compileAsync() for target: ${this.options.target}`
                ));
            } else {
                throw new Error(`Unsupported target: ${this.options.target}`);
            }

        } catch (error) {
            result.errors.push(error);
        }

        return result;
    }

    /**
     * Compile Yiphthachl source code asynchronously (required for native targets)
     * @param {string} source - The Yiphthachl source code
     * @returns {Promise<{ success: boolean, output: object, errors: Error[] }>}
     */
    async compileAsync(source) {
        const result = {
            success: false,
            output: null,
            errors: [],
            warnings: [],
            tokens: null,
            ast: null,
            generatedFiles: []
        };

        try {
            // Parse source
            const parseResult = this.parse(source);
            result.tokens = parseResult.tokens;
            result.ast = parseResult.ast;

            if (!parseResult.success) {
                result.errors = parseResult.errors;
                return result;
            }

            // Generate code based on target
            if (this.options.target === CompileTarget.WEB) {
                if (this.options.debug) {
                    console.log('⚡ Generating web code...');
                }
                const generator = new WebGenerator();
                result.output = generator.generate(result.ast);
                result.success = true;
            } else if (isNativeTarget(this.options.target)) {
                if (this.options.debug) {
                    console.log(`📱 Generating ${this.options.target.toUpperCase()} native code...`);
                }

                const nativeCompiler = await this.getNativeCompiler();
                const nativeResult = await nativeCompiler.compile(result.ast);

                result.output = nativeResult.output;
                result.generatedFiles = nativeResult.generatedFiles || [];
                result.warnings = nativeResult.warnings || [];

                if (nativeResult.errors && nativeResult.errors.length > 0) {
                    result.errors = nativeResult.errors;
                } else {
                    result.success = true;
                }
            } else {
                throw new Error(`Unsupported target: ${this.options.target}`);
            }

            if (this.options.debug && result.success) {
                console.log('✅ Compilation complete!');
            }

        } catch (error) {
            result.errors.push(error);
        }

        return result;
    }

    /**
     * Build native package (APK, IPA, EXE, APP)
     * @param {string} source - The Yiphthachl source code
     * @returns {Promise<{ success: boolean, packagePath: string, errors: Error[] }>}
     */
    async buildNative(source) {
        if (!isNativeTarget(this.options.target)) {
            return {
                success: false,
                packagePath: null,
                errors: [new Error(`buildNative() requires a native target. Current target: ${this.options.target}`)]
            };
        }

        const result = {
            success: false,
            packagePath: null,
            errors: [],
            logs: []
        };

        try {
            // First compile
            const compileResult = await this.compileAsync(source);

            if (!compileResult.success) {
                result.errors = compileResult.errors;
                return result;
            }

            // Build native package
            const nativeCompiler = await this.getNativeCompiler();
            const buildResult = await nativeCompiler.build(compileResult.ast);

            result.success = buildResult.success;
            result.packagePath = buildResult.path;
            result.logs = buildResult.logs || [];
            result.errors = buildResult.errors || [];

        } catch (error) {
            result.errors.push(error);
        }

        return result;
    }

    /**
     * Check if native build environment is ready
     * @returns {Promise<object>}
     */
    async checkNativeEnvironment() {
        if (!isNativeTarget(this.options.target)) {
            return { ready: true, message: 'Web target does not require native environment' };
        }

        const nativeCompiler = await this.getNativeCompiler();
        return await nativeCompiler.checkEnvironment();
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
 * Compile Yiphthachl source code asynchronously (convenience function)
 * @param {string} source - The Yiphthachl source code
 * @param {object} options - Compiler options
 * @returns {Promise<{ success: boolean, output: object, errors: Error[] }>}
 */
export async function compileAsync(source, options = {}) {
    const compiler = new YiphthachlCompiler(options);
    return await compiler.compileAsync(source);
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

/**
 * Compile to native platform (convenience function)
 * @param {string} source - The Yiphthachl source code
 * @param {string} target - The target platform: 'android', 'ios', 'windows', or 'macos'
 * @param {object} options - Additional options
 * @returns {Promise<{ success: boolean, output: object, generatedFiles: string[], errors: Error[] }>}
 */
export async function compileToNative(source, target, options = {}) {
    const compiler = new YiphthachlCompiler({ ...options, target });
    return await compiler.compileAsync(source);
}

/**
 * Build native package (convenience function)
 * @param {string} source - The Yiphthachl source code
 * @param {string} target - The target platform
 * @param {object} options - Additional options
 * @returns {Promise<{ success: boolean, packagePath: string, errors: Error[] }>}
 */
export async function buildNativePackage(source, target, options = {}) {
    const compiler = new YiphthachlCompiler({ ...options, target });
    return await compiler.buildNative(source);
}

/**
 * Get native compilation requirements for a target
 * @param {string} target - The target platform
 * @returns {Promise<object>}
 */
export async function getNativeRequirements(target) {
    const { NativeCompiler } = await import('../native-compiler/index.js');
    return NativeCompiler.getRequirements(target);
}

// Re-export components
export { Tokenizer, Token, TokenType } from './tokenizer.js';
export { Parser, ParseError } from './parser.js';
export { WebGenerator } from './web-generator.js';
export * as AST from './ast-nodes.js';

// Export compile targets enum
export { CompileTarget };
