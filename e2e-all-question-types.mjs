import { chromium } from 'playwright';

const BASE = 'http://localhost:3001';
const GATEWAY = 'http://localhost:5000';
const USER = 'tukhoa040505@gmail.com';
const PASS = 'Khoa040505@';

const findings = [];
function log(label, ok, detail = '') {
  const mark = ok === true ? 'PASS' : ok === false ? 'FAIL' : 'INFO';
  const line = `[${mark}] ${label}${detail ? ' :: ' + detail : ''}`;
  console.log(line);
  findings.push({ label, ok, detail });
}

function getTokScript() {
  return `(document.cookie.match(/(?:^|;\\s*)access_token=([^;]+)/) || [])[1] || ''`;
}

async function api(page, path, opts = {}) {
  return page.evaluate(async ({ g, path, opts, getTok }) => {
    const tok = eval(getTok);
    const headers = Object.assign(
      { 'Content-Type': 'application/json', Authorization: 'Bearer ' + decodeURIComponent(tok) },
      opts.headers || {}
    );
    const r = await fetch(g + path, {
      method: opts.method || 'GET',
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    return { status: r.status, body: await r.text() };
  }, { g: GATEWAY, path, opts, getTok: getTokScript() }).catch(e => ({ status: 'err', body: e.message }));
}

async function login(page) {
  console.log('\n=== 1. LOGIN ===');
  await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.fill('#email', USER);
  await page.fill('#password', PASS);
  await page.locator('button[type="submit"]').first().click();
  try {
    await page.waitForURL(url => !url.pathname.includes('/auth/login'), { timeout: 15000 });
  } catch {
    log('login redirect', false, `still at ${page.url()}`);
    return false;
  }
  await page.waitForTimeout(1000);
  log('login', true, `landed on ${page.url()}`);
  return true;
}

async function listExams(page, skill) {
  console.log(`\n=== 2. LIST ${skill.toUpperCase()} EXAMS ===`);
  const r = await api(page, '/api-exams/public/exam/getall?page=1&pageSize=200&category=IELTS');
  if (r.status !== 200) {
    log(`list public exams`, false, `status=${r.status} body=${(r.body || '').slice(0, 200)}`);
    return [];
  }
  const json = JSON.parse(r.body);
  const data = json.data?.data ?? json.data ?? [];
  return data.filter(x => (x.slug || '').toLowerCase().includes(skill));
}

async function startAttempt(page, examId) {
  console.log('\n=== 3. START ATTEMPT ===');
  const r = await api(page, '/api-attempts/attempt/attempts:start', { method: 'POST', body: { examId } });
  if (r.status !== 200 && r.status !== 201) {
    log('start attempt', false, `status=${r.status} body=${(r.body || '').slice(0, 400)}`);
    return null;
  }
  const json = JSON.parse(r.body);
  const attemptId = json.data?.attemptId || json.data?.id || json.attemptId || json.id;
  log('start attempt', !!attemptId, `attemptId=${attemptId}`);
  return attemptId;
}

async function getAttemptPaper(page, attemptId) {
  const r = await api(page, `/api-attempts/attempt/${attemptId}`);
  if (r.status !== 200) {
    log('get attempt', false, `status=${r.status} body=${(r.body || '').slice(0, 200)}`);
    return null;
  }
  return JSON.parse(r.body);
}

async function autosaveAnswer(page, attemptId, answer) {
  const body = { answers: [answer], clientRevision: Date.now() };
  const r = await api(page, `/api-attempts/attempt/autosave/${attemptId}`, { method: 'POST', body });
  if (r.status !== 200 && r.status !== 201) {
    console.log(`   autosave fail (${r.status}): ${(r.body || '').slice(0, 200)}`);
  } else {
    console.log(`   autosave ok: qid=${answer.questionId} optIds=${JSON.stringify(answer.selectedOptionIds)} text=${JSON.stringify(answer.textAnswer)}`);
  }
  return r;
}

// Coffee test's summary-completion correct keys (from seed SQL, in order)
const COFFEE_COMPLETION_KEYS = [
  'epicarp',
  'mesocarp',
  'endocarp',
  'wet milled',
  'overnight',
  'raked',
  'sun dried',
];

let completionIndex = 0;

function pickAnswer(q) {
  const t = (q.type || q.questionType || '').toUpperCase();

  if (t === 'SINGLE_CHOICE' || t === 'TRUE_FALSE' || t === 'TRUE_FALSE_NOT_GIVEN' || t === 'YES_NO_NOT_GIVEN') {
    const opt = (q.options || []).find(o => o.isCorrect) || (q.options || [])[0];
    if (!opt) return null;
    return { questionId: q.id, selectedOptionIds: [opt.id], textAnswer: null };
  }
  if (t === 'MULTI_CHOICE') {
    const opts = (q.options || []).filter(o => o.isCorrect);
    return { questionId: q.id, selectedOptionIds: opts.map(o => o.id), textAnswer: null };
  }
  if (t === 'MATCHING_HEADING' || t === 'MATCHING' || t === 'MATCHING_FEATURE') {
    const opt = (q.options || [])[0];
    if (!opt) return null;
    const content = opt.contentMd || opt.content || '';
    const roman = content.split('.')[0].trim();
    return { questionId: q.id, selectedOptionIds: null, textAnswer: roman };
  }
  if (t === 'ORDERING') {
    return { questionId: q.id, selectedOptionIds: null, textAnswer: 'a,b,c' };
  }
  // completion / short answer — assign correct key by sequence
  if (t === 'SUMMARY_COMPLETION' || t === 'TABLE_COMPLETION' || t === 'NOTE_COMPLETION' ||
      t === 'FORM_COMPLETION' || t === 'FLOW_CHART_COMPLETION' || t === 'DIAGRAM_LABEL' ||
      t === 'MAP_LABEL' || t === 'SHORT_ANSWER' || t === 'COMPLETION') {
    const answer = COFFEE_COMPLETION_KEYS[completionIndex] || 'PLACEHOLDER_TEST_ANSWER';
    completionIndex++;
    return { questionId: q.id, selectedOptionIds: null, textAnswer: answer };
  }
  return { questionId: q.id, selectedOptionIds: null, textAnswer: 'PLACEHOLDER_TEST_ANSWER' };
}

async function answerAllQuestions(page, attemptId, paper) {
  // Reset completion counter at the start of each attempt
  completionIndex = 0;
  console.log('\n=== 4. ANSWER ALL QUESTIONS ===');
  const answers = [];
  for (const sec of (paper?.paper?.sections || paper?.sections || [])) {
    for (const g of (sec.questionGroups || [])) {
      for (const q of (g.questions || [])) {
        const t = (q.type || q.questionType || '').toUpperCase();
        if (t === 'MATCHING_HEADING') {
          const opts = (q.options || []).slice(0, 3).map(o => ({ id: o.id, content: (o.contentMd || o.content || '').slice(0, 30) }));
          console.log(`   matching-heading qid=${q.id} options[0..3]=${JSON.stringify(opts)}`);
        } else {
          // Show acceptTexts for completion questions
          if (q.blankAcceptTexts) {
            console.log(`   completion qid=${q.id} blanks=${JSON.stringify(q.blankAcceptTexts)}`);
          } else if (q.options && q.options.length) {
            console.log(`   ${t} qid=${q.id} option[0]=${(q.options[0].contentMd || '').slice(0, 30)} isCorrect=${!!q.options[0].isCorrect}`);
          }
        }
        const a = pickAnswer(q);
        if (a) answers.push(a);
      }
    }
  }
  log('answers prepared', true, `${answers.length} answers`);
  for (const a of answers) {
    await autosaveAnswer(page, attemptId, a);
  }
}

async function submitAttempt(page, attemptId) {
  console.log('\n=== 5. SUBMIT ATTEMPT ===');
  // Submit doesn't take a body — it uses autosaved answers.
  const s = await api(page, `/api-attempts/attempt/submit/${attemptId}`, { method: 'POST', body: {} });
  log('submit attempt', s.status === 200 || s.status === 201, `status=${s.status}`);
  if (s.status !== 200 && s.status !== 201) {
    console.log('   submit body:', (s.body || '').slice(0, 400));
  }
}

async function getResult(page, attemptId) {
  console.log('\n=== 6. GET RESULT ===');
  await page.goto(`${BASE}/attempts/${attemptId}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  await page.screenshot({ path: '/tmp/result_overview.png', fullPage: true });

  // Click into the first question card to see the detail (Your Answer / Correct Key)
  const firstCard = page.locator('div').filter({ hasText: /^1\s*Reading/ }).first();
  await firstCard.click({ force: true }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/result_expanded.png', fullPage: true });

  // Extract visible "Your Answer" and "Correct Key" content from the rendered DOM
  const details = await page.evaluate(() => {
    const result = [];
    const cards = Array.from(document.querySelectorAll('div')).filter(d => {
      const t = (d.textContent || '').trim();
      return t.includes('Your Answer') && t.includes('Correct Key') && t.length < 2000;
    });
    for (const card of cards) {
      const ya = card.querySelector('div[class*="text-red"]') || card.querySelector('div');
      const yaText = Array.from(card.querySelectorAll('*')).find(el => el.textContent.trim() === 'Your Answer');
      const ckText = Array.from(card.querySelectorAll('*')).find(el => el.textContent.trim() === 'Correct Key');
      let yaValue = '', ckValue = '';
      if (yaText) {
        // walk forward to find value
        let p = yaText.parentElement;
        for (let i = 0; i < 3 && p; i++) {
          const sib = p.nextElementSibling;
          if (sib) { yaValue = (sib.textContent || '').trim(); break; }
          p = p.parentElement;
        }
      }
      if (ckText) {
        let p = ckText.parentElement;
        for (let i = 0; i < 3 && p; i++) {
          const sib = p.nextElementSibling;
          if (sib) { ckValue = (sib.textContent || '').trim(); break; }
          p = p.parentElement;
        }
      }
      result.push({ ya: yaValue, ck: ckValue });
    }
    return result;
  });
  console.log('\n=== RENDERED Detail Cards (FE display) ===');
  details.forEach((d, i) => console.log(`  [${i}] Your Answer: ${JSON.stringify(d.ya)} | Correct Key: ${JSON.stringify(d.ck)}`));

  // Now scroll to first matching-heading expanded card and screenshot
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  // The detail card should be visible after clicking. Let me look at the DOM for "Correct Key"
  const detailDom = await page.evaluate(() => {
    const blocks = [];
    const all = Array.from(document.querySelectorAll('*'));
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      const t = (el.textContent || '').trim();
      if ((t === 'Correct Key' || t === 'Your Answer') && el.children.length === 0) {
        // walk up to find the card and get the value
        let card = el.parentElement;
        for (let j = 0; j < 3 && card; j++) {
          if ((card.textContent || '').length > (t.length + 5)) break;
          card = card.parentElement;
        }
        if (card) {
          const fullText = (card.textContent || '').replace(/Correct Key|Your Answer/g, '').trim();
          blocks.push({ label: t, value: fullText.slice(0, 200) });
        }
      }
    }
    return blocks;
  });
  console.log('\n=== Detail card blocks (label/value pairs) ===');
  console.log(JSON.stringify(detailDom, null, 2));

  const r = await api(page, `/api-attempts/attempt/getresult/${attemptId}`);
  if (r.status !== 200) {
    log('get result', false, `status=${r.status} body=${(r.body || '').slice(0, 200)}`);
    return null;
  }
  const json = JSON.parse(r.body);
  const data = json.data || json;
  log('get result', true, `status=${data.status ?? '?'} correct=${data.correct ?? data.correctCount ?? '?'}/${data.totalQuestions ?? data.totalPoints ?? '?'}`);
  return { data, dom: detailDom };
}

function inspectResult(data) {
  console.log('\n=== 7. INSPECT RESULT ===');
  const answers = data.answers || data.items || data.questions || [];
  const questionMetaById = {};
  const paper = data.paperWithAnswers || data.paper;
  if (paper?.sections) {
    for (const sec of paper.sections) {
      const questions = sec.questions || (sec.questionGroups || []).flatMap(g => g.questions || []);
      for (const q of questions) {
        if (q?.id) questionMetaById[q.id] = q;
      }
    }
  }
  const byType = {};
  for (const a of answers) {
    const q = questionMetaById[a.questionId] || {};
    const t = (q.type || a.questionType || 'UNKNOWN').toUpperCase();
    byType[t] = byType[t] || [];
    byType[t].push({
      prompt: (q.promptMd || '').slice(0, 40),
      isCorrect: a.isCorrect,
      userText: a.selectedAnswerText,
      correctText: a.correctAnswerText,
    });
  }
  for (const t of Object.keys(byType)) {
    const arr = byType[t];
    const correct = arr.filter(x => x.isCorrect).length;
    console.log(`\n--- ${t} : ${arr.length} total, ${correct} correct ---`);
    for (const a of arr) {
      console.log(`  prompt="${a.prompt}"`);
      console.log(`    user=${JSON.stringify(a.userText)}`);
      console.log(`    correct=${JSON.stringify(a.correctText)}`);
      console.log(`    isCorrect=${a.isCorrect}`);
    }
  }
  return byType;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();

  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));

  const ok = await login(page);
  if (!ok) { await browser.close(); return; }

  // ===== Test 1: Reading =====
  const readingExams = await listExams(page, 'reading');
  if (!readingExams.length) { await browser.close(); return; }
  const coffee = readingExams.find(x => /coffee/i.test(x.title)) || readingExams[0];
  log('pick reading exam', !!coffee, coffee.title);

  const attemptId = await startAttempt(page, coffee.id);
  if (!attemptId) { await browser.close(); return; }

  const attempt = await getAttemptPaper(page, attemptId);
  if (!attempt) { await browser.close(); return; }
  const paper = attempt.data?.paper || attempt.paper || attempt;
  await answerAllQuestions(page, attemptId, paper);
  await submitAttempt(page, attemptId);

  await page.waitForTimeout(3000);

  console.log('\n========== READING TEST RESULT ==========');
  const result = await getResult(page, attemptId);
  if (result) {
    console.log('\n=== API result inspection ===');
    inspectResult(result.data);
  }

  // ===== Test 2: Listening =====
  const listeningExams = await listExams(page, 'listening');
  if (listeningExams.length) {
    const listen = listeningExams[0];
    log('pick listening exam', !!listen, listen.title);
    const attemptId2 = await startAttempt(page, listen.id);
    if (attemptId2) {
      const a2 = await getAttemptPaper(page, attemptId2);
      if (a2) {
        const p2 = a2.data?.paper || a2.paper || a2;
        await answerAllQuestions(page, attemptId2, p2);
        await submitAttempt(page, attemptId2);
        await page.waitForTimeout(3000);
        console.log('\n========== LISTENING TEST RESULT ==========');
        const r2 = await getResult(page, attemptId2);
        if (r2) {
          inspectResult(r2.data);
          // Also screenshot the listening detail
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.waitForTimeout(300);
          // Click on the LAST listening question to see completion display
          const completionCard = page.locator('div').filter({ hasText: /Complete the hotel/ }).first();
          if (await completionCard.count() > 0) {
            await completionCard.click({ force: true }).catch(() => {});
            await page.waitForTimeout(1500);
            await completionCard.scrollIntoViewIfNeeded();
            await page.screenshot({ path: '/tmp/listening_form_completion.png', fullPage: true });
          }
        }
      }
    }
  }

  console.log('\n=== Console errors (first 20) ===');
  errors.slice(0, 20).forEach(e => console.log('ERR:', e));

  console.log('\n=== SUMMARY ===');
  const pass = findings.filter(f => f.ok === true).length;
  const fail = findings.filter(f => f.ok === false).length;
  console.log(`${pass} passed, ${fail} failed`);

  await browser.close();
}

run().catch(e => {
  console.error('Test failed:', e);
  process.exit(1);
});
