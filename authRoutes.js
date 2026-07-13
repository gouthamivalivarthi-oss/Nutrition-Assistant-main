const express = require('express');
const { body } = require('express-validator');
const { register, login } = require('../controllers/authController');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('preference')
      .optional()
      .isIn(['weightloss', 'maintain', 'weightgain'])
      .withMessage('Preference must be weightloss, maintain, or weightgain')
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('preference')
      .optional()
      .isIn(['weightloss', 'maintain', 'weightgain'])
      .withMessage('Preference must be weightloss, maintain, or weightgain')
  ],
  login
);

module.exports = router;
