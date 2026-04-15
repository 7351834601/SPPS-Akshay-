const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, isAdmin, isTeacher } = require('../middleware/auth');

// GET /api/students - Get all students (admin/teacher only)
router.get('/', verifyToken, isTeacher, async (req, res) => {
  try {
    const [students] = await db.query(`
      SELECT s.student_id, s.roll_number, s.department, s.semester,
             u.name, u.email
      FROM students s
      JOIN users u ON s.user_id = u.user_id
    `);
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// GET /api/students/:id - Get single student profile
router.get('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [student] = await db.query(`
      SELECT s.student_id, s.roll_number, s.department, s.semester,
             u.name, u.email
      FROM students s
      JOIN users u ON s.user_id = u.user_id
      WHERE s.student_id = ?
    `, [id]);

    if (student.length === 0) {
      return res.status(404).json({ message: 'Student not found.' });
    }
    res.json(student[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// GET /api/students/me/profile - Get logged-in student's own profile
router.get('/me/profile', verifyToken, async (req, res) => {
  try {
    const [student] = await db.query(`
      SELECT s.student_id, s.roll_number, s.department, s.semester,
             u.name, u.email
      FROM students s
      JOIN users u ON s.user_id = u.user_id
      WHERE u.user_id = ?
    `, [req.user.user_id]);

    if (student.length === 0) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }
    res.json(student[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

module.exports = router;
