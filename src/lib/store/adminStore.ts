// Jest shim for tests that mock '@/lib/store/adminStore'
// Re-export from the actual store location if it exists, otherwise provide a minimal mockable shape.

// Attempt to import real store if present
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const real = require('../../stores/adminStore')
  module.exports = real
} catch (e) {
  // Fallback minimal store for tests
  const mockState = {
    isAdmin: false,
    setIsAdmin: () => {},
  }
  module.exports = {
    useAdminStore: () => mockState,
    __esModule: true,
    default: mockState,
  }
}


