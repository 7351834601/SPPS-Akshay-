const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, isTeacher } = require('../middleware/auth');

// =============================================
// PREDICTION LOGIC (Rule-Based ML Formula)
// =============================================
// pred_score = (avg_marks_% * 0.6) + (attendance_% * 0.4)
// risk_level:
//   >= 75  => low
//   50-74  => medium
//   < 50   => high

async function calculatePrediction(student_id) {
  // Step 1: Get average marks percentage
  const [marksData] = await db.query(`
    SELECT ROUND(AVG(marks_obtained * 100.0 / max_marks), 2) AS avg_marks_pct
    FROM marks
    WHERE student_id = ?
  `, [student_id]);

  const avg_marks_pct = marksData[0].avg_marks_pct || 0;

  // Step 2: Get attendance percentage
  const [attendData] = await db.query(`
    SELECT 
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present_count
    FROM attendance
    WHERE student_id = ?
  `, [student_id]);

  const total = attendData[0].total || 0;
  const present = attendData[0].present_count || 0;
  const attendance_pct = total > 0 ? (present * 100.0) / total : 0;

  // Step 3: Calculate pred_score
  const pred_score = parseFloat(((avg_marks_pct * 0.6) + (attendance_pct * 0.4)).toFixed(2));

  // Step 4: Determine risk level
  let risk_level;
  if (pred_score >= 75) {
    risk_level = 'low';
  } else if (pred_score >= 50) {
    risk_level = 'medium';
  } else {
    risk_level = 'high';
  }

  return { pred_score, risk_level, avg_marks_pct, attendance_pct };
}

// POST /api/predictions/generate/:student_id - Generate prediction (teacher/admin)
router.post('/generate/:student_id', verifyToken, isTeacher, async (req, res) => {
  const { student_id } = req.params;

  try {
    // Check student exists
    const [student] = await db.query('SELECT * FROM students WHERE student_id = ?', [student_id]);
    if (student.length === 0) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const { pred_score, risk_level, avg_marks_pct, attendance_pct } = await calculatePrediction(student_id);

    // Save prediction to DB
    await db.query(
      'INSERT INTO predictions (student_id, pred_score, risk_level) VALUES (?, ?, ?)',
      [student_id, pred_score, risk_level]
    );

    res.status(201).json({
      message: 'Prediction generated successfully.',
      prediction: {
        student_id: parseInt(student_id),
        pred_score,
        risk_level,
        breakdown: {
          avg_marks_percentage: avg_marks_pct,
          attendance_percentage: parseFloat(attendance_pct.toFixed(2)),
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// POST /api/predictions/generate-all - Generate predictions for all students
router.post('/generate-all', verifyToken, isTeacher, async (req, res) => {
  try {
    const [students] = await db.query('SELECT student_id FROM students');

    const results = [];
    for (const student of students) {
      const { pred_score, risk_level } = await calculatePrediction(student.student_id);
      await db.query(
        'INSERT INTO predictions (student_id, pred_score, risk_level) VALUES (?, ?, ?)',
        [student.student_id, pred_score, risk_level]
      );
      results.push({ student_id: student.student_id, pred_score, risk_level });
    }

    res.json({ message: 'Predictions generated for all students.', results });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// GET /api/predictions/student/:student_id - Get prediction history
router.get('/student/:student_id', verifyToken, async (req, res) => {
  const { student_id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT p.pred_id, p.pred_score, p.risk_level, p.created_at,
             u.name AS student_name, s.roll_number
      FROM predictions p
      JOIN students s ON p.student_id = s.student_id
      JOIN users u ON s.user_id = u.user_id
      WHERE p.student_id = ?
      ORDER BY p.created_at DESC
    `, [student_id]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// GET /api/predictions/latest/:student_id - Get latest prediction
router.get('/latest/:student_id', verifyToken, async (req, res) => {
  const { student_id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT p.pred_id, p.pred_score, p.risk_level, p.created_at,
             u.name AS student_name, s.roll_number
      FROM predictions p
      JOIN students s ON p.student_id = s.student_id
      JOIN users u ON s.user_id = u.user_id
      WHERE p.student_id = ?
      ORDER BY p.created_at DESC
      LIMIT 1
    `, [student_id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No prediction found for this student.' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// GET /api/predictions/all - Get all students latest predictions (admin/teacher)
router.get('/all', verifyToken, isTeacher, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.pred_id, p.pred_score, p.risk_level, p.created_at,
             u.name AS student_name, s.roll_number, s.department, s.semester
      FROM predictions p
      JOIN students s ON p.student_id = s.student_id
      JOIN users u ON s.user_id = u.user_id
      WHERE p.pred_id IN (
        SELECT MAX(pred_id) FROM predictions GROUP BY student_id
      )
      ORDER BY p.risk_level DESC, p.pred_score ASC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

module.exports = router;
