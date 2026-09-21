const assert = require('node:assert/strict');
const path = require('node:path');
const { test } = require('node:test');
const { createLoader, root } = require('./load-source.cjs');

function setup(response = { status: 200, data: { data: { value: 7 } } }) {
  const calls = [];
  const clients = {};
  for (const name of ['Auth', 'Attempt', 'Exam', 'Vocabulary', 'Speaking', 'Writing', 'Dictionary', 'Gamification', 'Analytics', 'Notification', 'Studyplan', 'Course', 'Ai']) {
    clients['apis' + name] = Object.fromEntries(
      ['get', 'post', 'put', 'patch', 'delete'].map(method => [method, async (...args) => {
        calls.push({ service: name, method, args });
        if (response instanceof Error) throw response;
        return response;
      }]),
    );
  }
  const load = createLoader({ [path.join(root, 'src/utils/api.customize.ts')]: clients });
  return { load, calls, response };
}

test('auth preserves raw responses and Google login returns the response body', async () => {
  const { load, calls, response } = setup();
  const auth = load('src/services/auth.ts');
  assert.equal(await auth.login('learner@example.com', 'password'), response);
  assert.equal(await auth.loginWithGoogle('token'), response.data);
  assert.deepEqual(calls, [
    { service: 'Auth', method: 'post', args: ['/auth/login', { email: 'learner@example.com', password: 'password' }] },
    { service: 'Auth', method: 'post', args: ['/auth/login-google', { idToken: 'token' }] },
  ]);
});

test('verification and password reset preserve query parameters and request bodies', async () => {
  const { load, calls } = setup();
  const auth = load('src/services/auth.ts');
  await auth.verifyEmail('learner@example.com', '123456');
  await auth.resendEmailForgot('learner@example.com');
  await auth.verifyEmailForgot('learner@example.com', '123456', 'new-password');
  assert.deepEqual(calls.map(call => call.args), [
    ['/auth/verify', { params: { email: 'learner@example.com', otp: '123456' } }],
    ['/auth/resend-otp-reset-password', null, { params: { email: 'learner@example.com' } }],
    ['/auth/confirm-otp-reset-password', { email: 'learner@example.com', otp: '123456', newPassword: 'new-password' }],
  ]);
});

test('attempt submission defaults to an empty answer list and navigator unwraps data', async () => {
  const { load, calls, response } = setup();
  const api = load('src/services/attempts.ts');
  assert.equal(await api.submitAttempt('attempt-1'), response);
  assert.equal(await api.getQuestionNavigator('attempt-1'), response.data.data);
  assert.deepEqual(calls.map(call => call.args), [
    ['/attempt/submit/attempt-1', { answers: [] }],
    ['/attempt/attempt-1/navigator'],
  ]);
});

test('bulk vocabulary creation keeps PascalCase payloads and null hints', async () => {
  const { load, calls } = setup();
  await load('src/services/vocabulary.ts').createBulkCards('deck-1', [
    { frontMd: 'front', backMd: 'back', hintMd: '' },
    { frontMd: 'second', backMd: 'answer', hintMd: 'hint' },
  ]);
  assert.deepEqual(calls[0].args, ['/users/deck/deck-1/cards', { Cards: [
    { FrontMd: 'front', BackMd: 'back', HintMd: null },
    { FrontMd: 'second', BackMd: 'answer', HintMd: 'hint' },
  ] }]);
});

test('public deck requests retain default filters and pagination', async () => {
  const { load, calls } = setup();
  await load('src/services/vocabulary.ts').getPublicHandler();
  assert.deepEqual(calls[0].args, ['/decks', { params: { status: '', category: '', page: 1, pageSize: 10 } }]);
});

test('speaking uploads preserve multipart fields, file names and credentials', async () => {
  const { load, calls, response } = setup();
  const speech = new File(['recording'], 'answer.wav', { type: 'audio/wav' });
  assert.equal(await load('src/services/speaking.ts').gradeSpeaking({ examId: 'exam-1', timeSpentSeconds: 35, speech }), response);
  const [url, form, config] = calls[0].args;
  assert.equal(url, '/speaking/grade');
  assert.equal(form.get('examId'), 'exam-1');
  assert.equal(form.get('timeSpentSeconds'), '35');
  assert.equal(form.get('speech').name, 'answer.wav');
  assert.equal(await form.get('speech').text(), 'recording');
  assert.deepEqual(config, { headers: { 'Content-Type': undefined }, withCredentials: true });
});

test('roleplay audio retains backend field names and multipart content type', async () => {
  const { load, calls } = setup();
  await load('src/services/roleplay.ts').sendRoleplayTurnAudio({
    sessionId: 'session-1', userId: 'user-1', audio: new File(['audio'], 'turn.wav'),
  });
  const [url, form, config] = calls[0].args;
  assert.equal(url, '/api/v1/speaking/roleplay/turn-audio');
  assert.equal(form.get('session_id'), 'session-1');
  assert.equal(form.get('user_id'), 'user-1');
  assert.equal(form.get('audio').name, 'turn.wav');
  assert.deepEqual(config, { headers: { 'Content-Type': 'multipart/form-data' } });
});

test('service failures propagate without changing the error object', async () => {
  const failure = new Error('offline');
  const { load } = setup(failure);
  await assert.rejects(load('src/services/auth.ts').login('email', 'password'), error => error === failure);
});

test('legacy API imports resolve to the same service functions', () => {
  const { load } = setup();
  const legacy = load('src/utils/api.ts');
  for (const file of require('node:fs').readdirSync(path.join(root, 'src/services'))) {
    for (const [name, value] of Object.entries(load('src/services/' + file))) {
      assert.equal(legacy[name], value, name);
    }
  }
});
