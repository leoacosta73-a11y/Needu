import {test} from 'node:test';
import assert from 'node:assert/strict';
import {filterNeeds} from '../src/domain.js';
const needs=[{id:'a',title:'Apoyo escolar',description:'Matemática primaria',name:'María',area:'Pilar, Córdoba',category:'Clases'},{id:'b',title:'Mesa de madera',description:'Reparación',name:'Juan',area:'Pilar, Buenos Aires',category:'Hogar'}];
test('needs search matches accent-insensitive words across description and locality',()=>{
 assert.deepEqual(filterNeeds(needs,{query:'cordoba matematica'}).map(n=>n.id),['a']);
 assert.deepEqual(filterNeeds(needs,{query:'  MARIA  '}).map(n=>n.id),['a']);
});
test('needs category and query combine; no match and reset are distinct',()=>{
 assert.equal(filterNeeds(needs,{query:'Pilar',category:'Clases'}).length,1);
 assert.equal(filterNeeds(needs,{query:'madera',category:'Clases'}).length,0);
 assert.equal(filterNeeds(needs,{}).length,2);
});
