// Mock AsyncStorage pour les tests
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock Supabase with full channel support
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
      insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      update: jest.fn().mockResolvedValue({ data: {}, error: null }),
      delete: jest.fn().mockResolvedValue({ data: {}, error: null }),
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    })),
    channel: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

// Mock react-native to prevent import errors
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    select: (obj) => obj.android,
  },
}));

// Mock @testing-library/react-native with proper hook support
jest.mock('@testing-library/react-native', () => {
  const React = require('react');
  
  return {
    renderHook: (callback, options = {}) => {
      let callResult;
      let callError;
      
      // Execute the hook directly - React will handle the hook context
      try {
        callResult = callback();
      } catch (error) {
        callError = error;
      }
      
      return {
        result: { 
          current: callResult,
          error: callError,
        },
        rerender: jest.fn(),
        unmount: jest.fn(),
      };
    },
    act: (callback) => {
      return callback();
    },
  };
});

