const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, isTeacher } = require('../middleware/auth');

// POST /api/marks - Add marks (teacher only)
router.post('/', verifyToken, isTeacher, async (req, res) => {
  const { student_id, course_id, exam_type, marks_obtained, max_marks } = req.body;

  if (!student_id || !course_id || !exam_type || marks_obtained == null || !max_marks) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (!['internal', 'assignment', 'final'].includes(exam_type)) {
    return res.status(400).json({ message: 'exam_type must be internal, assignment, or final.' });
  }

  if (marks_obtained > max_marks) {
    return res.status(400).json({ message: 'marks_obtained cannot exceed max_marks.' });
  }

  try {
    await db.query(
      'INSERT INTO marks (student_id, course_id, exam_type, marks_obtained, max_marks) VALUES (?, ?, ?, ?, ?)',
      [student_id, course_id, exam_type, marks_obtained, max_marks]
    );
    res.status(201).json({ message: 'Marks added successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// GET /api/marks/student/:student_id - Get all marks of a student
router.get('/student/:student_id', verifyToken, async (req, res) => {
  const { student_id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT m.marks_id, m.exam_type, m.marks_obtained, m.max_marks, m.entered_at,
             c.course_name,
             ROUND(m.marks_obtained * 100.0 / m.max_marks, 2) AS percentage
      FROM marks m
      JOIN courses c ON m.course_id = c.course_id
      WHERE m.student_id = ?
      ORDER BY m.entered_at DESC
    `, [student_id]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// GET /api/marks/summary/:student_id - Average marks per course
router.get('/summary/:student_id', verifyToken, async (req, res) => {
  const { student_id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT c.course_name, m.exam_type,
             ROUND(AVG(m.marks_obtained * 100.0 / m.max_marks), 2) AS avg_percentage
      FROM marks m
      JOIN courses c ON m.course_id = c.course_id
      WHERE m.student_id = ?
      GROUP BY m.course_id, c.course_name, m.exam_type
    `, [student_id]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

module.exports = router;
