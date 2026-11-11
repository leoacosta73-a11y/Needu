import test from 'node:test';
import assert from 'node:assert/strict';
import {distanceKm,withinRadius} from '../src/distance.js';
const origin={id:'a',lat:0,lon:0};
const near={id:'b',lat:0,lon:0.05},far={id:'c',lat:0,lon:1};
test('great-circle distance handles zero, known distance and missing coordinates',()=>{
  assert.equal(distanceKm(origin,origin),0);
  assert.ok(Math.abs(distanceKm(origin,far)-111.195)<0.01);
  assert.equal(distanceKm(origin,undefined),null);
  assert.equal(distanceKm(origin,{lat:null,lon:0}),null);
});
test('radius excludes unknown locations and combines with either listing type',()=>{
  const items=[{locality_id:'a'},{locality_id:'b'},{locality_id:'c'},{locality_id:'unknown'},{}];
  assert.deepEqual(withinRadius(items,[origin,near,far],origin,5),items.slice(0,1));
  assert.deepEqual(withinRadius(items,[origin,near,far],origin,10),items.slice(0,2));
  assert.deepEqual(withinRadius(items,[origin,near,far],null,10),[]);
  assert.equal(withinRadius(items,[],null,''),items);
  assert.deepEqual(withinRadius(items,[origin,near,far],origin,120),items.slice(0,3));
});
