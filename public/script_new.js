class TodoApp {
    constructor() {
        this.todos = [];
        this.currentFilter = "all";
        this.init();
    }

    init() {
        this.cacheDOMElements();
        this.bindEvents();
        this.loadTodos();
    }

    cacheDOMElements() {
        this.todoInput = document.getElementById("todoInput");
        this.addBtn = document.getElementById("addBtn");
        this.todoList = document.getElementById("todoList");
        this.todoCount = document.getElementById("todoCount");
        this.filterBtns = document.querySelectorAll(".filter-btn");
    }

    bindEvents() {
        this.addBtn.addEventListener("click", () => this.addTodo());
        this.todoInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") this.addTodo();
        });
        
        this.filterBtns.forEach(btn => {
            btn.addEventListener("click", (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
    }

    async loadTodos() {
        try {
            const response = await fetch("/api/todos");
            if (response.ok) {
                this.todos = await response.json();
                this.renderTodos();
                this.updateStats();
            }
        } catch (error) {
            console.error("Error loading todos:", error);
        }
    }
