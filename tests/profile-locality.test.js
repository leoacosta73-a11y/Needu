import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {identityProfile, googlePhoto} from '../src/identity.js';
import {searchLocalities} from '../src/localities.js';
const {localities} = JSON.parse(await readFile(new URL('../public/localidades-ar.json',import.meta.url),'utf8'));
test('Google identity fills a new or legacy placeholder profile and preserves a chosen name',()=>{
 const user={user_metadata:{full_name:'Leandro Acosta'}};
 assert.equal(identityProfile(user,{},{}).name,'Leandro Acosta');
 assert.equal(identityProfile(user,{name:'Tu nombre'},{name:'Tu nombre'}).name,'Leandro Acosta');
 assert.equal(identityProfile(user,{name:'Leo',bio:'Mi presentación'},{}).name,'Leo');
 assert.equal(identityProfile({user_metadata:{name:'Ana Pérez'}},{},{}).initials,'AP');
 assert.equal(identityProfile(null,{},{}).name,'Tu nombre');
 assert.equal(identityProfile(user,{},{}).age,undefined);
});
test('Google avatars accept Google HTTPS hosts and reject arbitrary URLs',()=>{
 assert.equal(googlePhoto({user_metadata:{picture:'https://lh3.googleusercontent.com/a/p'}}),'https://lh3.googleusercontent.com/a/p');
 assert.equal(googlePhoto({user_metadata:{picture:'https://googleusercontent.com.evil.example/a'}}),null);
 assert.equal(googlePhoto({user_metadata:{picture:'javascript:alert(1)'}}),null);
});
test('Pilar has distinct province identities without duplicate Buenos Aires entries',()=>{
 const matches=searchLocalities(localities,'Pilar').filter(row=>row.name==='Pilar');
 assert.deepEqual(matches.map(row=>row.province),['Buenos Aires','Córdoba','Santa Fe']);
 assert.equal(new Set(matches.map(row=>row.id)).size,3);
 assert.equal(searchLocalities(localities,'pilar cordoba')[0].id,'14119160');
 assert.equal(searchLocalities(localities,'Pilar, Buenos Aires')[0].id,'0663804008');
});
test('catalog search supports accents, partial names, CABA neighborhoods and no results',()=>{
 assert.ok(searchLocalities(localities,'P').length);
 assert.ok(searchLocalities(localities,'constitucion').some(row=>row.provinceId==='02'));
 assert.equal(searchLocalities(localities,'zzzz-no-existe').length,0);
 assert.equal(searchLocalities(localities,'').length,0);
 assert.equal(new Set(localities.map(row=>row.id)).size,localities.length);
 assert.equal(new Set(localities.map(row=>row.label)).size,localities.length);
});
