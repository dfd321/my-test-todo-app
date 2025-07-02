// Test utility functions

const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');

/**
 * Create a test server instance with isolated data file
 */
function createTestApp() {
  // Override the TODOS_FILE path for testing
  process.env.TODOS_FILE = path.join(__dirname, '../todos.test.json');
  
  // Clear require cache to get fresh server instance
  delete require.cache[require.resolve('../../server.js')];
  
  // Return fresh app instance
  return require('../../server.js');
}

/**
 * Clean up test data files
 */
async function cleanupTestData() {
  const testTodosPath = path.join(__dirname, '../todos.test.json');
  try {
    await fs.unlink(testTodosPath);
  } catch (error) {
    // File doesn't exist, that's fine
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Create test todos in the test file
 */
async function createTestTodos(todos) {
  const testTodosPath = path.join(__dirname, '../todos.test.json');
  await fs.writeFile(testTodosPath, JSON.stringify(todos, null, 2));
}

/**
 * Read test todos from the test file
 */
async function readTestTodos() {
  const testTodosPath = path.join(__dirname, '../todos.test.json');
  try {
    const data = await fs.readFile(testTodosPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Assert response matches expected structure
 */
function assertTodoStructure(todo) {
  expect(todo).toHaveProperty('id');
  expect(todo).toHaveProperty('text');
  expect(todo).toHaveProperty('completed');
  expect(todo).toHaveProperty('createdAt');
  expect(typeof todo.id).toBe('string');
  expect(typeof todo.text).toBe('string');
  expect(typeof todo.completed).toBe('boolean');
  expect(typeof todo.createdAt).toBe('string');
}

/**
 * Assert valid ISO date string
 */
function assertValidISODate(dateString) {
  expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  expect(new Date(dateString).toISOString()).toBe(dateString);
}

module.exports = {
  createTestApp,
  cleanupTestData,
  createTestTodos,
  readTestTodos,
  assertTodoStructure,
  assertValidISODate
};