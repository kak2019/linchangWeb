import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';
function load(file){const box={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:box.exports,module:box,URLSearchParams,Date,require:id=>id==='./teacher-plaza-taxonomy'?load('src/lib/teacher-plaza-taxonomy.ts'):{}});return box.exports;}
const api=load('src/lib/teacher-plaza-filters.ts');
test('repeated URL values deduplicate and round trip with multi select and advanced filters',()=>{const f=api.parseFilters({subject:['语文','数学','语文'],stage:['高中','初中'],resource:'quiz',author:' 测试 ',pageSize:'24',sort:'title',tag:['角色扮演']});const params=api.filterParams(f,'人物',3);assert.equal(params.getAll('subject').join(','),'语文,数学');assert.equal(params.getAll('stage').length,2);assert.equal(params.get('resource'),'quiz');assert.equal(params.get('page'),'3');assert.equal(params.get('pageSize'),'24');assert.equal(params.get('q'),'人物');});
test('invalid dates ignored and reversed bounds normalize',()=>{assert.equal(api.parseFilters({after:'2026-02-30'}).after,'');const f=api.parseFilters({after:'2026-10-31',before:'2026-10-01',sort:'wrong',pageSize:'999'});assert.equal(f.after,'2026-10-01');assert.equal(f.before,'2026-10-31');assert.equal(f.sort,'featured');assert.equal(f.pageSize,12);});
test('within dimensions OR, across dimensions AND, with all-tags intersection',()=>{const w=api.teacherWorkWhere('人物',api.parseFilters({subject:['语文','数学'],stage:['初中','高中'],tag:['A','B'],tagMode:'all',resource:'quiz',featuredOnly:'1'}));assert.equal(w.status,'PUBLISHED');assert.equal(w.AND[0].OR.length,3);assert.equal(w.AND[1].OR[0].subject.in.length,2);assert.ok(w.AND[2].OR.length>2);assert.equal(w.AND[3].AND.length,2);assert.equal(w.AND[4].quizUrl.not,null);assert.equal(w.AND[5].featured,true);});
test('Shanghai inclusive ending day and unclassified curriculum query',()=>{const w=api.teacherWorkWhere('',api.parseFilters({curriculum:['未标注','IB'],after:'2026-10-01',before:'2026-10-31'}));assert.equal(w.AND[0].OR[0].NOT.OR.length,5);assert.equal(w.AND[1].publishedAt.gte.toISOString(),'2026-09-30T16:00:00.000Z');assert.equal(w.AND[2].publishedAt.lt.toISOString(),'2026-10-31T16:00:00.000Z');});

test('secondary subjects, grades and stages remain discoverable from tag memberships',()=>{
 const where=api.teacherWorkWhere('',api.parseFilters({subject:['地理'],grade:['五年级'],stage:['初中']}));
 assert.equal(where.AND[0].OR[1].tags.array_contains[0],'地理');
 assert.ok(where.AND[1].OR.some(clause=>clause.tags?.array_contains[0]==='五年级'));
 assert.ok(where.AND[2].OR.some(clause=>clause.tags?.array_contains[0]==='初中'));
 assert.ok(where.AND[2].OR.some(clause=>clause.grade?.contains==='初一'));
});
test('publication accepts 64 tags without truncation and rejects 65',()=>{
 const source=fs.readFileSync('src/app/api/teacher-ecosystem/internal/works/route.ts','utf8')+'\nexport { normalizePayload as normalizeForTest };';
 const box={exports:{}};
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:box.exports,module:box,URL,require:()=>({})});
 const payload={ownerUserId:'author',jobId:'a'.repeat(32),title:'资源',playUrl:'https://example.com/resource/',tags:Array.from({length:64},(_,i)=>'tag'+i)};
 assert.equal(box.exports.normalizeForTest(payload).tags.length,64);
 assert.throws(()=>box.exports.normalizeForTest({...payload,tags:[...payload.tags,'65th']}),/64/);
});

test('cover-only PATCH preserves publication state, time and metadata',async()=>{
 const source=fs.readFileSync('src/app/api/teacher-ecosystem/internal/works/route.ts','utf8');
 const box={exports:{}};const calls=[];
 const dependencies={
  'next/server':{NextResponse:{json:body=>body}},
  '@/lib/auth/http':{jsonError:(message,status)=>({message,status}),configErrorResponse:()=>({status:500})},
  '@/lib/db':{getPrisma:()=>({teacherWork:{updateMany:async args=>{calls.push(args);return {count:1}}}})},
  '@/lib/teacher-ecosystem':{internalServiceAuthStatus:()=> 'ok'},
 };
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:box.exports,module:box,URL,console,require:id=>dependencies[id]||{}});
 const result=await box.exports.PATCH({json:async()=>({ownerUserId:'author',jobId:'a'.repeat(32),coverUrl:'https://example.com/cover.webp',tags:['must-not-update'],status:'PUBLISHED'})});
 assert.equal(result.updated,true);
 assert.equal(JSON.stringify(calls[0]),JSON.stringify({where:{jobId:'a'.repeat(32),authorId:'author'},data:{coverUrl:'https://example.com/cover.webp'}}));
});
