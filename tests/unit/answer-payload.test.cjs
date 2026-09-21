const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createLoader } = require('./load-source.cjs');
const { buildAnswerPayload } = createLoader()('src/lib/answerPayload.ts');
const first = '11111111-1111-1111-1111-111111111111';
const second = '22222222-2222-2222-2222-222222222222';

test('answer payload distinguishes option IDs, multiple selections and text', () => {
  const payload = buildAnswerPayload({ single: first, multi: JSON.stringify([first, second]), text: 'answer', letters: '["A","B"]', empty: '' }, () => 'section-1');
  assert.deepEqual(payload.answers, [
    { questionId: 'single', sectionId: 'section-1', selectedOptionIds: [first], textAnswer: undefined },
    { questionId: 'multi', sectionId: 'section-1', selectedOptionIds: [first, second], textAnswer: undefined },
    { questionId: 'text', sectionId: 'section-1', selectedOptionIds: [], textAnswer: 'answer' },
    { questionId: 'letters', sectionId: 'section-1', selectedOptionIds: [], textAnswer: '["A","B"]' },
    { questionId: 'empty', sectionId: 'section-1', selectedOptionIds: [], textAnswer: undefined },
  ]);
  assert.equal(typeof payload.clientRevision, 'number');
});

test('explicit text answers take priority and missing sections stay empty', () => {
  const { answers } = buildAnswerPayload({ single: first }, () => undefined, () => 'custom text');
  assert.deepEqual(answers, [{ questionId: 'single', sectionId: '', selectedOptionIds: [], textAnswer: 'custom text' }]);
});

test('invalid JSON and mixed selections preserve the original text', () => {
  const { answers } = buildAnswerPayload({ malformed: '[oops]', mixed: JSON.stringify([first, 'A']), emptyList: '[]' }, () => 'section');
  assert.equal(answers[0].textAnswer, '[oops]');
  assert.equal(answers[1].textAnswer, JSON.stringify([first, 'A']));
  assert.deepEqual(answers[1].selectedOptionIds, []);
  assert.equal(answers[2].textAnswer, undefined);
});
