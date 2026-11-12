const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('public/app.js','utf8');const context={AbortController,Date,Math,Map,Set,t:x=>x,ResizeObserver:class{observe(){}disconnect(){}}};vm.createContext(context);vm.runInContext(source.slice(source.indexOf('class TileMap{'),source.indexOf('\nfunction categoryPicker'))+';this.TileMap=TileMap;',context);
context.TileMap.prototype.draw=function(){this.drawCount=(this.drawCount||0)+1};
const target={closest:()=>null},events={},zoomButtons=[{dataset:{zoom:'1'}},{dataset:{zoom:'-1'}}],el={clientWidth:800,clientHeight:400,setAttribute(){},querySelector:()=>({}),querySelectorAll:selector=>selector==='[data-zoom]'?zoomButtons:[],addEventListener:(name,fn)=>events[name]=fn,setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0})};
let picks=0;const map=new context.TileMap(el,[41.31,69.28],[41.32,69.29],()=>picks++,18),pin=[...map.pin];const near=(a,b)=>{assert(Math.abs(a[0]-b[0])<1e-8);assert(Math.abs(a[1]-b[1])<1e-8)};
zoomButtons[0].onclick();assert.equal(map.zoom,19);for(let n=0;n<20;n++)zoomButtons[0].onclick();assert.equal(map.zoom,22);for(let n=0;n<30;n++)zoomButtons[1].onclick();assert.equal(map.zoom,3);
map.zoom=16;const anchor=[680,140],location=map.pointLocation(anchor);let prevented=false;events.wheel({deltaY:-100,deltaMode:0,clientX:anchor[0],clientY:anchor[1],preventDefault(){prevented=true}});assert(prevented);assert.equal(map.zoom,17);near(map.pointLocation(anchor),location);assert.deepEqual([...map.pin],pin);
function pointer(name,id,x,y){events[name]({target,pointerId:id,pointerType:'touch',button:0,clientX:x,clientY:y})}
// Pinch doubles the finger spacing while keeping the midpoint's location fixed.
map.zoom=16;map.center=[41.31,69.28];const midpointLocation=map.pointLocation([400,200]);pointer('pointerdown',1,300,200);pointer('pointerdown',2,500,200);pointer('pointermove',1,200,200);pointer('pointermove',2,600,200);assert.equal(map.zoom,17);near(map.pointLocation([400,200]),midpointLocation);pointer('pointerup',1,200,200);pointer('pointerup',2,600,200);assert.equal(picks,0);assert.deepEqual([...map.pin],pin);
pointer('pointerdown',3,500,240);pointer('pointerup',3,500,240);assert.equal(picks,1);near(map.pin,map.pointLocation([500,240]));
pointer('pointerdown',4,400,200);pointer('pointermove',4,450,200);pointer('pointerup',4,450,200);assert.equal(picks,1);
const before=map.zoom;events.keydown({target:el,key:'+',preventDefault(){}});assert.equal(map.zoom,before+1);events.dblclick({target,clientX:400,clientY:200,preventDefault(){}});assert.equal(map.zoom,before+2);
console.log('Passed: button zoom beyond level 18, bounds, mouse-wheel anchor, unchanged marker, pinch zoom, no accidental pinch/drag pin, tap selection, keyboard and double-click zoom.');
// Exercise real animation frames: smooth intermediate zoom, fixed cursor anchor,
// accumulated wheel targets, and cancellation when the map is destroyed.
let frameQueue=new Map(),nextFrame=0;
context.requestAnimationFrame=fn=>{frameQueue.set(++nextFrame,fn);return nextFrame};
context.cancelAnimationFrame=id=>frameQueue.delete(id);
const step=time=>{const pending=[...frameQueue.values()];frameQueue.clear();pending.forEach(fn=>fn(time))};
map.zoom=14;map.center=[41.31,69.28];const animatedAnchor=map.pointLocation(anchor);
map.zoomBy(1,anchor);step(0);step(120);assert(map.zoom>14&&map.zoom<15);near(map.pointLocation(anchor),animatedAnchor);
map.zoomBy(1,anchor);step(130);step(370);assert.equal(map.zoom,16);near(map.pointLocation(anchor),animatedAnchor);assert.equal(frameQueue.size,0);
map.zoomBy(-1);assert(frameQueue.size>0);map.destroy();assert.equal(frameQueue.size,0);
console.log('Passed: intermediate animation frames, cursor anchoring, consecutive zoom targets and cleanup.');
