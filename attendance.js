const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, isTeacher } = require('../middleware/auth');

// POST /api/attendance - Mark attendance (teacher only)
router.post('/', verifyToken, isTeacher, async (req, res) => {
  const { student_id, course_id, date, status } = req.body;

  if (!student_id || !course_id || !date || !status) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (!['present', 'absent'].includes(status)) {
    return res.status(400).json({ message: 'Status must be present or absent.' });
  }

  try {
    await db.query(
      'INSERT INTO attendance (student_id, course_id, date, status) VALUES (?, ?, ?, ?)',
      [student_id, course_id, date, status]
    );
    res.status(201).json({ message: 'Attendance marked successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// GET /api/attendance/student/:student_id - Get attendance of a student
router.get('/student/:student_id', verifyToken, async (req, res) => {
  const { student_id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT a.attend_id, a.date, a.status,
             c.course_name, c.semester
      FROM attendance a
      JOIN courses c ON a.course_id = c.course_id
      WHERE a.student_id = ?
      ORDER BY a.date DESC
    `, [student_id]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// GET /api/attendance/summary/:student_id - Attendance % per course
router.get('/summary/:student_id', verifyToken, async (req, res) => {
  const { student_id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT c.course_name,
             COUNT(*) AS total_classes,
             SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_count,
             ROUND(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS attendance_percentage
      FROM attendance a
      JOIN courses c ON a.course_id = c.course_id
      WHERE a.student_id = ?
      GROUP BY a.course_id, c.course_name
    `, [student_id]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

module.exports = router;
