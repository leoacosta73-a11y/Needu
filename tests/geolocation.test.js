import test from 'node:test';
import assert from 'node:assert/strict';
import {currentSearchLocation} from '../src/geolocation.js';
import {withinRadius} from '../src/distance.js';

test('current location is a fresh one-shot fix usable without a locality ID',async()=>{
  let calls=0;
  const point=await currentSearchLocation({getCurrentPosition(success,failure,options){
    calls++; assert.equal(options.maximumAge,0); assert.equal(options.timeout,10000);
    success({coords:{latitude:0,longitude:0,accuracy:15}});
  }});
  assert.equal(calls,1); assert.equal(point.accuracy,15);
  const listings=[{locality_id:'near'},{locality_id:'far'},{}];
  assert.deepEqual(withinRadius(listings,[{id:'near',lat:0,lon:.01},{id:'far',lat:0,lon:1}],point,5),[listings[0]]);
});
test('denial, unavailable fix and timeout offer actionable fallback',async()=>{
  for(const [code,text] of [[1,/permiso/],[2,/dispositivo/],[3,/tardó/]]) {
    await assert.rejects(currentSearchLocation({getCurrentPosition(ok,fail){fail({code})}}),text);
  }
  await assert.rejects(currentSearchLocation(null),/navegador/);
  await assert.rejects(currentSearchLocation(null,false),/segura/);
  await assert.rejects(currentSearchLocation({getCurrentPosition(ok){ok({coords:{latitude:NaN,longitude:0}})}}),/válida/);
});
