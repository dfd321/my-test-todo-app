class TodoApp {
    constructor() {
        this.todos = [];
        this.currentFilter = 'all';
        this.validationEnabled = true;
        this.init();
    }

    init() {
        this.cacheDOMElements();
        this.bindEvents();
        this.loadTodos();
        this.initValidation();
    }

    cacheDOMElements() {
        this.todoInput = document.getElementById('todoInput');
        this.addBtn = document.getElementById('addBtn');
        this.todoList = document.getElementById('todoList');
        this.todoCount = document.getElementById('todoCount');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.charCount = document.getElementById('charCount');
        this.errorMessage = document.getElementById('errorMessage');
    }

    bindEvents() {
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
        
        // Real-time validation
        this.todoInput.addEventListener('input', () => this.validateInput());
        this.todoInput.addEventListener('blur', () => this.validateInput(true));
        
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
    }

    initValidation() {
        this.updateCharacterCount();
        this.validateInput();
    }

    validateInput(showErrors = false) {
        const text = this.todoInput.value;
        const trimmed = text.trim();
        const length = text.length;
        
        // Update character count
        this.updateCharacterCount();
        
        // Reset states
        this.todoInput.classList.remove('valid', 'invalid', 'warning');
        this.hideError();
        
        // Validation logic
        if (length === 0) {
            this.addBtn.disabled = true;
            return { isValid: false, message: '' };
        }
        
        if (trimmed.length === 0) {
            this.todoInput.classList.add('invalid');
            this.addBtn.disabled = true;
            if (showErrors) {
                this.showError('Todo cannot be empty or only whitespace', 'error');
            }
            return { isValid: false, message: 'Todo cannot be empty or only whitespace' };
        }
        
        if (length > 500) {
            this.todoInput.classList.add('invalid');
            this.addBtn.disabled = true;
            this.showError(`Todo cannot exceed 500 characters (currently ${length})`, 'error');
            return { isValid: false, message: 'Too long' };
        }
        
        if (length > 400) {
            this.todoInput.classList.add('warning');
            this.addBtn.disabled = false;
            if (showErrors) {
                this.showError(`Approaching character limit (${length}/500)`, 'warning');
            }
            return { isValid: true, message: 'Warning: approaching limit' };
        }
        
        // Valid input
        this.todoInput.classList.add('valid');
        this.addBtn.disabled = false;
        
        return { isValid: true, message: 'Valid' };
    }

    updateCharacterCount() {
        const length = this.todoInput.value.length;
        this.charCount.textContent = length;
        
        const counterElement = this.charCount.parentElement;
        counterElement.classList.remove('warning', 'danger');
        
        if (length > 450) {
            counterElement.classList.add('danger');
        } else if (length > 400) {
            counterElement.classList.add('warning');
        }
    }

    showError(message, type = 'error') {
        this.errorMessage.textContent = message;
        this.errorMessage.className = `error-message ${type}`;
        this.errorMessage.classList.remove('hidden');
        
        // Add shake animation for errors
        if (type === 'error') {
            this.todoInput.classList.add('shake');
            setTimeout(() => this.todoInput.classList.remove('shake'), 300);
        }
    }

    hideError() {
        this.errorMessage.classList.add('hidden');
    }

    async loadTodos() {
        try {
            const response = await fetch('/api/todos');
            if (response.ok) {
                this.todos = await response.json();
                this.renderTodos();
                this.updateStats();
            } else {
                this.showError('Failed to load todos', 'error');
            }
        } catch (error) {
            console.error('Error loading todos:', error);
            this.showError('Failed to connect to server', 'error');
        }
    }

    async addTodo() {
        const text = this.todoInput.value.trim();
        
        // Client-side validation
        const validation = this.validateInput(true);
        if (!validation.isValid) {
            return;
        }

        try {
            const response = await fetch('/api/todos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });

            if (response.ok) {
                const newTodo = await response.json();
                this.todos.push(newTodo);
                this.todoInput.value = '';
                this.validateInput(); // Reset validation state
                this.renderTodos();
                this.updateStats();
                this.showError('Todo added successfully!', 'success');
                setTimeout(() => this.hideError(), 2000);
            } else {
                const errorData = await response.json();
                this.showError(errorData.error || 'Failed to add todo', 'error');
            }
        } catch (error) {
            console.error('Error adding todo:', error);
            this.showError('Failed to connect to server', 'error');
        }
    }

    async toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ completed: !todo.completed })
            });

            if (response.ok) {
                todo.completed = !todo.completed;
                this.renderTodos();
                this.updateStats();
            } else {
                const errorData = await response.json();
                this.showError(errorData.error || 'Failed to update todo', 'error');
            }
        } catch (error) {
            console.error('Error updating todo:', error);
            this.showError('Failed to connect to server', 'error');
        }
    }

    async deleteTodo(id) {
        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.todos = this.todos.filter(t => t.id !== id);
                this.renderTodos();
                this.updateStats();
            } else {
                const errorData = await response.json();
                this.showError(errorData.error || 'Failed to delete todo', 'error');
            }
        } catch (error) {
            console.error('Error deleting todo:', error);
            this.showError('Failed to connect to server', 'error');
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.renderTodos();
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(todo => !todo.completed);
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            default:
                return this.todos;
        }
    }

    renderTodos() {
        const filteredTodos = this.getFilteredTodos();
        
        if (filteredTodos.length === 0) {
            this.todoList.innerHTML = '<li class="empty-state">No todos yet. Add one above!</li>';
            return;
        }

        this.todoList.innerHTML = filteredTodos.map(todo => `
            <li class="todo-item ${todo.completed ? 'completed' : ''}">
                <input type="checkbox" class="todo-checkbox" 
                       ${todo.completed ? 'checked' : ''} 
                       onchange="app.toggleTodo('${todo.id}')">
                <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                <button class="delete-btn" onclick="app.deleteTodo('${todo.id}')">Delete</button>
            </li>
        `).join('')
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        const active = total - completed;
        
        this.todoCount.textContent = `${total} total, ${active} active, ${completed} completed`;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TodoApp();
});