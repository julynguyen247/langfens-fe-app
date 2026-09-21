const assert = require('node:assert/strict');
const { test } = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { createLoader } = require('./load-source.cjs');
const base = 'src/app/do-test/[skill]/[attemptId]/components/reading/';

for (const [name, positive, negative, shortPositive, shortNegative] of [
  ['TrueFalseNotGivenCard', 'TRUE', 'FALSE', 'T', 'F'],
  ['YesNoNotGivenCard', 'YES', 'NO', 'Y', 'N'],
]) {
  const Card = createLoader()(base + name + '.tsx').default;
  for (const [input, expected] of [[positive.toLowerCase(), positive], [shortPositive, positive], [shortNegative, negative], ['NG', 'NOT GIVEN'], ['NOTGIVEN', 'NOT GIVEN']]) {
    test(`${name} selects ${expected} from ${input}`, () => {
      const html = renderToStaticMarkup(React.createElement(Card, { id: 'question', stem: '**Question**', value: input, onChange() {} }));
      assert.match(html, new RegExp(`aria-pressed="true" aria-label="Select ${expected}"`));
      assert.ok(html.includes('<strong>Question</strong>'));
      assert.ok(!html.includes('Tap to select your answer'));
    });
  }

  test(`${name} keeps unanswered guidance and review mode disables every option`, () => {
    const props = { id: 'question', stem: 'Question', value: '', onChange() {} };
    assert.ok(renderToStaticMarkup(React.createElement(Card, props)).includes('Tap to select your answer'));
    const html = renderToStaticMarkup(React.createElement(Card, { ...props, isReviewMode: true }));
    assert.equal((html.match(/disabled=""/g) ?? []).length, 3);
    assert.ok(!html.includes('Tap to select your answer'));
  });

  test(`${name} buttons emit the original canonical answer values`, () => {
    const load = createLoader({ react: { ...React, useMemo: fn => fn() } });
    const Wrapper = load(base + name + '.tsx').default;
    const values = [];
    const element = Wrapper.type({ id: 'question', stem: 'Question', value: '', onChange: value => values.push(value) });
    const tree = element.type(element.props);
    function clickButtons(node) {
      if (Array.isArray(node)) return node.forEach(clickButtons);
      if (!React.isValidElement(node)) return;
      if (node.type === 'button') node.props.onClick();
      React.Children.forEach(node.props.children, clickButtons);
    }
    clickButtons(tree);
    assert.deepEqual(values, [positive, negative, 'NOT_GIVEN']);
  });
}
