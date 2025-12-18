/**
 * Yiphthachl IDE
 * The web-based development environment for Yiphthachl
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

        this.compileTimeout = null;
        this.isCompiling = false;

        this.init();
    }

    init() {
        this.setupEditor();
        this.setupToolbar();
        this.setupDeviceSelector();
        this.setupExamples();
        this.setupResizer();
        this.setupKeyboardShortcuts();

        // Load default code
        this.loadDefaultCode();

        // Initial compile
        this.scheduleCompile();

        console.log('🚀 Yiphthachl IDE initialized');
    }

    setupEditor() {
        // Line numbers
        this.updateLineNumbers();

        // Editor events
        this.editor.addEventListener('input', () => {
            this.updateLineNumbers();
            this.scheduleCompile();
        });

        this.editor.addEventListener('scroll', () => {
            this.lineNumbers.scrollTop = this.editor.scrollTop;
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

        const deviceProfiles = {
            iphone14: { width: 390, height: 844, class: 'device-phone' },
            iphone15pro: { width: 393, height: 852, class: 'device-phone' },
            pixel8: { width: 412, height: 915, class: 'device-phone' },
            samsungs24: { width: 412, height: 915, class: 'device-phone' },
            desktop: { width: '100%', height: '100%', class: 'device-desktop' }
        };

        deviceSelect.addEventListener('change', () => {
            const profile = deviceProfiles[deviceSelect.value];

            deviceFrame.className = `device-frame ${profile.class}`;

            if (profile.class === 'device-phone') {
                deviceFrame.style.width = `${profile.width}px`;
                deviceFrame.style.height = `${profile.height}px`;
            } else {
                deviceFrame.style.width = profile.width;
                deviceFrame.style.height = profile.height;
            }
        });

        // Rotate button
        document.getElementById('btn-rotate').addEventListener('click', () => {
            if (deviceFrame.classList.contains('device-phone')) {
                const width = deviceFrame.style.width;
                deviceFrame.style.width = deviceFrame.style.height;
                deviceFrame.style.height = width;
            }
        });
    }

    setupExamples() {
        const examples = [
            {
                id: 'hello-world',
                icon: '👋',
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
                icon: '🔢',
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
                id: 'todo-list',
                icon: '✅',
                title: 'Todo List',
                description: 'A task management app',
                code: `# Todo List App
create an app called "My Tasks"

remember tasks as an empty list

on the main screen
    use a scaffold with
        a title bar that says "My Tasks"
        
        in the body
            put a column with
                a text field
                    with placeholder "Add a new task..."
                
                add some space of 16
                
                a button that says "Add Task"
                    when pressed
                        add the task to tasks
                        update the screen
                    end when
                
                add some space of 24
                
                show a list of items from tasks
                    for each task
                        a card with
                            a text that says the task
                        end card
                    end for
                end list
            end column
        end body
    end scaffold
end screen`
            },
            {
                id: 'profile',
                icon: '👤',
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
                icon: '🔐',
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
                icon: '🌤️',
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
                <div class="example-card-icon">${example.icon}</div>
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
            // Ctrl+Enter - Run
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
            this.editor.value = `# Welcome to Yiphthachl! 🚀
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

        this.compileTimeout = setTimeout(() => {
            this.compile();
        }, 500);
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

            if (result.success) {
                // Update preview
                this.previewFrame.srcdoc = result.output.html;

                this.statusCompile.textContent = `Compiled in ${duration}ms`;
                this.statusCompile.className = 'status-item status-success';

                this.log(`✅ Compiled successfully in ${duration}ms`, 'success');
            } else {
                const errorMsg = result.errors.map(e => e.message).join('\n');

                this.statusCompile.textContent = 'Compile Error';
                this.statusCompile.className = 'status-item status-error';

                this.log(`❌ Compile error: ${errorMsg}`, 'error');
            }
        } catch (error) {
            this.statusCompile.textContent = 'Error';
            this.statusCompile.className = 'status-item status-error';

            this.log(`❌ Error: ${error.message}`, 'error');
        }

        this.isCompiling = false;
    }

    saveCode() {
        localStorage.setItem('yiphthachl_code', this.editor.value);
        this.log('💾 Code saved to browser storage', 'success');
    }

    formatCode() {
        // Basic formatting - indent cleanup
        const lines = this.editor.value.split('\n');
        let formatted = [];
        let indentLevel = 0;

        const increaseIndentKeywords = ['screen', 'scaffold', 'body', 'column', 'row', 'card', 'if', 'for', 'while', 'repeat', 'function', 'when', 'list'];
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
        this.log('🪄 Code formatted', 'success');
    }

    openInNewTab() {
        const source = this.editor.value;
        const result = compile(source);

        if (result.success) {
            const blob = new Blob([result.output.html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
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
