import {test} from 'node:test';
import assert from 'node:assert/strict';
import {filterPeople,coarseCell,validText} from '../src/domain.js';
import {demoPeople} from '../src/data.js';
test('search ignores accents and matches multiple skills',()=>{
 assert.equal(filterPeople(demoPeople,{query:'fotografia'})[0].id,'ana');
 assert.equal(filterPeople(demoPeople,{query:'ingles'})[0].id,'sofia');
});
test('combines category, availability and saved filters',()=>{
 assert.equal(filterPeople(demoPeople,{category:'Clases',available:true}).length,0);
 assert.deepEqual(filterPeople(demoPeople,{saved:true,favorites:['ana','nico'],hidden:['ana']}).map(p=>p.id),['nico']);
});
test('location drops precise coordinates and handles negative values',()=>{
 assert.equal(coarseCell(-34.603722,-58.381592),'-34.6,-58.38');
 assert.equal(coarseCell(-34.603720,-58.381590),coarseCell(-34.603722,-58.381592));
});
test('rejects blank and overlong messages',()=>{
 assert.equal(validText('   '),false);assert.equal(validText('a'.repeat(1001),1000),false);assert.equal(validText('Hola, ¿coordinamos?',1000),true);
});
