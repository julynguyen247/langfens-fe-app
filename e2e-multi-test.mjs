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

const GET_TOK = `(document.cookie.match(/(?:^|;\\s*)access_token=([^;]+)/) || [])[1] || ''`;

async function api(page, path, opts = {}) {
  return page.evaluate(async ({ g, path, opts, GET_TOK }) => {
    const tok = eval(GET_TOK);
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
  }, { g: GATEWAY, path, opts, GET_TOK }).catch(e => ({ status: 'err', body: e.message }));
}

async function login(page) {
  await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.fill('#email', USER);
  await page.fill('#password', PASS);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(url => !url.pathname.includes('/auth/login'), { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);
  log('login', true, `landed on ${page.url()}`);
}

async function listExams(page, skill) {
  const r = await api(page, '/api-exams/public/exam/getall?page=1&pageSize=200&category=IELTS');
  if (r.status !== 200) return [];
  const json = JSON.parse(r.body);
  return (json.data?.data ?? json.data ?? []).filter(x => (x.slug || '').toLowerCase().includes(skill));
}

async function getPublicExamWithKeys(page, slug) {
  // The public exam has the correct keys (isCorrect on options) — we can use it
  // to know which option to pick for MCQ.
  const r = await api(page, `/api-exams/public/exam/getby/${encodeURIComponent(slug)}`);
  if (r.status !== 200) {
    console.log('   getPublicExamWithKeys failed:', r.status, (r.body || '').slice(0, 200));
    return null;
  }
  const json = JSON.parse(r.body);
  return json.data || json;
}

async function startAttempt(page, examId) {
  const r = await api(page, '/api-attempts/attempt/attempts:start', { method: 'POST', body: { examId } });
  if (r.status !== 200 && r.status !== 201) return null;
  const j = JSON.parse(r.body);
  return j.data?.attemptId || j.data?.id || j.attemptId || j.id;
}

async function getAttemptPaper(page, attemptId) {
  const r = await api(page, `/api-attempts/attempt/${attemptId}`);
  if (r.status !== 200) return null;
  return JSON.parse(r.body);
}

async function autosaveAnswer(page, attemptId, answer) {
  const body = { answers: [answer], clientRevision: Date.now() };
  const r = await api(page, `/api-attempts/attempt/autosave/${attemptId}`, { method: 'POST', body });
  return r;
}

async function submitAttempt(page, attemptId) {
  const s = await api(page, `/api-attempts/attempt/submit/${attemptId}`, { method: 'POST', body: {} });
  return s;
}

async function getResult(page, attemptId) {
  await page.goto(`${BASE}/attempts/${attemptId}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  const r = await api(page, `/api-attempts/attempt/getresult/${attemptId}`);
  if (r.status !== 200) return null;
  const json = JSON.parse(r.body);
  return json.data || json;
}

// Hardcoded correct answers per test
const TEST_ANSWER_KEYS = {
  // Termite Mounds reading test
  'THE LIFE OF TERMITE MOUNDS': {
    matching: {
      'paragraph-a-q1': 'iii',
      'paragraph-b-q2': 'vii',
      'paragraph-c-q3': 'iv',
      'paragraph-d-q4': 'ix',
      'paragraph-e-q5': 'ii',
      'paragraph-f-q6': 'i',
      'paragraph-g-q7': 'vi',
    },
    completion: [],  // not present in this test
  },
  'THE STORY OF COFFEE': {
    matching: {
      'paragraph-b-q1': 'viii',
      'paragraph-c-q2': 'ix',
      'paragraph-d-q3': 'vi',
      'paragraph-e-q4': 'xi',
      'paragraph-f-q5': 'i',
      'paragraph-g-q6': 'iii',
    },
    completion: ['epicarp', 'mesocarp', 'endocarp', 'wet milled', 'overnight', 'raked', 'sun dried'],
  },
  // Listening tests
  'LISTENING-TEST1': {
    formCompletion: ['Rachel Torres', '15 September', 'single', 'sea view', '3 nights'],
    multiChoice: ['C', 'B', 'B', 'B', 'B', 'B', 'D', 'B', 'C'],
    shortAnswer: ['5 minutes', '10 to 15', 'Arctic amplification'],
    noteCompletion: ['9 PM', '6 PM', 'public holidays', '10', '3', '2', 'second', '6', '8', '5'],
    sentenceCompletion: ['first half', 'government-managed', '8', '15'],
    summaryCompletion: ['2015', '1.5 degrees', '89%'],
  },
};

// Try to look up correct answer from the question's accept texts / isCorrect option
function pickAnswer(q, publicMeta) {
  const t = (q.type || q.questionType || '').toUpperCase();
  const pubQ = publicMeta?.byId?.[q.id];

  if (t === 'MATCHING_HEADING' || t === 'MATCHING' || t === 'MATCHING_FEATURE') {
    const opt = (q.options || [])[0];
    if (!opt) return null;
    const content = opt.contentMd || opt.content || '';
    const roman = content.split('.')[0].trim();
    return { questionId: q.id, selectedOptionIds: null, textAnswer: roman };
  }
  if (t === 'SINGLE_CHOICE' || t === 'MULTIPLE_CHOICE_SINGLE' || t === 'TRUE_FALSE' || t === 'TRUE_FALSE_NOT_GIVEN' || t === 'YES_NO_NOT_GIVEN') {
    // Match by content: find the attempt-paper option whose content matches the public exam's correct option
    const pubOptions = pubQ?.options || [];
    const correctPubOption = pubOptions.find(o => o.isCorrect);
    if (correctPubOption) {
      const target = (correctPubOption.contentMd || correctPubOption.content || '').trim().toLowerCase();
      const attemptOption = (q.options || []).find(o =>
        ((o.contentMd || o.content || '').trim().toLowerCase()) === target
      );
      if (attemptOption) {
        return { questionId: q.id, selectedOptionIds: [attemptOption.id], textAnswer: null };
      }
    }
    // fallback to first option
    const opt = (q.options || [])[0];
    if (!opt) return null;
    return { questionId: q.id, selectedOptionIds: [opt.id], textAnswer: null };
  }
  if (t === 'MULTI_CHOICE' || t === 'MULTIPLE_CHOICE_MULTI') {
    const pubOptions = pubQ?.options || [];
    const correctPubOptions = pubOptions.filter(o => o.isCorrect);
    if (correctPubOptions.length > 0) {
      const attemptOptIds = [];
      for (const pubOpt of correctPubOptions) {
        const target = (pubOpt.contentMd || pubOpt.content || '').trim().toLowerCase();
        const attemptOpt = (q.options || []).find(o =>
          ((o.contentMd || o.content || '').trim().toLowerCase()) === target
        );
        if (attemptOpt) attemptOptIds.push(attemptOpt.id);
      }
      if (attemptOptIds.length) return { questionId: q.id, selectedOptionIds: attemptOptIds, textAnswer: null };
    }
    return { questionId: q.id, selectedOptionIds: [q.options?.[0]?.id].filter(Boolean), textAnswer: null };
  }
  if (t === 'ORDERING') {
    return { questionId: q.id, selectedOptionIds: null, textAnswer: 'a,b,c' };
  }
  return { questionId: q.id, selectedOptionIds: null, textAnswer: 'PLACEHOLDER_TEST_ANSWER' };
}

function inspectResult(data, label) {
  console.log(`\n--- ${label} ---`);
  console.log(`  status: ${data.status} | correct: ${data.correct ?? data.correctCount ?? '?'}/${data.totalQuestions ?? '?'}`);
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
    console.log(`  ${t}: ${arr.length} total, ${correct} correct`);
    for (const a of arr.slice(0, 3)) {
      console.log(`    "${a.prompt}"`);
      console.log(`      user: ${JSON.stringify(a.userText)}`);
      console.log(`      key:  ${JSON.stringify(a.correctText)}`);
      console.log(`      ✓:    ${a.isCorrect}`);
    }
    if (arr.length > 3) console.log(`    ...+${arr.length - 3} more`);
  }
}

async function extractRenderedDetails(page) {
  return page.evaluate(() => {
    const result = [];
    document.querySelectorAll('*').forEach(el => {
      const t = (el.textContent || '').trim();
      if (t === 'Correct Key' && el.children.length === 0) {
        // walk up to find the card containing both Your Answer and Correct Key
        let card = el.parentElement;
        for (let i = 0; i < 4 && card; i++) {
          const cardText = card.textContent || '';
          if (cardText.includes('Your Answer') && cardText.length < 1500) {
            // found the card
            const yaEl = Array.from(card.querySelectorAll('*')).find(x => x.textContent.trim() === 'Your Answer');
            const ckEl = Array.from(card.querySelectorAll('*')).find(x => x.textContent.trim() === 'Correct Key');
            let yaValue = '', ckValue = '';
            if (yaEl) {
              let p = yaEl.parentElement;
              for (let j = 0; j < 3 && p; j++) {
                const sib = p.nextElementSibling;
                if (sib) { yaValue = (sib.textContent || '').trim(); break; }
                p = p.parentElement;
              }
            }
            if (ckEl) {
              let p = ckEl.parentElement;
              for (let j = 0; j < 3 && p; j++) {
                const sib = p.nextElementSibling;
                if (sib) { ckValue = (sib.textContent || '').trim(); break; }
                p = p.parentElement;
              }
            }
            result.push({ ya: yaValue.slice(0, 100), ck: ckValue.slice(0, 100) });
            break;
          }
          card = card.parentElement;
        }
      }
    });
    return result;
  });
}

async function runTest(page, exam, testName) {
  console.log(`\n========== ${testName}: ${exam.title} ==========`);
  const attemptId = await startAttempt(page, exam.id);
  if (!attemptId) {
    log(`${testName} start`, false, exam.title);
    return;
  }
  log(`${testName} start`, true, `attemptId=${attemptId}`);

  const attempt = await getAttemptPaper(page, attemptId);
  if (!attempt) return;
  const paper = attempt.data?.paper || attempt.paper || attempt;

  // Also fetch the public exam to know the correct options/keys
  const publicExam = await getPublicExamWithKeys(page, exam.slug);
  const byId = {};
  if (publicExam?.sections) {
    for (const sec of publicExam.sections) {
      const questions = sec.questions || (sec.questionGroups || []).flatMap(g => g.questions || []);
      for (const q of questions) {
        if (q?.id) byId[q.id] = q;
      }
    }
  }
  console.log(`   public exam keys loaded: ${Object.keys(byId).length} questions`);

  // Walk all questions
  const allQs = [];
  for (const sec of (paper?.sections || [])) {
    for (const g of (sec.questionGroups || [])) {
      for (const q of (g.questions || [])) allQs.push(q);
    }
  }
  log(`${testName} questions`, true, `${allQs.length} found`);

  // Debug: show first MCQ question's options from both
  const firstMCQ = allQs.find(q => ['MULTIPLE_CHOICE_SINGLE', 'SINGLE_CHOICE'].includes((q.type || '').toUpperCase()));
  if (firstMCQ) {
    console.log(`   attempt MCQ qid=${firstMCQ.id} opts=${JSON.stringify((firstMCQ.options || []).map(o => ({ id: o.id, content: o.contentMd || o.content, isCorrect: o.isCorrect })))}`);
    const pubQ = byId[firstMCQ.id];
    if (pubQ) console.log(`   public MCQ qid=${pubQ.id} opts=${JSON.stringify((pubQ.options || []).map(o => ({ id: o.id, content: o.contentMd || o.content, isCorrect: o.isCorrect })))}`);
  }

  for (const q of allQs) {
    const a = pickAnswer(q, { byId });
    if (a) await autosaveAnswer(page, attemptId, a);
  }
  await submitAttempt(page, attemptId);
  await page.waitForTimeout(3000);

  const result = await getResult(page, attemptId);
  if (result) {
    inspectResult(result, testName);
    const details = await extractRenderedDetails(page);
    if (details.length) {
      console.log(`\n  FE rendered details (first ${Math.min(3, details.length)}):`);
      for (const d of details.slice(0, 3)) {
        console.log(`    Your Answer: ${JSON.stringify(d.ya)}`);
        console.log(`    Correct Key: ${JSON.stringify(d.ck)}`);
      }
    }
  }
  return result;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();

  await login(page);

  // Test 1: Termite Mounds reading
  const reading = await listExams(page, 'reading');
  const termite = reading.find(x => /termite/i.test(x.title));
  if (termite) {
    await runTest(page, termite, 'READING (Termite)');
  } else {
    console.log('No termite test found');
  }

  // Test 1b: Coffee reading - to verify matching-heading display after fix
  const coffee = reading.find(x => /coffee/i.test(x.title));
  if (coffee) {
    const rC = await runTest(page, coffee, 'READING (Coffee)');
    if (rC) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      const firstCard = page.locator('div').filter({ hasText: /^1\s*Reading/ }).first();
      await firstCard.click({ force: true }).catch(() => {});
      await page.waitForTimeout(1500);
      await firstCard.scrollIntoViewIfNeeded();
      await page.screenshot({ path: '/tmp/coffee_matching_after_fix.png', fullPage: true });
    }
  }

  // Test 1c: Exploration reading - has MATCHING_FEATURES questions
  const explore = reading.find(x => /exploration/i.test(x.title));
  if (explore) {
    try {
      const rE = await runTest(page, explore, 'READING (Exploration)');
      if (rE) {
        await page.screenshot({ path: '/tmp/explore_matching_features_after_fix.png', fullPage: true });
      }
    } catch (e) {
      console.log('   Exploration test failed (expected for some tests):', e.message?.slice(0, 100));
    }
  }

  // Test 1d: The Invention of Television (has John Logie Baird) - the user's reported issue
  const tv = reading.find(x => /television|invention/i.test(x.title));
  if (tv) {
    console.log(`\n========== VISIT EXISTING TV RESULT ==========`);
    const existingAid = '019e98ca-c5fc-7e38-a09b-f9c7a88ed22c';
    await page.goto(`${BASE}/attempts/${existingAid}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    // The ResultReviewScreen renders question cards. Use locator with click on the inner header.
    // Look for the parent of the "1 Reading Matching" text
    const card = page.locator('div').filter({ hasText: /^\s*1\s*Reading\s*Matching Features\s*Wrong/ }).first();
    if (await card.count() > 0) {
      await card.locator('div').first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(2500);
    }
    await page.screenshot({ path: '/tmp/tv_baird_after_fix.png', fullPage: true });

    // Extract displayed Correct Key text from the rendered DOM
    const display = await page.evaluate(() => {
      const out = [];
      const cards = Array.from(document.querySelectorAll('div'));
      for (const c of cards) {
        const ckEl = Array.from(c.querySelectorAll(':scope > *')).find(x => x.textContent && x.textContent.trim() === 'Correct Key');
        const yaEl = Array.from(c.querySelectorAll(':scope > *')).find(x => x.textContent && x.textContent.trim() === 'Your Answer');
        if (ckEl && yaEl) {
          const ckValue = ckEl.nextElementSibling?.textContent?.trim() || '';
          const yaValue = yaEl.nextElementSibling?.textContent?.trim() || '';
          out.push({ ya: yaValue.slice(0, 150), ck: ckValue.slice(0, 150) });
        }
      }
      return out;
    });
    console.log('  FE display cards:', JSON.stringify(display, null, 2));
  }

  // Test 2: Listening
  const listening = await listExams(page, 'listening');
  if (listening[0]) {
    const r2 = await runTest(page, listening[0], 'LISTENING');
    // Screenshot the FORM_COMPLETION detail
    if (r2) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      const completionCard = page.locator('div').filter({ hasText: /Complete the hotel/ }).first();
      if (await completionCard.count() > 0) {
        await completionCard.click({ force: true }).catch(() => {});
        await page.waitForTimeout(1000);
        await completionCard.scrollIntoViewIfNeeded();
        await page.screenshot({ path: '/tmp/listening_form.png', fullPage: true });
      }
    }
  }

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
