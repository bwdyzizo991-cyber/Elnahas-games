// بيانات الألعاب التفاعلية والأسئلة
const gamesData = {
    'safe-cracker': {
        title: 'Safe Cracker (رتب الحروف)',
        letters: ['a', 'b', 'l', 'e', 's'],
        hint: 'توازن 💡',
        correct: 'ables'
    },
    'spelling-bee': {
        title: 'Spelling Bee (نحلة الهجاء)',
        word: 'balance',
        hint: 'اسمع الكلمة واكتبها (5 حروف)'
    },
    'sentence-builder': {
        title: 'Sentence Builder (بناء الجمل)',
        words: ['Gen', 'Alpha', 'a', 'creative', 'generation', 'are'],
        translation: 'جيل ألفا جيل إبداعي'
    },
    'fill-blank': {
        title: 'Fill in the Blank (أكمل الفراغ)',
        sentence: 'Gen Alpha like creating short _____ to show their hobbies.',
        options: ['videos', 'sentences', 'photos', 'memes'],
        correct: 'videos',
        hint: 'يحبون إنشاء فيديوهات قصيرة 💡'
    },
    'time-machine': {
        title: 'Time Machine (آلة الزمن - القواعد)',
        sentence: 'She ___ to school every day.',
        options: ['went', 'go', 'going', 'goes'],
        correct: 'goes',
        hint: 'مع she نضيف s 💡'
    }
};

function openGameModal(gameId) {
    const modal = document.getElementById('gameModal');
    const gameBody = document.getElementById('gameBody');
    const game = gamesData[gameId];

    if (!game) return;

    modal.classList.remove('hidden');
    
    // بناء واجهة اللعبة ديناميكياً داخل النافذة بناءً على نوع اللعبة
    if (gameId === 'fill-blank' || gameId === 'time-machine') {
        gameBody.innerHTML = `
            <div class="interactive-box">
                <h4 style="margin-bottom: 10px; color: #475569;">${game.title}</h4>
                <p style="font-size: 1.1rem; font-weight: bold; margin-bottom: 15px;">${game.sentence}</p>
                <p style="font-size: 0.85rem; color: #0284c7; margin-bottom: 15px;">${game.hint}</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    ${game.options.map(opt => `<button onclick="checkAnswer('${opt}', '${game.correct}')" style="padding: 12px; border: none; background: #f1f5f9; border-radius: 10px; font-weight: bold; cursor: pointer;">${opt}</button>`).join('')}
                </div>
            </div>
        `;
    } else {
        gameBody.innerHTML = `
            <div class="interactive-box">
                <h4>${game.title}</h4>
                <p style="margin: 20px 0;">جاهز لبدء اللعبة وتجميع النجوم؟</p>
                <button onclick="triggerWin()" style="background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: bold; cursor: pointer;">ابدأ اللعب الآن 🎮</button>
            </div>
        `;
    }
}

function closeGameModal() {
    document.getElementById('gameModal').classList.add('hidden');
}

function checkAnswer(selected, correct) {
    if (selected === correct) {
        alert('إجابة صحيحة! أحسنت 🎉');
        updateGlobalScore();
        closeGameModal();
    } else {
        alert('إجابة خاطئة، حاول مرة أخرى! ❌');
    }
}

function triggerWin() {
    alert('رائع! لقد أكملت اللعبة بنجاح ⭐');
    updateGlobalScore();
    closeGameModal();
}

function updateGlobalScore() {
    const counter = document.querySelector('.star-counter');
    let currentScore = parseInt(counter.textContent) || 0;
    counter.textContent = currentScore + 10;
}

function goHome() {
    alert('تم العودة لوحدة الألعاب الرئيسية.');
}
