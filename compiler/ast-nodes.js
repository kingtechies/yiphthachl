/**
 * Yiphthachl AST (Abstract Syntax Tree) Node Types
 * Represents the structure of parsed Yiphthachl programs
 */

// Base AST Node
export class ASTNode {
    constructor(type, location = null) {
        this.type = type;
        this.location = location; // { line, column }
    }
}

// ==================== PROGRAM ====================

export class ProgramNode extends ASTNode {
    constructor(statements = []) {
        super('Program');
        this.statements = statements;
    }
}

// ==================== APP & SCREENS ====================

export class AppDeclarationNode extends ASTNode {
    constructor(name, screens = [], config = {}) {
        super('AppDeclaration');
        this.name = name;
        this.screens = screens;
        this.config = config;
    }
}

export class ScreenNode extends ASTNode {
    constructor(name, body = [], isMain = false) {
        super('Screen');
        this.name = name;
        this.body = body;
        this.isMain = isMain;
    }
}

// ==================== VARIABLES ====================

export class VariableDeclarationNode extends ASTNode {
    constructor(name, value, isState = false) {
        super('VariableDeclaration');
        this.name = name;
        this.value = value;
        this.isState = isState; // true for "remember" (reactive state)
    }
}

export class VariableReferenceNode extends ASTNode {
    constructor(name) {
        super('VariableReference');
        this.name = name;
    }
}

export class AssignmentNode extends ASTNode {
    constructor(target, value) {
        super('Assignment');
        this.target = target;
        this.value = value;
    }
}

// ==================== LITERALS ====================

export class StringLiteralNode extends ASTNode {
    constructor(value) {
        super('StringLiteral');
        this.value = value;
    }
}

export class NumberLiteralNode extends ASTNode {
    constructor(value) {
        super('NumberLiteral');
        this.value = value;
    }
}

export class BooleanLiteralNode extends ASTNode {
    constructor(value) {
        super('BooleanLiteral');
        this.value = value;
    }
}

export class ArrayLiteralNode extends ASTNode {
    constructor(elements = []) {
        super('ArrayLiteral');
        this.elements = elements;
    }
}

export class ObjectLiteralNode extends ASTNode {
    constructor(properties = {}) {
        super('ObjectLiteral');
        this.properties = properties;
    }
}

export class ColorLiteralNode extends ASTNode {
    constructor(value) {
        super('ColorLiteral');
        this.value = value; // hex color
    }
}

// ==================== EXPRESSIONS ====================

export class BinaryExpressionNode extends ASTNode {
    constructor(operator, left, right) {
        super('BinaryExpression');
        this.operator = operator;
        this.left = left;
        this.right = right;
    }
}

export class UnaryExpressionNode extends ASTNode {
    constructor(operator, operand) {
        super('UnaryExpression');
        this.operator = operator;
        this.operand = operand;
    }
}

export class LogicalExpressionNode extends ASTNode {
    constructor(operator, left, right) {
        super('LogicalExpression');
        this.operator = operator; // 'and', 'or'
        this.left = left;
        this.right = right;
    }
}

export class ComparisonExpressionNode extends ASTNode {
    constructor(operator, left, right) {
        super('ComparisonExpression');
        this.operator = operator; // 'equals', 'greaterThan', etc.
        this.left = left;
        this.right = right;
    }
}

// ==================== FUNCTIONS ====================

export class FunctionDeclarationNode extends ASTNode {
    constructor(name, parameters = [], body = [], returnType = null) {
        super('FunctionDeclaration');
        this.name = name;
        this.parameters = parameters;
        this.body = body;
        this.returnType = returnType;
    }
}

export class FunctionCallNode extends ASTNode {
    constructor(name, args = []) {
        super('FunctionCall');
        this.name = name;
        this.arguments = args;
    }
}

export class ReturnNode extends ASTNode {
    constructor(value = null) {
        super('Return');
        this.value = value;
    }
}

// ==================== CONTROL FLOW ====================

export class IfStatementNode extends ASTNode {
    constructor(condition, consequent = [], alternate = null) {
        super('IfStatement');
        this.condition = condition;
        this.consequent = consequent; // statements if true
        this.alternate = alternate; // else block or else-if node
    }
}

export class WhileLoopNode extends ASTNode {
    constructor(condition, body = []) {
        super('WhileLoop');
        this.condition = condition;
        this.body = body;
    }
}

export class ForLoopNode extends ASTNode {
    constructor(iteratorName, iterable, body = []) {
        super('ForLoop');
        this.iteratorName = iteratorName;
        this.iterable = iterable;
        this.body = body;
    }
}

export class RepeatLoopNode extends ASTNode {
    constructor(count, body = []) {
        super('RepeatLoop');
        this.count = count;
        this.body = body;
    }
}

// ==================== UI WIDGETS ====================

export class WidgetNode extends ASTNode {
    constructor(widgetType, props = {}, children = [], styles = {}, events = {}) {
        super('Widget');
        this.widgetType = widgetType;
        this.props = props;
        this.children = children;
        this.styles = styles;
        this.events = events;
    }
}

export class ScaffoldNode extends ASTNode {
    constructor(appBar = null, body = null, bottomNav = null, drawer = null, floatingButton = null) {
        super('Scaffold');
        this.appBar = appBar;
        this.body = body;
        this.bottomNav = bottomNav;
        this.drawer = drawer;
        this.floatingButton = floatingButton;
    }
}

export class AppBarNode extends ASTNode {
    constructor(title, leading = null, actions = [], styles = {}) {
        super('AppBar');
        this.title = title;
        this.leading = leading;
        this.actions = actions;
        this.styles = styles;
    }
}

export class TextNode extends ASTNode {
    constructor(content, styles = {}) {
        super('Text');
        this.content = content;
        this.styles = styles;
    }
}

export class ButtonNode extends ASTNode {
    constructor(label, onPressed = null, styles = {}) {
        super('Button');
        this.label = label;
        this.onPressed = onPressed;
        this.styles = styles;
    }
}

export class ImageNode extends ASTNode {
    constructor(source, alt = '', styles = {}) {
        super('Image');
        this.source = source;
        this.alt = alt;
        this.styles = styles;
    }
}

export class ContainerNode extends ASTNode {
    constructor(children = [], styles = {}) {
        super('Container');
        this.children = children;
        this.styles = styles;
    }
}

export class ColumnNode extends ASTNode {
    constructor(children = [], alignment = 'start', styles = {}) {
        super('Column');
        this.children = children;
        this.alignment = alignment;
        this.styles = styles;
    }
}

export class RowNode extends ASTNode {
    constructor(children = [], alignment = 'start', styles = {}) {
        super('Row');
        this.children = children;
        this.alignment = alignment;
        this.styles = styles;
    }
}

export class CenterNode extends ASTNode {
    constructor(child, styles = {}) {
        super('Center');
        this.child = child;
        this.styles = styles;
    }
}

export class SpacerNode extends ASTNode {
    constructor(size = 16) {
        super('Spacer');
        this.size = size;
    }
}

export class IconNode extends ASTNode {
    constructor(name, size = 24, color = null) {
        super('Icon');
        this.name = name;
        this.size = size;
        this.color = color;
    }
}

export class TextFieldNode extends ASTNode {
    constructor(placeholder = '', value = null, onChange = null, styles = {}) {
        super('TextField');
        this.placeholder = placeholder;
        this.value = value;
        this.onChange = onChange;
        this.styles = styles;
    }
}

export class ListViewNode extends ASTNode {
    constructor(items = [], itemRenderer = null, styles = {}) {
        super('ListView');
        this.items = items;
        this.itemRenderer = itemRenderer;
        this.styles = styles;
    }
}

export class GridViewNode extends ASTNode {
    constructor(items = [], columns = 2, itemRenderer = null, styles = {}) {
        super('GridView');
        this.items = items;
        this.columns = columns;
        this.itemRenderer = itemRenderer;
        this.styles = styles;
    }
}

export class CardNode extends ASTNode {
    constructor(children = [], styles = {}) {
        super('Card');
        this.children = children;
        this.styles = styles;
    }
}

export class BottomNavigationNode extends ASTNode {
    constructor(items = [], selectedIndex = 0, onSelect = null) {
        super('BottomNavigation');
        this.items = items;
        this.selectedIndex = selectedIndex;
        this.onSelect = onSelect;
    }
}

export class BottomNavItemNode extends ASTNode {
    constructor(label, icon, onSelect = null) {
        super('BottomNavItem');
        this.label = label;
        this.icon = icon;
        this.onSelect = onSelect;
    }
}

// ==================== EVENTS & ACTIONS ====================

export class EventHandlerNode extends ASTNode {
    constructor(eventType, target, actions = []) {
        super('EventHandler');
        this.eventType = eventType; // 'onPressed', 'onChange', etc.
        this.target = target;
        this.actions = actions;
    }
}

export class ShowMessageNode extends ASTNode {
    constructor(message) {
        super('ShowMessage');
        this.message = message;
    }
}

export class NavigateNode extends ASTNode {
    constructor(screenName, params = null) {
        super('Navigate');
        this.screenName = screenName;
        this.params = params;
    }
}

export class GoBackNode extends ASTNode {
    constructor() {
        super('GoBack');
    }
}

export class UpdateStateNode extends ASTNode {
    constructor(stateName, newValue) {
        super('UpdateState');
        this.stateName = stateName;
        this.newValue = newValue;
    }
}

// ==================== HTTP/FETCH ====================

export class FetchNode extends ASTNode {
    constructor(url, method = 'GET', body = null, onSuccess = null, onError = null) {
        super('Fetch');
        this.url = url;
        this.method = method;
        this.body = body;
        this.onSuccess = onSuccess;
        this.onError = onError;
    }
}

// ==================== ANIMATION ====================

export class AnimationNode extends ASTNode {
    constructor(target, animations = [], duration = 300, curve = 'ease') {
        super('Animation');
        this.target = target;
        this.animations = animations;
        this.duration = duration;
        this.curve = curve;
    }
}

// ==================== STATE WATCHING ====================

export class WheneverNode extends ASTNode {
    constructor(stateVariable, body = []) {
        super('Whenever');
        this.stateVariable = stateVariable;
        this.body = body;
    }
}

// ==================== STYLE MODIFIER ====================

export class StyleModifierNode extends ASTNode {
    constructor(property, value) {
        super('StyleModifier');
        this.property = property;
        this.value = value;
    }
}

// ==================== COMMENTS ====================

export class CommentNode extends ASTNode {
    constructor(text) {
        super('Comment');
        this.text = text;
    }
}
