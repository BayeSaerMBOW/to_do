import { Auth } from './auth.js';
import { TaskManager } from './taskManager.js';
import { DarkMode } from './darkMode.js';

class App {
    constructor() {
        this.auth = new Auth();
        this.taskManager = null;
        this.darkMode = new DarkMode();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthState();
    }

    setupEventListeners() {
        // Gestion de la connexion
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            const success = await this.auth.login(email, password);
            if (success) {
                this.showMainPage();
            } else {
                alert('Échec de la connexion');
            }
        });

        // Gestion de la déconnexion
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn.addEventListener('click', () => {
            this.auth.logout();
            this.showLoginPage();
        });

        // Gestion de l'ajout de tâche
        const addTaskBtn = document.getElementById('addTaskBtn');
        addTaskBtn.addEventListener('click', () => {
            this.showAddTaskModal();
        });
    }

    checkAuthState() {
        if (this.auth.checkAuth()) {
            this.showMainPage();
        } else {
            this.showLoginPage();
        }
    }

    showLoginPage() {
        document.getElementById('loginPage').classList.remove('hidden');
        document.getElementById('mainPage').classList.add('hidden');
    }

    async showMainPage() {
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('mainPage').classList.remove('hidden');
        
        if (!this.taskManager) {
            this.taskManager = new TaskManager();
        }
        await this.taskManager.loadTasks();
    }
}

// Initialiser l'application
new App();