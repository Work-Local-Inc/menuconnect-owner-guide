(function(root){
'use strict';

var STORAGE_KEY='menuconnect-owner-setup-v1';
var PROBE_KEY='menuconnect-owner-setup-probe';

function memoryStorage(){
  var values={};
  return {
    getItem:function(key){return Object.prototype.hasOwnProperty.call(values,key)?values[key]:null},
    setItem:function(key,value){values[key]=String(value)},
    removeItem:function(key){delete values[key]}
  };
}

function selectStorage(host){
  try{
    var storage=host.localStorage;
    storage.setItem(PROBE_KEY,'1');
    storage.removeItem(PROBE_KEY);
    return {storage:storage,persistent:true};
  }catch(error){
    return {storage:memoryStorage(),persistent:false};
  }
}

function createStore(storage,options){
  options=options||{};
  var total=Number(options.total)||17;
  var stages=Array.isArray(options.stages)?options.stages:[];
  var persistent=options.persistent!==false;
  var now=typeof options.now==='function'?options.now:function(){return new Date().toISOString()};
  var state=read();

  function clean(raw){
    raw=raw&&typeof raw==='object'?raw:{};
    var viewed=[];
    if(Array.isArray(raw.viewed)){
      raw.viewed.forEach(function(value){
        if(Number.isInteger(value)&&value>=1&&value<=total&&viewed.indexOf(value)<0)viewed.push(value);
      });
    }
    viewed.sort(function(a,b){return a-b});
    var lastLesson=Number.isInteger(raw.lastLesson)&&viewed.indexOf(raw.lastLesson)>-1?raw.lastLesson:(viewed.length?viewed[viewed.length-1]:0);
    return {
      viewed:viewed,
      lastLesson:lastLesson,
      quizComplete:raw.quizComplete===true,
      quizScore:Number.isInteger(raw.quizScore)&&raw.quizScore>=0?raw.quizScore:null,
      quizTotal:Number.isInteger(raw.quizTotal)&&raw.quizTotal>0?raw.quizTotal:null,
      completedAt:typeof raw.completedAt==='string'&&raw.completedAt?raw.completedAt:null
    };
  }

  function read(){
    try{return clean(JSON.parse(storage.getItem(STORAGE_KEY)||'{}'))}catch(error){return clean({})}
  }

  function write(){
    try{storage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(error){}
  }

  function isComplete(){return state.viewed.length===total&&state.quizComplete}

  function finalize(){
    if(isComplete()&&!state.completedAt)state.completedAt=now();
    if(!isComplete())state.completedAt=null;
    write();
  }

  function snapshot(){
    var nextLesson=1;
    while(nextLesson<=total&&state.viewed.indexOf(nextLesson)>-1)nextLesson++;
    if(nextLesson>total)nextLesson=state.quizComplete?0:total;
    var stageComplete=stages.map(function(stage,index){
      var lessonsComplete=stage.every(function(lesson){return state.viewed.indexOf(lesson)>-1});
      return lessonsComplete&&(index<stages.length-1||state.quizComplete);
    });
    var completedStages=stageComplete.filter(function(complete){return complete}).length;
    return {
      viewed:state.viewed.slice(),
      viewedCount:state.viewed.length,
      lastLesson:state.lastLesson,
      nextLesson:nextLesson,
      quizComplete:state.quizComplete,
      quizScore:state.quizScore,
      quizTotal:state.quizTotal,
      stageComplete:stageComplete,
      completedStages:completedStages,
      stageCount:stages.length,
      persistent:persistent,
      complete:isComplete(),
      completedAt:state.completedAt
    };
  }

  function markViewed(lesson){
    if(!Number.isInteger(lesson)||lesson<1||lesson>total)return snapshot();
    if(state.viewed.indexOf(lesson)<0){state.viewed.push(lesson);state.viewed.sort(function(a,b){return a-b})}
    state.lastLesson=lesson;
    finalize();
    return snapshot();
  }

  function finishQuickCheck(score,quizTotal){
    state.quizComplete=true;
    state.quizScore=Number.isInteger(score)&&score>=0?score:null;
    state.quizTotal=Number.isInteger(quizTotal)&&quizTotal>0?quizTotal:null;
    finalize();
    return snapshot();
  }

  function reset(){
    state=clean({});
    try{storage.removeItem(STORAGE_KEY)}catch(error){}
    return snapshot();
  }

  finalize();
  return {snapshot:snapshot,markViewed:markViewed,finishQuickCheck:finishQuickCheck,reset:reset};
}

root.MenuConnectProgress={createStore:createStore,selectStorage:selectStorage,storageKey:STORAGE_KEY};
})(typeof window!=='undefined'?window:this);
