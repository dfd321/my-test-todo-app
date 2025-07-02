// Test fixtures for consistent test data

module.exports = {
  validTodos: [
    {
      id: '1',
      text: 'Test todo 1',
      completed: false,
      createdAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: '2', 
      text: 'Test todo 2',
      completed: true,
      createdAt: '2024-01-01T01:00:00.000Z'
    },
    {
      id: '3',
      text: 'Test todo 3',
      completed: false,
      createdAt: '2024-01-01T02:00:00.000Z'
    }
  ],
  
  invalidTodos: [
    { text: '' }, // Empty text
    { text: '   ' }, // Whitespace only
    { text: 'x'.repeat(501) }, // Too long
    { text: '<script>alert("xss")</script>' }, // XSS attempt
    { text: null }, // Null text
    { text: 123 }, // Wrong type
    {} // Missing text
  ],
  
  validNewTodo: {
    text: 'New test todo'
  },
  
  xssAttempts: [
    '<script>alert("xss")</script>',
    '<img src="x" onerror="alert(1)">',
    '<svg onload="alert(1)">',
    '&lt;script&gt;alert("escaped")&lt;/script&gt;'
  ],
  
  longTexts: {
    valid: 'x'.repeat(500), // Exactly at limit
    invalid: 'x'.repeat(501) // Over limit
  }
};