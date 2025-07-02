// Unit tests for validation functions

const { validTodos, invalidTodos, xssAttempts, longTexts } = require('../fixtures/sampleTodos');

// Mock the server to access validation functions
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn()
  }
}));

// We need to test the validation logic, but it's embedded in the server
// Let's create isolated validation functions for testing
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function validateTodoText(text) {
  const errors = [];
  
  if (!text || typeof text !== 'string') {
    errors.push({ message: 'Todo text is required', code: 'INVALID_INPUT' });
    return { isValid: false, errors, sanitized: '' };
  }
  
  const trimmed = text.trim();
  
  if (trimmed.length === 0) {
    errors.push({ message: 'Todo text cannot be empty or only whitespace', code: 'EMPTY_TEXT' });
  }
  
  if (trimmed.length > 500) {
    errors.push({ 
      message: 'Todo text cannot exceed 500 characters', 
      code: 'TEXT_TOO_LONG',
      maxLength: 500,
      currentLength: trimmed.length 
    });
  }
  
  const sanitized = escapeHtml(trimmed);
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
    length: trimmed.length
  };
}

describe('Validation Functions', () => {
  describe('escapeHtml', () => {
    it('should escape HTML characters', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
      expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
      expect(escapeHtml("'world'")).toBe('&#39;world&#39;');
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });
    
    it('should handle XSS attempts', () => {
      xssAttempts.forEach(xss => {
        const escaped = escapeHtml(xss);
        expect(escaped).not.toContain('<script>');
        expect(escaped).not.toContain('onerror=');
        expect(escaped).not.toContain('onload=');
      });
    });
    
    it('should preserve safe text', () => {
      const safeText = 'This is a normal todo item';
      expect(escapeHtml(safeText)).toBe(safeText);
    });
  });
  
  describe('validateTodoText', () => {
    it('should validate normal text', () => {
      const result = validateTodoText('Valid todo text');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitized).toBe('Valid todo text');
      expect(result.length).toBe(15);
    });
    
    it('should reject empty text', () => {
      const result = validateTodoText('');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('EMPTY_TEXT');
    });
    
    it('should reject whitespace-only text', () => {
      const result = validateTodoText('   ');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('EMPTY_TEXT');
    });
    
    it('should reject null/undefined text', () => {
      expect(validateTodoText(null).isValid).toBe(false);
      expect(validateTodoText(undefined).isValid).toBe(false);
      expect(validateTodoText(null).errors[0].code).toBe('INVALID_INPUT');
    });
    
    it('should reject non-string text', () => {
      expect(validateTodoText(123).isValid).toBe(false);
      expect(validateTodoText({}).isValid).toBe(false);
      expect(validateTodoText([]).isValid).toBe(false);
    });
    
    it('should reject text that is too long', () => {
      const result = validateTodoText(longTexts.invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('TEXT_TOO_LONG');
      expect(result.errors[0].currentLength).toBe(501);
    });
    
    it('should accept text at maximum length', () => {
      const result = validateTodoText(longTexts.valid);
      expect(result.isValid).toBe(true);
      expect(result.length).toBe(500);
    });
    
    it('should sanitize HTML in text', () => {
      const result = validateTodoText('<script>alert("xss")</script>');
      expect(result.sanitized).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(result.isValid).toBe(true); // Valid after sanitization
    });
    
    it('should trim whitespace', () => {
      const result = validateTodoText('  valid text  ');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('valid text');
      expect(result.length).toBe(10);
    });
  });
});