-- SQL schema for SPPS backend
-- Run this script in MySQL to create the required database and tables.

CREATE DATABASE IF NOT EXISTS spps_db;
USE spps_db;

DROP TABLE IF EXISTS predictions;
DROP TABLE IF EXISTS marks;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  user_id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'teacher', 'admin') NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE students (
  student_id INT NOT NULL AUTO_INCREMENT,
  user_id INT DEFAULT NULL,
  roll_number VARCHAR(20) NOT NULL,
  department VARCHAR(50) DEFAULT NULL,
  semester INT DEFAULT NULL,
  PRIMARY KEY (student_id),
  UNIQUE KEY roll_number (roll_number),
  UNIQUE KEY user_id (user_id),
  CONSTRAINT students_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE teachers (
  teacher_id INT NOT NULL AUTO_INCREMENT,
  user_id INT DEFAULT NULL,
  department VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (teacher_id),
  UNIQUE KEY user_id (user_id),
  CONSTRAINT teachers_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE courses (
  course_id INT NOT NULL AUTO_INCREMENT,
  course_name VARCHAR(100) NOT NULL,
  semester INT NOT NULL,
  department VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE attendance (
  attend_id INT NOT NULL AUTO_INCREMENT,
  student_id INT DEFAULT NULL,
  course_id INT DEFAULT NULL,
  date DATE NOT NULL,
  status ENUM('present', 'absent') NOT NULL,
  PRIMARY KEY (attend_id),
  KEY student_id (student_id),
  KEY course_id (course_id),
  CONSTRAINT attendance_ibfk_1 FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  CONSTRAINT attendance_ibfk_2 FOREIGN KEY (course_id) REFERENCES courses(course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE marks (
  marks_id INT NOT NULL AUTO_INCREMENT,
  student_id INT DEFAULT NULL,
  course_id INT DEFAULT NULL,
  exam_type ENUM('internal', 'assignment', 'final') NOT NULL,
  marks_obtained FLOAT NOT NULL,
  max_marks FLOAT NOT NULL,
  entered_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (marks_id),
  KEY student_id (student_id),
  KEY course_id (course_id),
  CONSTRAINT marks_ibfk_1 FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  CONSTRAINT marks_ibfk_2 FOREIGN KEY (course_id) REFERENCES courses(course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE predictions (
  pred_id INT NOT NULL AUTO_INCREMENT,
  student_id INT DEFAULT NULL,
  pred_score FLOAT DEFAULT NULL,
  risk_level ENUM('low', 'medium', 'high') DEFAULT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (pred_id),
  KEY student_id (student_id),
  CONSTRAINT predictions_ibfk_1 FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
