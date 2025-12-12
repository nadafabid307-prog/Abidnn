// Smart Quiz System - client-side core
// Saves progress to localStorage, awards simple badges, supports keyboard shortcuts (1-4).

(() => {
  const qs = (s) => document.querySelector(s);
  const qsa = (s) => Array.from(document.querySelectorAll(s));

  // Elements
  const welcomeEl = qs('#welcome');
  const quizEl = qs('#quiz');
  const resultEl = qs('#result');
  const progressEl = qs('#progress');

  const playerNameInput = qs('#playerName');
  const categorySelect = qs('#categorySelect');
  const countSelect = qs('#countSelect');
  const startBtn = qs('#startBtn');
  const viewProgressBtn = qs('#viewProgressBtn');

  const playerLabel = qs('#playerLabel');
  const questionText = qs('#questionText');
  const answersList = qs('#answers');
  const questionCounter = qs('#questionCounter');
  const progressFill = qs('#progressFill');
  const timerEl = qs('#timer');
  const nextBtn = qs('#nextBtn');
  const skipBtn = qs('#skipBtn');

  const resultScore = qs('#resultScore');
  const badgesEl = qs('#badges');
  const retryBtn = qs('#retryBtn');
  const homeBtn = qs('#homeBtn');
  const reviewBtn = qs('#reviewBtn');
  const reviewPanel = qs('#reviewPanel');
  const reviewList = qs('#reviewList');

  const viewHistoryBtn = qs('#viewProgressBtn');
  const historyList = qs('#historyList');
  const clearHistoryBtn = qs('#clearHistoryBtn');
  const closeProgressBtn = qs('#closeProgressBtn');

  // State
  let questions = [];
  let currentIndex = 0;
  let score = 0;
  let streak = 0;
  let selected = null;
  let timer = null;
  const TIME_PER_Q = 20; // seconds
  let timeLeft = TIME_PER_Q;
  const STORAGE_KEY = 'smartquiz_history_v1';

  // Sample question bank
  const QUESTION_BANK = [
    // Math
    { id: 1, category: 'math', q: 'What is 7 × 8?', choices: ['54', '56', '48', '64'], a: 1, explanation: '7 times 8 is 56.' },
    { id: 2, category: 'math', q: 'What is the derivative of x²?', choices: ['x', '2x', 'x²', '2'], a: 1, explanation: 'd/dx x² = 2x.' },

    // Science
    { id: 3, category: 'science', q: 'What gas do plants primarily absorb?', choices: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], a: 2, explanation: 'Plants absorb CO₂ for photosynthesis.' },
    { id: 4, category: 'science', q: 'Water freezes at what temperature (°C)?', choices: ['0', '32', '-1', '100'], a: 0, explanation: 'Water freezes at 0°C.' },

    // History
    { id: 5, category: 'history', q: 'Who discovered America (commonly credited)?', choices: ['Christopher Columbus', 'Vasco da Gama', 'Marco Polo', 'Leif Erikson'], a: 0, explanation: 'Christopher Columbus is commonly credited in many curricula.' },
    { id: 6, category: 'history', q: 'The Renaissance began in which country?', choices: ['France', 'Italy', 'England', 'Germany'], a: 1, explanation: 'The Renaissance began in Italy.' },

    // Mixed extras
    { id: 7, category: 'math', q: 'What is the next prime after 7?', choices: ['9', '11', '13', '17'], a: 1, explanation: '11 is the next prime after 7.' },
    { id: 8, category: 'science', q: 'What is H₂O commonly called?', choices: ['Salt', 'Oxygen', 'Water', 'Hydrogen'], a: 2, explanation: 'H₂O is water.' },
    { id: 9, category: 'history', q: 'The Great Wall is primarily located in which country?', choices: ['India', 'China', 'Japan', 'Korea'], a: 1, explanation: 'The Great Wall is in China.' },
    { id: 10, category: 'science', q: 'Which planet is known as the Red Planet?', choices: ['Earth', 'Jupiter', 'Mars', 'Venus'], a: 2, explanation: 'Mars is the Red Planet.' },
  ];

  // Utility
  function shuffle(arr) {
    return arr.slice().sort(() => Math.random() - 0.5);
  }

  function formatTime(sec) {
    const s = String(sec % 60).padStart(2, '0');
    return `00:${s}`;
  }

  // Persist history
  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  function saveHistory(entry) {
    const history = loadHistory();
    history.unshift(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
  }
  function clearHistory() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // UI helpers
  function show(el) { el.classList.remove('hidden'); }
  function hide(el) { el.classList.add('hidden'); }

  // Render functions
  function renderQuestion() {
    const q = questions[currentIndex];
    if (!q) return;
    questionText.textContent = q.q;
    answersList.innerHTML = '';
    q.choices.forEach((choice, idx) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'button');
      li.tabIndex = 0;
      li.dataset.index = idx;
      li.innerHTML = `<span class="choice-key">${['A','B','C','D'][idx]}</span><div>${choice}</div>`;
      li.addEventListener('click', () => selectAnswer(idx));
      li.addEventListener('keydown', (e) => { if (e.key === 'Enter') selectAnswer(idx); });
      answersList.appendChild(li);
    });

    questionCounter.textContent = `Question ${currentIndex + 1}/${questions.length}`;
    progressFill.style.width = `${Math.round((currentIndex / questions.length) * 100)}%`;
    selected = null;
    nextBtn.disabled = true;
    nextBtn.classList.add('disabled');
    startTimer();
  }

  function renderResult() {
    resultScore.textContent = `${playerNameInput.value || 'Player'}, you scored ${score}/${questions.length}`;
    badgesEl.innerHTML = '';
    const awarded = computeBadges();
    if (awarded.length === 0) {
      const p = document.createElement('div');
      p.className = 'badge';
      p.textContent = 'Keep going — try again to earn badges!';
      badgesEl.appendChild(p);
    } else {
      awarded.forEach(b => {
        const d = document.createElement('div');
        d.className = 'badge good';
        d.textContent = `${b}`;
        badgesEl.appendChild(d);
      });
    }

    // populate review
    reviewList.innerHTML = '';
    questions.forEach((q, i) => {
      const item = document.createElement('li');
      const ansIdx = q.userAnswer;
      const correct = q.a === ansIdx;
      item.innerHTML = `<strong>Q${i+1}:</strong> ${q.q} <br>
        <em>Your answer:</em> ${ansIdx != null ? q.choices[ansIdx] : '<i>Skipped</i>'} <br>
        <em>Correct:</em> ${q.choices[q.a]} <br>
        <small class="muted">${q.explanation || ''}</small>`;
      item.style.margin = '8px 0';
      reviewList.appendChild(item);
    });
  }

  // Timer
  function startTimer() {
    stopTimer();
    timeLeft = TIME_PER_Q;
    timerEl.textContent = formatTime(timeLeft);
    timer = setInterval(() => {
      timeLeft -= 1;
      timerEl.textContent = formatTime(timeLeft);
      if (timeLeft <= 0) {
        stopTimer();
        handleTimeout();
      }
    }, 1000);
  }
  function stopTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  // Answer handling
  function selectAnswer(idx) {
    if (selected !== null) return; // already answered
    stopTimer();
    selected = idx;
    const q = questions[currentIndex];
    q.userAnswer = idx;

    const correctIdx = q.a;
    qsa('#answers li').forEach(li => {
      const i = Number(li.dataset.index);
      if (i === correctIdx) li.classList.add('correct');
      if (i === idx && i !== correctIdx) li.classList.add('wrong');
      li.setAttribute('aria-disabled', 'true');
    });

    if (idx === correctIdx) {
      score += 1;
      streak += 1;
    } else {
      streak = 0;
    }

    // Award small quick bonus (if answered early)
    if (timeLeft >= Math.floor(TIME_PER_Q * 0.6)) {
      q.quickBonus = true;
    }

    nextBtn.disabled = false;
    nextBtn.classList.remove('disabled');
  }

  function handleTimeout() {
    const q = questions[currentIndex];
    q.userAnswer = null;
    streak = 0;
    qsa('#answers li').forEach(li => {
      const i = Number(li.dataset.index);
      if (i === q.a) li.classList.add('correct');
      li.setAttribute('aria-disabled', 'true');
    });
    nextBtn.disabled = false;
    nextBtn.classList.remove('disabled');
  }

  function nextQuestion() {
    currentIndex += 1;
    if (currentIndex >= questions.length) {
      endQuiz();
      return;
    }
    renderQuestion();
  }

  function skipQuestion() {
    stopTimer();
    const q = questions[currentIndex];
    q.userAnswer = null;
    streak = 0;
    qsa('#answers li').forEach(li => {
      const i = Number(li.dataset.index);
      if (i === q.a) li.classList.add('correct');
      li.setAttribute('aria-disabled', 'true');
    });
    nextBtn.disabled = false;
    nextBtn.classList.remove('disabled');
  }

  function endQuiz() {
    stopTimer();
    progressFill.style.width = `100%`;
    hide(quizEl);
    show(resultEl);

    // Save entry
    const entry = {
      player: playerNameInput.value || 'Player',
      date: new Date().toISOString(),
      score,
      total: questions.length,
      badges: computeBadges(),
    };
    saveHistory(entry);

    renderResult();
  }

  function computeBadges() {
    const badges = [];
    if (score === questions.length) badges.push('Perfect Score');
    if (questions.some(q => q.quickBonus)) badges.push('Quick Thinker');
    if (streak >= 3) badges.push('Streak Master');
    if (score >= Math.ceil(questions.length * 0.8)) badges.push('High Achiever');
    return badges;
  }

  // Setup & start
  function startQuiz() {
    const name = playerNameInput.value.trim();
    playerLabel.textContent = name ? `${name}` : 'Player';
    const category = categorySelect.value;
    const count = Number(countSelect.value);

    // choose and shuffle questions
    let pool = QUESTION_BANK.slice();
    if (category !== 'all') pool = pool.filter(q => q.category === category);
    pool = shuffle(pool).slice(0, count);
    questions = pool.map(q => ({ ...q })); // deepish copy
    currentIndex = 0;
    score = 0;
    streak = 0;
    selected = null;

    hide(welcomeEl);
    hide(resultEl);
    hide(progressEl);
    show(quizEl);
    renderQuestion();
  }

  // History view
  function openHistory() {
    const items = loadHistory();
    historyList.innerHTML = '';
    if (items.length === 0) {
      historyList.textContent = 'No history yet — take a quiz to save progress.';
    } else {
      items.forEach(it => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `<div><strong>${it.player}</strong> — ${new Date(it.date).toLocaleString()}<br>
          <small class="muted">${it.score}/${it.total}</small></div>
          <div class="muted">${it.badges && it.badges.length ? it.badges.join(', ') : ''}</div>`;
        historyList.appendChild(div);
      });
    }
    hide(welcomeEl);
    show(progressEl);
  }

  // Event bindings
  startBtn.addEventListener('click', startQuiz);
  viewProgressBtn.addEventListener('click', openHistory);

  nextBtn.addEventListener('click', () => {
    if (currentIndex >= questions.length - 1) {
      endQuiz();
    } else {
      nextQuestion();
    }
  });

  skipBtn.addEventListener('click', skipQuestion);

  retryBtn.addEventListener('click', () => {
    show(welcomeEl);
    hide(resultEl);
  });

  homeBtn.addEventListener('click', () => {
    show(welcomeEl);
    hide(resultEl);
  });

  reviewBtn.addEventListener('click', () => {
    reviewPanel.open = !reviewPanel.open;
  });

  closeProgressBtn.addEventListener('click', () => {
    show(welcomeEl);
    hide(progressEl);
  });

  clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Clear stored progress history?')) {
      clearHistory();
      openHistory();
    }
  });

  // Keyboard shortcuts (1-4 for choices, N for next)
  window.addEventListener('keydown', (e) => {
    if (quizEl.classList.contains('hidden')) return;
    if (['1','2','3','4'].includes(e.key)) {
      const idx = Number(e.key) - 1;
      const li = qs(`#answers li[data-index="${idx}"]`);
      if (li && !li.getAttribute('aria-disabled')) selectAnswer(idx);
    } else if (e.key.toLowerCase() === 'n') {
      if (!nextBtn.disabled) nextBtn.click();
    } else if (e.key === 'Escape') {
      // stop timer and return to home
      stopTimer();
      show(welcomeEl);
      hide(quizEl);
    }
  });

  // Initialize UI state
  (function init() {
    // show welcome (default)
    show(welcomeEl);
    hide(quizEl);
    hide(resultEl);
    hide(progressEl);

    // Accessibility: label default name placeholder
    playerNameInput.placeholder = 'Type your name (optional)';

    // Prefill name if known from last history
    const last = loadHistory()[0];
    if (last && last.player) playerNameInput.value = last.player;

    // Show history on load if the user chooses
    viewHistoryBtn.title = 'View past quizzes';
  })();

})();
