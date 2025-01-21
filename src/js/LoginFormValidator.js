import { Auth } from './auth.js';

class LoginFormValidator {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.auth = new Auth();
        
        // Suppression des attributs required
        this.emailInput.removeAttribute('required');
        this.passwordInput.removeAttribute('required');
        
        this.EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        this.MIN_PASSWORD_LENGTH = 8;
        
        this.initializeEventListeners();
        this.setupLoadingState();
    }

    setupLoadingState() {
        const submitButton = this.form.querySelector('button[type="submit"]');
        submitButton.innerHTML = `
            <span class="loading-spinner hidden absolute left-4">
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
            </span>
            <span class="button-text">Se connecter</span>
        `;
        this.loadingSpinner = submitButton.querySelector('.loading-spinner');
        this.buttonText = submitButton.querySelector('.button-text');
    }

    showError(input, message) {
        const existingError = input.parentElement.querySelector('.error-message');
        if (existingError) {
            existingError.textContent = message;
            return;
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message text-red-500 text-sm mt-1 transition-all duration-200';
        errorDiv.textContent = message;
        input.parentElement.appendChild(errorDiv);
        
        input.classList.add('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
        input.classList.remove('focus:ring-indigo-500', 'focus:border-indigo-500');
    }

    removeError(input) {
        const errorDiv = input.parentElement.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.remove();
        }
        input.classList.remove('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
        input.classList.add('focus:ring-indigo-500', 'focus:border-indigo-500');
    }

    validateEmail() {
        const email = this.emailInput.value.trim();
        
        if (!email) {
            this.showError(this.emailInput, 'L\'email est obligatoire');
            return false;
        }
        
        if (email.length > 100) {
            this.showError(this.emailInput, 'L\'email ne doit pas dépasser 100 caractères');
            return false;
        }
        
        if (!this.EMAIL_REGEX.test(email)) {
            this.showError(this.emailInput, 'Format d\'email invalide');
            return false;
        }
        
        this.removeError(this.emailInput);
        return true;
    }

    validatePassword() {
        const password = this.passwordInput.value;
        
        if (!password) {
            this.showError(this.passwordInput, 'Le mot de passe est obligatoire');
            return false;
        }
        
        if (password.length < this.MIN_PASSWORD_LENGTH) {
            this.showError(this.passwordInput, `Le mot de passe doit contenir au moins ${this.MIN_PASSWORD_LENGTH} caractères`);
            return false;
        }
        
        if (password.length > 50) {
            this.showError(this.passwordInput, 'Le mot de passe ne doit pas dépasser 50 caractères');
            return false;
        }
        
        if (!/[A-Z]/.test(password)) {
            this.showError(this.passwordInput, 'Le mot de passe doit contenir au moins une majuscule');
            return false;
        }
        
        if (!/[0-9]/.test(password)) {
            this.showError(this.passwordInput, 'Le mot de passe doit contenir au moins un chiffre');
            return false;
        }
        
        if (!/[!@#$%^&*]/.test(password)) {
            this.showError(this.passwordInput, 'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)');
            return false;
        }
        
        this.removeError(this.passwordInput);
        return true;
    }

    setLoadingState(isLoading) {
        const submitButton = this.form.querySelector('button[type="submit"]');
        
        if (isLoading) {
            this.loadingSpinner.classList.remove('hidden');
            this.buttonText.textContent = 'Connexion en cours...';
            submitButton.disabled = true;
            this.emailInput.disabled = true;
            this.passwordInput.disabled = true;
        } else {
            this.loadingSpinner.classList.add('hidden');
            this.buttonText.textContent = 'Se connecter';
            submitButton.disabled = false;
            this.emailInput.disabled = false;
            this.passwordInput.disabled = false;
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        // Valide les deux champs avant de soumettre
        const isEmailValid = this.validateEmail();
        const isPasswordValid = this.validatePassword();
        
        if (!isEmailValid || !isPasswordValid) {
            return;
        }
        
        this.setLoadingState(true);
        
        try {
            const loginSuccess = await this.auth.login(
                this.emailInput.value,
                this.passwordInput.value
            );
            
            if (loginSuccess) {
                // Animation de transition
                document.getElementById('loginPage').classList.add('opacity-0');
                document.getElementById('loginPage').style.transition = 'opacity 0.3s ease-out';
                
                setTimeout(() => {
                    document.getElementById('loginPage').classList.add('hidden');
                    document.getElementById('mainPage').classList.remove('hidden');
                }, 300);
            } else {
                this.showError(this.passwordInput, 'Identifiants incorrects');
                this.passwordInput.value = ''; // Vide le mot de passe par sécurité
            }
        } catch (error) {
            this.showError(this.passwordInput, 'Une erreur est survenue. Veuillez réessayer.');
            console.error('Erreur de connexion:', error);
        } finally {
            this.setLoadingState(false);
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    initializeEventListeners() {
        // Validation en temps réel avec debounce
        this.emailInput.addEventListener('input', 
            this.debounce(() => this.validateEmail(), 300)
        );
        this.passwordInput.addEventListener('input', 
            this.debounce(() => this.validatePassword(), 300)
        );
        
        // Validation immédiate au blur
        this.emailInput.addEventListener('blur', () => this.validateEmail());
        this.passwordInput.addEventListener('blur', () => this.validatePassword());
        
        // Soumission du formulaire
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
}

// Initialise la validation du formulaire
document.addEventListener('DOMContentLoaded', () => {
    new LoginFormValidator();
});