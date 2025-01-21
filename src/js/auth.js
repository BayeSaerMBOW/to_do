import { api } from './api.js';

export class Auth {
    constructor() {
        this.isAuthenticated = false;
        this.token = localStorage.getItem('token');
        
        if (this.token) {
            this.isAuthenticated = true;
        }
    }

    async login(email, password) {
        try {
            const response = await api.login({ email, password });
            this.token = response.token;
            localStorage.setItem('token', this.token);
            this.isAuthenticated = true;
            return true;
        } catch (error) {
            console.error('Erreur de connexion:', error);
            return false;
        }
    }

    logout() {
        localStorage.removeItem('token');
        this.isAuthenticated = false;
        this.token = null;
    }

    checkAuth() {
        return this.isAuthenticated;
    }
}