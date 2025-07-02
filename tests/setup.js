// Global test setup
const fs = require('fs');
const path = require('path');

// Clean up test data before each test
beforeEach(() => {
  const testTodosPath = path.join(__dirname, '../todos.test.json');
  if (fs.existsSync(testTodosPath)) {
    fs.unlinkSync(testTodosPath);
  }
});

// Global test timeout
jest.setTimeout(10000);

// Console error suppression for expected errors
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Expected test error')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});