function getCapacitor() {
    return window.Capacitor || null;
}

function isNativePlatform(capacitor) {
    if (!capacitor || typeof capacitor.isNativePlatform !== 'function') {
        return false;
    }

    return capacitor.isNativePlatform();
}

function getPlugin(capacitor, pluginName) {
    if (!capacitor || typeof capacitor.registerPlugin !== 'function') {
        return null;
    }

    try {
        return capacitor.registerPlugin(pluginName);
    } catch (error) {
        console.warn(`Capacitor plugin not available: ${pluginName}`, error);
        return null;
    }
}

function preventAccidentalReloads() {
    window.addEventListener('keydown', (event) => {
        const key = String(event.key || '').toLowerCase();
        const isReloadShortcut = event.key === 'F5' || ((event.ctrlKey || event.metaKey) && key === 'r');

        if (isReloadShortcut) {
            event.preventDefault();
            event.stopPropagation();
        }
    }, { capture: true });
}

function disableZoomGestures() {
    document.addEventListener('gesturestart', (event) => {
        event.preventDefault();
    }, { passive: false });

    document.addEventListener('gesturechange', (event) => {
        event.preventDefault();
    }, { passive: false });

    window.addEventListener('wheel', (event) => {
        if (event.ctrlKey) {
            event.preventDefault();
        }
    }, { passive: false });

    document.addEventListener('touchmove', (event) => {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    }, { passive: false });
}

function configureStatusBar(statusBarPlugin) {
    if (!statusBarPlugin) {
        return;
    }

    statusBarPlugin.setOverlaysWebView({ overlay: true }).catch(() => { });
    statusBarPlugin.setStyle({ style: 'DARK' }).catch(() => { });
    statusBarPlugin.setBackgroundColor({ color: '#0f172a' }).catch(() => { });
}

function configureSplashScreen(splashScreenPlugin) {
    if (!splashScreenPlugin) {
        return;
    }

    window.addEventListener('load', () => {
        setTimeout(() => {
            splashScreenPlugin.hide().catch(() => { });
        }, 250);
    }, { once: true });
}

function registerBackButtonHandler(appPlugin) {
    if (!appPlugin || typeof appPlugin.addListener !== 'function') {
        return;
    }

    const listener = appPlugin.addListener('backButton', ({ canGoBack }) => {
        const activeElement = document.activeElement;
        const focusedInput = activeElement
            && typeof activeElement.blur === 'function'
            && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');

        if (focusedInput) {
            activeElement.blur();
            return;
        }

        if (canGoBack && window.history.length > 1) {
            window.history.back();
            return;
        }

        if (typeof appPlugin.exitApp === 'function') {
            appPlugin.exitApp().catch(() => { });
        }
    });

    if (listener && typeof listener.catch === 'function') {
        listener.catch(() => { });
    }
}

export function setupNativeShell() {
    const capacitor = getCapacitor();
    if (!isNativePlatform(capacitor)) {
        return;
    }

    preventAccidentalReloads();
    disableZoomGestures();

    const appPlugin = getPlugin(capacitor, 'App');
    const splashScreenPlugin = getPlugin(capacitor, 'SplashScreen');
    const statusBarPlugin = getPlugin(capacitor, 'StatusBar');

    registerBackButtonHandler(appPlugin);
    configureStatusBar(statusBarPlugin);
    configureSplashScreen(splashScreenPlugin);
}