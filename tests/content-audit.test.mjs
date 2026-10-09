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

test('quick-answer shortcuts jump to the lesson their link names', () => {
  const titles = [...guide.matchAll(/<section class="lesson" data-title="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  const slugs = titles.map((t, i) => (i === 0 ? 'welcome' : t.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')));
  for (const [, slug, jump] of guide.matchAll(/href="#([a-z0-9-]+)" data-jump="(\d+)"/g)) {
    assert.equal(slugs[Number(jump)], slug, `#${slug} jumps to lesson ${jump} (${slugs[Number(jump)]})`);
  }
});

test('each quiz review link opens a lesson its explanation cites', () => {
  const whys = [...guide.matchAll(/\{q:'.*?',a:'(?:you|team)',why:'(.*?)'\}/g)].map((m) => m[1]);
  const links = JSON.parse(guide.match(/var quizLessons=(\[[\d,]+\]);/)[1]);
  assert.equal(whys.length, 15);
  assert.equal(links.length, whys.length);
  whys.forEach((why, i) => {
    const cited = new Set();
    for (const [, refs] of why.matchAll(/Lessons? ([\d,–\s]+)/g)) {
      for (const part of refs.split(',')) {
        const [from, to] = part.trim().split('–').map(Number);
        if (!from) continue;
        for (let n = from; n <= (to || from); n += 1) cited.add(n);
      }
    }
    assert.ok(cited.has(links[i]), `question ${i + 1} reviews lesson ${links[i]} but cites ${[...cited].join(', ')}`);
  });
});

test('lesson navigation records the lesson in the URL', () => {
  assert.doesNotMatch(guide, /go\((?:i|i-1|i\+1|0|current[+-]1)\)/, 'every navigation call passes updateHash');
  assert.match(guide, /window\.addEventListener\('popstate',syncFromHash\)/);
});

test('closure practice understands its own examples in every language', () => {
  const chips = [...guide.matchAll(/<button class="chip" type="button" data-say="(\w+)">/g)].map((m) => m[1]);
  assert.deepEqual(chips, ['today', 'vacation', 'sunday', 'friday']);
  assert.doesNotMatch(guide, /sayCardText\.innerHTML/);
});

test('practice confirmations ask the owner to verify instead of promising instant results', () => {
  for (const claim of [/your storefront shows it immediately/, /go straight to the customer menu/, /gone from the live menu/,
    /carries straight through to the cart/, /changes are recorded so they can be reversed/, /Menu\.ca handles cancellations and refunds/,
    /refunds and cancellations are handled by the Menu\.ca team/]) {
    assert.doesNotMatch(guide, claim);
  }
});

test('owners are warned about dietary claims, promotion costs and customer data', () => {
  assert.match(guide, /allergen or dietary claims/);
  assert.match(guide, /Before you start a deal:/);
  assert.match(guide, /Share only the customer details needed to find the order/);
});
