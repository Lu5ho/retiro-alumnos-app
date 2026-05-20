const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');

// Expone el endpoint de autenticación usado por la pantalla de login.
router.post('/login', login);

module.exports = router;