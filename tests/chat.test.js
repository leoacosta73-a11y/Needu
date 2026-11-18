import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeMessages,unreadMessages} from '../src/chat.js';
const a={id:'1',sender_id:'a',recipient_id:'b',created_at:'2026-11-18T12:00:00Z'};
const b={id:'2',sender_id:'b',recipient_id:'a',created_at:'2026-11-18T12:01:00Z'};
test('realtime and refresh races preserve messages without duplicates',()=>{
 assert.deepEqual(mergeMessages([b],[a,b],'a'),[a,b]);
 assert.deepEqual(mergeMessages([a,b],[a],'a'),[a,b]);
});
test('switching users cannot retain messages for unrelated accounts',()=>{
 assert.deepEqual(mergeMessages([a,b],[{...a,id:'3',sender_id:'c',recipient_id:'d'}],'c').map(m=>m.id),['3']);
});
test('unread markers are account and conversation specific',()=>{
 assert.equal(unreadMessages([a,b],'a',{}).length,1);
 assert.equal(unreadMessages([a,b],'a',{'a:b':b.created_at}).length,0);
 assert.equal(unreadMessages([a,b],'b',{'a:b':b.created_at}).length,1);
});
