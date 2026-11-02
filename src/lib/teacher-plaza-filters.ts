import type { Prisma } from '@prisma/client';
import { curricula, stageGradeTerms } from './teacher-plaza-taxonomy';
export const multiFilterKeys = ['curriculum','stage','subject','grade','tag'] as const;
export type MultiFilterKey = typeof multiFilterKeys[number];
export type TeacherWorkFilters = Partial<Record<MultiFilterKey,string[]>> & { sort?: 'featured'|'latest'|'oldest'|'title'; resource?: string; author?: string; after?: string; before?: string; tagMode?: string; featuredOnly?: string; pageSize?: number };
export function parseFilters(values: Record<string,string|string[]|undefined>): TeacherWorkFilters {
  const text=(key:string)=> (Array.isArray(values[key])?values[key]![0]:values[key]||'').trim().slice(0,100);
  const filters:TeacherWorkFilters={};
  for(const key of multiFilterKeys) filters[key]=[...new Set((Array.isArray(values[key])?values[key]:[values[key]||'']).map(x=>x.trim().slice(0,100)).filter(Boolean))].slice(0,30);
  filters.sort=(['latest','oldest','title'].includes(text('sort'))?text('sort'):'featured') as TeacherWorkFilters['sort'];
  filters.resource=['quiz','story-only'].includes(text('resource'))?text('resource'):'';
  filters.author=text('author'); filters.tagMode=text('tagMode')==='all'?'all':'any'; filters.featuredOnly=text('featuredOnly')==='1'?'1':'';
  for(const key of ['after','before'] as const){const value=text(key);filters[key]=/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value?value:'';}
  if(filters.after&&filters.before&&filters.after>filters.before) [filters.after,filters.before]=[filters.before,filters.after];
  filters.pageSize=[12,24,30].includes(Number(text('pageSize')))?Number(text('pageSize')):12;
  return filters;
}
export function filterParams(filters:TeacherWorkFilters,query:string,page=1){
 const params=new URLSearchParams();if(query)params.set('q',query);
 for(const key of multiFilterKeys) for(const value of filters[key]||[])params.append(key,value);
 for(const key of ['sort','resource','author','after','before','tagMode','featuredOnly','pageSize'] as const){const v=filters[key];if(v&&!(key==='sort'&&v==='featured')&&!(key==='tagMode'&&v==='any')&&!(key==='pageSize'&&v===12))params.set(key,String(v));}
 if(page>1)params.set('page',String(page));return params;
}
export function teacherWorkWhere(query:string,filters:TeacherWorkFilters):Prisma.TeacherWorkWhereInput{
 const AND:Prisma.TeacherWorkWhereInput[]=[];
 if(query.trim())AND.push({OR:[{title:{contains:query.trim().slice(0,80)}},{summary:{contains:query.trim().slice(0,80)}},{author:{nickname:{contains:query.trim().slice(0,80)}}}]});
 if(filters.subject?.length)AND.push({OR:[{subject:{in:filters.subject}},...filters.subject.map(value=>({tags:{array_contains:[value]}}))]});
 if(filters.grade?.length)AND.push({OR:filters.grade.flatMap(g=>[{grade:{startsWith:g}},{tags:{array_contains:[g]}}])});
 if(filters.stage?.length)AND.push({OR:filters.stage.flatMap(stage=>[{tags:{array_contains:[stage]}},...(stageGradeTerms[stage]||[stage]).flatMap(term=>[{grade:term.endsWith('年级')?{startsWith:term}:{contains:term}},{tags:{array_contains:[term]}}])])});
 if(filters.curriculum?.length)AND.push({OR:filters.curriculum.map(value=>value==='未标注'?{NOT:{OR:curricula.map(c=>({tags:{array_contains:[c]}}))}}:{tags:{array_contains:[value]}})});
 if(filters.tag?.length){const clauses=filters.tag.map(tag=>({tags:{array_contains:[tag]}}));AND.push(filters.tagMode==='all'?{AND:clauses}:{OR:clauses});}
 if(filters.resource==='quiz')AND.push({quizUrl:{not:null},NOT:{quizUrl:''}});
 if(filters.resource==='story-only')AND.push({OR:[{quizUrl:null},{quizUrl:''}]});
 if(filters.featuredOnly==='1')AND.push({featured:true});
 if(filters.author)AND.push({author:{nickname:{contains:filters.author}}});
 if(filters.after)AND.push({publishedAt:{gte:new Date(filters.after+'T00:00:00+08:00')}});
 if(filters.before)AND.push({publishedAt:{lt:new Date(new Date(filters.before+'T00:00:00+08:00').getTime()+86400000)}});
 return {status:'PUBLISHED',AND};
}
