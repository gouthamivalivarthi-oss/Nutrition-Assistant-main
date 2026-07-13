const { validationResult } = require('express-validator');
const Meal = require('../models/Meal');

exports.createMeal = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const meal = await Meal.create({ ...req.body, user: req.user.userId });
    return res.status(201).json(meal);
  } catch (error) {
    return res.status(500).json({ message: 'Could not create meal' });
  }
};

exports.getMeals = async (req, res) => {
  try {
    const meals = await Meal.find({ user: req.user.userId }).sort({ createdAt: -1 });
    return res.json(meals);
  } catch (error) {
    return res.status(500).json({ message: 'Could not fetch meals' });
  }
};

exports.updateMeal = async (req, res) => {
  try {
    const meal = await Meal.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      req.body,
      { new: true }
    );

    if (!meal) return res.status(404).json({ message: 'Meal not found' });
    return res.json(meal);
  } catch (error) {
    return res.status(500).json({ message: 'Could not update meal' });
  }
};

exports.deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findOneAndDelete({ _id: req.params.id, user: req.user.userId });
    if (!meal) return res.status(404).json({ message: 'Meal not found' });
    return res.json({ message: 'Meal deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Could not delete meal' });
  }
};
