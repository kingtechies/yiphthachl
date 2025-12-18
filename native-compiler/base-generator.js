/**
 * Base Native Generator
 * Abstract base class for all platform-specific generators
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

/**
 * Abstract Base Generator Class
 * Provides common functionality for all native generators
 */
export class BaseNativeGenerator {
    constructor(options) {
        this.options = options;
        this.generatedFiles = [];
        this.warnings = [];
        this.errors = [];
        this.buildLogs = [];
    }

    /**
     * Platform identifier (to be overridden)
     */
    get platform() {
        throw new Error('Platform must be defined in subclass');
    }

    /**
     * File extension for the output package
     */
    get packageExtension() {
        throw new Error('Package extension must be defined in subclass');
    }

    /**
     * Generate native code from AST
     * @param {object} ast - The parsed AST
     * @returns {Promise<object>} - Generation result
     */
    async generate(ast) {
        throw new Error('generate() must be implemented in subclass');
    }

    /**
     * Build the native package
     * @returns {Promise<object>} - Build result
     */
    async build() {
        throw new Error('build() must be implemented in subclass');
    }

    /**
     * Check if required tools are available
     * @returns {Promise<object>} - Environment check result
     */
    async checkEnvironment() {
        throw new Error('checkEnvironment() must be implemented in subclass');
    }

    /**
     * Convert AST to intermediate representation
     * Common transformation layer used by all generators
     * @param {object} ast - The parsed AST
     * @returns {object} - Intermediate representation
     */
    transformToIR(ast) {
        const ir = {
            app: null,
            screens: [],
            widgets: [],
            functions: [],
            state: [],
            styles: {},
            resources: {
                strings: {},
                images: [],
                fonts: []
            }
        };

        for (const statement of ast.statements) {
            this.processStatement(statement, ir);
        }

        return ir;
    }

    /**
     * Process a single AST statement
     * @param {object} statement - AST statement node
     * @param {object} ir - Intermediate representation to populate
     */
    processStatement(statement, ir) {
        switch (statement.type) {
            case 'AppDeclaration':
                ir.app = {
                    name: statement.name,
                    properties: statement.properties || {}
                };
                break;

            case 'ScreenDeclaration':
                ir.screens.push({
                    name: statement.name,
                    isMain: statement.isMain || false,
                    body: this.processBody(statement.body)
                });
                break;

            case 'ScaffoldWidget':
                // Top-level scaffold becomes the main screen
                if (!ir.screens.some(s => s.isMain)) {
                    ir.screens.push({
                        name: 'MainScreen',
                        isMain: true,
                        body: this.processScaffold(statement)
                    });
                }
                break;

            case 'FunctionDeclaration':
                ir.functions.push({
                    name: statement.name,
                    parameters: statement.parameters || [],
                    body: statement.body
                });
                break;

            case 'RememberStatement':
            case 'StateDeclaration':
                ir.state.push({
                    name: statement.name,
                    initialValue: statement.value,
                    type: this.inferType(statement.value)
                });
                break;

            case 'VariableDeclaration':
                // Handle other variable declarations
                if (statement.value && statement.value.type === 'WidgetTree') {
                    ir.widgets.push({
                        name: statement.name,
                        tree: statement.value
                    });
                }
                break;
        }
    }

    /**
     * Process scaffold widget
     * @param {object} scaffold - Scaffold AST node
     * @returns {object} - Processed scaffold
     */
    processScaffold(scaffold) {
        return {
            type: 'Scaffold',
            appBar: scaffold.titleBar || scaffold.appBar,
            body: scaffold.body ? this.processBody(scaffold.body) : null,
            bottomNavigation: scaffold.bottomNavigation,
            floatingActionButton: scaffold.floatingButton
        };
    }

    /**
     * Process body content
     * @param {object} body - Body AST node
     * @returns {object} - Processed body
     */
    processBody(body) {
        if (!body) return null;

        if (Array.isArray(body)) {
            return body.map(item => this.processWidget(item));
        }

        return this.processWidget(body);
    }

    /**
     * Process a widget node
     * @param {object} widget - Widget AST node
     * @returns {object} - Processed widget
     */
    processWidget(widget) {
        if (!widget) return null;

        const processed = {
            type: widget.type,
            properties: {},
            children: [],
            events: []
        };

        // Copy properties
        for (const key of Object.keys(widget)) {
            if (key === 'type') continue;
            if (key === 'children') {
                processed.children = (widget.children || []).map(c => this.processWidget(c));
            } else if (key.startsWith('on') || key === 'whenPressed' || key === 'whenClicked') {
                processed.events.push({
                    name: key,
                    handler: widget[key]
                });
            } else {
                processed.properties[key] = widget[key];
            }
        }

        return processed;
    }

    /**
     * Infer type from value
     * @param {any} value - The value to infer type from
     * @returns {string} - Inferred type
     */
    inferType(value) {
        if (value === null || value === undefined) return 'any';
        if (typeof value === 'string') return 'string';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'boolean') return 'boolean';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object') return 'object';
        return 'any';
    }

    /**
     * Create output directory structure
     * @param {string} baseDir - Base output directory
     */
    async createOutputDirectory(baseDir) {
        await fs.mkdir(baseDir, { recursive: true });
    }

    /**
     * Write file to output
     * @param {string} filePath - File path relative to output dir
     * @param {string} content - File content
     */
    async writeFile(filePath, content) {
        const fullPath = path.join(this.options.outputDir, this.platform, filePath);
        const dir = path.dirname(fullPath);

        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(fullPath, content, 'utf8');

        this.generatedFiles.push(fullPath);
    }

    /**
     * Execute a shell command
     * @param {string} command - Command to execute
     * @param {string} cwd - Working directory
     * @returns {Promise<{stdout: string, stderr: string}>}
     */
    async executeCommand(command, cwd = null) {
        const options = cwd ? { cwd } : {};

        if (this.options.debug) {
            console.log(`📌 Executing: ${command}`);
        }

        try {
            const result = await execAsync(command, options);
            this.buildLogs.push(`✓ ${command}`);
            return result;
        } catch (error) {
            this.buildLogs.push(`✗ ${command}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Check if a command exists
     * @param {string} command - Command to check
     * @returns {Promise<boolean>}
     */
    async commandExists(command) {
        try {
            const checkCmd = process.platform === 'win32'
                ? `where ${command}`
                : `which ${command}`;
            await execAsync(checkCmd);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Copy resource file
     * @param {string} source - Source path
     * @param {string} destination - Destination path
     */
    async copyResource(source, destination) {
        const destPath = path.join(this.options.outputDir, this.platform, destination);
        const destDir = path.dirname(destPath);

        await fs.mkdir(destDir, { recursive: true });
        await fs.copyFile(source, destPath);

        this.generatedFiles.push(destPath);
    }

    /**
     * Generate resource strings file
     * @param {object} strings - String resources
     * @returns {string} - Formatted strings content
     */
    generateStringsResource(strings) {
        // To be overridden by platform-specific generators
        return JSON.stringify(strings, null, 2);
    }

    /**
     * Sanitize identifier for native code
     * @param {string} name - Name to sanitize
     * @returns {string} - Sanitized name
     */
    sanitizeIdentifier(name) {
        return name
            .replace(/[^a-zA-Z0-9_]/g, '_')
            .replace(/^[0-9]/, '_$&')
            .replace(/__+/g, '_');
    }

    /**
     * Convert color to native format
     * @param {string} color - CSS color string
     * @returns {object} - Platform-specific color representation
     */
    parseColor(color) {
        // Handle hex colors
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            if (hex.length === 3) {
                return {
                    r: parseInt(hex[0] + hex[0], 16),
                    g: parseInt(hex[1] + hex[1], 16),
                    b: parseInt(hex[2] + hex[2], 16),
                    a: 255
                };
            } else if (hex.length === 6) {
                return {
                    r: parseInt(hex.slice(0, 2), 16),
                    g: parseInt(hex.slice(2, 4), 16),
                    b: parseInt(hex.slice(4, 6), 16),
                    a: 255
                };
            } else if (hex.length === 8) {
                return {
                    r: parseInt(hex.slice(0, 2), 16),
                    g: parseInt(hex.slice(2, 4), 16),
                    b: parseInt(hex.slice(4, 6), 16),
                    a: parseInt(hex.slice(6, 8), 16)
                };
            }
        }

        // Handle named colors
        const namedColors = {
            'red': { r: 255, g: 0, b: 0, a: 255 },
            'green': { r: 0, g: 128, b: 0, a: 255 },
            'blue': { r: 0, g: 0, b: 255, a: 255 },
            'white': { r: 255, g: 255, b: 255, a: 255 },
            'black': { r: 0, g: 0, b: 0, a: 255 },
            'purple': { r: 128, g: 0, b: 128, a: 255 },
            'orange': { r: 255, g: 165, b: 0, a: 255 },
            'yellow': { r: 255, g: 255, b: 0, a: 255 },
            'gray': { r: 128, g: 128, b: 128, a: 255 },
            'grey': { r: 128, g: 128, b: 128, a: 255 },
            'pink': { r: 255, g: 192, b: 203, a: 255 },
            'transparent': { r: 0, g: 0, b: 0, a: 0 }
        };

        return namedColors[color.toLowerCase()] || { r: 0, g: 0, b: 0, a: 255 };
    }

    /**
     * Add a warning
     * @param {string} message - Warning message
     */
    warn(message) {
        this.warnings.push(message);
        if (this.options.debug) {
            console.warn(`⚠️ ${message}`);
        }
    }

    /**
     * Add an error
     * @param {string} message - Error message
     */
    error(message) {
        this.errors.push(new Error(message));
        if (this.options.debug) {
            console.error(`❌ ${message}`);
        }
    }
}

export default BaseNativeGenerator;
