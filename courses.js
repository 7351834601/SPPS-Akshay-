const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET /api/courses - Get all courses
router.get('/', verifyToken, async (req, res) => {
  try {
    const [courses] = await db.query('SELECT * FROM courses');
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// POST /api/courses - Add a course (admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  const { course_name, semester, department } = req.body;

  if (!course_name || !semester) {
    return res.status(400).json({ message: 'course_name and semester are required.' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO courses (course_name, semester, department) VALUES (?, ?, ?)',
      [course_name, semester, department || null]
    );
    res.status(201).json({ message: 'Course added.', course_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

module.exports = router;
