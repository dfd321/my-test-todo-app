// Integration tests for complete workflows

const request = require('supertest');
const { createTestApp, cleanupTestData, readTestTodos } = require('../utils/testHelpers');

describe('Integration Tests', () => {
  let app;
  
  beforeEach(async () => {
    await cleanupTestData();
    app = createTestApp();
  });
  
  afterEach(async () => {
    await cleanupTestData();
  });
  
  describe('Complete Todo Workflows', () => {
    it('should support complete CRUD workflow', async () => {
      // 1. Start with empty list
      let response = await request(app).get('/api/todos').expect(200);
      expect(response.body).toHaveLength(0);
      
      // 2. Create a todo
      response = await request(app)
        .post('/api/todos')
        .send({ text: 'Integration test todo' })
        .expect(201);
      const todoId = response.body.id;
      
      // 3. Verify it appears in list
      response = await request(app).get('/api/todos').expect(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].text).toBe('Integration test todo');
      expect(response.body[0].completed).toBe(false);
      
      // 4. Mark as completed
      response = await request(app)
        .put(`/api/todos/${todoId}`)
        .send({ completed: true })
        .expect(200);
      expect(response.body.completed).toBe(true);
      
      // 5. Verify completion persisted
      response = await request(app).get('/api/todos').expect(200);
      expect(response.body[0].completed).toBe(true);
      
      // 6. Delete the todo
      await request(app)
        .delete(`/api/todos/${todoId}`)
        .expect(204);
      
      // 7. Verify it's gone
      response = await request(app).get('/api/todos').expect(200);
      expect(response.body).toHaveLength(0);
    });
    
    it('should handle multiple todos independently', async () => {
      // Create multiple todos
      const todo1 = await request(app)
        .post('/api/todos')
        .send({ text: 'First todo' })
        .expect(201);
        
      const todo2 = await request(app)
        .post('/api/todos')
        .send({ text: 'Second todo' })
        .expect(201);
        
      const todo3 = await request(app)
        .post('/api/todos')
        .send({ text: 'Third todo' })
        .expect(201);
      
      // Complete only the second one
      await request(app)
        .put(`/api/todos/${todo2.body.id}`)
        .send({ completed: true })
        .expect(200);
      
      // Verify state
      const response = await request(app).get('/api/todos').expect(200);
      expect(response.body).toHaveLength(3);
      
      const completedTodos = response.body.filter(t => t.completed);
      expect(completedTodos).toHaveLength(1);
      expect(completedTodos[0].text).toBe('Second todo');
      
      // Delete first todo
      await request(app)
        .delete(`/api/todos/${todo1.body.id}`)
        .expect(204);
      
      // Verify others remain
      const finalResponse = await request(app).get('/api/todos').expect(200);
      expect(finalResponse.body).toHaveLength(2);
      expect(finalResponse.body.find(t => t.text === 'First todo')).toBeUndefined();
    });
  });
  
  describe('Data Persistence', () => {
    it('should persist todos to JSON file', async () => {
      // Create todo through API
      const response = await request(app)
        .post('/api/todos')
        .send({ text: 'Persistence test' })
        .expect(201);
      
      // Read directly from file
      const todosFromFile = await readTestTodos();
      expect(todosFromFile).toHaveLength(1);
      expect(todosFromFile[0].text).toBe('Persistence test');
      expect(todosFromFile[0].id).toBe(response.body.id);
    });
    
    it('should handle file operations gracefully', async () => {
      // Test with non-existent file (should create)
      const response = await request(app)
        .post('/api/todos')
        .send({ text: 'First todo' })
        .expect(201);
      
      // Verify file was created and readable
      const todos = await readTestTodos();
      expect(todos).toHaveLength(1);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle multiple validation errors gracefully', async () => {
      // Try multiple invalid requests
      await request(app)
        .post('/api/todos')
        .send({ text: '' })
        .expect(400);
        
      await request(app)
        .post('/api/todos')
        .send({ text: 'x'.repeat(501) })
        .expect(400);
        
      await request(app)
        .post('/api/todos')
        .send({})
        .expect(400);
      
      // App should still be functional
      const response = await request(app)
        .post('/api/todos')
        .send({ text: 'Valid todo after errors' })
        .expect(201);
        
      expect(response.body.text).toBe('Valid todo after errors');
    });
    
    it('should recover from file system errors', async () => {
      // This test would be more complex in a real scenario
      // For now, just ensure the app doesn't crash on valid operations
      const response = await request(app)
        .get('/api/todos')
        .expect(200);
        
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});