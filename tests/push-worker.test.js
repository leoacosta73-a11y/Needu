import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function worker(windows=[]){
 const handlers={},shown=[],opened=[];
 const self={location:{origin:'https://needu.patyapps.com'},addEventListener:(type,fn)=>handlers[type]=fn,skipWaiting:async()=>{},registration:{showNotification:async(...args)=>shown.push(args)},clients:{claim:async()=>{},matchAll:async()=>windows,openWindow:async url=>opened.push(url)}};
 vm.runInNewContext(fs.readFileSync('public/sw.js','utf8'),{self,URL});
 return {handlers,shown,opened};
}
test('push displays only a generic notice and never reads message payload',async()=>{
 const w=worker();let pending;
 w.handlers.push({get data(){throw Error('Private payload was read')},waitUntil:p=>pending=p});await pending;
 assert.equal(w.shown[0][0],'Needu');assert.equal(w.shown[0][1].body,'Tenés un mensaje nuevo. Abrí Needu para leerlo.');
});
test('notification click opens messages when app is closed',async()=>{
 const w=worker();let pending;
 w.handlers.notificationclick({notification:{close(){}},waitUntil:p=>pending=p});await pending;
 assert.equal(w.opened[0],'/?view=messages');
});
test('notification click focuses real app, never a demo',async()=>{
 let focused=0,openedTab;
 const w=worker([{url:'https://needu.patyapps.com/?demo=1',focus(){throw Error('Demo opened')}},{url:'https://needu.patyapps.com/',focus:async()=>focused++,postMessage:m=>openedTab=m.type}]);let pending;
 w.handlers.notificationclick({notification:{close(){}},waitUntil:p=>pending=p});await pending;
 assert.equal(focused,1);assert.equal(openedTab,'OPEN_NEEDU_MESSAGES');assert.equal(w.opened.length,0);
});
