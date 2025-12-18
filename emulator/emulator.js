/**
 * Yiphthachl Device Emulator
 * Device frames and emulation for previewing apps
 */

// Device specifications
export const deviceProfiles = {
    // iPhones
    'iphone-14': {
        name: 'iPhone 14',
        width: 390,
        height: 844,
        scale: 3,
        safeArea: { top: 47, bottom: 34 },
        borderRadius: 47,
        platform: 'ios'
    },
    'iphone-15-pro': {
        name: 'iPhone 15 Pro',
        width: 393,
        height: 852,
        scale: 3,
        safeArea: { top: 59, bottom: 34 },
        borderRadius: 55,
        dynamicIsland: true,
        platform: 'ios'
    },
    'iphone-15-pro-max': {
        name: 'iPhone 15 Pro Max',
        width: 430,
        height: 932,
        scale: 3,
        safeArea: { top: 59, bottom: 34 },
        borderRadius: 55,
        dynamicIsland: true,
        platform: 'ios'
    },
    'iphone-se': {
        name: 'iPhone SE',
        width: 375,
        height: 667,
        scale: 2,
        safeArea: { top: 20, bottom: 0 },
        borderRadius: 0,
        homeButton: true,
        platform: 'ios'
    },

    // Android phones
    'pixel-8': {
        name: 'Google Pixel 8',
        width: 412,
        height: 915,
        scale: 2.625,
        safeArea: { top: 24, bottom: 0 },
        borderRadius: 40,
        platform: 'android'
    },
    'samsung-s24': {
        name: 'Samsung Galaxy S24',
        width: 360,
        height: 780,
        scale: 3,
        safeArea: { top: 24, bottom: 0 },
        borderRadius: 38,
        platform: 'android'
    },
    'samsung-s24-ultra': {
        name: 'Samsung Galaxy S24 Ultra',
        width: 412,
        height: 915,
        scale: 3.5,
        safeArea: { top: 24, bottom: 0 },
        borderRadius: 40,
        platform: 'android'
    },

    // Tablets
    'ipad-pro-11': {
        name: 'iPad Pro 11"',
        width: 834,
        height: 1194,
        scale: 2,
        safeArea: { top: 24, bottom: 20 },
        borderRadius: 18,
        platform: 'ios'
    },
    'ipad-pro-12': {
        name: 'iPad Pro 12.9"',
        width: 1024,
        height: 1366,
        scale: 2,
        safeArea: { top: 24, bottom: 20 },
        borderRadius: 18,
        platform: 'ios'
    },

    // Desktop
    'desktop': {
        name: 'Desktop',
        width: 1920,
        height: 1080,
        scale: 1,
        safeArea: { top: 0, bottom: 0 },
        borderRadius: 0,
        platform: 'web'
    },
    'desktop-laptop': {
        name: 'Laptop',
        width: 1440,
        height: 900,
        scale: 1,
        safeArea: { top: 0, bottom: 0 },
        borderRadius: 0,
        platform: 'web'
    },
    'macbook': {
        name: 'MacBook Pro',
        width: 1512,
        height: 982,
        scale: 2,
        safeArea: { top: 0, bottom: 0 },
        borderRadius: 10,
        platform: 'macos'
    }
};

/**
 * Device Emulator component
 */
export class DeviceEmulator {
    constructor(options = {}) {
        this.device = options.device || 'iphone-15-pro';
        this.scale = options.scale || 1;
        this.showFrame = options.showFrame !== false;
        this.darkMode = options.darkMode || false;
        this.orientation = options.orientation || 'portrait';
        this.element = null;
        this.iframe = null;
    }

    /**
     * Create the emulator element
     */
    create() {
        const profile = deviceProfiles[this.device];
        if (!profile) {
            console.error(`Unknown device: ${this.device}`);
            return null;
        }

        const isLandscape = this.orientation === 'landscape';
        const width = isLandscape ? profile.height : profile.width;
        const height = isLandscape ? profile.width : profile.height;

        this.element = document.createElement('div');
        this.element.className = 'yiph-device-emulator';
        this.element.style.cssText = `
            position: relative;
            width: ${width * this.scale}px;
            height: ${height * this.scale}px;
        `;

        if (this.showFrame) {
            this.element.appendChild(this.createFrame(profile, width, height));
        }

        // Create content container
        const content = document.createElement('div');
        content.className = 'yiph-device-content';
        content.style.cssText = `
            position: absolute;
            inset: ${this.showFrame ? 12 * this.scale : 0}px;
            border-radius: ${profile.borderRadius * this.scale}px;
            overflow: hidden;
            background: ${this.darkMode ? '#000' : '#fff'};
        `;

        // Create iframe for app content
        this.iframe = document.createElement('iframe');
        this.iframe.className = 'yiph-device-iframe';
        this.iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            background: #0f172a;
        `;
        this.iframe.sandbox = 'allow-scripts allow-same-origin';

        content.appendChild(this.iframe);
        this.element.appendChild(content);

        // Add notch or dynamic island for iOS devices
        if (profile.dynamicIsland) {
            content.appendChild(this.createDynamicIsland());
        }

        // Add home indicator for modern iOS devices
        if (!profile.homeButton && profile.platform === 'ios') {
            content.appendChild(this.createHomeIndicator());
        }

        return this.element;
    }

    /**
     * Create device frame
     */
    createFrame(profile, width, height) {
        const frame = document.createElement('div');
        frame.className = 'yiph-device-frame';
        frame.style.cssText = `
            position: absolute;
            inset: 0;
            border-radius: ${(profile.borderRadius + 4) * this.scale}px;
            background: linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%);
            box-shadow: 
                0 0 0 ${2 * this.scale}px #3a3a3a,
                0 ${20 * this.scale}px ${60 * this.scale}px rgba(0,0,0,0.5),
                inset 0 0 ${20 * this.scale}px rgba(255,255,255,0.05);
        `;

        // Side buttons for phones
        if (profile.platform === 'ios' || profile.platform === 'android') {
            // Power button
            const power = document.createElement('div');
            power.style.cssText = `
                position: absolute;
                right: ${-4 * this.scale}px;
                top: ${100 * this.scale}px;
                width: ${4 * this.scale}px;
                height: ${60 * this.scale}px;
                background: #2a2a2a;
                border-radius: 0 ${2 * this.scale}px ${2 * this.scale}px 0;
            `;
            frame.appendChild(power);

            // Volume buttons
            const volume1 = document.createElement('div');
            volume1.style.cssText = `
                position: absolute;
                left: ${-4 * this.scale}px;
                top: ${100 * this.scale}px;
                width: ${4 * this.scale}px;
                height: ${40 * this.scale}px;
                background: #2a2a2a;
                border-radius: ${2 * this.scale}px 0 0 ${2 * this.scale}px;
            `;
            frame.appendChild(volume1);

            const volume2 = document.createElement('div');
            volume2.style.cssText = `
                position: absolute;
                left: ${-4 * this.scale}px;
                top: ${150 * this.scale}px;
                width: ${4 * this.scale}px;
                height: ${40 * this.scale}px;
                background: #2a2a2a;
                border-radius: ${2 * this.scale}px 0 0 ${2 * this.scale}px;
            `;
            frame.appendChild(volume2);
        }

        return frame;
    }

    /**
     * Create Dynamic Island for iPhone 14 Pro+
     */
    createDynamicIsland() {
        const island = document.createElement('div');
        island.className = 'yiph-dynamic-island';
        island.style.cssText = `
            position: absolute;
            top: ${12 * this.scale}px;
            left: 50%;
            transform: translateX(-50%);
            width: ${126 * this.scale}px;
            height: ${37 * this.scale}px;
            background: #000;
            border-radius: ${20 * this.scale}px;
            z-index: 100;
        `;
        return island;
    }

    /**
     * Create home indicator
     */
    createHomeIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'yiph-home-indicator';
        indicator.style.cssText = `
            position: absolute;
            bottom: ${8 * this.scale}px;
            left: 50%;
            transform: translateX(-50%);
            width: ${134 * this.scale}px;
            height: ${5 * this.scale}px;
            background: ${this.darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'};
            border-radius: ${3 * this.scale}px;
            z-index: 100;
        `;
        return indicator;
    }

    /**
     * Load HTML content into the emulator
     */
    loadContent(html) {
        if (this.iframe) {
            this.iframe.srcdoc = html;
        }
    }

    /**
     * Load URL into the emulator
     */
    loadUrl(url) {
        if (this.iframe) {
            this.iframe.src = url;
        }
    }

    /**
     * Set device
     */
    setDevice(deviceId) {
        this.device = deviceId;
        if (this.element && this.element.parentNode) {
            const parent = this.element.parentNode;
            const newElement = this.create();
            parent.replaceChild(newElement, this.element);
        }
    }

    /**
     * Rotate device
     */
    rotate() {
        this.orientation = this.orientation === 'portrait' ? 'landscape' : 'portrait';
        if (this.element && this.element.parentNode) {
            const parent = this.element.parentNode;
            const content = this.iframe.srcdoc;
            const newElement = this.create();
            parent.replaceChild(newElement, this.element);
            this.loadContent(content);
        }
    }

    /**
     * Toggle dark mode
     */
    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        // Refresh emulator
        if (this.element && this.element.parentNode) {
            const parent = this.element.parentNode;
            const content = this.iframe.srcdoc;
            const newElement = this.create();
            parent.replaceChild(newElement, this.element);
            this.loadContent(content);
        }
    }

    /**
     * Take screenshot
     */
    async screenshot() {
        if (!this.iframe) return null;

        try {
            const canvas = document.createElement('canvas');
            const profile = deviceProfiles[this.device];
            canvas.width = profile.width;
            canvas.height = profile.height;

            // Note: This is a simplified version
            // Full implementation would use html2canvas or similar
            console.log('Screenshot captured');
            return canvas.toDataURL('image/png');
        } catch (error) {
            console.error('Screenshot error:', error);
            return null;
        }
    }
}

// Export factory function
export function createEmulator(options = {}) {
    const emulator = new DeviceEmulator(options);
    return emulator;
}

// Export device list
export function getDeviceList() {
    return Object.entries(deviceProfiles).map(([id, profile]) => ({
        id,
        ...profile
    }));
}
