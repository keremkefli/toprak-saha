// Toprak Saha — olay kartları. Her seçenek kısa ve uzun vadeli sonuç doğurur.
// Alanlar: w ağırlık, cd bekleme (hafta), once tek sefer, must koşul oluşunca zorunlu, chain yalnızca kuyruktan
import { tt } from './i18n.js';
import { S, fx, rnd, ri, pick, chance, clamp, OVR, club, leagueOf, tier, absWeek, fmt, nice, addNews, wref, netAdd, rname, kidAge, myNat, KW, tierCfg, kx, kxAdd, klikAdj, tenAdj, newMate, bootMake, bootGoal } from './core.js';
import { LMAP, AGENTS, SHOP, NATN, BOOTS } from './data.js';

const inTR = () => LMAP[leagueOf(S.clubId)].c === 'TR';
const amat = () => inTR() && tier() >= tierCfg().amat;
const lowPro = () => inTR() && tier() >= tierCfg().low;
const form = () => S.lastR.length ? S.lastR.reduce((a, b) => a + b, 0) / S.lastR.length : 6;
const later = (id, w, ctx) => S.q.push({ id, at: absWeek() + w, ctx });
const own = id => S.assets.includes(id);
// İşler yolundayken (form, moral, profesyonellik) olumsuz olaylar karşına çıkmaz
const goodRun = () => form() >= 7 && S.mo >= 60 && S.hid.prof >= 45;
const partner = () => S.fl.evli ? tt('eşine') : tt('sevgiline');

function trialClub() {
  const o = OVR(), cur = S.rt[S.clubId], c = [];
  for (const lid in S.lg) {
    if (LMAP[lid].c !== 'TR') continue;
    for (const id of S.lg[lid].t) { const r = S.rt[id]; if (id !== S.clubId && r > cur + 2 && r >= o - 3 && r <= o + 8) c.push(id); }
  }
  return c.length ? pick(c) : null;
}

export const EVENTS = [
  // ---------- gündelik hayat ----------
  { id: 'gece', w: 3, cd: 10, if: () => S.age >= 17,
    t: tt('Gece daveti'), d: tt('Maçtan önceki gece arkadaşların arıyor: "Kısa bir çıkalım, erken döneriz."'),
    o: [
      { t: tt('Çık, eğlen'), fx: { ark: 10, en: -20, mo: 6, prof: -4 }, run: () => chance(.3) ? { fx: { hoca: -10 }, r: tt('Eğlendin ama hoca duymuş. Sabah antrenmanda yüzüne bile bakmadı.') } : { r: tt('Güzel bir geceydi. Sabah bacakların ağır.') } },
      { t: tt('Yarım saat uğra'), fx: { ark: 4, en: -8 }, r: tt('Yüzünü gösterdin, erkenden kalktın.') },
      { t: tt('Reddet, uyu'), fx: { ark: -6, prof: 3, en: 4 }, r: tt('Telefonu sessize aldın. Arkadaşların biraz bozuldu.') },
    ] },
  { id: 'sinav', w: 3, cd: 14, if: () => S.fl.okul,
    t: tt('Sınav haftası'), d: tt('Yarın matematik sınavı var. Hoca aynı akşam ek antrenman koydu.'),
    o: [
      { t: tt('Sınava çalış'), fx: { egt: 10, aile: 6, hoca: -3 }, r: tt('Antrenmana gitmedin. Annen gururlu, hoca not aldı.') },
      { t: tt('Antrenmana git'), fx: { hoca: 6, aile: -8, teknik: 0.5, egt: -4 }, r: tt('Sahada iyiydin. Sınav kâğıdı ise neredeyse boş.') },
      { t: tt('İkisini de yap'), fx: { egt: 5, hoca: 3, en: -25 }, r: tt('Gece üçe kadar ders, öncesinde antrenman. Ayakta zor duruyorsun.') },
    ] },
  { id: 'okulbirak', w: 2, once: true, if: () => S.fl.okul && S.age >= 17,
    t: tt('Okul mu, futbol mu?'), d: tt('Hoca seni kenara çekti: "Bu işi ciddi yapacaksan okul seni yavaşlatıyor. Karar ver."'),
    o: [
      { t: tt('Okulu bırak'), fx: { hoca: 10, aile: -20, prof: 5 }, run: () => { delete S.fl.okul; S.fl.okulBirakti = 1; }, r: tt('Okulu bıraktın. Evde günlerce konuşulmadı. Artık tek yolun futbol.') },
      { t: tt('Açık liseye geç'), fx: { hoca: 4, aile: -5, egt: 5 }, r: tt('Açık liseye geçtin. İkisini de götüreceksin, ama kolay olmayacak.') },
      { t: tt('Okula devam'), fx: { hoca: -5, aile: 6 }, r: tt('Okula devam ediyorsun. Hoca omuz silkti.') },
    ] },
  { id: 'is', w: 2, once: true, if: () => amat() && S.age >= 18 && !S.job,
    t: tt('Fabrikada kadro'), d: tt('Dayın fabrikada sana kadrolu iş ayarlamış. "Futbol karın doyurmaz" diyor.'),
    o: [
      { t: tt('İşe gir'), fx: { aile: 8 }, run: () => { S.job = 9000; }, r: tt('Haftada ₺9.000 düzenli gelirin var. Vardiyalar enerjini yiyecek (haftalık enerji −8).') },
      { t: tt('Reddet'), fx: { aile: -10, prof: 5 }, r: tt('"Ben futbolcu olacağım" dedin. Dayın sofradan kalktı.') },
    ] },
  { id: 'aile_para', w: 3, cd: 16, if: () => S.fl.dar && S.money >= 1500,
    t: tt('Evde sıkıntı'), d: () => tt`Baban arıyor, sesi kısık: kira gecikmiş. ${fmt(nice(Math.max(1500, wref() * 2)))} lazım.`,
    o: [
      { t: tt('Parayı gönder'), if: () => S.money >= nice(Math.max(1500, wref() * 2)), run: () => ({ fx: { para: -nice(Math.max(1500, wref() * 2)), aile: 15, mo: 3 } }), r: tt('Parayı gönderdin. Baban "hakkını helal et" dedi.') },
      { t: tt('Ek vardiya çıkar'), fx: { en: -18, aile: 8, para: 1000 }, r: tt('Gece vardiyasına girdin, kazandığını eve yolladın.') },
      { t: tt('Şu an veremem'), fx: { aile: -12, mo: -4 }, r: tt('Telefon sessizce kapandı.') },
    ] },
  { id: 'anne', w: 1.5, cd: 40, if: () => S.rel.aile > 20,
    t: tt('Hastaneden telefon'), d: tt('Annen hastaneye kaldırılmış. Ciddi değil diyorlar ama bu hafta maç var.'),
    o: [
      { t: tt('Hemen git'), fx: { aile: 20, mo: 4 }, run: () => { S.fl.skip = 1; return S.rel.hoca > 55 ? { r: tt('Hoca "ailen önce gelir" dedi. Bu haftaki maçı kaçırdın.') } : { fx: { hoca: -6 }, r: tt('Hoca izin verdi ama yüzü asıktı. Bu haftaki maçı kaçırdın.') }; } },
      { t: tt('Maçtan sonra git'), fx: { aile: -10, mo: -8 }, r: tt('Maça çıkacaksın. Aklın hastanede.') },
    ] },
  { id: 'asker', must: true, cd: 76, if: () => !KW && S.age >= 20 && !S.fl.asker && inTR(),
    t: tt('Askerlik çağrısı'), d: tt('Askerlik şubesinden kâğıt geldi. Bir karar vermen gerekiyor.'),
    o: [
      { t: tt('Tecil ettir'), if: () => !S.fl.tecil && (S.con.wage >= 8000 || S.fl.diploma), run: () => { S.fl.tecil = 1; }, r: tt('Tecil işlemi tamam. Bu konu iki yıl sonra yine önüne gelecek.') },
      { t: tt('Bedelli öde (₺280.000)'), if: () => S.money >= 280000, fx: { para: -280000 }, run: () => { S.fl.asker = 1; }, r: tt('Bedelini ödedin, konu kapandı.') },
      { t: tt('Git, yap gel'), fx: { guc: 2, zihin: 3 }, run: () => { S.fl.asker = 1; S.ban = 6; S.banR = tt('Askerde'); }, r: tt('Altı hafta sahalardan uzaksın. Döndüğünde daha sert biri olacaksın.') },
    ] },
  { id: 'universite', w: 2, once: true, if: () => S.age >= 18 && S.age <= 20 && S.egt >= 55 && !S.fl.okul,
    t: tt('Üniversite sonucu'), d: tt('Spor bilimleri bölümünü kazandın. Açıköğretimle de okuyabilirsin.'),
    o: [
      { t: tt('Kaydol'), fx: { aile: 10, egt: 15 }, run: () => { S.fl.uni = 1; }, r: tt('Kaydoldun. Futboldan sonra antrenörlük kapısı aralandı.') },
      { t: tt('Futbola odaklan'), fx: { prof: 4, aile: -5 }, r: tt('Kaydı yaptırmadın.') },
    ] },

  // ---------- ilişkiler ----------
  { id: 'tanisma', w: 3, cd: 20, if: () => S.rel.par == null && S.age >= 17,
    t: tt('Bir tanışma'), d: tt('Arkadaş ortamında biriyle göz göze geldin. Sohbet su gibi aktı.'),
    o: [
      { t: tt('Numarasını iste'), fx: { mo: 8 }, run: () => { S.rel.par = 40; }, r: tt('Artık hayatında biri var. İlgi isteyecek, ama moralin yerinde.') },
      { t: tt('Futbola odaklan'), fx: { prof: 3 }, r: tt('Gülümsedin, yoluna devam ettin.') },
    ] },
  { id: 'ayrilik', must: true, cd: 6, if: () => S.rel.par != null && S.rel.par < 12,
    t: tt('Konuşmamız lazım'), d: () => tt`Haftalardır ${partner()} vakit ayırmıyorsun. Karşına oturdu: "Böyle devam edemeyiz."`,
    o: [
      { t: tt('Söz ver, toparla'), fx: { par: 22, en: -8 }, r: tt('Söz verdin. Bu kez tutman gerekecek.') },
      { t: tt('Yolları ayır'), fx: { mo: -15 }, run: () => { S.rel.par = null; if (S.fl.evli) { delete S.fl.evli; const c = Math.round(Math.max(0, S.money) * 0.3); return { fx: { para: -c, aile: -8 }, r: tt`Boşandınız. Mal paylaşımı ${fmt(c)} tuttu.` }; } return { r: tt('Ayrıldınız. Ev sessiz.') }; } },
    ] },
  { id: 'evlilik', w: 3, once: true, if: () => S.rel.par != null && S.rel.par > 78 && S.age >= 23 && !S.fl.evli,
    t: tt('Büyük soru'), d: tt('İlişkiniz çok iyi gidiyor. Evlilik konusu açıldı.'),
    o: [
      { t: tt('Evlenelim'), run: () => { S.fl.evli = 1; const c = nice(Math.max(20000, wref() * 6)); return { fx: { para: -c, mo: 15, aile: 12 }, r: tt`Düğün ${fmt(c)} tuttu. Hayatında artık bir düzen var.` }; } },
      { t: tt('Henüz erken'), fx: { par: -18 }, r: tt('Erteledin. Kırıldı ama anlayış gösterdi.') },
    ] },
  { id: 'cocuk', w: 2, once: true, if: () => S.fl.evli && S.age >= 25,
    t: tt('Müjde'), d: () => (KW ? tt('Bir çocuğunuz oluyor. Sahalardan bir süre uzak kalacaksın; sözleşmen doğum izninde korunuyor.') : tt('Bir çocuğunuz oluyor.')),
    o: [{ t: tt('Hayatımın en güzel haberi'), fx: { mo: 20, aile: 10, en: -10 }, run: () => { S.fl.cocuk = 1; if (KW) { S.ban = Math.max(S.ban, 20); S.banR = tt('Doğum izninde'); } S.kid = { n: rname('TR').split(' ')[0] + ' ' + S.name.split(' ').slice(-1)[0], born: S.season, tal: 0 }; return { r: tt`Adını ${S.kid.n.split(' ')[0]} koydunuz. Uykusuz geceler başlıyor. Emekli olduğunda soyadın sahada devam edebilir.` }; } }] },
  { id: 'kid_top', w: 2.5, cd: 22, if: () => !!S.kid && kidAge() >= 3, prep: () => ({ n: S.kid.n.split(' ')[0] }),
    t: tt('Bahçede bir top'), d: c => (KW ? tt`${c.n} elinde topla kapıda bekliyor: "Anne, şut çekelim mi?" İdmandan yeni döndün.` : tt`${c.n} elinde topla kapıda bekliyor: "Baba, şut çekelim mi?" İdmandan yeni döndün.`),
    o: [
      { t: tt('Hadi çıkalım'), fx: { en: -6, aile: 7, mo: 4 }, run: () => { S.kid.tal = clamp(S.kid.tal + 2, 0, 20); }, r: tt('Bir saat top oynadınız. Sol ayağı fena değil.') },
      { t: tt('Yarın, söz'), fx: { aile: -3 }, r: tt('Topu köşeye bıraktı. Yarın yine deplasman var.') },
    ] },
  { id: 'kid_alt', w: 3, once: true, if: () => !!S.kid && kidAge() >= 8, prep: () => ({ n: S.kid.n.split(' ')[0] }),
    t: tt('Seçmeler'), d: c => tt`${c.n} futbol okuluna yazılmak istiyor. Nereye gidecek?`,
    o: [
      { t: tt('Kulübümün altyapısı'), fx: { aile: 4, taraf: 3 }, run: () => { S.kid.tal = clamp(S.kid.tal + 4, 0, 20); S.kid.ak = S.clubId; return { r: tt`${club(S.clubId).n} altyapısına yazıldı. Formayı giyince aynada uzun uzun baktı.` }; } },
      { t: tt('Mahalle kulübü'), fx: { aile: 6 }, run: () => { S.kid.tal = clamp(S.kid.tal + 2, 0, 20); }, r: () => (KW ? tt('Toprak sahada başlasın, annen gibi.') : tt('Toprak sahada başlasın, baban gibi.')) },
      { t: tt('Önce okul'), fx: { aile: 3 }, run: () => { S.kid.tal = clamp(S.kid.tal - 1, 0, 20); }, r: tt('Futbol bekler. Karnesi gelsin önce.') },
    ] },
  { id: 'kid_mac', w: 2, cd: 30, if: () => !!S.kid && kidAge() >= 10, prep: () => ({ n: S.kid.n.split(' ')[0] }),
    t: () => (KW ? tt('Tribünde bir anne') : tt('Tribünde bir baba')), d: c => tt`${c.n} hafta sonu ilk resmî maçına çıkıyor. Senin de idmanın var.`,
    o: [
      { t: tt('İzin al, maça git'), fx: { hoca: -2, aile: 9, mo: 5 }, run: () => { S.kid.tal = clamp(S.kid.tal + 2, 0, 20); }, r: tt('Gol atınca tribüne, sana baktı. O bakışı unutmazsın.') },
      { t: tt('Videosunu izlerim'), fx: { aile: -4, prof: 2 }, r: tt('Akşam telefondan izledin. Sevinirken kamerayı aramış.') },
    ] },
  { id: 'menajer_savas', w: 2, cd: 40, if: () => !!S.agent && S.rep >= 30, prep: () => ({ n: pick(AGENTS.filter(a => a.n !== S.agent.n && a.n !== 'Amcan')).n, b: nice(wref() * 10) }),
    t: tt('Menajer savaşı'), d: c => tt`${c.n} gizlice aradı: "Menajerin seni ucuza satıyor. Bana gel, imza için ${fmt(c.b)} peşin vereyim."`,
    o: [
      { t: tt('Teklifi kabul et'), run: c => { const a = AGENTS.find(x => x.n === c.n); S.agent = { ...a }; return { fx: { para: c.b - nice(wref() * 3), sad: -6 } }; }, r: tt('İmzayı attın. Eski menajerin tazminat davası açtı; bir kısmını ödedin, adın "vefasız"a çıktı.') },
      { t: tt('Menajerime sadığım'), fx: { sad: 6 }, run: () => { S.agent.pw = Math.min(1.4, S.agent.pw + .1); }, r: tt('Durumu menajerine anlattın. Mahcup oldu; senin için daha çok kapı çalacak.') },
      { t: tt('İkisini yarıştır'), run: () => (chance(.5) ? (S.agent.cut = Math.max(.02, +(S.agent.cut - .02).toFixed(2)), { r: tt('Menajerin komisyonunu iki puan düşürdü. Sen kazandın.') }) : { fx: { sad: -3 }, r: tt('İkisi de oyunu anladı. Menajerinle aran soğudu.') }) },
    ] },
  { id: 'rv_duel', w: 2.5, cd: 14, if: () => !!S.rv && S.rv.inj <= 0 && S.inj <= 0,
    prep: () => ({ n: S.rv.n }),
    t: tt('Forma kavgası'), d: c => tt`İdmanda çift kale maç. Karşı takımda mevki rakibin ${c.n} var; hoca ikinizi de izliyor.`,
    o: [
      { t: tt('Her topa sert gir'), run: () => (chance(clamp(.5 + (OVR() - S.rv.ovr) * .05, .15, .9)) ? { fx: { hoca: 5, takim: -1 }, r: tt('Onu ezdin geçtin. Hoca defterine bir şey yazdı.') } : chance(.15) ? { fx: { hoca: -2, inj: 1 }, r: tt('Fazla zorladın; arka adalen çekti.') } : { fx: { hoca: -2 }, r: tt('Bugün o daha iyiydi. Kabullenmek zor.') }) },
      { t: tt('Kendi oyununu oyna'), fx: { hoca: 2, prof: 2 }, r: tt('Kimseyle yarışmadın, işini yaptın. Hoca başını salladı.') },
      { t: tt('Ona yardım et'), fx: { takim: 5, prof: 2 }, run: () => { S.rv.ovr += .6; }, r: tt('İdman sonrası birlikte çalıştınız. Rakibin gelişti; soyunma odası seni daha çok sevdi.') },
    ] },


  // ---------- kulüp ve kariyer ----------
  { id: 'hoca', must: true, cd: 8, if: () => S.bench >= 4,
    t: tt('Kadro dışı'), d: tt('Haftalardır forma yüzü görmüyorsun. Bir şey yapman lazım.'),
    o: [
      { t: tt('Hocayla saygıyla konuş'), run: () => { S.bench = 0; return S.hid.prof >= 50 ? { fx: { hoca: 8 }, r: tt('Hoca çalışmanı gördüğünü söyledi. "Şansın gelecek."') } : { fx: { hoca: 1 }, r: tt('Hoca dinledi ama ikna olmadı: "Önce antrenmanda göster."') }; } },
      { t: tt('Basına konuş'), fx: { hoca: -15, ego: 6, taraf: 3 }, run: () => { S.bench = 0; }, r: tt('Yerel gazetede manşetsin. Hoca seni soyunma odasında azarladı.') },
      { t: tt('Sus, daha çok çalış'), fx: { prof: 5, hoca: 4, en: -6 }, run: () => { S.bench = 0; }, r: tt('Antrenmandan sonra tek başına kaldın. Hoca uzaktan izledi.') },
    ] },
  { id: 'yenileme', w: 4, cd: 30, if: () => !S.loan && S.con.until === S.season && S.rel.hoca >= 62 && S.week >= 8 && S.week <= 34,
    t: tt('Yeni sözleşme masada'), d: () => tt`Kulüp sözleşmeni iki sezon uzatmak istiyor: haftalık ${fmt(nice(Math.max(S.con.wage * 1.25, 250)))}.`,
    o: [
      { t: tt('İmzala'), fx: { sad: 8, taraf: 4 }, run: () => { S.con.wage = nice(Math.max(S.con.wage * 1.25, 250)); S.con.until += 2; }, r: tt('İmzayı attın. İki sezon daha buradasın.') },
      { t: tt('Zam iste'), run: () => { if (chance(.5)) { S.con.wage = nice(Math.max(S.con.wage * 1.5, 400)); S.con.until += 2; return { r: tt('Başkan homurdandı ama imzaladı: %50 zam.') }; } return { fx: { hoca: -5 }, r: tt('Yönetim teklifi geri çekti. Sezon sonunda serbest kalabilirsin.') }; } },
      { t: tt('Sözleşmem bitsin'), fx: { sad: -6, taraf: -4 }, r: tt('İmzalamadın. Sezon sonunda kaderini kendin çizeceksin.') },
    ] },
  { id: 'kaptan', w: 3, once: true, if: () => S.rel.hoca > 80 && S.rel.takim > 68 && S.season - S.since >= 1 && !S.fl.kaptan,
    t: tt('Kaptanlık'), d: tt('Hoca pazubendi sana uzattı: "Bu takımın lideri sensin."'),
    o: [
      { t: tt('Kabul et'), fx: { takim: 10, zihin: 2, taraf: 6 }, run: () => { S.fl.kaptan = 1; }, r: tt('Artık kaptansın. Forma şansın arttı, sorumluluğun da.') },
      { t: tt('Hazır değilim'), fx: { hoca: -4 }, r: tt('Pazubent başkasına gitti.') },
    ] },
  { id: 'kavga', neg: 1, w: 2.5, cd: 18, if: () => S.rel.takim < 75,
    t: tt('Antrenmanda gerginlik'), d: tt('Kıdemli bir oyuncu sana kasten sert girdi, sonra da sırıttı.'),
    o: [
      { t: tt('Karşılık ver'), fx: { takim: -10, ego: 5 }, run: () => { later('kavga2', 1); return chance(.35) ? { fx: { hoca: -8 }, r: tt('İtiş kakış çıktı. Hoca ikinizi de antrenmandan attı.') } : { r: tt('Üstüne yürüdün, araya girdiler. Soyunma odası buz gibi.') }; } },
      { t: tt('Alttan al'), fx: { takim: 3, mo: -4 }, r: tt('Bir şey demeden kalktın. Bazıları bunu olgunluk saydı.') },
      { t: tt('Hocaya söyle'), fx: { takim: -6, hoca: 2 }, r: tt('Hoca uyardı. Takımda "ispiyoncu" diye fısıldaşıyorlar.') },
    ] },
  { id: 'usta', w: 2.5, cd: 24, if: () => S.age <= 20,
    t: tt('Ustadan teklif'), d: tt('Takımın en tecrübelisi antrenman sonrası yanına geldi: "Kal, sana bir şeyler göstereyim."'),
    o: [
      { t: tt('Kal ve çalış'), fx: { en: -10, takim: 5, zihin: 1, teknik: 1 }, r: tt('Bir saat boyunca duruşunu, bakışını düzeltti. Kitaplarda yazmayan şeyler.') },
      { t: tt('Yorgunum'), fx: { takim: -3 }, r: tt('Başını salladı, çantasını aldı.') },
    ] },
  { id: 'maas', neg: 1, w: 2.5, cd: 26, if: () => lowPro() && S.con.wage >= 500,
    t: tt('Maaşlar yatmadı'), d: tt('Kulüp iki aydır ödeme yapmıyor. Soyunma odası kaynıyor.'),
    o: [
      { t: tt('Sabret'), fx: { sad: 8, mo: -5 }, run: () => ({ fx: { para: -S.con.wage * 3 }, r: tt('Bekledin. Üç haftalık alacağın hâlâ içeride.') }) },
      { t: tt('Arkadaşlarla idmana çıkma'), fx: { hoca: -8, takim: 6 }, run: () => chance(.5) ? { r: tt('Boykot işe yaradı, başkan parayı buldu.') } : { fx: { para: -S.con.wage * 2 }, r: tt('Yönetim oralı olmadı. İki haftalık alacağın yandı.') } },
      { t: tt('Federasyona şikâyet et'), fx: { hoca: -15, sad: -10 }, r: tt('Paranı aldın. Yönetim sana cephe aldı.') },
    ] },
  { id: 'krampon', neg: 1, w: 2.5, cd: 30, if: () => amat() && tier() >= tierCfg().loc + 1 - (KW ? 1 : 0),
    t: tt('Krampon yırtıldı'), d: tt('Tek kramponun tabanı açıldı. Kulübün malzeme dolabı boş.'),
    o: [
      { t: tt('Yenisini al (₺2.500)'), if: () => S.money >= 2500, fx: { para: -2500, mo: 3 }, r: tt('Yeni krampon ayağına oturdu.') },
      { t: tt('Yapıştır, idare et'), fx: { mo: -3, hiz: -0.5 }, r: tt('Japon yapıştırıcısıyla hallettin. Her adımda aklın ayağında.') },
      { t: tt('Ailenden iste'), fx: { aile: -6 }, r: tt('Baban cebindeki son parayı verdi.') },
    ] },
  { id: 'scout', w: 3, cd: 12, if: () => lowPro() && form() >= 6.7 && !S.fl.scout && !!trialClub(),
    t: tt('Tribünde biri var'), d: tt('Bu hafta maçı izlemeye bir üst ligden scout geleceği konuşuluyor.'),
    o: [
      { t: tt('Kendini göster'), fx: { mo: 3 }, run: () => { S.fl.scout = 1; }, r: tt('Bir sonraki maçın notu 7,0 ve üstü olursa kapı açılabilir.') },
      { t: tt('Aklına takma'), fx: { zihin: 0.5 }, run: () => { S.fl.scout = 1; }, r: tt('Kendi oyununu oynayacaksın. Yine de biri izliyor olacak.') },
    ] },
  { id: 'deneme', chain: true, if: () => !!trialClub(), prep: () => ({ club: trialClub() }),
    t: tt('Deneme antrenmanı'), d: c => tt`${club(c.club).n} scoutu seni beğendi. Kulüp seni deneme antrenmanına çağırıyor: üç çalışmadan en az ikisinde başarılı olursan sözleşme masada.`,
    o: [
      { t: tt('Denemeye git'), fx: { en: -8 }, sp: 'deneme', r: '' },
      { t: tt('Kulübüme sadığım'), fx: { sad: 8, hoca: 4, takim: 3 }, r: tt('Teşekkür edip reddettin. Kulübünde bunu duydular.') },
    ] },
  { id: 'menajer', w: 3, cd: 30, if: () => S.rep >= 10 && !S.agent,
    t: tt('Menajer arayışı'), d: tt('Adın duyulmaya başladı. Üç menajer seninle çalışmak istiyor. Komisyon maaşından kesilir.'),
    o: [
      ...AGENTS.map((a, i) => ({ t: tt`${a.n} (%${Math.round(a.cut * 100)})`, s: a.d, run: () => { S.agent = { ...AGENTS[i] }; }, r: tt`${a.n} artık menajerin. Teklifler ve ücretler buna göre şekillenecek.` })),
      { t: tt('Şimdilik menajersiz'), r: tt('Kendi işini kendin göreceksin.') },
    ] },
  { id: 'basin', w: 2.5, cd: 16, if: () => S.con.wage >= 8000,
    t: tt('Röportaj'), d: tt('Muhabir mikrofonu uzattı: "Bu sezonki hedefin ne?"'),
    o: [
      { t: tt('Takım ne isterse'), fx: { takim: 4, taraf: 2 }, r: tt('Mütevazı cevabın soyunma odasında beğenildi.') },
      { t: kxAdd(tt('Gol krallığı ve şampiyonluk'), tt('Gol kraliçeliği ve şampiyonluk')), fx: { taraf: 6, ego: 4, fol: 400 }, r: tt('Manşet oldun. Şimdi bunu sahada göstermen gerek.') },
      { t: tt('Burası bana küçük geliyor'), fx: { taraf: -10, sad: -10, ego: 8, fol: 1500, hoca: -6 }, r: tt('Sosyal medya yıkıldı. Kulüpte kimse yüzüne bakmıyor.') },
    ] },
  { id: 'rakip', w: 2, cd: 30, if: () => !!S.rival,
    t: tt('Eski rakip'), d: () => tt`${S.rival.n} (${S.rival.c}) bir röportajda senin için "onunla aynı kefeye konmam" demiş.`,
    o: [
      { t: tt('Cevabı sahada ver'), fx: { zihin: 1, prof: 3, mo: 4 }, r: tt('Ekran görüntüsünü dolabının kapağına astın.') },
      { t: tt('Sosyal medyadan cevap ver'), fx: { ego: 5, fol: 800 }, run: () => ({ fx: { fol: Math.round(S.fol * 0.08) }, r: tt('Atışma gündem oldu. Takipçin arttı, hoca hoşlanmadı.') }) },
      { t: tt('Umursama'), fx: { mo: -2 }, r: tt('Geçtin gittin. İçinde bir yer hâlâ sızlıyor.') },
    ] },
  { id: 'dilbar', must: true, cd: 20, if: () => !!S.fl.dilBar,
    t: tt('Dil bariyeri'), d: tt('Yeni ülkende taktik toplantılarını yarım anlıyorsun. Hoca sabırsız.'),
    o: [
      { t: tt('Özel öğretmen tut'), if: () => S.money >= 40000, fx: { para: -40000, dil: 35, hoca: 4 }, run: () => { delete S.fl.dilBar; }, r: tt('Her akşam ders. Birkaç haftada soyunma odası şakalarını anlamaya başladın.') },
      { t: tt('Tercümanla idare et'), fx: { hoca: -10, takim: -6 }, run: () => { delete S.fl.dilBar; }, r: tt('İdare ediyorsun ama takımla aranda cam var.') },
    ] },
  { id: 'milli_tercih', must: true, once: true, if: () => S.fl.gurbet && OVR() >= 58,
    prep: () => ({ n: NATN[S.gur || 'DE'] }),
    t: tt('İki forma'), d: c => tt`Aynı hafta iki telefon: ${c.n} alt yaş milli takımı da Türkiye de seni istiyor. Seçim kalıcı.`,
    o: [
      { t: 'Türkiye', fx: { taraf: 8, aile: 10 }, run: () => { S.nat = 'TR'; }, r: tt('Ay-yıldızlı formayı seçtin. Baban telefonda ağladı.') },
      { t: tt('Doğduğum ülke'), fx: { rep: 3, aile: -10 }, run: () => { S.nat = S.gur || 'DE'; return { r: tt`${myNat()} formasını seçtin. Memlekette karışık tepkiler var.` }; } },
    ] },

  // ---------- şöhret ve para ----------
  { id: 'sponsor', w: 3, cd: 20, if: () => S.fol >= 2000 && S.spon.length < 2,
    prep: () => { const f = S.fol; return f < 50000 ? { n: tt('Yerel spor mağazası'), wk: nice(1200 + f * 0.05) } : f < 1e6 ? { n: tt('Ulusal spor markası'), wk: nice(f * 0.25) } : { n: tt('Küresel krampon markası'), wk: nice(Math.min(6e6, f * 0.4)) }; },
    t: tt('Sponsorluk teklifi'), d: c => tt`${c.n} seninle bir sezonluk anlaşma istiyor: haftada ${fmt(c.wk)}.`,
    o: [
      { t: tt('İmzala'), run: c => { S.spon.push({ n: c.n, wk: c.wk, until: absWeek() + 38 }); }, r: tt('İmzalar atıldı.') },
      { t: tt('Daha fazlasını iste'), run: c => { if (chance(.5)) { const w = nice(c.wk * 1.3); S.spon.push({ n: c.n, wk: w, until: absWeek() + 38 }); return { r: tt`Kabul ettiler: haftada ${fmt(w)}.` }; } return { r: tt('Marka başka bir oyuncuyla anlaştı.') }; } },
      { t: tt('Reddet'), r: tt('Teklifi geri çevirdin.') },
    ] },
  { id: 'viral', chain: true, cd: 20, t: tt('Golün viral oldu'), d: tt('Son maçtaki performansın her yerde dönüyor.'),
    o: [{ t: tt('Keyfini çıkar'), run: () => ({ fx: { fol: Math.round(Math.min(2e6, S.fol * 0.25 + 500)), mo: 6, ego: 3 } }), r: tt('Telefonun susmuyor.') }] },
  { id: 'linc', neg: 1, w: 2, cd: 24, if: () => !(S.fl.kalkan > absWeek()) && S.fol >= 5000 && (form() < 6.2 || S.hid.ego > 60),
    t: tt('Linç'), d: tt('Eski bir paylaşımın bağlamından koparılıp gündem oldu. Yorumlar acımasız.'),
    o: [
      { t: tt('Özür dile'), fx: { taraf: 5, mo: -4 }, run: () => ({ fx: { fol: -Math.round(S.fol * 0.03) } }), r: tt('Açıklama yaptın, ortalık yatıştı.') },
      { t: tt('Sert cevap ver'), fx: { taraf: -8, ego: 5, mo: -2 }, run: () => ({ fx: { fol: Math.round(S.fol * 0.06) } }), r: tt('Ateşe benzin döktün. Takipçin arttı, saygınlığın azaldı.') },
      { t: tt('Sessiz kal'), fx: { mo: -6 }, r: tt('Üç gün sonra herkes başka konuya geçti.') },
    ] },
  { id: 'bahis', neg: 1, w: 1.5, once: true, if: () => S.fol >= 50000,
    t: tt('Kolay para'), d: () => tt`Yasa dışı bir bahis sitesi tek hikâye paylaşımı için ${fmt(nice(wref() * 8))} öneriyor.`,
    o: [
      { t: tt('Paylaş, parayı al'), run: () => { later('bahis_sonuc', ri(6, 14)); return { fx: { para: nice(wref() * 8), prof: -8 } }; }, r: tt('Para hesabında. Kimse bir şey demedi. Şimdilik.') },
      { t: tt('Reddet'), fx: { prof: 5 }, r: tt('Mesajı sildin.') },
    ] },
  { id: 'bahis_sonuc', chain: true, t: tt('Soruşturma'), d: tt('Federasyon, yasa dışı bahis reklamı nedeniyle hakkında dosya açtı.'),
    o: [{ t: tt('Savunmanı ver'), run: () => { S.ban = 5; S.banR = tt('Disiplin cezası'); return { fx: { para: -nice(wref() * 10), rep: -8, taraf: -10, hoca: -8 } }; }, r: tt('Beş hafta men ve para cezası aldın. Sponsorlar tedirgin.') }] },
  { id: 'sike', neg: 1, w: 1.2, cd: 60, if: () => lowPro() && S.week >= 28,
    t: tt('Otoparkta bir adam'), d: () => tt`Rakip kulübe yakın biri kolunu omzuna attı: "Bu hafta biraz ağırdan al. ${fmt(nice(Math.max(15000, wref() * 12)))} nakit."`,
    o: [
      { t: tt('Kabul et'), run: () => { S.fl.sike = (S.fl.sike || 0) + 1; later('sike_sonuc', ri(10, 30)); return { fx: { para: nice(Math.max(15000, wref() * 12)), prof: -20, sad: -10 } }; }, r: tt('Zarfı aldın. Maçta "kötü gününde" görüneceksin. Bu sır seninle yaşayacak.') },
      { t: tt('Reddet'), fx: { prof: 8 }, r: tt('Kolunu ittin, yürüdün.') },
      { t: tt('Reddet ve bildir'), fx: { prof: 10, rep: 3, mo: -3 }, r: tt('Federasyona bildirdin. Bazıları seni kahraman, bazıları muhbir sayıyor.') },
    ] },
  { id: 'sike_sonuc', chain: true, t: tt('Şike soruşturması'), d: tt('Bir telefon dinlemesi ortaya çıktı. Adın dosyada.'),
    o: [{ t: tt('İfadeye git'), run: () => {
      if (chance(.45)) return { r: tt('Delil yetersizliğinden takipsizlik çıktı. Ucuz kurtuldun.') };
      if ((S.fl.sike || 0) >= 2) { S.over = tt('Şike nedeniyle ömür boyu men cezası aldın.'); return { r: tt('İkinci kez yakalandın. Ömür boyu men.') }; }
      S.ban = 20; S.banR = tt('Şike cezası');
      return { fx: { rep: -25, taraf: -30, hoca: -25, aile: -15, mo: -20 }, r: tt('Yirmi hafta men cezası aldın. Adın bu lekeyle anılacak.') };
    } }] },
  { id: 'doping', neg: 1, w: 1.2, once: true, if: () => S.age >= 29 || S.inj >= 4,
    t: tt('Mucize takviye'), d: tt('Tanımadığın bir "kondisyoner" yanına geldi: "Testte çıkmaz. Üç ayda beş yaş gençleşirsin."'),
    o: [
      { t: tt('Kullan'), fx: { hiz: 3, guc: 3, prof: -15 }, run: () => { later('doping_sonuc', ri(8, 24)); }, r: tt('Bacaklarında yıllardır hissetmediğin bir güç var.') },
      { t: tt('Uzak dur'), fx: { prof: 5 }, r: tt('Kartını çöpe attın.') },
    ] },
  { id: 'doping_sonuc', chain: true, t: tt('Doping kontrolü'), d: tt('Maç sonrası rastgele kontrole seçildin.'),
    o: [{ t: tt('Numuneni ver'), run: () => { if (chance(.6)) return { r: tt('Sonuç temiz çıktı. Derin bir nefes aldın.') }; S.ban = 30; S.banR = tt('Doping cezası'); return { fx: { rep: -30, taraf: -25, hiz: -3, guc: -3, mo: -20 }, r: tt('Test pozitif. Otuz hafta men.') }; } }] },
  { id: 'yatirim', w: 2, cd: 40, if: () => S.money >= 300000,
    prep: () => ({ a: nice(S.money * 0.25) }),
    t: tt('Ortaklık teklifi'), d: c => tt`Çocukluk arkadaşın kafe açıyor, senden ${fmt(c.a)} ortaklık istiyor: "Bir yılda ikiye katlarız."`,
    o: [
      { t: tt('Yatır'), run: c => { later('yatirim_sonuc', 20, { a: c.a }); return { fx: { para: -c.a, ark: 8 } }; }, r: tt('Parayı verdin. Tabelada adın bile var.') },
      { t: tt('Yarısını yatır'), run: c => { later('yatirim_sonuc', 20, { a: Math.round(c.a / 2) }); return { fx: { para: -Math.round(c.a / 2), ark: 3 } }; }, r: tt('Temkinli girdin.') },
      { t: tt('Arkadaşla iş olmaz'), fx: { ark: -8 }, r: tt('Bozuldu ama belli etmedi.') },
    ] },
  { id: 'yatirim_sonuc', chain: true, t: tt('Kafenin hesabı'), d: tt('Yatırım yaptığın kafenin ilk bilançosu geldi.'),
    o: [{ t: tt('Hesaba bak'), run: c => chance(.5) ? { fx: { para: Math.round(c.a * 2.2), ark: 6 }, r: tt('İşler tıkırında. Payını kârıyla aldın.') } : { fx: { ark: -15, mo: -8 }, r: tt('Kafe battı. Para da gitti, arkadaşlık da yara aldı.') } }] },
  { id: 'poker', neg: 1, w: 2, cd: 20, if: () => S.con.wage >= 8000,
    t: tt('Poker gecesi'), d: tt('Takım arkadaşları kamp otelinde masa kurdu. "Gel, iki el at."'),
    o: [
      { t: tt('Otur'), fx: { takim: 5, prof: -4, en: -6 }, run: () => { const v = Math.round(rnd(-2.5, 1.8) * wref()); return { fx: { para: v }, r: v >= 0 ? tt('Şansın yaver gitti.') : tt('Kaybettin. Sabaha karşı odana döndün.') }; } },
      { t: tt('İyi geceler'), fx: { takim: -2, prof: 2 }, r: tt('Erkenden yattın.') },
    ] },
  { id: 'bagis', w: 2, cd: 50, if: () => S.con.wage >= 50000,
    t: tt('İlk kulübün'), d: () => tt`Top oynamaya başladığın mahalle kulübü malzeme alamıyor. ${fmt(nice(wref() * 2))} yeter.`,
    o: [
      { t: tt('Gönder'), if: () => S.money >= nice(wref() * 2), run: () => ({ fx: { para: -nice(wref() * 2), rep: 2, taraf: 4, aile: 5, mo: 5 } }), r: tt('Çocuklar yeni formalarla fotoğraf yolladı.') },
      { t: tt('Şimdi olmaz'), fx: { mo: -2 }, r: tt('Mesajı cevapsız bıraktın.') },
    ] },
  { id: 'hayran', w: 2, cd: 20, if: () => S.rel.taraf >= 35,
    t: tt('Tel örgünün ardında'), d: tt('Maç çıkışı küçük bir çocuk formanı istiyor. Kulüp yenisini maaşından kesiyor.'),
    o: [
      { t: tt('Formanı ver'), fx: { taraf: 6, mo: 4, para: -800 }, r: tt('Çocuğun yüzünü unutamayacaksın.') },
      { t: tt('İmza at, geç'), fx: { taraf: 1 }, r: tt('İmzayı attın, otobüse bindin.') },
    ] },
  { id: 'agir', must: true, cd: 4, if: () => !!S.fl.agir,
    t: tt('Doktorun odasında'), d: tt('Ön çapraz bağında hasar var. Önünde dört yol var; her birinin bedeli başka.'),
    o: [
      { t: tt('Ameliyat ol'), run: () => { delete S.fl.agir; S.inj = 16; }, fx: { mo: -8 }, r: tt('On altı hafta yoksun, ama dizin eskisi gibi olacak.') },
      { t: tt('Ünlü cerraha git'), if: () => S.money >= nice(Math.max(150000, wref() * 20)), run: () => { delete S.fl.agir; S.inj = 11; return { fx: { para: -nice(Math.max(150000, wref() * 20)), mo: -4 } }; }, r: tt('Yurt dışında, sporcuların gittiği klinikte ameliyat oldun. On bir haftada, tam sağlam dönüyorsun.') },
      { t: tt('Ameliyatsız tedavi'), run: () => { delete S.fl.agir; S.inj = 7; if (chance(.6)) S.fl.kronik = 1; return chance(.4) ? { fx: { hiz: -4, guc: -2 }, r: tt('Yedi haftada döneceksin ama diz tam toparlamadı. Hızından kalıcı kaybın var; sakatlık kronikleşebilir.') } : { r: tt('Yedi haftada döneceksin. Şimdilik şanslısın, ama diz bir gün yine hatırlatabilir.') }; } },
      { t: tt('İğneyle oyna'), run: () => { delete S.fl.agir; S.inj = 2; S.fl.kronik = 1; }, fx: { hiz: -2, hoca: 4, taraf: 4 }, r: tt('İki haftaya sahadasın. Takım sana minnettar; dizin değil. Sakatlık kronikleşti: her maç risk, her sezon biraz hız.') },
    ] },
  { id: 'kas', chain: true, if: () => S.inj >= 3,
    t: tt('Dönüş takvimi'), d: tt('Kas yırtığın iyileşiyor. Sağlık ekibi iki plan sundu.'),
    o: [
      { t: tt('Tam iyileş'), fx: { prof: 2 }, r: tt('Acele yok. Tam hazır olunca döneceksin.') },
      { t: tt('Erken dön'), run: () => { S.inj = Math.max(1, S.inj - 2); if (chance(.35)) { S.inj += 5; return { fx: { mo: -6 }, r: tt('İlk idmanda aynı yer yine gitti. Dönüş daha da uzadı.') }; } return { fx: { hoca: 3 }, r: tt('İki hafta kazandın. Şimdilik sorun yok.') }; } },
    ] },
  { id: 'kronik', must: true, cd: 30, if: () => !!S.fl.kronik && !S.fl.kronikOp && S.week >= 33,
    t: tt('Diz yine konuşuyor'), d: tt('Sezon bitiyor. Doktor net: "Bu diz böyle gitmez. Sezon arasında ameliyat edelim; yoksa her yıl biraz daha hız kaybedersin."'),
    o: [
      { t: tt('Sezon arası ameliyat'), run: () => { S.fl.kronikOp = 1; }, r: tt('Karar verildi. Sezon biter bitmez masaya yatacaksın; yeni sezonun ilk sekiz haftası yok.') },
      { t: tt('Böyle devam'), fx: { mo: 2 }, r: tt('Ertelemeyi seçtin. Diz her maç kendini hatırlatacak.') },
    ] },
  { id: 'kap_prim', w: 2.5, cd: 26, if: () => !!S.fl.kaptan,
    t: tt('Prim pazarlığı'), d: tt('Takım seni sözcü seçti: "Kaptan, yönetimle primleri sen konuş."'),
    o: [
      { t: tt('Yönetime bastır'), fx: { takim: 8, hoca: -3 }, run: () => (chance(.55) ? { fx: { para: nice(wref() * 3) }, r: tt('Masaya yumruğunu vurdun; primler arttı. Soyunma odası seni omuzlarda taşıdı.') } : { fx: { taraf: -2 }, r: tt('Yönetim geri adım atmadı. Ama takım, arkasında durduğunu gördü.') }) },
      { t: tt('Orta yolu bul'), fx: { takim: 3, hoca: 2 }, r: tt('İki taraf da biraz verdi. Kimse tam mutlu değil, kimse küs değil.') },
      { t: tt('Yönetimin yanında dur'), fx: { takim: -8, hoca: 4 }, r: tt('"Kulübün durumu belli" dedin. Soyunma odasında bakışlar değişti.') },
    ] },
  { id: 'kap_kavga', w: 2.5, cd: 22, if: () => !!S.fl.kaptan && S.mates.length >= 4, prep: () => ({ a: S.mates[1].n, b: S.mates[3].n }),
    t: tt('Antrenmanda itiş kakış'), d: c => tt`${c.a} ile ${c.b} idmanda birbirine girdi. Herkes kaptana bakıyor.`,
    o: [
      { t: tt('Araya gir, barıştır'), run: () => (chance(.5 + S.rel.takim / 300) ? (S.mates.forEach(m => { m.b = clamp(m.b + 4, 0, 100); }), { fx: { takim: 6 }, r: tt('İkisini soyunma odasına çektin. On dakika sonra el sıkışıp çıktılar.') }) : { fx: { takim: -2 }, r: tt('Araya girdin ama laf sana da döndü. Ortam gergin kaldı.') }) },
      { t: tt('Hocaya bildir'), fx: { hoca: 3, takim: -4 }, r: tt('Hoca ikisine de ceza kesti. Takım, kaptanın ispiyon ettiğini konuşuyor.') },
      { t: tt('Karışma'), fx: { takim: -3 }, r: tt('Kendi aralarında çözsünler dedin. Çözmediler; soğukluk sürüyor.') },
    ] },
  { id: 'kap_genc', w: 2.5, cd: 20, if: () => !!S.fl.kaptan && S.mates.length >= 4, prep: () => ({ a: S.mates[3].n }),
    t: tt('Genç oyuncu çökmüş'), d: c => tt`${c.a} üst üste kötü oynadı, tribün ıslıkladı. Soyunma odasında tek başına oturuyor.`,
    o: [
      { t: tt('İdmandan sonra onunla kal'), fx: { en: -8, takim: 4 }, run: () => { S.mates[3].b = clamp(S.mates[3].b + 12, 0, 100); }, r: tt('Bir saat şut çektiniz, bir saat konuştunuz. Çocuğun omuzları dikleşti.') },
      { t: tt('İki kelam et'), fx: { takim: 2 }, r: tt('"Hepimiz o yollardan geçtik" dedin. Başını salladı.') },
      { t: tt('Kendi derdine düşsün'), fx: { takim: -2 }, r: tt('Futbol sert iş. Ayakta kalan kalır.') },
    ] },
  { id: 'kap_ceza', w: 2, cd: 24, if: () => !!S.fl.kaptan,
    t: tt('Ceza kasası'), d: tt('Takımın yıldızı idmana yine geç geldi. Ceza kasası kaptanda; karar senin.'),
    o: [
      { t: tt('Cezayı kes'), fx: { hoca: 4, takim: -2, prof: 2 }, r: tt('Kural herkese kural. Yıldız surat astı ama hoca seni takdir etti.') },
      { t: tt('Bu seferlik affet'), fx: { takim: 3, hoca: -3 }, r: tt('Göz yumdun. Takım rahatladı, hoca kaşlarını çattı.') },
      { t: tt('Cezayı cebinden öde'), if: () => S.money >= nice(Math.max(500, wref())), run: () => ({ fx: { para: -nice(Math.max(500, wref())), takim: 6 } }), r: tt('Kasaya parayı kendin koydun. "Kaptan" lafı bugün başka söylendi.') },
    ] },
  { id: 'kap_al', must: true, cd: 20, if: () => !!S.fl.kaptan && (S.rel.takim < 30 || S.rel.hoca < 28),
    t: tt('Pazubent'), d: tt('Hoca seni odasına çağırdı: "Takım seni dinlemiyor. Pazubendi başkasına vereceğim."'),
    o: [
      { t: tt('Kabullen'), fx: { mo: -8, prof: 2 }, run: () => { delete S.fl.kaptan; }, r: tt('Pazubendi masaya bıraktın. Belki bir gün geri alırsın.') },
      { t: tt('İtiraz et'), fx: { mo: -6, hoca: -5, ego: 3 }, run: () => { delete S.fl.kaptan; }, r: tt('Sesini yükselttin; karar değişmedi. Kapıyı çarpıp çıktın.') },
    ] },
  { id: 'bakim', w: 2, once: true, if: () => S.age >= 31 && S.money >= 500000,
    t: tt('Dizler eskisi gibi değil'), d: tt('Fizyoterapistin kişiye özel bakım programı öneriyor: ₺500.000.'),
    o: [
      { t: tt('Programa başla'), fx: { para: -500000 }, run: () => { S.fl.bakim = 1; }, r: tt('Yaşa bağlı düşüşün artık daha yavaş olacak.') },
      { t: tt('Gerek yok'), r: tt('Vücudunu dinleyerek devam edeceksin.') },
    ] },
  // ---------- zincirler ve gerçek hayat ----------
  { id: 'kavga2', chain: true, t: tt('Yardımcı antrenörün odası'), d: tt('Yardımcı antrenör kapıyı kapattı: "Dünkü olay neydi? Hocaya gitmeden ben çözmek istiyorum."'),
    o: [
      { t: tt('Özür dile'), fx: { takim: 6, ego: -3, hoca: 2 }, r: tt('Elini sıktı: "Konu kapandı." Soyunma odasında da duyuldu.') },
      { t: tt('"O başlattı"'), fx: { hoca: -4, takim: -3 }, run: () => { if (chance(.4)) later('kavga3', 1); }, r: tt('Başını iki yana salladı. Not aldığını gördün.') },
      { t: tt('"Sana hesap vermem"'), fx: { ego: 6, takim: -4 }, run: () => { later('kavga3', 1); }, r: tt('Odadan çıktın. Arkandan telefona sarıldı.') },
    ] },
  { id: 'kavga3', chain: true, t: tt('Hocanın kararı'), d: tt('Teknik direktör seni herkesin önünde çağırdı: "Bu takımda kimse takımdan büyük değil."'),
    o: [
      { t: tt('Cezayı kabul et'), run: () => { S.ban = Math.max(S.ban, 1); S.banR = tt('Kadro dışı'); return { fx: { para: -nice(wref() * 2), hoca: -6 } }; }, r: tt('İki haftalık maaş cezası ve bir maç kadro dışı.') },
      { t: tt('Takımdan özür dile'), fx: { takim: 8, hoca: 3, ego: -5 }, r: tt('Ayağa kalkıp özür diledin. Hoca başıyla onayladı.') },
      { t: tt('Basına konuş'), fx: { hoca: -20, taraf: -6, ego: 6, fol: 2500 }, run: () => { S.tstat = 'istek'; S.fl.istek = 1; }, r: tt('Manşet oldun. Kulüp seni satış listesine koydu.') },
    ] },
  { id: 'dolandirici', neg: 1, w: 2.5, cd: 80, if: () => S.agent && !own('musavir') && S.money > wref() * 20 && (S.agent.pw < .5 || S.hid.prof < 45),
    prep: () => ({ a: nice(S.money * .18) }),
    t: tt('Hesapta bir tuhaflık'), d: c => tt`Banka dökümüne baktın: menajerin ${S.agent.n}, hesabından ${fmt(c.a)} tutarını "danışmanlık" diye kendi şirketine aktarmış.`,
    o: [
      { t: tt('Dava aç'), run: c => { const ag = S.agent.n; S.agent = null; return chance(.65) ? { fx: { para: -Math.round(c.a * .15), mo: -4 }, r: tt`Avukat tuttun, paranı geri aldın. ${ag} ile yollar ayrıldı.` } : { fx: { para: -Math.round(c.a * 1.15), mo: -8 }, r: tt`Dava uzadı, para gitti. ${ag} ortadan kayboldu.` }; } },
      { t: tt('Yüzleş'), run: c => { if (chance(.5)) return { fx: { para: -Math.round(c.a * .5) }, r: tt('Kızardı, bozardı. Yarısını geri yatırdı; "muhasebe hatası" dedi.') }; S.agent = null; return { fx: { para: -c.a, mo: -6 }, r: tt('Telefonlarını açmıyor. Para da menajer de gitti.') }; } },
      { t: tt('Sessiz kal'), run: c => { later('dolandirici2', ri(18, 30)); return { fx: { para: -c.a, mo: -3 } }; }, r: tt('Görmezden geldin. Belki bir açıklaması vardır.') },
    ] },
  { id: 'dolandirici2', chain: true, if: () => !!S.agent, prep: () => ({ a: nice(Math.max(S.money, wref() * 10) * .3) }),
    t: tt('Bu kez imzan var'), d: c => tt`Bankadan aradılar: adına ${fmt(c.a)} kredi çekilmiş. Evraklarda senin imzan var; ama sen atmadın.`,
    o: [
      { t: tt('Savcılığa git'), run: c => { S.agent = null; return { fx: { para: -Math.round(c.a * .4), mo: -8, rep: -2 } }; }, r: tt('Menajerin gözaltına alındı. Borcun bir kısmı yine de sana kaldı.') },
      { t: tt('İyi bir avukat tut'), run: c => { S.agent = null; return { fx: { para: -Math.round(c.a * .12), mo: -4 } }; }, r: tt('Sahtecilik kanıtlandı. Menajersiz kaldın ama temizsin.') },
    ] },
  { id: 'gec', neg: 1, w: 2, cd: 20, if: () => S.hid.prof < 45,
    t: tt('Geç kaldın'), d: tt('Alarmı duymamışsın. Antrenmana yirmi dakika geç girdin; herkes ısınmayı bitirmişti.'),
    o: [
      { t: tt('Özür dile, ekstra koş'), fx: { hoca: -2, en: -8, prof: 4 }, r: tt('Antrenmandan sonra tek başına on tur attın.') },
      { t: tt('Trafik de'), fx: { hoca: -6, prof: -2 }, r: tt('Hoca inanmadı. Kasaya para cezası yazıldı.') },
    ] },
  { id: 'paparazzi', neg: 1, w: 3, cd: 20, if: () => !(S.fl.kalkan > absWeek()) && S.fl.gecew && absWeek() - S.fl.gecew <= 2 && S.fol >= 3000,
    t: tt('Gece çıkışı manşette'), d: tt('Gece kulübü çıkışında çekilmiş bir fotoğrafın her yerde. Altında: "Maç öncesi böyle hazırlanıyor."'),
    o: [
      { t: tt('Açıklama yap'), fx: { taraf: 3, hoca: -2, mo: -3 }, r: tt('"İzin günümdü" dedin. Ortalık yatıştı.') },
      { t: tt('Umursama'), fx: { hoca: -8, taraf: -5, ego: 3 }, r: tt('Susman kabul sayıldı. Hoca toplantıda yüzüne bile bakmadı.') },
      { t: tt('Sahada cevap ver'), fx: { prof: 4, mo: 2 }, r: tt('Telefonu kapattın. Bu hafta herkes seni izleyecek.') },
    ] },
  { id: 'vergi', neg: 1, w: 2, cd: 60, if: () => S.con.wage >= 150000 && !own('musavir'), prep: () => ({ a: nice(S.con.wage * 6) }),
    t: tt('Vergi dairesinden yazı'), d: c => tt`Beyanname eksik verilmiş. Ödeme emri: ${fmt(c.a)}.`,
    o: [
      { t: tt('Öde, kapat'), run: c => ({ fx: { para: -c.a, mo: -3 } }), r: tt('Ödedin. Bir daha olmasın diye not aldın.') },
      { t: tt('Mali müşavirle anlaş'), run: c => { if (!own('musavir')) S.assets.push('musavir'); return { fx: { para: -Math.round(c.a * .7) } }; }, r: tt('Müşavir cezayı indirdi, sezon sonuna kadar hesaplarına o bakacak.') },
    ] },
  { id: 'hirsiz', neg: 1, w: 2, cd: 60, if: () => (own('ev') || own('villa') || own('spor')) && !own('guvenlik'), prep: () => ({ a: nice(Math.max(50000, S.money * .05)) }),
    t: tt('Deplasmandayken'), d: c => tt`Sen maçtayken evine girmişler. Kayıp: ${fmt(c.a)} değerinde eşya.`,
    o: [
      { t: tt('Güvenlik sistemi kur'), run: c => { if (!own('guvenlik')) S.assets.push('guvenlik'); const g = SHOP.find(x => x.id === 'guvenlik'); return { fx: { para: -c.a - Math.round(g.yr / 2), mo: -4 } }; }, r: tt('Kamera, alarm, özel güvenlik. Bir daha olmaz.') },
      { t: tt('Polise bırak'), run: c => ({ fx: { para: -c.a, mo: -8, aile: -3 } }), r: tt('Tutanak tutuldu. Ailen tedirgin.') },
    ] },
  { id: 'akraba', w: 2, cd: 30, if: () => S.money >= 2000000, prep: () => ({ a: nice(S.money * .04) }),
    t: tt('Uzaktan bir akraba'), d: c => tt`Yıllardır görmediğin bir kuzenin aradı: düğün yapacakmış, ${fmt(c.a)} borç istiyor.`,
    o: [
      { t: tt('Ver gitsin'), run: c => ({ fx: { para: -c.a, aile: 6 } }), r: tt('Geri gelmeyeceğini ikiniz de biliyorsunuz.') },
      { t: tt('Yarısını ver'), run: c => ({ fx: { para: -Math.round(c.a / 2), aile: 2 } }), r: tt('Teşekkür etti ama sesi soğuktu.') },
      { t: tt('Nazikçe reddet'), fx: { aile: -6 }, r: tt('Sülalede "parayı bulunca değişti" diye konuşuluyor.') },
    ] },
  { id: 'yalnizlik', neg: 1, w: 3, cd: 24, if: () => !inTR() && S.rel.aile < 55,
    t: tt('Uzun akşamlar'), d: tt('Yabancı bir şehirde akşamlar uzun. Telefonda annenin sesi titriyor.'),
    o: [
      { t: tt('Aileni yanına getir'), if: () => S.money >= 150000, fx: { para: -150000, aile: 18, mo: 10 }, r: tt('Bir aylığına geldiler. Ev ilk kez ev gibi koktu.') },
      { t: tt('Her akşam görüntülü ara'), fx: { aile: 6, mo: 2 }, r: tt('Ekrandan da olsa aynı sofradasınız.') },
      { t: tt('Kendini işe ver'), fx: { prof: 4, mo: -6 }, r: tt('Tesiste ışıkları sen kapatıyorsun artık.') },
    ] },
  { id: 'tukenmislik', neg: 1, must: true, cd: 16, if: () => S.mo < 28,
    t: tt('Sabah kalkamıyorsun'), d: tt('Antrenman çantası kapının önünde duruyor. İçinden gitmek gelmiyor.'),
    o: [
      { t: tt('Psikoloğa git'), if: () => S.money >= 8000, fx: { para: -8000, mo: 18 }, r: tt('Konuşmak iyi geldi. "Bu da oyunun parçası" dedi.') },
      { t: tt('Hocadan izin iste'), fx: { mo: 12, hoca: -3 }, run: () => { S.fl.skip = 1; }, r: tt('Bu hafta maçta yoksun. Nefes aldın.') },
      { t: tt('Dişini sık'), fx: { mo: -2, prof: 2 }, run: () => chance(.15) ? { fx: { inj: 2 }, r: tt('Kafan başka yerdeyken bileğin döndü.') } : { r: tt('Gittin. Bugün de geçti.') } },
    ] },
  { id: 'reklam', w: 2.5, cd: 30, if: () => S.fol >= 100000, prep: () => ({ a: nice(S.fol * 1.2) }),
    t: tt('Reklam filmi'), d: c => tt`Bir içecek markası iki günlük çekim için ${fmt(c.a)} öneriyor. Çekim maç haftasına denk geliyor.`,
    o: [
      { t: tt('Kabul et'), run: c => ({ fx: { para: c.a, en: -16, fol: Math.round(S.fol * .03), hoca: -2 } }), r: tt('Yirmi kez aynı cümleyi söyledin. Para hesapta.') },
      { t: tt('Sezon sonuna ertele'), fx: { prof: 3, hoca: 2 }, r: tt('Marka bekleyeceğini söyledi. Hoca duyunca memnun oldu.') },
    ] },
  { id: 'vakif', w: 2, once: true, if: () => S.money >= 20000000 && S.rep >= 60,
    t: tt('Geriye bir şey bırakmak'), d: tt('Memleketinde çocuklar için ücretsiz bir futbol okulu açma fikri aklından çıkmıyor.'),
    o: [
      { t: tt('Okulu kur'), fx: { para: -5000000, rep: 6, taraf: 8, aile: 6, mo: 10 }, r: tt('Açılışta ilk topu sen attın. Tabelada adın yazıyor.') },
      { t: tt('Emeklilikten sonra'), r: tt('Fikri bir kenara not ettin.') },
    ] },
  // ---------- ağ: tanışmalar. Kiminle yakınlaştığın ileride kapı açar ya da başını yakar ----------
  { id: 'net_abi', w: 3, once: true, if: () => amat(), prep: () => ({ n: rname('TR') }),
    t: tt('Kahvehanede bir masa'), d: c => tt`Köşedeki masada herkesin ayağa kalkıp selamladığı biri var: şehrin eski kulüp başkanı ${c.n}. Seni yanına çağırdı.`,
    o: [
      { t: tt('Otur, dinle'), fx: { zihin: 0.5 }, run: c => { netAdd('abi', c.n, null, 36); }, r: tt('Bir saat eski maçları anlattı. Giderken "bir şeye ihtiyacın olursa ara" dedi.') },
      { t: tt('Selam ver, geç'), r: tt('Başıyla selamladı. Fırsat geçti gitti.') },
    ] },
  { id: 'net_yildiz', w: 2.5, once: true, if: () => S.rep >= 16 || S.car.caps > 0,
    prep: () => { const o = OVR(), pool = []; for (const lid in S.lg) for (const id of S.lg[lid].t) if (S.rt[id] >= o + 4 && S.rt[id] <= o + 16) pool.push(id); return { n: rname('TR'), org: pool.length ? pick(pool) : null }; },
    t: tt('Yardım maçı'), d: c => tt`Bir yardım maçında ${c.org ? club(c.org).n : tt('büyük bir kulüp')} forması giyen ${c.n} ile aynı takımdasın. Maçtan sonra yanına geldi: "Sende iş var."`,
    o: [
      { t: tt('Tavsiye iste'), fx: { mo: 5 }, run: c => { netAdd('yildiz', c.n, c.org, 34); }, r: tt('Numarasını verdi: "Takıldığın yerde ara." Bu tanışıklık bir gün kapı açabilir.') },
      { t: tt('Fotoğraf çektir'), run: c => { netAdd('yildiz', c.n, c.org, 14); return { fx: { fol: Math.round(300 + S.fol * .08), ego: 2 } }; }, r: tt('Fotoğraf çok beğeni aldı. Seni hatırlar mı, belli değil.') },
      { t: tt('Çekindin'), fx: { mo: -2 }, r: tt('Yanına gidemedin. Otobüste kendine kızdın.') },
    ] },
  { id: 'net_gazeteci', w: 2, once: true, if: () => S.fol >= 3000, prep: () => ({ n: rname('TR') }),
    t: tt('Kartvizit'), d: c => tt`Antrenman çıkışında spor yazarı ${c.n} kartını uzattı: "Hikâyeni ben yazmak isterim."`,
    o: [
      { t: tt('Kartı al, ara'), run: c => { netAdd('gazeteci', c.n, null, 30); }, r: tt('Bir kahve içtiniz. Basında bir dostun var artık.') },
      { t: tt('Mesafeli dur'), fx: { prof: 2 }, r: tt('Teşekkür edip yürüdün.') },
    ] },
  { id: 'net_doktor', w: 2, once: true, if: () => S.car.apps + S.st.apps >= 20, prep: () => ({ n: 'Dr. ' + rname('TR') }),
    t: tt('Muayenede'), d: c => tt`Rutin kontrolde ${c.n} koşu bandındaki değerlerine baktı: "Bu vücuda iyi bakarsan uzun oynarsın. Bana uğra."`,
    o: [
      { t: tt('Düzenli git'), run: c => { netAdd('doktor', c.n, null, 32); }, r: tt('Artık bir telefon uzağında bir hekimin var.') },
      { t: tt('Gerek yok'), r: tt('Kendini iyi hissediyorsun.') },
    ] },
  { id: 'net_scout', w: 2.5, once: true, if: () => lowPro() && form() >= 7, prep: () => ({ n: rname('TR') }),
    t: tt('Tribündeki adam'), d: c => tt`Üç maçtır aynı koltukta oturan adam otoparkta yanına geldi: ${c.n}, serbest çalışan bir scout.`,
    o: [
      { t: tt('Numaranı ver'), run: c => { netAdd('scout', c.n, null, 30); }, r: tt('"Raporunu doğru yerlere ulaştırırım" dedi.') },
      { t: tt('Menajerime yönlendir'), if: () => !!S.agent, fx: { prof: 2 }, r: tt('İşi menajerine bıraktın.') },
      { t: tt('İlgilenme'), r: tt('Omuz silkip gitti.') },
    ] },
  { id: 'net_marka', w: 2, once: true, if: () => S.fol >= 20000, prep: () => ({ n: rname('TR') }),
    t: tt('Davet'), d: c => tt`Bir spor markasının lansmanına çağrıldın. Pazarlama müdürü ${c.n} seninle özel ilgilendi.`,
    o: [
      { t: tt('Sohbeti ilerlet'), run: c => { netAdd('marka', c.n, null, 30); }, r: tt('Kartlar değişildi. Sponsorluk kapısı aralandı.') },
      { t: tt('Erken ayrıl'), fx: { en: 4 }, r: tt('Yarın antrenman var.') },
    ] },
  { id: 'net_golge', neg: 1, w: 2.5, once: true, if: () => S.hid.prof < 50 || (S.fl.gecew && absWeek() - S.fl.gecew <= 3), prep: () => ({ n: rname('TR').split(' ')[0] + (KW ? ' Abla' : ' Abi') }),
    t: tt('Masana biri oturdu'), d: c => (KW ? tt`Gece kulübünde herkesin "${c.n}" dediği biri masana oturdu. Hesabı o ödedi: "Senin gibi yeteneğe her kapı açılır."` : tt`Gece kulübünde herkesin "${c.n}" dediği biri masana oturdu. Hesabı o ödedi: "Senin gibi delikanlıya her kapı açılır."`),
    o: [
      { t: tt('Uzak dur'), fx: { prof: 4 }, r: tt('Teşekkür edip kalktın.') },
      { t: tt('Tanışıklığı sürdür'), fx: { prof: -4, mo: 3 }, run: c => { netAdd('golge', c.n, null, 40); }, r: tt('Numaralar alındı. Bu adamın açtığı kapılar kolay paraya çıkar, belki başka yerlere de.') },
    ] },
  // ---------- krampon sponsoru ----------
  { id: 'bootdeal', w: 4, cd: 30, if: () => !S.boot && S.rep >= 12 && S.con.wage >= 1500 && S.week <= 30, prep: () => ({ n: pick(BOOTS), a: bootMake(false), b: bootMake(true) }),
    t: tt('Krampon markası kapıda'), d: c => tt`${c.n} bu sezon ayağında kendi kramponunu görmek istiyor. İki teklif var: haftada ${fmt(c.a.wk)} sabit ödeme; ya da haftada ${fmt(c.b.wk)} ve hedef tutarsa sezon sonunda ${fmt(c.b.bon)} prim. Hedef: ${bootGoal(c.b.tgt)}.`,
    o: [
      { t: tt('Sabit ödemeyi al'), run: c => { S.boot = { n: c.n, ...c.a }; }, r: tt('İmzalar atıldı. Para her hafta hesabında.') },
      { t: tt('Hedefli anlaşmayı al'), run: c => { S.boot = { n: c.n, ...c.b }; }, r: tt('Kendine güveniyorsun. Hedef tutarsa büyük prim senin.') },
      { t: tt('İstemiyorum'), r: tt('Teklifi geri çevirdin.') },
    ] },
  { id: 'bootshoot', w: 2.5, cd: 18, if: () => !!S.boot, prep: () => ({ n: S.boot.n, p: nice(S.boot.wk * 6) }),
    t: tt('Reklam çekimi'), d: c => tt`${c.n} maçtan iki gün önce bütün gün sürecek bir çekim istiyor: ${fmt(c.p)} ödeyecek.`,
    o: [
      { t: tt('Çekime git'), run: c => ({ fx: { para: c.p, en: -15, fol: Math.round(300 + S.fol * .02), hoca: -2 }, r: tt('Işıklar, makyaj, kırk tekrar. Akşam bacakların tutmuyordu ama reklam güzel oldu.') }) },
      { t: tt('Maçtan sonraya ertele'), run: c => (chance(.6) ? { fx: { para: Math.round(c.p * .7), fol: Math.round(200 + S.fol * .01), prof: 2 }, r: tt('Marka kabul etti; çekim sakin bir günde yapıldı, ücret biraz düştü.') } : { r: tt('Marka takvimi değiştiremedi; çekim iptal oldu.') }) },
      { t: tt('Reddet'), fx: { prof: 2, hoca: 1 }, run: () => { if (S.boot && chance(.3)) { S.boot.wk = nice(S.boot.wk * .9); return { r: tt('Marka bozuldu: haftalık ödemeni biraz kıstı.') }; } return { r: tt('Marka üstelemedi.') }; } },
    ] },
  // ---------- soyunma odası ----------
  { id: 'lr_yeni', w: 2.5, cd: 26, if: () => S.mates.length >= 4 && ((S.week >= 2 && S.week <= 6) || (S.week >= 21 && S.week <= 25)), prep: () => newMate(1),
    t: tt('Yeni transfer soyunma odasında'), d: c => tt`${c.old} gitti, yerine ${c.n} geldi. Ücretinin herkesten yüksek olduğu konuşuluyor; kıdemliler homurdanıyor.`,
    o: [
      { t: tt('İlk sen karşıla'), fx: { takim: 2 }, run: () => { tenAdj(-6); S.mates[1].b = clamp(S.mates[1].b + 14, 0, 100); klikAdj('kid', -2); }, r: c => tt`${c.n} için şehirde tanıdığı ilk kişi sen oldun. Bunu unutmaz.` },
      { t: tt('Mesafeli dur'), run: () => { tenAdj(5); }, r: tt('Kimse bir şey demedi ama hava ağırlaştı.') },
      { t: tt('Kıdemlilerin yanında dur'), run: () => { klikAdj('kid', 7); tenAdj(4); S.mates[1].b = clamp(S.mates[1].b - 6, 0, 100); }, r: tt('Kıdemliler memnun. Yeni gelen ise kimin tarafında olduğunu not etti.') },
    ] },
  { id: 'lr_klik', w: 2.5, cd: 28, if: () => S.mates.length >= 4 && S.week >= 6,
    t: tt('Soyunma odası ikiye bölündü'), d: () => tt`Prim dağıtımı yüzünden kıdemlilerle gençler birbirine girdi. ${S.mates[0].n} ile ${S.mates[3].n} aynı anda sana baktı.`,
    o: [
      { t: tt('Kıdemlileri tut'), run: () => { klikAdj('kid', 9); klikAdj('gen', -8); tenAdj(5); }, r: tt('"Sıra size de gelecek" dedin gençlere. Kıdemliler başını salladı.') },
      { t: tt('Gençleri tut'), run: () => { klikAdj('gen', 12); klikAdj('kid', -7); tenAdj(5); }, r: tt('"Sahada koşan onlar" dedin. Gençler arkanda, kıdemliler soğuk.') },
      { t: tt('Arabulucu ol'), run: () => { if (chance(clamp(.3 + S.at.zihin / 200 + (S.trait === 'lider' ? .2 : 0) + (S.fl.kaptan ? .15 : 0), .1, .9))) { tenAdj(-14); klikAdj('kid', 3); klikAdj('gen', 3); return { fx: { takim: 5, hoca: 2 }, r: tt('İki tarafı da dinledin, orta yolu buldun. Hoca uzaktan izliyordu.') }; } tenAdj(6); return { fx: { takim: -2 }, r: tt('İki taraf da seni karşı tarafta sandı. Daha beter oldu.') }; } },
    ] },
  { id: 'lr_patla', chain: true, cd: 16, t: tt('Soyunma odası patladı'), d: tt('Maçtan sonra kapı kapandı ve herkes içini döktü. Bağıranlar, susanlar, eşyasını toplayanlar. Hoca toplantı istiyor.'),
    o: [
      { t: tt('Söz al, sorumluluğu üstlen'), fx: { takim: 6, hoca: 3, mo: -4 }, run: () => { tenAdj(-30); }, r: tt('"Önce ben düzeleceğim" dedin. Oda sustu, sonra biri elini omzuna koydu.') },
      { t: tt('Sessiz kal'), fx: { takim: -3 }, run: () => { tenAdj(-12); }, r: tt('Fırtına geçti ama kimse bir şey çözmedi.') },
      { t: tt('Suçluları say'), fx: { hoca: -4, ego: 4 }, run: () => { tenAdj(-8); klikAdj('kid', -10); klikAdj('yil', -10); klikAdj('gen', -6); }, r: tt('İsim isim saydın. Haklıydın belki ama artık odada yalnızsın.') },
    ] },
  // ---------- veteran dönemi ----------
  { id: 'oyuncu_antrenor', once: true, w: 6, cd: 99, if: () => S.age >= 33 && (S.vet || 0) >= 5 && S.rel.hoca >= 55 && !S.loan && !S.fl.pc,
    t: tt('Oyuncu-antrenörlük teklifi'), d: tt('Hoca seni odasına çağırdı: "Gençler seni dinliyor. Sahada benim sesim olur musun? Seni ekibe de yazdırayım; yine oynarsın ama artık biraz da bizdensin."'),
    o: [
      { t: tt('Kabul et'), fx: { hoca: 8, takim: 4 }, run: () => { S.fl.pc = 1; S.con.wage = nice(S.con.wage * 1.15); addNews(tt('Oyuncu-antrenör oldun: ücretin %15 arttı, taktik uyumun yükseldi.'), 'whistle'); }, r: tt('Artık toplantılara sen de giriyorsun. Forma şansın biraz azalır ama kenardaki yolun açıldı.') },
      { t: tt('Sadece oyuncuyum'), fx: { hoca: -2 }, r: tt('"Daha oynayacak maçlarım var hocam." Hoca gülümsedi.') },
    ] },
];

const EV = {}; for (const e of EVENTS) EV[e.id] = e;

function inst(ev, ctx) {
  const now = absWeek();
  S.cd[ev.id] = now + (ev.cd || 12);
  if (ev.once) S.fl['e_' + ev.id] = 1;
  const c = ctx || (ev.prep ? ev.prep() : {});
  return { ev, ctx: c, title: typeof ev.t === 'function' ? ev.t(c) : ev.t, text: typeof ev.d === 'function' ? ev.d(c) : ev.d, opts: ev.o.filter(o => !o.if || o.if(c)).map(o => (KW ? { ...o, t: kx(o.t) } : o)) };
}

export function pickEvent() {
  const now = absWeek();
  const qi = S.q.findIndex(q => q.at <= now);
  if (qi >= 0) { const q = S.q.splice(qi, 1)[0], ev = EV[q.id]; if (ev && (!ev.if || ev.if())) return inst(ev, q.ctx); }
  const ok = e => !e.chain && (!e.once || !S.fl['e_' + e.id]) && (S.cd[e.id] || 0) <= now && (!e.if || e.if());
  const must = EVENTS.find(e => e.must && ok(e) && !(e.neg && goodRun() && e.id !== 'tukenmislik'));
  if (must) return inst(must);
  if (!chance(.5)) return null;
  const good = goodRun(), trouble = S.hid.ego > 60 || S.hid.prof < 40 ? 2 : 1;
  const pool = EVENTS.filter(e => !e.must && e.w && ok(e) && !(e.neg && good));
  if (!pool.length) return null;
  const wt = e => e.w * (e.neg ? trouble : 1);
  let t = pool.reduce((a, e) => a + wt(e), 0), r = Math.random() * t;
  for (const e of pool) { r -= wt(e); if (r <= 0) return inst(e); }
  return inst(pool[0]);
}

export function resolve(inst0, opt) {
  let f = { ...(opt.fx || {}) }, r = (typeof opt.r === 'function' ? opt.r(inst0.ctx) : opt.r) || '';
  if (opt.run) { const x = opt.run(inst0.ctx) || {}; if (x.fx) f = { ...f, ...x.fx }; if (x.r) r = x.r; }
  return { r, ch: fx(f), sp: opt.sp };
}
