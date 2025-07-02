// Integration tests for API endpoints

const request = require('supertest');
const { createTestApp, cleanupTestData, createTestTodos, assertTodoStructure } = require('../utils/testHelpers');
const { validTodos, validNewTodo, invalidTodos } = require('../fixtures/sampleTodos');

describe('API Endpoints', () => {
  let app;
  
  beforeEach(async () => {
    await cleanupTestData();
    app = createTestApp();
  });
  
  afterEach(async () => {
    await cleanupTestData();
  });
  
  describe('GET /api/todos', () => {
    it('should return empty array when no todos exist', async () => {
      const response = await request(app)
        .get('/api/todos')
        .expect(200);
        
      expect(response.body).toEqual([]);
    });
    
    it('should return all todos when they exist', async () => {
      await createTestTodos(validTodos);
      
      const response = await request(app)
        .get('/api/todos')
        .expect(200);
        
      expect(response.body).toHaveLength(3);
      response.body.forEach(assertTodoStructure);
    });
    
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/api/todos')
        .expect(200);
        
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
  
  describe('POST /api/todos', () => {
    it('should create a new todo with valid data', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send(validNewTodo)
        .expect(201);
        
      assertTodoStructure(response.body);
      expect(response.body.text).toBe(validNewTodo.text);
      expect(response.body.completed).toBe(false);
      expect(new Date(response.body.createdAt)).toBeInstanceOf(Date);
    });
    
    it('should sanitize HTML in todo text', async () => {
      const xssAttempt = { text: '<script>alert("xss")</script>Test' };
      
      const response = await request(app)
        .post('/api/todos')
        .send(xssAttempt)
        .expect(201);
        
      expect(response.body.text).toContain('&lt;script&gt;');
      expect(response.body.text).not.toContain('<script>');
    });
    
    it('should reject empty text', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ text: '' })
        .expect(400);
        
      expect(response.body.code).toBe('EMPTY_TEXT');
    });
    
    it('should reject whitespace-only text', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ text: '   ' })
        .expect(400);
        
      expect(response.body.code).toBe('EMPTY_TEXT');
    });
    
    it('should reject text that is too long', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ text: 'x'.repeat(501) })
        .expect(400);
        
      expect(response.body.code).toBe('TEXT_TOO_LONG');
    });
    
    it('should reject invalid request body', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({})
        .expect(400);
        
      expect(response.body.code).toBe('INVALID_INPUT');
    });
    
    it('should reject non-string text', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ text: 123 })
        .expect(400);
        
      expect(response.body.code).toBe('INVALID_INPUT');
    });
  });
  
  describe('PUT /api/todos/:id', () => {
    beforeEach(async () => {
      await createTestTodos(validTodos);
    });
    
    it('should update todo completion status', async () => {
      const response = await request(app)
        .put('/api/todos/1')
        .send({ completed: true })
        .expect(200);
        
      expect(response.body.id).toBe('1');
      expect(response.body.completed).toBe(true);
    });
    
    it('should toggle completion status', async () => {
      // First set to true
      await request(app)
        .put('/api/todos/1')
        .send({ completed: true })
        .expect(200);
        
      // Then toggle back to false
      const response = await request(app)
        .put('/api/todos/1')
        .send({ completed: false })
        .expect(200);
        
      expect(response.body.completed).toBe(false);
    });
    
    it('should return 404 for non-existent todo', async () => {
      const response = await request(app)
        .put('/api/todos/999')
        .send({ completed: true })
        .expect(404);
        
      expect(response.body.error).toContain('not found');
    });
    
    it('should validate completed parameter', async () => {
      const response = await request(app)
        .put('/api/todos/1')
        .send({ completed: 'not a boolean' })
        .expect(400);
        
      expect(response.body.code).toBe('INVALID_PARAMS');
    });
  });
  
  describe('DELETE /api/todos/:id', () => {
    beforeEach(async () => {
      await createTestTodos(validTodos);
    });
    
    it('should delete existing todo', async () => {
      await request(app)
        .delete('/api/todos/1')
        .expect(204);
        
      // Verify it's gone
      const response = await request(app)
        .get('/api/todos')
        .expect(200);
        
      expect(response.body).toHaveLength(2);
      expect(response.body.find(t => t.id === '1')).toBeUndefined();
    });
    
    it('should return 404 for non-existent todo', async () => {
      const response = await request(app)
        .delete('/api/todos/999')
        .expect(404);
        
      expect(response.body.error).toContain('not found');
    });
    
    it('should reject missing ID', async () => {
      const response = await request(app)
        .delete('/api/todos/')
        .expect(404); // Express returns 404 for missing route param
    });
  });
});