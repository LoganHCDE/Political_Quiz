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
        type: 'rank',
        question: 'Rank these generations from most to least liberal among male respondents in the GSS',
        context: 'Liberal = slightly liberal + liberal + extremely liberal; generations grouped by birth year',
        correctOrder: ['Millennial', 'Gen Z', 'Boomers', 'Gen X'],
        answerHeading: '<span class="highlight">Millennial men</span> rank highest — but Gen Z breaks the trend',
        answerExplanation: 'Among male GSS respondents, liberal identification rates are: Millennials 33.1%, Gen Z 26.8%, Boomers 25.0%, Gen X 23.4%. Notably, Gen Z men are more conservative than Millennial men — reversing the usual generational drift.',
        percentages: { 'Millennial': '33.1%', 'Gen Z': '26.8%', 'Boomers': '25.0%', 'Gen X': '23.4%' },
        chartTitle: 'Male Liberal Identification by Generation',
        chartSubtitle: 'Share identifying as slightly liberal, liberal, or extremely liberal',
        chartSource: 'General Social Survey (GSS), cleaned ideology data grouped by birth cohort',
        chartType: 'bars'
      },
      {
        id: 2,
        type: 'multiple-choice',
        question: 'The year is 1980 — Reagan (Republican) vs. Carter (Democrat). Which candidate\'s voters were more likely to be college educated?',
        context: 'Think about the college education divide in American politics',
        options: [
          { label: 'A', value: 'Jimmy Carter (D)' },
          { label: 'B', value: 'Ronald Reagan (R)' }
        ],
        correctIndex: 1,
        answerHeading: '<span class="highlight">Reagan voters</span> were more college educated — politics has flipped',
        answerExplanation: 'In 1980, college-educated Americans leaned Republican. Reagan won a larger share of voters with bachelor\'s degrees and post-graduate education. Today, that alignment has completely reversed — college graduates now strongly favor Democrats.',
        chartTitle: '1980 Election: Education Profile by Candidate',
        chartSubtitle: 'Share of each candidate\'s voters by highest education level',
        chartSource: 'General Social Survey (GSS), 1980 Presidential Election Survey',
        chartType: 'education1980'
      },
      {
        id: 3,
        type: 'multiple-choice',
        question: 'Among Democrats, Republicans, and Independents, who supports more funding for space exploration?',
        context: 'Based on GSS survey data — who says we spend "too little" on space exploration?',
        options: [
          { label: 'A', value: 'Democrats' },
          { label: 'B', value: 'Republicans' },
          { label: 'C', value: 'Independents' },
          { label: 'D', value: 'All equal' }
        ],
        correctIndex: 1,
        answerHeading: '<span class="highlight">Republicans</span> want more space funding — although recent data suggests Independents may be catching up',
        answerExplanation: 'Surprising but true: Republicans consistently say we spend "too little" on space exploration at higher rates than Democrats or Independents. The gap has widened notably since the 2010s — defying the assumption that science funding is a Democratic priority.',
        chartTitle: 'Support for More Space Exploration Funding Over Time',
        chartSubtitle: '% saying "too little" on space exploration spending, by party group',
        chartSource: 'General Social Survey (GSS), 1973–2024',
        chartType: 'spaceLine'
      },
      {
        id: 4,
        type: 'rank',
        question: 'Rank these college majors from most to least conservative among College Graduates',
        context: 'Conservative = slightly conservative + conservative + extremely conservative · #1 = most conservative, #4 = least',
        correctOrder: ['Marketing', 'Medicine', 'Computer Science', 'History'],
        answerHeading: '<span class="highlight">Marketing</span> majors are most conservative — History least',
        answerExplanation: 'Among GSS respondents, conservative identification rates: Marketing 57.9%, Medicine 56.7%, Computer Science 48.1%, History 41.2%. Business-oriented fields skew conservative while humanities lean liberal.',
        percentages: { 'Marketing': '57.9%', 'Medicine': '56.7%', 'Computer Science': '48.1%', 'History': '41.2%' },
        chartTitle: 'Conservative vs. Liberal Share by Major',
        chartSubtitle: 'Share of GSS respondents identifying as conservative or liberal by major',
        chartSource: 'General Social Survey (GSS), political affiliation by major',
        chartType: 'majorPies'
      },
      {
        id: 5,
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
      }
    ]
  };

  // — State —
  let currentPage = 'dashboard';
  let currentQuestion = 0;
  let selectedAnswers = {};
  let score = 0;

  // Rank Q1 drag state
  let dragSource = null;

  // — DOM References —
  const pages = {};

  function getRankOrder(qNum) {
    const listId = qNum === 4 ? 'rank-list-q4' : 'rank-list-q1';
    const list = document.getElementById(listId);
    if (!list) return null;
    return [...list.querySelectorAll('.rank-list-item')].map(el => el.dataset.gen);
  }

  function canSubmitRankQuestion(qNum) {
    const order = getRankOrder(qNum);
    return Array.isArray(order) && order.length === 4;
  }

  function ensureRankSubmitEnabled(qNum) {
    const submitId = qNum === 4 ? 'q4-submit' : 'q1-submit';
    const submitBtn = document.getElementById(submitId);
    if (!submitBtn) return;
    if (canSubmitRankQuestion(qNum)) {
      submitBtn.classList.add('enabled');
    }
  }

  function syncActiveRankSubmitButton() {
    if (currentPage === 'q1') ensureRankSubmitEnabled(1);
    if (currentPage === 'q4') ensureRankSubmitEnabled(4);
  }

  // — Initialize —
  function init() {
    document.querySelectorAll('.page').forEach(page => {
      pages[page.id] = page;
    });

    // Inject "Go to Dashboard" button into every question/answer page topbar
    document.querySelectorAll('.page:not(#dashboard) .topbar').forEach(topbar => {
      const btn = document.createElement('button');
      btn.className = 'btn-go-dashboard';
      btn.innerHTML = 'Dashboard <span class="btn-gd-arrow">⇥</span>';
      btn.addEventListener('click', () => {
        buildDashboard();
        showPage('score');
      });
      topbar.appendChild(btn);
    });

    bindEvents();
    initQ1ChartToggles();
    initQ2ChartToggles();
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
      ensureRankSubmitEnabled(1);
    });

    // Option buttons (delegated)
    document.addEventListener('click', (e) => {
      const optionBtn = e.target.closest('.option-btn');
      if (optionBtn) {
        handleOptionSelect(optionBtn);
      }
    });

    // Submit buttons (only on question pages, not answer pages, not Q1/Q4 which have their own handler)
    document.querySelectorAll('.btn-submit:not(.btn-next):not(#q1-submit):not(#q4-submit)').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('enabled')) {
          const qPage = btn.closest('.page');
          const qNum = parseInt(qPage.id.replace('q', ''));
          submitAnswer(qNum);
        }
      });
    });

    // Init drag-and-rank for Q1
    initRankQ1();

    // Init drag-and-rank for Q4
    initRankQ4();

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

    // Q1 rank submit
    document.getElementById('q1-submit')?.addEventListener('click', () => {
      ensureRankSubmitEnabled(1);
      if (canSubmitRankQuestion(1)) {
        submitAnswer(1);
      }
    });

    // Q4 rank submit
    document.getElementById('q4-submit')?.addEventListener('click', () => {
      ensureRankSubmitEnabled(4);
      if (canSubmitRankQuestion(4)) {
        submitAnswer(4);
      }
    });

    // Keep rank submit buttons resilient after tab idle/background cycles.
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) syncActiveRankSubmitButton();
    });
    window.addEventListener('focus', syncActiveRankSubmitButton);
    setInterval(syncActiveRankSubmitButton, 2000);

    // Restart button
    document.getElementById('btn-restart')?.addEventListener('click', () => {
      currentQuestion = 0;
      score = 0;
      selectedAnswers = {};
      q1ActiveView = 'liberal';
      q2ActiveView = 'share';
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
      // Re-init Q1 and Q4 rank interfaces
      initRankQ1();
      initRankQ4();
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

      // A-D or 1-4 to select options (skip Q1 and Q4 which are drag-and-rank)
      if (activePage.id === 'q1' || activePage.id === 'q4') return;
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

  // — Drag-and-Rank Q4 (vertical sortable list, mirrors Q1) —
  function initRankQ4() {
    const list = document.getElementById('rank-list-q4');
    if (!list) return;

    // Reset visual state — restore original DOM order
    const originalOrder = ['Medicine', 'History', 'Marketing', 'Computer Science'];
    originalOrder.forEach(major => {
      const item = list.querySelector(`.rank-list-item[data-gen="${major}"]`);
      if (item) list.appendChild(item);
    });

    // Clear leftover states
    list.querySelectorAll('.rank-list-item').forEach(item => {
      item.classList.remove('selected', 'dragging', 'drop-target');
    });

    // Reset submit button
    const submitBtn = document.getElementById('q4-submit');
    if (submitBtn) submitBtn.classList.remove('enabled');
    delete selectedAnswers[4];

    function getOrder() {
      return [...list.querySelectorAll('.rank-list-item')].map(el => el.dataset.gen);
    }

    function refreshNumbers() {
      list.querySelectorAll('.rank-list-item').forEach((item, i) => {
        item.querySelector('.rli-num').textContent = i + 1;
      });
      selectedAnswers[4] = getOrder();
      if (submitBtn) submitBtn.classList.add('enabled');
    }

    refreshNumbers();

    // ── Drag reorder ──
    list.querySelectorAll('.rank-list-item').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        dragSource = item;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.dataset.gen);
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        list.querySelectorAll('.rank-list-item').forEach(i => i.classList.remove('drop-target'));
        dragSource = null;
        refreshNumbers();
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (!dragSource || dragSource === item) return;
        e.dataTransfer.dropEffect = 'move';
        list.querySelectorAll('.rank-list-item').forEach(i => i.classList.remove('drop-target'));
        item.classList.add('drop-target');
      });

      item.addEventListener('dragleave', () => {
        item.classList.remove('drop-target');
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('drop-target');
        if (!dragSource || dragSource === item) return;
        const sourceIdx = [...list.children].indexOf(dragSource);
        const targetIdx = [...list.children].indexOf(item);
        if (sourceIdx < targetIdx) {
          list.insertBefore(dragSource, item.nextSibling);
        } else {
          list.insertBefore(dragSource, item);
        }
        refreshNumbers();
      });

      // ── Click-to-swap ──
      item.querySelector('.rli-btn').addEventListener('click', () => {
        const alreadySelected = list.querySelector('.rank-list-item.selected');

        if (alreadySelected && alreadySelected !== item) {
          const allItems = [...list.querySelectorAll('.rank-list-item')];
          const aIdx = allItems.indexOf(alreadySelected);
          const bIdx = allItems.indexOf(item);

          item.style.transition = 'transform 0.15s ease';
          alreadySelected.style.transition = 'transform 0.15s ease';
          item.style.transform = 'scale(0.97)';
          alreadySelected.style.transform = 'scale(0.97)';
          setTimeout(() => {
            item.style.transform = '';
            alreadySelected.style.transform = '';
          }, 150);

          if (aIdx < bIdx) {
            list.insertBefore(item, alreadySelected);
            list.insertBefore(alreadySelected, allItems[bIdx + 1] || null);
          } else {
            list.insertBefore(alreadySelected, item);
            list.insertBefore(item, allItems[aIdx + 1] || null);
          }

          alreadySelected.classList.remove('selected');
          refreshNumbers();
        } else if (alreadySelected === item) {
          item.classList.remove('selected');
        } else {
          list.querySelectorAll('.rank-list-item').forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');
        }
      });
    });
  }

  // — Major Pie Charts Data (from political_affiliation_by_major_wide.csv) —
  // Liberal  = Extremely liberal + Liberal + Slightly liberal (across all party groups)
  // Conservative = Slightly conservative + Conservative + Extremely conservative (across all party groups)
  // Moderate = Moderate, middle of the road (across all party groups)
  // All majors with n >= 5, sorted alphabetically
  const majorPieData = [
    { name: 'Accounting',            liberal: 8,  conservative: 18, moderate: 20, total: 46  },
    { name: 'Agriculture',           liberal: 2,  conservative: 2,  moderate: 1,  total: 5   },
    { name: 'Anthropology',          liberal: 4,  conservative: 0,  moderate: 1,  total: 5   },
    { name: 'Architecture',          liberal: 6,  conservative: 0,  moderate: 5,  total: 11  },
    { name: 'Art',                   liberal: 12, conservative: 2,  moderate: 8,  total: 22  },
    { name: 'Biology',               liberal: 25, conservative: 6,  moderate: 11, total: 42  },
    { name: 'Business Admin.',       liberal: 78, conservative: 109,moderate: 93, total: 280 },
    { name: 'Chemistry',             liberal: 5,  conservative: 3,  moderate: 4,  total: 12  },
    { name: 'Child Development',     liberal: 1,  conservative: 8,  moderate: 6,  total: 15  },
    { name: 'Communications',        liberal: 22, conservative: 20, moderate: 9,  total: 51  },
    { name: 'Computer Science',      liberal: 12, conservative: 16, moderate: 25, total: 53  },
    { name: 'Counseling',            liberal: 0,  conservative: 3,  moderate: 3,  total: 6   },
    { name: 'Criminology/CJ',        liberal: 4,  conservative: 11, moderate: 4,  total: 19  },
    { name: 'Dentistry',             liberal: 1,  conservative: 7,  moderate: 1,  total: 9   },
    { name: 'Economics',             liberal: 5,  conservative: 14, moderate: 8,  total: 27  },
    { name: 'Education',             liberal: 62, conservative: 65, moderate: 61, total: 188 },
    { name: 'Edu. Administration',   liberal: 1,  conservative: 4,  moderate: 1,  total: 6   },
    { name: 'Electronics',           liberal: 6,  conservative: 3,  moderate: 1,  total: 10  },
    { name: 'Engineering',           liberal: 29, conservative: 50, moderate: 32, total: 111 },
    { name: 'English',               liberal: 24, conservative: 8,  moderate: 11, total: 43  },
    { name: 'Env. Science',          liberal: 0,  conservative: 5,  moderate: 1,  total: 6   },
    { name: 'Finance',               liberal: 4,  conservative: 17, moderate: 10, total: 31  },
    { name: 'Fine Arts',             liberal: 5,  conservative: 5,  moderate: 1,  total: 11  },
    { name: 'Food Science',          liberal: 4,  conservative: 7,  moderate: 0,  total: 11  },
    { name: 'Foreign Language',      liberal: 6,  conservative: 3,  moderate: 3,  total: 12  },
    { name: 'General Sciences',      liberal: 10, conservative: 17, moderate: 12, total: 39  },
    { name: 'General Studies',       liberal: 1,  conservative: 2,  moderate: 6,  total: 9   },
    { name: 'Geology',               liberal: 0,  conservative: 3,  moderate: 2,  total: 5   },
    { name: 'Health',                liberal: 18, conservative: 24, moderate: 19, total: 61  },
    { name: 'History',               liberal: 9,  conservative: 7,  moderate: 11, total: 27  },
    { name: 'Human Services',        liberal: 5,  conservative: 2,  moderate: 5,  total: 12  },
    { name: 'Industry & Tech',       liberal: 4,  conservative: 1,  moderate: 3,  total: 8   },
    { name: 'Info. Technology',      liberal: 1,  conservative: 6,  moderate: 5,  total: 12  },
    { name: 'Journalism',            liberal: 3,  conservative: 6,  moderate: 6,  total: 15  },
    { name: 'Law',                   liberal: 21, conservative: 13, moderate: 17, total: 51  },
    { name: 'Law Enforcement',       liberal: 1,  conservative: 11, moderate: 6,  total: 18  },
    { name: 'Liberal Arts',          liberal: 14, conservative: 12, moderate: 6,  total: 32  },
    { name: 'Library Science',       liberal: 6,  conservative: 1,  moderate: 0,  total: 7   },
    { name: 'Marketing',             liberal: 7,  conservative: 12, moderate: 8,  total: 27  },
    { name: 'Mathematics',           liberal: 5,  conservative: 8,  moderate: 4,  total: 17  },
    { name: 'Medicine',              liberal: 12, conservative: 18, moderate: 8,  total: 38  },
    { name: 'Music',                 liberal: 3,  conservative: 3,  moderate: 2,  total: 8   },
    { name: 'Nursing',               liberal: 26, conservative: 45, moderate: 20, total: 91  },
    { name: 'Other',                 liberal: 11, conservative: 11, moderate: 8,  total: 30  },
    { name: 'Other Vocational',      liberal: 2,  conservative: 4,  moderate: 13, total: 19  },
    { name: 'Pharmacy',              liberal: 6,  conservative: 3,  moderate: 0,  total: 9   },
    { name: 'Physical Education',    liberal: 2,  conservative: 8,  moderate: 4,  total: 14  },
    { name: 'Physics',               liberal: 7,  conservative: 2,  moderate: 1,  total: 10  },
    { name: 'Political Science',     liberal: 17, conservative: 16, moderate: 8,  total: 41  },
    { name: 'Psychology',            liberal: 18, conservative: 28, moderate: 19, total: 65  },
    { name: 'Social Sciences',       liberal: 2,  conservative: 3,  moderate: 2,  total: 7   },
    { name: 'Social Work',           liberal: 11, conservative: 7,  moderate: 9,  total: 27  },
    { name: 'Sociology',             liberal: 10, conservative: 2,  moderate: 9,  total: 21  },
    { name: 'Special Education',     liberal: 2,  conservative: 1,  moderate: 2,  total: 5   },
    { name: 'Theology',              liberal: 2,  conservative: 6,  moderate: 5,  total: 13  },
    { name: 'TV / Film',             liberal: 4,  conservative: 0,  moderate: 2,  total: 6   },
    { name: 'Veterinary Medicine',   liberal: 0,  conservative: 5,  moderate: 3,  total: 8   },
    { name: 'Visual Arts/Design',    liberal: 0,  conservative: 4,  moderate: 6,  total: 10  }
  ];

  function buildPieSVG(liberalPct, conservativePct, moderatePct, size) {
    // Build a pie chart SVG from percentages (liberal, conservative, moderate)
    const r = 44;
    const cx = 50, cy = 50;
    const circumference = 2 * Math.PI * r;

    function polarToCartesian(cx, cy, r, angleDeg) {
      const rad = (angleDeg - 90) * Math.PI / 180;
      return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    }

    function describeArc(cx, cy, r, startAngle, endAngle) {
      const start = polarToCartesian(cx, cy, r, endAngle);
      const end = polarToCartesian(cx, cy, r, startAngle);
      const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
      return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
    }

    const segments = [
      { pct: conservativePct, color: '#e05c5c', label: 'Con' },
      { pct: liberalPct,      color: '#3b7dd8', label: 'Lib' },
      { pct: moderatePct,     color: '#8b9aaa', label: 'Mod' }
    ];

    let currentAngle = 0;
    let paths = '';
    segments.forEach(seg => {
      if (seg.pct <= 0) return;
      const sliceAngle = (seg.pct / 100) * 360;
      paths += `<path d="${describeArc(cx, cy, r, currentAngle, currentAngle + sliceAngle)}" fill="${seg.color}" opacity="0.92"/>`;
      currentAngle += sliceAngle;
    });

    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" style="display:block;">
      ${paths}
      <circle cx="${cx}" cy="${cy}" r="22" fill="#0A0E17"/>
    </svg>`;
  }

  function renderMajorPies(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    majorPieData.forEach((d, idx) => {
      const libRaw = d.liberal;
      const conRaw = d.conservative;
      const modRaw = d.total - libRaw - conRaw;
      const total = d.total;
      const libPct  = +((libRaw / total) * 100).toFixed(1);
      const conPct  = +((conRaw / total) * 100).toFixed(1);
      const modPct  = +(100 - libPct - conPct).toFixed(1);

      const card = document.createElement('div');
      card.className = 'major-pie-card';
      card.style.animationDelay = (0.1 + idx * 0.12) + 's';

      card.innerHTML = `
        <div class="mpc-name">${d.name}</div>
        <div class="mpc-pie">${buildPieSVG(libPct, conPct, modPct, 80)}</div>
        <div class="mpc-legend">
          <div class="mpc-legend-item"><span class="mpc-swatch" style="background:#e05c5c"></span><span class="mpc-lbl">Conservative</span><span class="mpc-val">${conPct}%</span></div>
          <div class="mpc-legend-item"><span class="mpc-swatch" style="background:#3b7dd8"></span><span class="mpc-lbl">Liberal</span><span class="mpc-val">${libPct}%</span></div>
          <div class="mpc-legend-item"><span class="mpc-swatch" style="background:#8b9aaa"></span><span class="mpc-lbl">Moderate</span><span class="mpc-val">${modPct}%</span></div>
        </div>
        <div class="mpc-total">n = ${total}</div>
      `;
      container.appendChild(card);
    });
  }

  // — Drag-and-Rank Q1 (vertical sortable list) —
  function initRankQ1() {
    const list = document.getElementById('rank-list-q1');
    if (!list) return;

    // Reset visual state — restore original DOM order (chronological: newest first)
    const originalOrder = ['Gen Z', 'Millennial', 'Gen X', 'Boomers'];
    originalOrder.forEach(gen => {
      const item = list.querySelector(`.rank-list-item[data-gen="${gen}"]`);
      if (item) list.appendChild(item);
    });

    // Clear any leftover states
    list.querySelectorAll('.rank-list-item').forEach(item => {
      item.classList.remove('selected', 'dragging', 'drop-target');
    });

    // Reset submit button
    const submitBtn = document.getElementById('q1-submit');
    submitBtn.classList.remove('enabled');
    delete selectedAnswers[1];

    dragSource = null;

    function getOrder() {
      return [...list.querySelectorAll('.rank-list-item')].map(el => el.dataset.gen);
    }

    function refreshNumbers() {
      list.querySelectorAll('.rank-list-item').forEach((item, i) => {
        item.querySelector('.rli-num').textContent = i + 1;
      });
      // Always enabled since list always has all 4 items in some order
      selectedAnswers[1] = getOrder();
      submitBtn.classList.add('enabled');
    }

    // Init numbers and enable submit immediately (order is already valid)
    refreshNumbers();

    // ── Drag reorder ──
    list.querySelectorAll('.rank-list-item').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        dragSource = item;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.dataset.gen);
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        list.querySelectorAll('.rank-list-item').forEach(i => i.classList.remove('drop-target'));
        dragSource = null;
        refreshNumbers();
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (!dragSource || dragSource === item) return;
        e.dataTransfer.dropEffect = 'move';
        list.querySelectorAll('.rank-list-item').forEach(i => i.classList.remove('drop-target'));
        item.classList.add('drop-target');
      });

      item.addEventListener('dragleave', () => {
        item.classList.remove('drop-target');
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('drop-target');
        if (!dragSource || dragSource === item) return;

        // Insert dragSource before or after target depending on direction
        const sourceIdx = [...list.children].indexOf(dragSource);
        const targetIdx = [...list.children].indexOf(item);
        if (sourceIdx < targetIdx) {
          list.insertBefore(dragSource, item.nextSibling);
        } else {
          list.insertBefore(dragSource, item);
        }
        refreshNumbers();
      });

      // ── Click-to-swap ──
      item.querySelector('.rli-btn').addEventListener('click', () => {
        const alreadySelected = list.querySelector('.rank-list-item.selected');

        if (alreadySelected && alreadySelected !== item) {
          // Swap the two items in the DOM
          const allItems = [...list.querySelectorAll('.rank-list-item')];
          const aIdx = allItems.indexOf(alreadySelected);
          const bIdx = allItems.indexOf(item);

          // Swap animation pulse
          item.style.transition = 'transform 0.15s ease';
          alreadySelected.style.transition = 'transform 0.15s ease';
          item.style.transform = 'scale(0.97)';
          alreadySelected.style.transform = 'scale(0.97)';
          setTimeout(() => {
            item.style.transform = '';
            alreadySelected.style.transform = '';
          }, 150);

          if (aIdx < bIdx) {
            list.insertBefore(item, alreadySelected);
            list.insertBefore(alreadySelected, allItems[bIdx + 1] || null);
          } else {
            list.insertBefore(alreadySelected, item);
            list.insertBefore(item, allItems[aIdx + 1] || null);
          }

          alreadySelected.classList.remove('selected');
          refreshNumbers();
        } else if (alreadySelected === item) {
          // Deselect
          item.classList.remove('selected');
        } else {
          // First selection
          list.querySelectorAll('.rank-list-item').forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');
        }
      });
    });
  }

  // — Submit Answer —
  function submitAnswer(qNum) {
    const question = quizData.questions[qNum - 1];
    // For rank questions, always read the live DOM order at submit time
    let userAnswer = selectedAnswers[qNum];
    if (question.type === 'rank') {
      const listId = qNum === 4 ? 'rank-list-q4' : 'rank-list-q1';
      const list = document.getElementById(listId);
      if (list) {
        userAnswer = [...list.querySelectorAll('.rank-list-item')].map(el => el.dataset.gen);
      }
    }
    let isCorrect = false;

    if (question.type === 'slider') {
      // For slider: correct if within 2 of the correct value
      isCorrect = Math.abs(userAnswer - question.correctValue) <= 2;
    } else if (question.type === 'rank') {
      // Exact order match
      isCorrect = Array.isArray(userAnswer) &&
        userAnswer.every((v, i) => v === question.correctOrder[i]);
    } else {
      isCorrect = userAnswer === question.correctIndex;
    }

    // Update answer page
    if (question.type === 'rank') {
      updateRankAnswerPage(qNum, question, userAnswer, isCorrect);
    } else {
      updateAnswerPage(qNum, question, userAnswer, isCorrect);
    }
    
    if (isCorrect) score++;
    
    showPage('q' + qNum + 'a');
  }

  // — Update Rank Answer Page (Q1 & Q4) —
  function updateRankAnswerPage(qNum, question, userOrder, isCorrect) {
    const answerPage = document.getElementById('q' + qNum + 'a');
    if (!answerPage) return;

    // Badge
    const badge = answerPage.querySelector('.answer-result-badge');
    badge.className = 'answer-result-badge ' + (isCorrect ? 'correct' : 'incorrect');
    badge.querySelector('.badge-text').textContent = isCorrect ? 'Correct!' : 'Not quite';
    badge.querySelector('.badge-icon').textContent = isCorrect ? '✓' : '→';

    // Build user rank list
    const userListId = qNum === 4 ? 'user-rank-list-q4' : 'user-rank-list';
    const userList = document.getElementById(userListId);
    if (!userList) return;
    userList.innerHTML = '';

    (userOrder || []).forEach((gen, i) => {
      const correct = question.correctOrder[i];
      const isMatch = gen === correct;
      const pct = question.percentages?.[gen] || '';
      const item = document.createElement('div');
      item.className = 'rank-compare-item ' + (isMatch ? 'rank-match' : 'rank-miss');
      item.style.animationDelay = (0.1 + i * 0.08) + 's';
      item.innerHTML = `
        <span class="rci-num">${i + 1}</span>
        <div class="rci-body">
          <span class="rci-name">${gen}</span>
          <span class="rci-pct">${pct}</span>
        </div>
        <span style="font-size:0.85rem;margin-left:auto;padding-left:6px">${isMatch ? '✓' : '✗'}</span>
      `;
      userList.appendChild(item);
    });

    // If Q4, also render the pie charts
    if (qNum === 4) {
      renderMajorPies('major-pies-grid');
    }
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
      } else if (question.type === 'rank') {
        isCorrect = Array.isArray(userAnswer) &&
          userAnswer.every((v, idx) => v === question.correctOrder[idx]);
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

      // Initialize Q1 interactive chart whenever the answer page becomes visible
      if (pageId === 'q1a') {
        requestAnimationFrame(() => renderQ1Chart(q1ActiveView));
      }
      if (pageId === 'q1') {
        ensureRankSubmitEnabled(1);
      }
      if (pageId === 'q4') {
        ensureRankSubmitEnabled(4);
      }
      // Initialize Q2 education chart whenever q2a becomes visible
      if (pageId === 'q2a') {
        requestAnimationFrame(() => {
          renderQ2EduChart(q2ActiveView, 'q2a-edu-chart');
          renderQ2EduChart('share', 'score-edu-chart');
        });
      }
      // Refresh score page edu chart on score page
      if (pageId === 'score') {
        requestAnimationFrame(() => {
          renderQ2EduChart('share', 'score-edu-chart');
          renderMajorPies('score-major-pies-grid');
          renderSpaceLineChart('score-space-line-chart');
        });
      }
      // Render space exploration chart on answer page
      if (pageId === 'q3a') {
        requestAnimationFrame(() => renderSpaceLineChart('q3a-space-line-chart'));
      }
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
            } else if (question.type === 'rank') {
              correct = Array.isArray(userAnswer) &&
                userAnswer.every((v, idx) => v === question.correctOrder[idx]);
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

  // — Q2 Interactive Chart: 1980 Education breakdown —
  // Raw counts from ANES 1980 education_1980.csv
  // Groups: No/Some HS (No formal–11th), HS Diploma (12th),
  //         Some College (1–3 yrs), Bachelor's (4 yrs), Post-Grad (5+ yrs)
  const edu1980 = {
    labels:  ['No/Some H.S.', 'H.S. Diploma', 'Some College', "Bachelor's", 'Post-Grad'],
    carter:  [708,  714, 489, 218, 204],   // raw ANES counts
    reagan:  [398,  813, 556, 350, 227],
    // winner = who got more raw votes in each group
    winner:  ['Carter', 'Reagan', 'Reagan', 'Reagan', 'Reagan']
  };

  // Compute share-of-vote percentages
  function computeEduShares() {
    const cTotal = edu1980.carter.reduce((a, b) => a + b, 0);
    const rTotal = edu1980.reagan.reduce((a, b) => a + b, 0);
    return edu1980.labels.map((lbl, i) => ({
      label: lbl,
      carter: +((edu1980.carter[i] / cTotal) * 100).toFixed(1),
      reagan: +((edu1980.reagan[i] / rTotal) * 100).toFixed(1),
      winner: edu1980.winner[i]
    }));
  }

  let q2ActiveView = 'share';

  function renderQ2EduChart(view, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    q2ActiveView = view;

    const shares = computeEduShares();
    const isShareView = view === 'share';

    container.innerHTML = '';
    container.style.cssText = 'display:flex; flex-direction:column; gap:12px; padding: 8px 0;';

    shares.forEach((row, idx) => {
      const isReaganWin = row.winner === 'Reagan';
      const delay = 0.05 + idx * 0.08;

      const group = document.createElement('div');
      group.className = 'edu-bar-group';
      group.style.cssText = 'display:flex; flex-direction:column; gap:4px;';

      // Label row
      const labelRow = document.createElement('div');
      labelRow.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;';
      labelRow.innerHTML = `<span style="font-family:var(--font-mono); font-size:0.7rem; color:var(--text-secondary); letter-spacing:.04em;">${row.label}</span>` +
        (isShareView ? '' : `<span class="edu-winner-badge ${isReaganWin ? 'winner-rep' : 'winner-dem'}">${row.winner} won</span>`);
      group.appendChild(labelRow);

      if (isShareView) {
        // Two bars side by side (Carter blue, Reagan red)
        [['carter', '#4A7FD4', 'Carter', row.carter], ['reagan', '#D64045', 'Reagan', row.reagan]].forEach(([key, color, name, pct]) => {
          const barRow = document.createElement('div');
          barRow.style.cssText = 'display:flex; align-items:center; gap:8px;';

          const nameEl = document.createElement('span');
          nameEl.style.cssText = `font-family:var(--font-mono); font-size:0.65rem; color:${color}; width:50px; flex-shrink:0;`;
          nameEl.textContent = name;

          const track = document.createElement('div');
          track.style.cssText = 'flex:1; background:var(--border); border-radius:3px; height:12px; overflow:hidden; position:relative;';

          const fill = document.createElement('div');
          fill.style.cssText = `height:100%; background:${color}; border-radius:3px; width:0%; transition:width 0.5s cubic-bezier(.16,1,.3,1) ${delay}s;`;
          fill.setAttribute('data-target', pct);
          track.appendChild(fill);

          const valEl = document.createElement('span');
          valEl.style.cssText = `font-family:var(--font-mono); font-size:0.68rem; color:${color}; width:36px; text-align:right;`;
          valEl.textContent = pct + '%';

          barRow.appendChild(nameEl);
          barRow.appendChild(track);
          barRow.appendChild(valEl);

          // Hover tooltip
          track.addEventListener('mouseenter', (e) => showEduTooltip(e, `${name} voters with "${row.label}": ${pct}% of ${name}'s total vote`));
          track.addEventListener('mouseleave', hideEduTooltip);

          group.appendChild(barRow);
        });
      } else {
        // Winner view: single stacked bar showing Carter vs Reagan raw split
        const cCount = edu1980.carter[idx];
        const rCount = edu1980.reagan[idx];
        const groupTotal = cCount + rCount;
        const cPct = (cCount / groupTotal * 100).toFixed(1);
        const rPct = (rCount / groupTotal * 100).toFixed(1);

        const barRow = document.createElement('div');
        barRow.style.cssText = 'display:flex; align-items:center; gap:8px;';

        const track = document.createElement('div');
        track.style.cssText = 'flex:1; background:var(--border); border-radius:4px; height:20px; overflow:hidden; display:flex;';

        const cFill = document.createElement('div');
        cFill.style.cssText = `height:100%; background:#4A7FD4; width:0%; transition:width 0.55s cubic-bezier(.16,1,.3,1) ${delay}s; display:flex; align-items:center; justify-content:center; overflow:hidden;`;
        cFill.setAttribute('data-target', cPct);
        if (parseFloat(cPct) > 15) {
          cFill.innerHTML = `<span style="font-size:0.6rem; font-family:var(--font-mono); color:#fff; white-space:nowrap; padding:0 4px;">${cPct}%</span>`;
        }

        const rFill = document.createElement('div');
        rFill.style.cssText = `height:100%; background:#D64045; width:0%; transition:width 0.55s cubic-bezier(.16,1,.3,1) ${delay + 0.04}s; display:flex; align-items:center; justify-content:center; overflow:hidden;`;
        rFill.setAttribute('data-target', rPct);
        if (parseFloat(rPct) > 15) {
          rFill.innerHTML = `<span style="font-size:0.6rem; font-family:var(--font-mono); color:#fff; white-space:nowrap; padding:0 4px;">${rPct}%</span>`;
        }

        track.appendChild(cFill);
        track.appendChild(rFill);
        track.addEventListener('mouseenter', (e) => showEduTooltip(e, `"${row.label}" group: Carter ${cPct}% · Reagan ${rPct}%`));
        track.addEventListener('mouseleave', hideEduTooltip);

        barRow.appendChild(track);
        group.appendChild(barRow);
      }

      container.appendChild(group);

      // Animate bars after paint
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          group.querySelectorAll('[data-target]').forEach(fill => {
            fill.style.width = fill.getAttribute('data-target') + '%';
          });
        });
      });
    });
  }

  function showEduTooltip(e, text) {
    // Try q2a tooltip first, fall back
    const tip = document.getElementById('q2a-tooltip');
    if (!tip) return;
    tip.textContent = text;
    tip.style.display = 'block';
    tip.style.opacity = '1';
  }

  function hideEduTooltip() {
    const tip = document.getElementById('q2a-tooltip');
    if (tip) { tip.style.opacity = '0'; setTimeout(() => { tip.style.display = 'none'; }, 200); }
  }

  function initQ2ChartToggles() {
    const container = document.getElementById('q2a-chart-container');
    if (!container) return;
    container.querySelectorAll('.chart-toggle-btn[data-edu-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.chart-toggle-btn[data-edu-view]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // Update subtitle
        const titleEl = document.getElementById('q2a-chart-title');
        const subEl   = document.getElementById('q2a-chart-subtitle');
        const legEl   = document.getElementById('q2a-legend');
        if (btn.dataset.eduView === 'share') {
          if (titleEl) titleEl.textContent = 'Education Breakdown of Each Candidate\'s Vote';
          if (subEl)   subEl.textContent   = 'What % of Carter (Democrat) vs. Reagan (Republican) voters had each education level';
          if (legEl)   legEl.style.display = '';
        } else {
          if (titleEl) titleEl.textContent = 'Who Won Each Education Group?';
          if (subEl)   subEl.textContent   = 'Carter (Democrat) vs. Reagan (Republican) split within each education tier';
          if (legEl)   legEl.style.display = '';
        }
        renderQ2EduChart(btn.dataset.eduView, 'q2a-edu-chart');
      });
    });
  }

  // — Q1 Interactive Chart: ideology toggle —
  // Data computed from cleaned_ideology_data.csv, MALE respondents only
  // Generation birth-year brackets: Silent/Greatest ≤1945, Boomers 1946-1964,
  // Gen X 1965-1980, Millennial 1981-1994, Gen Z 1995+
  // Liberal  = Extremely liberal + Liberal + Slightly liberal
  // Conservative = Extremely conservative + Conservative + Slightly conservative
  // Moderate = "Moderate, middle of the road"
  const q1ChartViews = {
    liberal: {
      title: 'Male Liberal Identification by Generation',
      subtitle: 'Share identifying as slightly liberal, liberal, or extremely liberal',
      legendLabel: 'Liberal identification share',
      color: '#3b7dd8',
      yMax: 40,
      yStep: 8,
      data: [
        { gen: 'Millennial', pct: 33.1 },
        { gen: 'Gen Z',      pct: 26.8 },
        { gen: 'Boomers',    pct: 25.0 },
        { gen: 'Gen X',      pct: 23.4 }
      ]
    },
    conservative: {
      title: 'Male Conservative Identification by Generation',
      subtitle: 'Share identifying as slightly conservative, conservative, or extremely conservative',
      legendLabel: 'Conservative identification share',
      color: '#e05c5c',
      yMax: 40,
      yStep: 8,
      data: [
        { gen: 'Boomers',    pct: 32.2 },
        { gen: 'Gen X',      pct: 30.0 },
        { gen: 'Millennial', pct: 23.5 },
        { gen: 'Gen Z',      pct: 26.6 }
      ]
    },
    moderate: {
      title: 'Male Moderate Identification by Generation',
      subtitle: 'Share identifying as "moderate, middle of the road"',
      legendLabel: 'Moderate identification share',
      color: '#8b7fd4',
      yMax: 40,
      yStep: 8,
      data: [
        { gen: 'Boomers',    pct: 33.5 },
        { gen: 'Gen X',      pct: 36.2 },
        { gen: 'Millennial', pct: 37.6 },
        { gen: 'Gen Z',      pct: 38.5 }
      ]
    }
  };

  let q1ActiveView = 'liberal';

  function renderQ1Chart(view) {
    const cfg = q1ChartViews[view];
    if (!cfg) return;
    q1ActiveView = view;

    // Update text labels
    document.getElementById('q1a-chart-title').textContent = cfg.title;
    document.getElementById('q1a-chart-subtitle').textContent = cfg.subtitle;
    document.getElementById('q1a-legend-label').textContent = cfg.legendLabel;
    document.getElementById('q1a-legend-dot').style.background = cfg.color;

    // Keep bars in fixed chronological order across all ideology views
    const chronologicalOrder = ['Gen Z', 'Millennial', 'Gen X', 'Boomers'];
    const ordered = chronologicalOrder
      .map((gen) => cfg.data.find((d) => d.gen === gen))
      .filter(Boolean);
    // Fallback: append any unexpected generation labels not in the fixed order
    const extras = cfg.data.filter((d) => !chronologicalOrder.includes(d.gen));
    const bars = [...ordered, ...extras];

    // Rebuild y-axis labels
    const yAxis = document.getElementById('q1a-y-axis');
    yAxis.innerHTML = '';
    for (let v = cfg.yMax; v >= 0; v -= cfg.yStep) {
      const span = document.createElement('span');
      span.className = 'y-label';
      span.textContent = v === 0 ? '0' : v + '%';
      yAxis.appendChild(span);
    }

    // Rebuild bars (preserve grid lines, replace bars only)
    const barsContainer = document.getElementById('q1a-chart-bars');
    // Remove old bars (keep y-axis and grid)
    barsContainer.querySelectorAll('.chart-bar').forEach(b => b.remove());

    bars.forEach((d, i) => {
      const heightPct = (d.pct / cfg.yMax) * 100;
      const bar = document.createElement('div');
      bar.className = 'chart-bar';
      bar.style.cssText = `height: ${heightPct}%; background: ${cfg.color}; animation: fadeUp 0.45s ease ${0.05 + i * 0.1}s both;`;
      bar.innerHTML = `<span class="chart-bar-value">${d.pct}%</span><span class="chart-bar-label">${d.gen}</span>`;
      barsContainer.appendChild(bar);
    });

    // Update toggle buttons
    document.querySelectorAll('#q1a-chart-container .chart-toggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
  }

  function initQ1ChartToggles() {
    const container = document.getElementById('q1a-chart-container');
    if (!container) return;
    container.querySelectorAll('.chart-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        renderQ1Chart(btn.dataset.view);
      });
    });
    // Render default (liberal) view on init
    renderQ1Chart('liberal');
  }

  // — Space Exploration Chart Data —
  // Computed from space_exploration.csv
  // Metric: % of respondents in each party group saying "TOO LITTLE" (i.e. want MORE funding)
  // Groups:
  //   Democrats  = Strong democrat + Not very strong democrat + Independent, close to democrat
  //   Republicans = Strong republican + Not very strong republican + Independent, close to republican
  //   Independents = Independent (neither, no response)
  //
  // For each year and category (TOO LITTLE, ABOUT RIGHT, TOO MUCH) we sum counts per group
  // then compute tooLittle / total for each group.

  const spaceRawData = [
    // [year, demTooLittle, demTotal, repTooLittle, repTotal, indTooLittle, indTotal]
    [1973,  34, 1510,  64,  926,  13,  280],
    [1974,  56, 1628,  39,  782,  16,  278],
    [1975,  61, 1614,  37,  858,  22,  362],
    [1976,  72, 1690,  49,  780,  25,  440],
    [1977,  91, 1676,  45,  852,  17,  322],
    [1978,  99, 1522,  52,  928,  32,  414],
    [1980, 130, 1380,  91,  836,  45,  448],
    [1982, 127, 1862,  95, 1124,  32,  456],
    [1983, 107, 1622,  84, 1014,  33,  364],
    [1984,  26,  482,  24,  328,   3,  108],
    [1985,  33,  650,  38,  586,  11,  158],
    [1986,  41,  696,  35,  516,  10,  146],
    [1987,  34,  556,  51,  418,  14,  128],
    [1988,  45,  622,  69,  522,  14,  168],
    [1989,  45,  676,  63,  582,  11,  154],
    [1990,  26,  558,  42,  586,   6,  144],
    [1991,  35,  590,  38,  608,  13,  156],
    [1993,  28,  734,  30,  588,  10,  162],
    [1994,  59, 1316,  65, 1094,  19,  384],
    [1996,  60, 1154,  68, 1044,  23,  426],
    [1998,  60, 1118,  57,  936,  17,  460],
    [2000,  76, 1102,  77,  900,  33,  526],
    [2002,  76, 1060,  48,  938,  26,  470],
    [2004,  74, 1176,  89, 1052,  27,  398],
    [2006,  84, 1150,  70,  950,  33,  596],
    [2008,  51,  866,  41,  592,  25,  306],
    [2010,  62,  832,  68,  658,  26,  338],
    [2012,  98,  878,  84,  584,  23,  348],
    [2014, 120,  992, 121,  748,  46,  472],
    [2016, 131, 1158, 125,  944,  55,  434],
    [2018, 102,  836, 101,  862,  29,  362],
    [2021, 225, 1656, 140, 1170, 121,  958],
    [2022, 108, 1246, 148, 1132,  80,  794],
    [2024,  95, 1050, 103, 1046,  91,  862]
  ];

  // Compute percent-too-little for each group
  const spaceChartData = spaceRawData.map(([year, dL, dT, rL, rT, iL, iT]) => ({
    year,
    dem: +((dL / dT) * 100).toFixed(1),
    rep: +((rL / rT) * 100).toFixed(1),
    ind: +((iL / iT) * 100).toFixed(1)
  }));

  function renderSpaceLineChart(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const W = 580, H = 240;
    const pad = { top: 20, right: 48, bottom: 40, left: 46 };
    const innerW = W - pad.left - pad.right;
    const innerH = H - pad.top - pad.bottom;

    const years = spaceChartData.map(d => d.year);
    const minYear = years[0], maxYear = years[years.length - 1];
    const xScale = y => pad.left + ((y - minYear) / (maxYear - minYear)) * innerW;
    const maxVal = 20;
    const yScale = v => pad.top + innerH - (v / maxVal) * innerH;

    function makePath(key) {
      return spaceChartData.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(d.year).toFixed(1)},${yScale(d[key]).toFixed(1)}`).join(' ');
    }

    // Y-axis ticks
    const yTicks = [0, 5, 10, 15, 20];
    const gridLines = yTicks.map(v =>
      `<line x1="${pad.left}" y1="${yScale(v).toFixed(1)}" x2="${pad.left + innerW}" y2="${yScale(v).toFixed(1)}" stroke="var(--border-subtle)" stroke-width="0.5"/>`
    ).join('');
    const yLabels = yTicks.map(v =>
      `<text x="${pad.left - 6}" y="${(yScale(v) + 4).toFixed(1)}" text-anchor="end" fill="var(--text-muted)" font-size="10" font-family="var(--font-mono)">${v}%</text>`
    ).join('');

    // X-axis ticks — show every ~10 years
    const xTickYears = [1975, 1985, 1995, 2005, 2015, 2024];
    const xLabels = xTickYears.map(y =>
      `<text x="${xScale(y).toFixed(1)}" y="${H - 6}" text-anchor="middle" fill="var(--text-muted)" font-size="10" font-family="var(--font-mono)">${y}</text>`
    ).join('');

    // End labels
    const lastD = spaceChartData[spaceChartData.length - 1];
    const endLabels = [
      `<text x="${pad.left + innerW + 4}" y="${(yScale(lastD.rep) + 4).toFixed(1)}" fill="#D64045" font-size="10" font-weight="700" font-family="var(--font-mono)">${lastD.rep}%</text>`,
      `<text x="${pad.left + innerW + 4}" y="${(yScale(lastD.dem) + 4).toFixed(1)}" fill="#4A7FD4" font-size="10" font-weight="700" font-family="var(--font-mono)">${lastD.dem}%</text>`,
      `<text x="${pad.left + innerW + 4}" y="${(yScale(lastD.ind) + 4).toFixed(1)}" fill="#9B59B6" font-size="10" font-weight="700" font-family="var(--font-mono)">${lastD.ind}%</text>`
    ].join('');

    // Dots on last point
    const dots = [
      `<circle cx="${xScale(lastD.year).toFixed(1)}" cy="${yScale(lastD.rep).toFixed(1)}" r="4" fill="#D64045"/>`,
      `<circle cx="${xScale(lastD.year).toFixed(1)}" cy="${yScale(lastD.dem).toFixed(1)}" r="4" fill="#4A7FD4"/>`,
      `<circle cx="${xScale(lastD.year).toFixed(1)}" cy="${yScale(lastD.ind).toFixed(1)}" r="4" fill="#9B59B6"/>`
    ].join('');

    // Tooltip dots on every point
    const allDots = spaceChartData.map(d => [
      `<circle class="space-dot" cx="${xScale(d.year).toFixed(1)}" cy="${yScale(d.rep).toFixed(1)}" r="3.5" fill="#D64045" opacity="0" data-year="${d.year}" data-rep="${d.rep}" data-dem="${d.dem}" data-ind="${d.ind}"/>`,
      `<circle class="space-dot" cx="${xScale(d.year).toFixed(1)}" cy="${yScale(d.dem).toFixed(1)}" r="3.5" fill="#4A7FD4" opacity="0" data-year="${d.year}"/>`,
      `<circle class="space-dot" cx="${xScale(d.year).toFixed(1)}" cy="${yScale(d.ind).toFixed(1)}" r="3.5" fill="#9B59B6" opacity="0" data-year="${d.year}"/>`
    ].join('')).join('');

    // Hover rect strips for each year
    const hoverRects = spaceChartData.map((d, i) => {
      const x0 = i === 0 ? xScale(d.year) - 8 : (xScale(spaceChartData[i-1].year) + xScale(d.year)) / 2;
      const x1 = i === spaceChartData.length - 1 ? xScale(d.year) + 8 : (xScale(d.year) + xScale(spaceChartData[i+1].year)) / 2;
      return `<rect class="space-hover-rect" x="${x0.toFixed(1)}" y="${pad.top}" width="${(x1 - x0).toFixed(1)}" height="${innerH}" fill="transparent" data-year="${d.year}" data-rep="${d.rep}" data-dem="${d.dem}" data-ind="${d.ind}"/>`;
    }).join('');

    container.innerHTML = `
      <div style="position:relative;">
        <svg viewBox="0 0 ${W} ${H}" style="width:100%; height:auto; display:block; overflow:visible;">
          ${gridLines}
          ${yLabels}
          ${xLabels}
          <path d="${makePath('dem')}" fill="none" stroke="#4A7FD4" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" opacity="0.9"/>
          <path d="${makePath('ind')}" fill="none" stroke="#9B59B6" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" opacity="0.85"/>
          <path d="${makePath('rep')}" fill="none" stroke="#D64045" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" style="filter:drop-shadow(0 0 4px rgba(214,64,69,0.4))"/>
          ${dots}
          ${allDots}
          ${hoverRects}
          ${endLabels}
        </svg>
        <div id="${containerId}-tooltip" style="display:none; position:absolute; background:var(--card-bg); border:1px solid var(--border); border-radius:6px; padding:8px 12px; font-family:var(--font-mono); font-size:0.7rem; pointer-events:none; color:var(--text-primary); white-space:nowrap; box-shadow: 0 4px 16px rgba(0,0,0,0.3); z-index:10;"></div>
      </div>`;

    // Wire up hover tooltips
    container.querySelectorAll('.space-hover-rect').forEach(rect => {
      rect.addEventListener('mouseenter', (e) => {
        const tip = document.getElementById(containerId + '-tooltip');
        if (!tip) return;
        const yr = rect.dataset.year;
        const rep = rect.dataset.rep;
        const dem = rect.dataset.dem;
        const ind = rect.dataset.ind;
        tip.innerHTML = `<strong>${yr}</strong><br><span style="color:#D64045">Republicans: ${rep}%</span><br><span style="color:#4A7FD4">Democrats: ${dem}%</span><br><span style="color:#9B59B6">Independents: ${ind}%</span>`;
        tip.style.display = 'block';
        const svgRect = container.querySelector('svg').getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const svgW = svgRect.width;
        const xFrac = (parseFloat(rect.getAttribute('x')) + parseFloat(rect.getAttribute('width')) / 2) / W;
        let tipX = xFrac * svgW - containerRect.left + svgRect.left - 60;
        tipX = Math.max(4, Math.min(tipX, containerRect.width - 140));
        tip.style.left = tipX + 'px';
        tip.style.top = '10px';
      });
      rect.addEventListener('mouseleave', () => {
        const tip = document.getElementById(containerId + '-tooltip');
        if (tip) tip.style.display = 'none';
      });
    });
  }

  // — Expose Init —
  return { init };
})();

// Launch
document.addEventListener('DOMContentLoaded', QuizApp.init);
