
// بيانات المعلم المعتمدة
const TEACHER_CREDENTIALS = {
    username: "مستر غازي",
    password: "النحاس99"
};

let currentRole = 'teacher';

function setRole(role) {
    currentRole = role;
    const teacherTab = document.querySelector('.role-tabs button:nth-child(1)');
    const studentTab = document.querySelector('.role-tabs button:nth-child(2)');
    const usernameLabel = document.getElementById('username-label');
    const usernameInput = document.getElementById('login-username');

    if (role === 'teacher') {
        if (teacherTab) teacherTab.className = "role-tab active-teacher";
        if (studentTab) studentTab.className = "role-tab";
        if (usernameLabel) usernameLabel.textContent = "👤 اسم المستخدم (معلم)";
        if (usernameInput) usernameInput.placeholder = "أدخل اسم مستخدم المعلم";
    } else {
        if (studentTab) studentTab.className = "role-tab active-student";
        if (teacherTab) teacherTab.className = "role-tab";
        if (usernameLabel) usernameLabel.textContent = "👤 اسم الطالب";
        if (usernameInput) usernameInput.placeholder = "أدخل اسمك الثلاثي";
    }
}

function handleLogin() {
    const usernameInput = document.getElementById('login-username').value.trim();
    const passwordInput = document.getElementById('login-password').value.trim();
    const errorDiv = document.getElementById('login-error');

    if (usernameInput === "" || passwordInput === "") {
        errorDiv.textContent = "الرجاء إدخال اسم المستخدم وكلمة المرور";
        errorDiv.classList.remove('hidden');
        return;
    }

    if (currentRole === 'teacher') {
        if (usernameInput !== TEACHER_CREDENTIALS.username || passwordInput !== TEACHER_CREDENTIALS.password) {
            errorDiv.textContent = "خطأ: بيانات دخول المعلم غير صحيحة!";
            errorDiv.classList.remove('hidden');
            return;
        }
    }

    errorDiv.classList.add('hidden');

    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const navUserName = document.getElementById('nav-user-name');

    if (loginScreen && dashboardScreen) {
        loginScreen.classList.add('hidden');
        dashboardScreen.classList.remove('hidden');
        
        if (navUserName) {
            navUserName.textContent = currentRole === 'teacher' ? "المعلم (Mr Ghazy)" : usernameInput;
        }

        if (currentRole === 'teacher') {
            const teacherUnitsView = document.getElementById('view-teacher-units');
            if (teacherUnitsView) {
                teacherUnitsView.classList.remove('hidden');
            }
        } else {
            const studentGradesView = document.getElementById('view-student-grades');
            if (studentGradesView) {
                studentGradesView.classList.remove('hidden');
                if (typeof loadStudentGrades === 'function') loadStudentGrades();
            }
        }
    }
}

function handleLogout() {
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';

    if (loginScreen && dashboardScreen) {
        dashboardScreen.classList.add('hidden');
        loginScreen.classList.remove('hidden');
    }
}
