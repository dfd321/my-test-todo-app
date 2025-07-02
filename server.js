const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const TODOS_FILE = path.join(__dirname, 'todos.json');

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

// Helper function to read todos from file
async function readTodos() {
    try {
        const data = await fs.readFile(TODOS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

// Helper function to write todos to file
async function writeTodos(todos) {
    await fs.writeFile(TODOS_FILE, JSON.stringify(todos, null, 2));
}

// Validation utilities
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

// API Routes
// GET /api/todos - Get all todos
app.get('/api/todos', async (req, res) => {
    try {
        const todos = await readTodos();
        res.json(todos);
    } catch (error) {
        console.error('Error reading todos:', error);
        res.status(500).json({ error: 'Failed to read todos' });
    }
});

// POST /api/todos - Add a new todo with enhanced validation
app.post('/api/todos', async (req, res) => {
    try {
        const { text } = req.body;
        
        // Validate request body structure
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ 
                error: 'Invalid request body', 
                code: 'INVALID_BODY' 
            });
        }
        
        // Comprehensive validation
        const validation = validateTodoText(text);
        
        if (!validation.isValid) {
            console.log('Validation failed:', validation.errors);
            return res.status(400).json({ 
                error: validation.errors[0].message,
                code: validation.errors[0].code,
                details: validation.errors[0]
            });
        }
        
        const todos = await readTodos();
        const newTodo = {
            id: Date.now().toString(),
            text: validation.sanitized,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        todos.push(newTodo);
        await writeTodos(todos);
        
        console.log('Todo created:', { 
            id: newTodo.id, 
            length: validation.length,
            sanitized: validation.sanitized !== text.trim() 
        });
        
        res.status(201).json(newTodo);
    } catch (error) {
        console.error('Error creating todo:', error);
        res.status(500).json({ error: 'Failed to create todo' });
    }
});

// PUT /api/todos/:id - Update todo (mark as complete/incomplete)
app.put('/api/todos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { completed } = req.body;
        
        // Validate request parameters
        if (!id || typeof completed !== 'boolean') {
            return res.status(400).json({ 
                error: 'Invalid request parameters',
                code: 'INVALID_PARAMS'
            });
        }
        
        const todos = await readTodos();
        const todoIndex = todos.findIndex(todo => todo.id === id);
        
        if (todoIndex === -1) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        
        todos[todoIndex].completed = completed;
        await writeTodos(todos);
        
        console.log('Todo updated:', { id, completed });
        res.json(todos[todoIndex]);
    } catch (error) {
        console.error('Error updating todo:', error);
        res.status(500).json({ error: 'Failed to update todo' });
    }
});

// DELETE /api/todos/:id - Delete a todo
app.delete('/api/todos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ 
                error: 'Todo ID is required',
                code: 'MISSING_ID'
            });
        }
        
        const todos = await readTodos();
        const filteredTodos = todos.filter(todo => todo.id !== id);
        
        if (filteredTodos.length === todos.length) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        
        await writeTodos(filteredTodos);
        
        console.log('Todo deleted:', { id });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting todo:', error);
        res.status(500).json({ error: 'Failed to delete todo' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Enhanced validation enabled');
});
