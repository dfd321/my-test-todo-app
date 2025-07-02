// Frontend test setup
import { JSDOM } from 'jsdom';

// Set up DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock fetch for frontend tests
global.fetch = jest.fn();

// Reset mocks before each test
beforeEach(() => {
  fetch.mockClear();
  document.body.innerHTML = '';
});