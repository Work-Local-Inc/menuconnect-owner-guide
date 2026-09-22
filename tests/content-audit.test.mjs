import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const guide = await readFile(new URL('../guide.html', import.meta.url), 'utf8');
const progress = await readFile(new URL('../assets/guide-progress.js', import.meta.url), 'utf8');

test('statement example explicitly identifies the sample funding assumption', () => {
  assert.match(guide, /Sample statement: all orders paid online by card/);
  assert.match(guide, /If customers paid cash at the restaurant, that cash is not part of the funds Menu\.ca holds to pay out/);
  assert.doesNotMatch(guide, /Refunds always land in the week they happen/);
  assert.doesNotMatch(guide, /What lands in your bank account for the week/);
});

test('guide avoids unverified immediate-change and unconditional refund promises', () => {
  assert.doesNotMatch(guide, /Every save goes straight to your live storefront/);
  assert.doesNotMatch(guide, /every change is audited, reversible, and includes a ten-second undo/);
  assert.doesNotMatch(guide, /we'll take care of any cancellation or refund/);
  assert.match(guide, /confirm the change on the customer storefront/);
  assert.match(guide, /review the request and confirm the outcome/);
});

test('support guide has a safe fallback when sign-in help is unavailable', () => {
  assert.match(guide, /If the sign-in page is unavailable, use your restaurant's existing Menu\.ca support contact/);
  assert.match(guide, /Do not send passwords, sign-in links, or payment-card details/);
});

test('completion text reports guide review, not live account setup or knowledge proficiency', () => {
  assert.match(guide, /Guide tour complete/);
  assert.match(guide, /Opening a lesson marks it viewed; the quick check records an attempt, not a passing score or completed restaurant setup/);
  assert.doesNotMatch(guide, /Owner Setup complete/);
  assert.match(progress, /function isComplete\(\)\{return state\.viewed\.length===total&&state\.quizComplete\}/);
});

test('the primary setup button appears before the stage list on narrow screens', () => {
  const card = guide.slice(guide.indexOf('<section class="setup-card"'), guide.indexOf('</section>', guide.indexOf('<section class="setup-card"')));
  assert.ok(card.indexOf('id="setupPrimaryBtn"') < card.indexOf('class="setup-stages"'), 'place start before five-stage preview');
  assert.match(guide, /@media\(max-width:480px\).*\.language-switcher/);
});
