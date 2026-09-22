(function(){
'use strict';
var translations=window.MenuConnectTranslations||{};
var supported=['en','ar','fr','zh','pa'];
var rtl={ar:true};
var sourceText=new WeakMap();
var sourceAttrs=new WeakMap();
var applying=false;
var attrs=['aria-label','placeholder','title'];
var skipSelector='script,style,svg,code,[data-no-i18n]';
var statuses={
  en:'The complete guide is shown in English.',
  ar:'ترجمة تلقائية — تحقّق من التفاصيل المالية مع Menu.ca.',
  fr:'Traduction automatique — vérifiez les détails financiers auprès de Menu.ca.',
  zh:'自动翻译——请向 Menu.ca 核实财务信息。',
  pa:'ਸਵੈਚਾਲਿਤ ਅਨੁਵਾਦ — ਵਿੱਤੀ ਵੇਰਵਿਆਂ ਦੀ Menu.ca ਨਾਲ ਪੁਸ਼ਟੀ ਕਰੋ।'
};
var interfaceTranslations={
  ar:{'Right ✓':'صحيح ✓','Not quite —':'ليس تمامًا —'},
  fr:{'Right ✓':'Correct ✓','Not quite —':'Pas tout à fait —'},
  zh:{'Guide language':'指南语言','Right ✓':'正确 ✓','Not quite —':'不完全正确 —'},
  pa:{'Right ✓':'ਸਹੀ ✓','Not quite —':'ਪੂਰੀ ਤਰ੍ਹਾਂ ਨਹੀਂ —'}
};
var generatedLabels={
  en:{practice:'Practice example',meaning:'What this means'},
  ar:{practice:'مثال عملي',meaning:'ماذا يعني هذا'},
  fr:{practice:'Exemple pratique',meaning:'Ce que cela signifie'},
  zh:{practice:'练习示例',meaning:'这意味着什么'},
  pa:{practice:'ਅਭਿਆਸ ਦੀ ਉਦਾਹਰਨ',meaning:'ਇਸਦਾ ਕੀ ਮਤਲਬ ਹੈ'}
};
var current='en';

function normalize(value){return value.replace(/\s+/g,' ').trim()}
function translatable(node){return node.parentElement&&!node.parentElement.closest(skipSelector)}
function translated(lang,key){
  if(lang==='en')return key;
  if(interfaceTranslations[lang]&&interfaceTranslations[lang][key])return interfaceTranslations[lang][key];
  if(translations[lang]&&translations[lang][key])return translations[lang][key];
  var match=key.match(/^Question (\d+) of (\d+)(?: · (\d+) right so far)?$/);
  if(match){
    if(lang==='ar')return 'السؤال '+match[1]+' من '+match[2]+(match[3]?' · '+match[3]+' إجابات صحيحة حتى الآن':'');
    if(lang==='fr')return 'Question '+match[1]+' sur '+match[2]+(match[3]?' · '+match[3]+' bonnes réponses jusqu’ici':'');
    if(lang==='zh')return '第 '+match[1]+' 题，共 '+match[2]+' 题'+(match[3]?' · 目前答对 '+match[3]+' 题':'');
    if(lang==='pa')return 'ਸਵਾਲ '+match[1]+' / '+match[2]+(match[3]?' · ਹੁਣ ਤੱਕ '+match[3]+' ਸਹੀ':'');
  }
  match=key.match(/^(\d+) of (\d+) lessons viewed$/);
  if(match){
    if(lang==='ar')return 'تمت مشاهدة '+match[1]+' من '+match[2]+' درسًا';
    if(lang==='fr')return match[1]+' leçon'+(match[1]==='1'?'':'s')+' consultée'+(match[1]==='1'?'':'s')+' sur '+match[2];
    if(lang==='zh')return '已查看 '+match[1]+' / '+match[2]+' 课';
    if(lang==='pa')return match[2]+' ਵਿੱਚੋਂ '+match[1]+' ਪਾਠ ਵੇਖੇ';
  }
  match=key.match(/^(\d+) of (\d+) lessons reviewed · (\d+) of 5 stages complete$/);
  if(match){
    if(lang==='ar')return 'تمت مراجعة '+match[1]+' من '+match[2]+' درسًا · اكتملت '+match[3]+' من 5 مراحل';
    if(lang==='fr')return match[1]+' leçon'+(match[1]==='1'?'':'s')+' révisée'+(match[1]==='1'?'':'s')+' sur '+match[2]+' · '+match[3]+' étape'+(match[3]==='1'?'':'s')+' terminée'+(match[3]==='1'?'':'s')+' sur 5';
    if(lang==='zh')return '已复习 '+match[1]+' / '+match[2]+' 课 · 已完成 '+match[3]+' / 5 个阶段';
    if(lang==='pa')return match[2]+' ਵਿੱਚੋਂ '+match[1]+' ਪਾਠ ਵੇਖੇ · 5 ਵਿੱਚੋਂ '+match[3]+' ਪੜਾਅ ਪੂਰੇ';
  }
  match=key.match(/^(\d+) remaining lesson(?:s)? — review (?:it|them) to complete your Owner Setup\.$/);
  if(match){
    if(lang==='ar')return match[1]==='1'?'تبقّى درس واحد — راجعه لإكمال إعداد المالك.':'تبقّى '+match[1]+' من الدروس — راجعها لإكمال إعداد المالك.';
    if(lang==='fr')return match[1]==='1'?'Il reste 1 leçon — révisez-la pour terminer votre configuration propriétaire.':'Il reste '+match[1]+' leçons — révisez-les pour terminer votre configuration propriétaire.';
    if(lang==='zh')return match[1]==='1'?'还剩 1 节课——请复习本课以完成店主设置。':'还剩 '+match[1]+' 节课——请复习它们以完成店主设置。';
    if(lang==='pa')return match[1]==='1'?'1 ਪਾਠ ਬਾਕੀ ਹੈ — ਮਾਲਕ ਸੈਟਅੱਪ ਪੂਰੀ ਕਰਨ ਲਈ ਇਸਦੀ ਸਮੀਖਿਆ ਕਰੋ।':match[1]+' ਪਾਠ ਬਾਕੀ ਹਨ — ਮਾਲਕ ਸੈਟਅੱਪ ਪੂਰੀ ਕਰਨ ਲਈ ਉਹਨਾਂ ਦੀ ਸਮੀਖਿਆ ਕਰੋ।';
  }
  match=key.match(/^(\d+) of 5 checked$/);
  if(match){
    if(lang==='ar')return 'تم تحديد '+match[1]+' من 5';
    if(lang==='fr')return match[1]+' éléments cochés sur 5';
    if(lang==='zh')return '已勾选 '+match[1]+' / 5';
    if(lang==='pa')return '5 ਵਿੱਚੋਂ '+match[1]+' ਚੁਣੇ';
  }
  return key;
}
function localizeText(node,lang){
  if(!translatable(node))return;
  if(!sourceText.has(node))sourceText.set(node,node.nodeValue);
  var original=sourceText.get(node),key=normalize(original);if(!key)return;
  var replacement=translated(lang,key);
  var leading=(original.match(/^\s*/)||[''])[0],trailing=(original.match(/\s*$/)||[''])[0];
  node.nodeValue=leading+replacement+trailing;
}
function localizeAttrs(el,lang){
  if(el.closest(skipSelector))return;
  if(!sourceAttrs.has(el))sourceAttrs.set(el,{});
  var originals=sourceAttrs.get(el);
  attrs.forEach(function(name){
    if(!(name in originals)&&el.hasAttribute(name))originals[name]=el.getAttribute(name);
    if(name in originals){var key=normalize(originals[name]);el.setAttribute(name,translated(lang,key))}
  });
}
function localizeTree(root,lang){
  if(root.nodeType===3){localizeText(root,lang);return}
  if(root.nodeType!==1||root.closest(skipSelector))return;
  localizeAttrs(root,lang);
  var walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
  var node;while((node=walker.nextNode())){if(node.nodeType===3)localizeText(node,lang);else localizeAttrs(node,lang)}
}
function languageFromUrl(){
  var value=new URLSearchParams(location.search).get('lang');
  if(supported.indexOf(value)>-1)return value;
  try{value=sessionStorage.getItem('menuconnect-guide-language')}catch(e){}
  return supported.indexOf(value)>-1?value:'en';
}
function updateUrl(lang){
  var url=new URL(location.href);
  if(lang==='en')url.searchParams.delete('lang');else url.searchParams.set('lang',lang);
  history.replaceState(history.state,'',url.pathname+(url.searchParams.toString()?'?'+url.searchParams.toString():'')+url.hash);
}
function localizeGeneratedLabels(lang){
  var labels=generatedLabels[lang]||generatedLabels.en;
  document.documentElement.style.setProperty('--guide-practice-label',JSON.stringify(labels.practice));
  document.documentElement.style.setProperty('--guide-meaning-label',JSON.stringify(labels.meaning));
}
function applyLanguage(lang,updateHistory){
  if(supported.indexOf(lang)<0)lang='en';
  applying=true;current=lang;
  document.documentElement.lang=lang==='zh'?'zh-Hans':lang;
  document.documentElement.dir=rtl[lang]?'rtl':'ltr';
  localizeGeneratedLabels(lang);
  localizeTree(document.body,lang);
  document.title=translated(lang,'MenuConnect Owner Guide');
  document.querySelectorAll('[data-guide-lang]').forEach(function(button){button.setAttribute('aria-pressed',button.dataset.guideLang===lang?'true':'false')});
  document.getElementById('languageStatus').textContent=statuses[lang];
  try{sessionStorage.setItem('menuconnect-guide-language',lang)}catch(e){}
  if(updateHistory)updateUrl(lang);
  applying=false;
}

document.querySelector('.language-options').addEventListener('click',function(event){
  var button=event.target.closest('[data-guide-lang]');if(button)applyLanguage(button.dataset.guideLang,true);
});
new MutationObserver(function(records){
  if(applying)return;
  records.forEach(function(record){
    record.addedNodes.forEach(function(node){localizeTree(node,current)});
  });
}).observe(document.body,{subtree:true,childList:true});
applyLanguage(languageFromUrl(),false);
})();
