const express = require('express');
const router = express.Router();

const categoryRoutes = require('./category');
const productRoutes = require('./product');
const orderRoutes = require('./order');
const userRoutes = require('./user');
const uploadRoutes = require('./upload');

router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/user', userRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;
