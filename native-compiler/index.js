/**
 * Yiphthachl Native Compiler
 * Generates native applications from Yiphthachl source code
 * 
 * Supports:
 * - Android (APK)
 * - iOS (IPA)
 * - Windows (EXE)
 * - macOS (APP)
 */

import { AndroidGenerator } from './android/generator.js';
import { IOSGenerator } from './ios/generator.js';
import { WindowsGenerator } from './windows/generator.js';
import { MacOSGenerator } from './macos/generator.js';

/**
 * Native Compiler Configuration
 */
export const NativeTarget = {
    ANDROID: 'android',
    IOS: 'ios',
    WINDOWS: 'windows',
    MACOS: 'macos'
};

/**
 * Native Compiler Class
 * Orchestrates the generation of native applications
 */
export class NativeCompiler {
    constructor(options = {}) {
        this.options = {
            target: NativeTarget.ANDROID,
            appName: 'YiphthachlApp',
            bundleId: 'com.yiphthachl.app',
            version: '1.0.0',
            buildNumber: 1,
            icon: null,
            splash: null,
            permissions: [],
            debug: false,
            minify: true,
            outputDir: './build',
            ...options
        };

        // Initialize generators
        this.generators = {
            [NativeTarget.ANDROID]: new AndroidGenerator(this.options),
            [NativeTarget.IOS]: new IOSGenerator(this.options),
            [NativeTarget.WINDOWS]: new WindowsGenerator(this.options),
            [NativeTarget.MACOS]: new MacOSGenerator(this.options)
        };
    }

    /**
     * Compile AST to native application
     * @param {object} ast - The parsed AST from Yiphthachl source
     * @returns {Promise<{success: boolean, output: object, errors: Error[]}>}
     */
    async compile(ast) {
        const result = {
            success: false,
            output: null,
            errors: [],
            warnings: [],
            generatedFiles: []
        };

        try {
            const target = this.options.target;
            const generator = this.generators[target];

            if (!generator) {
                throw new Error(`Unsupported native target: ${target}`);
            }

            if (this.options.debug) {
                console.log(`🔧 Generating ${target.toUpperCase()} application...`);
            }

            // Generate native code
            const genResult = await generator.generate(ast);

            result.output = genResult.output;
            result.generatedFiles = genResult.files;
            result.warnings = genResult.warnings || [];

            if (genResult.errors && genResult.errors.length > 0) {
                result.errors = genResult.errors;
                return result;
            }

            if (this.options.debug) {
                console.log(`✅ Generated ${result.generatedFiles.length} files`);
            }

            result.success = true;

        } catch (error) {
            result.errors.push(error);
        }

        return result;
    }

    /**
     * Build the native application package
     * @param {object} ast - The parsed AST from Yiphthachl source
     * @returns {Promise<{success: boolean, packagePath: string, errors: Error[]}>}
     */
    async build(ast) {
        const result = {
            success: false,
            packagePath: null,
            errors: [],
            logs: []
        };

        try {
            // First compile
            const compileResult = await this.compile(ast);

            if (!compileResult.success) {
                result.errors = compileResult.errors;
                return result;
            }

            // Then build package
            const target = this.options.target;
            const generator = this.generators[target];

            if (this.options.debug) {
                console.log(`📦 Building ${target.toUpperCase()} package...`);
            }

            const buildResult = await generator.build();

            result.packagePath = buildResult.path;
            result.logs = buildResult.logs || [];

            if (buildResult.errors && buildResult.errors.length > 0) {
                result.errors = buildResult.errors;
                return result;
            }

            if (this.options.debug) {
                console.log(`✅ Package built: ${result.packagePath}`);
            }

            result.success = true;

        } catch (error) {
            result.errors.push(error);
        }

        return result;
    }

    /**
     * Get required SDK/tools for a target
     * @param {string} target - The native target
     * @returns {object} - SDK requirements
     */
    static getRequirements(target) {
        const requirements = {
            [NativeTarget.ANDROID]: {
                sdk: 'Android SDK (API 21+)',
                tools: ['Java JDK 11+', 'Android Build Tools', 'Gradle'],
                optional: ['Android Emulator'],
                installUrl: 'https://developer.android.com/studio'
            },
            [NativeTarget.IOS]: {
                sdk: 'Xcode 14+',
                tools: ['iOS SDK', 'CocoaPods', 'Swift 5.5+'],
                optional: ['iOS Simulator'],
                installUrl: 'https://developer.apple.com/xcode/',
                platform: 'macOS only'
            },
            [NativeTarget.WINDOWS]: {
                sdk: 'Windows SDK (10.0.19041+)',
                tools: ['Visual Studio 2022', 'MSVC', '.NET 6+'],
                optional: ['WinUI 3'],
                installUrl: 'https://visualstudio.microsoft.com/'
            },
            [NativeTarget.MACOS]: {
                sdk: 'macOS SDK (11+)',
                tools: ['Xcode 14+', 'Swift 5.5+', 'SwiftUI'],
                optional: [],
                installUrl: 'https://developer.apple.com/xcode/',
                platform: 'macOS only'
            }
        };

        return requirements[target] || null;
    }

    /**
     * Check if required tools are installed
     * @returns {Promise<object>} - Tool availability status
     */
    async checkEnvironment() {
        const target = this.options.target;
        const generator = this.generators[target];
        return await generator.checkEnvironment();
    }
}

/**
 * Convenience function to compile to native
 * @param {object} ast - The parsed AST
 * @param {object} options - Compiler options
 * @returns {Promise<object>} - Compilation result
 */
export async function compileToNative(ast, options = {}) {
    const compiler = new NativeCompiler(options);
    return await compiler.compile(ast);
}

/**
 * Convenience function to build native package
 * @param {object} ast - The parsed AST
 * @param {object} options - Compiler options
 * @returns {Promise<object>} - Build result
 */
export async function buildNativePackage(ast, options = {}) {
    const compiler = new NativeCompiler(options);
    return await compiler.build(ast);
}

export { AndroidGenerator } from './android/generator.js';
export { IOSGenerator } from './ios/generator.js';
export { WindowsGenerator } from './windows/generator.js';
export { MacOSGenerator } from './macos/generator.js';
