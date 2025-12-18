/**
 * Android Native Generator
 * Generates Android project and APK from Yiphthachl AST
 * 
 * Generates:
 * - Kotlin source files
 * - Jetpack Compose UI
 * - Gradle build files
 * - Android manifest
 * - Resource files
 */

import { BaseNativeGenerator } from '../base-generator.js';
import path from 'path';

export class AndroidGenerator extends BaseNativeGenerator {
    constructor(options) {
        super(options);
        this.minSdk = options.androidMinSdk || 24;
        this.targetSdk = options.androidTargetSdk || 34;
        this.compileSdk = options.androidCompileSdk || 34;
        this.kotlinVersion = '1.9.20';
        this.composeVersion = '1.5.4';
        this.gradleVersion = '8.2.0';
    }

    get platform() {
        return 'android';
    }

    get packageExtension() {
        return 'apk';
    }

    /**
     * Generate Android project from AST
     * @param {object} ast - The parsed AST
     * @returns {Promise<object>} - Generation result
     */
    async generate(ast) {
        try {
            // Transform AST to intermediate representation
            const ir = this.transformToIR(ast);

            // Create project structure
            await this.generateProjectStructure(ir);

            // Generate Gradle files
            await this.generateGradleFiles(ir);

            // Generate Android Manifest
            await this.generateManifest(ir);

            // Generate Kotlin source files
            await this.generateKotlinSources(ir);

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
     * Build APK
     * @returns {Promise<object>} - Build result
     */
    async build() {
        const projectPath = path.join(this.options.outputDir, this.platform);

        try {
            // Check for Gradle
            const hasGradle = await this.commandExists('gradle');

            if (!hasGradle) {
                // Try gradlew
                const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
                await this.executeCommand(`${gradleCmd} assembleDebug`, projectPath);
            } else {
                await this.executeCommand('gradle assembleDebug', projectPath);
            }

            const apkPath = path.join(
                projectPath,
                'app', 'build', 'outputs', 'apk', 'debug',
                `${this.options.appName}-debug.apk`
            );

            return {
                success: true,
                path: apkPath,
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
     * Check Android environment
     * @returns {Promise<object>}
     */
    async checkEnvironment() {
        const result = {
            ready: true,
            java: false,
            gradle: false,
            androidSdk: false,
            missing: []
        };

        // Check Java
        result.java = await this.commandExists('java');
        if (!result.java) {
            result.missing.push('Java JDK 11+');
            result.ready = false;
        }

        // Check Gradle
        result.gradle = await this.commandExists('gradle');
        if (!result.gradle) {
            result.missing.push('Gradle (will use bundled gradlew)');
        }

        // Check Android SDK
        result.androidSdk = !!process.env.ANDROID_HOME || !!process.env.ANDROID_SDK_ROOT;
        if (!result.androidSdk) {
            result.missing.push('Android SDK (set ANDROID_HOME)');
            result.ready = false;
        }

        return result;
    }

    /**
     * Generate project directory structure
     */
    async generateProjectStructure(ir) {
        const dirs = [
            'app/src/main/java',
            'app/src/main/kotlin',
            'app/src/main/res/drawable',
            'app/src/main/res/layout',
            'app/src/main/res/mipmap-hdpi',
            'app/src/main/res/mipmap-mdpi',
            'app/src/main/res/mipmap-xhdpi',
            'app/src/main/res/mipmap-xxhdpi',
            'app/src/main/res/mipmap-xxxhdpi',
            'app/src/main/res/values',
            'app/src/main/res/values-night',
            'gradle/wrapper'
        ];

        for (const dir of dirs) {
            await this.createOutputDirectory(
                path.join(this.options.outputDir, this.platform, dir)
            );
        }
    }

    /**
     * Generate Gradle build files
     */
    async generateGradleFiles(ir) {
        const appName = ir.app?.name || this.options.appName;
        const packageName = this.options.bundleId.replace(/-/g, '_');

        // settings.gradle.kts
        await this.writeFile('settings.gradle.kts', `
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "${this.sanitizeIdentifier(appName)}"
include(":app")
`.trim());

        // Root build.gradle.kts
        await this.writeFile('build.gradle.kts', `
// Top-level build file
plugins {
    id("com.android.application") version "${this.gradleVersion}" apply false
    id("com.android.library") version "${this.gradleVersion}" apply false
    id("org.jetbrains.kotlin.android") version "${this.kotlinVersion}" apply false
}

tasks.register("clean", Delete::class) {
    delete(rootProject.buildDir)
}
`.trim());

        // App build.gradle.kts
        await this.writeFile('app/build.gradle.kts', `
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "${packageName}"
    compileSdk = ${this.compileSdk}

    defaultConfig {
        applicationId = "${this.options.bundleId}"
        minSdk = ${this.minSdk}
        targetSdk = ${this.targetSdk}
        versionCode = ${this.options.buildNumber}
        versionName = "${this.options.version}"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = ${this.options.minify}
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = "11"
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "${this.composeVersion}"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.6.2")
    implementation("androidx.activity:activity-compose:1.8.1")
    
    implementation(platform("androidx.compose:compose-bom:2023.10.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.navigation:navigation-compose:2.7.5")
    
    // HTTP Client
    implementation("io.ktor:ktor-client-core:2.3.6")
    implementation("io.ktor:ktor-client-android:2.3.6")
    implementation("io.ktor:ktor-client-content-negotiation:2.3.6")
    implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.6")
    
    // Image loading
    implementation("io.coil-kt:coil-compose:2.5.0")
    
    // DataStore for local storage
    implementation("androidx.datastore:datastore-preferences:1.0.0")
    
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    androidTestImplementation(platform("androidx.compose:compose-bom:2023.10.01"))
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
`.trim());

        // gradle.properties
        await this.writeFile('gradle.properties', `
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
`.trim());

        // Proguard rules
        await this.writeFile('app/proguard-rules.pro', `
# Yiphthachl Generated App ProGuard Rules

# Keep Compose
-keep class androidx.compose.** { *; }
-keep class kotlin.** { *; }

# Keep navigation
-keep class * extends androidx.navigation.Navigator { *; }
`.trim());

        // Gradle wrapper properties
        await this.writeFile('gradle/wrapper/gradle-wrapper.properties', `
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.4-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`.trim());
    }

    /**
     * Generate Android Manifest
     */
    async generateManifest(ir) {
        const appName = ir.app?.name || this.options.appName;
        const packageName = this.options.bundleId.replace(/-/g, '_');

        const permissions = this.options.permissions || [];
        const permissionTags = permissions.map(p =>
            `    <uses-permission android:name="android.permission.${p.toUpperCase()}" />`
        ).join('\n');

        await this.writeFile('app/src/main/AndroidManifest.xml', `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

${permissionTags}
    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="${appName}"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.YiphthachlApp"
        tools:targetApi="31">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.YiphthachlApp">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
`.trim());

        // Data extraction rules
        await this.writeFile('app/src/main/res/xml/data_extraction_rules.xml', `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup>
        <include domain="sharedpref" path="."/>
        <exclude domain="database" path=""/>
    </cloud-backup>
</data-extraction-rules>
`.trim());

        // Backup rules
        await this.writeFile('app/src/main/res/xml/backup_rules.xml', `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
    <include domain="sharedpref" path="."/>
    <exclude domain="database" path=""/>
</full-backup-content>
`.trim());

        // Create xml directory
        await this.createOutputDirectory(
            path.join(this.options.outputDir, this.platform, 'app/src/main/res/xml')
        );
    }

    /**
     * Generate Kotlin source files with Jetpack Compose
     */
    async generateKotlinSources(ir) {
        const packageName = this.options.bundleId.replace(/-/g, '_');
        const packagePath = packageName.replace(/\./g, '/');
        const kotlinDir = `app/src/main/kotlin/${packagePath}`;

        // MainActivity.kt
        await this.writeFile(`${kotlinDir}/MainActivity.kt`, `
package ${packageName}

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import ${packageName}.ui.theme.YiphthachlAppTheme
import ${packageName}.screens.MainScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            YiphthachlAppTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MainScreen()
                }
            }
        }
    }
}
`.trim());

        // Generate screens
        await this.generateScreens(ir, kotlinDir, packageName);

        // Generate theme
        await this.generateTheme(ir, kotlinDir, packageName);

        // Generate navigation
        await this.generateNavigation(ir, kotlinDir, packageName);

        // Generate state management
        await this.generateStateManagement(ir, kotlinDir, packageName);

        // Generate components
        await this.generateComponents(ir, kotlinDir, packageName);
    }

    /**
     * Generate screen composables
     */
    async generateScreens(ir, kotlinDir, packageName) {
        const screensDir = `${kotlinDir}/screens`;

        // MainScreen.kt
        const mainScreen = ir.screens.find(s => s.isMain) || ir.screens[0];
        const mainScreenCode = this.generateScreenComposable(mainScreen, packageName);

        await this.writeFile(`${screensDir}/MainScreen.kt`, `
package ${packageName}.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import ${packageName}.components.*
import ${packageName}.state.AppState

${mainScreenCode}
`.trim());

        // Generate other screens
        for (const screen of ir.screens.filter(s => !s.isMain)) {
            const screenCode = this.generateScreenComposable(screen, packageName);
            const screenName = this.sanitizeIdentifier(screen.name);

            await this.writeFile(`${screensDir}/${screenName}Screen.kt`, `
package ${packageName}.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import ${packageName}.components.*
import ${packageName}.state.AppState

${screenCode}
`.trim());
        }
    }

    /**
     * Generate a single screen composable
     */
    generateScreenComposable(screen, packageName) {
        if (!screen) {
            return `
@Composable
fun MainScreen() {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Yiphthachl App") }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentAlignment = Alignment.Center
        ) {
            Text("Welcome to Yiphthachl!")
        }
    }
}
`;
        }

        const screenName = this.sanitizeIdentifier(screen.name || 'Main');
        const body = screen.body;

        if (body?.type === 'Scaffold') {
            return this.generateScaffoldCode(screenName, body);
        }

        return `
@Composable
fun ${screenName}Screen() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        ${this.generateWidgetCode(body)}
    }
}
`;
    }

    /**
     * Generate Scaffold composable code
     */
    generateScaffoldCode(screenName, scaffold) {
        const appBarCode = scaffold.appBar
            ? this.generateAppBarCode(scaffold.appBar)
            : '';

        const bottomNavCode = scaffold.bottomNavigation
            ? this.generateBottomNavCode(scaffold.bottomNavigation)
            : '';

        const fabCode = scaffold.floatingActionButton
            ? this.generateFabCode(scaffold.floatingActionButton)
            : '';

        const bodyCode = scaffold.body
            ? this.generateWidgetCode(scaffold.body)
            : 'Text("Welcome!")';

        return `
@Composable
fun ${screenName}Screen() {
    var selectedTab by remember { mutableStateOf(0) }
    
    Scaffold(
        ${appBarCode ? `topBar = { ${appBarCode} },` : ''}
        ${bottomNavCode ? `bottomBar = { ${bottomNavCode} },` : ''}
        ${fabCode ? `floatingActionButton = { ${fabCode} },` : ''}
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            ${bodyCode}
        }
    }
}
`;
    }

    /**
     * Generate TopAppBar code
     */
    generateAppBarCode(appBar) {
        const title = appBar.text || appBar.title || 'App';
        return `TopAppBar(
            title = { Text("${title}") }
        )`;
    }

    /**
     * Generate BottomNavigation code
     */
    generateBottomNavCode(bottomNav) {
        if (!bottomNav.items || bottomNav.items.length === 0) {
            return '';
        }

        const items = bottomNav.items.map((item, index) => {
            const icon = this.mapIconName(item.icon || 'home');
            return `NavigationBarItem(
                icon = { Icon(Icons.Filled.${icon}, contentDescription = "${item.label || item.name}") },
                label = { Text("${item.label || item.name}") },
                selected = selectedTab == ${index},
                onClick = { selectedTab = ${index} }
            )`;
        }).join('\n            ');

        return `NavigationBar {
            ${items}
        }`;
    }

    /**
     * Generate FAB code
     */
    generateFabCode(fab) {
        const icon = this.mapIconName(fab.icon || 'add');
        return `FloatingActionButton(
            onClick = { /* TODO */ }
        ) {
            Icon(Icons.Filled.${icon}, contentDescription = "Action")
        }`;
    }

    /**
     * Generate widget code recursively
     */
    generateWidgetCode(widget) {
        if (!widget) return 'Spacer(modifier = Modifier.height(0.dp))';

        if (Array.isArray(widget)) {
            return widget.map(w => this.generateWidgetCode(w)).join('\n            ');
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
                return this.generateColumnCode(props, children);

            case 'RowWidget':
            case 'Row':
                return this.generateRowCode(props, children);

            case 'ContainerWidget':
            case 'Container':
            case 'CardWidget':
            case 'Card':
                return this.generateCardCode(props, children);

            case 'SpacerWidget':
            case 'Spacer':
                return `Spacer(modifier = Modifier.height(${props.size || 16}.dp))`;

            case 'DividerWidget':
            case 'Divider':
                return `Divider()`;

            case 'ListViewWidget':
            case 'ListView':
                return this.generateListViewCode(props, children);

            default:
                return `// Unsupported widget: ${type}`;
        }
    }

    /**
     * Generate Text composable
     */
    generateTextCode(props) {
        const text = props.text || props.content || '';
        const fontSize = props.fontSize || props.size || 16;
        const fontWeight = props.bold ? 'FontWeight.Bold' : 'FontWeight.Normal';
        const color = props.color ? `Color(0xFF${this.parseColorHex(props.color)})` : 'Color.Unspecified';
        const textAlign = props.align ? `TextAlign.${this.capitalizeFirst(props.align)}` : 'TextAlign.Start';

        return `Text(
            text = "${text}",
            fontSize = ${fontSize}.sp,
            fontWeight = ${fontWeight},
            color = ${color},
            textAlign = ${textAlign}
        )`;
    }

    /**
     * Generate Button composable
     */
    generateButtonCode(props, events) {
        const text = props.text || props.label || 'Button';
        const backgroundColor = props.backgroundColor || props.background;
        const colorCode = backgroundColor
            ? `containerColor = Color(0xFF${this.parseColorHex(backgroundColor)})`
            : '';

        return `Button(
            onClick = { /* TODO: Handle click */ },
            ${colorCode ? `colors = ButtonDefaults.buttonColors(${colorCode}),` : ''}
            modifier = Modifier.padding(8.dp)
        ) {
            Text("${text}")
        }`;
    }

    /**
     * Generate Image composable
     */
    generateImageCode(props) {
        const url = props.url || props.src || '';
        const width = props.width;
        const height = props.height;

        let modifier = 'Modifier';
        if (width) modifier += `.width(${width}.dp)`;
        if (height) modifier += `.height(${height}.dp)`;

        return `AsyncImage(
            model = "${url}",
            contentDescription = "${props.alt || 'Image'}",
            modifier = ${modifier}
        )`;
    }

    /**
     * Generate Column composable
     */
    generateColumnCode(props, children) {
        const childrenCode = children.map(c => this.generateWidgetCode(c)).join('\n            ');

        return `Column(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            ${childrenCode}
        }`;
    }

    /**
     * Generate Row composable
     */
    generateRowCode(props, children) {
        const childrenCode = children.map(c => this.generateWidgetCode(c)).join('\n            ');

        return `Row(
            modifier = Modifier.fillMaxWidth().padding(8.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            ${childrenCode}
        }`;
    }

    /**
     * Generate Card composable
     */
    generateCardCode(props, children) {
        const childrenCode = children.map(c => this.generateWidgetCode(c)).join('\n                ');

        return `Card(
            modifier = Modifier.fillMaxWidth().padding(8.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                ${childrenCode}
            }
        }`;
    }

    /**
     * Generate ListView composable
     */
    generateListViewCode(props, children) {
        return `LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp)
        ) {
            // TODO: Generate list items from data
            items(10) { index ->
                Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                    Text(
                        text = "Item \$index",
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }
        }`;
    }

    /**
     * Generate Theme files
     */
    async generateTheme(ir, kotlinDir, packageName) {
        const themeDir = `${kotlinDir}/ui/theme`;

        // Color.kt
        await this.writeFile(`${themeDir}/Color.kt`, `
package ${packageName}.ui.theme

import androidx.compose.ui.graphics.Color

val Purple80 = Color(0xFFD0BCFF)
val PurpleGrey80 = Color(0xFFCCC2DC)
val Pink80 = Color(0xFFEFB8C8)

val Purple40 = Color(0xFF6650a4)
val PurpleGrey40 = Color(0xFF625b71)
val Pink40 = Color(0xFF7D5260)

// Yiphthachl brand colors
val YiphthachlPrimary = Color(0xFF6366F1)
val YiphthachlSecondary = Color(0xFF8B5CF6)
val YiphthachlAccent = Color(0xFFF472B6)
`.trim());

        // Theme.kt
        await this.writeFile(`${themeDir}/Theme.kt`, `
package ${packageName}.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = Purple80,
    secondary = PurpleGrey80,
    tertiary = Pink80
)

private val LightColorScheme = lightColorScheme(
    primary = Purple40,
    secondary = PurpleGrey40,
    tertiary = Pink40
)

@Composable
fun YiphthachlAppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }
    
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.primary.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
`.trim());

        // Type.kt
        await this.writeFile(`${themeDir}/Type.kt`, `
package ${packageName}.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val Typography = Typography(
    bodyLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.5.sp
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 22.sp,
        lineHeight = 28.sp,
        letterSpacing = 0.sp
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.5.sp
    )
)
`.trim());
    }

    /**
     * Generate Navigation setup
     */
    async generateNavigation(ir, kotlinDir, packageName) {
        const navDir = `${kotlinDir}/navigation`;

        await this.writeFile(`${navDir}/Navigation.kt`, `
package ${packageName}.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import ${packageName}.screens.*

sealed class Screen(val route: String) {
    object Main : Screen("main")
    ${ir.screens.filter(s => !s.isMain).map(s =>
            `object ${this.sanitizeIdentifier(s.name)} : Screen("${s.name.toLowerCase()}")`
        ).join('\n    ')}
}

@Composable
fun AppNavigation(navController: NavHostController = rememberNavController()) {
    NavHost(
        navController = navController,
        startDestination = Screen.Main.route
    ) {
        composable(Screen.Main.route) {
            MainScreen()
        }
        ${ir.screens.filter(s => !s.isMain).map(s => `
        composable(Screen.${this.sanitizeIdentifier(s.name)}.route) {
            ${this.sanitizeIdentifier(s.name)}Screen()
        }`).join('')}
    }
}
`.trim());
    }

    /**
     * Generate State Management
     */
    async generateStateManagement(ir, kotlinDir, packageName) {
        const stateDir = `${kotlinDir}/state`;

        const stateFields = ir.state.map(s => {
            const type = this.kotlinType(s.type);
            const defaultValue = this.kotlinDefaultValue(s.initialValue, s.type);
            return `var ${this.sanitizeIdentifier(s.name)} by mutableStateOf(${defaultValue})`;
        }).join('\n        ');

        await this.writeFile(`${stateDir}/AppState.kt`, `
package ${packageName}.state

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

object AppState {
    // Generated state from Yiphthachl source
    ${stateFields || '// No state defined'}
    
    // Reset all state
    fun reset() {
        ${ir.state.map(s => {
            const defaultValue = this.kotlinDefaultValue(s.initialValue, s.type);
            return `${this.sanitizeIdentifier(s.name)} = ${defaultValue}`;
        }).join('\n        ') || '// Nothing to reset'}
    }
}
`.trim());
    }

    /**
     * Generate reusable components
     */
    async generateComponents(ir, kotlinDir, packageName) {
        const componentsDir = `${kotlinDir}/components`;

        await this.writeFile(`${componentsDir}/CommonComponents.kt`, `
package ${packageName}.components

import androidx.compose.animation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage

/**
 * Yiphthachl styled button
 */
@Composable
fun YiphButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    backgroundColor: Color = MaterialTheme.colorScheme.primary,
    cornerRadius: Dp = 8.dp
) {
    Button(
        onClick = onClick,
        modifier = modifier,
        shape = RoundedCornerShape(cornerRadius),
        colors = ButtonDefaults.buttonColors(containerColor = backgroundColor)
    ) {
        Text(text)
    }
}

/**
 * Yiphthachl styled card
 */
@Composable
fun YiphCard(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 12.dp,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(cornerRadius)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            content = content
        )
    }
}

/**
 * Yiphthachl styled image
 */
@Composable
fun YiphImage(
    url: String,
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 8.dp,
    contentDescription: String = "Image"
) {
    AsyncImage(
        model = url,
        contentDescription = contentDescription,
        modifier = modifier.clip(RoundedCornerShape(cornerRadius))
    )
}

/**
 * Spacer with customizable size
 */
@Composable
fun Space(size: Dp = 16.dp) {
    Spacer(modifier = Modifier.size(size))
}

/**
 * Loading indicator
 */
@Composable
fun LoadingIndicator(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator()
    }
}

/**
 * Error message display
 */
@Composable
fun ErrorMessage(
    message: String,
    onRetry: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxSize().padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = message,
            color = MaterialTheme.colorScheme.error
        )
        if (onRetry != null) {
            Spacer(modifier = Modifier.height(16.dp))
            Button(onClick = onRetry) {
                Text("Retry")
            }
        }
    }
}
`.trim());
    }

    /**
     * Generate resource files
     */
    async generateResources(ir) {
        const appName = ir.app?.name || this.options.appName;

        // strings.xml
        await this.writeFile('app/src/main/res/values/strings.xml', `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${appName}</string>
</resources>
`.trim());

        // colors.xml
        await this.writeFile('app/src/main/res/values/colors.xml', `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="purple_200">#FFBB86FC</color>
    <color name="purple_500">#FF6200EE</color>
    <color name="purple_700">#FF3700B3</color>
    <color name="teal_200">#FF03DAC5</color>
    <color name="teal_700">#FF018786</color>
    <color name="black">#FF000000</color>
    <color name="white">#FFFFFFFF</color>
    <color name="yiphthachl_primary">#FF6366F1</color>
    <color name="yiphthachl_secondary">#FF8B5CF6</color>
</resources>
`.trim());

        // themes.xml
        await this.writeFile('app/src/main/res/values/themes.xml', `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.YiphthachlApp" parent="android:Theme.Material.Light.NoActionBar">
        <item name="android:colorPrimary">@color/yiphthachl_primary</item>
        <item name="android:statusBarColor">@color/yiphthachl_primary</item>
    </style>
</resources>
`.trim());

        // Night theme
        await this.writeFile('app/src/main/res/values-night/themes.xml', `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.YiphthachlApp" parent="android:Theme.Material.NoActionBar">
        <item name="android:colorPrimary">@color/yiphthachl_primary</item>
        <item name="android:statusBarColor">@color/yiphthachl_primary</item>
    </style>
</resources>
`.trim());

        // Generate default launcher icons (placeholder)
        await this.generateDefaultIcon();
    }

    /**
     * Generate default app icon
     */
    async generateDefaultIcon() {
        // We'll create a simple vector drawable as the icon
        const iconXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    
    <path
        android:fillColor="#6366F1"
        android:pathData="M54,54m-40,0a40,40 0,1 1,80 0a40,40 0,1 1,-80 0"/>
    
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M54,30 L54,78 M30,54 L78,54"
        android:strokeWidth="8"
        android:strokeColor="#FFFFFF"/>
</vector>
`;

        await this.writeFile('app/src/main/res/drawable/ic_launcher_foreground.xml', iconXml);
        await this.writeFile('app/src/main/res/drawable/ic_launcher_background.xml', `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#6366F1"
        android:pathData="M0,0h108v108h-108z"/>
</vector>
`);

        // Adaptive icon
        await this.writeFile('app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml', `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
`);

        await this.writeFile('app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml', `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
`);

        // Create anydpi-v26 directory
        await this.createOutputDirectory(
            path.join(this.options.outputDir, this.platform, 'app/src/main/res/mipmap-anydpi-v26')
        );
    }

    // Helper methods
    parseColorHex(color) {
        const parsed = this.parseColor(color);
        const toHex = (n) => n.toString(16).padStart(2, '0');
        return `${toHex(parsed.r)}${toHex(parsed.g)}${toHex(parsed.b)}`;
    }

    mapIconName(name) {
        const iconMap = {
            'home': 'Home',
            'search': 'Search',
            'settings': 'Settings',
            'person': 'Person',
            'profile': 'Person',
            'add': 'Add',
            'close': 'Close',
            'menu': 'Menu',
            'back': 'ArrowBack',
            'forward': 'ArrowForward',
            'star': 'Star',
            'favorite': 'Favorite',
            'heart': 'Favorite',
            'share': 'Share',
            'edit': 'Edit',
            'delete': 'Delete',
            'email': 'Email',
            'phone': 'Phone',
            'camera': 'CameraAlt',
            'photo': 'Photo',
            'notification': 'Notifications'
        };

        return iconMap[name.toLowerCase()] || 'Home';
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    kotlinType(type) {
        const typeMap = {
            'string': 'String',
            'number': 'Double',
            'boolean': 'Boolean',
            'array': 'List<Any>',
            'object': 'Map<String, Any>',
            'any': 'Any'
        };
        return typeMap[type] || 'Any';
    }

    kotlinDefaultValue(value, type) {
        if (value === null || value === undefined) {
            const defaults = {
                'string': '""',
                'number': '0.0',
                'boolean': 'false',
                'array': 'emptyList()',
                'object': 'emptyMap()'
            };
            return defaults[type] || 'null';
        }

        if (typeof value === 'string') return `"${value}"`;
        if (typeof value === 'boolean') return value.toString();
        if (typeof value === 'number') return `${value}.0`;
        if (Array.isArray(value)) return `listOf(${value.map(v => this.kotlinDefaultValue(v, typeof v)).join(', ')})`;

        return JSON.stringify(value);
    }
}

export default AndroidGenerator;
