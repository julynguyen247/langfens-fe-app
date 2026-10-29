const assert = require('node:assert/strict');
const { test } = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { createLoader } = require('./load-source.cjs');
const { TrueFalseCard } = createLoader()('src/features/exam/components/cards/TrueFalseCard.tsx');
const optionId = '11111111-1111-1111-1111-111111111111';

for (const [questionType, positive] of [['TRUE_FALSE_NOT_GIVEN', 'True'], ['YES_NO_NOT_GIVEN', 'Yes']]) {
  test(`${questionType} renders and emits the option UUID`, () => {
    const changes = [];
    const props = { questionType, options: [{ id: optionId, idx: 1, contentMd: positive }], value: [optionId], onChange: value => changes.push(value) };
    const html = renderToStaticMarkup(React.createElement(TrueFalseCard, props));
    assert.match(html, /aria-pressed="true"/);
    const tree = TrueFalseCard(props);
    const button = tree.props.children[0];
    button.props.onClick();
    assert.deepEqual(changes, [optionId]);
  });
}
