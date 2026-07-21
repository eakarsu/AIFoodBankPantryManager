'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const{evaluatePantryWorkflow}=require('../domain/pantryWorkflow');
const valid={asOf:'2026-01-01',lots:[{id:'l1',sku:'rice',donorRef:'d1',receivedAt:'2025-12-01',expiresAt:'2026-02-01',onHand:10,reserved:0,allergens:[]}],reservations:[{id:'r1',sku:'rice',quantity:4,eligibilityRef:'eligible:1',recipient:{opaqueId:'h1'}}]};
test('allocates FEFO and reconciles counts',()=>{const x=evaluatePantryWorkflow(valid);assert.deepEqual(x.errors,[]);assert.equal(x.result.allocation[0].quantity,4);assert.equal(x.result.decision,'reviewable')});
test('quarantines recalled lots',()=>{const x=evaluatePantryWorkflow({...valid,recalls:[{lotId:'l1'}]});assert.equal(x.result.recallImpact[0].quarantinedUnits,10);assert.ok(x.result.allocation[0].shortage)});
test('rejects prohibited recipient data',()=>{const x=evaluatePantryWorkflow({...valid,reservations:[{...valid.reservations[0],recipient:{ssn:'x'}}]});assert.ok(x.errors.some(e=>e.includes('prohibited')))});
