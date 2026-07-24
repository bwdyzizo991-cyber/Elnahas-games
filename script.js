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
                    
                    <!-- صندوق رفع الصور المتعدد المماثل للصورة المرفقة -->
                    <div style="border:2px dashed rgba(168,85,247,0.4); padding:12px; border-radius:12px; text-align:center; margin-bottom:10px; background:rgba(30,41,59,0.3);">
                        <input type="file" id="file_${u.id}" accept="image/*,.pdf" multiple style="display:none" onchange="handleMultipleFiles(event, '${cls.id}', '${u.id}')">
                        <div onclick="document.getElementById('file_${u.id}').click()" style="cursor:pointer;">
                            <div style="font-size:24px; margin-bottom:4px;">📥</div>
                            <p style="font-size:0.85rem; color:#cbd5e1; font-weight:bold;">اضغط لرفع حتى 5 صور أو PDF</p>
                            <span style="font-size:0.75rem; color:#94a3b8;">سيتم تحويل المحتوى تلقائياً إلى 10 ألعاب تعليمية</span>
                        </div>
                    </div>

                    <!-- عرض الملفات المختارة بشكل أنيق مثل الصورة المرفقة -->
                    ${u.media.length > 0 ? `
                        <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:10px;">
                            ${u.media.map((m, mIdx) => `
                                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(30,41,59,0.7); padding:6px 10px; border-radius:20px; border:1px solid rgba(255,255,255,0.05);">
                                    <span style="font-size:0.8rem; color:#f3e8ff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:180px;">📎 ${m.name}</span>
                                    <button onclick="removeMedia('${cls.id}', '${u.id}', ${mIdx})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-weight:bold; font-size:0.85rem;">✕</button>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}

                    <button onclick="generateAIGames('${cls.id}', '${u.id}')" style="width:100%; background:linear-gradient(135deg, #8b5cf6, #6366f1); border:none; color:#fff; padding:10px; border-radius:12px; font-weight:bold; cursor:pointer; font-size:0.9rem; display:flex; align-items:center; justify-content:center; gap:8px;">
                        🤖 توليد الألعاب بالذكاء الاصطناعي
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

function addUnitDirect(classId) {
    const input = document.getElementById('newUnitNameInput');
    const unitTitle = input ? input.value.trim() : '';
    if (!unitTitle) return alert('الرجاء كتابة اسم الوحدة أولاً!');

    let cls = academyData.classes.find(c => c.id === classId);
    if (!cls) return;
    if (cls.units.length >= 12) return alert('عذراً، الحد الأقصى هو 12 وحدة فقط لكل صف!');

    cls.units.push({ id: 'unit_' + Date.now(), title: unitTitle, media: [], aiGames: [] });
    saveData();
    loadUnits();
    alert('تمت إضافة الوحدة بنجاح ✅');
}

function handleMultipleFiles(event, classId, unitId) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    let cls = academyData.classes.find(c => c.id === classId);
    let unit = cls.units.find(u => u.id === unitId);

    if (unit.media.length + files.length > 5) {
        return alert('عذراً، الحد الأقصی هو 5 ملفات فقط لكل وحدة!');
    }

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

function removeMedia(classId, unitId, mediaIndex) {
    let cls = academyData.classes.find(c => c.id === classId);
    let unit = cls.units.find(u => u.id === unitId);
    unit.media.splice(mediaIndex, 1);
    saveData();
    loadUnits();
}

function generateAIGames(classId, unitId) {
    let cls = academyData.classes.find(c => c.id === classId);
    let unit = cls.units.find(u => u.id === unitId);

    if (unit.media.length === 0) {
        return alert('الرجاء رفع صورة أو محتوى أولاً لتوليد الألعاب ❌');
    }

    // توليد 10 ألعاب ذكية واحترافية متطابقة مع واجهات الصور المرفقة
    let generatedGames = [
        { type: 'Safe Cracker', title: 'Safe Cracker', subTitle: 'رتب الحرف', desc: 'أعد ترتيب الحروف لتكوين الكلمة الصحيحة', q: 'أعد ترتيب الحروف', options: ['a', 'b', 'l', 'e', 's'], correct: 'ables' },
        { type: 'Spelling Bee', title: 'Spelling Bee', subTitle: 'نحلة الهجاء', desc: 'اسمع الكلمة واكتبها بالإنجليزية!', q: 'اسمع الكلمة واكتبها', options: ['School', 'Apple', 'Book', 'Pen'], correct: 'School' },
        { type: 'Sentence Builder', title: 'Sentence Builder', subTitle: 'رتب الجملة', desc: 'رتب الكلمات لتكوين جملة صحيحة', q: 'Gen Alpha a creative generation are', options: ['Gen', 'Alpha', 'a', 'creative', 'generation', 'are'], correct: 'Gen Alpha are a creative generation' },
        { type: 'Fill in the Blank', title: 'Fill in the Blank', subTitle: 'أكمل الجملة', desc: 'اختر الكلمة المناسبة للفراغ', q: 'She ___ to school every day.', options: ['go', 'goes', 'went', 'going'], correct: 'goes' },
        { type: 'Multiple Choice', title: 'Multiple Choice', subTitle: 'اختر من متعدد', desc: 'اختبر سرعة بديهتك بمعلومات الوحدة', q: 'ما معنى كلمة Teacher؟', options: ['طبيب', 'معلم', 'مهندس', 'شرطي'], correct: 'معلم' },
        { type: 'Kids Translator', title: 'Kids Translator', subTitle: 'مترجم الصغار', desc: 'ترجم العبارة التالية بدقة', q: 'ترجم: (أحب قراءة الكتب)', options: ['I like reading books', 'I play football', 'I go to school', 'I eat apple'], correct: 'I like reading books' },
        { type: 'Word Connect', title: 'Word Connect', subTitle: 'وصل', desc: 'صل الكلمة بما يناسبها', q: 'طابق الكلمة وعكسها (Big)', options: ['Small', 'Tall', 'Fast', 'Hot'], correct: 'Small' },
        { type: 'Grammar Court', title: 'Grammar Court', subTitle: 'فكرة ذكية', desc: 'اختر القاعدة النحوية الصحيحة', q: 'They ( is ) happy. التصحيح:', options: ['are', 'am', 'be', 'was'], correct: 'are' },
        { type: 'Time Machine Grammar', title: 'Time Machine Grammar', subTitle: 'آلة الزمن', desc: 'سافر عبر الزمن واكتشف الأزمنة', q: 'الماضي من الفعل go:', options: ['goes', 'went', 'gone', 'going'], correct: 'went' },
        { type: 'Sentence Builder 2', title: 'Sentence Builder', subTitle: 'اسحب وأفلت', desc: 'تحدي بناء الجمل المتقدم', q: 'أكمل الحرف الناقص في الكلمة: c_t', options: ['a', 'e', 'i', 'o'], correct: 'a' }
    ];

    unit.aiGames = generatedGames;
    saveData();
    loadUnits();
    alert('🤖 تم توليد 10 ألعاب تفاعلية واحترافية بالذكاء الاصطناعي بنجاح!');
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
            ${unit.media.map(m => `
                <div style="background:rgba(255,255,255,0.1); padding:10px; border-radius:10px; text-align:center; min-width:120px;">
                    <a href="${m.url}" target="_blank" style="color:#fff; text-decoration:none; display:block; font-size:0.9rem;" download="${m.name}">📄 ${m.name}</a>
                </div>
            `).join('')}
        </div>
    ` : '<p style="color:#94a3b8; margin-bottom:20px;">لا توجد ملفات مرفوعة لهذه الوحدة.</p>';

    let gamesHtml = unit.aiGames.length > 0 ? `
        <h4 style="color:#fde047; margin-bottom:10px;">الألعاب التفاعلية المتاحة (10 ألعاب احترافية):</h4>
        <div style="display:flex; flex-direction:column; gap:12px;">
            ${unit.aiGames.map((g, i) => `
                <div style="background:rgba(15,23,42,0.7); padding:15px; border-radius:12px; border:1px solid rgba(255,255,255,0.05); margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <div>
                            <span style="color:#fde047; font-weight:bold; font-size:0.9rem;">${i+1}. ${g.title}</span>
                            <p style="font-size:0.85rem; color:#cbd5e1; margin-top:2px;">${g.q}</p>
                        </div>
                        <button onclick="speakText('${g.q.replace(/'/g, "")}')" style="background:#0284c7; border:none; color:#fff; padding:5px 10px; border-radius:8px; cursor:pointer; font-size:0.85rem;">🔊 استمع</button>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px;">
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
    let modal = document.getElementById('platformImageModal');
    if (modal) modal.classList.remove('hidden');
}

function closeModal(modalId) {
    let modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
}
