/**
 * macOS Native Generator
 * Generates macOS desktop application (APP) from Yiphthachl AST
 * 
 * Generates:
 * - Swift source files
 * - SwiftUI views for macOS
 * - Xcode project
 * - Info.plist
 * - Asset catalogs
 */

import { BaseNativeGenerator } from '../base-generator.js';
import path from 'path';

export class MacOSGenerator extends BaseNativeGenerator {
    constructor(options) {
        super(options);
        this.deploymentTarget = options.macosDeploymentTarget || '13.0';
        this.swiftVersion = '5.9';
    }

    get platform() {
        return 'macos';
    }

    get packageExtension() {
        return 'app';
    }

    /**
     * Generate macOS project from AST
     * @param {object} ast - The parsed AST
     * @returns {Promise<object>} - Generation result
     */
    async generate(ast) {
        try {
            // Transform AST to intermediate representation
            const ir = this.transformToIR(ast);

            // Create project structure
            await this.generateProjectStructure(ir);

            // Generate Xcode project file
            await this.generateXcodeProject(ir);

            // Generate Swift source files
            await this.generateSwiftSources(ir);

            // Generate asset catalogs
            await this.generateAssets(ir);

            // Generate Info.plist
            await this.generateInfoPlist(ir);

            // Generate entitlements
            await this.generateEntitlements(ir);

            return {
                success: true,
                output: { projectPath: path.join(this.options.outputDir, this.platform) },
                files: this.generatedFiles,
                warnings: this.warnings,
                errors: this.errors
            };

        } catch (error) {
            this.errors.push(error);
            return {
                success: false,
                output: null,
                files: this.generatedFiles,
                warnings: this.warnings,
                errors: this.errors
            };
        }
    }

    /**
     * Build APP bundle
     * @returns {Promise<object>} - Build result
     */
    async build() {
        const projectPath = path.join(this.options.outputDir, this.platform);
        const appName = this.sanitizeIdentifier(this.options.appName);

        try {
            // Check for Xcode
            const hasXcodebuild = await this.commandExists('xcodebuild');

            if (!hasXcodebuild) {
                throw new Error('Xcode is required to build macOS apps. Please install Xcode from the App Store.');
            }

            // Build for macOS
            await this.executeCommand(
                `xcodebuild -project ${appName}.xcodeproj -scheme ${appName} -configuration Release build`,
                projectPath
            );

            // Archive
            await this.executeCommand(
                `xcodebuild -project ${appName}.xcodeproj -scheme ${appName} -configuration Release archive -archivePath ./build/${appName}.xcarchive`,
                projectPath
            );

            const appPath = path.join(
                projectPath,
                'build', `${appName}.xcarchive`,
                'Products', 'Applications', `${appName}.app`
            );

            return {
                success: true,
                path: appPath,
                logs: this.buildLogs,
                errors: []
            };

        } catch (error) {
            return {
                success: false,
                path: null,
                logs: this.buildLogs,
                errors: [error]
            };
        }
    }

    /**
     * Check macOS environment
     * @returns {Promise<object>}
     */
    async checkEnvironment() {
        const result = {
            ready: false,
            xcode: false,
            swift: false,
            missing: [],
            platform: 'macOS required'
        };

        // macOS development requires macOS
        if (process.platform !== 'darwin') {
            result.missing.push('macOS (macOS development requires a Mac)');
            return result;
        }

        // Check Xcode
        result.xcode = await this.commandExists('xcodebuild');
        if (!result.xcode) {
            result.missing.push('Xcode');
        }

        // Check Swift
        result.swift = await this.commandExists('swift');
        if (!result.swift) {
            result.missing.push('Swift');
        }

        result.ready = result.xcode && result.swift;
        return result;
    }

    /**
     * Generate project directory structure
     */
    async generateProjectStructure(ir) {
        const appName = this.sanitizeIdentifier(ir.app?.name || this.options.appName);

        const dirs = [
            `${appName}`,
            `${appName}/Views`,
            `${appName}/ViewModels`,
            `${appName}/Models`,
            `${appName}/Components`,
            `${appName}/Services`,
            `${appName}/Windows`,
            `${appName}/Assets.xcassets`,
            `${appName}/Assets.xcassets/AppIcon.appiconset`,
            `${appName}/Assets.xcassets/AccentColor.colorset`,
            `${appName}.xcodeproj`
        ];

        for (const dir of dirs) {
            await this.createOutputDirectory(
                path.join(this.options.outputDir, this.platform, dir)
            );
        }
    }

    /**
     * Generate Xcode project file
     */
    async generateXcodeProject(ir) {
        const appName = this.sanitizeIdentifier(ir.app?.name || this.options.appName);
        const bundleId = this.options.bundleId;

        // Generate simplified project.pbxproj
        const pbxproj = this.generatePbxproj(appName, bundleId);
        await this.writeFile(`${appName}.xcodeproj/project.pbxproj`, pbxproj);
    }

    /**
     * Generate pbxproj content
     */
    generatePbxproj(appName, bundleId) {
        const uuid = () => this.generateUUID();

        return `// !$*UTF8*$!
{
    archiveVersion = 1;
    classes = {
    };
    objectVersion = 56;
    objects = {
        ${uuid()} /* Project object */ = {
            isa = PBXProject;
            buildConfigurationList = ${uuid()};
            compatibilityVersion = "Xcode 14.0";
            developmentRegion = en;
            hasScannedForEncodings = 0;
            knownRegions = (
                en,
                Base,
            );
            mainGroup = ${uuid()};
            productRefGroup = ${uuid()} /* Products */;
            projectDirPath = "";
            projectRoot = "";
            targets = (
            );
        };
    };
    rootObject = ${uuid()} /* Project object */;
}
`;
    }

    /**
     * Generate UUID for pbxproj
     */
    generateUUID() {
        const chars = '0123456789ABCDEF';
        let uuid = '';
        for (let i = 0; i < 24; i++) {
            uuid += chars[Math.floor(Math.random() * 16)];
        }
        return uuid;
    }

    /**
     * Generate Swift source files with SwiftUI for macOS
     */
    async generateSwiftSources(ir) {
        const appName = this.sanitizeIdentifier(ir.app?.name || this.options.appName);
        const displayName = ir.app?.name || this.options.appName;
        const appDir = appName;

        // App entry point
        await this.writeFile(`${appDir}/${appName}App.swift`, `
import SwiftUI

@main
struct ${appName}App: App {
    @StateObject private var appState = AppState()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .frame(minWidth: 800, minHeight: 600)
        }
        .windowStyle(.hiddenTitleBar)
        .commands {
            CommandGroup(replacing: .newItem) { }
            
            CommandMenu("View") {
                Button("Toggle Sidebar") {
                    // Toggle sidebar
                }
                .keyboardShortcut("s", modifiers: [.command, .control])
            }
        }
        
        Settings {
            SettingsView()
                .environmentObject(appState)
        }
    }
}
`.trim());

        // ContentView (main entry)
        await this.writeFile(`${appDir}/ContentView.swift`, `
import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedItem: String? = "home"
    
    var body: some View {
        NavigationSplitView {
            SidebarView(selectedItem: $selectedItem)
        } detail: {
            DetailView(selectedItem: selectedItem)
        }
        .navigationTitle("${displayName}")
    }
}

#Preview {
    ContentView()
        .environmentObject(AppState())
}
`.trim());

        // Generate views
        await this.generateViews(ir, appDir);

        // Generate windows
        await this.generateWindows(ir, appDir);

        // Generate view models
        await this.generateViewModels(ir, appDir);

        // Generate models
        await this.generateModels(ir, appDir);

        // Generate components
        await this.generateComponents(ir, appDir);

        // Generate services
        await this.generateServices(ir, appDir);

        // Generate app state
        await this.generateAppState(ir, appDir);
    }

    /**
     * Generate SwiftUI views for macOS
     */
    async generateViews(ir, appDir) {
        const viewsDir = `${appDir}/Views`;

        // SidebarView
        await this.writeFile(`${viewsDir}/SidebarView.swift`, `
import SwiftUI

struct SidebarView: View {
    @Binding var selectedItem: String?
    
    var body: some View {
        List(selection: $selectedItem) {
            Section("Navigation") {
                NavigationLink(value: "home") {
                    Label("Home", systemImage: "house.fill")
                }
                
                NavigationLink(value: "items") {
                    Label("Items", systemImage: "list.bullet")
                }
                
                NavigationLink(value: "settings") {
                    Label("Settings", systemImage: "gearshape.fill")
                }
            }
        }
        .listStyle(.sidebar)
        .frame(minWidth: 200)
    }
}

#Preview {
    SidebarView(selectedItem: .constant("home"))
}
`.trim());

        // DetailView
        const mainScreen = ir.screens.find(s => s.isMain) || ir.screens[0];
        const bodyContent = mainScreen?.body
            ? this.generateWidgetCode(mainScreen.body)
            : 'Text("Welcome to Yiphthachl!")';

        await this.writeFile(`${viewsDir}/DetailView.swift`, `
import SwiftUI

struct DetailView: View {
    let selectedItem: String?
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        Group {
            switch selectedItem {
            case "home":
                HomeView()
            case "items":
                ItemsView()
            case "settings":
                SettingsView()
            default:
                VStack {
                    Image(systemName: "app.fill")
                        .font(.system(size: 64))
                        .foregroundColor(.secondary)
                    Text("Select an item from the sidebar")
                        .font(.title2)
                        .foregroundColor(.secondary)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    DetailView(selectedItem: "home")
        .environmentObject(AppState())
}
`.trim());

        // HomeView
        await this.writeFile(`${viewsDir}/HomeView.swift`, `
import SwiftUI

struct HomeView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Header
                VStack(alignment: .leading, spacing: 8) {
                    Text("Welcome")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    Text("Your Yiphthachl app is ready!")
                        .font(.title3)
                        .foregroundColor(.secondary)
                }
                
                // Stats Grid
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: 16) {
                    StatCard(title: "Items", value: "\\(appState.itemCount)", icon: "list.bullet", color: .blue)
                    StatCard(title: "Active", value: "\\(appState.activeCount)", icon: "checkmark.circle", color: .green)
                    StatCard(title: "Pending", value: "\\(appState.pendingCount)", icon: "clock", color: .orange)
                }
                
                // Recent Activity
                VStack(alignment: .leading, spacing: 12) {
                    Text("Recent Activity")
                        .font(.title2)
                        .fontWeight(.semibold)
                    
                    ForEach(0..<5) { index in
                        HStack {
                            Circle()
                                .fill(Color.accentColor)
                                .frame(width: 8, height: 8)
                            
                            Text("Activity item \\(index + 1)")
                            
                            Spacer()
                            
                            Text("Just now")
                                .foregroundColor(.secondary)
                                .font(.caption)
                        }
                        .padding(.vertical, 8)
                        
                        if index < 4 {
                            Divider()
                        }
                    }
                }
                .padding()
                .background(Color(nsColor: .controlBackgroundColor))
                .cornerRadius(12)
            }
            .padding(24)
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                Spacer()
            }
            
            Text(value)
                .font(.system(size: 32, weight: .bold))
            
            Text(title)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(nsColor: .controlBackgroundColor))
        .cornerRadius(12)
    }
}

#Preview {
    HomeView()
        .environmentObject(AppState())
}
`.trim());

        // ItemsView
        await this.writeFile(`${viewsDir}/ItemsView.swift`, `
import SwiftUI

struct ItemsView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = ItemsViewModel()
    @State private var showAddSheet = false
    @State private var searchText = ""
    
    var filteredItems: [Item] {
        if searchText.isEmpty {
            return viewModel.items
        }
        return viewModel.items.filter { $0.title.localizedCaseInsensitiveContains(searchText) }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Toolbar
            HStack {
                TextField("Search items...", text: $searchText)
                    .textFieldStyle(.roundedBorder)
                    .frame(maxWidth: 300)
                
                Spacer()
                
                Button(action: { showAddSheet = true }) {
                    Label("Add Item", systemImage: "plus")
                }
                .buttonStyle(.borderedProminent)
            }
            .padding()
            
            Divider()
            
            // Items List
            if viewModel.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if filteredItems.isEmpty {
                ContentUnavailableView {
                    Label("No Items", systemImage: "tray")
                } description: {
                    Text("Add some items to get started")
                }
            } else {
                List(filteredItems) { item in
                    ItemRow(item: item) {
                        viewModel.toggleItem(item)
                    } onDelete: {
                        viewModel.deleteItem(item)
                    }
                }
            }
        }
        .sheet(isPresented: $showAddSheet) {
            AddItemSheet { title, description in
                viewModel.addItem(title: title, description: description)
            }
        }
        .task {
            await viewModel.loadItems()
        }
    }
}

struct ItemRow: View {
    let item: Item
    let onToggle: () -> Void
    let onDelete: () -> Void
    
    var body: some View {
        HStack {
            Button(action: onToggle) {
                Image(systemName: item.isCompleted ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(item.isCompleted ? .green : .secondary)
            }
            .buttonStyle(.plain)
            
            VStack(alignment: .leading) {
                Text(item.title)
                    .strikethrough(item.isCompleted)
                
                if !item.description.isEmpty {
                    Text(item.description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            Button(action: onDelete) {
                Image(systemName: "trash")
                    .foregroundColor(.red)
            }
            .buttonStyle(.plain)
        }
        .padding(.vertical, 4)
    }
}

struct AddItemSheet: View {
    @Environment(\\.dismiss) var dismiss
    @State private var title = ""
    @State private var description = ""
    
    let onAdd: (String, String) -> Void
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Add New Item")
                .font(.title2)
                .fontWeight(.semibold)
            
            TextField("Title", text: $title)
                .textFieldStyle(.roundedBorder)
            
            TextField("Description (optional)", text: $description)
                .textFieldStyle(.roundedBorder)
            
            HStack {
                Button("Cancel") {
                    dismiss()
                }
                
                Button("Add") {
                    onAdd(title, description)
                    dismiss()
                }
                .buttonStyle(.borderedProminent)
                .disabled(title.isEmpty)
            }
        }
        .padding(24)
        .frame(width: 400)
    }
}

#Preview {
    ItemsView()
        .environmentObject(AppState())
}
`.trim());

        // SettingsView
        await this.writeFile(`${viewsDir}/SettingsView.swift`, `
import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var appState: AppState
    @AppStorage("darkMode") private var darkMode = false
    @AppStorage("notificationsEnabled") private var notificationsEnabled = true
    @AppStorage("autoSave") private var autoSave = true
    
    var body: some View {
        Form {
            Section("Appearance") {
                Toggle("Dark Mode", isOn: $darkMode)
                
                Picker("Accent Color", selection: .constant("Blue")) {
                    Text("Blue").tag("Blue")
                    Text("Purple").tag("Purple")
                    Text("Pink").tag("Pink")
                    Text("Green").tag("Green")
                }
            }
            
            Section("Behavior") {
                Toggle("Enable Notifications", isOn: $notificationsEnabled)
                Toggle("Auto-save", isOn: $autoSave)
            }
            
            Section("About") {
                HStack {
                    Text("Version")
                    Spacer()
                    Text("1.0.0")
                        .foregroundColor(.secondary)
                }
                
                HStack {
                    Text("Built with")
                    Spacer()
                    Text("Yiphthachl")
                        .foregroundColor(.secondary)
                }
            }
        }
        .formStyle(.grouped)
        .padding()
        .frame(width: 450, height: 350)
    }
}

#Preview {
    SettingsView()
        .environmentObject(AppState())
}
`.trim());
    }

    /**
     * Generate widget code for SwiftUI
     */
    generateWidgetCode(widget) {
        if (!widget) return 'EmptyView()';

        if (Array.isArray(widget)) {
            return widget.map(w => this.generateWidgetCode(w)).join('\n                ');
        }

        const type = widget.type;
        const props = widget.properties || {};
        const children = widget.children || [];

        switch (type) {
            case 'TextWidget':
            case 'Text':
                return `Text("${props.text || props.content || ''}")`;

            case 'ButtonWidget':
            case 'Button':
                return `Button("${props.text || props.label || 'Button'}") { }`;

            case 'ColumnWidget':
            case 'Column':
                const vChildren = children.map(c => this.generateWidgetCode(c)).join('\n                    ');
                return `VStack {
                    ${vChildren}
                }`;

            case 'RowWidget':
            case 'Row':
                const hChildren = children.map(c => this.generateWidgetCode(c)).join('\n                    ');
                return `HStack {
                    ${hChildren}
                }`;

            default:
                return `Text("Widget: ${type}")`;
        }
    }

    /**
     * Generate macOS-specific windows
     */
    async generateWindows(ir, appDir) {
        const windowsDir = `${appDir}/Windows`;

        // AboutWindow
        await this.writeFile(`${windowsDir}/AboutWindow.swift`, `
import SwiftUI

struct AboutWindow: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "app.fill")
                .font(.system(size: 64))
                .foregroundColor(.accentColor)
            
            Text("Yiphthachl App")
                .font(.title)
                .fontWeight(.bold)
            
            Text("Version 1.0.0")
                .foregroundColor(.secondary)
            
            Text("Built with Yiphthachl - The Plain English Programming Language")
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
                .padding(.horizontal)
            
            Link("Visit Website", destination: URL(string: "https://yiphthachl.dev")!)
                .buttonStyle(.borderedProminent)
        }
        .padding(40)
        .frame(width: 400, height: 300)
    }
}

#Preview {
    AboutWindow()
}
`.trim());
    }

    /**
     * Generate ViewModels
     */
    async generateViewModels(ir, appDir) {
        await this.writeFile(`${appDir}/ViewModels/ItemsViewModel.swift`, `
import Foundation
import SwiftUI

@MainActor
class ItemsViewModel: ObservableObject {
    @Published var items: [Item] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    func loadItems() async {
        isLoading = true
        errorMessage = nil
        
        do {
            try await Task.sleep(nanoseconds: 500_000_000)
            
            items = [
                Item(title: "Welcome Item", description: "Your first item"),
                Item(title: "Getting Started", description: "Learn how to use the app"),
                Item(title: "Customize", description: "Make it your own")
            ]
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func addItem(title: String, description: String) {
        let item = Item(title: title, description: description)
        items.append(item)
    }
    
    func toggleItem(_ item: Item) {
        if let index = items.firstIndex(where: { $0.id == item.id }) {
            items[index].isCompleted.toggle()
        }
    }
    
    func deleteItem(_ item: Item) {
        items.removeAll { $0.id == item.id }
    }
}
`.trim());
    }

    /**
     * Generate Models
     */
    async generateModels(ir, appDir) {
        await this.writeFile(`${appDir}/Models/Item.swift`, `
import Foundation

struct Item: Identifiable, Codable {
    let id: UUID
    var title: String
    var description: String
    var isCompleted: Bool
    var createdAt: Date
    
    init(id: UUID = UUID(), title: String, description: String = "", isCompleted: Bool = false) {
        self.id = id
        self.title = title
        self.description = description
        self.isCompleted = isCompleted
        self.createdAt = Date()
    }
}
`.trim());
    }

    /**
     * Generate Components
     */
    async generateComponents(ir, appDir) {
        await this.writeFile(`${appDir}/Components/Components.swift`, `
import SwiftUI

// MARK: - Card
struct Card<Content: View>: View {
    let content: Content
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        content
            .padding()
            .background(Color(nsColor: .controlBackgroundColor))
            .cornerRadius(12)
    }
}

// MARK: - IconButton
struct IconButton: View {
    let icon: String
    let action: () -> Void
    var color: Color = .accentColor
    
    var body: some View {
        Button(action: action) {
            Image(systemName: icon)
                .foregroundColor(color)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - SearchField
struct SearchField: View {
    @Binding var text: String
    var placeholder: String = "Search..."
    
    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.secondary)
            
            TextField(placeholder, text: $text)
                .textFieldStyle(.plain)
            
            if !text.isEmpty {
                Button(action: { text = "" }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.secondary)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(8)
        .background(Color(nsColor: .controlBackgroundColor))
        .cornerRadius(8)
    }
}

// MARK: - EmptyState
struct EmptyState: View {
    let icon: String
    let title: String
    let message: String
    var action: (() -> Void)?
    var actionTitle: String = "Get Started"
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 48))
                .foregroundColor(.secondary)
            
            Text(title)
                .font(.title2)
                .fontWeight(.semibold)
            
            Text(message)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            if let action = action {
                Button(actionTitle, action: action)
                    .buttonStyle(.borderedProminent)
            }
        }
        .padding()
    }
}

#Preview {
    VStack {
        Card {
            Text("Card Content")
        }
        
        SearchField(text: .constant(""))
        
        EmptyState(icon: "tray", title: "No Items", message: "Add some items to get started")
    }
    .padding()
}
`.trim());
    }

    /**
     * Generate Services
     */
    async generateServices(ir, appDir) {
        await this.writeFile(`${appDir}/Services/PersistenceService.swift`, `
import Foundation

class PersistenceService {
    static let shared = PersistenceService()
    
    private let fileManager = FileManager.default
    private var documentsURL: URL {
        fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
    }
    
    private init() {}
    
    func save<T: Encodable>(_ data: T, to filename: String) throws {
        let url = documentsURL.appendingPathComponent("\\(filename).json")
        let encoded = try JSONEncoder().encode(data)
        try encoded.write(to: url)
    }
    
    func load<T: Decodable>(from filename: String) throws -> T {
        let url = documentsURL.appendingPathComponent("\\(filename).json")
        let data = try Data(contentsOf: url)
        return try JSONDecoder().decode(T.self, from: data)
    }
    
    func delete(filename: String) throws {
        let url = documentsURL.appendingPathComponent("\\(filename).json")
        try fileManager.removeItem(at: url)
    }
    
    func exists(filename: String) -> Bool {
        let url = documentsURL.appendingPathComponent("\\(filename).json")
        return fileManager.fileExists(atPath: url.path)
    }
}
`.trim());

        await this.writeFile(`${appDir}/Services/NetworkService.swift`, `
import Foundation

enum NetworkError: Error {
    case invalidURL
    case invalidResponse
    case decodingError
    case serverError(Int)
}

class NetworkService {
    static let shared = NetworkService()
    private init() {}
    
    func fetch<T: Decodable>(from urlString: String) async throws -> T {
        guard let url = URL(string: urlString) else {
            throw NetworkError.invalidURL
        }
        
        let (data, response) = try await URLSession.shared.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.serverError(httpResponse.statusCode)
        }
        
        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            throw NetworkError.decodingError
        }
    }
    
    func post<T: Encodable, R: Decodable>(to urlString: String, body: T) async throws -> R {
        guard let url = URL(string: urlString) else {
            throw NetworkError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.serverError(httpResponse.statusCode)
        }
        
        return try JSONDecoder().decode(R.self, from: data)
    }
}
`.trim());
    }

    /**
     * Generate AppState
     */
    async generateAppState(ir, appDir) {
        const stateProperties = ir.state.map(s => {
            const type = this.swiftType(s.type);
            const defaultValue = this.swiftDefaultValue(s.initialValue, s.type);
            return `@Published var ${this.sanitizeIdentifier(s.name)}: ${type} = ${defaultValue}`;
        }).join('\n    ');

        await this.writeFile(`${appDir}/AppState.swift`, `
import Foundation
import SwiftUI

@MainActor
class AppState: ObservableObject {
    // Generated state from Yiphthachl source
    ${stateProperties || '// No state defined'}
    
    // Sample computed properties for dashboard
    @Published var items: [Item] = []
    
    var itemCount: Int { items.count }
    var activeCount: Int { items.filter { !$0.isCompleted }.count }
    var pendingCount: Int { items.filter { $0.isCompleted }.count }
    
    // Theme
    @Published var isDarkMode = false
    
    // Navigation
    @Published var selectedSidebarItem: String?
    
    func reset() {
        items = []
        selectedSidebarItem = nil
    }
}
`.trim());
    }

    /**
     * Generate Asset Catalogs
     */
    async generateAssets(ir) {
        const appName = this.sanitizeIdentifier(ir.app?.name || this.options.appName);
        const assetsDir = `${appName}/Assets.xcassets`;

        // Contents.json
        await this.writeFile(`${assetsDir}/Contents.json`, `{
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
`);

        // AccentColor
        await this.writeFile(`${assetsDir}/AccentColor.colorset/Contents.json`, `{
  "colors" : [
    {
      "color" : {
        "color-space" : "srgb",
        "components" : {
          "alpha" : "1.000",
          "blue" : "0.945",
          "green" : "0.400",
          "red" : "0.388"
        }
      },
      "idiom" : "universal"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
`);

        // AppIcon
        await this.writeFile(`${assetsDir}/AppIcon.appiconset/Contents.json`, `{
  "images" : [
    {
      "idiom" : "mac",
      "scale" : "1x",
      "size" : "16x16"
    },
    {
      "idiom" : "mac",
      "scale" : "2x",
      "size" : "16x16"
    },
    {
      "idiom" : "mac",
      "scale" : "1x",
      "size" : "32x32"
    },
    {
      "idiom" : "mac",
      "scale" : "2x",
      "size" : "32x32"
    },
    {
      "idiom" : "mac",
      "scale" : "1x",
      "size" : "128x128"
    },
    {
      "idiom" : "mac",
      "scale" : "2x",
      "size" : "128x128"
    },
    {
      "idiom" : "mac",
      "scale" : "1x",
      "size" : "256x256"
    },
    {
      "idiom" : "mac",
      "scale" : "2x",
      "size" : "256x256"
    },
    {
      "idiom" : "mac",
      "scale" : "1x",
      "size" : "512x512"
    },
    {
      "idiom" : "mac",
      "scale" : "2x",
      "size" : "512x512"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
`);
    }

    /**
     * Generate Info.plist
     */
    async generateInfoPlist(ir) {
        const appName = this.sanitizeIdentifier(ir.app?.name || this.options.appName);
        const displayName = ir.app?.name || this.options.appName;

        await this.writeFile(`${appName}/Info.plist`, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleDisplayName</key>
    <string>${displayName}</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIconFile</key>
    <string></string>
    <key>CFBundleIconName</key>
    <string>AppIcon</string>
    <key>CFBundleIdentifier</key>
    <string>${this.options.bundleId}</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>${this.options.version}</string>
    <key>CFBundleVersion</key>
    <string>${this.options.buildNumber}</string>
    <key>LSApplicationCategoryType</key>
    <string>public.app-category.productivity</string>
    <key>LSMinimumSystemVersion</key>
    <string>${this.deploymentTarget}</string>
    <key>NSHumanReadableCopyright</key>
    <string>Copyright © 2024. All rights reserved.</string>
    <key>NSMainStoryboardFile</key>
    <string></string>
    <key>NSPrincipalClass</key>
    <string>NSApplication</string>
</dict>
</plist>
`);
    }

    /**
     * Generate entitlements
     */
    async generateEntitlements(ir) {
        const appName = this.sanitizeIdentifier(ir.app?.name || this.options.appName);

        await this.writeFile(`${appName}/${appName}.entitlements`, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
</dict>
</plist>
`);
    }

    // Helper methods
    swiftType(type) {
        const typeMap = {
            'string': 'String',
            'number': 'Double',
            'boolean': 'Bool',
            'array': '[Any]',
            'object': '[String: Any]',
            'any': 'Any'
        };
        return typeMap[type] || 'Any';
    }

    swiftDefaultValue(value, type) {
        if (value === null || value === undefined) {
            const defaults = {
                'string': '""',
                'number': '0.0',
                'boolean': 'false',
                'array': '[]',
                'object': '[:]'
            };
            return defaults[type] || 'nil';
        }

        if (typeof value === 'string') return `"${value}"`;
        if (typeof value === 'boolean') return value.toString();
        if (typeof value === 'number') return `${value}`;

        return 'nil';
    }
}

export default MacOSGenerator;
