import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const guide = await readFile(new URL('../guide.html', import.meta.url), 'utf8');
const watch = await readFile(new URL('../watch.html', import.meta.url), 'utf8');

// Same rule as lessonSlugs in guide.html: first lesson is "welcome", the rest come from data-title.
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"');
const titles = [...guide.matchAll(/<section class="lesson"[^>]*\bdata-title="([^"]*)"/g)].map((m) => decode(m[1]));
const slugs = new Set(titles.map((t, i) => (i === 0 ? 'welcome' : t.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))));

const watchLessons = [...watch.matchAll(/\blesson:'([^']+)'/g)].map((m) => m[1]);
const ytIds = (html) => new Set([...html.matchAll(/(?:youtube(?:-nocookie)?\.com\/embed\/|youtu\.be\/|i\.ytimg\.com\/vi\/|\bid:')([A-Za-z0-9_-]{11})/g)].map((m) => m[1]));

test('guide lessons are found', () => {
  assert.ok(slugs.size > 10, `expected many lessons, found ${slugs.size}`);
});

test('every /watch "Read the steps" link points at a real /start lesson', () => {
  assert.ok(watchLessons.length > 0);
  const broken = [...new Set(watchLessons)].filter((l) => !slugs.has(l));
  assert.deepEqual(broken, [], `renamed or missing lessons: ${broken.join(', ')} (a lesson's slug comes from its data-title)`);
});

test('/watch and the written guide embed the same videos', () => {
  const inWatch = ytIds(watch);
  const inGuide = ytIds(guide);
  assert.deepEqual([...inWatch].filter((id) => !inGuide.has(id)), [], 'on /watch but not in the guide');
  assert.deepEqual([...inGuide].filter((id) => !inWatch.has(id)), [], 'in the guide but not on /watch');
});
