# SPPS Backend - Student Performance Prediction System

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure .env file
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=spps_db
JWT_SECRET=spps_secret_key_change_this
```

### 3. Import Database
Import all provided .sql files into MySQL under database `spps_db`.

### 4. Run Server
```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/auth/register | Register new user | Public |
| POST | /api/auth/login | Login | Public |

#### Login Example:
```json
POST /api/auth/login
{
  "email": "rahul@spps.com",
  "password": "student123"
}
```
Returns: JWT token

---

### Students
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/students | Get all students | Teacher/Admin |
| GET | /api/students/:id | Get student by ID | Auth |
| GET | /api/students/me/profile | Own profile | Auth |

---

### Attendance
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/attendance | Mark attendance | Teacher |
| GET | /api/attendance/student/:id | Get student attendance | Auth |
| GET | /api/attendance/summary/:id | Attendance % per course | Auth |

#### Mark Attendance Example:
```json
POST /api/attendance
{
  "student_id": 3,
  "course_id": 1,
  "date": "2026-04-09",
  "status": "present"
}
```

---

### Marks
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/marks | Add marks | Teacher |
| GET | /api/marks/student/:id | Get student marks | Auth |
| GET | /api/marks/summary/:id | Avg marks per course | Auth |

#### Add Marks Example:
```json
POST /api/marks
{
  "student_id": 3,
  "course_id": 1,
  "exam_type": "internal",
  "marks_obtained": 35,
  "max_marks": 50
}
```

---

### Predictions
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/predictions/generate/:student_id | Generate prediction | Teacher |
| POST | /api/predictions/generate-all | Generate for all students | Teacher |
| GET | /api/predictions/latest/:student_id | Get latest prediction | Auth |
| GET | /api/predictions/student/:student_id | Prediction history | Auth |
| GET | /api/predictions/all | All students predictions | Teacher |

---

### Courses
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/courses | Get all courses | Auth |
| POST | /api/courses | Add course | Admin |

---

## Prediction Formula

```
pred_score = (avg_marks_% × 0.6) + (attendance_% × 0.4)

risk_level:
  >= 75  → low    (Student is doing well)
  50-74  → medium (Needs attention)
  < 50   → high   (At risk of failing)
```

---

## Using Authentication

After login, use the token in all requests:
```
Authorization: Bearer <your_jwt_token>
```

---

## Project Structure
```
spps-backend/
├── server.js          # Main entry point
├── .env               # Environment variables
├── package.json
├── config/
│   └── db.js          # MySQL connection
├── middleware/
│   └── auth.js        # JWT verification, role checks
└── routes/
    ├── auth.js        # Login/Register
    ├── students.js    # Student APIs
    ├── attendance.js  # Attendance APIs
    ├── marks.js       # Marks APIs
    ├── predictions.js # Prediction APIs
    └── courses.js     # Course APIs
```
