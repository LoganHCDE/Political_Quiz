/* ============================================================
   PERCEPTION CHECK — Quiz Engine
   Handles navigation, scoring, and page transitions
   ============================================================ */

const QuizApp = (() => {
  // — Quiz Data —
  const quizData = {
    questions: [
      {
        id: 1,
        type: 'multiple-choice',
        question: 'What percentage of Americans believe the economy is the most important issue facing the country?',
        context: 'Based on recent Gallup polling data',
        options: [
          { label: 'A', value: '25%' },
          { label: 'B', value: '40%' },
          { label: 'C', value: '55%' },
          { label: 'D', value: '70%' }
        ],
        correctIndex: 1,
        answerHeading: 'The economy dominates public concern at <span class="highlight">40%</span>',
        answerExplanation: 'While many assume social issues or foreign policy dominate, the economy has consistently been the top concern for Americans since 2022, though the exact percentage surprises most people.',
        chartTitle: 'Most Important Problem Facing the U.S.',
        chartSubtitle: 'Share of respondents, 2020–2025',
        chartSource: 'Gallup Monthly Poll, January 2025',
        chartType: 'bars'
      },
      {
        id: 2,
        type: 'slider',
        question: 'What percentage of the federal budget goes to foreign aid?',
        context: 'Estimate the share of total U.S. federal spending',
        sliderMin: 0,
        sliderMax: 30,
        sliderStep: 1,
        sliderUnit: '%',
        correctValue: 1,
        answerHeading: 'Foreign aid is just <span class="highlight">less than 1%</span> of the federal budget',
        answerExplanation: 'Americans consistently overestimate foreign aid spending. The average guess is around 25% — yet the real figure is under 1%. Defense, Social Security, and Medicare dwarf foreign aid many times over.',
        chartTitle: 'Federal Budget Allocation Breakdown',
        chartSubtitle: 'Share of total federal spending, FY 2024',
        chartSource: 'Congressional Budget Office, FY 2024 Report',
        chartType: 'bars'
      },
      {
        id: 3,
        type: 'multiple-choice',
        question: 'Which party\'s voters are more likely to say they have "a lot" of trust in the media?',
        context: 'Think about media trust across political lines',
        options: [
          { label: 'A', value: 'Democrats' },
          { label: 'B', value: 'Republicans' },
          { label: 'C', value: 'Independents' },
          { label: 'D', value: 'Equal across parties' }
        ],
        correctIndex: 0,
        answerHeading: '<span class="highlight">Democrats</span> trust media far more than other groups',
        answerExplanation: 'The partisan media trust gap has widened dramatically. While 54% of Democrats report trusting mass media, only 11% of Republicans say the same — the largest gap ever recorded.',
        chartTitle: 'Trust in Mass Media by Party Affiliation',
        chartSubtitle: '"Great deal" or "fair amount" of trust, 2000–2025',
        chartSource: 'Gallup Media Trust Survey, September 2024',
        chartType: 'line'
      },
      {
        id: 4,
        type: 'multiple-choice',
        question: 'Since 2000, has the violent crime rate in the U.S. generally gone up, down, or stayed the same?',
        context: 'Consider the overall long-term trend',
        options: [
          { label: 'A', value: 'Gone up significantly' },
          { label: 'B', value: 'Stayed roughly the same' },
          { label: 'C', value: 'Gone down significantly' },
          { label: 'D', value: 'Fluctuated with no clear trend' }
        ],
        correctIndex: 2,
        answerHeading: 'Violent crime has <span class="highlight">dropped significantly</span> since 2000',
        answerExplanation: 'Despite widespread perception that crime is rising, the violent crime rate has fallen by nearly 50% since its peak. Most Americans believe crime is increasing — a striking gap between perception and reality.',
        chartTitle: 'U.S. Violent Crime Rate per 100,000 People',
        chartSubtitle: 'FBI Uniform Crime Report data, 2000–2024',
        chartSource: 'FBI UCR / Bureau of Justice Statistics, 2024',
        chartType: 'line'
      },
      {
        id: 5,
        type: 'multiple-choice',
        question: 'What share of immigrants in the U.S. are in the country legally?',
        context: 'Consider all immigrants, not just recent arrivals',
        options: [
          { label: 'A', value: 'About 25%' },
          { label: 'B', value: 'About 50%' },
          { label: 'C', value: 'About 75%' },
          { label: 'D', value: 'About 90%' }
        ],
        correctIndex: 2,
        answerHeading: 'Roughly <span class="highlight">~77%</span> of immigrants are here legally',
        answerExplanation: 'Public debate often focuses on unauthorized immigration, but the vast majority of the 46+ million immigrants in the U.S. hold legal status — as naturalized citizens, permanent residents, or visa holders.',
        chartTitle: 'U.S. Immigrant Population by Legal Status',
        chartSubtitle: 'Estimated shares of total foreign-born population',
        chartSource: 'Migration Policy Institute / Census Bureau ACS, 2023',
        chartType: 'donut'
      }
    ]
  };

  // — State —
  let currentPage = 'dashboard';
  let currentQuestion = 0;
  let selectedAnswers = {};
  let score = 0;

  // — DOM References —
  const pages = {};

  // — Initialize —
  function init() {
    document.querySelectorAll('.page').forEach(page => {
      pages[page.id] = page;
    });
    
    bindEvents();
    showPage('dashboard');
  }

  // — Event Binding —
  function bindEvents() {
    // Start button
    document.getElementById('btn-start').addEventListener('click', () => {
      currentQuestion = 0;
      score = 0;
      selectedAnswers = {};
      showPage('q1');
    });

    // Option buttons (delegated)
    document.addEventListener('click', (e) => {
      const optionBtn = e.target.closest('.option-btn');
      if (optionBtn) {
        handleOptionSelect(optionBtn);
      }
    });

    // Submit buttons (only on question pages, not answer pages)
    document.querySelectorAll('.btn-submit:not(.btn-next)').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('enabled')) {
          const qPage = btn.closest('.page');
          const qNum = parseInt(qPage.id.replace('q', ''));
          submitAnswer(qNum);
        }
      });
    });

    // Next question buttons
    document.querySelectorAll('.btn-next').forEach(btn => {
      btn.addEventListener('click', () => {
        const aPage = btn.closest('.page');
        const qNum = parseInt(aPage.id.replace('q', '').replace('a', ''));
        if (qNum < 5) {
          showPage('q' + (qNum + 1));
        } else {
          buildDashboard();
          showPage('score');
        }
      });
    });

    // Restart button
    document.getElementById('btn-restart')?.addEventListener('click', () => {
      currentQuestion = 0;
      score = 0;
      selectedAnswers = {};
      // Reset all option selections
      document.querySelectorAll('.option-btn.selected').forEach(btn => {
        btn.classList.remove('selected');
      });
      document.querySelectorAll('.btn-submit').forEach(btn => {
        btn.classList.remove('enabled');
      });
      // Reset sliders
      document.querySelectorAll('.slider-input').forEach(slider => {
        slider.value = slider.min;
        const display = slider.closest('.slider-container')?.querySelector('.slider-value-display');
        if (display) display.textContent = slider.min + '%';
      });
      showPage('dashboard');
    });

    // Slider inputs
    document.querySelectorAll('.slider-input').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const display = e.target.closest('.slider-container').querySelector('.slider-value-display');
        display.textContent = e.target.value + '%';
        
        // Enable submit
        const page = e.target.closest('.page');
        const submitBtn = page.querySelector('.btn-submit');
        submitBtn.classList.add('enabled');
        
        // Store selection
        const qNum = parseInt(page.id.replace('q', ''));
        selectedAnswers[qNum] = parseInt(e.target.value);
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      const activePage = document.querySelector('.page.active');
      if (!activePage) return;

      // Enter key to submit/next
      if (e.key === 'Enter') {
        const enabledBtn = activePage.querySelector('.btn-submit.enabled');
        if (enabledBtn) enabledBtn.click();
        
        // Also handle start button
        if (activePage.id === 'dashboard') {
          document.getElementById('btn-start').click();
        }
        return;
      }

      // A-D or 1-4 to select options
      const keyMap = { 'a': 0, 'b': 1, 'c': 2, 'd': 3, '1': 0, '2': 1, '3': 2, '4': 3 };
      const idx = keyMap[e.key.toLowerCase()];
      if (idx !== undefined) {
        const options = activePage.querySelectorAll('.option-btn');
        if (options[idx]) {
          options[idx].click();
        }
      }
    });
  }

  // — Handle Option Selection —
  function handleOptionSelect(btn) {
    const page = btn.closest('.page');
    const options = page.querySelectorAll('.option-btn');
    
    // Deselect all
    options.forEach(opt => opt.classList.remove('selected'));
    
    // Select clicked
    btn.classList.add('selected');
    
    // Enable submit
    const submitBtn = page.querySelector('.btn-submit');
    if (submitBtn) submitBtn.classList.add('enabled');
    
    // Store answer
    const qNum = parseInt(page.id.replace('q', ''));
    const optionIndex = Array.from(options).indexOf(btn);
    selectedAnswers[qNum] = optionIndex;
  }

  // — Submit Answer —
  function submitAnswer(qNum) {
    const question = quizData.questions[qNum - 1];
    const userAnswer = selectedAnswers[qNum];
    let isCorrect = false;

    if (question.type === 'slider') {
      // For slider: correct if within 2 of the correct value
      isCorrect = Math.abs(userAnswer - question.correctValue) <= 2;
    } else {
      isCorrect = userAnswer === question.correctIndex;
    }

    // Update answer page
    updateAnswerPage(qNum, question, userAnswer, isCorrect);
    
    if (isCorrect) score++;
    
    showPage('q' + qNum + 'a');
  }

  // — Update Answer Page —
  function updateAnswerPage(qNum, question, userAnswer, isCorrect) {
    const answerPage = document.getElementById('q' + qNum + 'a');
    if (!answerPage) return;
    
    // Update badge
    const badge = answerPage.querySelector('.answer-result-badge');
    badge.className = 'answer-result-badge ' + (isCorrect ? 'correct' : 'incorrect');
    badge.querySelector('.badge-text').textContent = isCorrect ? 'Correct' : 'Not quite';
    badge.querySelector('.badge-icon').textContent = isCorrect ? '✓' : '→';

    // Update comparison cards
    const yourCard = answerPage.querySelector('.comparison-card.your-answer');
    const correctCard = answerPage.querySelector('.comparison-card.correct-answer');
    
    if (yourCard) {
      let yourText = '';
      if (question.type === 'slider') {
        yourText = userAnswer + question.sliderUnit;
      } else {
        yourText = question.options[userAnswer]?.value || '—';
      }
      yourCard.querySelector('.comparison-value').textContent = yourText;
      yourCard.className = 'comparison-card ' + (isCorrect ? 'was-correct' : 'your-answer');
    }

    if (correctCard) {
      let correctText = '';
      if (question.type === 'slider') {
        correctText = question.correctValue + question.sliderUnit;
      } else {
        correctText = question.options[question.correctIndex].value;
      }
      correctCard.querySelector('.comparison-value').textContent = correctText;
    }
  }

  // — Build Dashboard —
  function buildDashboard() {
    // Update each dashboard card tag with user's answer context
    quizData.questions.forEach((question, i) => {
      const tagEl = document.getElementById('dash-tag-' + (i + 1));
      if (!tagEl) return;

      const userAnswer = selectedAnswers[i + 1];
      let isCorrect = false;

      if (question.type === 'slider') {
        isCorrect = Math.abs(userAnswer - question.correctValue) <= 2;
      } else {
        isCorrect = userAnswer === question.correctIndex;
      }

      if (isCorrect) {
        tagEl.textContent = 'You got this one ✓';
        tagEl.className = 'dash-card-tag tag-correct';
      } else {
        tagEl.textContent = 'Surprised? Most people are';
        tagEl.className = 'dash-card-tag tag-surprised';
      }
    });
  }

  // — Page Navigation —
  function showPage(pageId) {
    // Hide all pages
    Object.values(pages).forEach(page => {
      page.classList.remove('active');
    });

    // Show target page
    const target = pages[pageId];
    if (target) {
      target.classList.add('active');
      currentPage = pageId;
      updateProgress(pageId);
      window.scrollTo(0, 0);

      // Re-trigger animations by removing and re-adding the active class
      target.style.animation = 'none';
      requestAnimationFrame(() => {
        target.style.animation = '';
      });
    }
  }

  // — Update Progress Bar & Dots —
  function updateProgress(pageId) {
    const progressFill = document.querySelectorAll('.progress-fill');
    const progressLabel = document.querySelectorAll('.progress-label');
    
    let progress = 0;
    let label = '';
    let activeQ = 0; // 0-based question index

    if (pageId === 'dashboard') { progress = 0; label = ''; activeQ = -1; }
    else if (pageId === 'q1') { progress = 0; label = 'Q1 / 5'; activeQ = 0; }
    else if (pageId === 'q1a') { progress = 10; label = 'Q1 / 5'; activeQ = 0; }
    else if (pageId === 'q2') { progress = 20; label = 'Q2 / 5'; activeQ = 1; }
    else if (pageId === 'q2a') { progress = 30; label = 'Q2 / 5'; activeQ = 1; }
    else if (pageId === 'q3') { progress = 40; label = 'Q3 / 5'; activeQ = 2; }
    else if (pageId === 'q3a') { progress = 50; label = 'Q3 / 5'; activeQ = 2; }
    else if (pageId === 'q4') { progress = 60; label = 'Q4 / 5'; activeQ = 3; }
    else if (pageId === 'q4a') { progress = 70; label = 'Q4 / 5'; activeQ = 3; }
    else if (pageId === 'q5') { progress = 80; label = 'Q5 / 5'; activeQ = 4; }
    else if (pageId === 'q5a') { progress = 90; label = 'Q5 / 5'; activeQ = 4; }
    else if (pageId === 'score') { progress = 100; label = 'Complete'; activeQ = 5; }

    progressFill.forEach(fill => {
      fill.style.width = progress + '%';
    });
    progressLabel.forEach(lbl => {
      lbl.textContent = label;
    });

    // Update progress dots on the active page
    const activePage = pages[pageId];
    if (activePage) {
      const dots = activePage.querySelectorAll('.progress-dot');
      dots.forEach((dot, i) => {
        dot.classList.remove('active', 'completed', 'incorrect-dot');
        if (i < activeQ) {
          // Check if this question was answered correctly
          const question = quizData.questions[i];
          const userAnswer = selectedAnswers[i + 1];
          if (userAnswer !== undefined) {
            let correct = false;
            if (question.type === 'slider') {
              correct = Math.abs(userAnswer - question.correctValue) <= 2;
            } else {
              correct = userAnswer === question.correctIndex;
            }
            dot.classList.add(correct ? 'completed' : 'incorrect-dot');
          } else {
            dot.classList.add('completed');
          }
        } else if (i === activeQ) {
          dot.classList.add('active');
        }
      });
    }
  }

  // — Expose Init —
  return { init };
})();

// Launch
document.addEventListener('DOMContentLoaded', QuizApp.init);
