/**
 * Yiphthachl IDE
 * The web-based development environment for Yiphthachl
 * 
 * Features:
 * - Real-time compilation as you type
 * - Instant error display with line highlighting
 * - Syntax highlighting
 * - Device emulator preview
 * - Hot reload
 */

import { compile } from '../compiler/index.js';

class YiphthachlIDE {
    constructor() {
        this.editor = document.getElementById('code-editor');
        this.lineNumbers = document.getElementById('line-numbers');
        this.previewFrame = document.getElementById('preview-frame');
        this.outputLog = document.getElementById('output-log');
        this.statusCompile = document.getElementById('status-compile');
        this.statusPosition = document.getElementById('status-position');
        this.errorOverlay = null;
        this.errorPanel = null;

        this.compileTimeout = null;
        this.isCompiling = false;
        this.lastSuccessfulHtml = '';
        this.errors = [];

        // Performance tracking
        this.compileCount = 0;
        this.totalCompileTime = 0;

        this.init();
    }

    init() {
        this.createErrorOverlay();
        this.createErrorPanel();
        this.setupEditor();
        this.setupToolbar();
        this.setupDeviceSelector();
        this.setupExamples();
        this.setupResizer();
        this.setupKeyboardShortcuts();

        // Load default code
        this.loadDefaultCode();

        // Initial compile - immediate
        this.compile();

        console.log('✨ Yiphthachl IDE initialized - Real-time compilation enabled');
    }

    /**
     * Create error overlay for inline error highlighting
     */
    createErrorOverlay() {
        this.errorOverlay = document.createElement('div');
        this.errorOverlay.id = 'error-overlay';
        this.errorOverlay.className = 'error-overlay';

        // Insert after editor
        const editorWrapper = this.editor.parentElement;
        editorWrapper.style.position = 'relative';
        editorWrapper.appendChild(this.errorOverlay);

        // Add styles for error overlay
        const style = document.createElement('style');
        style.textContent = `
            .error-overlay {
                position: absolute;
                top: 0;
                left: 60px;
                right: 0;
                bottom: 0;
                pointer-events: none;
                z-index: 1;
                overflow: hidden;
            }
            .error-line {
                position: absolute;
                left: 0;
                right: 0;
                height: 24px;
                background: rgba(239, 68, 68, 0.15);
                border-left: 3px solid #ef4444;
            }
            .error-line::after {
                content: attr(data-error);
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                background: #ef4444;
                color: white;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 11px;
                max-width: 300px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .error-panel {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                max-height: 120px;
                background: linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 1) 100%);
                border-top: 2px solid #ef4444;
                overflow-y: auto;
                z-index: 10;
                display: none;
            }
            .error-panel.visible {
                display: block;
            }
            .error-panel-item {
                padding: 8px 16px;
                display: flex;
                align-items: center;
                gap: 12px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                cursor: pointer;
                transition: background 0.2s;
            }
            .error-panel-item:hover {
                background: rgba(239, 68, 68, 0.2);
            }
            .error-icon {
                color: #ef4444;
                font-size: 16px;
            }
            .error-message {
                flex: 1;
                color: #fca5a5;
                font-size: 13px;
            }
            .error-location {
                color: #94a3b8;
                font-size: 12px;
            }
            .success-indicator {
                position: fixed;
                top: 70px;
                right: 20px;
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 8px 16px;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 8px;
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
                z-index: 1000;
                opacity: 0;
                transform: translateY(-10px);
                transition: all 0.3s ease;
                pointer-events: none;
            }
            .success-indicator.visible {
                opacity: 1;
                transform: translateY(0);
            }
            .line-number-error {
                background: rgba(239, 68, 68, 0.3) !important;
                color: #ef4444 !important;
            }
            @keyframes pulse-error {
                0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                50% { box-shadow: 0 0 0 4px rgba(239, 68, 68, 0); }
            }
            .status-error {
                animation: pulse-error 2s infinite;
            }
        `;
        document.head.appendChild(style);

        // Create success indicator
        this.successIndicator = document.createElement('div');
        this.successIndicator.className = 'success-indicator';
        this.successIndicator.innerHTML = '<span class="material-icons" style="font-size: 16px;">check_circle</span> Compiled';
        document.body.appendChild(this.successIndicator);
    }

    /**
     * Create error panel at bottom of editor
     */
    createErrorPanel() {
        this.errorPanel = document.createElement('div');
        this.errorPanel.id = 'error-panel';
        this.errorPanel.className = 'error-panel';

        const editorWrapper = this.editor.parentElement;
        editorWrapper.appendChild(this.errorPanel);
    }

    /**
     * Show errors inline in the editor
     */
    showErrors(errors) {
        this.errors = errors;
        this.errorOverlay.innerHTML = '';
        this.errorPanel.innerHTML = '';

        // Reset line number highlighting
        const lineNumbersArr = this.lineNumbers.textContent.split('\n');

        if (errors.length === 0) {
            this.errorPanel.classList.remove('visible');
            return;
        }

        this.errorPanel.classList.add('visible');

        errors.forEach((error, index) => {
            const line = error.line || this.extractLineFromError(error.message);
            const lineHeight = 24; // Match CSS line-height

            if (line > 0) {
                // Create line highlight
                const errorLine = document.createElement('div');
                errorLine.className = 'error-line';
                errorLine.style.top = `${(line - 1) * lineHeight}px`;
                errorLine.setAttribute('data-error', error.message.substring(0, 50));
                this.errorOverlay.appendChild(errorLine);
            }

            // Add to error panel
            const item = document.createElement('div');
            item.className = 'error-panel-item';
            item.innerHTML = `
                <span class="material-icons error-icon">error</span>
                <span class="error-message">${this.escapeHtml(error.message)}</span>
                ${line > 0 ? `<span class="error-location">Line ${line}</span>` : ''}
            `;

            // Click to jump to line
            if (line > 0) {
                item.addEventListener('click', () => this.goToLine(line));
            }

            this.errorPanel.appendChild(item);
        });

        // Sync scroll position
        this.errorOverlay.scrollTop = this.editor.scrollTop;
    }

    /**
     * Extract line number from error message
     */
    extractLineFromError(message) {
        const match = message.match(/line\s*(\d+)/i);
        return match ? parseInt(match[1]) : 0;
    }

    /**
     * Navigate to specific line in editor
     */
    goToLine(lineNumber) {
        const lines = this.editor.value.split('\n');
        let charIndex = 0;

        for (let i = 0; i < lineNumber - 1 && i < lines.length; i++) {
            charIndex += lines[i].length + 1;
        }

        this.editor.focus();
        this.editor.setSelectionRange(charIndex, charIndex + (lines[lineNumber - 1]?.length || 0));

        // Scroll to line
        const lineHeight = 24;
        this.editor.scrollTop = (lineNumber - 5) * lineHeight;
    }

    /**
     * Show success indicator briefly
     */
    showSuccessIndicator(duration) {
        this.successIndicator.querySelector('span:last-child').textContent = ` Compiled in ${duration}ms`;
        this.successIndicator.classList.add('visible');

        setTimeout(() => {
            this.successIndicator.classList.remove('visible');
        }, 2000);
    }

    /**
     * Escape HTML for safe display
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setupEditor() {
        // Line numbers
        this.updateLineNumbers();

        // Real-time compilation on input - fast debounce
        this.editor.addEventListener('input', () => {
            this.updateLineNumbers();
            this.scheduleCompile();
        });

        // Sync scroll
        this.editor.addEventListener('scroll', () => {
            this.lineNumbers.scrollTop = this.editor.scrollTop;
            if (this.errorOverlay) {
                this.errorOverlay.scrollTop = this.editor.scrollTop;
            }
        });

        this.editor.addEventListener('keydown', (e) => {
            // Tab handling
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.editor.selectionStart;
                const end = this.editor.selectionEnd;
                const value = this.editor.value;

                this.editor.value = value.substring(0, start) + '    ' + value.substring(end);
                this.editor.selectionStart = this.editor.selectionEnd = start + 4;

                this.updateLineNumbers();
                this.scheduleCompile();
            }
        });

        // Cursor position tracking
        this.editor.addEventListener('click', () => this.updateCursorPosition());
        this.editor.addEventListener('keyup', () => this.updateCursorPosition());
    }

    setupToolbar() {
        // Run button
        document.getElementById('btn-run').addEventListener('click', () => {
            this.compile();
        });

        // Save button
        document.getElementById('btn-save').addEventListener('click', () => {
            this.saveCode();
        });

        // Format button
        document.getElementById('btn-format').addEventListener('click', () => {
            this.formatCode();
        });

        // Examples button
        document.getElementById('btn-examples').addEventListener('click', () => {
            this.showExamplesModal();
        });

        // Docs button
        document.getElementById('btn-docs').addEventListener('click', () => {
            window.open('docs/index.html', '_blank');
        });

        // Refresh preview
        document.getElementById('btn-refresh').addEventListener('click', () => {
            this.compile();
        });

        // Open in new tab
        document.getElementById('btn-open-new').addEventListener('click', () => {
            this.openInNewTab();
        });

        // Output tab
        document.getElementById('tab-output').addEventListener('click', (e) => {
            this.toggleOutput(e.target);
        });
    }

    setupDeviceSelector() {
        const deviceSelect = document.getElementById('device-select');
        const deviceFrame = document.getElementById('device-frame');
        const previewContainer = document.querySelector('.preview-container');

        const deviceProfiles = {
            iphone14: { width: 390, height: 844, class: 'device-phone', name: 'iPhone 14' },
            iphone15pro: { width: 393, height: 852, class: 'device-phone dynamic-island', name: 'iPhone 15 Pro' },
            pixel8: { width: 412, height: 915, class: 'device-phone', name: 'Pixel 8' },
            samsungs24: { width: 412, height: 915, class: 'device-phone', name: 'Galaxy S24' },
            desktop: { width: '100%', height: '100%', class: 'device-desktop', name: 'Desktop' }
        };

        this.currentDevice = 'desktop';

        const updateDeviceScale = () => {
            if (!deviceFrame.classList.contains('device-phone')) return;

            const containerRect = previewContainer.getBoundingClientRect();
            const containerWidth = containerRect.width - 40;
            const containerHeight = containerRect.height - 40;

            const deviceWidth = parseInt(deviceFrame.style.width) + 28;
            const deviceHeight = parseInt(deviceFrame.style.height) + 28;

            const scaleX = containerWidth / deviceWidth;
            const scaleY = containerHeight / deviceHeight;
            const scale = Math.min(scaleX, scaleY, 1);

            deviceFrame.style.setProperty('--device-scale', scale.toFixed(3));
            deviceFrame.classList.add('scale-fit');
        };

        deviceSelect.addEventListener('change', () => {
            const profile = deviceProfiles[deviceSelect.value];
            this.currentDevice = deviceSelect.value;

            deviceFrame.className = `device-frame ${profile.class}`;
            deviceFrame.classList.remove('scale-fit');

            if (profile.class.includes('device-phone')) {
                deviceFrame.style.width = `${profile.width}px`;
                deviceFrame.style.height = `${profile.height}px`;
                requestAnimationFrame(() => {
                    updateDeviceScale();
                });
            } else {
                deviceFrame.style.width = profile.width;
                deviceFrame.style.height = profile.height;
                deviceFrame.style.removeProperty('--device-scale');
            }
        });

        // Rotate button
        document.getElementById('btn-rotate').addEventListener('click', () => {
            if (deviceFrame.classList.contains('device-phone')) {
                const width = deviceFrame.style.width;
                deviceFrame.style.width = deviceFrame.style.height;
                deviceFrame.style.height = width;
                requestAnimationFrame(() => {
                    updateDeviceScale();
                });
            }
        });

        // Re-scale on window resize
        window.addEventListener('resize', () => {
            if (deviceFrame.classList.contains('device-phone')) {
                updateDeviceScale();
            }
        });

        // Initial scale
        requestAnimationFrame(() => {
            if (deviceFrame.classList.contains('device-phone')) {
                updateDeviceScale();
            }
        });
    }

    setupExamples() {
        const examples = [
            {
                id: 'hello-world',
                icon: 'waving_hand',
                title: 'Hello World',
                description: 'The simplest Yiphthachl app',
                code: `# Hello World App
create an app called "Hello World"

on the main screen
    use a scaffold with
        a title bar that says "Welcome"
        
        in the body
            put a column with
                a text that says "Hello, World!"
                    make it bold
                    make the size 24
                    color it blue
                
                add some space of 20
                
                a button that says "Click Me"
                    when pressed, show message "Hello from Yiphthachl!"
            end column
        end body
    end scaffold
end screen`
            },
            {
                id: 'counter',
                icon: 'pin',
                title: 'Counter App',
                description: 'A simple counter with state',
                code: `# Counter App
create an app called "Counter"

remember counter as 0

on the main screen
    use a scaffold with
        a title bar that says "Counter"
        
        in the body
            put a column with
                a text that says "Count:"
                    make the size 18
                
                a text that says the counter
                    make it bold
                    make the size 48
                    color it purple
                
                add some space of 24
                
                a row with
                    a button that says "-"
                        when pressed
                            subtract 1 from counter
                        end when
                    
                    add some space of 16
                    
                    a button that says "+"
                        when pressed
                            add 1 to counter
                        end when
                end row
            end column
        end body
    end scaffold
end screen`
            },
            {
                id: 'calculator',
                icon: 'calculate',
                title: 'Calculator',
                description: 'A simple calculator app',
                code: `# Calculator App
create an app called "Calculator"

remember display as "0"

on the main screen
    use a scaffold with
        a title bar that says "Calculator"
            make the background dark gray
        
        in the body
            put a column with
                a container with
                    make the background black
                    make the padding 20
                    
                    a text that says display
                        make the size 48
                        make it bold
                        color it white
                end container
                
                add some space of 16
                
                a row with
                    a button that says "7"
                    a button that says "8"
                    a button that says "9"
                    a button that says "÷"
                        make the background orange
                end row
                
                a row with
                    a button that says "4"
                    a button that says "5"
                    a button that says "6"
                    a button that says "×"
                        make the background orange
                end row
                
                a row with
                    a button that says "1"
                    a button that says "2"
                    a button that says "3"
                    a button that says "-"
                        make the background orange
                end row
                
                a row with
                    a button that says "0"
                    a button that says "C"
                    a button that says "="
                        make the background orange
                    a button that says "+"
                        make the background orange
                end row
            end column
        end body
    end scaffold
end screen`
            },
            {
                id: 'profile',
                icon: 'person',
                title: 'Profile Screen',
                description: 'A user profile layout',
                code: `# Profile Screen
create an app called "Profile"

on the main screen
    use a scaffold with
        a title bar that says "My Profile"
        
        in the body
            put a column with
                in the center
                    an image from "https://i.pravatar.cc/150"
                        make the width 150
                        make the height 150
                        round the corners by 75
                end center
                
                add some space of 24
                
                a text that says "John Doe"
                    make it bold
                    make the size 24
                    align center
                
                a text that says "Software Engineer"
                    color it gray
                    align center
                
                add some space of 32
                
                a card with
                    a row with
                        an icon of "email"
                        add some space of 12
                        a text that says "john@example.com"
                    end row
                end card
                
                add some space of 12
                
                a card with
                    a row with
                        an icon of "phone"
                        add some space of 12
                        a text that says "+1 234 567 8900"
                    end row
                end card
            end column
        end body
        
        a bottom navigation with
            an item called "Home" with icon "home"
            an item called "Profile" with icon "person"
            an item called "Settings" with icon "settings"
        end bottom navigation
    end scaffold
end screen`
            },
            {
                id: 'login',
                icon: 'lock',
                title: 'Login Form',
                description: 'A login screen with inputs',
                code: `# Login Screen
create an app called "Login"

on the main screen
    use a scaffold with
        in the body
            put a column with
                add some space of 48
                
                a text that says "Welcome Back"
                    make it bold
                    make the size 32
                
                a text that says "Sign in to continue"
                    color it gray
                
                add some space of 48
                
                a text field
                    with placeholder "Email"
                
                add some space of 16
                
                a text field
                    with placeholder "Password"
                    make it a password field
                
                add some space of 24
                
                a button that says "Sign In"
                    make the width 100%
                    when pressed
                        show message "Signing in..."
                    end when
                
                add some space of 16
                
                a text that says "Forgot password?"
                    color it blue
                    align center
            end column
        end body
    end scaffold
end screen`
            },
            {
                id: 'weather',
                icon: 'wb_sunny',
                title: 'Weather Card',
                description: 'A weather information card',
                code: `# Weather App
create an app called "Weather"

on the main screen
    use a scaffold with
        a title bar that says "Weather"
        
        in the body
            put a column with
                a card with
                    a column with
                        a row with
                            an icon of "location_on"
                            a text that says "New York, NY"
                        end row
                        
                        add some space of 16
                        
                        a text that says "72°"
                            make it bold
                            make the size 64
                        
                        a text that says "Partly Cloudy"
                            make the size 18
                            color it gray
                        
                        add some space of 24
                        
                        a row with
                            a column with
                                a text that says "Humidity"
                                    color it gray
                                a text that says "65%"
                                    make it bold
                            end column
                            
                            a column with
                                a text that says "Wind"
                                    color it gray
                                a text that says "12 mph"
                                    make it bold
                            end column
                            
                            a column with
                                a text that says "UV Index"
                                    color it gray
                                a text that says "3"
                                    make it bold
                            end column
                        end row
                    end column
                end card
            end column
        end body
    end scaffold
end screen`
            }
        ];

        const grid = document.getElementById('examples-grid');

        examples.forEach(example => {
            const card = document.createElement('div');
            card.className = 'example-card';
            card.innerHTML = `
                <div class="example-card-icon"><span class="material-icons">${example.icon}</span></div>
                <div class="example-card-title">${example.title}</div>
                <div class="example-card-desc">${example.description}</div>
            `;

            card.addEventListener('click', () => {
                this.editor.value = example.code;
                this.updateLineNumbers();
                this.compile();
                this.hideExamplesModal();
            });

            grid.appendChild(card);
        });

        // Close modal
        document.getElementById('close-examples').addEventListener('click', () => {
            this.hideExamplesModal();
        });

        document.querySelector('.modal-backdrop').addEventListener('click', () => {
            this.hideExamplesModal();
        });
    }

    setupResizer() {
        const resizer = document.getElementById('resize-handle');
        const editorPanel = document.querySelector('.ide-editor-panel');
        const previewPanel = document.querySelector('.ide-preview-panel');

        let isResizing = false;

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.style.cursor = 'col-resize';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const containerWidth = document.querySelector('.ide-main').offsetWidth;
            const newWidth = e.clientX - editorPanel.offsetLeft;
            const percentage = (newWidth / containerWidth) * 100;

            if (percentage > 20 && percentage < 80) {
                editorPanel.style.flex = `0 0 ${percentage}%`;
                previewPanel.style.flex = `0 0 ${100 - percentage}%`;
            }
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
            document.body.style.cursor = '';
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Enter - Run (force compile)
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.compile();
            }

            // Ctrl+S - Save
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveCode();
            }

            // Escape - Close modals
            if (e.key === 'Escape') {
                this.hideExamplesModal();
            }
        });
    }

    loadDefaultCode() {
        // Try to load from localStorage first
        const savedCode = localStorage.getItem('yiphthachl_code');

        if (savedCode) {
            this.editor.value = savedCode;
        } else {
            this.editor.value = `# Welcome to Yiphthachl!
# The Plain English Flutter

create an app called "My First App"

on the main screen
    use a scaffold with
        a title bar that says "Hello Yiphthachl"
        
        in the body
            put a column with
                a text that says "Welcome to Yiphthachl!"
                    make it bold
                    make the size 24
                    color it purple
                
                add some space of 16
                
                a text that says "Write apps in plain English"
                    color it gray
                
                add some space of 32
                
                a button that says "Get Started"
                    when pressed, show message "Let's build something amazing!"
                    make the background indigo
            end column
        end body
    end scaffold
end screen
`;
        }

        this.updateLineNumbers();
    }

    updateLineNumbers() {
        const lines = this.editor.value.split('\n');
        const numbers = lines.map((_, i) => i + 1).join('\n');
        this.lineNumbers.textContent = numbers;
    }

    updateCursorPosition() {
        const value = this.editor.value;
        const cursorPos = this.editor.selectionStart;

        const lines = value.substring(0, cursorPos).split('\n');
        const line = lines.length;
        const col = lines[lines.length - 1].length + 1;

        this.statusPosition.textContent = `Ln ${line}, Col ${col}`;
    }

    scheduleCompile() {
        if (this.compileTimeout) {
            clearTimeout(this.compileTimeout);
        }

        // Very fast debounce - 150ms for instant feedback
        this.compileTimeout = setTimeout(() => {
            this.compile();
        }, 150);
    }

    compile() {
        if (this.isCompiling) return;

        this.isCompiling = true;
        this.statusCompile.textContent = 'Compiling...';
        this.statusCompile.className = 'status-item status-warning';

        const startTime = performance.now();

        try {
            const source = this.editor.value;
            const result = compile(source, { debug: false });

            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);

            // Track performance
            this.compileCount++;
            this.totalCompileTime += duration;

            if (result.success) {
                // Clear errors
                this.showErrors([]);

                // Update preview
                this.previewFrame.srcdoc = result.output.html;
                this.lastSuccessfulHtml = result.output.html;

                this.statusCompile.textContent = `✓ ${duration}ms`;
                this.statusCompile.className = 'status-item status-success';

                // Show success indicator
                this.showSuccessIndicator(duration);

                this.log(`[OK] Compiled successfully in ${duration}ms`, 'success');
            } else {
                // Show errors inline
                const errors = result.errors.map(e => ({
                    message: e.message,
                    line: e.line || this.extractLineFromError(e.message)
                }));

                this.showErrors(errors);

                this.statusCompile.textContent = `✗ ${errors.length} error${errors.length > 1 ? 's' : ''}`;
                this.statusCompile.className = 'status-item status-error';

                // Keep showing last successful output
                if (this.lastSuccessfulHtml) {
                    // Optionally show preview with error overlay
                }

                this.log(`[ERROR] ${errors.length} error(s) found`, 'error');
            }
        } catch (error) {
            const errorObj = {
                message: error.message,
                line: this.extractLineFromError(error.message)
            };

            this.showErrors([errorObj]);

            this.statusCompile.textContent = '✗ Error';
            this.statusCompile.className = 'status-item status-error';

            this.log(`[ERROR] ${error.message}`, 'error');
        }

        this.isCompiling = false;
    }

    saveCode() {
        localStorage.setItem('yiphthachl_code', this.editor.value);
        this.log('[SAVED] Code saved to browser storage', 'success');
    }

    formatCode() {
        // Basic formatting - indent cleanup
        const lines = this.editor.value.split('\n');
        let formatted = [];
        let indentLevel = 0;

        const increaseIndentKeywords = ['screen', 'scaffold', 'body', 'column', 'row', 'card', 'if', 'for', 'while', 'repeat', 'function', 'when', 'list', 'container'];
        const decreaseIndentKeywords = ['end'];

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
                formatted.push('');
                continue;
            }

            // Check for decrease indent
            if (decreaseIndentKeywords.some(kw => trimmed.toLowerCase().startsWith(kw))) {
                indentLevel = Math.max(0, indentLevel - 1);
            }

            formatted.push('    '.repeat(indentLevel) + trimmed);

            // Check for increase indent
            if (increaseIndentKeywords.some(kw => trimmed.toLowerCase().includes(kw)) &&
                !trimmed.toLowerCase().includes('end')) {
                indentLevel++;
            }
        }

        this.editor.value = formatted.join('\n');
        this.updateLineNumbers();
        this.compile();
        this.log('[FORMAT] Code formatted', 'success');
    }

    openInNewTab() {
        const source = this.editor.value;
        const result = compile(source);

        if (result.success) {
            const blob = new Blob([result.output.html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } else {
            this.log('[ERROR] Cannot open - fix errors first', 'error');
        }
    }

    toggleOutput(tab) {
        const previewContainer = document.getElementById('preview-container');
        const outputContainer = document.getElementById('output-container');
        const tabs = document.querySelectorAll('.panel-tab');

        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        if (tab.id === 'tab-output') {
            previewContainer.style.display = 'none';
            outputContainer.style.display = 'block';
        } else {
            previewContainer.style.display = 'flex';
            outputContainer.style.display = 'none';
        }
    }

    log(message, type = 'info') {
        const entry = document.createElement('div');
        entry.className = `output-log-entry ${type}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        this.outputLog.appendChild(entry);
        this.outputLog.scrollTop = this.outputLog.scrollHeight;
    }

    showExamplesModal() {
        document.getElementById('examples-modal').classList.add('open');
    }

    hideExamplesModal() {
        document.getElementById('examples-modal').classList.remove('open');
    }
}

// Initialize IDE when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.ide = new YiphthachlIDE();
});
