const STORAGE_KEYS = {
  config: 'exam_studio_config_v2',
  submissions: 'exam_studio_submissions_v2',
  draft: 'exam_studio_draft_v2'
};

const state = {
  running: false,
  finished: false,
  timerId: null,
  startedAt: null,
  durationSec: 1800,
  remainingSec: 1800,
  questionCount: 20,
  answers: {},
  questionPages: {},
  correctAnswers: {},
  preview: { url: '', type: '', name: '', pdfDoc: null, renderToken: 0 },
  activeBookletIndex: 0,
  bookletStates: [],
  config: {
    examTitle: '',
    questionCount: 20,
    languageMode: 'fa',
    negativeMarking: 'no',
    bookletMode: 'single',
    booklet1Title: 'دفترچه اول',
    booklet1QuestionCount: 20,
    booklet1Coefficient: 1,
    booklet1Hours: 0,
    booklet1Minutes: 30,
    booklet1Seconds: 0,
    booklet2Title: 'دفترچه دوم',
    booklet2QuestionCount: 20,
    booklet2Coefficient: 1,
    booklet2Hours: 0,
    booklet2Minutes: 25,
    booklet2Seconds: 0,
    previewName: '',
    previewType: '',
    keySource: 'manual',
    questionPages: {}
  },
  lastResult: null,
  guardAction: null,
  guardProgress: 0
};

const els = {
  timerDisplay: document.getElementById('timerDisplay'),
  statusPill: document.getElementById('statusPill'),
  startBtn: document.getElementById('startBtn'),
  finishBtn: document.getElementById('finishBtn'),
  manageBtn: document.getElementById('manageBtn'),
  closeManageBtn: document.getElementById('closeManageBtn'),
  closeManageBtn2: document.getElementById('closeManageBtn2'),
  managementModal: document.getElementById('managementModal'),
  resultModal: document.getElementById('resultModal'),
  resultContent: document.getElementById('resultContent'),
  closeResultBtn: document.getElementById('closeResultBtn'),
  downloadPdfBtn: document.getElementById('downloadPdfBtn'),
  downloadJsonBtn: document.getElementById('downloadJsonBtn'),
  gradePendingBtn: document.getElementById('gradePendingBtn'),
  guardModal: document.getElementById('guardModal'),
  guardTitle: document.getElementById('guardTitle'),
  guardMessage: document.getElementById('guardMessage'),
  guardProgress: document.getElementById('guardProgress'),
  guardSlider: document.getElementById('guardSlider'),
  guardPercent: document.getElementById('guardPercent'),
  guardConfirmBtn: document.getElementById('guardConfirmBtn'),
  guardCancelBtn: document.getElementById('guardCancelBtn'),
  answerSheetBody: document.getElementById('answerSheetBody'),
  keyTableBody: document.getElementById('keyTableBody'),
  sheetSub: document.getElementById('sheetSub'),
  sheetMeta: document.getElementById('sheetMeta'),
  bookletMeta: document.getElementById('bookletMeta'),
  bookletBar: document.getElementById('bookletBar'),
  bookletConfig1: document.getElementById('bookletConfig1'),
  bookletConfig2: document.getElementById('bookletConfig2'),
  bookletMode: document.getElementById('bookletMode'),
  booklet1Title: document.getElementById('booklet1Title'),
  booklet1QuestionCount: document.getElementById('booklet1QuestionCount'),
  booklet1Coefficient: document.getElementById('booklet1Coefficient'),
  booklet1PageStart: document.getElementById('booklet1PageStart'),
  booklet1PageEnd: document.getElementById('booklet1PageEnd'),
  booklet1Hours: document.getElementById('booklet1Hours'),
  booklet1Minutes: document.getElementById('booklet1Minutes'),
  booklet1Seconds: document.getElementById('booklet1Seconds'),
  booklet2Title: document.getElementById('booklet2Title'),
  booklet2QuestionCount: document.getElementById('booklet2QuestionCount'),
  booklet2Coefficient: document.getElementById('booklet2Coefficient'),
  booklet2PageStart: document.getElementById('booklet2PageStart'),
  booklet2PageEnd: document.getElementById('booklet2PageEnd'),
  booklet2Hours: document.getElementById('booklet2Hours'),
  booklet2Minutes: document.getElementById('booklet2Minutes'),
  booklet2Seconds: document.getElementById('booklet2Seconds'),
  correctStat: document.getElementById('correctStat'),
  wrongStat: document.getElementById('wrongStat'),
  answeredStat: document.getElementById('answeredStat'),
  ungradedStat: document.getElementById('ungradedStat'),
  jumpInput: document.getElementById('jumpInput'),
  jumpBtn: document.getElementById('jumpBtn'),
  clearBtn: document.getElementById('clearBtn'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),
  historyList: document.getElementById('historyList'),
  previewShell: document.getElementById('previewShell'),
  previewPlaceholder: document.getElementById('previewPlaceholder'),
  pdfViewer: document.getElementById('pdfViewer'),
  imageViewer: document.getElementById('imageViewer'),
  previewMeta: document.getElementById('previewMeta'),
  previewFootLeft: document.getElementById('previewFootLeft'),
  previewFootRight: document.getElementById('previewFootRight'),
  fitBtn: document.getElementById('fitBtn'),
  fsBtn: document.getElementById('fsBtn'),
  examTitle: document.getElementById('examTitle'),
  questionCount: document.getElementById('questionCount'),
  languageMode: document.getElementById('languageMode'),
  negativeMarking: document.getElementById('negativeMarking'),
  previewInfo: document.getElementById('previewInfo'),
  hours: document.getElementById('hours'),
  minutes: document.getElementById('minutes'),
  seconds: document.getElementById('seconds'),
  keyExcelInput: document.getElementById('keyExcelInput'),
  downloadTemplateBtn: document.getElementById('downloadTemplateBtn'),
  applyManualKeyBtn: document.getElementById('applyManualKeyBtn'),
  previewFileInput: document.getElementById('previewFileInput'),
  selectedFileInfo: document.getElementById('selectedFileInfo'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  resetConfigBtn: document.getElementById('resetConfigBtn'),
  manualJsonOut: document.getElementById('manualJsonOut'),
  exportHistoryBtn: document.getElementById('exportHistoryBtn')
};

function pad2(n){ return String(n).padStart(2, '0'); }

function fmtTime(sec){
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(r)}`;
}

function readLocal(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  }catch(e){
    return fallback;
  }
}
function saveLocal(key, value){
  try{ localStorage.setItem(key, JSON.stringify(value)); }catch(e){}
}
function setStatus(kind, text){
  els.statusPill.className = `pill ${kind}`;
  els.statusPill.textContent = text;
}
function openModal(modal){
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}
function closeModal(modal){
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}
function stopTimer(){
  if(state.timerId){
    clearInterval(state.timerId);
    state.timerId = null;
  }
}
function updateTimerUI(sec){
  els.timerDisplay.textContent = fmtTime(sec);
}
function clearPreview(){
  if(state.preview.url){
    try{ URL.revokeObjectURL(state.preview.url); }catch(e){}
  }
  state.preview = { url:'', type:'', name:'' };
  els.previewPlaceholder.style.display = 'flex';
  els.pdfViewer.classList.remove('active');
  els.imageViewer.classList.remove('active');
  els.pdfViewer.removeAttribute('data');
  els.imageViewer.removeAttribute('src');
  els.previewMeta.textContent = 'فایل هنوز بارگذاری نشده است.';
  els.previewFootLeft.textContent = 'بدون فایل فعال';
  els.previewFootRight.textContent = 'پیش‌نمایش داخلی و اسکرول‌دار';
  const previewLabel = state.config?.previewName ? `${state.config.previewName} (اطلاعات بازیابی شد)` : 'هنوز فایلی انتخاب نشده است.';
  els.previewInfo.value = previewLabel;
  els.selectedFileInfo.textContent = previewLabel;
}
function showPreviewFromFile(file){
  if(!file) return;
  if(state.preview.url){
    try{ URL.revokeObjectURL(state.preview.url); }catch(e){}
  }
  const url = URL.createObjectURL(file);
  state.preview = { url, type: file.type || '', name: file.name || '' };
  els.previewMeta.textContent = `${file.name} • ${file.type || 'unknown'}`;
  els.previewFootLeft.textContent = file.name;
  els.previewFootRight.textContent = file.type || 'unknown type';
  els.previewInfo.value = file.name;
  els.selectedFileInfo.textContent = file.name;
  els.previewPlaceholder.style.display = 'none';

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if(isPdf){
    els.imageViewer.classList.remove('active');
    els.imageViewer.removeAttribute('src');
    els.pdfViewer.data = url;
    els.pdfViewer.classList.add('active');
  }else{
    els.pdfViewer.classList.remove('active');
    els.pdfViewer.removeAttribute('data');
    els.imageViewer.src = url;
    els.imageViewer.classList.add('active');
  }
}
function renderHistory(){
  const items = readLocal(STORAGE_KEYS.submissions, []);
  els.historyList.innerHTML = '';
  if(!items.length){
    els.historyList.innerHTML = '<div class="muted" style="padding:12px;">هنوز هیچ آزمون ثبت‌شده‌ای ذخیره نشده است.</div>';
    return;
  }
  items.slice().reverse().forEach((rec) => {
    const details = document.createElement('details');
    details.className = 'history-card history-accordion';
    details.dataset.recordId = rec.id || '';
    const bookletSummary = Array.isArray(rec.bookletResults) && rec.bookletResults.length
      ? rec.bookletResults.map((b, idx) => `${b.title || `دفترچه ${idx + 1}`}: ${typeof b.score === 'number' ? `${b.score.toFixed(2)} از ۲۰` : '—'}`).join(' | ')
      : '';
    details.innerHTML = `
      <summary>
        <span>${rec.examTitle || 'آزمون بدون عنوان'}</span>
        <span>${typeof rec.score === 'number' ? `${rec.score.toFixed(2)} از ۲۰` : '—'} • ${rec.pendingCorrection ? 'در انتظار کلید' : 'نهایی'}</span>
      </summary>
      <div class="history-body">
        <div class="line">تاریخ ثبت: ${rec.submittedAt}</div>
        <div class="line">نمره منفی: ${(rec.negativeMarkingEnabled ?? normalizeNegativeMarking(rec.negativeMarking)) ? 'دارد' : 'ندارد'} | تراز: ${rec.taz ?? '—'} | درصد: ${typeof rec.percentage === 'number' ? rec.percentage.toFixed(2) + '%' : '—'}</div>
        <div class="line">صحیح: ${rec.correct} | غلط: ${rec.wrong} | بی‌پاسخ: ${rec.blank}</div>
        <div class="line">کلیددار: ${rec.gradedQuestionCount ?? rec.keyedQuestionCount ?? (rec.questionCount - (rec.ungraded || 0))} | بدون کلید: ${typeof rec.ungraded === 'number' ? rec.ungraded : Math.max(0, rec.questionCount - (rec.gradedQuestionCount ?? rec.keyedQuestionCount ?? 0))}</div>
        ${bookletSummary ? `<div class="line">${bookletSummary}</div>` : ''}
        ${rec.pendingCorrection ? '<div class="history-actions"><button class="mini-btn grade-history-btn" type="button">تصحیح این آزمون</button></div>' : ''}
      </div>
    `;
    els.historyList.appendChild(details);
  });
}
function renderKeyTable(){
  const n = Math.max(1, getTotalQuestionCount());
  state.questionCount = n;
  els.keyTableBody.innerHTML = '';
  for(let i = 1; i <= n; i++){
    const bookletLabel = getBookletLabelForQuestion(i);
    const row = document.createElement('tr');
    row.dataset.question = `q${i}`;
    row.innerHTML = `
      <th class="body">${i}</th>
      <td class="booklet-cell">${bookletLabel}</td>
      <td><label class="key-cell"><input type="checkbox" data-q="q${i}" data-v="1"></label></td>
      <td><label class="key-cell"><input type="checkbox" data-q="q${i}" data-v="2"></label></td>
      <td><label class="key-cell"><input type="checkbox" data-q="q${i}" data-v="3"></label></td>
      <td><label class="key-cell"><input type="checkbox" data-q="q${i}" data-v="4"></label></td>
    `;
    els.keyTableBody.appendChild(row);
  }
  const key = state.correctAnswers || {};
  els.keyTableBody.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.checked = String(key[cb.dataset.q] || '') === cb.dataset.v;
  });
}
function renderAnswerSheet(){
  const range = getCurrentBookletRange();
  const n = Math.max(1, state.questionCount || getTotalQuestionCount());
  const start = range.start || 1;
  const end = range.end || n;
  els.answerSheetBody.innerHTML = '';
  for(let i = start; i <= end; i++){
    const tr = document.createElement('tr');
    tr.dataset.question = `q${i}`;
    const page = getQuestionPage(i) || '—';
    tr.innerHTML = `
      <th class="body">${i}</th>
      <td class="booklet-cell">${getBookletLabelForQuestion(i)}</td>
      <td class="page-cell">${page}</td>
      <td><label class="choice-cell"><input type="checkbox" class="ans" data-q="q${i}" data-v="1" disabled></label></td>
      <td><label class="choice-cell"><input type="checkbox" class="ans" data-q="q${i}" data-v="2" disabled></label></td>
      <td><label class="choice-cell"><input type="checkbox" class="ans" data-q="q${i}" data-v="3" disabled></label></td>
      <td><label class="choice-cell"><input type="checkbox" class="ans" data-q="q${i}" data-v="4" disabled></label></td>
    `;
    els.answerSheetBody.appendChild(tr);
  }
  syncAnswerSheetState();
  updateStats();
  renderBookletBar();
}
function syncAnswerSheetState(){
  els.answerSheetBody.querySelectorAll('tr').forEach(row => {
    const q = row.dataset.question;
    const selected = state.answers[q];
    row.classList.toggle('answered', !!selected);
    row.querySelectorAll('input.ans').forEach(inp => {
      inp.checked = String(selected || '') === inp.dataset.v;
      inp.disabled = !state.running;
    });
  });
}
function updateStats(){
  const range = getCurrentBookletRange();
  let answered = 0;
  let correct = 0;
  let wrong = 0;
  let ungraded = 0;
  const start = range.start || 1;
  const end = range.end || state.questionCount;

  for(let i = start; i <= end; i++){
    const q = `q${i}`;
    const u = state.answers[q];
    const c = state.correctAnswers[q];
    if(!c){
      ungraded++;
      continue;
    }
    if(!u) continue;
    answered++;
    if(String(u) === String(c)) correct++;
    else wrong++;
  }

  if(els.answeredStat) els.answeredStat.textContent = String(answered);
  if(els.ungradedStat) els.ungradedStat.textContent = String(ungraded);
  if(els.correctStat) els.correctStat.textContent = String(correct);
  if(els.wrongStat) els.wrongStat.textContent = String(wrong);

  const statsWrap = document.getElementById('answerStats');
  if(statsWrap) statsWrap.style.display = state.running ? 'none' : '';

  if(els.sheetSub) els.sheetSub.textContent = `${range.booklet?.title || 'دفترچه'} | ${end - start + 1} سؤال | ${answered} پاسخ ثبت‌شده${ungraded ? ` | ${ungraded} بدون کلید` : ''}`;
  if(els.sheetMeta) els.sheetMeta.textContent = state.running ? 'آزمون در حال اجراست؛ پاسخ‌ها برای دفترچه فعال ثبت می‌شوند.' : 'برای فعال شدن پاسخ‌برگ، آزمون را شروع کن.';
  if(els.bookletMeta){
    const mode = normalizeBookletMode(state.config.bookletMode);
    if(mode === 'double'){
      const active = getCurrentBooklet();
      els.bookletMeta.textContent = `دفترچه فعال: ${active.title} • ${fmtTime(state.remainingSec || active.durationSec)} باقی‌مانده`;
    }else{
      els.bookletMeta.textContent = `حالت یک دفترچه • ${state.questionCount} سؤال`;
    }
  }
  refreshActionButtons();
}
function normalizeKeyValue(v){
  const s = String(v || '').trim();
  if(['1','2','3','4'].includes(s)) return s;
  const map = { 'الف':'1', 'ب':'2', 'پ':'3', 'ت':'4', 'a':'1', 'b':'2', 'c':'3', 'd':'4' };
  return map[s.toLowerCase()] || '';
}
function parseKeyRowsFromJSON(rows){
  const map = {};
  rows.forEach(row => {
    const q = row.question_no ?? row.question ?? row['شماره سوال'] ?? row['سؤال'] ?? row['ردیف'];
    const a = row.answer ?? row.key ?? row['پاسخ'] ?? row['کلید'];
    const qi = parseInt(q, 10);
    const av = normalizeKeyValue(a);
    if(qi && av) map[`q${qi}`] = av;
  });
  return map;
}
function applyKeyToUI(map){
  state.correctAnswers = { ...map };
  els.keyTableBody.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.checked = String(map[cb.dataset.q] || '') === cb.dataset.v;
  });
  applyQuestionPagesToUI(state.questionPages);
  updateStats();
}
async function importKeyFile(file){
  if(!file) return;
  const name = file.name.toLowerCase();
  if(name.endsWith('.csv')){
    const text = await file.text();
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if(lines.length < 2){
      alert('فایل CSV معتبر نیست.');
      return;
    }
    const headers = lines[0].split(',').map(s => s.trim().toLowerCase());
    const qiIndex = headers.findIndex(h => ['question_no','question','شماره سوال','ردیف'].includes(h));
    const ansIndex = headers.findIndex(h => ['answer','key','پاسخ','کلید'].includes(h));
    const map = {};
    for(let i = 1; i < lines.length; i++){
      const cols = lines[i].split(',').map(s => s.trim());
      const q = parseInt(cols[qiIndex >= 0 ? qiIndex : 0], 10);
      const a = normalizeKeyValue(cols[ansIndex >= 0 ? ansIndex : 1]);
      if(q && a) map[`q${q}`] = a;
    }
    applyKeyToUI(map);
    saveLocal(STORAGE_KEYS.config, {
      ...state.config,
      correctAnswers: state.correctAnswers,
      previewName: state.preview.name || state.config.previewName || '',
      previewType: state.preview.type || state.config.previewType || ''
    });
    return;
  }

  if(!window.XLSX){
    alert('کتابخانه Excel در دسترس نیست. لطفاً فایل را به CSV تبدیل کن یا از کلید دستی استفاده کن.');
    return;
  }

  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });
  const first = wb.SheetNames[0];
  const ws = wb.Sheets[first];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  const map = parseKeyRowsFromJSON(rows);
  applyKeyToUI(map);
  saveLocal(STORAGE_KEYS.config, {
    ...state.config,
    correctAnswers: state.correctAnswers,
    previewName: state.preview.name || state.config.previewName || '',
    previewType: state.preview.type || state.config.previewType || ''
  });
}
function collectManualKey(){
  const map = {};
  els.keyTableBody.querySelectorAll('tr').forEach(tr => {
    const q = tr.dataset.question;
    const checked = tr.querySelector('input[type="checkbox"]:checked');
    if(checked) map[q] = checked.dataset.v;
  });
  return map;
}
function collectManualPages(){
  const pages = {};
  const booklets = getBookletsFromConfig();
  booklets.forEach((b) => {
    const label = b.pageStart === b.pageEnd ? String(b.pageStart) : `${b.pageStart}-${b.pageEnd}`;
    for(let i = b.start; i <= b.end; i++) pages[`q${i}`] = label;
  });
  state.questionPages = pages;
  return pages;
}
function renderManagementText(){
  els.manualJsonOut.value = JSON.stringify({
    config: state.config,
    questionPages: state.questionPages,
    correctAnswers: state.correctAnswers
  }, null, 2);
}

function makeRecordId(){
  if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
  return `rec_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}


function normalizeNegativeMarking(value){
  const v = String(value ?? '').trim().toLowerCase();
  return ['yes', 'true', '1', 'on', 'enabled', 'y', 'بله', 'دارد'].includes(v);
}

function negativeMarkingLabel(value){
  return normalizeNegativeMarking(value) ? 'دارد' : 'ندارد';
}

function toInt(value, fallback = 0){
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function toFloat(value, fallback = 0){
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

function durationPartsToSec(hours, minutes, seconds){
  return Math.max(0, (toInt(hours) * 3600) + (toInt(minutes) * 60) + toInt(seconds));
}

function secToParts(sec){
  const total = Math.max(0, toInt(sec));
  return {
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60
  };
}

function normalizeBookletMode(value){
  return String(value ?? 'single').toLowerCase() === 'double' ? 'double' : 'single';
}

function getBookletsFromConfig(cfg = state.config){
  const mode = normalizeBookletMode(cfg.bookletMode);
  const b1Count = Math.max(1, toInt(cfg.booklet1QuestionCount ?? cfg.questionCount, 20));
  const b1DurationSec = durationPartsToSec(cfg.booklet1Hours ?? cfg.hours, cfg.booklet1Minutes ?? cfg.minutes, cfg.booklet1Seconds ?? cfg.seconds);
  const b1Pages = { start: Math.max(1, toInt(cfg.booklet1PageStart ?? 1, 1)), end: Math.max(1, toInt(cfg.booklet1PageEnd ?? 1, 1)) };
  const booklets = [{
    index: 0,
    key: 'booklet1',
    title: String(cfg.booklet1Title || '').trim() || 'دفترچه اول',
    questionCount: b1Count,
    durationSec: b1DurationSec,
    coefficient: Math.max(0.1, toFloat(cfg.booklet1Coefficient ?? 1, 1)),
    start: 1,
    end: b1Count,
    pageStart: Math.min(b1Pages.start, b1Pages.end),
    pageEnd: Math.max(b1Pages.start, b1Pages.end)
  }];
  if(mode === 'double'){
    const b2Count = Math.max(1, toInt(cfg.booklet2QuestionCount, 20));
    const b2DurationSec = durationPartsToSec(cfg.booklet2Hours, cfg.booklet2Minutes, cfg.booklet2Seconds);
    const start = b1Count + 1;
    const b2Pages = { start: Math.max(1, toInt(cfg.booklet2PageStart ?? (booklets[0].pageEnd + 1), booklets[0].pageEnd + 1)), end: Math.max(1, toInt(cfg.booklet2PageEnd ?? (booklets[0].pageEnd + 1), booklets[0].pageEnd + 1)) };
    booklets.push({
      index: 1,
      key: 'booklet2',
      title: String(cfg.booklet2Title || '').trim() || 'دفترچه دوم',
      questionCount: b2Count,
      durationSec: b2DurationSec,
      coefficient: Math.max(0.1, toFloat(cfg.booklet2Coefficient ?? 1, 1)),
      start,
      end: start + b2Count - 1,
      pageStart: Math.min(b2Pages.start, b2Pages.end),
      pageEnd: Math.max(b2Pages.start, b2Pages.end)
    });
  }
  return booklets;
}

function getTotalQuestionCount(cfg = state.config){
  return getBookletsFromConfig(cfg).reduce((sum, b) => sum + b.questionCount, 0);
}

function getTotalDurationSec(cfg = state.config){
  return getBookletsFromConfig(cfg).reduce((sum, b) => sum + b.durationSec, 0);
}

function getQuestionBookletIndex(questionNo, cfg = state.config){
  const q = toInt(questionNo, 0);
  const booklets = getBookletsFromConfig(cfg);
  const found = booklets.find(b => q >= b.start && q <= b.end);
  return found ? found.index : 0;
}

function getQuestionPage(questionNo){
  const key = `q${questionNo}`;
  const page = state.questionPages?.[key];
  if(page) return String(page);
  const booklet = getBookletsFromConfig().find(b => questionNo >= b.start && questionNo <= b.end);
  if(!booklet) return '';
  return booklet.pageStart === booklet.pageEnd ? String(booklet.pageStart) : `${booklet.pageStart}-${booklet.pageEnd}`;
}

function getCurrentBookletIndex(){
  const booklets = getBookletsFromConfig();
  if(!booklets.length) return 0;
  return Math.min(Math.max(0, state.activeBookletIndex || 0), booklets.length - 1);
}

function getCurrentBooklet(){
  const booklets = getBookletsFromConfig();
  return booklets[getCurrentBookletIndex()] || booklets[0];
}

function getCurrentBookletRange(){
  const booklet = getCurrentBooklet();
  return { start: booklet.start, end: booklet.end, booklet };
}

function setQuestionPagesFromUI(){
  return collectManualPages();
}

function applyQuestionPagesToUI(map = state.questionPages || {}){
  return map;
}

function renderBookletBar(){
  if(!els.bookletBar) return;
  const booklets = getBookletsFromConfig();
  if(!booklets.length){
    els.bookletBar.innerHTML = '';
    return;
  }
  const active = getCurrentBookletIndex();
  const doubleMode = normalizeBookletMode(state.config.bookletMode) === 'double';
  els.bookletBar.innerHTML = booklets.map((b, idx) => {
    const locked = doubleMode && idx < active;
    const activeClass = idx === active ? 'active' : '';
    const lockedClass = locked ? 'locked' : '';
    const disabled = locked ? 'disabled' : '';
    return `<button type="button" class="booklet-pill ${activeClass} ${lockedClass}" data-booklet-index="${idx}" ${disabled}>${b.title} • ${b.questionCount} سؤال • ${fmtTime(b.durationSec)}</button>`;
  }).join('');
}

function updateBookletUI(){
  const booklets = getBookletsFromConfig();
  const totalQuestions = getTotalQuestionCount();
  const totalDuration = getTotalDurationSec();
  state.questionCount = totalQuestions;
  state.durationSec = state.durationSec || totalDuration;
  if(els.questionCount) els.questionCount.value = String(totalQuestions);
  if(els.bookletMode) els.bookletMode.value = normalizeBookletMode(state.config.bookletMode);
  if(els.booklet1Title) els.booklet1Title.value = state.config.booklet1Title || 'دفترچه اول';
  if(els.booklet1QuestionCount) els.booklet1QuestionCount.value = String(state.config.booklet1QuestionCount ?? totalQuestions);
  if(els.booklet1Hours) els.booklet1Hours.value = String(state.config.booklet1Hours ?? state.config.hours ?? 0);
  if(els.booklet1Minutes) els.booklet1Minutes.value = String(state.config.booklet1Minutes ?? state.config.minutes ?? 30);
  if(els.booklet1Seconds) els.booklet1Seconds.value = String(state.config.booklet1Seconds ?? state.config.seconds ?? 0);
  if(els.booklet2Title) els.booklet2Title.value = state.config.booklet2Title || 'دفترچه دوم';
  if(els.booklet2QuestionCount) els.booklet2QuestionCount.value = String(state.config.booklet2QuestionCount ?? 0);
  if(els.booklet2Hours) els.booklet2Hours.value = String(state.config.booklet2Hours ?? 0);
  if(els.booklet2Minutes) els.booklet2Minutes.value = String(state.config.booklet2Minutes ?? 25);
  if(els.booklet2Seconds) els.booklet2Seconds.value = String(state.config.booklet2Seconds ?? 0);
  if(els.bookletConfig2) els.bookletConfig2.style.display = normalizeBookletMode(state.config.bookletMode) === 'double' ? '' : 'none';
  if(els.bookletConfig1) els.bookletConfig1.classList.toggle('full-width', normalizeBookletMode(state.config.bookletMode) !== 'double');
  renderBookletBar();
  refreshActionButtons();
}

function getBookletLabelForQuestion(questionNo){
  const idx = getQuestionBookletIndex(questionNo);
  const booklets = getBookletsFromConfig();
  return booklets[idx]?.title || `دفترچه ${idx + 1}`;
}

function getQuestionRangeForBookletIndex(index){
  const booklets = getBookletsFromConfig();
  const booklet = booklets[index] || booklets[0];
  return booklet ? { start: booklet.start, end: booklet.end, booklet } : { start: 1, end: 1, booklet: null };
}

function refreshActionButtons(){
  if(!els.finishBtn) return;
  const booklets = getBookletsFromConfig();
  const active = getCurrentBookletIndex();
  if(state.running && normalizeBookletMode(state.config.bookletMode) === 'double' && active === 0 && booklets[1]){
    els.finishBtn.textContent = 'دفترچه بعدی';
  }else{
    els.finishBtn.textContent = 'ثبت نهایی';
  }
}

function syncConfigFromUI(){
  if(!els) return;
  state.config.negativeMarking = els.negativeMarking?.value || state.config.negativeMarking || 'no';
  state.config.bookletMode = normalizeBookletMode(els.bookletMode?.value || state.config.bookletMode);
  state.config.booklet1Title = (els.booklet1Title?.value || state.config.booklet1Title || 'دفترچه اول').trim();
  state.config.booklet1QuestionCount = Math.max(1, toInt(els.booklet1QuestionCount?.value || state.config.booklet1QuestionCount || state.questionCount || 20, 20));
  state.config.booklet1Hours = Math.max(0, toInt(els.booklet1Hours?.value || state.config.booklet1Hours || 0, 0));
  state.config.booklet1Minutes = Math.max(0, toInt(els.booklet1Minutes?.value || state.config.booklet1Minutes || 0, 0));
  state.config.booklet1Seconds = Math.max(0, toInt(els.booklet1Seconds?.value || state.config.booklet1Seconds || 0, 0));
  state.config.booklet2Title = (els.booklet2Title?.value || state.config.booklet2Title || 'دفترچه دوم').trim();
  state.config.booklet2QuestionCount = Math.max(1, toInt(els.booklet2QuestionCount?.value || state.config.booklet2QuestionCount || 0, 0));
  state.config.booklet2Hours = Math.max(0, toInt(els.booklet2Hours?.value || state.config.booklet2Hours || 0, 0));
  state.config.booklet2Minutes = Math.max(0, toInt(els.booklet2Minutes?.value || state.config.booklet2Minutes || 0, 0));
  state.config.booklet2Seconds = Math.max(0, toInt(els.booklet2Seconds?.value || state.config.booklet2Seconds || 0, 0));
  state.config.examTitle = els.examTitle?.value?.trim?.() || state.config.examTitle || '';
  state.config.languageMode = els.languageMode?.value || state.config.languageMode || 'fa';
  state.config.questionPages = { ...state.questionPages };
  state.questionCount = getTotalQuestionCount(state.config);
  state.durationSec = getTotalDurationSec(state.config);
}

function evaluateRange(answers, correctAnswers, startQuestion, endQuestion, negativeMarking){
  const start = Math.max(1, toInt(startQuestion, 1));
  const end = Math.max(start, toInt(endQuestion, start));
  const questionTotal = end - start + 1;
  let correct = 0;
  let wrong = 0;
  let blank = 0;
  let answered = 0;
  let gradedQuestionCount = 0;

  for(let i = start; i <= end; i++){
    const q = `q${i}`;
    const u = answers?.[q];
    const c = correctAnswers?.[q];
    if(!c || !String(c).trim()) continue;
    gradedQuestionCount++;
    if(!u){
      blank++;
      continue;
    }
    answered++;
    if(String(u) === String(c)) correct++;
    else wrong++;
  }

  const ungraded = Math.max(0, questionTotal - gradedQuestionCount);
  const complete = ungraded === 0;
  const denominator = gradedQuestionCount * 3;
  const negativeEnabled = normalizeNegativeMarking(negativeMarking);
  const rawScore = gradedQuestionCount
    ? (negativeEnabled ? (correct * 3 - wrong) : correct * 3)
    : null;
  const percentage = gradedQuestionCount && denominator ? ((rawScore / denominator) * 100) : null;
  const score = gradedQuestionCount && denominator
    ? Math.max(0, Math.min(20, (rawScore / denominator) * 20))
    : null;
  const taz = gradedQuestionCount ? buildTazApprox({ percentage, correct, wrong, blank }) : null;

  return {
    questionCount: questionTotal,
    gradedQuestionCount,
    keyedQuestionCount: gradedQuestionCount,
    correct,
    wrong,
    blank,
    answered,
    ungraded,
    complete,
    rawScore,
    score,
    percentage,
    taz,
    negativeMarkingEnabled: negativeEnabled
  };
}

function evaluateSubmission(answers, correctAnswers, count, negativeMarking){
  const total = Math.max(1, toInt(count || state.questionCount || 1, 1));
  return evaluateRange(answers, correctAnswers, 1, total, negativeMarking);
}

function evaluateBooklets(answers, correctAnswers, cfg = state.config){
  const booklets = getBookletsFromConfig(cfg);
  const bookletResults = booklets.map((b) => {
    const evalB = evaluateRange(answers, correctAnswers, b.start, b.end, cfg.negativeMarking);
    const coefficient = Math.max(0.1, toFloat(b.coefficient, 1));
    return {
      ...evalB,
      bookletIndex: b.index,
      title: b.title,
      coefficient,
      pageStart: b.pageStart,
      pageEnd: b.pageEnd,
      weightedPercentage: Number.isFinite(evalB.percentage) ? evalB.percentage * coefficient : null,
      weightedScore: Number.isFinite(evalB.score) ? evalB.score * coefficient : null
    };
  });
  const totalQuestionCount = booklets.reduce((sum, b) => sum + b.questionCount, 0);
  const totalDurationSec = booklets.reduce((sum, b) => sum + b.durationSec, 0);
  const overall = bookletResults.reduce((acc, b) => {
    acc.correct += b.correct;
    acc.wrong += b.wrong;
    acc.blank += b.blank;
    acc.answered += b.answered;
    acc.ungraded += b.ungraded;
    acc.gradedQuestionCount += b.gradedQuestionCount;
    if(Number.isFinite(b.percentage)){
      acc.weightSum += b.coefficient;
      acc.weightedPercentageSum += b.percentage * b.coefficient;
    }
    return acc;
  }, { correct: 0, wrong: 0, blank: 0, answered: 0, ungraded: 0, gradedQuestionCount: 0, weightSum: 0, weightedPercentageSum: 0 });
  overall.complete = overall.ungraded === 0;
  overall.percentage = overall.weightSum ? (overall.weightedPercentageSum / overall.weightSum) : null;
  overall.score = Number.isFinite(overall.percentage) ? Math.max(0, Math.min(20, (overall.percentage / 100) * 20)) : null;
  overall.taz = Number.isFinite(overall.percentage) ? buildTazApprox({ percentage: overall.percentage }) : null;
  overall.rawScore = Number.isFinite(overall.score) ? (overall.score / 20) : null;
  overall.keyedQuestionCount = overall.gradedQuestionCount;
  overall.negativeMarkingEnabled = normalizeNegativeMarking(cfg.negativeMarking);
  return { booklets, bookletResults, totalQuestionCount, totalDurationSec, overall };
}


function saveDraft(){
  if(!state.running && !state.startedAt) return;
  const draft = {
    savedAt: new Date().toISOString(),
    running: state.running,
    finished: state.finished,
    startedAt: state.startedAt,
    activeBookletIndex: state.activeBookletIndex || 0,
    durationSec: state.durationSec,
    remainingSec: state.remainingSec,
    questionCount: state.questionCount,
    answers: { ...state.answers },
    questionPages: { ...state.questionPages },
    correctAnswers: { ...state.correctAnswers },
    bookletStates: Array.isArray(state.bookletStates) ? state.bookletStates.map(s => ({ ...s })) : [],
    config: { ...state.config, questionCount: state.questionCount, questionPages: { ...state.questionPages } },
    preview: {
      name: state.preview.name || '',
      type: state.preview.type || '',
      url: ''
    }
  };
  saveLocal(STORAGE_KEYS.draft, draft);
}

function clearDraft(){
  try{ localStorage.removeItem(STORAGE_KEYS.draft); }catch(e){}
}

function updateSubmissionRecord(updated){
  const items = readLocal(STORAGE_KEYS.submissions, []);
  const idx = items.findIndex(item => item.id === updated.id);
  if(idx >= 0) items[idx] = updated;
  else items.push(updated);
  saveLocal(STORAGE_KEYS.submissions, items);
  renderHistory();
}

function gradeRecord(record, keyMap){
  const cfg = {
    bookletMode: record.bookletMode || (Array.isArray(record.booklets) && record.booklets.length > 1 ? 'double' : 'single'),
    booklet1Title: record.booklets?.[0]?.title || 'دفترچه اول',
    booklet1QuestionCount: record.booklets?.[0]?.questionCount || record.questionCount || 20,
    booklet1Hours: secToParts(record.booklets?.[0]?.durationSec || record.durationSec || 0).hours,
    booklet1Minutes: secToParts(record.booklets?.[0]?.durationSec || record.durationSec || 0).minutes,
    booklet1Seconds: secToParts(record.booklets?.[0]?.durationSec || record.durationSec || 0).seconds,
    booklet2Title: record.booklets?.[1]?.title || 'دفترچه دوم',
    booklet2QuestionCount: record.booklets?.[1]?.questionCount || 0,
    booklet2Hours: secToParts(record.booklets?.[1]?.durationSec || 0).hours,
    booklet2Minutes: secToParts(record.booklets?.[1]?.durationSec || 0).minutes,
    booklet2Seconds: secToParts(record.booklets?.[1]?.durationSec || 0).seconds,
    negativeMarking: record.negativeMarking
  };
  const evaluation = evaluateBooklets(record.answers, keyMap, cfg);
  return {
    ...record,
    ...evaluation.overall,
    bookletResults: evaluation.bookletResults,
    booklets: evaluation.booklets,
    totalQuestionCount: evaluation.totalQuestionCount,
    totalDurationSec: evaluation.totalDurationSec,
    correctAnswers: { ...keyMap },
    gradedAt: new Date().toISOString(),
    graded: evaluation.overall.complete,
    pendingCorrection: !evaluation.overall.complete,
    correctionStatus: evaluation.overall.complete ? 'graded' : 'pending'
  };
}

function restoreDraft(){
  const draft = readLocal(STORAGE_KEYS.draft, null);
  if(!draft || !draft.running) return false;

  state.config = { ...state.config, ...(draft.config || {}) };
  state.questionPages = { ...(draft.questionPages || state.config.questionPages || {}) };
  state.questionCount = Math.max(1, toInt(draft.questionCount || state.config.questionCount || state.questionCount, 10));
  state.durationSec = Math.max(0, toInt(draft.durationSec || state.durationSec || 0, 10));
  state.activeBookletIndex = Math.max(0, toInt(draft.activeBookletIndex || 0, 10));
  state.bookletStates = Array.isArray(draft.bookletStates) && draft.bookletStates.length
    ? draft.bookletStates.map((s, idx) => ({
        index: idx,
        remainingSec: Math.max(0, toInt(s.remainingSec, 0)),
        durationSec: Math.max(0, toInt(s.durationSec, 0)),
        completed: !!s.completed,
        startedAt: s.startedAt || null
      }))
    : getBookletsFromConfig(state.config).map((b, idx) => ({ index: idx, remainingSec: b.durationSec, durationSec: b.durationSec, completed: false, startedAt: null }));

  state.remainingSec = state.bookletStates[state.activeBookletIndex]?.remainingSec ?? state.durationSec;
  state.startedAt = draft.startedAt || new Date().toISOString();
  state.answers = { ...(draft.answers || {}) };
  state.correctAnswers = { ...(draft.correctAnswers || {}) };
  state.finished = false;
  state.lastResult = null;

  els.examTitle.value = state.config.examTitle || '';
  if(els.languageMode) els.languageMode.value = state.config.languageMode || 'fa';
  if(els.negativeMarking) els.negativeMarking.value = state.config.negativeMarking || 'no';
  updateBookletUI();
  renderKeyTable();
  renderAnswerSheet();
  applyKeyToUI(state.correctAnswers);
  enableRunningState(true);
  updateTimerUI(state.remainingSec);
  setStatus('running', 'ادامه‌ی آزمون بازیابی شد');
  updateStats();
  refreshActionButtons();

  if(state.remainingSec <= 0){
    finishExam(true);
    return true;
  }

  startTimer(true);
  return true;
}

function buildTazApprox(record){
  return Number.isFinite(record?.percentage) ? Math.round(record.percentage * 1000) : null;
}
function buildResultRecord(){
  syncConfigFromUI();
  const evaluation = evaluateBooklets(state.answers, state.correctAnswers, state.config);
  return {
    id: makeRecordId(),
    examTitle: state.config.examTitle || 'آزمون',
    submittedAt: new Date().toLocaleString('fa-IR'),
    questionCount: evaluation.totalQuestionCount,
    totalQuestionCount: evaluation.totalQuestionCount,
    totalDurationSec: evaluation.totalDurationSec,
    booklets: evaluation.booklets,
    bookletResults: evaluation.bookletResults,
    bookletMode: state.config.bookletMode,
    gradedQuestionCount: evaluation.overall.gradedQuestionCount,
    keyedQuestionCount: evaluation.overall.keyedQuestionCount ?? evaluation.overall.gradedQuestionCount,
    correct: evaluation.overall.correct,
    wrong: evaluation.overall.wrong,
    blank: evaluation.overall.blank,
    ungraded: evaluation.overall.ungraded,
    answered: evaluation.overall.answered,
    score: evaluation.overall.score,
    maxScore: 20,
    percentage: evaluation.overall.percentage,
    taz: evaluation.overall.taz,
    graded: evaluation.overall.complete,
    pendingCorrection: !evaluation.overall.complete,
    answers: { ...state.answers },
    questionPages: { ...state.questionPages },
    correctAnswers: { ...state.correctAnswers },
    durationSec: evaluation.totalDurationSec,
    startedAt: state.startedAt,
    finishedAt: new Date().toISOString(),
    languageMode: state.config.languageMode,
    negativeMarking: state.config.negativeMarking,
    negativeMarkingEnabled: evaluation.overall.negativeMarkingEnabled,
    negativeMarkingLabel: negativeMarkingLabel(state.config.negativeMarking),
    correctionStatus: evaluation.overall.complete ? 'graded' : 'pending'
  };
}

function renderResultModal(record){
  const bookletCards = Array.isArray(record.bookletResults) && record.bookletResults.length
    ? record.bookletResults.map((b, idx) => `
        <div class="result-booklet-card">
          <div class="title">${b.title || `دفترچه ${idx + 1}`}</div>
          <div class="line">سؤال‌ها: ${b.questionCount}</div>
          <div class="line">نمره: ${typeof b.score === 'number' ? `${b.score.toFixed(2)} از ۲۰` : '—'}</div>
          <div class="line">درصد: ${typeof b.percentage === 'number' ? `${b.percentage.toFixed(2)}%` : '—'}</div>
          <div class="line">صحیح: ${b.correct} | غلط: ${b.wrong} | بی‌پاسخ: ${b.blank}</div>
          <div class="line">کلیددار: ${b.gradedQuestionCount ?? b.keyedQuestionCount ?? 0} | بدون کلید: ${b.ungraded ?? 0}</div>
        </div>
      `).join('')
    : '';

  const rows = [];
  for(let i = 1; i <= record.questionCount; i++){
    const q = `q${i}`;
    const user = record.answers[q] || '—';
    const correct = record.correctAnswers[q];
    const hasKey = !!(correct && String(correct).trim());
    const bookletLabel = getBookletLabelForQuestion(i);
    const page = record.questionPages?.[q] || '—';
    let statusClass = 'status-blank';
    let statusText = 'بدون پاسخ';

    if(!hasKey){
      statusClass = 'status-pending';
      statusText = 'بدون کلید';
    }else if(user === '—'){
      statusClass = 'status-blank';
      statusText = 'بی‌پاسخ';
    }else if(String(user) === String(correct)){
      statusClass = 'status-ok';
      statusText = 'صحیح';
    }else{
      statusClass = 'status-bad';
      statusText = 'غلط';
    }

    rows.push(`
      <tr>
        <td>${i}</td>
        <td>${bookletLabel}</td>
        <td>${page}</td>
        <td>${user}</td>
        <td>${correct || '—'}</td>
        <td>${hasKey ? 'دارد' : 'ندارد'}</td>
        <td class="${statusClass}">${statusText}</td>
      </tr>
    `);
  }

  const keyedCount = Number.isFinite(record.gradedQuestionCount) ? record.gradedQuestionCount : (Number.isFinite(record.keyedQuestionCount) ? record.keyedQuestionCount : Math.max(0, record.questionCount - (record.ungraded || 0)));
  const ungradedCount = Number.isFinite(record.ungraded) ? record.ungraded : Math.max(0, record.questionCount - keyedCount);
  const hasUngraded = ungradedCount > 0;
  els.resultContent.innerHTML = `
    <div class="result-content">
      <div class="result-hero">
        <h4>${record.examTitle}</h4>
        <div class="result-summary">
          <div class="result-item">تراز تقریبی: ${record.taz !== null && record.taz !== undefined ? record.taz : '—'}</div>
          <div class="result-item">درصد: ${record.percentage !== null && record.percentage !== undefined ? `${record.percentage.toFixed(2)}%` : '—'}</div>
          <div class="result-item">نمره از ۲۰: ${record.score !== null && record.score !== undefined ? `${record.score.toFixed(2)} از ۲۰` : '—'}</div>
          <div class="result-item">کلیددار: ${keyedCount}</div>
          <div class="result-item">بدون کلید: ${ungradedCount}</div>
          <div class="result-item">صحیح: ${record.correct}</div>
          <div class="result-item">غلط: ${record.wrong}</div>
          <div class="result-item">بی‌پاسخ: ${record.blank}</div>
          <div class="result-item">زمان آزمون: ${fmtTime(record.durationSec)}</div>
          <div class="result-item">تاریخ ثبت: ${record.submittedAt}</div>
          <div class="result-item">نمره منفی: ${(record.negativeMarkingEnabled ?? normalizeNegativeMarking(record.negativeMarking)) ? 'دارد' : 'ندارد'}</div>
          <div class="result-item">وضعیت تصحیح: ${hasUngraded ? 'بخشی بدون کلید' : 'نهایی'}</div>
        </div>
      </div>

      ${bookletCards ? `<div class="result-booklet-grid">${bookletCards}</div>` : ''}
      ${hasUngraded ? '<div class="pending-banner">بعضی سؤال‌ها هنوز کلید ندارند. این بخش‌ها در درصد و نمره حساب نشده‌اند و فقط در ستون «کلید» با وضعیت «ندارد» مشخص شده‌اند.</div>' : ''}

      <div class="result-table-wrap">
        <table class="result-table">
          <thead>
            <tr>
              <th>سؤال</th>
              <th>دفترچه</th>
              <th>صفحه</th>
              <th>پاسخ داده‌شده</th>
              <th>پاسخ صحیح</th>
              <th>کلید</th>
              <th>وضعیت</th>
            </tr>
          </thead>
          <tbody>${rows.join('')}</tbody>
        </table>
      </div>
    </div>
  `;

  if(els.gradePendingBtn) els.gradePendingBtn.style.display = 'inline-flex';
  state.lastResult = record;
  openModal(els.resultModal);
}
function escapeHtml(str){
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#39;");
}
function buildPrintableReportHtml(record){
  const rows = [];
  for(let i = 1; i <= record.questionCount; i++){
    const q = `q${i}`;
    const user = record.answers[q] || '—';
    const correct = record.correctAnswers[q] || '—';
    const hasKey = !!(record.correctAnswers[q] && String(record.correctAnswers[q]).trim());
    let status = 'بدون پاسخ';
    if(!hasKey){
      status = 'بدون کلید';
    }else if(user === '—'){
      status = 'بی‌پاسخ';
    }else if(String(user) === String(record.correctAnswers[q])){
      status = 'صحیح';
    }else{
      status = 'غلط';
    }
    rows.push(`
      <tr>
        <td>${i}</td>
        <td>${escapeHtml(user)}</td>
        <td>${escapeHtml(correct)}</td>
        <td>${hasKey ? 'دارد' : 'ندارد'}</td>
        <td>${status}</td>
      </tr>
    `);
  }

  const keyedCount = Number.isFinite(record.gradedQuestionCount) ? record.gradedQuestionCount : (Number.isFinite(record.keyedQuestionCount) ? record.keyedQuestionCount : Math.max(0, record.questionCount - (record.ungraded || 0)));
  const ungradedCount = Number.isFinite(record.ungraded) ? record.ungraded : Math.max(0, record.questionCount - keyedCount);
  const pending = ungradedCount > 0;

  return `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>کارنامه آزمون</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Tahoma, Arial, sans-serif; color: #111827; background: #fff; }
  .report { direction: rtl; padding: 0; }
  .hero { border: 1px solid #cbd5e1; border-radius: 18px; padding: 16px 18px; background: linear-gradient(135deg, #eff6ff, #ecfeff); margin-bottom: 14px; }
  .hero h1 { margin: 0 0 8px; font-size: 20px; }
  .meta { color: #475569; font-size: 12px; line-height: 1.9; }
  .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0 16px; }
  .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 10px 12px; font-size: 12px; background: #fff; }
  .card strong { display:block; margin-top:4px; font-size: 15px; }
  .table-wrap { border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  thead th { background: #f8fafc; border-bottom: 1px solid #e5e7eb; padding: 8px 6px; text-align: center; }
  tbody td { border-bottom: 1px solid #e5e7eb; padding: 7px 6px; text-align: center; }
  tbody tr:last-child td { border-bottom: none; }
  .note { margin-top: 12px; color: #64748b; font-size: 11px; line-height: 1.8; }
  .pending { margin: 10px 0 14px; border: 1px dashed #f59e0b; background: #fffbeb; border-radius: 12px; padding: 10px 12px; color: #92400e; font-size: 11px; line-height: 1.8; }
</style>
</head>
<body>
  <div class="report">
    <div class="hero">
      <h1>${escapeHtml(record.examTitle || 'کارنامه آزمون')}</h1>
      <div class="meta">
        تاریخ ثبت: ${escapeHtml(record.submittedAt)}<br />
        زمان آزمون: ${escapeHtml(fmtTime(record.durationSec))}<br />
        نمره منفی: ${(record.negativeMarkingEnabled ?? normalizeNegativeMarking(record.negativeMarking)) ? 'دارد' : 'ندارد'}<br />
        وضعیت: ${pending ? 'بخشی بدون کلید' : 'نهایی'}
      </div>
    </div>

    ${pending ? '<div class="pending">بعضی سؤال‌ها هنوز کلید ندارند؛ این سؤال‌ها در محاسبه‌ی نمره و درصد حساب نشده‌اند.</div>' : ''}

    <div class="summary">
      <div class="card">تراز تقریبی<strong>${record.taz !== null && record.taz !== undefined ? record.taz : '—'}</strong></div>
      <div class="card">درصد<strong>${record.percentage !== null && record.percentage !== undefined ? `${record.percentage.toFixed(2)}%` : '—'}</strong></div>
      <div class="card">نمره از ۲۰<strong>${record.score !== null && record.score !== undefined ? `${record.score.toFixed(2)} از ۲۰` : '—'}</strong></div>
      <div class="card">کلیددار<strong>${keyedCount}</strong></div>
      <div class="card">بدون کلید<strong>${ungradedCount}</strong></div>
      <div class="card">بی‌پاسخ<strong>${record.blank}</strong></div>
      <div class="card">صحیح<strong>${record.correct}</strong></div>
      <div class="card">غلط<strong>${record.wrong}</strong></div>
      <div class="card">کل سؤال‌ها<strong>${record.questionCount}</strong></div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>سؤال</th>
            <th>پاسخ داده‌شده</th>
            <th>پاسخ صحیح</th>
            <th>کلید</th>
            <th>وضعیت</th>
          </tr>
        </thead>
        <tbody>${rows.join('')}</tbody>
      </table>
    </div>

    <div class="note">
      این گزارش برای ذخیره به‌صورت PDF آماده شده است. در پنجره چاپ، گزینه «Save as PDF» یا «ذخیره به‌صورت PDF» را انتخاب کن.
    </div>
  </div>
</body>
</html>`;
}
function openPrintableReport(record){
  const win = window.open('', '_blank', 'width=1100,height=1400');
  if(!win){
    alert('باز شدن پنجره چاپ توسط مرورگر مسدود شد.');
    return;
  }
  const html = buildPrintableReportHtml(record);
  win.document.open();
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    win.focus();
    win.print();
  }, 450);
}
function buildDownloadJson(record){
  const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(record.examTitle || 'exam').replace(/[\\/:*?"<>|]+/g, '_')}_result.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 600);
}
function initializeBookletRuntime(){
  const booklets = getBookletsFromConfig();
  state.bookletStates = booklets.map((b, idx) => ({
    index: idx,
    remainingSec: b.durationSec,
    durationSec: b.durationSec,
    completed: false,
    startedAt: idx === 0 ? new Date().toISOString() : null
  }));
  state.activeBookletIndex = 0;
  state.remainingSec = state.bookletStates[0]?.remainingSec || 0;
  state.durationSec = getTotalDurationSec(state.config);
}

function switchToNextBooklet(auto = false){
  const booklets = getBookletsFromConfig();
  const nextIndex = state.activeBookletIndex + 1;
  const currentIndex = state.activeBookletIndex;
  if(!booklets[nextIndex]){
    finishExam(true);
    return false;
  }
  if(Array.isArray(state.bookletStates) && state.bookletStates[currentIndex]){
    state.bookletStates[currentIndex] = {
      ...state.bookletStates[currentIndex],
      completed: true,
      remainingSec: 0
    };
  }
  state.activeBookletIndex = nextIndex;
  const next = state.bookletStates[nextIndex] || {
    index: nextIndex,
    remainingSec: booklets[nextIndex].durationSec,
    durationSec: booklets[nextIndex].durationSec,
    completed: false,
    startedAt: null
  };
  next.remainingSec = Math.max(0, next.remainingSec || next.durationSec || 0);
  next.startedAt = next.startedAt || new Date().toISOString();
  state.bookletStates[nextIndex] = next;
  state.remainingSec = next.remainingSec;
  state.startedAt = state.startedAt || new Date().toISOString();
  renderAnswerSheet();
  updateTimerUI(state.remainingSec);
  updateStats();
  refreshActionButtons();
  saveDraft();
  setStatus('running', auto ? 'دفترچه بعدی به‌صورت خودکار شروع شد' : 'دفترچه بعدی شروع شد');
  return true;
}

function finishExam(auto = false){
  if(!state.running && !auto && !state.startedAt){
    alert('ابتدا آزمون را شروع کن.');
    return;
  }

  syncConfigFromUI();
  stopTimer();
  const record = buildResultRecord();

  const items = readLocal(STORAGE_KEYS.submissions, []);
  items.push(record);
  saveLocal(STORAGE_KEYS.submissions, items);
  renderHistory();

  clearDraft();

  state.running = false;
  state.finished = true;
  state.lastResult = record;
  updateTimerUI(0);
  setStatus(record.ungraded ? 'finished' : 'finished', record.ungraded ? 'ثبت شد؛ بخشی بدون کلید' : 'ثبت شد');
  syncAnswerSheetState();
  updateStats();
  renderManagementText();

  if(els.gradePendingBtn) els.gradePendingBtn.style.display = 'inline-flex';

  renderResultModal(record);
}

function startTimer(resume = false){
  stopTimer();
  if(!resume){
    state.startedAt = new Date().toISOString();
    state.running = true;
    state.finished = false;
    if(!Array.isArray(state.bookletStates) || !state.bookletStates.length){
      initializeBookletRuntime();
    }
    state.remainingSec = state.bookletStates[state.activeBookletIndex]?.remainingSec ?? state.remainingSec ?? state.durationSec;
  }else{
    state.running = true;
    state.finished = false;
  }
  updateTimerUI(state.remainingSec);
  setStatus('running', resume ? 'ادامه‌ی آزمون بازیابی شد' : 'در حال اجرا');
  saveDraft();
  state.timerId = setInterval(() => {
    state.remainingSec -= 1;
    if(state.bookletStates?.[state.activeBookletIndex]){
      state.bookletStates[state.activeBookletIndex].remainingSec = state.remainingSec;
    }
    if(state.remainingSec <= 0){
      state.remainingSec = 0;
      updateTimerUI(0);
      saveDraft();
      stopTimer();
      if(!switchToNextBooklet(true)){
        finishExam(true);
      }else{
        startTimer(true);
      }
      return;
    }
    updateTimerUI(state.remainingSec);
    saveDraft();
  }, 1000);
}

function enableRunningState(enable){
  state.running = enable;
  els.answerSheetBody.querySelectorAll('input.ans').forEach(cb => {
    cb.disabled = !enable;
  });
  syncAnswerSheetState();
  setStatus(enable ? 'running' : 'idle', enable ? 'در حال اجرا' : 'آماده');
  if(els.sheetMeta) els.sheetMeta.textContent = enable ? 'آزمون در حال اجراست؛ پاسخ‌ها برای دفترچه فعال ثبت می‌شوند.' : 'برای فعال شدن پاسخ‌برگ، آزمون را شروع کن.';
  refreshActionButtons();
}

function clearAnswers(){
  if(state.running){
    const range = getCurrentBookletRange();
    for(let i = range.start; i <= range.end; i++){
      delete state.answers[`q${i}`];
    }
    syncAnswerSheetState();
    updateStats();
    saveDraft();
  }else{
    alert('وقتی آزمون فعال نیست، چیزی برای پاک کردن وجود ندارد.');
  }
}

function openGuardModal(action){
  state.guardAction = action;
  state.guardProgress = 0;
  if(els.guardSlider) els.guardSlider.value = '0';
  if(els.guardProgress) els.guardProgress.style.width = '0%';
  if(els.guardPercent) els.guardPercent.textContent = '0%';
  if(action === 'finish'){
    if(els.guardTitle) els.guardTitle.textContent = 'تأیید ثبت نهایی';
    if(els.guardMessage) els.guardMessage.textContent = 'برای ثبت نهایی، نوار را تا انتها بکش تا تأیید شود.';
    if(els.guardConfirmBtn) els.guardConfirmBtn.textContent = 'ثبت نهایی';
  }else if(action === 'next'){
    if(els.guardTitle) els.guardTitle.textContent = 'تأیید رفتن به دفترچه بعدی';
    if(els.guardMessage) els.guardMessage.textContent = 'برای رفتن به دفترچه بعدی، نوار را تا انتها بکش. بعد از آن برگشت به دفترچه قبل ممکن نیست.';
    if(els.guardConfirmBtn) els.guardConfirmBtn.textContent = 'شروع دفترچه بعدی';
  }else{
    if(els.guardTitle) els.guardTitle.textContent = 'تأیید پاک کردن پاسخ‌ها';
    if(els.guardMessage) els.guardMessage.textContent = 'برای پاک کردن پاسخ‌ها، نوار را تا انتها بکش تا تأیید شود.';
    if(els.guardConfirmBtn) els.guardConfirmBtn.textContent = 'پاک کردن پاسخ‌ها';
  }
  if(els.guardConfirmBtn) els.guardConfirmBtn.disabled = true;
  openModal(els.guardModal);
}

function closeGuardModal(){
  closeModal(els.guardModal);
  state.guardAction = null;
  state.guardProgress = 0;
  if(els.guardSlider) els.guardSlider.value = '0';
  if(els.guardProgress) els.guardProgress.style.width = '0%';
  if(els.guardPercent) els.guardPercent.textContent = '0%';
  if(els.guardConfirmBtn) els.guardConfirmBtn.disabled = true;
}

function requestFinishExam(){
  if(state.running || state.startedAt){
    const booklets = getBookletsFromConfig();
    if(normalizeBookletMode(state.config.bookletMode) === 'double' && state.activeBookletIndex === 0 && booklets[1]){
      openGuardModal('next');
    }else{
      openGuardModal('finish');
    }
  }else{
    alert('ابتدا آزمون را شروع کن.');
  }
}

function requestClearAnswers(){
  if(state.running){
    openGuardModal('clear');
  }else{
    alert('وقتی آزمون فعال نیست، چیزی برای پاک کردن وجود ندارد.');
  }
}

function confirmGuardAction(){
  if(state.guardAction === 'finish'){
    closeGuardModal();
    finishExam(false);
    return;
  }
  if(state.guardAction === 'next'){
    closeGuardModal();
    switchToNextBooklet(false);
    return;
  }
  if(state.guardAction === 'clear'){
    closeGuardModal();
    clearAnswers();
  }
}
function jumpToQuestion(){
  const n = parseInt(els.jumpInput.value || '0', 10);
  if(!n || n < 1 || n > state.questionCount){
    alert('شماره سؤال معتبر نیست.');
    return;
  }
  const range = getCurrentBookletRange();
  if(n < range.start || n > range.end){
    alert('این سؤال در دفترچه فعال دیده نمی‌شود.');
    return;
  }
  const row = els.answerSheetBody.querySelector(`tr[data-question="q${n}"]`);
  if(row){
    row.scrollIntoView({behavior:'smooth', block:'center'});
    els.answerSheetBody.querySelectorAll('tr').forEach(r => r.classList.remove('active'));
    row.classList.add('active');
    setTimeout(() => row.classList.remove('active'), 1200);
  }
}
function saveSettings(){
  if(state.running){
    alert('در زمان اجرای آزمون، تنظیمات را تغییر نده. ابتدا آزمون را ثبت یا متوقف کن.');
    return;
  }
  syncConfigFromUI();
  state.correctAnswers = collectManualKey();
  state.questionPages = collectManualPages();
  state.config.questionPages = { ...state.questionPages };
  state.questionCount = getTotalQuestionCount(state.config);
  state.durationSec = getTotalDurationSec(state.config);
  state.config.keySource = state.config.keySource || 'manual';

  saveLocal(STORAGE_KEYS.config, {
    ...state.config,
    questionCount: state.questionCount,
    correctAnswers: state.correctAnswers,
    questionPages: state.questionPages,
    previewName: state.preview.name || state.config.previewName || '',
    previewType: state.preview.type || state.config.previewType || ''
  });
  saveDraft();

  updateBookletUI();
  renderKeyTable();
  renderAnswerSheet();
  applyKeyToUI(state.correctAnswers);
  updateStats();
  renderManagementText();
  alert('تنظیمات مدیریت ذخیره شد.');
}
function loadConfig(){
  const saved = readLocal(STORAGE_KEYS.config, null);
  if(saved){
    state.config = { ...state.config, ...saved };
    state.config.bookletMode = normalizeBookletMode(state.config.bookletMode || (state.config.booklet2QuestionCount ? 'double' : 'single'));
    state.config.booklet1QuestionCount = Math.max(1, toInt(state.config.booklet1QuestionCount || saved.questionCount || 20, 20));
    state.config.booklet1Hours = Math.max(0, toInt(state.config.booklet1Hours ?? saved.hours ?? 0, 0));
    state.config.booklet1Minutes = Math.max(0, toInt(state.config.booklet1Minutes ?? saved.minutes ?? 30, 30));
    state.config.booklet1Seconds = Math.max(0, toInt(state.config.booklet1Seconds ?? saved.seconds ?? 0, 0));
    state.config.booklet2QuestionCount = Math.max(1, toInt(state.config.booklet2QuestionCount || 0, 0));
    state.questionPages = { ...(saved.questionPages || state.config.questionPages || {}) };
    state.correctAnswers = saved.correctAnswers || {};
    els.examTitle.value = saved.examTitle || '';
    if(els.languageMode) els.languageMode.value = saved.languageMode || 'fa';
    if(els.negativeMarking) els.negativeMarking.value = saved.negativeMarking || 'no';
    if(els.bookletMode) els.bookletMode.value = state.config.bookletMode;
    updateBookletUI();
  } else {
    updateBookletUI();
  }
  state.questionCount = getTotalQuestionCount(state.config);
  state.durationSec = getTotalDurationSec(state.config);
  updateTimerUI(state.durationSec);
  renderKeyTable();
  renderAnswerSheet();
  applyKeyToUI(state.correctAnswers);
  updateStats();
  renderManagementText();
  if(!restoreDraft()){
    setStatus('idle', 'آماده');
  }
}
function resetConfig(){
  if(state.running){
    alert('در زمان اجرای آزمون، بازنشانی انجام نمی‌شود.');
    return;
  }
  if(!confirm('همه تنظیمات مدیریت بازنشانی شود؟')) return;
  localStorage.removeItem(STORAGE_KEYS.config);
  clearDraft();
  state.config = {
    examTitle: '',
    questionCount: 20,
    languageMode: 'fa',
    negativeMarking: 'no',
    bookletMode: 'single',
    booklet1Title: 'دفترچه اول',
    booklet1QuestionCount: 20,
    booklet1Coefficient: 1,
    booklet1Hours: 0,
    booklet1Minutes: 30,
    booklet1Seconds: 0,
    booklet2Title: 'دفترچه دوم',
    booklet2QuestionCount: 0,
    booklet2Hours: 0,
    booklet2Minutes: 25,
    booklet2Seconds: 0,
    previewName: '',
    previewType: '',
    keySource: 'manual',
    questionPages: {}
  };
  state.questionCount = 20;
  state.durationSec = 1800;
  state.questionPages = {};
  state.correctAnswers = {};
  state.activeBookletIndex = 0;
  state.bookletStates = [];
  els.examTitle.value = '';
  if(els.questionCount) els.questionCount.value = '20';
  if(els.languageMode) els.languageMode.value = 'fa';
  if(els.negativeMarking) els.negativeMarking.value = 'no';
  if(els.bookletMode) els.bookletMode.value = 'single';
  if(els.booklet1Title) els.booklet1Title.value = 'دفترچه اول';
  if(els.booklet1QuestionCount) els.booklet1QuestionCount.value = '20';
  if(els.booklet1Hours) els.booklet1Hours.value = '0';
  if(els.booklet1Minutes) els.booklet1Minutes.value = '30';
  if(els.booklet1Seconds) els.booklet1Seconds.value = '0';
  if(els.booklet2Title) els.booklet2Title.value = 'دفترچه دوم';
  if(els.booklet2QuestionCount) els.booklet2QuestionCount.value = '0';
  if(els.booklet2Hours) els.booklet2Hours.value = '0';
  if(els.booklet2Minutes) els.booklet2Minutes.value = '25';
  if(els.booklet2Seconds) els.booklet2Seconds.value = '0';
  clearPreview();
  renderKeyTable();
  renderAnswerSheet();
  updateTimerUI(state.durationSec);
  updateStats();
  renderManagementText();
  refreshActionButtons();
}
function renderManagementText(){
  els.manualJsonOut.value = JSON.stringify({
    config: state.config,
    questionPages: state.questionPages,
    correctAnswers: state.correctAnswers,
    bookletStates: state.bookletStates,
    activeBookletIndex: state.activeBookletIndex
  }, null, 2);
}
function makeRecordId(){
  if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
  return `rec_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function isKeyCompleteForCount(map, count){
  const total = Math.max(1, parseInt(count || state.questionCount || 1, 10));
  for(let i = 1; i <= total; i++){
    const v = map?.[`q${i}`];
    if(!v || !String(v).trim()) return false;
  }
  return true;
}

function evaluateSubmission(answers, correctAnswers, count, negativeMarking){
  const questionTotal = Math.max(1, parseInt(count || state.questionCount || 1, 10));
  let correct = 0;
  let wrong = 0;
  let blank = 0;
  let answered = 0;
  let gradedQuestionCount = 0;

  for(let i = 1; i <= questionTotal; i++){
    const q = `q${i}`;
    const u = answers?.[q];
    const c = correctAnswers?.[q];
    if(!c || !String(c).trim()){
      continue;
    }

    gradedQuestionCount++;

    if(!u){
      blank++;
      continue;
    }

    answered++;
    if(String(u) === String(c)) correct++;
    else wrong++;
  }

  const ungraded = Math.max(0, questionTotal - gradedQuestionCount);
  const complete = ungraded === 0;
  const denominator = gradedQuestionCount * 3;
  const negativeEnabled = normalizeNegativeMarking(negativeMarking);
  const rawScore = gradedQuestionCount
    ? (negativeEnabled ? (correct * 3 - wrong) : correct * 3)
    : null;
  const percentage = gradedQuestionCount && denominator ? ((rawScore / denominator) * 100) : null;
  const score = gradedQuestionCount && denominator
    ? Math.max(0, Math.min(20, (rawScore / denominator) * 20))
    : null;
  const taz = gradedQuestionCount ? buildTazApprox({ percentage, correct, wrong, blank }) : null;

  return {
    questionCount: questionTotal,
    gradedQuestionCount,
    keyedQuestionCount: gradedQuestionCount,
    correct,
    wrong,
    blank,
    answered,
    ungraded,
    complete,
    rawScore,
    score,
    percentage,
    taz,
    negativeMarkingEnabled: negativeEnabled
  };
}

function saveDraft(){
  if(!state.running && !state.startedAt) return;
  const draft = {
    savedAt: new Date().toISOString(),
    running: state.running,
    finished: state.finished,
    startedAt: state.startedAt,
    durationSec: state.durationSec,
    remainingSec: state.remainingSec,
    questionCount: state.questionCount,
    answers: { ...state.answers },
    correctAnswers: { ...state.correctAnswers },
    config: { ...state.config, questionCount: state.questionCount },
    preview: {
      name: state.preview.name || '',
      type: state.preview.type || '',
      url: ''
    }
  };
  saveLocal(STORAGE_KEYS.draft, draft);
}

function clearDraft(){
  try{ localStorage.removeItem(STORAGE_KEYS.draft); }catch(e){}
}

function updateSubmissionRecord(updated){
  const items = readLocal(STORAGE_KEYS.submissions, []);
  const idx = items.findIndex(item => item.id === updated.id);
  if(idx >= 0) items[idx] = updated;
  else items.push(updated);
  saveLocal(STORAGE_KEYS.submissions, items);
  renderHistory();
}

function gradeRecord(record, keyMap){
  const evaluation = evaluateSubmission(record.answers, keyMap, record.questionCount, record.negativeMarking);
  return {
    ...record,
    ...evaluation,
    correctAnswers: { ...keyMap },
    gradedAt: new Date().toISOString(),
    graded: evaluation.complete,
    pendingCorrection: !evaluation.complete,
    correctionStatus: evaluation.complete ? 'graded' : 'pending'
  };
}

function restoreDraft(){
  const draft = readLocal(STORAGE_KEYS.draft, null);
  if(!draft || !draft.running) return false;

  state.config = { ...state.config, ...(draft.config || {}) };
  state.questionCount = Math.max(1, parseInt(draft.questionCount || state.config.questionCount || state.questionCount, 10));
  state.durationSec = Math.max(0, parseInt(draft.durationSec || state.durationSec || 0, 10));

  const startedTs = draft.startedAt ? Date.parse(draft.startedAt) : NaN;
  const elapsed = Number.isFinite(startedTs) ? Math.max(0, Math.floor((Date.now() - startedTs) / 1000)) : 0;
  const computedRemaining = Math.max(0, state.durationSec - elapsed);
  const storedRemaining = Math.max(0, parseInt(draft.remainingSec || state.durationSec || 0, 10));
  state.remainingSec = Number.isFinite(computedRemaining) ? Math.min(storedRemaining, computedRemaining) : storedRemaining;
  state.startedAt = draft.startedAt || new Date().toISOString();
  state.answers = { ...(draft.answers || {}) };
  state.correctAnswers = { ...(draft.correctAnswers || {}) };
  state.finished = false;
  state.lastResult = null;

  els.examTitle.value = state.config.examTitle || '';
  els.questionCount.value = String(state.questionCount);
  els.languageMode.value = state.config.languageMode || 'fa';
  els.negativeMarking.value = state.config.negativeMarking || 'no';
  els.hours.value = String(state.config.hours ?? 0);
  els.minutes.value = String(state.config.minutes ?? 30);
  els.seconds.value = String(state.config.seconds ?? 0);

  renderKeyTable();
  renderAnswerSheet();
  applyKeyToUI(state.correctAnswers);
  enableRunningState(true);
  updateTimerUI(state.remainingSec);
  setStatus('running', 'ادامه‌ی آزمون بازیابی شد');
  updateStats();

  if(state.remainingSec <= 0){
    finishExam(true);
    return true;
  }

  startTimer(true);
  return true;
}

function exportHistory(){
  const items = readLocal(STORAGE_KEYS.submissions, []);
  const blob = new Blob([JSON.stringify(items, null, 2)], {type:'application/json;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'exam-history.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 600);
}
function buildDownloadFileName(record, ext){
  const base = (record.examTitle || 'exam').replace(/[\\/:*?"<>|]+/g, '_').trim();
  return `${base}_${record.submittedAt.replace(/[\\/:*?"<>|]+/g, '_')}.${ext}`;
}
function bindEvents(){
  els.manageBtn.addEventListener('click', () => {
    if(state.running){
      alert('در زمان اجرای آزمون، مدیریت را نمی‌توان ویرایش کرد.');
      return;
    }
    renderKeyTable();
    renderManagementText();
    openModal(els.managementModal);
  });
  els.closeManageBtn.addEventListener('click', () => closeModal(els.managementModal));
  els.closeManageBtn2.addEventListener('click', () => closeModal(els.managementModal));
  els.managementModal.addEventListener('click', (e) => {
    if(e.target === els.managementModal) closeModal(els.managementModal);
  });

  els.closeResultBtn.addEventListener('click', () => closeModal(els.resultModal));
  els.resultModal.addEventListener('click', (e) => {
    if(e.target === els.resultModal) closeModal(els.resultModal);
  });
  if(els.guardModal){
    els.guardModal.addEventListener('click', (e) => {
      if(e.target === els.guardModal) closeGuardModal();
    });
  }

  document.querySelectorAll('.acc-head').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.acc-item');
      item.classList.toggle('open');
    });
  });

  els.startBtn.addEventListener('click', () => {
    if(state.running){
      alert('آزمون در حال اجراست.');
      return;
    }
    syncConfigFromUI();
    if(!state.questionCount || state.questionCount < 1){
      alert('تعداد سؤال معتبر نیست.');
      return;
    }
    initializeBookletRuntime();
    state.answers = {};
    state.lastResult = null;
    state.finished = false;
    state.running = true;
    state.startedAt = new Date().toISOString();
    renderKeyTable();
    renderAnswerSheet();
    enableRunningState(true);
    updateBookletUI();
    startTimer();
  });

  els.finishBtn.addEventListener('click', requestFinishExam);
  els.clearBtn.addEventListener('click', requestClearAnswers);
  els.jumpBtn.addEventListener('click', jumpToQuestion);
  els.jumpInput.addEventListener('keydown', (e) => {
    if(e.key === 'Enter') jumpToQuestion();
  });

  els.clearHistoryBtn.addEventListener('click', () => {
    if(!confirm('همه تاریخچه‌های ثبت‌شده پاک شود؟')) return;
    localStorage.removeItem(STORAGE_KEYS.submissions);
    renderHistory();
  });

  els.historyList.addEventListener('click', (e) => {
    const btn = e.target.closest('.grade-history-btn');
    if(!btn) return;
    const card = btn.closest('.history-card');
    const recordId = card?.dataset?.recordId;
    if(!recordId) return;
    const items = readLocal(STORAGE_KEYS.submissions, []);
    const rec = items.find(item => item.id === recordId);
    if(!rec){
      alert('رکورد موردنظر پیدا نشد.');
      return;
    }
    const graded = gradeRecord(rec, state.correctAnswers);
    updateSubmissionRecord(graded);
    state.lastResult = graded;
    els.manualJsonOut.value = JSON.stringify(graded, null, 2);
    renderResultModal(graded);
    setStatus('finished', 'تصحیح شد');
  });

  els.fitBtn.addEventListener('click', () => {
    els.previewShell.scrollTop = 0;
    els.previewShell.scrollLeft = 0;
  });

  els.fsBtn.addEventListener('click', async () => {
    const target = els.previewShell;
    if(document.fullscreenElement){
      await document.exitFullscreen().catch(()=>{});
    }else{
      await target.requestFullscreen?.().catch(()=>{});
    }
  });

  els.questionCount.addEventListener('change', () => {
    if(state.running){
      alert('در زمان اجرای آزمون، تعداد سؤال را تغییر نده.');
      els.questionCount.value = String(state.questionCount);
      return;
    }
    renderKeyTable();
    renderAnswerSheet();
    renderManagementText();
  });

  els.negativeMarking.addEventListener('change', () => {
    if(state.running){
      els.negativeMarking.value = state.config.negativeMarking || 'no';
      alert('در زمان اجرای آزمون، نمره منفی را تغییر نده.');
      return;
    }
    state.config.negativeMarking = els.negativeMarking.value;
    saveLocal(STORAGE_KEYS.config, {
      ...state.config,
      correctAnswers: state.correctAnswers,
      previewName: state.preview.name || state.config.previewName || '',
      previewType: state.preview.type || state.config.previewType || ''
    });
    saveDraft();
    renderManagementText();
  });

  els.answerSheetBody.addEventListener('change', (e) => {
    const el = e.target;
    if(!(el instanceof HTMLInputElement) || el.type !== 'checkbox' || !el.classList.contains('ans')) return;
    if(!state.running){
      el.checked = false;
      return;
    }
    const row = el.closest('tr');
    const q = el.dataset.q;
    row.querySelectorAll('input.ans').forEach(cb => {
      if(cb !== el) cb.checked = false;
    });
    if(el.checked){
      state.answers[q] = el.dataset.v;
    }else{
      delete state.answers[q];
    }
    row.classList.toggle('answered', !!state.answers[q]);
    updateStats();
    saveDraft();
  });

  els.keyTableBody.addEventListener('change', (e) => {
    const el = e.target;
    if(!(el instanceof HTMLInputElement) || el.type !== 'checkbox') return;
    const q = el.dataset.q;
    if(!q) return;
    const chosen = el.dataset.v;
    if(el.checked){
      els.keyTableBody.querySelectorAll(`input[data-q=\"${q}\"]`).forEach(cb => {
        if(cb !== el) cb.checked = false;
      });
      state.correctAnswers[q] = chosen;
    }else{
      delete state.correctAnswers[q];
    }
    updateStats();
    renderManagementText();
    saveDraft();
  });

  els.saveSettingsBtn.addEventListener('click', () => {
    state.correctAnswers = collectManualKey();
    saveSettings();
    renderManagementText();
  });

  els.resetConfigBtn.addEventListener('click', resetConfig);

  els.applyManualKeyBtn.addEventListener('click', () => {
    state.correctAnswers = collectManualKey();
    saveLocal(STORAGE_KEYS.config, {
      ...state.config,
      correctAnswers: state.correctAnswers,
      previewName: state.preview.name || state.config.previewName || '',
      previewType: state.preview.type || state.config.previewType || ''
    });
    renderManagementText();
    saveDraft();
    alert('کلید دستی در فرم مدیریت اعمال شد و در مرورگر هم ذخیره شد.');
  });

  els.previewFileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if(file){
      showPreviewFromFile(file);
      state.config.previewName = file.name;
      state.config.previewType = file.type || '';
      saveLocal(STORAGE_KEYS.config, {
        ...state.config,
        correctAnswers: state.correctAnswers,
        previewName: state.config.previewName,
        previewType: state.config.previewType
      });
    }
  });

  els.keyExcelInput.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    await importKeyFile(file);
    renderManagementText();
    saveDraft();
  });

  els.downloadTemplateBtn.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = 'question_key_template.xlsx';
    a.download = 'question_key_template.xlsx';
    a.click();
  });

  els.downloadPdfBtn.addEventListener('click', () => {
    if(!state.lastResult){
      alert('ابتدا یک آزمون ثبت شود.');
      return;
    }
    closeModal(els.resultModal);
    openPrintableReport(state.lastResult);
  });

  els.downloadJsonBtn.addEventListener('click', () => {
    if(!state.lastResult){
      alert('ابتدا یک آزمون ثبت شود.');
      return;
    }
    buildDownloadJson(state.lastResult);
  });

  if(els.guardSlider){
    els.guardSlider.addEventListener('input', () => {
      const value = Math.max(0, Math.min(100, parseInt(els.guardSlider.value || '0', 10)));
      state.guardProgress = value;
      if(els.guardProgress) els.guardProgress.style.width = `${value}%`;
      if(els.guardPercent) els.guardPercent.textContent = `${value}%`;
      if(els.guardConfirmBtn) els.guardConfirmBtn.disabled = value < 100;
    });
  }
  if(els.guardConfirmBtn){
    els.guardConfirmBtn.addEventListener('click', confirmGuardAction);
  }
  if(els.guardCancelBtn){
    els.guardCancelBtn.addEventListener('click', closeGuardModal);
  }

  if(els.gradePendingBtn){
    els.gradePendingBtn.addEventListener('click', () => {
      if(!state.lastResult){
        alert('ابتدا یک آزمون ثبت شود.');
        return;
      }
      const graded = gradeRecord(state.lastResult, state.correctAnswers);
      state.lastResult = graded;
      updateSubmissionRecord(graded);
      renderResultModal(graded);
      els.manualJsonOut.value = JSON.stringify(graded, null, 2);
      setStatus('finished', 'تصحیح شد');
    });
  }

  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape'){
      if(els.managementModal.classList.contains('open')) closeModal(els.managementModal);
      if(els.resultModal.classList.contains('open')) closeModal(els.resultModal);
      if(els.guardModal && els.guardModal.classList.contains('open')) closeGuardModal();
    }
  });

  window.addEventListener('beforeunload', () => {
    saveDraft();
  });
}

// ===== patched booklet + preview runtime =====
function normalizePageRange(startValue, endValue, fallbackStart = 1, fallbackSpan = 5){
  const start = Math.max(1, toInt(startValue, fallbackStart));
  const end = Math.max(start, toInt(endValue, start + Math.max(0, fallbackSpan - 1)));
  return { start, end, count: end - start + 1 };
}

function getBookletsFromConfig(cfg = state.config){
  const mode = normalizeBookletMode(cfg.bookletMode);
  const b1Count = Math.max(1, toInt(cfg.booklet1QuestionCount ?? cfg.questionCount, 20));
  const b1DurationSec = durationPartsToSec(cfg.booklet1Hours ?? cfg.hours, cfg.booklet1Minutes ?? cfg.minutes, cfg.booklet1Seconds ?? cfg.seconds);
  const b1Pages = normalizePageRange(cfg.booklet1PageStart ?? 1, cfg.booklet1PageEnd ?? 5, 1, 5);
  const booklets = [{
    index: 0,
    key: 'booklet1',
    title: (cfg.booklet1Title || 'دفترچه اول').trim() || 'دفترچه اول',
    questionCount: b1Count,
    durationSec: b1DurationSec,
    start: 1,
    end: b1Count,
    pageStart: b1Pages.start,
    pageEnd: b1Pages.end,
    pageCount: b1Pages.count
  }];
  if(mode === 'double'){
    const b2Count = Math.max(1, toInt(cfg.booklet2QuestionCount, 20));
    const b2DurationSec = durationPartsToSec(cfg.booklet2Hours, cfg.booklet2Minutes, cfg.booklet2Seconds);
    const start = b1Count + 1;
    const b2Pages = normalizePageRange(cfg.booklet2PageStart ?? (b1Pages.end + 1), cfg.booklet2PageEnd ?? (b1Pages.end + 5), b1Pages.end + 1, 5);
    booklets.push({
      index: 1,
      key: 'booklet2',
      title: (cfg.booklet2Title || 'دفترچه دوم').trim() || 'دفترچه دوم',
      questionCount: b2Count,
      durationSec: b2DurationSec,
      start,
      end: start + b2Count - 1,
      pageStart: b2Pages.start,
      pageEnd: b2Pages.end,
      pageCount: b2Pages.count
    });
  }
  return booklets;
}

function getCurrentBookletPageRange(){
  const booklet = getCurrentBooklet();
  return booklet ? { start: booklet.pageStart || 1, end: booklet.pageEnd || (booklet.pageStart || 1), booklet } : { start: 1, end: 1, booklet: null };
}

function clearPreview(){
  if(state.preview.url){
    try{ URL.revokeObjectURL(state.preview.url); }catch(e){}
  }
  state.preview = { url:'', type:'', name:'', pdfDoc:null, renderToken:(state.preview.renderToken || 0) + 1 };
  els.previewPlaceholder.style.display = 'flex';
  if(els.pdfViewer) els.pdfViewer.innerHTML = '';
  els.pdfViewer.classList.remove('active');
  els.imageViewer.classList.remove('active');
  els.pdfViewer.removeAttribute('data');
  els.imageViewer.removeAttribute('src');
  els.previewMeta.textContent = 'فایل هنوز بارگذاری نشده است.';
  els.previewFootLeft.textContent = 'بدون فایل فعال';
  els.previewFootRight.textContent = 'پیش‌نمایش داخلی و اسکرول‌دار';
  const previewLabel = state.config?.previewName ? `${state.config.previewName} (اطلاعات بازیابی شد)` : 'هنوز فایلی انتخاب نشده است.';
  els.previewInfo.value = previewLabel;
  els.selectedFileInfo.textContent = previewLabel;
}

function refreshPreviewForActiveBooklet(){
  if(!state.preview.url) return;
  const isPdf = state.preview.type === 'application/pdf' || /\.pdf$/i.test(state.preview.name || '');
  if(isPdf){
    renderPdfPreview();
  }
}

function showPreviewFromFile(file){
  if(!file) return;
  if(state.preview.url){
    try{ URL.revokeObjectURL(state.preview.url); }catch(e){}
  }
  const url = URL.createObjectURL(file);
  state.preview = { url, type: file.type || '', name: file.name || '', pdfDoc:null, renderToken:(state.preview.renderToken || 0) + 1 };
  els.previewMeta.textContent = `${file.name} • ${file.type || 'unknown'}`;
  els.previewFootLeft.textContent = file.name;
  els.previewFootRight.textContent = file.type || 'unknown type';
  els.previewInfo.value = file.name;
  els.selectedFileInfo.textContent = file.name;
  els.previewPlaceholder.style.display = 'none';

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if(isPdf){
    els.imageViewer.classList.remove('active');
    els.imageViewer.removeAttribute('src');
    els.pdfViewer.classList.add('active');
    renderPdfPreview();
  }else{
    els.pdfViewer.classList.remove('active');
    if(els.pdfViewer) els.pdfViewer.innerHTML = '';
    els.pdfViewer.removeAttribute('data');
    els.imageViewer.src = url;
    els.imageViewer.classList.add('active');
  }
}

async function renderPdfPreview(){
  const container = els.pdfViewer;
  if(!container) return;
  const isPdf = state.preview.type === 'application/pdf' || /\.pdf$/i.test(state.preview.name || '');
  if(!state.preview.url || !isPdf){
    container.innerHTML = '';
    return;
  }

  container.classList.add('active');
  container.innerHTML = '<div class="pdf-page-label">در حال آماده‌سازی پیش‌نمایش PDF...</div>';

  const pdfjs = window.pdfjsLib;
  if(!pdfjs || typeof pdfjs.getDocument !== 'function'){
    container.innerHTML = '<div class="pdf-page-label">PDF.js در دسترس نیست؛ پیش‌نمایش صفحه‌ای فعال نشد.</div>';
    return;
  }
  if(pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc){
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  const renderToken = ++state.preview.renderToken;
  try{
    const pdf = await pdfjs.getDocument({ url: state.preview.url }).promise;
    if(renderToken !== state.preview.renderToken) return;
    state.preview.pdfDoc = pdf;
    const range = getCurrentBookletPageRange();
    const startPage = Math.min(Math.max(1, range.start || 1), pdf.numPages);
    const endPage = Math.min(Math.max(startPage, range.end || pdf.numPages), pdf.numPages);
    const frag = document.createDocumentFragment();

    els.previewMeta.textContent = `${state.preview.name || 'PDF'} • ${pdf.numPages} صفحه • ${range.booklet?.title || 'دفترچه'}`;
    els.previewFootRight.textContent = `نمایش صفحات ${startPage} تا ${endPage}`;

    for(let pageNo = startPage; pageNo <= endPage; pageNo++){
      if(renderToken !== state.preview.renderToken) return;
      const page = await pdf.getPage(pageNo);
      const viewport = page.getViewport({ scale: 1.35 });
      const wrapper = document.createElement('div');
      wrapper.className = 'pdf-page';
      const label = document.createElement('div');
      label.className = 'pdf-page-label';
      label.textContent = `صفحه ${pageNo} از ${pdf.numPages} • ${range.booklet?.title || ''}`.trim();
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      wrapper.append(label, canvas);
      frag.appendChild(wrapper);
    }

    container.innerHTML = '';
    container.appendChild(frag);
  }catch(err){
    console.error('PDF preview failed', err);
    container.innerHTML = '<div class="pdf-page-label">پیش‌نمایش PDF بارگذاری نشد.</div>';
  }
}

function renderBookletBar(){
  if(!els.bookletBar) return;
  const booklets = getBookletsFromConfig();
  if(!booklets.length){
    els.bookletBar.innerHTML = '';
    return;
  }
  const active = getCurrentBookletIndex();
  const doubleMode = normalizeBookletMode(state.config.bookletMode) === 'double';
  els.bookletBar.innerHTML = booklets.map((b, idx) => {
    const locked = doubleMode && idx < active;
    const activeClass = idx === active ? 'active' : '';
    const lockedClass = locked ? 'locked' : '';
    const disabled = locked ? 'disabled' : '';
    return `<button type="button" class="booklet-pill ${activeClass} ${lockedClass}" data-booklet-index="${idx}" ${disabled}>${b.title} • ${b.questionCount} سؤال • ${fmtTime(b.durationSec)} • صفحات ${b.pageStart}-${b.pageEnd}</button>`;
  }).join('');
}

function updateBookletUI(){
  const booklets = getBookletsFromConfig();
  const totalQuestions = getTotalQuestionCount();
  const totalDuration = getTotalDurationSec();
  state.questionCount = totalQuestions;
  state.durationSec = state.durationSec || totalDuration;
  if(els.questionCount) els.questionCount.value = String(totalQuestions);
  if(els.bookletMode) els.bookletMode.value = normalizeBookletMode(state.config.bookletMode);
  if(els.booklet1Title) els.booklet1Title.value = state.config.booklet1Title || 'دفترچه اول';
  if(els.booklet1QuestionCount) els.booklet1QuestionCount.value = String(state.config.booklet1QuestionCount ?? totalQuestions);
  if(els.booklet1PageStart) els.booklet1PageStart.value = String(state.config.booklet1PageStart ?? 1);
  if(els.booklet1PageEnd) els.booklet1PageEnd.value = String(state.config.booklet1PageEnd ?? 5);
  if(els.booklet1Hours) els.booklet1Hours.value = String(state.config.booklet1Hours ?? state.config.hours ?? 0);
  if(els.booklet1Minutes) els.booklet1Minutes.value = String(state.config.booklet1Minutes ?? state.config.minutes ?? 30);
  if(els.booklet1Seconds) els.booklet1Seconds.value = String(state.config.booklet1Seconds ?? state.config.seconds ?? 0);
  if(els.booklet2Title) els.booklet2Title.value = state.config.booklet2Title || 'دفترچه دوم';
  if(els.booklet2QuestionCount) els.booklet2QuestionCount.value = String(state.config.booklet2QuestionCount ?? 0);
  if(els.booklet2PageStart) els.booklet2PageStart.value = String(state.config.booklet2PageStart ?? 6);
  if(els.booklet2PageEnd) els.booklet2PageEnd.value = String(state.config.booklet2PageEnd ?? 10);
  if(els.booklet2Hours) els.booklet2Hours.value = String(state.config.booklet2Hours ?? 0);
  if(els.booklet2Minutes) els.booklet2Minutes.value = String(state.config.booklet2Minutes ?? 25);
  if(els.booklet2Seconds) els.booklet2Seconds.value = String(state.config.booklet2Seconds ?? 0);
  if(els.bookletConfig2) els.bookletConfig2.style.display = normalizeBookletMode(state.config.bookletMode) === 'double' ? '' : 'none';
  if(els.bookletConfig1) els.bookletConfig1.classList.toggle('full-width', normalizeBookletMode(state.config.bookletMode) !== 'double');
  renderBookletBar();
  refreshActionButtons();
  refreshPreviewForActiveBooklet();
}

function syncConfigFromUI(){
  if(!els) return;
  state.config.negativeMarking = els.negativeMarking?.value || state.config.negativeMarking || 'no';
  state.config.bookletMode = normalizeBookletMode(els.bookletMode?.value || state.config.bookletMode);
  state.config.booklet1Title = (els.booklet1Title?.value || state.config.booklet1Title || 'دفترچه اول').trim();
  state.config.booklet1QuestionCount = Math.max(1, toInt(els.booklet1QuestionCount?.value || state.config.booklet1QuestionCount || state.questionCount || 20, 20));
  state.config.booklet1PageStart = Math.max(1, toInt(els.booklet1PageStart?.value || state.config.booklet1PageStart || 1, 1));
  state.config.booklet1PageEnd = Math.max(state.config.booklet1PageStart, toInt(els.booklet1PageEnd?.value || state.config.booklet1PageEnd || 5, 5));
  state.config.booklet1Hours = Math.max(0, toInt(els.booklet1Hours?.value || state.config.booklet1Hours || 0, 0));
  state.config.booklet1Minutes = Math.max(0, toInt(els.booklet1Minutes?.value || state.config.booklet1Minutes || 0, 0));
  state.config.booklet1Seconds = Math.max(0, toInt(els.booklet1Seconds?.value || state.config.booklet1Seconds || 0, 0));
  state.config.booklet2Title = (els.booklet2Title?.value || state.config.booklet2Title || 'دفترچه دوم').trim();
  state.config.booklet2QuestionCount = Math.max(1, toInt(els.booklet2QuestionCount?.value || state.config.booklet2QuestionCount || 0, 0));
  state.config.booklet2PageStart = Math.max(1, toInt(els.booklet2PageStart?.value || state.config.booklet2PageStart || (state.config.booklet1PageEnd ? state.config.booklet1PageEnd + 1 : 6), 6));
  state.config.booklet2PageEnd = Math.max(state.config.booklet2PageStart, toInt(els.booklet2PageEnd?.value || state.config.booklet2PageEnd || (state.config.booklet2PageStart + 4), state.config.booklet2PageStart + 4));
  state.config.booklet2Hours = Math.max(0, toInt(els.booklet2Hours?.value || state.config.booklet2Hours || 0, 0));
  state.config.booklet2Minutes = Math.max(0, toInt(els.booklet2Minutes?.value || state.config.booklet2Minutes || 0, 0));
  state.config.booklet2Seconds = Math.max(0, toInt(els.booklet2Seconds?.value || state.config.booklet2Seconds || 0, 0));
  state.config.examTitle = els.examTitle?.value?.trim?.() || state.config.examTitle || '';
  state.config.languageMode = els.languageMode?.value || state.config.languageMode || 'fa';
  state.config.questionPages = { ...state.questionPages };
  state.questionCount = getTotalQuestionCount(state.config);
  state.durationSec = getTotalDurationSec(state.config);
}

function saveDraft(){
  if(!state.running && !state.startedAt) return;
  const draft = {
    savedAt: new Date().toISOString(),
    running: state.running,
    finished: state.finished,
    startedAt: state.startedAt,
    activeBookletIndex: state.activeBookletIndex || 0,
    durationSec: state.durationSec,
    remainingSec: state.remainingSec,
    questionCount: state.questionCount,
    answers: { ...state.answers },
    questionPages: { ...state.questionPages },
    correctAnswers: { ...state.correctAnswers },
    bookletStates: Array.isArray(state.bookletStates) ? state.bookletStates.map(s => ({ ...s })) : [],
    config: { ...state.config, questionCount: state.questionCount, questionPages: { ...state.questionPages } },
    preview: {
      name: state.preview.name || '',
      type: state.preview.type || '',
      url: ''
    }
  };
  saveLocal(STORAGE_KEYS.draft, draft);
}

function restoreDraft(){
  const draft = readLocal(STORAGE_KEYS.draft, null);
  if(!draft || !draft.running) return false;

  state.config = { ...state.config, ...(draft.config || {}) };
  state.questionPages = { ...(draft.questionPages || state.config.questionPages || {}) };
  state.questionCount = Math.max(1, toInt(draft.questionCount || state.config.questionCount || state.questionCount, 10));
  state.durationSec = Math.max(0, toInt(draft.durationSec || state.durationSec || 0, 10));
  state.activeBookletIndex = Math.max(0, toInt(draft.activeBookletIndex || 0, 10));
  state.bookletStates = Array.isArray(draft.bookletStates) && draft.bookletStates.length
    ? draft.bookletStates.map((s, idx) => ({
        index: idx,
        remainingSec: Math.max(0, toInt(s.remainingSec, 0)),
        durationSec: Math.max(0, toInt(s.durationSec, 0)),
        completed: !!s.completed,
        startedAt: s.startedAt || null
      }))
    : getBookletsFromConfig(state.config).map((b, idx) => ({ index: idx, remainingSec: b.durationSec, durationSec: b.durationSec, completed: false, startedAt: null }));

  state.remainingSec = state.bookletStates[state.activeBookletIndex]?.remainingSec ?? state.durationSec;
  state.startedAt = draft.startedAt || new Date().toISOString();
  state.answers = { ...(draft.answers || {}) };
  state.correctAnswers = { ...(draft.correctAnswers || {}) };
  state.finished = false;
  state.lastResult = null;

  els.examTitle.value = state.config.examTitle || '';
  if(els.languageMode) els.languageMode.value = state.config.languageMode || 'fa';
  if(els.negativeMarking) els.negativeMarking.value = state.config.negativeMarking || 'no';
  updateBookletUI();
  renderKeyTable();
  renderAnswerSheet();
  applyKeyToUI(state.correctAnswers);
  enableRunningState(true);
  updateTimerUI(state.remainingSec);
  setStatus('running', 'ادامه‌ی آزمون بازیابی شد');
  updateStats();
  refreshActionButtons();

  if(state.remainingSec <= 0){
    finishExam(true);
    return true;
  }

  startTimer(true);
  return true;
}

function loadConfig(){
  const saved = readLocal(STORAGE_KEYS.config, null);
  if(saved){
    state.config = { ...state.config, ...saved };
    state.config.bookletMode = normalizeBookletMode(state.config.bookletMode || (state.config.booklet2QuestionCount ? 'double' : 'single'));
    state.config.booklet1QuestionCount = Math.max(1, toInt(state.config.booklet1QuestionCount || saved.questionCount || 20, 20));
    state.config.booklet1PageStart = Math.max(1, toInt(state.config.booklet1PageStart || 1, 1));
    state.config.booklet1PageEnd = Math.max(state.config.booklet1PageStart, toInt(state.config.booklet1PageEnd || 5, 5));
    state.config.booklet1Hours = Math.max(0, toInt(state.config.booklet1Hours ?? saved.hours ?? 0, 0));
    state.config.booklet1Minutes = Math.max(0, toInt(state.config.booklet1Minutes ?? saved.minutes ?? 30, 30));
    state.config.booklet1Seconds = Math.max(0, toInt(state.config.booklet1Seconds ?? saved.seconds ?? 0, 0));
    state.config.booklet2QuestionCount = Math.max(1, toInt(state.config.booklet2QuestionCount || 0, 0));
    state.config.booklet2PageStart = Math.max(1, toInt(state.config.booklet2PageStart || (state.config.booklet1PageEnd + 1), state.config.booklet1PageEnd + 1));
    state.config.booklet2PageEnd = Math.max(state.config.booklet2PageStart, toInt(state.config.booklet2PageEnd || (state.config.booklet2PageStart + 4), state.config.booklet2PageStart + 4));
    state.questionPages = { ...(saved.questionPages || state.config.questionPages || {}) };
    state.correctAnswers = saved.correctAnswers || {};
    els.examTitle.value = saved.examTitle || '';
    if(els.languageMode) els.languageMode.value = saved.languageMode || 'fa';
    if(els.negativeMarking) els.negativeMarking.value = saved.negativeMarking || 'no';
    if(els.bookletMode) els.bookletMode.value = state.config.bookletMode;
    updateBookletUI();
  } else {
    updateBookletUI();
  }
  state.questionCount = getTotalQuestionCount(state.config);
  state.durationSec = getTotalDurationSec(state.config);
  updateTimerUI(state.durationSec);
  renderKeyTable();
  renderAnswerSheet();
  applyKeyToUI(state.correctAnswers);
  updateStats();
  renderManagementText();
  if(!restoreDraft()){
    setStatus('idle', 'آماده');
  }
}

function resetConfig(){
  if(state.running){
    alert('در زمان اجرای آزمون، بازنشانی انجام نمی‌شود.');
    return;
  }
  if(!confirm('همه تنظیمات مدیریت بازنشانی شود؟')) return;
  localStorage.removeItem(STORAGE_KEYS.config);
  clearDraft();
  state.config = {
    examTitle: '',
    questionCount: 20,
    languageMode: 'fa',
    negativeMarking: 'no',
    bookletMode: 'single',
    booklet1Title: 'دفترچه اول',
    booklet1QuestionCount: 20,
    booklet1PageStart: 1,
    booklet1PageEnd: 5,
    booklet1Hours: 0,
    booklet1Minutes: 30,
    booklet1Seconds: 0,
    booklet2Title: 'دفترچه دوم',
    booklet2QuestionCount: 0,
    booklet2PageStart: 6,
    booklet2PageEnd: 10,
    booklet2Hours: 0,
    booklet2Minutes: 25,
    booklet2Seconds: 0,
    previewName: '',
    previewType: '',
    keySource: 'manual',
    questionPages: {}
  };
  state.questionCount = 20;
  state.durationSec = 1800;
  state.questionPages = {};
  state.correctAnswers = {};
  state.activeBookletIndex = 0;
  state.bookletStates = [];
  els.examTitle.value = '';
  if(els.questionCount) els.questionCount.value = '20';
  if(els.languageMode) els.languageMode.value = 'fa';
  if(els.negativeMarking) els.negativeMarking.value = 'no';
  if(els.bookletMode) els.bookletMode.value = 'single';
  if(els.booklet1Title) els.booklet1Title.value = 'دفترچه اول';
  if(els.booklet1QuestionCount) els.booklet1QuestionCount.value = '20';
  if(els.booklet1PageStart) els.booklet1PageStart.value = '1';
  if(els.booklet1PageEnd) els.booklet1PageEnd.value = '5';
  if(els.booklet1Hours) els.booklet1Hours.value = '0';
  if(els.booklet1Minutes) els.booklet1Minutes.value = '30';
  if(els.booklet1Seconds) els.booklet1Seconds.value = '0';
  if(els.booklet2Title) els.booklet2Title.value = 'دفترچه دوم';
  if(els.booklet2QuestionCount) els.booklet2QuestionCount.value = '0';
  if(els.booklet2PageStart) els.booklet2PageStart.value = '6';
  if(els.booklet2PageEnd) els.booklet2PageEnd.value = '10';
  if(els.booklet2Hours) els.booklet2Hours.value = '0';
  if(els.booklet2Minutes) els.booklet2Minutes.value = '25';
  if(els.booklet2Seconds) els.booklet2Seconds.value = '0';
  clearPreview();
  renderKeyTable();
  renderAnswerSheet();
  updateTimerUI(state.durationSec);
  updateStats();
  renderManagementText();
  refreshActionButtons();
}

function buildResultRecord(){
  syncConfigFromUI();
  const evaluation = evaluateBooklets(state.answers, state.correctAnswers, state.config);
  return {
    id: makeRecordId(),
    examTitle: state.config.examTitle || 'آزمون',
    submittedAt: new Date().toLocaleString('fa-IR'),
    questionCount: evaluation.totalQuestionCount,
    totalQuestionCount: evaluation.totalQuestionCount,
    totalDurationSec: evaluation.totalDurationSec,
    booklets: evaluation.booklets,
    bookletResults: evaluation.bookletResults,
    bookletMode: state.config.bookletMode,
    gradedQuestionCount: evaluation.overall.gradedQuestionCount,
    keyedQuestionCount: evaluation.overall.keyedQuestionCount ?? evaluation.overall.gradedQuestionCount,
    correct: evaluation.overall.correct,
    wrong: evaluation.overall.wrong,
    blank: evaluation.overall.blank,
    ungraded: evaluation.overall.ungraded,
    answered: evaluation.overall.answered,
    score: evaluation.overall.score,
    maxScore: 20,
    percentage: evaluation.overall.percentage,
    taz: evaluation.overall.taz,
    graded: evaluation.overall.complete,
    pendingCorrection: !evaluation.overall.complete,
    answers: { ...state.answers },
    questionPages: { ...state.questionPages },
    correctAnswers: { ...state.correctAnswers },
    durationSec: evaluation.totalDurationSec,
    startedAt: state.startedAt,
    finishedAt: new Date().toISOString(),
    languageMode: state.config.languageMode,
    negativeMarking: state.config.negativeMarking,
    negativeMarkingEnabled: evaluation.overall.negativeMarkingEnabled,
    negativeMarkingLabel: negativeMarkingLabel(state.config.negativeMarking),
    correctionStatus: evaluation.overall.complete ? 'graded' : 'pending'
  };
}

function renderResultModal(record){
  const bookletCards = Array.isArray(record.bookletResults) && record.bookletResults.length
    ? record.bookletResults.map((b, idx) => `
        <div class="result-booklet-card">
          <div class="title">${b.title || `دفترچه ${idx + 1}`}</div>
          <div class="line">سؤال‌ها: ${b.questionCount}</div>
          <div class="line">صفحه‌ها: ${b.pageStart || '—'} تا ${b.pageEnd || '—'}</div>
          <div class="line">نمره: ${typeof b.score === 'number' ? `${b.score.toFixed(2)} از ۲۰` : '—'}</div>
          <div class="line">درصد: ${typeof b.percentage === 'number' ? `${b.percentage.toFixed(2)}%` : '—'}</div>
          <div class="line">صحیح: ${b.correct} | غلط: ${b.wrong} | بی‌پاسخ: ${b.blank}</div>
          <div class="line">کلیددار: ${b.gradedQuestionCount ?? b.keyedQuestionCount ?? 0} | بدون کلید: ${b.ungraded ?? 0}</div>
        </div>
      `).join('')
    : '';

  const rows = [];
  for(let i = 1; i <= record.questionCount; i++){
    const q = `q${i}`;
    const user = record.answers[q] || '—';
    const correct = record.correctAnswers[q];
    const hasKey = !!(correct && String(correct).trim());
    const bookletLabel = getBookletLabelForQuestion(i);
    const page = record.questionPages?.[q] || '—';
    let statusClass = 'status-blank';
    let statusText = 'بدون پاسخ';
    if(!hasKey){ statusClass = 'status-pending'; statusText = 'بدون کلید'; }
    else if(user === '—'){ statusClass = 'status-blank'; statusText = 'بی‌پاسخ'; }
    else if(String(user) === String(correct)){ statusClass = 'status-ok'; statusText = 'صحیح'; }
    else{ statusClass = 'status-bad'; statusText = 'غلط'; }
    rows.push(`
      <tr>
        <td>${i}</td>
        <td>${bookletLabel}</td>
        <td>${page}</td>
        <td>${user}</td>
        <td>${correct || '—'}</td>
        <td>${hasKey ? 'دارد' : 'ندارد'}</td>
        <td class="${statusClass}">${statusText}</td>
      </tr>
    `);
  }

  const keyedCount = Number.isFinite(record.gradedQuestionCount) ? record.gradedQuestionCount : (Number.isFinite(record.keyedQuestionCount) ? record.keyedQuestionCount : Math.max(0, record.questionCount - (record.ungraded || 0)));
  const ungradedCount = Number.isFinite(record.ungraded) ? record.ungraded : Math.max(0, record.questionCount - keyedCount);
  const hasUngraded = ungradedCount > 0;
  const bookletSummary = Array.isArray(record.bookletResults) && record.bookletResults.length
    ? record.bookletResults.map((b, idx) => `${b.title || `دفترچه ${idx + 1}`}: ${typeof b.score === 'number' ? `${b.score.toFixed(2)} از ۲۰` : '—'}`).join(' | ')
    : '';

  els.resultContent.innerHTML = `
    <div class="result-content">
      <div class="result-hero">
        <h4>${record.examTitle}</h4>
        <div class="result-summary">
          <div class="result-item">تراز تقریبی: ${record.taz !== null && record.taz !== undefined ? record.taz : '—'}</div>
          <div class="result-item">درصد: ${record.percentage !== null && record.percentage !== undefined ? `${record.percentage.toFixed(2)}%` : '—'}</div>
          <div class="result-item">نمره از ۲۰: ${record.score !== null && record.score !== undefined ? `${record.score.toFixed(2)} از ۲۰` : '—'}</div>
          <div class="result-item">کلیددار: ${keyedCount}</div>
          <div class="result-item">بدون کلید: ${ungradedCount}</div>
          <div class="result-item">صحیح: ${record.correct}</div>
          <div class="result-item">غلط: ${record.wrong}</div>
          <div class="result-item">بی‌پاسخ: ${record.blank}</div>
          <div class="result-item">زمان آزمون: ${fmtTime(record.durationSec)}</div>
          <div class="result-item">تاریخ ثبت: ${record.submittedAt}</div>
          <div class="result-item">نمره منفی: ${(record.negativeMarkingEnabled ?? normalizeNegativeMarking(record.negativeMarking)) ? 'دارد' : 'ندارد'}</div>
          <div class="result-item">وضعیت تصحیح: ${hasUngraded ? 'بخشی بدون کلید' : 'نهایی'}</div>
        </div>
      </div>
      ${bookletSummary ? `<div class="pending-banner">${bookletSummary}</div>` : ''}
      ${bookletCards ? `<div class="result-booklet-grid">${bookletCards}</div>` : ''}
      ${hasUngraded ? '<div class="pending-banner">بعضی سؤال‌ها هنوز کلید ندارند. این بخش‌ها در درصد و نمره حساب نشده‌اند و فقط در ستون «کلید» با وضعیت «ندارد» مشخص شده‌اند.</div>' : ''}
      <div class="result-table-wrap">
        <table class="result-table">
          <thead>
            <tr>
              <th>سؤال</th>
              <th>دفترچه</th>
              <th>صفحه</th>
              <th>پاسخ داده‌شده</th>
              <th>پاسخ صحیح</th>
              <th>کلید</th>
              <th>وضعیت</th>
            </tr>
          </thead>
          <tbody>${rows.join('')}</tbody>
        </table>
      </div>
    </div>
  `;

  if(els.gradePendingBtn) els.gradePendingBtn.style.display = 'inline-flex';
  state.lastResult = record;
  openModal(els.resultModal);
}

function buildPrintableReportHtml(record){
  const rows = [];
  for(let i = 1; i <= record.questionCount; i++){
    const q = `q${i}`;
    const user = record.answers[q] || '—';
    const correct = record.correctAnswers[q] || '—';
    const hasKey = !!(record.correctAnswers[q] && String(record.correctAnswers[q]).trim());
    let status = 'بدون پاسخ';
    if(!hasKey) status = 'بدون کلید';
    else if(user === '—') status = 'بی‌پاسخ';
    else if(String(user) === String(record.correctAnswers[q])) status = 'صحیح';
    else status = 'غلط';
    rows.push(`
      <tr>
        <td>${i}</td>
        <td>${escapeHtml(user)}</td>
        <td>${escapeHtml(correct)}</td>
        <td>${hasKey ? 'دارد' : 'ندارد'}</td>
        <td>${status}</td>
      </tr>
    `);
  }
  const keyedCount = Number.isFinite(record.gradedQuestionCount) ? record.gradedQuestionCount : (Number.isFinite(record.keyedQuestionCount) ? record.keyedQuestionCount : Math.max(0, record.questionCount - (record.ungraded || 0)));
  const ungradedCount = Number.isFinite(record.ungraded) ? record.ungraded : Math.max(0, record.questionCount - keyedCount);
  const pending = ungradedCount > 0;
  const bookletCards = Array.isArray(record.bookletResults) && record.bookletResults.length
    ? record.bookletResults.map((b, idx) => `
      <div class="print-card">
        <div class="print-card-title">${b.title || `دفترچه ${idx + 1}`}</div>
        <div>صفحات: ${b.pageStart || '—'} تا ${b.pageEnd || '—'}</div>
        <div>نمره: ${typeof b.score === 'number' ? `${b.score.toFixed(2)} از ۲۰` : '—'}</div>
        <div>درصد: ${typeof b.percentage === 'number' ? `${b.percentage.toFixed(2)}%` : '—'}</div>
      </div>
    `).join('')
    : '';
  return `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>کارنامه آزمون</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Tahoma, Arial, sans-serif; color: #111827; background: #fff; }
  .report { direction: rtl; padding: 0; }
  .hero { border: 1px solid #cbd5e1; border-radius: 18px; padding: 16px 18px; background: linear-gradient(135deg, #eff6ff, #ecfeff); margin-bottom: 14px; }
  .hero h1 { margin: 0 0 8px; font-size: 20px; }
  .meta { color: #475569; font-size: 12px; line-height: 1.9; }
  .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0 16px; }
  .card, .print-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 10px 12px; font-size: 12px; background: #fff; }
  .card strong { display:block; margin-top:4px; font-size: 15px; }
  .print-card-title{font-weight:700;margin-bottom:4px}
  .print-booklets{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px}
  .table-wrap { border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  thead th { background: #f8fafc; border-bottom: 1px solid #e5e7eb; padding: 8px 6px; text-align: center; }
  tbody td { border-bottom: 1px solid #e5e7eb; padding: 7px 6px; text-align: center; }
  tbody tr:last-child td { border-bottom: none; }
  .note { margin-top: 12px; color: #64748b; font-size: 11px; line-height: 1.8; }
  .pending { margin: 10px 0 14px; border: 1px dashed #f59e0b; background: #fffbeb; border-radius: 12px; padding: 10px 12px; color: #92400e; font-size: 11px; line-height: 1.8; }
</style>
</head>
<body>
  <div class="report">
    <div class="hero">
      <h1>${escapeHtml(record.examTitle || 'کارنامه آزمون')}</h1>
      <div class="meta">
        تاریخ ثبت: ${escapeHtml(record.submittedAt)}<br />
        زمان آزمون: ${escapeHtml(fmtTime(record.durationSec))}<br />
        نمره منفی: ${(record.negativeMarkingEnabled ?? normalizeNegativeMarking(record.negativeMarking)) ? 'دارد' : 'ندارد'}<br />
        وضعیت: ${pending ? 'بخشی بدون کلید' : 'نهایی'}
      </div>
    </div>

    ${pending ? '<div class="pending">بعضی سؤال‌ها هنوز کلید ندارند؛ این سؤال‌ها در محاسبه‌ی نمره و درصد حساب نشده‌اند.</div>' : ''}

    <div class="print-booklets">${bookletCards}</div>

    <div class="summary">
      <div class="card">تراز تقریبی<strong>${record.taz !== null && record.taz !== undefined ? record.taz : '—'}</strong></div>
      <div class="card">درصد<strong>${record.percentage !== null && record.percentage !== undefined ? `${record.percentage.toFixed(2)}%` : '—'}</strong></div>
      <div class="card">نمره از ۲۰<strong>${record.score !== null && record.score !== undefined ? `${record.score.toFixed(2)} از ۲۰` : '—'}</strong></div>
      <div class="card">کلیددار<strong>${keyedCount}</strong></div>
      <div class="card">بدون کلید<strong>${ungradedCount}</strong></div>
      <div class="card">بی‌پاسخ<strong>${record.blank}</strong></div>
      <div class="card">صحیح<strong>${record.correct}</strong></div>
      <div class="card">غلط<strong>${record.wrong}</strong></div>
      <div class="card">کل سؤال‌ها<strong>${record.questionCount}</strong></div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>سؤال</th>
            <th>پاسخ داده‌شده</th>
            <th>پاسخ صحیح</th>
            <th>کلید</th>
            <th>وضعیت</th>
          </tr>
        </thead>
        <tbody>${rows.join('')}</tbody>
      </table>
    </div>

    <div class="note">
      این گزارش برای ذخیره به‌صورت PDF آماده شده است. در پنجره چاپ، گزینه «Save as PDF» یا «ذخیره به‌صورت PDF» را انتخاب کن.
    </div>
  </div>
</body>
</html>`;
}

function switchToNextBooklet(auto = false){
  const booklets = getBookletsFromConfig();
  const nextIndex = state.activeBookletIndex + 1;
  const currentIndex = state.activeBookletIndex;
  if(!booklets[nextIndex]){
    finishExam(true);
    return false;
  }
  if(Array.isArray(state.bookletStates) && state.bookletStates[currentIndex]){
    state.bookletStates[currentIndex] = {
      ...state.bookletStates[currentIndex],
      completed: true,
      remainingSec: 0
    };
  }
  state.activeBookletIndex = nextIndex;
  const next = state.bookletStates[nextIndex] || {
    index: nextIndex,
    remainingSec: booklets[nextIndex].durationSec,
    durationSec: booklets[nextIndex].durationSec,
    completed: false,
    startedAt: null
  };
  next.remainingSec = Math.max(0, next.remainingSec || next.durationSec || 0);
  next.startedAt = next.startedAt || new Date().toISOString();
  state.bookletStates[nextIndex] = next;
  state.remainingSec = next.remainingSec;
  state.startedAt = state.startedAt || new Date().toISOString();
  renderAnswerSheet();
  updateTimerUI(state.remainingSec);
  updateStats();
  refreshActionButtons();
  refreshPreviewForActiveBooklet();
  saveDraft();
  setStatus('running', auto ? 'دفترچه بعدی به‌صورت خودکار شروع شد' : 'دفترچه بعدی شروع شد');
  return true;
}

function startTimer(resume = false){
  stopTimer();
  if(!resume){
    state.startedAt = new Date().toISOString();
    state.running = true;
    state.finished = false;
    if(!Array.isArray(state.bookletStates) || !state.bookletStates.length){
      initializeBookletRuntime();
    }
    state.remainingSec = state.bookletStates[state.activeBookletIndex]?.remainingSec ?? state.remainingSec ?? state.durationSec;
  }else{
    state.running = true;
    state.finished = false;
  }
  updateTimerUI(state.remainingSec);
  setStatus('running', resume ? 'ادامه‌ی آزمون بازیابی شد' : 'در حال اجرا');
  refreshPreviewForActiveBooklet();
  saveDraft();
  state.timerId = setInterval(() => {
    state.remainingSec -= 1;
    if(state.bookletStates?.[state.activeBookletIndex]){
      state.bookletStates[state.activeBookletIndex].remainingSec = state.remainingSec;
    }
    if(state.remainingSec <= 0){
      state.remainingSec = 0;
      updateTimerUI(0);
      saveDraft();
      stopTimer();
      if(!switchToNextBooklet(true)){
        finishExam(true);
      }else{
        startTimer(true);
      }
      return;
    }
    updateTimerUI(state.remainingSec);
    saveDraft();
  }, 1000);
}

function finishExam(auto = false){
  if(!state.running && !auto && !state.startedAt){
    alert('ابتدا آزمون را شروع کن.');
    return;
  }
  syncConfigFromUI();
  stopTimer();
  const record = buildResultRecord();
  const items = readLocal(STORAGE_KEYS.submissions, []);
  items.push(record);
  saveLocal(STORAGE_KEYS.submissions, items);
  renderHistory();
  clearDraft();
  state.running = false;
  state.finished = true;
  state.lastResult = record;
  updateTimerUI(0);
  setStatus(record.ungraded ? 'finished' : 'finished', record.ungraded ? 'ثبت شد؛ بخشی بدون کلید' : 'ثبت شد');
  syncAnswerSheetState();
  updateStats();
  renderManagementText();
  if(els.gradePendingBtn) els.gradePendingBtn.style.display = 'inline-flex';
  renderResultModal(record);
}

function bindBookletLiveSettings(){
  const onSettingsChange = () => {
    if(state.running) return;
    syncConfigFromUI();
    renderKeyTable();
    renderAnswerSheet();
    renderManagementText();
    saveLocal(STORAGE_KEYS.config, {
      ...state.config,
      questionCount: state.questionCount,
      correctAnswers: state.correctAnswers,
      questionPages: state.questionPages,
      previewName: state.preview.name || state.config.previewName || '',
      previewType: state.preview.type || state.config.previewType || ''
    });
    updateBookletUI();
  };
  els.bookletMode?.addEventListener('change', onSettingsChange);
  els.booklet1QuestionCount?.addEventListener('change', onSettingsChange);
  els.booklet1PageStart?.addEventListener('change', onSettingsChange);
  els.booklet1PageEnd?.addEventListener('change', onSettingsChange);
  els.booklet1Hours?.addEventListener('change', onSettingsChange);
  els.booklet1Minutes?.addEventListener('change', onSettingsChange);
  els.booklet1Seconds?.addEventListener('change', onSettingsChange);
  els.booklet2QuestionCount?.addEventListener('change', onSettingsChange);
  els.booklet2PageStart?.addEventListener('change', onSettingsChange);
  els.booklet2PageEnd?.addEventListener('change', onSettingsChange);
  els.booklet2Hours?.addEventListener('change', onSettingsChange);
  els.booklet2Minutes?.addEventListener('change', onSettingsChange);
  els.booklet2Seconds?.addEventListener('change', onSettingsChange);
}

bindBookletLiveSettings();
// ===== end patched booklet + preview runtime =====
function init(){
  loadConfig();
  renderHistory();
  clearPreview();
  updateTimerUI(state.running ? state.remainingSec : state.durationSec);
  setStatus(state.running ? 'running' : 'idle', state.running ? 'ادامه‌ی آزمون بازیابی شد' : 'آماده');
  renderManagementText();
  state.guardAction = null;
  state.guardProgress = 0;
  bindEvents();

  if(!state.running){
    state.finished = false;
    state.answers = {};
    syncAnswerSheetState();
    updateStats();
    setTimeout(() => {
      els.previewPlaceholder.style.display = 'flex';
      els.pdfViewer.classList.remove('active');
      els.imageViewer.classList.remove('active');
    }, 0);
  }else{
    syncAnswerSheetState();
    updateStats();
  }
}
init();