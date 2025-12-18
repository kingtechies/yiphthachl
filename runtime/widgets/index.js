/**
 * Yiphthachl Widgets Index
 * Export all widgets from a single entry point
 */

// Base widgets
export { Widget, StatefulWidget, createWidget } from './base-widget.js';

// Core widgets (Phase 1)
export {
    Container,
    Column,
    Row,
    Center,
    Text,
    Button,
    Image,
    Icon,
    TextField,
    Scaffold,
    column,
    row,
    center,
    text,
    button,
    image,
    icon,
    textField,
    scaffold,
    container,
    widgets
} from './core-widgets.js';

// Input widgets (Phase 2)
export {
    Checkbox,
    Switch,
    Slider,
    Dropdown,
    RadioGroup,
    TextArea,
    checkbox,
    toggleSwitch,
    slider,
    dropdown,
    radioGroup,
    textArea,
    inputWidgets
} from './input-widgets.js';

// Display widgets (Phase 2)
export {
    Avatar,
    Badge,
    ProgressBar,
    Spinner,
    Divider,
    Chip,
    Tooltip,
    CircularProgress,
    avatar,
    badge,
    progressBar,
    spinner,
    divider,
    chip,
    tooltip,
    circularProgress,
    displayWidgets
} from './display-widgets.js';

// Navigation widgets (Phase 2)
export {
    AppBar,
    BottomNavigation,
    TabBar,
    Drawer,
    Breadcrumbs,
    appBar,
    bottomNavigation,
    tabBar,
    drawer,
    breadcrumbs,
    navigationWidgets
} from './navigation-widgets.js';

// List widgets (Phase 2)
export {
    ListView,
    GridView,
    ListTile,
    ExpandableList,
    Card,
    listView,
    gridView,
    listTile,
    expandableList,
    card,
    listWidgets
} from './list-widgets.js';

// Overlay widgets (Phase 2)
export {
    Dialog,
    BottomSheet,
    Snackbar,
    Modal,
    dialog,
    bottomSheet,
    snackbar,
    modal,
    overlayWidgets
} from './overlay-widgets.js';

// All widgets combined
export const allWidgets = {
    // Core
    Container, Column, Row, Center, Text, Button, Image, Icon, TextField, Scaffold,
    // Input
    Checkbox, Switch, Slider, Dropdown, RadioGroup, TextArea,
    // Display
    Avatar, Badge, ProgressBar, Spinner, Divider, Chip, Tooltip, CircularProgress,
    // Navigation
    AppBar, BottomNavigation, TabBar, Drawer, Breadcrumbs,
    // List
    ListView, GridView, ListTile, ExpandableList, Card,
    // Overlay
    Dialog, BottomSheet, Snackbar, Modal
};
