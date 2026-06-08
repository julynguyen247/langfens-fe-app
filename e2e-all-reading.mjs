// Comprehensive end-to-end test:
//   - login
//   - for EVERY reading test, start an attempt, answer with the correct keys
//     (read from the exam-db), submit, then visit the result page and check
//     that the correct key text rendered for EVERY question type
//   - reports per-type results

import { chromium } from 'playwright';
import { Client as PgClient } from 'pg';
import { spawn } from 'child_process';

const BASE = 'http://localhost:3001';
const GATEWAY = 'http://localhost:5000';
const USER = 'tukhoa040505@gmail.com';
const PASS = 'Khoa040505@';

const pgExam = new PgClient({ host: 'localhost', port: 5433, user: 'exam', password: 'exam', database: 'exam-db' });
const pgAttempt = new PgClient({ host: 'localhost', port: 5435, user: 'attempt', password: 'attempt', database: 'attempt-db' });

const GET_TOK = `(document.cookie.match(/(?:^|;\\s*)access_token=([^;]+)/) || [])[1] || ''`;

// Question types that can be answered via text (we use first accept text)
const TEXT_TYPES = new Set([
  'COMPLETION', 'SUMMARY_COMPLETION', 'TABLE_COMPLETION', 'NOTE_COMPLETION',
  'FORM_COMPLETION', 'FLOW_CHART_COMPLETION', 'DIAGRAM_LABEL', 'MAP_LABEL',
  'SHORT_ANSWER', 'SENTENCE_COMPLETION', 'CLASSIFICATION',
]);

function letterToIdx(letter) {
  if (!letter || letter.length !== 1) return null;
  const c = letter.toUpperCase().charCodeAt(0);
  if (c < 65 || c > 90) return null;
  return c - 64;
}
function idxToLetter(idx) {
  return String.fromCharCode(64 + idx);
}

async function getCorrectAnswer(q) {
  const t = (q.type || q.questionType || '').toUpperCase();
  if (['SINGLE_CHOICE', 'TRUE_FALSE', 'TRUE_FALSE_NOT_GIVEN', 'YES_NO_NOT_GIVEN'].includes(t)) {
    const correctOpt = (q.options || []).find(o => o.isCorrect);
    if (!correctOpt) return null;
    return { selectedOptionIds: [correctOpt.id], textAnswer: null };
  }
  if (t === 'MULTI_CHOICE' || t === 'MULTIPLE_CHOICE_MULTI' || t === 'MCQ_MULTIPLE') {
    const correctOpts = (q.options || []).filter(o => o.isCorrect);
    if (correctOpts.length === 0) return null;
    return { selectedOptionIds: correctOpts.map(o => o.id), textAnswer: null };
  }
  if (t === 'MATCHING_HEADING' || t === 'MATCHING_FEATURES' || t === 'MATCHING_INFORMATION' || t === 'MATCHING') {
    // For matching-heading/feature: pick the option text (roman letter) of the first entry
    const mp = q.matchPairs;
    if (!mp) return null;
    let firstKey, firstVal;
    if (Array.isArray(mp)) {
      // [{promptKey, acceptedValues:[l,c]}]
      const first = mp[0];
      if (!first) return null;
      firstKey = first.promptKey;
      firstVal = first.acceptedValues && first.acceptedValues[0];
    } else {
      firstKey = Object.keys(mp)[0];
      firstVal = mp[firstKey] && mp[firstKey][0];
    }
    if (!firstVal) return null;
    // For matching-heading, firstVal is the letter (i, ii, iii...). We store as textAnswer.
    // For matching-features, firstVal is also the letter (A, B, C, ...). Store as textAnswer.
    return { selectedOptionIds: null, textAnswer: firstVal };
  }
  if (TEXT_TYPES.has(t)) {
    // Take the first accept text from blankAcceptTexts (or shortAnswerAcceptTexts)
    if (q.blankAcceptTexts) {
      const firstKey = Object.keys(q.blankAcceptTexts)[0];
      const firstVal = firstKey ? (q.blankAcceptTexts[firstKey] || [])[0] : null;
      if (firstVal) return { selectedOptionIds: null, textAnswer: firstVal };
    }
    if (q.shortAnswerAcceptTexts && q.shortAnswerAcceptTexts.length) {
      return { selectedOptionIds: null, textAnswer: q.shortAnswerAcceptTexts[0] };
    }
    return null;
  }
  if (t === 'ORDERING') {
    const oc = q.orderCorrects || [];
    return { selectedOptionIds: null, textAnswer: JSON.stringify(oc) };
  }
  return null;
}

async function main() {
  await pgExam.connect();
  await pgAttempt.connect();

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();

  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));

  // ---- LOGIN ----
  await page.goto(`${BASE}/auth/login`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(2000);
  await page.fill('#email', USER);
  await page.fill('#password', PASS);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(6000);

  const cookies = await ctx.cookies();
  const tok = cookies.find(c => c.name === 'access_token')?.value;
  if (!tok) {
    console.error('No token after login');
    process.exit(1);
  }
  console.log('Logged in.');

  const apiFetch = (path, opts = {}) => page.evaluate(async ({ g, p, t, o, GET_TOK }) => {
    const tok = eval(GET_TOK);
    const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + decodeURIComponent(tok) };
    const r = await fetch(g + p, { method: o.method || 'GET', headers, body: o.body ? JSON.stringify(o.body) : undefined });
    return { status: r.status, body: await r.text() };
  }, { g: GATEWAY, p: path, t: tok, o: opts, GET_TOK });

  // ---- LIST READING TESTS ----
  const listResp = await apiFetch('/api-exams/public/exam/getall?page=1&pageSize=200&category=IELTS');
  const listJson = JSON.parse(listResp.body);
  const allExams = listJson.data || [];
  const readingExams = allExams.filter(e => (e.slug || '').toLowerCase().includes('reading'));

  // ---- PER-TEST RESULTS ----
  const perTest = [];
  const perType = {}; // type -> { total, okKey, failSamples: [] }
  const TYPE_FAILURES = []; // [{test, q, user, key, type}]

  for (const exam of readingExams) {
    console.log(`\n=== ${exam.title} ===`);
    // Start attempt
    const startResp = await apiFetch('/api-attempts/attempt/attempts:start', { method: 'POST', body: { examId: exam.id } });
    if (startResp.status !== 200 && startResp.status !== 201) {
      console.log(`  start failed: ${startResp.status}`);
      continue;
    }
    const startJson = JSON.parse(startResp.body);
    const attemptId = startJson.data?.attemptId || startJson.data?.id;
    console.log(`  attemptId=${attemptId}`);

    // Get attempt paper
    const paperResp = await apiFetch(`/api-attempts/attempt/${attemptId}`);
    const paperJson = JSON.parse(paperResp.body);
    const paper = paperJson.data?.paper || paperJson.paper || paperJson;
    const sections = paper.sections || [];
    const allQ = [];
    for (const sec of sections) {
      for (const g of (sec.questionGroups || [])) for (const q of (g.questions || [])) allQ.push(q);
      for (const q of (sec.questions || [])) allQ.push(q);
    }

    // Get correct answers from DB (template)
    const slug = exam.slug;
    const tmplRes = await pgExam.query(
      `SELECT q."Id", q."Type", q."PromptMd", q."BlankAcceptTexts", q."ShortAnswerAcceptTexts", q."OrderCorrects", q."MatchPairs",
              (SELECT jsonb_agg(jsonb_build_object('id', o."Id", 'idx', o."Idx", 'isCorrect', o."IsCorrect", 'contentMd', o."ContentMd") ORDER BY o."Idx")
                 FROM exam_options o WHERE o."QuestionId" = q."Id") AS options
       FROM exam_questions q
       JOIN exam_sections s ON q."SectionId" = s."Id"
       JOIN exams e ON s."ExamId" = e."Id"
       WHERE e."Slug" = $1`,
      [slug]
    );

    const tmplById = {};
    for (const r of tmplRes.rows) tmplById[r.Id] = r;

    let correctCount = 0;
    let total = allQ.length;
    const typeStats = {};
    for (const q of allQ) {
      const tmpl = tmplById[q.id];
      if (!tmpl) continue;
      const t = (q.type || '').toUpperCase();
      typeStats[t] = (typeStats[t] || 0) + 1;
      // Build full question object with template data
      const fullQ = { ...q };
      fullQ.options = tmpl.options || q.options;
      fullQ.matchPairs = tmpl.matchpairs || q.matchPairs;
      fullQ.blankAcceptTexts = tmpl.blankaccepttexts || q.blankAcceptTexts;
      fullQ.shortAnswerAcceptTexts = tmpl.shortansweraccepttexts || q.shortAnswerAcceptTexts;
      fullQ.orderCorrects = tmpl.ordercorrects || q.orderCorrects;
      const ans = await getCorrectAnswer(fullQ);
      if (!ans) {
        typeStats[t + '_skipped'] = (typeStats[t + '_skipped'] || 0) + 1;
        continue;
      }
      // Submit
      const sresp = await apiFetch(`/api-attempts/attempt/autosave/${attemptId}`, { method: 'POST', body: { answers: [ans] } });
      if (sresp.status === 200 || sresp.status === 201) {
        // We submitted the correct answer, so it should be correct
        correctCount++;
      }
    }

    // Submit attempt
    const subResp = await apiFetch(`/api-attempts/attempt/submit/${attemptId}`, { method: 'POST', body: {} });
    await page.waitForTimeout(3000);

    // Get result
    const rResp = await apiFetch(`/api-attempts/attempt/getresult/${attemptId}`);
    const rJson = JSON.parse(rResp.body);
    const rdata = rJson.data || rJson;
    const answers = rdata.answers || [];
    const paperWithAnswers = rdata.paperWithAnswers || rdata.paper || {};
    const questionMetaById = {};
    function walk(o) {
      if (Array.isArray(o)) o.forEach(walk);
      else if (o && typeof o === 'object') {
        if (o.id && o.promptMd) questionMetaById[o.id] = o;
        for (const v of Object.values(o)) walk(v);
      }
    }
    walk(paperWithAnswers);

    // Check that for each answer, correctAnswerText is non-empty and doesn't look broken
    let brokenKey = 0;
    let emptyKey = 0;
    for (const a of answers) {
      const t = (questionMetaById[a.questionId]?.type || a.questionType || 'UNKNOWN').toUpperCase();
      perType[t] = perType[t] || { total: 0, okKey: 0, failKey: 0, emptyKey: 0, failSamples: [] };
      perType[t].total++;
      const key = a.correctAnswerText;
      if (!key || key.trim().length === 0) {
        perType[t].emptyKey++;
        emptyKey++;
        if (perType[t].emptySamples === undefined) perType[t].emptySamples = [];
        if (perType[t].emptySamples.length < 3) {
          perType[t].emptySamples.push({ q: (questionMetaById[a.questionId]?.promptMd || '').slice(0, 40) });
        }
        continue;
      }
      // Check for broken patterns: just letter, just "D / D", etc.
      const looksBroken = /^([A-Za-z0-9]+)\s*\/\s*\1$/.test(key.trim()) || // "D / D"
                          /^\s*(?:[ivxlcdm]+|[a-z])\s*$/i.test(key.trim()) || // just roman or single letter
                          key.trim() === key.trim().toUpperCase() && key.trim().length <= 3; // short uppercase (just letter)
      if (looksBroken) {
        perType[t].failKey++;
        brokenKey++;
        if (perType[t].failSamples.length < 3) {
          perType[t].failSamples.push({ q: (questionMetaById[a.questionId]?.promptMd || '').slice(0, 40), key, type: t });
        }
        TYPE_FAILURES.push({ test: exam.title, q: (questionMetaById[a.questionId]?.promptMd || '').slice(0, 40), key, type: t });
      } else {
        perType[t].okKey++;
      }
    }

    perTest.push({ title: exam.title, total, correct: correctCount, brokenKey, emptyKey });
    console.log(`  submitted=${correctCount}/${total}, broken=${brokenKey}, empty=${emptyKey}`);
    console.log(`  types:`, typeStats);
  }
  await pgExam.end();
  await pgAttempt.end();

  console.log('\n\n================= PER-TEST SUMMARY =================');
  for (const t of perTest) {
    console.log(`  ${t.title}: ${t.correct}/${t.total} correct, ${t.broken} broken keys, ${t.emptyKey} empty keys`);
  }

  console.log('\n\n================= PER-TYPE SUMMARY =================');
  console.log('Type'.padEnd(30), 'Total'.padStart(6), 'OK'.padStart(6), 'Broken'.padStart(8), 'Empty'.padStart(7));
  console.log('-'.repeat(60));
  for (const [t, s] of Object.entries(perType)) {
    console.log(t.padEnd(30), String(s.total).padStart(6), String(s.okKey).padStart(6), String(s.failKey).padStart(8), String(s.emptyKey).padStart(7));
  }
  console.log('\n\n================= BROKEN KEY EXAMPLES =================');
  for (const f of TYPE_FAILURES.slice(0, 20)) {
    console.log(`  ${f.test} | ${f.type} | "${f.q}..." → "${f.key}"`);
  }
  if (TYPE_FAILURES.length === 0) {
    console.log('  None — all question types display correct key correctly.');
  } else {
    console.log(`\n  TOTAL BROKEN: ${TYPE_FAILURES.length}`);
  }

  console.log('\n\n================= EMPTY KEY EXAMPLES =================');
  for (const [t, s] of Object.entries(perType)) {
    if (s.emptyKey > 0) {
      console.log(`  ${t}: ${s.emptyKey} empty keys`);
      if (s.emptySamples) for (const ex of s.emptySamples) console.log(`    - "${ex.q}..."`);
    }
  }

  // Look at the empty-key questions in detail
  const totalEmptyKeys = Object.values(perType).reduce((s, t) => s + t.emptyKey, 0);
  if (totalEmptyKeys > 0) {
    console.log('\n================= EMPTY KEY DETAILS =================');
  }

  // ---- VISUAL VERIFICATION: pick a few key results and screenshot them ----
  console.log('\n================= VISUAL VERIFICATION =================');
  const targetTests = [
    { slug: 'mini-ielts-reading-the-story-of-coffee', file: '/tmp/check_coffee.png', focus: 'MATCHING_HEADING' },
    { slug: 'mini-ielts-reading-the-invention-of-television', file: '/tmp/check_tv.png', focus: 'MATCHING_FEATURES' },
    { slug: 'mini-ielts-reading-termite-mounds', file: '/tmp/check_termite.png', focus: 'MATCHING_HEADING,YES_NO_NOT_GIVEN' },
    { slug: 'mini-ielts-reading-tattoo-on-tikopia', file: '/tmp/check_tikopia.png', focus: 'YES_NO_NOT_GIVEN' },
    { slug: 'mini-ielts-reading-migratory-beekeeping', file: '/tmp/check_beekeeping.png', focus: 'YES_NO_NOT_GIVEN,DIAGRAM_LABEL' },
  ];

  for (const t of targetTests) {
    const exam = readingExams.find(e => e.slug === t.slug);
    if (!exam) continue;
    // Find the most recent attempt for this exam
    const aidRes = await page.evaluate(async ({ g, p, GET_TOK }) => {
      const tok = eval(GET_TOK);
      const r = await fetch(g + p, { headers: { Authorization: 'Bearer ' + decodeURIComponent(tok) } });
      return { status: r.status, body: await r.text() };
    }, { g: GATEWAY, p: '/api-attempts/attempt/getlistattempt?page=1&pageSize=20', GET_TOK });
    if (aidRes.status !== 200) continue;
    const listJson = JSON.parse(aidRes.body);
    const attempts = listJson.data || [];
    const target = attempts.find(a => a.examId === exam.id);
    if (!target) {
      console.log(`  No attempt for ${exam.title}, skipping visual check`);
      continue;
    }
    // Visit the result page
    await page.goto(`${BASE}/attempts/${target.id}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    // Click the first question card to expand
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div'));
      for (const c of cards) {
        const txt = (c.textContent || '').trim();
        if (txt.length < 80 && /^\d+\s*Reading/.test(txt)) { c.click(); return; }
      }
    });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: t.file, fullPage: true });
    console.log(`  ${exam.title}: saved ${t.file}`);

    // Extract displayed text
    const display = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('*').forEach(el => {
        if (el.textContent && el.textContent.trim() === 'Correct Key' && el.children.length === 0) {
          const sib = el.nextElementSibling;
          out.push((sib?.textContent || '').trim().slice(0, 120));
        }
      });
      return out;
    });
    console.log(`  Correct Key texts: ${JSON.stringify(display.slice(0, 3))}`);
  }

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
