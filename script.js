const API_BASE = "http://localhost:5000/api";
const { JSDOM } = require('jsdom');

// Fake DOM create karo
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
global.document = dom.window.document;
global.window = dom.window;

// Show Message
function showMessage(message, type = "error") {
  const msgDiv = document.createElement("div");
  msgDiv.style.cssText = `
    position: fixed; top: 20px; right: 20px; padding: 15px 20px; 
    border-radius: 8px; color: white; font-weight: 500; z-index: 10000;
    background: ${type === "success" ? "#2ed573" : "#ff4757"};
  `;
  msgDiv.textContent = message;
  document.body.appendChild(msgDiv);
  setTimeout(() => msgDiv.remove(), 4000);
}

// Show/Hide Pages
function showLogin() {
  document.getElementById("hero").classList.add("hidden");
  document.getElementById("loginPage").classList.remove("hidden");
}

function showRegister() {
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("registerPage").classList.remove("hidden");
}

function hideRegister() {
  document.getElementById("registerPage").classList.add("hidden");
  document.getElementById("loginPage").classList.remove("hidden");
}

// ===================== LOGIN =====================
async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    showMessage("Please enter email and password", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Login failed");

    localStorage.setItem("token", data.token);

    showMessage(`Welcome ${data.user.name}!`, "success");

    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");
    document.getElementById("userName").textContent = data.user.name;

    loadRoleDashboard(data.user.role, data.user.name);

  } catch (err) {
    showMessage(err.message, "error");
  }
}

// ===================== REGISTER =====================
async function register() {
  const name = document.getElementById("reg_name").value.trim();
  const email = document.getElementById("reg_email").value.trim();
  const password = document.getElementById("reg_password").value.trim();
  const role = document.getElementById("reg_role").value;
  const roll_number = document.getElementById("reg_roll").value.trim();
  const department = document.getElementById("reg_dept").value.trim();
  const semester = document.getElementById("reg_sem").value;

  if (!name || !email || !password || !role) {
    showMessage("All fields are required", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role, roll_number, department, semester }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showMessage("Registration Successful! Please Login", "success");
    hideRegister();
  } catch (err) {
    showMessage(err.message, "error");
  }
}

// ===================== LOAD DASHBOARD =====================
function loadRoleDashboard(role, name) {
  document.querySelectorAll(".role").forEach(el => el.style.display = "none");

  if (role === "student") {
    document.getElementById("studentDash").style.display = "block";
    document.getElementById("studentName").textContent = name;
    loadStudentDashboard();
  } 
  else if (role === "teacher") {
    document.getElementById("teacherDash").style.display = "block";
  } 
  else if (role === "admin") {
    document.getElementById("adminDash").style.display = "block";
  }
}

// ===================== STUDENT DASHBOARD - FULL DATA =====================
async function loadStudentDashboard() {
  const token = localStorage.getItem("token");

  try {
    // 1. Get Student Profile (to get student_id)
    const profileRes = await fetch(`${API_BASE}/students/me/profile`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const profile = await profileRes.json();
    const studentId = profile.student_id;

    // 2. Get Latest Prediction
    const predRes = await fetch(`${API_BASE}/predictions/latest/${studentId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const prediction = await predRes.json();

    document.getElementById("perfScore").textContent = prediction.pred_score + "%";
    const riskEl = document.getElementById("riskLevel");
    riskEl.textContent = prediction.risk_level.toUpperCase();
    riskEl.className = prediction.risk_level === "low" ? "low" : "high";

    // 3. Get All Marks (NEW FEATURE)
    const marksRes = await fetch(`${API_BASE}/marks/student/${studentId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const marksData = await marksRes.json();

    renderMarksTable(marksData);

    // 4. Suggestions
    document.getElementById("suggestions").innerHTML = `
      <li>Focus more on subjects with low marks</li>
      <li>Improve attendance to boost your score</li>
    `;

  } catch (err) {
    console.error(err);
    showMessage("Could not load your data. Please try again.", "error");
  }
}

// Render Marks Table
function renderMarksTable(marks) {
  const tbody = document.getElementById("marksBody");
  tbody.innerHTML = "";

  if (marks.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">No marks uploaded yet</td></tr>`;
    return;
  }

  marks.forEach(mark => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td style="padding:10px;">${mark.course_name}</td>
      <td style="padding:10px; text-align:center;">${mark.exam_type}</td>
      <td style="padding:10px; text-align:center;">${mark.marks_obtained} / ${mark.max_marks}</td>
      <td style="padding:10px; text-align:center;">${mark.percentage}%</td>
      <td style="padding:10px; text-align:center;">${new Date(mark.entered_at).toLocaleDateString()}</td>
    `;
    tbody.appendChild(row);
  });
}

// ===================== TEACHER - UPLOAD MARKS =====================
async function uploadMarks() {
  const data = {
    student_id: document.getElementById("studentIdMark").value,
    course_id: document.getElementById("courseIdMark").value,
    exam_type: document.getElementById("examType").value,
    marks_obtained: parseFloat(document.getElementById("marksObt").value),
    max_marks: parseFloat(document.getElementById("maxMarks").value)
  };

  try {
    const res = await fetch(`${API_BASE}/marks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    showMessage(result.message || "Marks uploaded successfully!", "success");
  } catch (err) {
    showMessage("Failed to upload marks", "error");
  }
}

// ===================== LOGOUT =====================
function logout() {
  localStorage.clear();
  location.reload();
}

// Enter Key Support
document.addEventListener("DOMContentLoaded", () => {
  const passwordField = document.getElementById("password");
  if (passwordField) {
    passwordField.addEventListener("keypress", (e) => {
      if (e.key === "Enter") login();
    });
  }
});