const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

const ACCESS_SECRET = 'access_secret';
const REFRESH_SECRET = 'refresh_secret';
const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

let users = [];
let products = [
  { id: nanoid(6), name: 'Мастер и Маргарита', category: 'Роман', description: 'Культовый роман Булгакова о визите дьявола в Москву.', price: 450, stock: 12, rating: 5 },
  { id: nanoid(6), name: 'Преступление и наказание', category: 'Классика', description: 'Психологический роман Достоевского.', price: 380, stock: 8, rating: 5 },
  { id: nanoid(6), name: '1984', category: 'Антиутопия', description: 'Роман Оруэлла о тоталитарном обществе.', price: 420, stock: 15, rating: 5 },
  { id: nanoid(6), name: 'Дюна', category: 'Фантастика', description: 'Эпическая сага Фрэнка Герберта о пустынной планете.', price: 590, stock: 7, rating: 4 },
  { id: nanoid(6), name: 'Маленький принц', category: 'Сказка', description: 'Философская повесть Экзюпери для детей и взрослых.', price: 290, stock: 20, rating: 5 },
  { id: nanoid(6), name: 'Три товарища', category: 'Роман', description: 'История дружбы и любви от Ремарка.', price: 410, stock: 10, rating: 4 },
  { id: nanoid(6), name: 'Гарри Поттер и философский камень', category: 'Фэнтези', description: 'Первая книга серии о юном волшебнике.', price: 520, stock: 18, rating: 5 },
  { id: nanoid(6), name: 'Война и мир', category: 'Классика', description: 'Монументальный роман-эпопея Льва Толстого.', price: 750, stock: 5, rating: 4 },
  { id: nanoid(6), name: 'Atomic Habits', category: 'Нон-фикшн', description: 'Книга Джеймса Клира о силе маленьких привычек.', price: 490, stock: 14, rating: 5 },
  { id: nanoid(6), name: 'Чистый код', category: 'Программирование', description: 'Руководство по написанию качественного кода от Роберта Мартина.', price: 670, stock: 9, rating: 4 },
];

const refreshTokens = new Set();

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
  });
  next();
});

// Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Book Shop API', version: '1.0.0', description: 'API с refresh-токенами' },
    servers: [{ url: `http://localhost:${port}`, description: 'Локальный сервер' }],
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    },
  },
  apis: ['./app.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Helpers
function generateAccessToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}

function generateRefreshToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  try {
    req.user = jwt.verify(token, ACCESS_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

function findProductOr404(id, res) {
  const product = products.find(p => p.id === id);
  if (!product) { res.status(404).json({ error: 'Product not found' }); return null; }
  return product;
}

// ===== AUTH =====

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, first_name, last_name, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: ivan@mail.ru
 *               first_name:
 *                 type: string
 *                 example: Иван
 *               last_name:
 *                 type: string
 *                 example: Иванов
 *               password:
 *                 type: string
 *                 example: qwerty123
 *               role:
 *                 type: string
 *                 example: user
 *     responses:
 *       201:
 *         description: Пользователь создан
 *       400:
 *         description: Некорректные данные
 */
app.post('/api/auth/register', async (req, res) => {
  const { email, first_name, last_name, password, role } = req.body;
  if (!email || !first_name || !last_name || !password) {
    return res.status(400).json({ error: 'email, first_name, last_name and password are required' });
  }
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: nanoid(6), email, first_name, last_name, passwordHash, role: role || 'user' };
  users.push(user);
  res.status(201).json({ id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: ivan@mail.ru
 *               password:
 *                 type: string
 *                 example: qwerty123
 *     responses:
 *       200:
 *         description: Возвращает accessToken и refreshToken
 *       401:
 *         description: Неверные данные
 */
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  refreshTokens.add(refreshToken);
  res.json({ accessToken, refreshToken });
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновление пары токенов
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Новая пара токенов
 *       401:
 *         description: Невалидный токен
 */
app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });
  if (!refreshTokens.has(refreshToken)) return res.status(401).json({ error: 'Invalid refresh token' });
  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = users.find(u => u.id === payload.sub);
    if (!user) return res.status(401).json({ error: 'User not found' });
    refreshTokens.delete(refreshToken);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    refreshTokens.add(newRefreshToken);
    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Текущий пользователь
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Объект пользователя
 *       401:
 *         description: Не авторизован
 */
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.sub);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role });
});

// ===== USERS (только админ) =====

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Список пользователей
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список пользователей
 *       403:
 *         description: Нет доступа
 */
app.get('/api/users', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  res.json(users.map(u => ({ id: u.id, email: u.email, first_name: u.first_name, last_name: u.last_name, role: u.role })));
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Получить пользователя по ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Пользователь
 *       403:
 *         description: Нет доступа
 *       404:
 *         description: Не найден
 */
app.get('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role });
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Обновить пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Обновлённый пользователь
 *       403:
 *         description: Нет доступа
 *       404:
 *         description: Не найден
 */
app.put('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { first_name, last_name, role } = req.body;
  if (first_name !== undefined) user.first_name = first_name;
  if (last_name !== undefined) user.last_name = last_name;
  if (role !== undefined) user.role = role;
  res.json({ id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role });
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Заблокировать пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Пользователь заблокирован
 *       403:
 *         description: Нет доступа
 *       404:
 *         description: Не найден
 */
app.delete('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const exists = users.some(u => u.id === req.params.id);
  if (!exists) return res.status(404).json({ error: 'User not found' });
  users = users.filter(u => u.id !== req.params.id);
  res.status(204).send();
});

// ===== PRODUCTS =====

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать товар (продавец/админ)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, category, description, price, stock]
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               rating:
 *                 type: number
 *     responses:
 *       201:
 *         description: Товар создан
 *       403:
 *         description: Нет доступа
 */
app.post('/api/products', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
  const { name, category, description, price, stock, rating } = req.body;
  if (!name || !category || !description || price == null || stock == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const newProduct = {
    id: nanoid(6),
    name: name.trim(),
    category: category.trim(),
    description: description.trim(),
    price: Number(price),
    stock: Number(stock),
    rating: rating != null ? Number(rating) : null,
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Список товаров (все авторизованные)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список товаров
 */
app.get('/api/products', authMiddleware, roleMiddleware(['user', 'seller', 'admin']), (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID (все авторизованные)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Данные товара
 *       404:
 *         description: Не найден
 */
app.get('/api/products/:id', authMiddleware, roleMiddleware(['user', 'seller', 'admin']), (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;
  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Обновить товар (продавец/админ)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               rating:
 *                 type: number
 *     responses:
 *       200:
 *         description: Обновлённый товар
 *       403:
 *         description: Нет доступа
 */
app.put('/api/products/:id', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;
  const { name, category, description, price, stock, rating } = req.body;
  if ([name, category, description, price, stock, rating].every(v => v === undefined)) {
    return res.status(400).json({ error: 'Nothing to update' });
  }
  if (name !== undefined) product.name = name.trim();
  if (category !== undefined) product.category = category.trim();
  if (description !== undefined) product.description = description.trim();
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);
  if (rating !== undefined) product.rating = Number(rating);
  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар (только админ)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Удалён
 *       403:
 *         description: Нет доступа
 */
app.delete('/api/products/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const exists = products.some(p => p.id === req.params.id);
  if (!exists) return res.status(404).json({ error: 'Product not found' });
  products = products.filter(p => p.id !== req.params.id);
  res.status(204).send();
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Internal server error' }); });

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/api-docs`);
});