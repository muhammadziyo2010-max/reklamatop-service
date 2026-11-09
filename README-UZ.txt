ReklamaTop — umumiy reklama platformasi

ISHLAYDIGAN SAYT
https://reklamatop-service.zippypoppy41.chatgpt.site/
ChatGPT orqali kirish talab qilinmaydi.
Reklamalarni ko‘rish ochiq. Reklama joylash uchun saytning o‘zida
ism, email va parol bilan akkaunt oching. Parol kamida 8 ta belgi bo‘lsin.
Akkaunt orqali boshqa qurilmadan ham o‘z e’lonlaringizni boshqarasiz.

KOMPYUTERDA ISHGA TUSHIRISH
Node.js 22.13+ yoki 24 kerak.
ZIPni alohida papkaga chiqaring va BOSHLASH.bat faylini oching.
Yoki terminalda: node server.cjs
Brauzer: http://localhost:3000
Tayyor yig‘ma ZIPda bor, npm install shart emas.
index.html ni alohida ochish o‘rniga serverni ishga tushiring.

REKLAMA JOYLASH
Rasm tanlash orqali JPG, PNG yoki WebP surat qo‘shish mumkin (10 MB gacha).
Rasm brauzerda 1600 pikselgacha ixchamlashtiriladi va serverga saqlanadi.
Kartada rasm muqova sifatida ko‘rinadi. Rasm yo‘q bo‘lsa, videoning
birinchi kadri muqova bo‘ladi. Kartani yoki Batafsil tugmasini bosganda
video o‘z pleyeri bilan ochiladi. Video bo‘lmasa, batafsil oynada rasm chiqadi.
Videolar avtomatik ijro etilmaydi. O‘z e’loningizdagi
Rasm qo‘shish / almashtirish tugmasi orqali suratni yangilashingiz mumkin.
1. Reklama qo‘shish tugmasini bosing.
2. Sarlavha, kategoriya, shahar/viloyat, tuman, ko‘cha, uy raqami, tavsif va telefonni kiriting.
Maydonlarda namunali placeholderlar bor. Kenglik va uzunlik gradusda (°).
Ko‘cha kiritilganda xarita o‘sha ko‘chaga o‘tadi. Uy raqami topilsa,
nuqta avtomatik belgilanadi; topilmasa, aniq joyni qo‘lda belgilang.
Shahar yoki tuman kiritilganda xarita avtomatik shu hududga o‘tadi.
3. Xaritani surib, kerakli joyga bosing. + / −, sichqoncha g‘ildiragi,
   ikki marta bosish yoki telefonda ikki barmoq bilan kattalashtiring.
   Koordinatalarni qo‘lda ham kiritish mumkin.
4. Reklamani joylash tugmasini bosing.
Telefon formati: +998901234567.

E’lonlar server bazasiga yoziladi va boshqa tashrifchilarga ham ko‘rinadi.
E’lon kartasida shahar, tuman, tavsif va telefon ko‘rinadi.
Batafsil oynasida xarita va tashqi xaritaga havola bor.
Saqlangan reklamalar, kategoriyalar, qidiruv va saralash ishlaydi.
O‘zbekcha, ruscha, inglizcha, dark/light rejim saqlangan.
O‘z e’loningizni Mening reklamalarim bo‘limidan o‘chirishingiz mumkin.
Yangi reklamalarni faqat ularni joylagan akkaunt o‘chirishi mumkin.
Akkaunt qo‘shilishidan oldingi e’lonlarda eski brauzer kaliti ham ishlaydi.
Parollar PBKDF2 xesh bilan, kirish esa HttpOnly sessiya cookie orqali saqlanadi.
Email tasdiqlash va email orqali parolni tiklash bu versiyaga kiritilmagan.

MA’LUMOTLAR
Joylangan telefon va xarita nuqtasi umumiy katalogda ochiq bo‘ladi.
Internetdagi sayt Cloudflare D1 bazasidan, rasmlar esa R2 saqlashidan foydalanadi.
Lokal nusxada rasmlar data/uploads papkasida saqlanadi.
Kompyuterdagi nusxa data/ads.sqlite faylida o‘zining alohida bazasini yaratadi.
Lokal baza internetdagi baza bilan avtomatik sinxronlashmaydi.
Asosiy xarita OpenStreetMap ko‘chalar va joy nomlari bilan, sun’iy yo‘ldosh qatlami Esri: surish, sichqoncha g‘ildiragi,
+ / −, sensorli yaqinlashtirish va bosib nuqta belgilash ishlaydi.
Yaqinlashtirish silliq animatsiyali; ko‘cha va joy nomlari Ko‘chalar qatlamida va sun’iy yo‘ldosh ustidagi OpenStreetMap vektor yozuvlar qatlamida chiqadi.
CTRL haqidagi Google iframe yozuvi yo‘q. Google Maps tugmasi tanlangan
nuqtani Google Maps saytida ochadi. Asosiy xaritaga Google API yoki billing kerak emas.
Xarita va manzil qidiruvi uchun internet kerak.
Kategoriya ro‘yxati ikonali panel ko‘rinishida, klaviatura bilan ham tanlanadi.

TAHRIRLASH
public/index.html — sahifa.
public/style.css — uslublar.
public/app.js — interfeys, tarjimalar, xarita.
worker/index.js — joylash, ko‘rish va o‘chirish API.
db/schema.ts va drizzle/ — baza sxemasi va migratsiyasi.
O‘zgarishdan keyin: node scripts/build.mjs
Sxema o‘zgarsa: npm install, keyin npm run db:generate.

VIDEO
MP4 yoki WebM video qo‘shish va almashtirish mumkin.
Chegara: 1 GB = 1 000 000 000 bayt (1 000 MB).
Video reklama yaratilgach, 8 MiB bo‘laklarda yuklanadi, foiz ko‘rinadi.
Qisqa uzilishlarda uch marta qayta uriniladi. Shu oynada qayta yuklash
bosilganda saqlangan bo‘laklardan davom etadi. Sahifani yangilamang.
Yuklashni to‘xtatish mumkin. Video tugamasa ham, reklama saqlanadi;
Mening reklamalarim > Batafsil > Video qo‘shish / almashtirishdan qayta yuklang.
MP4 video uchun H.264/AAC tavsiya etiladi; ijro brauzer kodeklariga bog‘liq.
Server videoni oqim bilan, Range so‘rovlarini qo‘llab beradi.
Internetda video R2da; lokal nusxada data/uploads va data/multipart saqlanadi.

Xarita 22-darajagacha kattalashadi. 19-darajadan keyin mavjud
tasvir kattalashtiriladi; qo‘shimcha surat tafsilotlari paydo bo‘lmaydi.

Til tanlash shaffof, tashqi chiziqsiz tugma va animatsiyali menyu orqali
ishlaydi. Klaviaturada strelkalar, Home/End, Enter va Escape qo‘llanadi.
Tanlangan til keyingi kirishda ham saqlanadi.

Xarita sichqoncha va sensorli boshqaruvda silliq ishlaydi. Sun’iy yo‘ldosh tasviri Esri,
yozuvlar Shortbread/OpenStreetMap vektor ma’lumotlaridan olinadi.

Sun’iy yo‘ldosh rejimida uzoqlashtirganda mamlakat va shahar nomlari,
yaqinlashtirganda tuman, ko‘cha va joy nomlari ko‘rinadi.

XIZMATLAR PLATFORMASI
Bepul vositalar bo‘limida 6 ta kirishsiz ishlaydigan vosita bor: sayt budjeti,
dizayn budjeti, kontent rejasi, o‘quv jadvali, ta’mirlash hisobi va biznes budjeti.
Kiritilgan qiymatlardan natija hisoblanadi. Namunaviy qiymatlar bozor narxi emas.
Rejalar faqat brauzer localStorage xotirasida qoladi va hech kimga yuborilmaydi.
6 ta amaliy qo‘llanma va sana bo‘yicha aylanadigan kunlik tavsiya bor.
Mavjud e’lonlar, akkauntlar va media Takliflar bo‘limida saqlanadi.
public/services.js — vositalar, hisoblar va uch tildagi materiallar.

Asosiy sahifa endi foydalanuvchilar joylagan haqiqiy takliflarni ko‘rsatadi.
Rasm kartada, video esa taklif ochilganda ko‘rinadi.


FIKRLAR VA SHAXSIY CHAT
- Reklamani oching: “Fikrlar” bo‘limi barcha tashrifchilarga ko‘rinadi.
- Fikr yozish va shaxsiy xabar yuborish uchun sayt akkauntiga kiring.
- “E’lon egasiga yozish” orqali shaxsiy suhbat boshlanadi; suhbat “Xabarlar” bo‘limida saqlanadi.
- Suhbatni sayt ichida faqat ikki ishtirokchi ko‘radi. Xabarlar serverdagi bazada saqlanadi; bu uchidan-uchigacha shifrlangan messenjer emas.
- Ochiq suhbat har 8 soniyada yangi xabarlarni tekshiradi. O‘qilmagan xabarlar soni suhbatlar ro‘yxatida ko‘rsatiladi.
- Fikr 1 000, shaxsiy xabar 2 000 belgigacha; daqiqasiga 10 fikr yoki 30 xabar. Har kim faqat o‘z fikrini o‘chira oladi.
- Akkauntsiz joylangan eski e’lonlar bilan sayt orqali shaxsiy chat mavjud emas; telefon orqali bog‘lanish mumkin.
- Reklama o‘chirilganda unga tegishli fikrlar va suhbatlar ham o‘chiriladi.
- Chat tekshiruvi: node scripts/test-messaging.cjs (faqat xotiradagi sinov bazasi).

GLASSMORPHISM DIZAYNI
- Shaffof oynasimon panellar, fonni xiralashtirish, yumshoq soyalar va rangli fon.
- Och/to‘q rejim, kartochkalar, til menyusi, chat va dialoglarga bir xil uslub.
- Alohida dizayn fayli: public/glass.css. Funksiyalar public/app.js va public/messaging.js ichida.
- Blur qo‘llamaydigan brauzerlarda matn o‘qilishi uchun zich fon ishlatiladi.
- Harakatni kamaytirish sozlamasi yoqilsa kirish animatsiyasi o‘chadi.

ADMIN PANEL
- /admin manzilini oching va sayt akkauntiga kiring.
- Birinchi administrator bir martalik maxfiy kod bilan faollashtiriladi. Hozir kirilgan akkaunt administrator bo‘ladi. Keyingi kirishlar oddiy akkaunt paroli bilan.
- Kod, admin paroli yoki runtime sirlarini hech qachon kodga, ZIPga yoki ommaviy faylga yozmang.
- ADMIN_SETUP_TOKEN_HASH: faollashtirish kodining SHA-256 hex qiymati; server muhiti orqali o‘rnatiladi. Lokal server uchun ham shu nomdagi muhit o‘zgaruvchisi qo‘llanadi. Kodning o‘zi frontendga yuborilmaydi.
- site_admin jadvalidagi primary yozuvi kodni bir marta ishlatishga ruxsat beradi. Ro‘yxatdan birinchi o‘tgan odam avtomatik admin bo‘lmaydi.
- Statistika: e’lonlar, foydalanuvchilar, fikrlar, suhbatlar soni, 7 kunlik yangi e’lonlar, videolar hajmi va kategoriyalar.
- E’lonlar va ochiq fikrlarni qidirish/o‘chirish; foydalanuvchilar ro‘yxati va moderatsiya amallari tarixi.
- O‘chirish doim tasdiq so‘raydi. E’lon o‘chirilsa media va tegishli fikr/suhbatlar ham o‘chadi. Tarixda kim va nima o‘chirganligi saqlanadi.
- Shaxsiy chat matnlari va parol xeshlari admin paneliga berilmaydi. Admin huquqi har so‘rovda serverda tekshiriladi.
- Sinovlar: node scripts/test-admin.cjs (faqat xotiradagi sinov bazasi).

SAYT YORDAMCHISI — HAQIQIY AI
- worker/help.js faqat tekshirilgan sayt qo‘llanmasi va oxirgi 10 xabarni modelga yuboradi; akkaunt, shaxsiy chat yoki admin bazasini model o‘qimaydi.
- AI savollari IP bo‘yicha 10 daqiqada 8 ta, butun sayt bo‘yicha kuniga 200 ta bilan cheklangan (D1).
- Vercel varianti: node scripts/prepare-vercel.mjs. .vercel-staging/ ichidagi tayyor frontend va api/reklamatop-ai.js Vercelga yuklanadi.
- Vercelda OIDC yoqiladi, AI_MODEL joriy Gateway model IDsi bo‘ladi. AI_RELAY_TOKEN Vercel va Sites serverida bir xil maxfiy qiymat sifatida saqlanadi; ZIPga kiritilmaydi.
- Sites muhitida AI_RELAY_URL Verceldagi /api/reklamatop-ai manzili bo‘ladi. To‘g‘ridan-to‘g‘ri Gateway varianti uchun AI_GATEWAY_API_KEY va AI_MODEL ham qo‘llab-quvvatlanadi.
- AI Gateway akkaunt tekshiruvi yoki mavjud kredit talab qilishi mumkin. Kredit tugasa avtomatik xarid qilinmaydi; xizmat xato holatini ochiq ko‘rsatadi.
- Lokal ZIPda server sirlarisiz qo‘llanma rejimi ishlaydi. Kalitlarni hech qachon chatga, frontendga yoki ZIPga yozmang.

JORIY HOLAT (2026-11-02): Vercel real model sinoviga customer_verification_required (403) qaytardi. Ulanish tayyor; AI_ENABLED=false bilan qo‘llanma rejimi saqlanadi. Akkaunt tekshirilgach jonli sinovdan keyin AI_ENABLED=true orqali faollashtiring.

MANZIL XARITASI
- Formada kenglik/uzunlik maydonlari ko‘rinmaydi; koordinatalar faqat ichki yashirin maydonlarda saqlanadi.
- Shahar, tuman, mahalla yoki ko‘cha va uy raqami Google Maps ko‘rinishini avtomatik yangilaydi.
- Google ko‘rinishi haqiqiy Google iframe xaritasi; aniq nuqta tanlash uchun alohida OpenStreetMap xaritasi saqlangan va manbasi xaritada ko‘rsatiladi. Google iframe ichidagi bosishlar koordinatalarni formaga uzatmaydi; “Nuqta tanlash” ishlatiladi.
- Tekshiruv: node scripts/test-address-map.cjs va node scripts/test-map.cjs.

GOOGLE XARITA G‘ILDIRAGI
- Google iframe ko‘rinishiga wheel/kirish fokus yuborilmaydi, shuning uchun CTRL+aylantirish yozuvi chiqmaydi.
- Google ko‘rinishini tashqi +/− tugmalari bilan kattalashtiring. To‘liq interaktiv Google Maps havolada ochiladi. Aniq nuqta tanlash xaritasi avvalgidek ishlaydi.
