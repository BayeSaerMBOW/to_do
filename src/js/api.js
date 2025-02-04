export const api = {
    baseUrl: 'http://localhost:3000',

    async login(credentials) {
        try {
            const response = await fetch(`${this.baseUrl}/users?email=${credentials.email}&password=${credentials.password}`);
            if (!response.ok) throw new Error('Erreur réseau');
            const users = await response.json();
            if (users.length === 0) throw new Error('Identifiants incorrects');
            const token = btoa(JSON.stringify(users[0]));
            return { token, user: users[0] };
        } catch (error) {
            console.error('Erreur de connexion:', error);
            throw error;
        }
    },

    async getTasks() {
        try {
            const response = await fetch(`${this.baseUrl}/tasks?_sort=position`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });
            if (!response.ok) throw new Error('Échec de la récupération des tâches');
            return response.json();
        } catch (error) {
            console.error('Erreur:', error);
            throw error;
        }
    },

    async updateTask(taskId, updates) {
        try {
            if (updates.position !== undefined) {
                const tasks = await this.getTasks();
                const tasksInSameStatus = tasks.filter(t => t.status === updates.status);
                tasksInSameStatus.forEach((task, index) => {
                    if (index >= updates.position && task.id !== taskId) {
                        this.updateTaskPosition(task.id, { position: index + 1 });
                    }
                });
            }

            const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(updates)
            });
            if (!response.ok) throw new Error('Échec de la mise à jour de la tâche');
            return response.json();
        } catch (error) {
            console.error('Erreur:', error);
            throw error;
        }
    },

    async updateTaskPosition(taskId, updates) {
        const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error('Échec de la mise à jour de la position');
        return response.json();
    },

    async createTask(task) {
        try {
            const tasks = await this.getTasks();
            const maxPosition = Math.max(...tasks.map(t => t.position || 0), 0);
            task.position = maxPosition + 1;

            const response = await fetch(`${this.baseUrl}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(task)
            });
            if (!response.ok) throw new Error('Échec de la création de la tâche');
            return response.json();
        } catch (error) {
            console.error('Erreur:', error);
            throw error;
        }
    },

    async deleteTask(taskId) {
        try {
            const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('Échec de la suppression de la tâche');
            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression de la tâche:', error);
            throw error;
        }
    }
};