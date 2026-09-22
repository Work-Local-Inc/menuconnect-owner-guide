#!/usr/bin/env python3
"""Check the curriculum, local assets, HTML IDs, and inline JavaScript."""
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import subprocess
import sys
import tempfile
import unicodedata

root = Path(__file__).resolve().parent
class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.lessons = []
    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if "id" in data:
            self.ids.append(data["id"])
        if tag == "section" and "lesson" in data.get("class", "").split():
            self.lessons.append(data.get("data-title"))

expected = ["Welcome", "Signing in", "Your owner home", "Weekly statements",
    "Cash, card & refunds", "Opening hours", "Split shifts", "Holidays & closures",
    "Close today safely", "Prices & availability", "Availability routine",
    "Photos & bilingual editing", "Orders", "Promotions", "We handle these",
    "Ask for help clearly", "Owner routine", "Quick check"]
for name in ["index.html", "guide.html"]:
    source = (root / name).read_text()
    page = Page()
    page.feed(source)
    assert len(page.ids) == len(set(page.ids)), f"Duplicate HTML IDs: {name}"
    if name == "guide.html":
        assert page.lessons == expected, "Guide curriculum is incomplete or reordered"
        assert source.count("{q:'") == 15, "Expected 15 final-check scenarios"
        assert "orderDetailView" in source and "backToOrders" in source, "Order detail practice missing"
        for language in ["en", "ar", "fr", "zh", "pa"]:
            assert f'data-guide-lang="{language}"' in source, f"Missing guide language: {language}"
        assert source.count("data-guide-lang=") == 5, "Expected exactly five guide languages"
        assert 'class="language-options" role="group" aria-labelledby="languageLabel"' in source, \
            "Language selector group must use the localized visible label as its accessible name"
        assert 'src="/assets/guide-translations.js"' in source, "Translation catalog is not loaded"
        assert 'src="/assets/guide-i18n.js"' in source, "Translation runtime is not loaded"
        assert 'src="/assets/guide-progress.js"' in source, "Persistent Owner Setup progress is not loaded"
        progress_runtime = (root / "assets/guide-progress.js").read_text()
        assert "menuconnect-owner-setup-v1" in progress_runtime and "finishQuickCheck" in progress_runtime, \
            "Persistent Owner Setup progress is incomplete"
        runtime = (root / "assets/guide-i18n.js").read_text()
        assert "document.documentElement.dir" in runtime and "rtl={ar:true}" in runtime, "Arabic RTL support is incomplete"
        catalog = (root / "assets/guide-translations.js").read_text()
        for language in ['"ar":', '"fr":', '"zh":', '"pa":']:
            assert language in catalog, f"Translation catalog is missing {language}"
        match = re.fullmatch(r"window\.MenuConnectTranslations=(\{.*\});?\s*", catalog, re.S)
        assert match, "Translation catalog wrapper is malformed"
        translations = json.loads(match.group(1))
        assert set(translations) == {"ar", "fr", "zh", "pa"}, "Translation catalog languages changed"
        key_sets = [set(values) for values in translations.values()]
        assert len(key_sets[0]) >= 700, "Translation catalog is unexpectedly incomplete"
        assert all(keys == key_sets[0] for keys in key_sets[1:]), "Translation languages do not cover the same source text"
        assert all(isinstance(value, str) and value.strip()
                   for values in translations.values() for value in values.values()), "Translation catalog has an empty or invalid value"
        assert all(len(value.splitlines()) == 1
                   for values in translations.values() for value in values.values()), \
            "Translation catalog values must be single-line"
        assert all(not any(unicodedata.category(char) in {"Cc", "Cf"} for char in value)
                   for values in translations.values() for value in values.values()), \
            "Translation catalog values must not contain Unicode control or format characters"
        exact_operational_values = {
            ".ca", "/portal", "yourrestaurant", "portal", ".menuconnect.ca/",
            ".menuconnect.ca/portal", "…/portal/statements/", "…/portal/",
            "WELCOME10", "LUNCH5", "FREEDEL25",
        }
        exact_technical_values = {
            "tabindex", "INPUT", "TEXTAREA", "Escape", "Tab", "Enter",
            "ArrowRight", "ArrowLeft", "EN", "FR",
            # Unambiguous class-name literals found next to the protected attributes.
            "rail-part", "rail-item", "lesson-nav", "practice-notice",
            "dayrow", "qfeedback",
        }
        technical_key_patterns = [
            re.compile(r"(?:data|aria)-[a-z][a-z0-9-]*"),
            re.compile(r"var\(--[a-z][a-z0-9-]*\)"),
            re.compile(r"home-[0-9]+"),
        ]
        catalog_keys = key_sets[0]
        exact_technical_values.update(
            key for key in catalog_keys
            if any(pattern.fullmatch(key) for pattern in technical_key_patterns)
        )
        for language, values in translations.items():
            for key in exact_operational_values | exact_technical_values:
                assert values.get(key) == key, \
                    f"{language} translation changed protected technical/operational value: {key}"
        protected_patterns = [
            re.compile(r"\b(?:WELCOME10|LUNCH5|FREEDEL25)\b"),
            re.compile(r"\b(?:EN|FR)\b"),
            re.compile(r"(?<![\w@.-])[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}"),
            re.compile(r"(?<![\w.-])(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}(?:/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*)?"),
            re.compile(r"(?<![\w/])(?:…)?/[A-Za-z0-9._~-]+(?:/[A-Za-z0-9._~-]+)*/?"),
        ]
        for language, values in translations.items():
            for source_text, translated_text in values.items():
                for pattern in protected_patterns:
                    for token in pattern.findall(source_text):
                        assert translated_text.count(token) == source_text.count(token), \
                            f"{language} translation changed operational token {token!r} in {source_text!r}"
        expected_language_field_labels = {
            "ar": ("اسم الطبق · EN", "اسم الطبق · FR", "الوصف · EN", "الوصف · FR"),
            "fr": ("Nom du plat · EN", "Nom du plat · FR", "Description · EN", "Description · FR"),
            "zh": ("菜名 · EN", "菜名 · FR", "描述 · EN", "描述 · FR"),
            "pa": ("ਪਕਵਾਨ ਦਾ ਨਾਮ · EN", "ਪਕਵਾਨ ਦਾ ਨਾਮ · FR", "ਵਰਣਨ · EN", "ਵਰਣਨ · FR"),
        }
        field_keys = ("Dish name · EN", "Dish name · FR", "Description · EN", "Description · FR")
        for language, expected_labels in expected_language_field_labels.items():
            assert tuple(translations[language][key] for key in field_keys) == expected_labels, \
                f"{language} bilingual-field labels changed their EN/FR identifiers"
        assert tuple(translations["zh"][key] for key in ("now", "this week", "today")) == \
               ("现在", "本周", "今天"), \
            "Chinese chart, statement, or emergency-close labels are untranslated"
        generated_labels = {
            "en": ("Practice example", "What this means"),
            "ar": ("مثال عملي", "ماذا يعني هذا"),
            "fr": ("Exemple pratique", "Ce que cela signifie"),
            "zh": ("练习示例", "这意味着什么"),
            "pa": ("ਅਭਿਆਸ ਦੀ ਉਦਾਹਰਨ", "ਇਸਦਾ ਕੀ ਮਤਲਬ ਹੈ"),
        }
        assert 'content:var(--guide-practice-label,"Practice example")' in source, \
            "Practice generated label must use a localized CSS property with an English fallback"
        assert 'content:var(--guide-meaning-label,"What this means")' in source, \
            "Explanation generated label must use a localized CSS property with an English fallback"
        assert "function localizeGeneratedLabels(lang)" in runtime and \
               "localizeGeneratedLabels(lang);" in runtime, \
            "Translation runtime does not update the generated-label CSS properties"
        assert "innerHTML" not in runtime, "Translation runtime must not use innerHTML"
        for language, (practice, meaning) in generated_labels.items():
            entry = f"{language}:{{practice:{practice!r},meaning:{meaning!r}}}"
            assert entry in runtime, f"Generated labels are missing or changed for {language}"
    else:
        assert "Easy order and customer management" in source, "Order management section missing"
        assert source.count('href="/guide"') + source.count('href="/start"') >= 3, "Guide links missing"
    for asset in set(re.findall(r"assets/[A-Za-z0-9_./-]+", source)):
        assert (root / asset).is_file(), f"Missing asset: {asset}"
    assert "/cdn-cgi/challenge-platform/" not in source, "Do not copy edge-injected scripts into source"
    for script in re.findall(r"<script(?:\s[^>]*)?>(.*?)</script>", source, re.S | re.I):
        with tempfile.NamedTemporaryFile(suffix=".js", mode="w") as temp:
            temp.write(script)
            temp.flush()
            subprocess.run(["node", "--check", temp.name], check=True)
for script in [root / "assets/guide-i18n.js", root / "assets/guide-translations.js", root / "assets/guide-progress.js"]:
    subprocess.run(["node", "--check", script], check=True)
subprocess.run([sys.executable, "-m", "unittest", "discover", "-s", "tests", "-p", "test_public_*.py"],
               cwd=root, check=True)
print("PASS: complete curriculum, 15 scenarios, source assets, unique IDs, JavaScript syntax")
