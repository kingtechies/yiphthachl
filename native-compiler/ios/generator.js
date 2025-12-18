/**
 * iOS Native Generator
 * Generates iOS project and IPA from Yiphthachl AST
 * 
 * Generates:
 * - Swift source files
 * - SwiftUI views
 * - Xcode project
 * - Info.plist
 * - Asset catalogs
 */

import { BaseNativeGenerator } from '../base-generator.js';
import path from 'path';

export class IOSGenerator extends BaseNativeGenerator {
    constructor(options) {
        super(options);
        this.deploymentTarget = options.iosDeploymentTarget || '15.0';
        this.swiftVersion = '5.9';
        this.teamId = options.teamId || 'XXXXXXXXXX';
    }

    get platform() {
        return 'ios';
    }

    get packageExtension() {
        return 'ipa';
    }

    /**
     * Generate iOS project from AST
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
     * Build IPA
     * @returns {Promise<object>} - Build result
     */
    async build() {
        const projectPath = path.join(this.options.outputDir, this.platform);
        const appName = this.sanitizeIdentifier(this.options.appName);

        try {
            // Check for Xcode
            const hasXcodebuild = await this.commandExists('xcodebuild');

            if (!hasXcodebuild) {
                throw new Error('Xcode is required to build iOS apps. Please install Xcode from the App Store.');
            }

            // Build for simulator first (debug)
            await this.executeCommand(
                `xcodebuild -project ${appName}.xcodeproj -scheme ${appName} -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 15' build`,
                projectPath
            );

            // Archive for distribution
            await this.executeCommand(
                `xcodebuild -project ${appName}.xcodeproj -scheme ${appName} -configuration Release archive -archivePath ./build/${appName}.xcarchive`,
                projectPath
            );

            // Export IPA
            await this.executeCommand(
                `xcodebuild -exportArchive -archivePath ./build/${appName}.xcarchive -exportPath ./build -exportOptionsPlist ExportOptions.plist`,
                projectPath
            );

            const ipaPath = path.join(projectPath, 'build', `${appName}.ipa`);

            return {
                success: true,
                path: ipaPath,
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
     * Check iOS environment
     * @returns {Promise<object>}
     */
    async checkEnvironment() {
        const result = {
            ready: false,
            xcode: false,
            swift: false,
            cocoapods: false,
            missing: [],
            platform: 'macOS required'
        };

        // iOS development requires macOS
        if (process.platform !== 'darwin') {
            result.missing.push('macOS (iOS development requires a Mac)');
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

        // Check CocoaPods
        result.cocoapods = await this.commandExists('pod');
        if (!result.cocoapods) {
            result.missing.push('CocoaPods (optional)');
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
            `${appName}/Models`,
            `${appName}/ViewModels`,
            `${appName}/Components`,
            `${appName}/Navigation`,
            `${appName}/Services`,
            `${appName}/Assets.xcassets`,
            `${appName}/Assets.xcassets/AppIcon.appiconset`,
            `${appName}/Assets.xcassets/AccentColor.colorset`,
            `${appName}/Preview Content`,
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

        // Generate project.pbxproj
        const pbxproj = this.generatePbxproj(appName, bundleId, ir);
        await this.writeFile(`${appName}.xcodeproj/project.pbxproj`, pbxproj);

        // Generate ExportOptions.plist for IPA export
        await this.writeFile('ExportOptions.plist', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>development</string>
    <key>teamID</key>
    <string>${this.teamId}</string>
    <key>signingStyle</key>
    <string>automatic</string>
</dict>
</plist>
`);
    }

    /**
     * Generate pbxproj content
     */
    generatePbxproj(appName, bundleId, ir) {
        const uuid = () => this.generateUUID();
        const projectUUID = uuid();
        const mainGroupUUID = uuid();
        const appGroupUUID = uuid();
        const productsGroupUUID = uuid();
        const targetUUID = uuid();
        const buildConfigDebugUUID = uuid();
        const buildConfigReleaseUUID = uuid();
        const targetBuildConfigDebugUUID = uuid();
        const targetBuildConfigReleaseUUID = uuid();

        return `// !$*UTF8*$!
{
    archiveVersion = 1;
    classes = {
    };
    objectVersion = 56;
    objects = {
        ${projectUUID} /* Project object */ = {
            isa = PBXProject;
            buildConfigurationList = ${uuid()};
            compatibilityVersion = "Xcode 14.0";
            developmentRegion = en;
            hasScannedForEncodings = 0;
            knownRegions = (
                en,
                Base,
            );
            mainGroup = ${mainGroupUUID};
            productRefGroup = ${productsGroupUUID} /* Products */;
            projectDirPath = "";
            projectRoot = "";
            targets = (
                ${targetUUID} /* ${appName} */,
            );
        };
        ${mainGroupUUID} = {
            isa = PBXGroup;
            children = (
                ${appGroupUUID} /* ${appName} */,
                ${productsGroupUUID} /* Products */,
            );
            sourceTree = "<group>";
        };
        ${targetUUID} /* ${appName} */ = {
            isa = PBXNativeTarget;
            buildConfigurationList = ${uuid()};
            buildPhases = (
            );
            buildRules = (
            );
            dependencies = (
            );
            name = ${appName};
            productName = ${appName};
            productType = "com.apple.product-type.application";
        };
    };
    rootObject = ${projectUUID} /* Project object */;
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
     * Generate Swift source files with SwiftUI
     */
    async generateSwiftSources(ir) {
        const appName = this.sanitizeIdentifier(ir.app?.name || this.options.appName);
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
        }
    }
}
`.trim());

        // ContentView (main entry)
        await this.writeFile(`${appDir}/ContentView.swift`, `
import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        NavigationStack {
            MainView()
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AppState())
}
`.trim());

        // Generate views
        await this.generateViews(ir, appDir);

        // Generate models
        await this.generateModels(ir, appDir);

        // Generate view models
        await this.generateViewModels(ir, appDir);

        // Generate components
        await this.generateComponents(ir, appDir);

        // Generate services
        await this.generateServices(ir, appDir);

        // Generate app state
        await this.generateAppState(ir, appDir);
    }

    /**
     * Generate SwiftUI views
     */
    async generateViews(ir, appDir) {
        const viewsDir = `${appDir}/Views`;

        // MainView
        const mainScreen = ir.screens.find(s => s.isMain) || ir.screens[0];
        const mainViewCode = this.generateViewCode(mainScreen, 'MainView');

        await this.writeFile(`${viewsDir}/MainView.swift`, `
import SwiftUI

${mainViewCode}

#Preview {
    MainView()
        .environmentObject(AppState())
}
`.trim());

        // Other screens
        for (const screen of ir.screens.filter(s => !s.isMain)) {
            const viewName = `${this.sanitizeIdentifier(screen.name)}View`;
            const viewCode = this.generateViewCode(screen, viewName);

            await this.writeFile(`${viewsDir}/${viewName}.swift`, `
import SwiftUI

${viewCode}

#Preview {
    ${viewName}()
        .environmentObject(AppState())
}
`.trim());
        }
    }

    /**
     * Generate a single SwiftUI view
     */
    generateViewCode(screen, viewName) {
        if (!screen) {
            return `
struct ${viewName}: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        VStack {
            Text("Welcome to Yiphthachl!")
                .font(.title)
        }
        .navigationTitle("Home")
    }
}
`;
        }

        const body = screen.body;

        if (body?.type === 'Scaffold') {
            return this.generateScaffoldView(viewName, body);
        }

        return `
struct ${viewName}: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        ${this.generateWidgetCode(body)}
    }
}
`;
    }

    /**
     * Generate Scaffold-based view
     */
    generateScaffoldView(viewName, scaffold) {
        const title = scaffold.appBar?.text || scaffold.appBar?.title || 'App';
        const bodyCode = scaffold.body
            ? this.generateWidgetCode(scaffold.body)
            : 'Text("Welcome!")';

        const tabBarCode = scaffold.bottomNavigation
            ? this.generateTabBarCode(scaffold.bottomNavigation)
            : null;

        if (tabBarCode) {
            return `
struct ${viewName}: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            ${tabBarCode}
        }
    }
}
`;
        }

        return `
struct ${viewName}: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    ${bodyCode}
                }
                .padding()
            }
            .navigationTitle("${title}")
        }
    }
}
`;
    }

    /**
     * Generate TabBar code
     */
    generateTabBarCode(bottomNav) {
        if (!bottomNav.items || bottomNav.items.length === 0) {
            return null;
        }

        return bottomNav.items.map((item, index) => {
            const icon = this.mapIconName(item.icon || 'house');
            const label = item.label || item.name || 'Tab';
            return `
            VStack {
                Text("${label} Content")
            }
            .tabItem {
                Label("${label}", systemImage: "${icon}")
            }
            .tag(${index})`;
        }).join('\n');
    }

    /**
     * Generate SwiftUI widget code
     */
    generateWidgetCode(widget) {
        if (!widget) return 'EmptyView()';

        if (Array.isArray(widget)) {
            const items = widget.map(w => this.generateWidgetCode(w)).join('\n                    ');
            return items;
        }

        const type = widget.type;
        const props = widget.properties || {};
        const children = widget.children || [];

        switch (type) {
            case 'TextWidget':
            case 'Text':
                return this.generateTextCode(props);

            case 'ButtonWidget':
            case 'Button':
                return this.generateButtonCode(props, widget.events);

            case 'ImageWidget':
            case 'Image':
                return this.generateImageCode(props);

            case 'ColumnWidget':
            case 'Column':
                return this.generateVStackCode(props, children);

            case 'RowWidget':
            case 'Row':
                return this.generateHStackCode(props, children);

            case 'ContainerWidget':
            case 'Container':
            case 'CardWidget':
            case 'Card':
                return this.generateCardCode(props, children);

            case 'SpacerWidget':
            case 'Spacer':
                return `Spacer().frame(height: ${props.size || 16})`;

            case 'DividerWidget':
            case 'Divider':
                return 'Divider()';

            case 'ListViewWidget':
            case 'ListView':
                return this.generateListCode(props, children);

            default:
                return `// Unsupported widget: ${type}`;
        }
    }

    /**
     * Generate Text view
     */
    generateTextCode(props) {
        const text = props.text || props.content || '';
        let code = `Text("${text}")`;

        if (props.fontSize || props.size) {
            code += `\n                        .font(.system(size: ${props.fontSize || props.size}))`;
        }
        if (props.bold) {
            code += '\n                        .fontWeight(.bold)';
        }
        if (props.color) {
            code += `\n                        .foregroundColor(${this.swiftColor(props.color)})`;
        }

        return code;
    }

    /**
     * Generate Button view
     */
    generateButtonCode(props, events) {
        const text = props.text || props.label || 'Button';
        const backgroundColor = props.backgroundColor || props.background;

        let buttonStyle = '';
        if (backgroundColor) {
            buttonStyle = `\n                        .buttonStyle(.borderedProminent)\n                        .tint(${this.swiftColor(backgroundColor)})`;
        }

        return `Button(action: {
                        // TODO: Handle button action
                    }) {
                        Text("${text}")
                            .padding()
                    }${buttonStyle}`;
    }

    /**
     * Generate AsyncImage view
     */
    generateImageCode(props) {
        const url = props.url || props.src || '';
        let modifiers = '';

        if (props.width) modifiers += `\n                        .frame(width: ${props.width})`;
        if (props.height) modifiers += `\n                        .frame(height: ${props.height})`;
        if (props.cornerRadius) modifiers += `\n                        .clipShape(RoundedRectangle(cornerRadius: ${props.cornerRadius}))`;

        return `AsyncImage(url: URL(string: "${url}")) { image in
                        image.resizable().aspectRatio(contentMode: .fit)
                    } placeholder: {
                        ProgressView()
                    }${modifiers}`;
    }

    /**
     * Generate VStack
     */
    generateVStackCode(props, children) {
        const childrenCode = children.map(c => this.generateWidgetCode(c)).join('\n                    ');

        return `VStack(spacing: 16) {
                    ${childrenCode}
                }`;
    }

    /**
     * Generate HStack
     */
    generateHStackCode(props, children) {
        const childrenCode = children.map(c => this.generateWidgetCode(c)).join('\n                    ');

        return `HStack(spacing: 12) {
                    ${childrenCode}
                }`;
    }

    /**
     * Generate Card view
     */
    generateCardCode(props, children) {
        const childrenCode = children.map(c => this.generateWidgetCode(c)).join('\n                        ');

        return `VStack {
                        ${childrenCode}
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .shadow(radius: 2)`;
    }

    /**
     * Generate List view
     */
    generateListCode(props, children) {
        return `List {
                    ForEach(0..<10, id: \\.self) { index in
                        HStack {
                            Text("Item \\(index)")
                        }
                        .padding()
                    }
                }
                .listStyle(.plain)`;
    }

    /**
     * Generate Models
     */
    async generateModels(ir, appDir) {
        await this.writeFile(`${appDir}/Models/Models.swift`, `
import Foundation

// Generated models from Yiphthachl source

struct Item: Identifiable, Codable {
    let id: UUID
    var title: String
    var description: String
    var isCompleted: Bool
    
    init(id: UUID = UUID(), title: String, description: String = "", isCompleted: Bool = false) {
        self.id = id
        self.title = title
        self.description = description
        self.isCompleted = isCompleted
    }
}

struct User: Identifiable, Codable {
    let id: UUID
    var name: String
    var email: String
    
    init(id: UUID = UUID(), name: String, email: String) {
        self.id = id
        self.name = name
        self.email = email
    }
}
`.trim());
    }

    /**
     * Generate ViewModels
     */
    async generateViewModels(ir, appDir) {
        await this.writeFile(`${appDir}/ViewModels/MainViewModel.swift`, `
import Foundation
import SwiftUI

@MainActor
class MainViewModel: ObservableObject {
    @Published var items: [Item] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    func loadItems() async {
        isLoading = true
        errorMessage = nil
        
        do {
            // Simulate network delay
            try await Task.sleep(nanoseconds: 1_000_000_000)
            
            items = [
                Item(title: "First Item", description: "Description 1"),
                Item(title: "Second Item", description: "Description 2"),
                Item(title: "Third Item", description: "Description 3")
            ]
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func addItem(_ item: Item) {
        items.append(item)
    }
    
    func removeItem(at offsets: IndexSet) {
        items.remove(atOffsets: offsets)
    }
}
`.trim());
    }

    /**
     * Generate reusable components
     */
    async generateComponents(ir, appDir) {
        await this.writeFile(`${appDir}/Components/Components.swift`, `
import SwiftUI

// MARK: - YiphButton
struct YiphButton: View {
    let text: String
    let action: () -> Void
    var backgroundColor: Color = .blue
    var cornerRadius: CGFloat = 8
    
    var body: some View {
        Button(action: action) {
            Text(text)
                .fontWeight(.semibold)
                .foregroundColor(.white)
                .padding()
                .frame(maxWidth: .infinity)
                .background(backgroundColor)
                .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
        }
    }
}

// MARK: - YiphCard
struct YiphCard<Content: View>: View {
    let content: Content
    var cornerRadius: CGFloat = 12
    
    init(cornerRadius: CGFloat = 12, @ViewBuilder content: () -> Content) {
        self.cornerRadius = cornerRadius
        self.content = content()
    }
    
    var body: some View {
        content
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
            .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}

// MARK: - YiphImage
struct YiphImage: View {
    let url: String
    var cornerRadius: CGFloat = 8
    
    var body: some View {
        AsyncImage(url: URL(string: url)) { phase in
            switch phase {
            case .empty:
                ProgressView()
            case .success(let image):
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
            case .failure:
                Image(systemName: "photo")
                    .foregroundColor(.gray)
            @unknown default:
                EmptyView()
            }
        }
    }
}

// MARK: - LoadingView
struct LoadingView: View {
    var message: String = "Loading..."
    
    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.5)
            Text(message)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - ErrorView
struct ErrorView: View {
    let message: String
    var retryAction: (() -> Void)?
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.largeTitle)
                .foregroundColor(.red)
            
            Text(message)
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
            
            if let retry = retryAction {
                Button("Retry", action: retry)
                    .buttonStyle(.borderedProminent)
            }
        }
        .padding()
    }
}

// MARK: - Preview
#Preview {
    VStack(spacing: 20) {
        YiphButton(text: "Click Me", action: {})
        
        YiphCard {
            Text("Card Content")
        }
    }
    .padding()
}
`.trim());
    }

    /**
     * Generate Services
     */
    async generateServices(ir, appDir) {
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
            let decoded = try JSONDecoder().decode(T.self, from: data)
            return decoded
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

        await this.writeFile(`${appDir}/Services/StorageService.swift`, `
import Foundation

class StorageService {
    static let shared = StorageService()
    private let defaults = UserDefaults.standard
    
    private init() {}
    
    func save<T: Encodable>(_ value: T, forKey key: String) {
        if let encoded = try? JSONEncoder().encode(value) {
            defaults.set(encoded, forKey: key)
        }
    }
    
    func load<T: Decodable>(forKey key: String) -> T? {
        guard let data = defaults.data(forKey: key) else { return nil }
        return try? JSONDecoder().decode(T.self, from: data)
    }
    
    func remove(forKey key: String) {
        defaults.removeObject(forKey: key)
    }
    
    func exists(forKey key: String) -> Bool {
        return defaults.object(forKey: key) != nil
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
    
    // Navigation
    @Published var navigationPath = NavigationPath()
    
    // Theme
    @Published var isDarkMode = false
    
    // Loading states
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    func reset() {
        navigationPath = NavigationPath()
        isLoading = false
        errorMessage = nil
    }
    
    func showError(_ message: String) {
        errorMessage = message
    }
    
    func clearError() {
        errorMessage = nil
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

        // Contents.json for asset catalog
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
      "idiom" : "universal",
      "platform" : "ios",
      "size" : "1024x1024"
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
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>UIApplicationSceneManifest</key>
    <dict>
        <key>UIApplicationSupportsMultipleScenes</key>
        <true/>
    </dict>
    <key>UILaunchScreen</key>
    <dict/>
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>armv7</string>
    </array>
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
    <key>UISupportedInterfaceOrientations~ipad</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationPortraitUpsideDown</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
</dict>
</plist>
`);
    }

    // Helper methods
    mapIconName(name) {
        const iconMap = {
            'home': 'house.fill',
            'search': 'magnifyingglass',
            'settings': 'gearshape.fill',
            'person': 'person.fill',
            'profile': 'person.fill',
            'add': 'plus',
            'close': 'xmark',
            'menu': 'line.3.horizontal',
            'back': 'chevron.left',
            'forward': 'chevron.right',
            'star': 'star.fill',
            'favorite': 'heart.fill',
            'heart': 'heart.fill',
            'share': 'square.and.arrow.up',
            'edit': 'pencil',
            'delete': 'trash',
            'email': 'envelope.fill',
            'phone': 'phone.fill',
            'camera': 'camera.fill',
            'photo': 'photo.fill',
            'notification': 'bell.fill'
        };

        return iconMap[name.toLowerCase()] || 'house.fill';
    }

    swiftColor(color) {
        const parsed = this.parseColor(color);
        return `Color(red: ${parsed.r / 255}, green: ${parsed.g / 255}, blue: ${parsed.b / 255})`;
    }

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
        if (Array.isArray(value)) return `[${value.map(v => this.swiftDefaultValue(v, typeof v)).join(', ')}]`;

        return 'nil';
    }
}

export default IOSGenerator;
