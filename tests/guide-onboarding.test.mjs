import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const guide = await readFile(new URL('../guide.html', import.meta.url), 'utf8');

test('owner setup is the primary welcome action and explains the five short stages', () => {
  assert.match(guide, /class="setup-card"/);
  assert.match(guide, /Finish your 15-minute MenuConnect Owner Setup/);
  assert.match(guide, /id="setupPrimaryBtn"/);
  assert.match(guide, /id="setupResetBtn"/);
  assert.equal((guide.match(/class="setup-stage"/g) || []).length, 5);
  assert.ok(
    guide.indexOf('class="setup-card"') < guide.indexOf('class="quick-start"'),
    'the setup call to action must appear before quick-reference shortcuts',
  );
});

test('guide loads the progress store and integrates persistent progress controls', () => {
  const library = guide.indexOf('src="/assets/guide-progress.js"');
  const inlineApp = guide.indexOf('/* ---------- lessons / rail ---------- */');
  assert.ok(library > -1 && library < inlineApp, 'progress library must load before the guide application');
  assert.match(guide, /MenuConnectProgress\.createStore/);
  assert.match(guide, /progressStore\.markViewed/);
  assert.match(guide, /progressStore\.finishQuickCheck/);
  assert.match(guide, /progressStore\.reset/);
  assert.match(guide, /Continue Owner Setup/);
  assert.match(guide, /Guide tour complete/);
});

test('mobile welcome keeps quick-help links compact above the setup card', () => {
  assert.match(guide, /@media\(max-width:480px\)\{\.task-grid\{grid-template-columns:1fr\}\.quick-tools\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
});

test('quick-check result clearly distinguishes completion from remaining lessons', () => {
  assert.match(guide, /id="setupCompletion"/);
  assert.match(guide, /id="setupCompletionTitle"/);
  assert.match(guide, /id="setupCompletionNote"/);
  assert.match(guide, /remaining lessons/);
});

test('renders non-sequential stage completion independently', () => {
  assert.match(guide, /stageComplete\[i\]/);
  assert.doesNotMatch(guide, /i<state\.completedStages/);
});

test('explains when progress is only available for the current visit', () => {
  assert.match(guide, /MenuConnectProgress\.selectStorage\(window\)/);
  assert.match(guide, /id="setupPersistenceNote"/);
  assert.match(guide, /Progress is available for this visit only/);
});

test('fallback persistence messages are translated in every supported language', async () => {
  const source = await readFile(new URL('../assets/guide-translations.js', import.meta.url), 'utf8');
  const context = { window: {} };
  vm.runInNewContext(source, context, { filename: 'guide-translations.js' });
  const catalog = context.window.MenuConnectTranslations;
  const keys = [
    'Progress is available for this visit only. Keep this page open to continue your setup.',
    'Your setup is complete for this visit. Keep this page open if you want to review it.',
  ];
  for (const language of ['ar', 'fr', 'zh', 'pa']) {
    for (const key of keys) assert.ok(catalog[language][key], `${language} is missing: ${key}`);
  }
});

test('announces only a new transition to reviewed guide tour', () => {
  assert.match(guide, /!before\.complete&&after\.complete/);
  assert.match(guide, /toast\('Guide tour complete'\)/);
});

test('remaining lesson copy has singular forms in every supported language', async () => {
  const i18n = await readFile(new URL('../assets/guide-i18n.js', import.meta.url), 'utf8');
  assert.match(guide, /1 remaining lesson — review it to complete your Owner Setup\./);
  const start = i18n.indexOf('function translated');
  const end = i18n.indexOf('function localizeText');
  assert.ok(start > -1 && end > start, 'dynamic translator must be extractable for behavior testing');
  const context = {};
  vm.runInNewContext(
    `var interfaceTranslations={};var translations={};${i18n.slice(start, end)};result={ar:translated('ar','1 remaining lesson — review it to complete your Owner Setup.'),fr:translated('fr','1 remaining lesson — review it to complete your Owner Setup.'),zh:translated('zh','1 remaining lesson — review it to complete your Owner Setup.'),pa:translated('pa','1 remaining lesson — review it to complete your Owner Setup.')};`,
    context,
  );
  assert.deepEqual(JSON.parse(JSON.stringify(context.result)), {
    ar: 'تبقّى درس واحد — راجعه لإكمال إعداد المالك.',
    fr: 'Il reste 1 leçon — révisez-la pour terminer votre configuration propriétaire.',
    zh: '还剩 1 节课——请复习本课以完成店主设置。',
    pa: '1 ਪਾਠ ਬਾਕੀ ਹੈ — ਮਾਲਕ ਸੈਟਅੱਪ ਪੂਰੀ ਕਰਨ ਲਈ ਇਸਦੀ ਸਮੀਖਿਆ ਕਰੋ।',
  });
});

test('stage markers use logical positioning for RTL', () => {
  assert.match(guide, /\.setup-stage\{[^}]*padding-inline-start:38px/);
  assert.match(guide, /\.setup-stage::before\{[^}]*inset-inline-start:10px/);
  assert.doesNotMatch(guide, /\.setup-stage\{[^}]*padding:[^}]*38px/);
});
