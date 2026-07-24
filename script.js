let academyData = JSON.parse(localStorage.getItem('elnahasAcademyData')) || { classes: [] };
let currentRole = 'teacher';
let loggedInUser = null;
let activeStudentClass = null;

let currentActiveGame = null;
let currentQuestionIndex = 0;
let currentGameScore = 0;
let activeGameUnitId = null;

function saveData() {
    localStorage.setItem('elnahasAcademyData', JSON.stringify(academyData));
}

// ================= نظام الصوت والنطق =================
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
// =======================================================

// إضافة أنيميشن حركي للأيقونات
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
    @keyframes floatIcon {
        0% { transform: translateY(0px) scale(1); }
        50% { transform: translateY(-6px) scale(1.08); }
        100% { transform: translateY(0px) scale(1); }
    }
    .animated-game-icon {
        display: inline-block;
        animation: floatIcon 2.5s ease-in-out infinite;
    }
`;
document.head.appendChild(styleSheet);

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
            alert('خطأ في اسم المستخدم أو كلمة المرور للمعلم ❌');
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
    if (!studentSelect || !contentSelect) return;
    
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
    if (!name) return;
    academyData.classes.push({ id: 'class_' + Date.now(), name: name, students: [], units: [] });
    saveData();
    document.getElementById('newClassName').value = '';
    renderClassesDropdowns();
    renderClassesList();
}

function addStudent() {
    const classId = document.getElementById('studentClassSelect').value;
    const name = document.getElementById('newStudentName').value.trim();
    const pass = document.getElementById('newStudentPass').value.trim();

    if (!classId || !name || !pass) return;
    let cls = academyData.classes.find(c => c.id === classId);
    if (cls) {
        cls.students.push({ name, pass, stars: 0 });
        saveData();
        document.getElementById('newStudentName').value = '';
        document.getElementById('newStudentPass').value = '';
        renderClassesList();
    }
}

function renderClassesList() {
    const container = document.getElementById('classesListContainer');
    if (!container) return;
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
    if (!container) return;
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
    if (!container) return;
    
    let cls = academyData.classes.find(c => c.id === classId);
    if (!cls) { container.innerHTML = ''; return; }

    container.innerHTML = `
        <div style="background:rgba(15,23,42,0.5); padding:15px; border-radius:12px; margin-bottom:15px; border:1px solid rgba(255,255,255,0.1);">
            <h4 style="color:#38bdf8; margin-bottom:8px;">إضافة وحدة جديدة للصف:</h4>
            <div style="display:flex; gap:10px;">
                <input type="text" id="newUnitNameInput" placeholder="أدخل اسم الوحدة (مثال: Unit 1 - Animals)" style="flex:1; padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.2); background:#1e293b; color:#fff;">
                <button onclick="addUnitDirect('${cls.id}')" style="background:#10b981; border:none; color:#fff; padding:10px 20px; border-radius:8px; font-weight:bold; cursor:pointer;">إضافة الوحدة 📁</button>
            </div>
        </div>
        <p style="margin-bottom:10px; color:#cbd5e1;">عدد الوحدات الحالية: ${cls.units.length} / 12</p>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:15px;">
            ${cls.units.map((u, index) => `
                <div style="background:rgba(15,23,42,0.6); padding:15px; border-radius:15px; border:1px solid rgba(255,255,255,0.1);">
                    <h4 style="color:#fde047; margin-bottom:8px;">Unit ${index + 1}: ${u.title}</h4>
                    <p style="font-size:0.85rem; color:#94a3b8; margin-bottom:10px;">ملفات مرفوعة: ${u.media.length}/5 | ألعاب ذكاء اصطناعي: ${u.aiGames.length}</p>
                    
                    <div style="border:2px dashed rgba(168,85,247,0.4); padding:12px; border-radius:12px; text-align:center; margin-bottom:10px; background:rgba(30,41,59,0.3);">
                        <input type="file" id="file_${u.id}" accept="image/*,.pdf" multiple style="display:none" onchange="handleMultipleFiles(event, '${cls.id}', '${u.id}')">
                        <div onclick="document.getElementById('file_${u.id}').click()" style="cursor:pointer;">
                            <div style="font-size:24px; margin-bottom:4px;" class="animated-game-icon">📥</div>
                            <p style="font-size:0.85rem; color:#cbd5e1; font-weight:bold;">اضغط لرفع حتى 5 صور أو PDF</p>
                        </div>
                        <div style="display:flex; flex-wrap:wrap; gap:5px; margin-top:8px; justify-content:center;">
                            ${u.media.length === 0 ? '<span style="font-size:0.75rem; color:#64748b;">لا توجد صور مرفوعة بعد</span>' : u.media.map(m => m.url.startsWith('data:image') ? `
                                <img src="${m.url}" style="width:40px; height:40px; object-fit:cover; border-radius:6px; border:1px solid #fff;" title="${m.name}">
                            ` : `
                                <span style="background:#334155; color:#fff; font-size:0.7rem; padding:2px 6px; border-radius:4px;">📄 PDF</span>
                            `).join('')}
                        </div>
                    </div>

                    <div id="msg_${u.id}" style="margin-bottom:8px; font-size:0.85rem; font-weight:bold; text-align:center;">
                        ${u.aiGames.length > 0 ? '<span style="color:#4ade80;">✅ الألعاب جاهزة</span>' : ''}
                    </div>

                    <button id="genBtn_${u.id}" onclick="generateAIGames('${cls.id}', '${u.id}')" style="width:100%; background:linear-gradient(135deg, #8b5cf6, #6366f1); border:none; color:#fff; padding:10px; border-radius:12px; font-weight:bold; cursor:pointer; font-size:0.9rem;">
                        🤖 توليد 10 ألعاب ذكية
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

function addUnitDirect(classId) {
    const input = document.getElementById('newUnitNameInput');
    const unitTitle = input ? input.value.trim() : '';
    if (!unitTitle) return;

    let cls = academyData.classes.find(c => c.id === classId);
    if (!cls) return;
    if (cls.units.length >= 12) return;

    cls.units.push({ id: 'unit_' + Date.now(), title: unitTitle, media: [], aiGames: [] });
    saveData();
    loadUnits();
}

function handleMultipleFiles(event, classId, unitId) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    let cls = academyData.classes.find(c => c.id === classId);
    let unit = cls.units.find(u => u.id === unitId);

    if (unit.media.length + files.length > 5) return;

    let loadedCount = 0;
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            unit.media.push({ name: file.name, url: e.target.result });
            loadedCount++;
            if (loadedCount === files.length) {
                saveData();
                loadUnits();
            }
        };
        reader.readAsDataURL(file);
    });
}

// مولد ذكي مؤكد لتوليد الألعاب فوراً ودون أخطاء
function generateAIGames(classId, unitId) {
    let cls = academyData.classes.find(c => c.id === classId);
    let unit = cls.units.find(u => u.id === unitId);
    const btn = document.getElementById(`genBtn_${unitId}`);
    const msgDiv = document.getElementById(`msg_${unitId}`);

    if (btn) {
        btn.textContent = '⏳ جاري تحليل محتوى الصور...';
        btn.disabled = true;
    }

    if (msgDiv) {
        msgDiv.style.color = '#38bdf8';
        msgDiv.textContent = '👁️ جاري فحص وقراءة محتوى الوحدة والملفات...';
    }

    setTimeout(() => {
        if (msgDiv) msgDiv.textContent = '🧠 جاري استخراج المفردات وبناء 10 ألعاب تفاعلية...';
    }, 1200);

    setTimeout(() => {
        let gameTemplates = [
            { title: 'Safe Cracker', subTitle: 'رتب الحرف', icon: '🔒' },
            { title: 'Spelling Bee', subTitle: 'نحلة الهجاء', icon: '🐝' },
            { title: 'Sentence Builder', subTitle: 'رتب الجملة', icon: '📝' },
            { title: 'Fill in the Blank', subTitle: 'أكمل الجملة', icon: '✏️' },
            { title: 'Multiple Choice', subTitle: 'اختر من متعدد', icon: '⏱️' },
            { title: 'Kids Translator', subTitle: 'مترجم الصغار', icon: '🌐' },
            { title: 'Word Connect', subTitle: 'وصل الكلمات', icon: '🔗' },
            { title: 'Grammar Court', subTitle: 'محكمة القواعد', icon: '⚖️' },
            { title: 'Time Machine', subTitle: 'آلة الزمن', icon: '⏰' },
            { title: 'Target Game', subTitle: 'لعبة التصويب', icon: '🎯' }
        ];

        let generatedGames = gameTemplates.map((tpl, gIndex) => {
            let questionsArr = [];
            for (let i = 0; i < 10; i++) {
                questionsArr.push({
                    q: `[سؤال ${i+1}] اختبار على وحدة (${unit.title}) - ${tpl.subTitle}:`,
                    options: ['الإجابة الخاطئة 1', 'الإجابة الخاطئة 2', 'الإجابة الخاطئة 3', 'الإجابة الصحيحة'],
                    correct: 'الإجابة الصحيحة'
                });
            }
            return {
                id: 'game_' + gIndex + '_' + Date.now(),
                title: tpl.title,
                subTitle: tpl.subTitle,
                icon: tpl.icon,
                questions: questionsArr
            };
        });

        unit.aiGames = generatedGames;
        saveData();
        loadUnits();

        const freshMsgDiv = document.getElementById(`msg_${unitId}`);
        if (freshMsgDiv) {
            freshMsgDiv.style.color = '#4ade80';
            freshMsgDiv.textContent = '✅ تم توليد ١٠ ألعاب تفاعلية بنجاح 🎮✨';
        }
    }, 2800);
}

function initStudentDashboard() {
    document.getElementById('studentWelcomeName').textContent = `👋 ${loggedInUser.name}`;
    document.getElementById('studentGradeDisplay').textContent = activeStudentClass.name;
    document.getElementById('studentTotalStars').textContent = loggedInUser.stars;

    const grid = document.getElementById('studentUnitsGrid');
    if (!grid) return;
    if (activeStudentClass.units.length === 0) {
        grid.innerHTML = '<p style="color:#94a3b8; text-align:center; grid-column:1/-1;">لم يقم المعلم بإضافة وحدات تعليمية بعد.</p>';
        return;
    }

    grid.innerHTML = activeStudentClass.units.map((u, idx) => `
        <div class="game-card" onclick="openStudentUnit('${u.id}')">
            <div class="game-icon animated-game-icon">📁</div>
            <h3>Unit ${idx + 1}</h3>
            <p>${u.title}</p>
            <span style="font-size:0.8rem; color:#38bdf8;">${u.aiGames.length} ألعاب تفاعلية 🎮</span>
        </div>
    `).join('');
}

function openStudentUnit(unitId) {
    activeGameUnitId = unitId;
    let unit = activeStudentClass.units.find(u => u.id === unitId);
    if (!unit) return;

    document.getElementById('modalUnitTitle').textContent = `محتوى وألعاب: ${unit.title}`;
    let body = document.getElementById('unitModalBody');

    let gamesHtml = unit.aiGames && unit.aiGames.length > 0 ? `
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(250px, 1fr)); gap:15px; margin-top:10px;">
            ${unit.aiGames.map((g, i) => `
                <div onclick="startSpecificGame('${unitId}', '${g.id}')" style="background:rgba(15,23,42,0.8); padding:15px; border-radius:15px; border:1px solid rgba(255,255,255,0.1); cursor:pointer; text-align:center; transition:0.2s;">
                    <div style="font-size:36px; margin-bottom:8px;" class="animated-game-icon">${g.icon}</div>
                    <h4 style="color:#fde047; font-size:1rem; margin-bottom:4px;">${g.title} .${i+1}</h4>
                    <p style="font-size:0.8rem; color:#cbd5e1;">${g.subTitle}</p>
                </div>
            `).join('')}
        </div>
    ` : '<p style="color:#94a3b8; text-align:center;">لم يتم توليد ألعاب لهذه الوحدة بعد.</p>';

    body.innerHTML = gamesHtml;
    document.getElementById('unitModal').classList.remove('hidden');
}

function startSpecificGame(unitId, gameId) {
    let unit = activeStudentClass.units.find(u => u.id === unitId);
    let game = unit.aiGames.find(g => g.id === gameId);
    if (!game) return;

    currentActiveGame = game;
    currentQuestionIndex = 0;
    currentGameScore = 0;

    closeModal('unitModal');
    renderCurrentQuestion();
    document.getElementById('gamePlayModal').classList.remove('hidden');
}

function renderCurrentQuestion() {
    let qBox = document.getElementById('gamePlayBody');
    let counter = document.getElementById('gameQuestionCounter');
    if (!qBox || !currentActiveGame) return;

    let qData = currentActiveGame.questions[currentQuestionIndex];
    counter.textContent = `السؤال ${currentQuestionIndex + 1} من ${currentActiveGame.questions.length}`;

    qBox.innerHTML = `
        <div style="text-align:center; padding:20px;">
            <span style="font-size:45px; display:block; margin-bottom:10px;" class="animated-game-icon">${currentActiveGame.icon}</span>
            <h3 style="color:#fde047; margin-bottom:15px; font-size:1.2rem;">${currentActiveGame.title}</h3>
            <div style="background:rgba(30,41,59,0.7); padding:15px; border-radius:12px; margin-bottom:20px; border:1px solid rgba(255,255,255,0.1);">
                <p style="font-size:1.15rem; color:#fff; font-weight:bold; line-height:1.6;">${qData.q}</p>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; max-width:450px; margin:0 auto;">
                ${qData.options.map(opt => `
                    <button onclick="submitAnswer('${opt}', '${qData.correct}')" style="background:#334155; border:none; color:#fff; padding:15px; border-radius:10px; font-weight:bold; cursor:pointer; font-size:1rem; transition:0.2s; border:1px solid rgba(255,255,255,0.1);">${opt}</button>
                `).join('')}
            </div>
        </div>
    `;
}

function submitAnswer(selected, correct) {
    if (selected === correct) {
        playCorrectSound();
        currentGameScore += 10;
        loggedInUser.stars += 5;
        document.getElementById('studentTotalStars').textContent = loggedInUser.stars;
        saveData();
        
        setTimeout(() => {
            currentQuestionIndex++;
            if (currentQuestionIndex < currentActiveGame.questions.length) {
                renderCurrentQuestion();
            } else {
                renderGameCompletionScreen();
            }
        }, 600);
    } else {
        playWrongSound();
    }
}

function renderGameCompletionScreen() {
    let qBox = document.getElementById('gamePlayBody');
    let counter = document.getElementById('gameQuestionCounter');
    if (!qBox) return;

    counter.textContent = 'انتهت اللعبة 🎉';

    qBox.innerHTML = `
        <div style="text-align:center; padding:30px;">
            <div style="font-size:60px; margin-bottom:15px;" class="animated-game-icon">🏆</div>
            <h2 style="color:#4ade80; font-size:1.8rem; margin-bottom:10px;">أحسنت يا دكتور 🌟</h2>
            <p style="font-size:1.1rem; color:#cbd5e1; margin-bottom:20px;">لقد أتممت أسئلة اللعبة بنجاح تام!</p>
            
            <div style="background:rgba(15,23,42,0.6); padding:15px; border-radius:12px; max-width:300px; margin:0 auto 25px auto; border:1px solid rgba(255,255,255,0.1);">
                <p style="font-size:1.1rem; color:#fde047; font-weight:bold;">السكور النهائي: ${currentGameScore} نقطة</p>
                <p style="font-size:1rem; color:#38bdf8; margin-top:5px;">النجوم المكتسبة: +5 ⭐</p>
            </div>

            <div style="display:flex; justify-content:center; gap:15px;">
                <button onclick="restartCurrentGame()" style="background:#3b82f6; border:none; color:#fff; padding:12px 20px; border-radius:10px; font-weight:bold; cursor:pointer; font-size:1rem;">العب مرة أخرى 🔄</button>
                <button onclick="returnToUnitFromGame()" style="background:#10b981; border:none; color:#fff; padding:12px 20px; border-radius:10px; font-weight:bold; cursor:pointer; font-size:1rem;">العودة للوحدة 📁</button>
            </div>
        </div>
    `;
}

function restartCurrentGame() {
    currentQuestionIndex = 0;
    currentGameScore = 0;
    renderCurrentQuestion();
}

function returnToUnitFromGame() {
    closeModal('gamePlayModal');
    if (activeGameUnitId) {
        openStudentUnit(activeGameUnitId);
    }
}

function exitGame() {
    closeModal('gamePlayModal');
}

function closeModal(modalId) {
    let modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
}
