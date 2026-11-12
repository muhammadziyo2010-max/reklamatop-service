const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const c={};vm.createContext(c);vm.runInContext(fs.readFileSync('public/help-data.js','utf8')+fs.readFileSync('public/help-replies.js','utf8')+';this.answer=(q,l="uz")=>HelpReplies.reply(q,l,SITE_HELP);',c);
for(const q of ['Assalomu alekum','Assalomu alaykum!','Assalom aleykum'])assert.match(c.answer(q),/^Va aleykum assalom!/);
assert.match(c.answer('Assalomu alekum, video qo‘shish mumkinmi?'),/^Va aleykum assalom![\s\S]*1 GB/);
assert.match(c.answer('Video qöşiş mumkinmi?'),/1 GB/);
assert.match(c.answer('Xizmatni qanday joylayman?'),/Taklifni joylash/);
assert.match(c.answer('parol qanaqa bolishi kerak'),/8 belgili/);
assert.match(c.answer('rahmat'),/^Arzimaydi/);
assert.match(c.answer('xayr'),/^Xayr/);
assert.match(c.answer('qalesan'),/^Yaxshiman/);
assert.equal(c.answer('Привет','ru'),'Привет! Чем я могу вам помочь?');
assert.match(c.answer('Hello','en'),/^Hello/);
assert.match(c.answer('sen kimsan'),/AI hali ulanmagan/);
for(const q of ['sdfghjkl','<script>alert(1)</script>','Futbol nima boladi'])assert.doesNotMatch(c.answer(q),/script|Hozir tayyor|1 GB/);
console.log('Passed: greeting variants, greeting plus site question, Uzbek typing variants, media, posting, account, courtesy, three languages and unknown input.');

for(const q of ['Bugun ob havo qanday?','Futbol nima boladi','Top 10 futbolchi','Messi kim?','2+2 nechchi','Osh qanday pishiriladi?','Assalomu alekum, ob havo qanday?'])assert.equal(c.answer(q),'Men sizga faqat sayt haqida savollaringizga javob bera olaman.');
assert.match(c.answer('Sayt nima uchun?'),/ReklamaTop/);
assert.match(c.answer('Xizmat qidirish qanday?'),/Takliflar/);
assert.equal(c.answer('What is the weather?','en'),'I can only answer your questions about this website.');

for(const q of ['salom','Salom!','SALOM','salomlar','salam','Salom, bot!'])assert.equal(c.answer(q),'Salom! Sizga nima yordam bera olaman?');
assert.equal(c.answer('Hi','en'),'Hi! How can I help you?');
assert.equal(c.answer('hello','en'),'Hello! How can I help you?');
assert.match(c.answer('salom qalesan'),/^Salom![\s\S]*Yaxshiman/);
assert.match(c.answer('salom, video qoshish mumkinmi'),/^Salom![\s\S]*1 GB/);
assert.match(c.answer('salom, rahmat'),/^Salom![\s\S]*Arzimaydi/);
for(const q of ['ok','xop','tushundim','mayli']){assert.match(c.answer(q),/^Xo‘p!/);assert.doesNotMatch(c.answer(q),/Xayr/)}
assert.match(c.answer('tushunmadim'),/Qaysi qadam/);
assert.match(c.answer('yordam kerak'),/^Albatta!/);

for(const q of ['Assalomu alekum','Assalomu alaykum!','Assalom aleykum'])assert.equal(c.answer(q),'Va aleykum assalom! Xo‘sh, sizga nima yordam bera olaman?');
