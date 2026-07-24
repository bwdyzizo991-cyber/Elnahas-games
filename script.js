<!-- قسم محتوى الألعاب بدون عرض الصور بالأعلى -->
<div class="unit-games-container">
  <div class="header-section">
    <h3>محتوى وألعاب: Unit 1, the Nile</h3>
  </div>

  <div class="games-section-title">
    <h4>الألعاب التفاعلية المتاحة (10 ألعاب احترافية):</h4>
  </div>

  <!-- شبكة الـ 10 ألعاب (كل لعبة باسمها وصورتها في الأعلى) -->
  <div class="games-grid">
    
    <!-- اللعبة الأولى: Safe Cracker -->
    <div class="game-card" onclick="openGame('SafeCracker', 10)">
      <div class="game-icon-container">
        <img src="safe-cracker-icon.png" alt="Safe Cracker" class="game-img">
      </div>
      <div class="game-info">
        <h4 class="game-title">Safe Cracker .1</h4>
        <p class="game-desc">أعد ترتيب الحروف لتكوين الكلمة الصحيحة (10 أسئلة)</p>
      </div>
    </div>

    <!-- اللعبة الثانية: Spelling Bee -->
    <div class="game-card" onclick="openGame('SpellingBee', 10)">
      <div class="game-icon-container">
        <img src="spelling-bee-icon.png" alt="Spelling Bee" class="game-img">
      </div>
      <div class="game-info">
        <h4 class="game-title">Spelling Bee .2</h4>
        <p class="game-desc">اسمع الكلمة واكتبها بالإنجليزية (10 أسئلة)</p>
      </div>
    </div>

    <!-- اللعبة الثالثة: Sentence Builder -->
    <div class="game-card" onclick="openGame('SentenceBuilder', 10)">
      <div class="game-icon-container">
        <img src="sentence-builder-icon.png" alt="Sentence Builder" class="game-img">
      </div>
      <div class="game-info">
        <h4 class="game-title">Sentence Builder .3</h4>
        <p class="game-desc">رتب الكلمات لتكوين جملة صحيحة (10 أسئلة)</p>
      </div>
    </div>

    <!-- تكرار النمط لبقية الـ 10 ألعاب بنفس الهيكلية (Fill in the Blank, Multiple Choice, etc.) -->

  </div>
</div>

<!-- هيكل تشغيل الأسئلة بشكل ديناميكي ومتتالي (سؤال بسؤال) عند الدخول للعبة -->
<div id="game-play-screen" class="hidden">
  <div class="game-top-bar">
    <span id="question-counter">1/10</span>
    <span id="score-counter">0/1 ⭐</span>
    <button class="exit-btn" onclick="exitGame()">خروج ✕</button>
  </div>
  
  <div class="question-dynamic-container">
    <!-- محتوى السؤال الديناميكي يظهر هنا سؤالاً تلو الآخر -->
    <div id="question-box" class="question-card">
      <!-- يتم حقن السؤال الحالي وأزرار التفاعل ديناميكياً عبر الجافاسكريبت -->
    </div>
  </div>
</div>
