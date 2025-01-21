// server.js
import jsonServer from 'json-server';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = jsonServer.create();
const router = jsonServer.router(join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

// Activer CORS
server.use(cors());

// Ajouter middleware pour parser le body
server.use(jsonServer.bodyParser);

// Middleware d'authentification
server.post('/login', (req, res) => {
    const { email, password } = req.body;
    const db = router.db; // Accéder à la base lowdb
    const user = db.get('users').find({ email, password }).value();

    if (user) {
        res.json({
            token: `fake-jwt-token-${user.id}`,
            user: { id: user.id, email: user.email }
        });
    } else {
        res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }
});

server.use(middlewares);
server.use(router);

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`JSON Server is running on port ${PORT}`);
});