/**
 * Yiphthachl Runtime Index
 * Main entry point for the Yiphthachl runtime
 */

// Core engine
export { YiphthachlRuntime, runtime } from './engine.js';

// All widgets
export * from './widgets/index.js';

// Navigation
export {
    router,
    Navigator,
    navigateTo,
    goBack,
    registerRoute
} from './navigation/router.js';

// Animation
export {
    Animation,
    easings,
    presets as animationPresets,
    animate,
    stagger,
    transition
} from './animation/animator.js';

// HTTP
export {
    http,
    fetchData,
    sendData,
    updateData,
    deleteData,
    ApiResource,
    createResource
} from './http/client.js';

// Storage
export {
    storage,
    sessionStore,
    store,
    retrieve,
    forget,
    ReactiveStorage,
    reactiveStorage
} from './storage/storage.js';
