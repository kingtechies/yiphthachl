# 🚀 Yiphthachl - The Plain English Flutter

> **Build apps by writing English, not code.**

Yiphthachl is a revolutionary programming language that brings Flutter's power to the browser with **plain English syntax**. Instead of learning complex programming syntax, users write natural English commands to build beautiful, cross-platform applications.

## ✨ Features

- **🗣️ Plain English Syntax** - Write code as you speak
- **📱 Flutter-like Widgets** - Familiar widget system for Flutter developers
- **🖥️ Browser Runtime** - Apps run directly in the browser
- **🎨 Beautiful by Default** - Premium styling out of the box
- **📦 Device Emulators** - Preview on iPhone, Android, and desktop
- **⚡ Hot Reload** - See changes instantly
- **🎯 Zero Learning Curve** - If you can write English, you can code

## 🚀 Quick Start

### Installation

```bash
npm install
npm run dev
```

This will start the development server and open the Yiphthachl IDE in your browser.

### Your First App

```yiphthachl
# Hello World App
create an app called "My First App"

on the main screen
    use a scaffold with
        a title bar that says "Hello"
        
        in the body
            put a column with
                a text that says "Hello, World!"
                    make it bold
                    make the size 24
                    color it blue
                
                add some space of 20
                
                a button that says "Click Me"
                    when pressed, show message "Hello!"
            end column
        end body
    end scaffold
end screen
```

## 📚 Language Guide

### Variables

```yiphthachl
set my name to "John"
set the counter to 0
set is logged in to true
set prices to [10, 20, 30]
```

### State (Reactive)

```yiphthachl
remember counter as 0

when the button is pressed
    add 1 to counter
    update the screen
end when
```

### Conditionals

```yiphthachl
if the counter is greater than 10
    show message "Counter is big!"
otherwise if the counter equals 5
    show message "Counter is five"
otherwise
    show message "Counter is small"
end if
```

### Loops

```yiphthachl
repeat 10 times
    add 1 to the counter
end repeat

for each item in my list
    show the item
end for

while the counter is less than 100
    add 1 to the counter
end while
```

### Functions

```yiphthachl
give function called "greet user" that takes a name
    show message "Hello, " followed by the name
end function

do greet user with "Alice"
```

### UI Widgets

```yiphthachl
# Layout
a column with ... end column
a row with ... end row
in the center ... end center
a container with ... end container

# Content
a text that says "Hello"
a button that says "Click"
an image from "url"
an icon of "star"

# Input
a text field with placeholder "Enter..."
a checkbox
a switch

# Navigation
a scaffold with ... end scaffold
a title bar that says "Title"
a bottom navigation with ... end bottom navigation
```

### Styling

```yiphthachl
a text that says "Styled"
    make it bold
    make the size 24
    color it blue
    make the background purple
    round the corners by 10
```

### Events

```yiphthachl
when pressed, show message "Clicked!"
when changed, update the screen
when submitted, save the data
```

## 🏗️ Project Structure

```
yiphthachl/
├── compiler/           # The Yiphthachl Compiler
│   ├── tokenizer.js    # Lexer/Tokenizer
│   ├── parser.js       # Parser (AST generation)
│   ├── ast-nodes.js    # AST node definitions
│   ├── web-generator.js # Code generation
│   └── index.js        # Compiler entry point
├── runtime/            # Browser Runtime
│   ├── engine.js       # Runtime engine
│   └── widgets/        # Widget system
├── ide/                # Web-based IDE
│   ├── index.html      # IDE entry point
│   ├── styles.css      # IDE styles
│   └── ide.js          # IDE logic
└── examples/           # Example applications
```

## 🎯 Supported Widgets

### Layout
- Container, Column, Row, Stack, Center, Wrap, Flex, Padding, Align

### Input
- TextField, Checkbox, Radio, Switch, Slider, Dropdown, DatePicker

### Display
- Text, Image, Icon, Avatar, Badge, Progress, Spinner, Divider, Chip

### Buttons
- Button, IconButton, FloatingButton, OutlineButton, TextButton

### Navigation
- Scaffold, AppBar, Drawer, BottomNavigation, TabBar

### Lists
- ListView, GridView, ListTile, ExpandableList

### Containers
- Card, Dialog, BottomSheet, Snackbar, Modal

## 📖 Examples

Check out the `examples/` folder for complete example applications:

- **Hello World** - Basic app structure
- **Counter** - State management
- **Todo List** - Lists and user input
- **Profile** - Layout and styling
- **Login** - Forms and validation
- **Weather** - Cards and data display

## 🔧 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## 📜 License

MIT License - Build anything you want!

---

**Made with ❤️ for everyone who ever wanted to code but found it too hard.**
