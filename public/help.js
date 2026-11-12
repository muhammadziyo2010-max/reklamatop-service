'use strict';
(()=>{
 const labels={
 uz:{name:'Sayt yordamchisi',ask:'Sayt haqida so‘rang',close:'Yopish',activation:'Qo‘llanma rejimi · AI tasdiqlash kutilmoqda',guide:'Qo‘llanma rejimi · AI hali ulanmagan',ai:'AI yordamchi',intro:'Salom! ReklamaTop haqida savolingizni yozing. Xizmat topish, taklif joylash yoki akkauntdan foydalanishni tushuntiraman.',placeholder:'Masalan: xizmatni qanday joylayman?',send:'Yuborish',wait:'Javob tayyorlanmoqda…',privacy:'Parol va shaxsiy ma’lumotlarni yozmang. AI rejimida savollaringiz javob tayyorlash uchun AI xizmatiga yuboriladi. Chat ushbu oynada saqlanadi.',setup:'AI ulanishini yakunlash kerak. Hozircha sayt qo‘llanmasi orqali yordam beraman.',failed:'AI hozir javob bera olmadi. Iltimos, birozdan keyin qayta urinib ko‘ring.',limit:'Savollar ko‘paydi. Birozdan keyin qayta urinib ko‘ring ',offers:'Takliflarni ochish',add:'Xizmat joylash',clear:'Suhbatni tozalash'},
 ru:{name:'Помощник сайта',ask:'Спросите о сайте',close:'Закрыть',activation:'Режим справки · ожидается активация AI',guide:'Режим справки · AI ещё не подключён',ai:'AI-помощник',intro:'Здравствуйте! Задайте вопрос о ReklamaTop. Помогу найти услугу, добавить предложение или разобраться с аккаунтом.',placeholder:'Например: как добавить услугу?',send:'Отправить',wait:'Готовим ответ…',privacy:'Не пишите пароли и личные данные. В режиме AI вопросы отправляются AI-сервису для подготовки ответа. Чат хранится только в этом окне.',setup:'Нужно завершить подключение AI. Пока помогу по справке сайта.',failed:'AI сейчас не смог ответить. Пожалуйста, попробуйте позже.',limit:'Слишком много вопросов. Попробуйте позже ',offers:'Открыть предложения',add:'Добавить услугу',clear:'Очистить чат'},
 en:{name:'Site assistant',ask:'Ask about the site',close:'Close',activation:'Guide mode · AI activation pending',guide:'Guide mode · AI is not connected yet',ai:'AI assistant',intro:'Hello! Ask me about ReklamaTop. I can explain how to find a service, post an offer or use your account.',placeholder:'For example: how do I post a service?',send:'Send',wait:'Preparing an answer…',privacy:'Do not share passwords or personal information. In AI mode your questions are sent to the AI service to prepare a reply. Chat stays in this window only.',setup:'AI setup needs to be completed. I can help from the site guide for now.',failed:'AI could not answer right now. Please try again shortly.',limit:'Too many questions. Please try later ',offers:'Open offers',add:'Post a service',clear:'Clear chat'}
 };
 let code=document.documentElement.lang,mode='guide',history=[],pending=false,controller=null;
 const language=()=>['uz','ru','en'].includes(code)?code:'uz',ix=()=>['uz','ru','en'].indexOf(language()),t=k=>labels[language()][k];
 const launcher=document.createElement('button');launcher.type='button';launcher.className='help-launcher';launcher.id='help-launcher';launcher.setAttribute('aria-expanded','false');launcher.setAttribute('aria-controls','help-panel');
 const panel=document.createElement('section');panel.id='help-panel';panel.className='help-panel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','false');panel.setAttribute('aria-labelledby','help-title');
 document.body.append(launcher,panel);
 const el=s=>panel.querySelector(s),node=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value)n.textContent=value;return n};
 function bubble(text,role){const n=node('div','help-bubble help-'+role,text);el('.help-log').append(n);n.scrollIntoView({block:'nearest',behavior:'smooth'});return n}
 function close(){panel.hidden=true;launcher.setAttribute('aria-expanded','false');launcher.focus()}
 function open(){panel.hidden=false;launcher.setAttribute('aria-expanded','true');el('textarea').focus()}
 function render(){
  launcher.textContent='✦ '+t('name');launcher.setAttribute('aria-label',t('ask'));
  panel.replaceChildren();
  const head=node('div','help-head'),titles=node('div');titles.append(node('strong','',t('name')));titles.firstChild.id='help-title';titles.append(node('small','help-mode',t(mode==='ai'?'ai':'guide')));
  const exit=node('button','help-close','×');exit.type='button';exit.setAttribute('aria-label',t('close'));exit.addEventListener('click',close);head.append(titles,exit);
  const log=node('div','help-log');log.setAttribute('role','log');log.setAttribute('aria-live','polite');log.setAttribute('aria-relevant','additions');
  const form=node('form','help-form'),input=node('textarea');input.rows=2;input.maxLength=1200;input.required=true;input.placeholder=t('placeholder');input.setAttribute('aria-label',t('ask'));const submit=node('button','',t('send'));submit.type='submit';form.append(input,submit);form.addEventListener('submit',e=>{e.preventDefault();send(input.value)});input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();if(form.reportValidity())send(input.value)}});
  const foot=node('div','help-foot'),clear=node('button','help-clear',t('clear'));clear.type='button';clear.addEventListener('click',()=>{controller?.abort();pending=false;history=[];render()});foot.append(node('small','',t('privacy')),clear);
  panel.append(head,log,form,foot);bubble(t('intro'),'assistant');
 }
 function busy(value){pending=value;for(const b of panel.querySelectorAll('.help-form button'))b.disabled=value;el('textarea').disabled=value;el('.help-form').setAttribute('aria-busy',String(value))}
 async function send(raw,id){const question=raw.trim();if(!question||pending)return;el('textarea').value='';bubble(question,'user');
  if(mode!=='ai'||id){bubble(HelpReplies.reply(question,language(),SITE_HELP,id),'assistant');return}
  history=[...history,{role:'user',content:question}].slice(-9);busy(true);const waiting=bubble(t('wait'),'status');controller=new AbortController();const current=controller;
  try{const r=await fetch('/api/help',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:history}),signal:AbortSignal.any([current.signal,AbortSignal.timeout(25000)])});const data=await r.json();if(!r.ok)throw new Error(r.status===429?'LIMIT':data.error==='AI_SETUP_REQUIRED'?'SETUP':'FAILED');if(typeof data.answer!=='string')throw new Error('FAILED');waiting.remove();bubble(data.answer,'assistant');history=[...history,{role:'assistant',content:data.answer.slice(0,1200)}].slice(-8)}
  catch(err){waiting.remove();if(current.signal.aborted)return;history=history.filter((_,i)=>i!==history.length-1);bubble(err.message==='LIMIT'?t('limit'):err.message==='SETUP'?t('setup')+'\n\n'+HelpReplies.reply(question,language(),SITE_HELP):t('failed'),'assistant')}
  finally{if(controller===current){busy(false);controller=null;el('textarea').focus()}}
 }
 launcher.addEventListener('click',()=>panel.hidden?open():close());panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close()}});
 render();new MutationObserver(()=>{if(code===document.documentElement.lang)return;controller?.abort();code=document.documentElement.lang;pending=false;history=[];render()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 fetch('/api/help').then(r=>r.ok?r.json():null).then(data=>{if(data?.mode==='ai'){mode='ai';el('.help-mode').textContent=t('ai')}else if(data?.setup_pending){el('.help-mode').textContent=t('activation')}}).catch(()=>{});
})();
