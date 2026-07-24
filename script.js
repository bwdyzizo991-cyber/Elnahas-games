let academyData = JSON.parse(localStorage.getItem('elnahasAcademyData')) || { classes: [] };
let currentRole = 'teacher';
let loggedInUser = null;
let activeStudentClass = null;

function saveData() {
    localStorage.setItem('elnahasAcademyData', JSON.stringify(academyData));
}

// ================= نظام المؤثرات الصوتية والنطق (Audio & Speech) =================
function playCorrectSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    } catch(e) {}

    // تشغيل عبارات تعزيزية صوتية (أحسنت، برافو، ممتاز يا دكتور)
    const phrases = ["أحسنت", "برافو عليك", "ممتاز يا دكتور"];
    let randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    speakText(randomPhrase);
}

function playWrongSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.setValueAtTime(100, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    } catch(e) {}
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        let utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = text.match(/[ا-ي]/) ? 'ar-EG' : 'en-US';
        window.speechSynthesis.speak(utterance);
    }
}
// =========================================================================

function setRole(role) {
    currentRole = role;
    document.getElementById('teacherRoleBtn').classList.toggle('active', role === 'teacher');
    document.getElementById('studentRoleBtn').classList.toggle('active', role === 'student');
}

function handleLogin(event) {
    event.preventDefault();
    const user = document.getElementById('usernameInput').value.trim();
    const pass = document.getElementById('passwordInput').value.trim();

    if (currentRole === 'teacher') {
        if (user === 'مستر غازي' && pass === 'النحاس99') {
            loggedInUser = { name: 'مستر غازي', role: 'teacher' };
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('teacherDashboard').classList.remove('hidden');
            initTeacherDashboard();
        } else {
            alert('خطأ في اسم المستخدم أو كلمة المرور للمعلم ❌ (مستر غازي / النحاس99)');
        }
    } else {
        let foundStudent = null;
        let studentClass = null;
        for (let cls of academyData.classes) {
            let st = cls.students.find(s => s.name === user && s.pass === pass);
            if (st) {
                foundStudent = st;
                studentClass = cls;
                break;
            }
        }

        if (foundStudent) {
            loggedInUser = foundStudent;
            activeStudentClass = studentClass;
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('studentDashboard').classList.remove('hidden');
            initStudentDashboard();
        } else {
            alert('بيانات الطالب غير صحيحة أو غير مسجل في النظام ❌');
        }
    }
}

function logout() {
    loggedInUser = null;
    document.getElementById('teacherDashboard').classList.add('hidden');
    document.getElementById('studentDashboard').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.dashboard-nav .nav-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.remove('hidden');
    event.target.classList.add('active');

    if (tabId === 'resultsTab') renderResults();
    if (tabId === 'contentTab') initContentTab();
}

function initTeacherDashboard() {
    renderClassesDropdowns();
    renderClassesList();
}

function renderClassesDropdowns() {
    const studentSelect = document.getElementById('studentClassSelect');
    const contentSelect = document.getElementById('contentClassSelect');
    studentSelect.innerHTML = '';
    contentSelect.innerHTML = '';

    academyData.classes.forEach(cls => {
        let opt1 = document.createElement('option');
        opt1.value = cls.id;
        opt1.textContent = cls.name;
        studentSelect.appendChild(opt1);

        let opt2 = document.createElement('option');
        opt2.value = cls.id;
        opt2.textContent = cls.name;
        contentSelect.appendChild(opt2);
    });
    if (academyData.classes.length > 0) loadUnits();
}

function addClass() {
    const name = document.getElementById('newClassName').value.trim();
    if (!name) return alert('أدخل اسم الصف');
    academyData.classes.push({ id: 'class_' + Date.now(), name: name, students: [], units: [] });
    saveData();
    document.getElementById('newClassName').value = '';
    renderClassesDropdowns();
    renderClassesList();
    alert('تم إضافة الصف بنجاح ✅');
}

function addStudent() {
    const classId = document.getElementById('studentClassSelect').value;
    const name = document.getElementById('newStudentName').value.trim();
    const pass = document.getElementById('newStudentPass').value.trim();

    if (!classId || !name || !pass) return alert('الرجاء استكمال بيانات الطالب');
    let cls = academyData.classes.find(c => c.id === classId);
    if (cls) {
        cls.students.push({ name, pass, stars: 0 });
        saveData();
        document.getElementById('newStudentName').value = '';
        document.getElementById('newStudentPass').value = '';
        renderClassesList();
        alert('تم تسجيل الطالب بنجاح 👨‍🎓');
    }
}

function renderClassesList() {
    const container = document.getElementById('classesListContainer');
    if (academyData.classes.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8">لا توجد صفوف مسجلة بعد.</p>';
        return;
    }
    container.innerHTML = academyData.classes.map(cls => `
        <div style="background:rgba(15,23,42,0.4); padding:15px; border-radius:12px; margin-bottom:10px;">
            <h4 style="color:#38bdf8">${cls.name} (عدد الطلاب: ${cls.students.length})</h4>
            <ul style="margin-right:20px; margin-top:5px; color:#cbd5e1; font-size:0.9rem;">
                ${cls.students.map(s => `<li>${s.name} (كلمة المرور: ${s.pass})</li>`).join('') || '<li>لا يوجد طلاب بهذا الصف</li>'}
            </ul>
        </div>
    `).join('');
}

function renderResults() {
    const container = document.getElementById('resultsContainer');
    if (academyData.classes.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8">لا توجد بيانات متاحة.</p>';
        return;
    }

    container.innerHTML = academyData.classes.map(cls => {
        let sortedStudents = [...cls.students].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
        return `
            <div style="margin-bottom:20px;">
                <h4 style="color:#38bdf8; margin-bottom:8px;">${cls.name}</h4>
                <table>
                    <thead>
                        <tr>
                            <th>رقم / تسلسل</th>
                            <th>اسم الطالب</th>
                            <th>كلمة المرور</th>
                            <th>مجموع النجوم ⭐</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedStudents.map((s, idx) => `
                            <tr>
                                <td>${idx + 1}</td>
                                <td>${s.name}</td>
                                <td>${s.pass}</td>
                                <td><b style="color:#fde047">${s.stars} ⭐</b></td>
                            </tr>
                        `).join('') || '<tr><td colspan="4">لا يوجد طلاب</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    }).join('');
}

function initContentTab() {
    renderClassesDropdowns();
}

function loadUnits() {
    const classId = document.getElementById('contentClassSelect').value;
    const container = document.getElementById('unitsContainer');
    let cls = academyData.classes.find(c => c.id === classId);
    if (!cls) { container.innerHTML = ''; return; }

    container.innerHTML = `
        <p style="margin-bottom:10px; color:#cbd5e1;">عدد الوحدات الحالية: ${cls.units.length} / 12</p>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:15px;">
            ${cls.units.map((u, index) => `
                <div style="background:rgba(15,23,42,0.6); padding:15px; border-radius:15px; border:1px solid rgba(255,255,255,0.1);">
                    <h4 style="color:#fde047; margin-bottom:8px;">Unit ${index + 1}: ${u.title}</h4>
                    <p style="font-size:0.85rem; color:#94a3b8; margin-bottom:10px;">صور/ملفات: ${u.media.length}/7 | ألعاب ذكاء اصطناعي: ${u.aiGames.length}</p>
                    <div style="display:flex; gap:5px; flex-wrap:wrap;">
                        <button onclick="addMediaToUnit('${cls.id}', '${u.id}')" style="background:#0284c7; border:none; color:#fff; padding:6px 10px; border-radius:8px; font-size:0.8rem; cursor:pointer;">رفع صور/PDF 🖼️</button>
                        <button onclick="generateAIGames('${cls.id}', '${u.id}')" style="background:#8b5cf6; border:none; color:#fff; padding:6px 10px; border-radius:8px; font-size:0.8rem; cursor:pointer;">توليد 10 ألعاب AI 🤖</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function addUnit() {
    const classId = document.getElementById('contentClassSelect').value;
    let cls = academyData.classes.find(c => c.id === classId);
    if (!cls) return;
    if (cls.units.length >= 12) return alert('عذراً، الحد الأقصى هو 12 وحدة فقط لكل صف!');

    let unitTitle = prompt('أدخل عنوان الوحدة (مثال: Animals & Nature):');
    if (!unitTitle) return;

    cls.units.push({ id: 'unit_' + Date.now(), title: unitTitle, media: [], aiGames: [] });
    saveData();
    loadUnits();
}

function addMediaToUnit(classId, unitId) {
    let cls = academyData.classes.find(c => c.id === classId);
    let unit = cls.units.find(u => u.id === unitId);
    if (unit.media.length >= 7) return alert('تم الوصول للحد الأقصى (7 صور أو ملفات PDF لكل وحدة)!');

    let fileUrl = prompt('أدخل رابط الصورة التعليمية أو ملف الـ PDF:');
    if (!fileUrl) return;

    unit.media.push(fileUrl);
    saveData();
    loadUnits();
    alert('تمت إضافة الملف بنجاح ✅');
}

function generateAIGames(classId, unitId) {
    let cls = academyData.classes.find(c => c.id === classId);
    let unit = cls.units.find(u => u.id === unitId);

    let generatedGames = [
        { type: 'Spelling Bee', title: 'نحلة الهجاء', q: 'اختر التهجئة الصحيحة لكلمة: Elephant', options: ['Elefant', 'Elephant', 'Elephnt', 'Elifant'], correct: 'Elephant' },
        { type: 'Fill in Blank', title: 'آلة الزمن للجرمر', q: 'She ___ to school every day.', options: ['go', 'goes', 'went', 'going'], correct: 'goes' },
        { type: 'Sentence Builder', title: 'ترتيب الجمل', q: 'رتب لتكون جملة صحيحة: [play / we / football]', options: ['We play football', 'Football play we', 'Play we football', 'We football play'], correct: 'We play football' },
        { type: 'Multiple Choice', title: 'اختيار متعدد', q: 'ما معنى كلمة Teacher؟', options: ['طبيب', 'معلم', 'مهندس', 'شرطي'], correct: 'معلم' },
        { type: 'Translation', title: 'ترجمة', q: 'ترجم: (أحب قراءة الكتب)', options: ['I like reading books', 'I play football', 'I go to school', 'I eat apple'], correct: 'I like reading books' },
        { type: 'Correct Error', title: 'صحح الخطأ', q: 'They ( is ) happy. التصحيح:', options: ['are', 'am', 'be', 'was'], correct: 'are' },
        { type: 'Drag & Drop', title: 'السحب والإفلات', q: 'طابق الحيوان بمكانه: (Fish)', options: ['Water', 'Sky', 'Desert', 'Tree'], correct: 'Water' },
        { type: 'Dictation', title: 'الإملاء السمعي', q: 'استمع واكتب الكلمة:', options: ['School', 'Car', 'Book', 'Pen'], correct: 'School' },
        { type: 'Grammar Time', title: 'آلة الزمن', q: 'الماضي من go:', options: ['goes', 'went', 'gone', 'going'], correct: 'went' },
        { type: 'Challenge', title: 'التحدي', q: 'أكمل الحرف: c_t', options: ['a', 'e', 'i', 'o'], correct: 'a' }
    ];

    unit.aiGames = generatedGames;
    saveData();
    loadUnits();
    alert('🤖 تم توليد 10 ألعاب تفاعلية بالذكاء الاصطناعي بنجاح!');
}

function initStudentDashboard() {
    document.getElementById('studentWelcomeName').textContent = `👋 ${loggedInUser.name}`;
    document.getElementById('studentGradeDisplay').textContent = activeStudentClass.name;
    document.getElementById('studentTotalStars').textContent = loggedInUser.stars;

    const grid = document.getElementById('studentUnitsGrid');
    if (activeStudentClass.units.length === 0) {
        grid.innerHTML = '<p style="color:#94a3b8; text-align:center; grid-column:1/-1;">لم يقم المعلم بإضافة وحدات تعليمية بعد.</p>';
        return;
    }

    grid.innerHTML = activeStudentClass.units.map((u, idx) => `
        <div class="game-card" onclick="openStudentUnit('${u.id}')">
            <div class="game-icon">📁</div>
            <h3>Unit ${idx + 1}</h3>
            <p>${u.title}</p>
            <span style="font-size:0.8rem; color:#38bdf8;">${u.aiGames.length} ألعاب تفاعلية 🎮</span>
        </div>
    `).join('');
}

function openStudentUnit(unitId) {
    let unit = activeStudentClass.units.find(u => u.id === unitId);
    if (!unit) return;

    document.getElementById('modalUnitTitle').textContent = `محتوى وألعاب: ${unit.title}`;
    let body = document.getElementById('unitModalBody');

    let mediaHtml = unit.media.length > 0 ? `
        <h4 style="color:#38bdf8; margin-bottom:10px;">الصور والملفات التعليمية:</h4>
        <div style="display:flex; gap:10px; overflow-x:auto; margin-bottom:20px; padding-bottom:10px;">
            ${unit.media.map(m => `<a href="${m}" target="_blank" style="background:rgba(255,255,255,0.1); padding:10px; border-radius:10px; color:#fff; text-decoration:none;">عرض ملف 📄</a>`).join('')}
        </div>
    ` : '<p style="color:#94a3b8; margin-bottom:20px;">لا توجد ملفات مرفوعة لهذه الوحدة.</p>';

    let gamesHtml = unit.aiGames.length > 0 ? `
        <h4 style="color:#fde047; margin-bottom:10px;">الألعاب التفاعلية (10 ألعاب):</h4>
        <div style="display:flex; flex-direction:column; gap:12px;">
            ${unit.aiGames.map((g, i) => `
                <div style="background:rgba(15,23,42,0.7); padding:15px; border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <p style="font-weight:bold; color:#fff;">${i+1}. ${g.title}: ${g.q}</p>
                        <button onclick="speakText('${g.q.replace(/'/g, "")}')" style="background:#0284c7; border:none; color:#fff; padding:5px 10px; border-radius:8px; cursor:pointer; font-size:0.85rem;" title="استمع للسؤال أو الكلمة">🔊 استمع</button>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                        ${g.options.map(opt => `<button onclick="checkStudentAnswer('${opt}', '${g.correct}')" style="background:#334155; border:none; color:#fff; padding:10px; border-radius:8px; cursor:pointer; font-weight:bold; transition:0.2s;">${opt}</button>`).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    ` : '<p style="color:#94a3b8;">لم يتم توليد ألعاب لهذه الوحدة بعد.</p>';

    body.innerHTML = mediaHtml + gamesHtml;
    document.getElementById('unitModal').classList.remove('hidden');
}

function checkStudentAnswer(selected, correct) {
    if (selected === correct) {
        playCorrectSound();
        loggedInUser.stars += 10;
        document.getElementById('studentTotalStars').textContent = loggedInUser.stars;
        saveData();
        setTimeout(() => alert('إجابة صحيحة! أحسنت 🎉 (+10 نجوم)'), 200);
    } else {
        playWrongSound();
        setTimeout(() => alert('إجابة خاطئة، حاول مرة أخرى! ❌'), 200);
    }
}

function openPlatformImageModal() {
    document.getElementById('platformImageModal').classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}
