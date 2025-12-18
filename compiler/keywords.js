/**
 * Yiphthachl Keywords Dictionary
 * Maps plain English words and phrases to language constructs
 */

// Variable declaration keywords
export const VARIABLE_KEYWORDS = [
  'set', 'let', 'make', 'create', 'define', 'remember', 'store'
];

// Assignment keywords
export const ASSIGNMENT_KEYWORDS = [
  'to', 'as', 'equals', 'be', 'is'
];

// Function declaration keywords
export const FUNCTION_KEYWORDS = [
  'give function', 'create function', 'define function', 'make function'
];

// Function call keywords
export const CALL_KEYWORDS = [
  'do', 'call', 'run', 'execute', 'perform'
];

// Conditional keywords
export const CONDITIONAL_KEYWORDS = {
  if: ['if', 'when', 'in case', 'assuming'],
  else: ['otherwise', 'else', 'or else', 'if not'],
  elseif: ['otherwise if', 'else if', 'or if'],
  end: ['end if', 'end when', 'end condition']
};

// Loop keywords
export const LOOP_KEYWORDS = {
  for: ['for each', 'for every', 'loop through'],
  while: ['while', 'as long as', 'keep doing while'],
  repeat: ['repeat', 'do this'],
  times: ['times', 'iterations'],
  end: ['end repeat', 'end for', 'end while', 'end loop']
};

// Comparison operators
export const COMPARISON_KEYWORDS = {
  equals: ['equals', 'is equal to', 'is the same as', 'matches', 'is', '=='],
  notEquals: ['is not', 'does not equal', 'is different from', '!='],
  greaterThan: ['is greater than', 'is more than', 'exceeds', 'is above', '>'],
  lessThan: ['is less than', 'is fewer than', 'is below', 'is under', '<'],
  greaterOrEqual: ['is at least', 'is greater or equal to', '>='],
  lessOrEqual: ['is at most', 'is less or equal to', '<='],
  and: ['and', 'also', 'as well as', '&&'],
  or: ['or', 'alternatively', '||'],
  not: ['not', 'isnt', "isn't", '!']
};

// Math operation keywords
export const MATH_KEYWORDS = {
  add: ['add', 'plus', 'increase by', '+'],
  subtract: ['subtract', 'minus', 'decrease by', 'take away', '-'],
  multiply: ['multiply', 'times', 'multiplied by', '*'],
  divide: ['divide', 'divided by', 'split by', '/'],
  modulo: ['remainder of', 'modulo', '%']
};

// UI/Widget keywords
export const UI_KEYWORDS = {
  // App creation
  app: ['create an app', 'make an app', 'build an app', 'start an app'],
  
  // Screen/Page
  screen: ['on the screen', 'define screen', 'create screen', 'the main screen'],
  
  // Layout widgets
  scaffold: ['use a scaffold', 'create a scaffold', 'with scaffold'],
  column: ['a column', 'put a column', 'vertical layout', 'stack vertically'],
  row: ['a row', 'put a row', 'horizontal layout', 'stack horizontally'],
  stack: ['a stack', 'overlay', 'put on top'],
  center: ['in the center', 'centered', 'center this'],
  container: ['a container', 'a box', 'wrap in'],
  
  // Content widgets
  text: ['a text', 'some text', 'text that says', 'words that say'],
  button: ['a button', 'clickable button', 'button that says'],
  image: ['an image', 'a picture', 'image from'],
  icon: ['an icon', 'icon of', 'symbol of'],
  
  // Input widgets
  textField: ['a text field', 'input field', 'text input', 'type box'],
  checkbox: ['a checkbox', 'check box', 'tick box'],
  switch: ['a switch', 'toggle', 'on off switch'],
  slider: ['a slider', 'slide control', 'range slider'],
  dropdown: ['a dropdown', 'select menu', 'picker'],
  
  // Navigation
  appBar: ['a title bar', 'app bar', 'top bar', 'header'],
  bottomNav: ['bottom navigation', 'bottom menu', 'footer navigation'],
  drawer: ['a drawer', 'side menu', 'navigation drawer'],
  
  // List widgets
  listView: ['a list', 'show a list', 'list view', 'scrollable list'],
  gridView: ['a grid', 'grid view', 'grid layout'],
  
  // Dialogs & overlays
  dialog: ['a dialog', 'popup', 'modal', 'alert'],
  snackbar: ['a snackbar', 'toast message', 'notification'],
  bottomSheet: ['bottom sheet', 'bottom panel', 'slide up panel']
};

// Style keywords
export const STYLE_KEYWORDS = {
  // Colors
  color: ['color it', 'make it', 'with color', 'colored'],
  background: ['background', 'background color', 'fill with'],
  
  // Size
  width: ['width', 'wide', 'make the width'],
  height: ['height', 'tall', 'make the height'],
  size: ['size', 'make the size'],
  
  // Spacing
  padding: ['padding', 'inner space', 'space inside'],
  margin: ['margin', 'outer space', 'space outside'],
  space: ['add some space', 'space of', 'gap of'],
  
  // Text styles
  bold: ['make it bold', 'bold', 'strong'],
  italic: ['make it italic', 'italic', 'slanted'],
  underline: ['underline', 'underlined'],
  fontSize: ['font size', 'text size', 'size'],
  
  // Border & corners
  border: ['border', 'outline', 'edge'],
  rounded: ['round the corners', 'rounded', 'corner radius'],
  
  // Shadow
  shadow: ['add shadow', 'drop shadow', 'shadow'],
  
  // Alignment
  alignLeft: ['align left', 'left aligned', 'to the left'],
  alignRight: ['align right', 'right aligned', 'to the right'],
  alignCenter: ['align center', 'centered', 'in the middle']
};

// Event keywords
export const EVENT_KEYWORDS = {
  onPressed: ['when pressed', 'when clicked', 'on click', 'on tap', 'when tapped'],
  onChanged: ['when changed', 'on change', 'when updated'],
  onSubmit: ['when submitted', 'on submit', 'when done'],
  onHover: ['when hovered', 'on hover', 'mouse over'],
  onFocus: ['when focused', 'on focus'],
  onBlur: ['when unfocused', 'on blur', 'when left']
};

// State keywords
export const STATE_KEYWORDS = {
  remember: ['remember', 'keep track of', 'store', 'save'],
  update: ['update', 'change', 'modify', 'set'],
  watch: ['whenever', 'watch', 'observe', 'when changes']
};

// Navigation keywords
export const NAVIGATION_KEYWORDS = {
  goto: ['go to', 'navigate to', 'open', 'show'],
  back: ['go back', 'return', 'previous screen'],
  replace: ['replace with', 'switch to']
};

// HTTP keywords
export const HTTP_KEYWORDS = {
  fetch: ['fetch', 'get data from', 'load from', 'retrieve from'],
  post: ['send data to', 'post to', 'submit to'],
  put: ['update at', 'put to'],
  delete: ['delete from', 'remove from']
};

// Animation keywords
export const ANIMATION_KEYWORDS = {
  animate: ['animate', 'transition'],
  fadeIn: ['fade in', 'appear'],
  fadeOut: ['fade out', 'disappear'],
  slideIn: ['slide in', 'enter from'],
  slideOut: ['slide out', 'exit to'],
  scale: ['scale', 'grow', 'shrink'],
  rotate: ['rotate', 'spin', 'turn'],
  duration: ['over', 'duration', 'for', 'lasting']
};

// Color names
export const COLOR_NAMES = {
  red: '#EF4444',
  orange: '#F97316',
  amber: '#F59E0B',
  yellow: '#EAB308',
  lime: '#84CC16',
  green: '#22C55E',
  emerald: '#10B981',
  teal: '#14B8A6',
  cyan: '#06B6D4',
  sky: '#0EA5E9',
  blue: '#3B82F6',
  indigo: '#6366F1',
  violet: '#8B5CF6',
  purple: '#A855F7',
  fuchsia: '#D946EF',
  pink: '#EC4899',
  rose: '#F43F5E',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#6B7280',
  grey: '#6B7280',
  slate: '#64748B'
};

// All keywords combined for tokenizer
export const ALL_KEYWORDS = new Set([
  ...VARIABLE_KEYWORDS,
  ...ASSIGNMENT_KEYWORDS,
  ...Object.values(CONDITIONAL_KEYWORDS).flat(),
  ...Object.values(LOOP_KEYWORDS).flat(),
  ...Object.values(COMPARISON_KEYWORDS).flat(),
  ...Object.values(MATH_KEYWORDS).flat(),
  ...Object.values(UI_KEYWORDS).flat(),
  ...Object.values(STYLE_KEYWORDS).flat(),
  ...Object.values(EVENT_KEYWORDS).flat(),
  ...Object.values(STATE_KEYWORDS).flat(),
  ...Object.values(NAVIGATION_KEYWORDS).flat(),
  ...Object.values(HTTP_KEYWORDS).flat(),
  ...Object.values(ANIMATION_KEYWORDS).flat(),
  ...Object.keys(COLOR_NAMES),
  ...FUNCTION_KEYWORDS,
  ...CALL_KEYWORDS
]);
