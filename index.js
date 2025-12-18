/**
 * Yiphthachl - The Plain English Flutter
 * Main entry point
 */

// Export compiler
export * from './compiler/index.js';

// Export runtime
export * from './runtime/index.js';

// Version info
export const VERSION = '1.0.0';
export const CODENAME = 'Genesis';

console.log(`
Yiphthachl v${VERSION} "${CODENAME}"
The Plain English Flutter

Build apps by writing English, not code.
`);
