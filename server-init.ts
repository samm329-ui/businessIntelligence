/**
 * Server-Side Initialization
 * 
 * This file runs when the Next.js server starts.
 * It initializes the intelligence system and other services.
 */

import { initializeIntelligenceSystem } from './lib/intelligence/init';

// Track initialization state
let serverInitialized = false;

export async function initializeServer() {
  if (serverInitialized) {
    return;
  }

  console.log('\n🚀 Starting EBITA Intelligence Server...\n');

  try {
    // Initialize intelligence system
    await initializeIntelligenceSystem();
    
    serverInitialized = true;
    console.log('✅ Server initialization complete\n');
  } catch (error) {
    console.error('❌ Server initialization failed:', error);
    // Don't throw - server should still start even if intelligence fails
  }
}

// Auto-initialize on import (only runs once)
if (typeof window === 'undefined') {
  initializeServer();
}

export default initializeServer;
