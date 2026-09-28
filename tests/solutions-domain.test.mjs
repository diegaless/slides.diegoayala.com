import test from 'node:test';
import assert from 'node:assert/strict';
import {visibility,publicationChange,validId,downloadName,visibleTasks} from '../assets/solutions/domain.mjs';

test('la solución permanece privada si falta el estado o está mal formado',()=>{
  for(const state of [null,{}, {mode:'unknown'},{mode:'private',publishAt:0}]) assert.equal(visibility(state,100),'private');
});
test('la programación abre exactamente al llegar la fecha, nunca antes',()=>{
  const state={mode:'scheduled',publishAt:{toMillis:()=>100}};
  assert.equal(visibility(state,99),'scheduled');
  assert.equal(visibility(state,100),'public');
  assert.equal(visibility({mode:'scheduled',publishAt:NaN},100),'scheduled');
});
test('cerrar y publicar eliminan cualquier programación anterior',()=>{
  for(const mode of ['private','public'])assert.deepEqual(publicationChange(mode,'2030-01-01'),{mode,publishAt:null});
});
test('rechaza fechas pasadas, inmediatas, inválidas o demasiado lejanas',()=>{
  const now=Date.UTC(2026,8,28);
  for(const value of ['invalid',new Date(now-1),new Date(now+1000),new Date(now+367*86400000)]) {
    assert.throws(()=>publicationChange('scheduled',value,now));
  }
  assert.equal(publicationChange('scheduled',new Date(now+120000),now).publishAt.getTime(),now+120000);
  assert.throws(()=>publicationChange('admin',null,now));
});
test('los identificadores y nombres no permiten rutas arbitrarias',()=>{
  for(const id of ['../secret','di-01/../../','https://example.com','di-','',null])assert.equal(validId(id),false);
  assert.equal(downloadName('di-03-qt6-8','codigo'),'di-03-qt6-8-solucion.zip');
  assert.throws(()=>downloadName('di-03-qt6-8','exe'));
});
test('búsqueda por asignatura sin depender de mayúsculas ni tildes',()=>{
  const tasks=[{subject:'di',title:'Señales y componentes'},{subject:'lm',title:'Validación'}];
  assert.deepEqual(visibleTasks(tasks,'di','SENALES'),[tasks[0]]);
  assert.deepEqual(visibleTasks(tasks,'di','validacion'),[]);
  assert.deepEqual(visibleTasks(tasks,'','validacion'),[tasks[1]]);
});
