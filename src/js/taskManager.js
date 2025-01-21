    // taskManager.js
    import { api } from './api.js';

    export class TaskManager {
        constructor() {
            this.tasks = [];
            this.setupDragAndDrop();
            this.setupSearch();
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
        }

        createTaskElement(task) {
            const div = document.createElement('div');
            div.className = 'task-card bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 cursor-move hover:shadow-md transition-shadow duration-200 relative';
            div.draggable = true;
            div.dataset.taskId = task.id;
            
            // Contenu principal de la tâche
            div.innerHTML = `
                <div class="pr-16"> <!-- Ajouter un padding à droite pour les icônes -->
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
    
            // Ajout des gestionnaires d'événements pour les boutons
            const editBtn = div.querySelector('.edit-task-btn');
            const deleteBtn = div.querySelector('.delete-task-btn');
    
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleEditTask(task);
            });
    
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleDeleteTask(task.id);
            });
            
            return div;
        }
    
        async handleEditTask(task) {
            // Créer une boîte de dialogue de modification
            const newTitle = prompt('Modifier le titre:', task.title);
            const newDescription = prompt('Modifier la description:', task.description);
            
            if (newTitle === null || newDescription === null) return; // L'utilisateur a annulé
    
            try {
                await api.updateTask(task.id, {
                    title: newTitle || task.title,
                    description: newDescription || task.description
                });
                await this.loadTasks(); // Recharger les tâches
            } catch (error) {
                console.error('Erreur lors de la modification de la tâche:', error);
                alert('Erreur lors de la modification de la tâche');
            }
        }
    
        async handleDeleteTask(taskId) {
            if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;
    
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
                return false;
            }
        }
    }
