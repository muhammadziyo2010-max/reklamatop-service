'use strict';
const HelpReplies=(()=>{
 const normalize=s=>s.toLowerCase().replace(/[‘’ʻʼ`']/g,'').replace(/ş/g,'sh').replace(/ç/g,'ch').replace(/ö/g,'o').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
 const greetings=/^(?:(?:ass?al[oa]m[ou]?)[\s-]*(?:a?l[ea]y?kum)|salomlar|salom|salam|салом|hello|hi|hey|привет|здравствуйте|здравствуй)(?=$|\s)/;
 const replies={
 uz:{ack:'Xo‘p! Yana savolingiz bo‘lsa, yozing.',clarify:'Qaysi qadam tushunarsiz bo‘ldi? Savolingizni yozing, tushuntirib beraman.',help:'Albatta! Saytning qaysi qismida yordam kerak: xizmat topish, taklif joylash, akkaunt yoki xabarlar?',thanks:'Arzimaydi! Yana savolingiz bo‘lsa, yozing.',bye:'Xayr! Yana yordam kerak bo‘lsa, shu yerdaman.',well:'Yaxshiman, rahmat! Sizga sayt bo‘yicha qanday yordam beray?',identity:'Men ReklamaTop saytining yordamchisiman. Hozir tayyor qo‘llanma asosida javob beraman; AI hali ulanmagan.',unknown:'Men sizga faqat sayt haqida savollaringizga javob bera olaman.'},
 ru:{ack:'Хорошо! Если будут вопросы, пишите.',clarify:'Какой шаг непонятен? Напишите, и я объясню.',help:'Конечно! С чем помочь на сайте: поиск услуг, публикация, аккаунт или сообщения?',thanks:'Пожалуйста! Если появятся вопросы, пишите.',bye:'До свидания! Обращайтесь, если понадобится помощь.',well:'Всё хорошо, спасибо! Чем помочь на сайте?',identity:'Я помощник сайта ReklamaTop. Сейчас отвечаю по готовой справке; AI ещё не подключён.',unknown:'Я могу отвечать только на ваши вопросы об этом сайте.'},
 en:{ack:'Okay! Let me know if you have another question.',clarify:'Which step is unclear? Tell me and I’ll explain.',help:'Of course! What do you need help with: finding services, posting offers, accounts or messages?',thanks:'You’re welcome! Ask me if you need anything else.',bye:'Goodbye! I’m here if you need more help.',well:'I’m well, thanks! How can I help you with the site?',identity:'I’m the ReklamaTop site helper. I currently answer from a prepared guide; AI is not connected yet.',unknown:'I can only answer your questions about this website.'}
 };
 function reply(question,language,topics,id){
  const code=['uz','ru','en'].includes(language)?language:'uz',index=['uz','ru','en'].indexOf(code),text=replies[code];
  if(id){const topic=topics.find(x=>x.id===id);return topic?topic.a[index]:text.unknown}
  let q=normalize(question),greeting='';
  const match=q.match(greetings);
  if(match){
   const word=match[0].trim();
   greeting=/^(?:ass?al)/.test(word)?'Va aleykum assalom!':/^(salom|salam|салом)/.test(word)?'Salom!':word==='hi'?'Hi!':word==='hey'?'Hey!':word==='hello'?'Hello!':word==='привет'?'Привет!':'Здравствуйте!';
   q=q.slice(match[0].length).trim();
   if(/^(aka|uka|bot|yordamchi|hammaga|sizga|senga)$/.test(q))q='';
  }
  if(!q){if(!greeting)return text.unknown;const offer=/^(Hi!|Hey!|Hello!)$/.test(greeting)?'How can I help you?':/^(Привет!|Здравствуйте!)$/.test(greeting)?'Чем я могу вам помочь?':greeting==='Va aleykum assalom!'?'Xo‘sh, sizga nima yordam bera olaman?':'Sizga nima yordam bera olaman?';return greeting+' '+offer;}
  const respond=answer=>(greeting?greeting+'\n\n':'')+answer;
  if(/^(rahmat|raxmat|katta rahmat|kotta rahmat|rahmat katta|rahmat sizga|sizga rahmat|tashakkur|спасибо|большое спасибо|благодарю|thanks|thank you)(\s+(sizga|senga|katta|boladi|vam|very much))?$/.test(q))return respond(text.thanks);
  if(/^(xayr|hayr|bye|goodbye|до свидания|пока)$/.test(q))return respond(text.bye);
  if(/^(xop|hop|xo p|ok|okay|mayli|boldi|tushundim|понятно|хорошо|got it)$/.test(q))return respond(text.ack);
  if(/^(tushunmadim|tushunarsiz|не понял|не поняла|непонятно|i don t understand)$/.test(q))return respond(text.clarify);
  if(/^(yordam|yordam kerak|yordam ber|yordam bering|nima qila olasan|nima qila olasiz|помоги|помогите|нужна помощь|help|help me|what can you do)$/.test(q))return respond(text.help);
  if(/^(qalay|qalesan|qalaysan|qandaysan|yaxshimisan|yaxshimisiz|yaxshi misan|ishlar qalay|как дела|how are you)$/.test(q))return respond(text.well);
  if(/^(sen kimsan|siz kimsiz|kimsan|botmisan|ai misan|sen ai misan|кто ты|ты бот|who are you|are you ai)$/.test(q))return respond(text.identity);
  const ranked=topics.map(topic=>({topic,score:Math.max(0,...[...new Set(topic.terms.map(normalize).filter(term=>!['nima','what','top','kir','post'].includes(term)))].map(term=>q.split(' ').some((_,i,words)=>words.slice(i).join(' ').startsWith(term))?term.length:0))})).sort((a,b)=>b.score-a.score);
  const answer=ranked[0]?.score?ranked[0].topic.a[index]:text.unknown;
  return answer===text.unknown?answer:respond(answer);
 }
 return {reply};
})();
