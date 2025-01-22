import { api } from './api.js';

export class TaskManager {
    constructor() {
        this.tasks = [];
        this.setupDragAndDrop();
        this.setupSearch();
        this.setupModals();
        this.setupAddButton();
    }

    setupModals() {
        // Gestionnaire pour fermer les modaux
        document.querySelectorAll('.modal-close').forEach(button => {
            button.addEventListener('click', () => {
                document.getElementById('taskModal').style.display = 'none';
                document.getElementById('deleteModal').style.display = 'none';
            });
        });

        // Setup du formulaire de tâche
        document.getElementById('taskForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                title: document.getElementById('taskTitle').value,
                description: document.getElementById('taskDescription').value,
                status: 'todo' // Par défaut pour les nouvelles tâches
            };

            const taskId = document.getElementById('taskForm').dataset.taskId;
            if (taskId) {
                // Mode édition
                await this.handleEditTaskSubmit(taskId, formData);
            } else {
                // Mode création
                await this.addTask(formData);
            }

            document.getElementById('taskModal').style.display = 'none';
            document.getElementById('taskForm').reset();
            delete document.getElementById('taskForm').dataset.taskId;
        });

        // Fermer les modaux quand on clique en dehors
        [document.getElementById('taskModal'), document.getElementById('deleteModal')].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }

    setupAddButton() {
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.showTaskModal();
        });
    }

    showTaskModal(task = null) {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        const modalTitle = document.getElementById('modalTitle');

        if (task) {
            // Mode édition
            modalTitle.textContent = 'Modifier la tâche';
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description;
            form.dataset.taskId = task.id;
        } else {
            // Mode création
            modalTitle.textContent = 'Ajouter une tâche';
            form.reset();
            delete form.dataset.taskId;
        }

        modal.style.display = 'flex';
    }

    showDeleteModal(taskId) {
        const modal = document.getElementById('deleteModal');
        modal.style.display = 'flex';

        const confirmBtn = document.getElementById('confirmDelete');
        // Remove existing listener to avoid duplicates
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        newConfirmBtn.addEventListener('click', async () => {
            await this.handleDeleteTaskConfirm(taskId);
            modal.style.display = 'none';
        });
    }

    createEmptyStateElement() {
        const div = document.createElement('div');
        div.className = 'empty-state flex flex-col items-center justify-center p-6 text-center';
        div.innerHTML = `
            <svg class="w-20 h-20 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <p class="text-gray-500 text-sm">Aucune tâche trouvée</p>
        `;
        return div;
    }

    async loadTasks() {
        try {
            this.tasks = await api.getTasks();
            this.renderTasks();
        } catch (error) {
            console.error('Erreur lors du chargement des tâches:', error);
        }
    }

    setupDragAndDrop() {
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-card')) {
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-card')) {
                e.target.classList.remove('dragging');
            }
        });

        const containers = document.querySelectorAll('.tasks-container');
        containers.forEach(container => {
            container.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            container.addEventListener('drop', async (e) => {
                e.preventDefault();
                const taskId = e.dataTransfer.getData('text/plain');
                const newStatus = container.parentElement.dataset.status;
                
                try {
                    await this.updateTaskStatus(taskId, newStatus);
                    this.loadTasks();
                } catch (error) {
                    console.error('Erreur lors du déplacement de la tâche:', error);
                }
            });
        });
    }

    setupSearch() {
        const searchInput = document.getElementById('searchInput');
        const filterSelect = document.getElementById('filterSelect');

        searchInput.addEventListener('input', () => this.filterTasks());
        filterSelect.addEventListener('change', () => this.filterTasks());
    }

    filterTasks() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const filterValue = document.getElementById('filterSelect').value;

        const filteredTasks = this.tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchTerm);
            const matchesFilter = filterValue === 'all' || task.status === filterValue;
            return matchesSearch && matchesFilter;
        });

        this.renderTasks(filteredTasks);
    }

    async updateTaskStatus(taskId, newStatus) {
        try {
            await api.updateTask(taskId, { status: newStatus });
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                task.status = newStatus;
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut:', error);
        }
    }

    renderTasks(tasksToRender = this.tasks) {
        const containers = {
            todo: document.querySelector('#todo .tasks-container'),
            inProgress: document.querySelector('#inProgress .tasks-container'),
            done: document.querySelector('#done .tasks-container')
        };

        // Vider tous les conteneurs
        Object.values(containers).forEach(container => {
            container.innerHTML = '';
        });

        // Rendre les tâches dans leurs conteneurs respectifs
        tasksToRender.forEach(task => {
            const taskElement = this.createTaskElement(task);
            containers[task.status].appendChild(taskElement);
        });

        // Ajouter l'état vide pour les conteneurs sans tâches
        Object.entries(containers).forEach(([status, container]) => {
            const tasksInContainer = tasksToRender.filter(task => task.status === status);
            if (tasksInContainer.length === 0) {
                container.appendChild(this.createEmptyStateElement());
            }
        });
    }

    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = 'task-card bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 cursor-move hover:shadow-md transition-shadow duration-200 relative';
        div.draggable = true;
        div.dataset.taskId = task.id;
        
        div.innerHTML = `
            <div class="pr-16">
                <h4 class="font-medium text-gray-900">${task.title}</h4>
                <p class="text-sm text-gray-600 mt-1">${task.description}</p>
                <small class="text-xs text-gray-500 mt-2 block">${new Date(task.date).toLocaleDateString()}</small>
            </div>
            <div class="absolute top-4 right-4 flex space-x-2">
                <button class="edit-task-btn p-1.5 text-gray-600 hover:text-indigo-600 transition-colors duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </button>
                <button class="delete-task-btn p-1.5 text-gray-600 hover:text-red-600 transition-colors duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        `;

        const editBtn = div.querySelector('.edit-task-btn');
        const deleteBtn = div.querySelector('.delete-task-btn');

        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showTaskModal(task);
        });

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showDeleteModal(task.id);
        });
        
        return div;
    }

    async handleEditTaskSubmit(taskId, formData) {
        try {
            await api.updateTask(taskId, formData);
            await this.loadTasks();
        } catch (error) {
            console.error('Erreur lors de la modification de la tâche:', error);
            alert('Erreur lors de la modification de la tâche');
        }
    }

    async handleDeleteTaskConfirm(taskId) {
        try {
            await api.deleteTask(taskId);
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.renderTasks();
        } catch (error) {
            console.error('Erreur lors de la suppression de la tâche:', error);
            alert('Erreur lors de la suppression de la tâche');
        }
    }

    async addTask(taskData) {
        try {
            const newTask = await api.createTask(taskData);
            this.tasks.push(newTask);
            this.renderTasks();
            return true;
        } catch (error) {
            console.error('Erreur lors de la création de la tâche:', error);
            document.getElementById('taskModal').style.display = 'none';
            return false;
        }
    }
}