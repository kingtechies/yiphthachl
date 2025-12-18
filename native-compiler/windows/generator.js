/**
 * Windows Native Generator
 * Generates Windows desktop application (EXE) from Yiphthachl AST
 * 
 * Generates:
 * - C# source files
 * - WinUI 3 / WPF XAML
 * - .csproj project file
 * - App manifest
 */

import { BaseNativeGenerator } from '../base-generator.js';
import path from 'path';

export class WindowsGenerator extends BaseNativeGenerator {
    constructor(options) {
        super(options);
        this.targetFramework = options.targetFramework || 'net8.0-windows';
        this.useWinUI = options.useWinUI !== false; // Default to WinUI 3
        this.windowsVersion = options.windowsVersion || '10.0.19041.0';
    }

    get platform() {
        return 'windows';
    }

    get packageExtension() {
        return 'exe';
    }

    /**
     * Generate Windows project from AST
     * @param {object} ast - The parsed AST
     * @returns {Promise<object>} - Generation result
     */
    async generate(ast) {
        try {
            // Transform AST to intermediate representation
            const ir = this.transformToIR(ast);

            // Create project structure
            await this.generateProjectStructure(ir);

            // Generate project file
            await this.generateProjectFile(ir);

            // Generate C# source files
            await this.generateCSharpSources(ir);

            // Generate XAML files
            await this.generateXamlFiles(ir);

            // Generate resources
            await this.generateResources(ir);

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
     * Build EXE
     * @returns {Promise<object>} - Build result
     */
    async build() {
        const projectPath = path.join(this.options.outputDir, this.platform);
        const appName = this.sanitizeIdentifier(this.options.appName);

        try {
            // Check for dotnet CLI
            const hasDotnet = await this.commandExists('dotnet');

            if (!hasDotnet) {
                throw new Error('.NET SDK is required to build Windows apps. Please install from https://dotnet.microsoft.com');
            }

            // Restore packages
            await this.executeCommand('dotnet restore', projectPath);

            // Build release
            await this.executeCommand(
                `dotnet build -c Release`,
                projectPath
            );

            // Publish self-contained
            await this.executeCommand(
                `dotnet publish -c Release -r win-x64 --self-contained -o ./publish`,
                projectPath
            );

            const exePath = path.join(projectPath, 'publish', `${appName}.exe`);

            return {
                success: true,
                path: exePath,
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
     * Check Windows environment
     * @returns {Promise<object>}
     */
    async checkEnvironment() {
        const result = {
            ready: true,
            dotnet: false,
            visualStudio: false,
            windowsSdk: false,
            missing: []
        };

        // Check Windows platform
        if (process.platform !== 'win32') {
            result.missing.push('Windows OS (Windows development requires Windows)');
            result.ready = false;
            return result;
        }

        // Check .NET
        result.dotnet = await this.commandExists('dotnet');
        if (!result.dotnet) {
            result.missing.push('.NET SDK 8.0+');
            result.ready = false;
        }

        // Check msbuild (Visual Studio)
        result.visualStudio = await this.commandExists('msbuild');
        if (!result.visualStudio) {
            result.missing.push('Visual Studio (optional, for IDE support)');
        }

        return result;
    }

    /**
     * Generate project directory structure
     */
    async generateProjectStructure(ir) {
        const appName = this.sanitizeIdentifier(ir.app?.name || this.options.appName);

        const dirs = [
            'Views',
            'ViewModels',
            'Models',
            'Services',
            'Components',
            'Assets',
            'Styles'
        ];

        for (const dir of dirs) {
            await this.createOutputDirectory(
                path.join(this.options.outputDir, this.platform, dir)
            );
        }
    }

    /**
     * Generate .csproj project file
     */
    async generateProjectFile(ir) {
        const appName = this.sanitizeIdentifier(ir.app?.name || this.options.appName);

        if (this.useWinUI) {
            // WinUI 3 project
            await this.writeFile(`${appName}.csproj`, `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>${this.targetFramework}</TargetFramework>
    <TargetPlatformMinVersion>${this.windowsVersion}</TargetPlatformMinVersion>
    <RootNamespace>${appName}</RootNamespace>
    <ApplicationManifest>app.manifest</ApplicationManifest>
    <Platforms>x86;x64;arm64</Platforms>
    <RuntimeIdentifiers>win-x86;win-x64;win-arm64</RuntimeIdentifiers>
    <UseWinUI>true</UseWinUI>
    <EnableMsixTooling>true</EnableMsixTooling>
    <Version>${this.options.version}</Version>
    <AssemblyVersion>${this.options.version}.0</AssemblyVersion>
    <FileVersion>${this.options.version}.0</FileVersion>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <Content Include="Assets\\**" />
  </ItemGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.WindowsAppSDK" Version="1.4.231115000" />
    <PackageReference Include="Microsoft.Windows.SDK.BuildTools" Version="10.0.22621.756" />
    <PackageReference Include="CommunityToolkit.Mvvm" Version="8.2.2" />
    <PackageReference Include="CommunityToolkit.WinUI.UI.Controls" Version="7.1.2" />
    <Manifest Include="$(ApplicationManifest)" />
  </ItemGroup>

  <ItemGroup>
    <Page Update="Views\\**\\*.xaml">
      <Generator>MSBuild:Compile</Generator>
    </Page>
    <Page Update="Styles\\**\\*.xaml">
      <Generator>MSBuild:Compile</Generator>
    </Page>
  </ItemGroup>
</Project>
`);
        } else {
            // WPF project
            await this.writeFile(`${appName}.csproj`, `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>${this.targetFramework}</TargetFramework>
    <RootNamespace>${appName}</RootNamespace>
    <UseWPF>true</UseWPF>
    <Version>${this.options.version}</Version>
    <AssemblyVersion>${this.options.version}.0</AssemblyVersion>
    <FileVersion>${this.options.version}.0</FileVersion>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="CommunityToolkit.Mvvm" Version="8.2.2" />
    <PackageReference Include="Microsoft.Extensions.DependencyInjection" Version="8.0.0" />
  </ItemGroup>
</Project>
`);
        }

        // App manifest
        await this.writeFile('app.manifest', `<?xml version="1.0" encoding="utf-8"?>
<assembly manifestVersion="1.0" xmlns="urn:schemas-microsoft-com:asm.v1">
  <assemblyIdentity version="1.0.0.0" name="${appName}.app"/>
  <trustInfo xmlns="urn:schemas-microsoft-com:asm.v2">
    <security>
      <requestedPrivileges xmlns="urn:schemas-microsoft-com:asm.v3">
        <requestedExecutionLevel level="asInvoker" uiAccess="false" />
      </requestedPrivileges>
    </security>
  </trustInfo>
  <compatibility xmlns="urn:schemas-microsoft-com:compatibility.v1">
    <application>
      <supportedOS Id="{8e0f7a12-bfb3-4fe8-b9a5-48fd50a15a9a}" />
      <supportedOS Id="{1f676c76-80e1-4239-95bb-83d0f6d0da78}" />
    </application>
  </compatibility>
</assembly>
`);
    }

    /**
     * Generate C# source files
     */
    async generateCSharpSources(ir) {
        const appName = this.sanitizeIdentifier(ir.app?.name || this.options.appName);
        const displayName = ir.app?.name || this.options.appName;

        if (this.useWinUI) {
            await this.generateWinUISources(ir, appName, displayName);
        } else {
            await this.generateWpfSources(ir, appName, displayName);
        }

        // Generate ViewModels
        await this.generateViewModels(ir, appName);

        // Generate Models
        await this.generateModels(ir, appName);

        // Generate Services
        await this.generateServices(ir, appName);
    }

    /**
     * Generate WinUI 3 source files
     */
    async generateWinUISources(ir, appName, displayName) {
        // App.xaml.cs
        await this.writeFile('App.xaml.cs', `using Microsoft.UI.Xaml;

namespace ${appName};

public partial class App : Application
{
    private Window? m_window;

    public App()
    {
        this.InitializeComponent();
    }

    protected override void OnLaunched(LaunchActivatedEventArgs args)
    {
        m_window = new MainWindow();
        m_window.Activate();
    }

    public static Window? MainWindow => ((App)Current).m_window;
}
`);

        // MainWindow.xaml.cs
        await this.writeFile('MainWindow.xaml.cs', `using Microsoft.UI.Xaml;

namespace ${appName};

public sealed partial class MainWindow : Window
{
    public MainWindow()
    {
        this.InitializeComponent();
        
        Title = "${displayName}";
        ExtendsContentIntoTitleBar = true;
        SetTitleBar(AppTitleBar);
    }
}
`);
    }

    /**
     * Generate WPF source files
     */
    async generateWpfSources(ir, appName, displayName) {
        // App.xaml.cs
        await this.writeFile('App.xaml.cs', `using System.Windows;

namespace ${appName};

public partial class App : Application
{
    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);
        
        var mainWindow = new MainWindow();
        mainWindow.Show();
    }
}
`);

        // MainWindow.xaml.cs
        await this.writeFile('MainWindow.xaml.cs', `using System.Windows;

namespace ${appName};

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        DataContext = new MainViewModel();
    }
}
`);
    }

    /**
     * Generate ViewModels
     */
    async generateViewModels(ir, appName) {
        const stateProperties = ir.state.map(s => {
            const type = this.csharpType(s.type);
            const name = this.pascalCase(s.name);
            const fieldName = `_${this.camelCase(s.name)}`;
            const defaultValue = this.csharpDefaultValue(s.initialValue, s.type);

            return `
    private ${type} ${fieldName} = ${defaultValue};
    public ${type} ${name}
    {
        get => ${fieldName};
        set => SetProperty(ref ${fieldName}, value);
    }`;
        }).join('\n');

        await this.writeFile('ViewModels/MainViewModel.cs', `using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System.Collections.ObjectModel;

namespace ${appName}.ViewModels;

public partial class MainViewModel : ObservableObject
{
    // Generated state from Yiphthachl source
    ${stateProperties || '// No state defined'}

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private string? _errorMessage;

    [ObservableProperty]
    private ObservableCollection<ItemModel> _items = new();

    public MainViewModel()
    {
        LoadData();
    }

    [RelayCommand]
    private async Task LoadData()
    {
        IsLoading = true;
        ErrorMessage = null;

        try
        {
            await Task.Delay(500); // Simulate loading
            
            Items.Clear();
            Items.Add(new ItemModel { Title = "First Item", Description = "Description 1" });
            Items.Add(new ItemModel { Title = "Second Item", Description = "Description 2" });
            Items.Add(new ItemModel { Title = "Third Item", Description = "Description 3" });
        }
        catch (Exception ex)
        {
            ErrorMessage = ex.Message;
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private void AddItem()
    {
        Items.Add(new ItemModel 
        { 
            Title = $"New Item {Items.Count + 1}",
            Description = "New item description"
        });
    }

    [RelayCommand]
    private void RemoveItem(ItemModel item)
    {
        Items.Remove(item);
    }
}
`);

        // Base ViewModel
        await this.writeFile('ViewModels/ViewModelBase.cs', `using CommunityToolkit.Mvvm.ComponentModel;

namespace ${appName}.ViewModels;

public abstract class ViewModelBase : ObservableObject
{
    private bool _isBusy;
    public bool IsBusy
    {
        get => _isBusy;
        set => SetProperty(ref _isBusy, value);
    }
}
`);
    }

    /**
     * Generate Models
     */
    async generateModels(ir, appName) {
        await this.writeFile('Models/ItemModel.cs', `using CommunityToolkit.Mvvm.ComponentModel;

namespace ${appName}.Models;

public partial class ItemModel : ObservableObject
{
    [ObservableProperty]
    private string _title = string.Empty;

    [ObservableProperty]
    private string _description = string.Empty;

    [ObservableProperty]
    private bool _isCompleted;
}
`);

        await this.writeFile('Models/UserModel.cs', `using CommunityToolkit.Mvvm.ComponentModel;

namespace ${appName}.Models;

public partial class UserModel : ObservableObject
{
    [ObservableProperty]
    private string _name = string.Empty;

    [ObservableProperty]
    private string _email = string.Empty;
}
`);
    }

    /**
     * Generate Services
     */
    async generateServices(ir, appName) {
        await this.writeFile('Services/HttpService.cs', `using System.Net.Http.Json;
using System.Text.Json;

namespace ${appName}.Services;

public class HttpService
{
    private readonly HttpClient _httpClient;

    public HttpService()
    {
        _httpClient = new HttpClient();
    }

    public async Task<T?> GetAsync<T>(string url)
    {
        try
        {
            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<T>();
        }
        catch (Exception)
        {
            return default;
        }
    }

    public async Task<TResponse?> PostAsync<TRequest, TResponse>(string url, TRequest data)
    {
        try
        {
            var json = JsonSerializer.Serialize(data);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
            
            var response = await _httpClient.PostAsync(url, content);
            response.EnsureSuccessStatusCode();
            
            return await response.Content.ReadFromJsonAsync<TResponse>();
        }
        catch (Exception)
        {
            return default;
        }
    }
}
`);

        await this.writeFile('Services/StorageService.cs', `using System.Text.Json;

namespace ${appName}.Services;

public class StorageService
{
    private readonly string _basePath;

    public StorageService()
    {
        _basePath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "${appName}"
        );
        
        Directory.CreateDirectory(_basePath);
    }

    public void Save<T>(string key, T data)
    {
        var filePath = Path.Combine(_basePath, $"{key}.json");
        var json = JsonSerializer.Serialize(data);
        File.WriteAllText(filePath, json);
    }

    public T? Load<T>(string key)
    {
        var filePath = Path.Combine(_basePath, $"{key}.json");
        
        if (!File.Exists(filePath))
            return default;
        
        var json = File.ReadAllText(filePath);
        return JsonSerializer.Deserialize<T>(json);
    }

    public void Delete(string key)
    {
        var filePath = Path.Combine(_basePath, $"{key}.json");
        
        if (File.Exists(filePath))
            File.Delete(filePath);
    }
}
`);
    }

    /**
     * Generate XAML files
     */
    async generateXamlFiles(ir) {
        const appName = this.sanitizeIdentifier(ir.app?.name || this.options.appName);
        const displayName = ir.app?.name || this.options.appName;

        if (this.useWinUI) {
            await this.generateWinUIXaml(ir, appName, displayName);
        } else {
            await this.generateWpfXaml(ir, appName, displayName);
        }

        // Generate view pages
        await this.generateViewPages(ir, appName);

        // Generate styles
        await this.generateStyles(ir, appName);
    }

    /**
     * Generate WinUI 3 XAML files
     */
    async generateWinUIXaml(ir, appName, displayName) {
        // App.xaml
        await this.writeFile('App.xaml', `<?xml version="1.0" encoding="utf-8"?>
<Application
    x:Class="${appName}.App"
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    xmlns:local="using:${appName}">
    <Application.Resources>
        <ResourceDictionary>
            <ResourceDictionary.MergedDictionaries>
                <XamlControlsResources xmlns="using:Microsoft.UI.Xaml.Controls" />
                <ResourceDictionary Source="Styles/Colors.xaml" />
                <ResourceDictionary Source="Styles/Styles.xaml" />
            </ResourceDictionary.MergedDictionaries>
        </ResourceDictionary>
    </Application.Resources>
</Application>
`);

        // MainWindow.xaml
        const mainContent = this.generateMainWindowContent(ir);

        await this.writeFile('MainWindow.xaml', `<?xml version="1.0" encoding="utf-8"?>
<Window
    x:Class="${appName}.MainWindow"
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    xmlns:local="using:${appName}"
    xmlns:viewmodels="using:${appName}.ViewModels"
    Title="${displayName}">

    <Window.DataContext>
        <viewmodels:MainViewModel />
    </Window.DataContext>

    <Grid>
        <Grid.RowDefinitions>
            <RowDefinition Height="48" />
            <RowDefinition Height="*" />
        </Grid.RowDefinitions>

        <!-- Title Bar -->
        <Grid x:Name="AppTitleBar" Grid.Row="0" Background="{ThemeResource SystemAccentColor}">
            <TextBlock 
                Text="${displayName}"
                VerticalAlignment="Center"
                Margin="16,0,0,0"
                Style="{StaticResource TitleTextBlockStyle}" />
        </Grid>

        <!-- Main Content -->
        <Grid Grid.Row="1" Background="{ThemeResource ApplicationPageBackgroundThemeBrush}">
            ${mainContent}
        </Grid>
    </Grid>
</Window>
`);
    }

    /**
     * Generate WPF XAML files
     */
    async generateWpfXaml(ir, appName, displayName) {
        // App.xaml
        await this.writeFile('App.xaml', `<Application x:Class="${appName}.App"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
    <Application.Resources>
        <ResourceDictionary>
            <ResourceDictionary.MergedDictionaries>
                <ResourceDictionary Source="Styles/Colors.xaml" />
                <ResourceDictionary Source="Styles/Styles.xaml" />
            </ResourceDictionary.MergedDictionaries>
        </ResourceDictionary>
    </Application.Resources>
</Application>
`);

        // MainWindow.xaml
        const mainContent = this.generateMainWindowContent(ir);

        await this.writeFile('MainWindow.xaml', `<Window x:Class="${appName}.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:viewmodels="clr-namespace:${appName}.ViewModels"
        Title="${displayName}" 
        Height="700" 
        Width="1000"
        WindowStartupLocation="CenterScreen">
    
    <Window.DataContext>
        <viewmodels:MainViewModel />
    </Window.DataContext>

    <Grid>
        ${mainContent}
    </Grid>
</Window>
`);
    }

    /**
     * Generate main window content from IR
     */
    generateMainWindowContent(ir) {
        const mainScreen = ir.screens.find(s => s.isMain) || ir.screens[0];

        if (!mainScreen || !mainScreen.body) {
            return `
            <StackPanel VerticalAlignment="Center" HorizontalAlignment="Center">
                <TextBlock Text="Welcome to Yiphthachl!" FontSize="24" FontWeight="Bold" />
                <TextBlock Text="Your app is ready to customize." Margin="0,8,0,0" />
            </StackPanel>`;
        }

        return this.generateXamlWidget(mainScreen.body);
    }

    /**
     * Generate XAML for a widget
     */
    generateXamlWidget(widget) {
        if (!widget) return '';

        if (Array.isArray(widget)) {
            return widget.map(w => this.generateXamlWidget(w)).join('\n                ');
        }

        const type = widget.type;
        const props = widget.properties || {};
        const children = widget.children || [];

        switch (type) {
            case 'Scaffold':
                return this.generateScaffoldXaml(widget);

            case 'TextWidget':
            case 'Text':
                return this.generateTextXaml(props);

            case 'ButtonWidget':
            case 'Button':
                return this.generateButtonXaml(props);

            case 'ImageWidget':
            case 'Image':
                return this.generateImageXaml(props);

            case 'ColumnWidget':
            case 'Column':
                return this.generateStackPanelXaml(props, children, 'Vertical');

            case 'RowWidget':
            case 'Row':
                return this.generateStackPanelXaml(props, children, 'Horizontal');

            case 'CardWidget':
            case 'Card':
                return this.generateCardXaml(props, children);

            case 'ListViewWidget':
            case 'ListView':
                return this.generateListViewXaml(props);

            default:
                return `<!-- Unsupported widget: ${type} -->`;
        }
    }

    /**
     * Generate Scaffold XAML
     */
    generateScaffoldXaml(scaffold) {
        const title = scaffold.appBar?.text || scaffold.appBar?.title || 'App';
        const bodyContent = scaffold.body ? this.generateXamlWidget(scaffold.body) : '';

        return `
            <Grid>
                <Grid.RowDefinitions>
                    <RowDefinition Height="Auto" />
                    <RowDefinition Height="*" />
                </Grid.RowDefinitions>

                <!-- App Bar -->
                <Border Grid.Row="0" Background="{StaticResource AccentBrush}" Padding="16">
                    <TextBlock Text="${title}" FontSize="20" FontWeight="Bold" Foreground="White" />
                </Border>

                <!-- Body -->
                <ScrollViewer Grid.Row="1">
                    <StackPanel Padding="16">
                        ${bodyContent}
                    </StackPanel>
                </ScrollViewer>
            </Grid>`;
    }

    /**
     * Generate Text XAML
     */
    generateTextXaml(props) {
        const text = props.text || props.content || '';
        const fontSize = props.fontSize || props.size || 14;
        const fontWeight = props.bold ? 'Bold' : 'Normal';
        const color = props.color ? `Foreground="${this.xamlColor(props.color)}"` : '';

        return `<TextBlock Text="${text}" FontSize="${fontSize}" FontWeight="${fontWeight}" ${color} TextWrapping="Wrap" />`;
    }

    /**
     * Generate Button XAML
     */
    generateButtonXaml(props) {
        const text = props.text || props.label || 'Button';
        const background = props.backgroundColor ? `Background="${this.xamlColor(props.backgroundColor)}"` : '';

        return `<Button Content="${text}" ${background} Padding="16,8" Margin="4" />`;
    }

    /**
     * Generate Image XAML
     */
    generateImageXaml(props) {
        const url = props.url || props.src || '';
        const width = props.width ? `Width="${props.width}"` : '';
        const height = props.height ? `Height="${props.height}"` : '';

        return `<Image Source="${url}" ${width} ${height} Stretch="Uniform" />`;
    }

    /**
     * Generate StackPanel XAML
     */
    generateStackPanelXaml(props, children, orientation) {
        const childrenXaml = children.map(c => this.generateXamlWidget(c)).join('\n                    ');

        return `<StackPanel Orientation="${orientation}" Spacing="8">
                    ${childrenXaml}
                </StackPanel>`;
    }

    /**
     * Generate Card XAML
     */
    generateCardXaml(props, children) {
        const childrenXaml = children.map(c => this.generateXamlWidget(c)).join('\n                        ');

        return `<Border Background="{ThemeResource CardBackgroundFillColorDefault}" 
                        CornerRadius="8" 
                        Padding="16" 
                        Margin="4">
                    <StackPanel>
                        ${childrenXaml}
                    </StackPanel>
                </Border>`;
    }

    /**
     * Generate ListView XAML
     */
    generateListViewXaml(props) {
        return `<ListView ItemsSource="{Binding Items}" Margin="0,8,0,0">
                    <ListView.ItemTemplate>
                        <DataTemplate>
                            <Border Background="{ThemeResource CardBackgroundFillColorDefault}" 
                                    CornerRadius="4" 
                                    Padding="12" 
                                    Margin="0,4">
                                <StackPanel>
                                    <TextBlock Text="{Binding Title}" FontWeight="SemiBold" />
                                    <TextBlock Text="{Binding Description}" 
                                               Opacity="0.7" 
                                               Margin="0,4,0,0" />
                                </StackPanel>
                            </Border>
                        </DataTemplate>
                    </ListView.ItemTemplate>
                </ListView>`;
    }

    /**
     * Generate view pages
     */
    async generateViewPages(ir, appName) {
        // Generate additional view pages for each screen
        for (const screen of ir.screens.filter(s => !s.isMain)) {
            const viewName = `${this.sanitizeIdentifier(screen.name)}Page`;
            const content = screen.body ? this.generateXamlWidget(screen.body) : '<TextBlock Text="Page content" />';

            if (this.useWinUI) {
                await this.writeFile(`Views/${viewName}.xaml`, `<?xml version="1.0" encoding="utf-8"?>
<Page
    x:Class="${appName}.Views.${viewName}"
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
    
    <Grid Padding="16">
        ${content}
    </Grid>
</Page>
`);

                await this.writeFile(`Views/${viewName}.xaml.cs`, `namespace ${appName}.Views;

public sealed partial class ${viewName} : Page
{
    public ${viewName}()
    {
        this.InitializeComponent();
    }
}
`);
            }
        }
    }

    /**
     * Generate styles
     */
    async generateStyles(ir, appName) {
        // Colors.xaml
        await this.writeFile('Styles/Colors.xaml', `<?xml version="1.0" encoding="utf-8"?>
<ResourceDictionary xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
                    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
    
    <!-- Primary Colors -->
    <Color x:Key="AccentColor">#6366F1</Color>
    <Color x:Key="SecondaryColor">#8B5CF6</Color>
    <Color x:Key="TertiaryColor">#F472B6</Color>
    
    <!-- Brushes -->
    <SolidColorBrush x:Key="AccentBrush" Color="{StaticResource AccentColor}" />
    <SolidColorBrush x:Key="SecondaryBrush" Color="{StaticResource SecondaryColor}" />
    <SolidColorBrush x:Key="TertiaryBrush" Color="{StaticResource TertiaryColor}" />
    
</ResourceDictionary>
`);

        // Styles.xaml
        await this.writeFile('Styles/Styles.xaml', `<?xml version="1.0" encoding="utf-8"?>
<ResourceDictionary xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
                    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
    
    <!-- Button Styles -->
    <Style x:Key="PrimaryButton" TargetType="Button">
        <Setter Property="Background" Value="{StaticResource AccentBrush}" />
        <Setter Property="Foreground" Value="White" />
        <Setter Property="Padding" Value="16,8" />
        <Setter Property="CornerRadius" Value="4" />
    </Style>
    
    <!-- Card Style -->
    <Style x:Key="CardStyle" TargetType="Border">
        <Setter Property="Background" Value="{ThemeResource CardBackgroundFillColorDefault}" />
        <Setter Property="CornerRadius" Value="8" />
        <Setter Property="Padding" Value="16" />
    </Style>
    
</ResourceDictionary>
`);
    }

    /**
     * Generate resources
     */
    async generateResources(ir) {
        // Create a simple app icon placeholder info
        await this.writeFile('Assets/README.txt', `Yiphthachl Generated Assets
============================

Place your app icon and other assets in this directory.

Required assets:
- AppIcon.ico (256x256 or larger)
- SplashScreen.png (optional)

The app will use default Windows icons if not provided.
`);
    }

    // Helper methods
    csharpType(type) {
        const typeMap = {
            'string': 'string',
            'number': 'double',
            'boolean': 'bool',
            'array': 'List<object>',
            'object': 'Dictionary<string, object>',
            'any': 'object'
        };
        return typeMap[type] || 'object';
    }

    csharpDefaultValue(value, type) {
        if (value === null || value === undefined) {
            const defaults = {
                'string': '""',
                'number': '0.0',
                'boolean': 'false',
                'array': 'new List<object>()',
                'object': 'new Dictionary<string, object>()'
            };
            return defaults[type] || 'null!';
        }

        if (typeof value === 'string') return `"${value}"`;
        if (typeof value === 'boolean') return value.toString();
        if (typeof value === 'number') return `${value}`;

        return 'null!';
    }

    xamlColor(color) {
        const parsed = this.parseColor(color);
        const toHex = (n) => n.toString(16).padStart(2, '0').toUpperCase();
        return `#FF${toHex(parsed.r)}${toHex(parsed.g)}${toHex(parsed.b)}`;
    }

    pascalCase(str) {
        return str
            .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
            .replace(/^./, chr => chr.toUpperCase());
    }

    camelCase(str) {
        const pascal = this.pascalCase(str);
        return pascal.charAt(0).toLowerCase() + pascal.slice(1);
    }
}

export default WindowsGenerator;
