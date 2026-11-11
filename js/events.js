// Toprak Saha — olay kartları. Her seçenek kısa ve uzun vadeli sonuç doğurur.
// Alanlar: w ağırlık, cd bekleme (hafta), once tek sefer, must koşul oluşunca zorunlu, chain yalnızca kuyruktan
import { S, fx, rnd, ri, pick, chance, clamp, OVR, club, leagueOf, tier, absWeek, fmt, nice, addNews, wref, netAdd, rname } from './core.js';
import { LMAP, AGENTS, SHOP } from './data.js';

const inTR = () => LMAP[leagueOf(S.clubId)].c === 'TR';
const amat = () => inTR() && tier() >= 5;
const lowPro = () => inTR() && tier() >= 3;
const form = () => S.lastR.length ? S.lastR.reduce((a, b) => a + b, 0) / S.lastR.length : 6;
const later = (id, w, ctx) => S.q.push({ id, at: absWeek() + w, ctx });
const own = id => S.assets.includes(id);
// İşler yolundayken (form, moral, profesyonellik) olumsuz olaylar karşına çıkmaz
const goodRun = () => form() >= 7 && S.mo >= 60 && S.hid.prof >= 45;
const partner = () => S.fl.evli ? 'eşine' : 'sevgiline';

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
    t: 'Gece daveti', d: 'Maçtan önceki gece arkadaşların arıyor: "Kısa bir çıkalım, erken döneriz."',
    o: [
      { t: 'Çık, eğlen', fx: { ark: 10, en: -20, mo: 6, prof: -4 }, run: () => chance(.3) ? { fx: { hoca: -10 }, r: 'Eğlendin ama hoca duymuş. Sabah antrenmanda yüzüne bile bakmadı.' } : { r: 'Güzel bir geceydi. Sabah bacakların ağır.' } },
      { t: 'Yarım saat uğra', fx: { ark: 4, en: -8 }, r: 'Yüzünü gösterdin, erkenden kalktın.' },
      { t: 'Reddet, uyu', fx: { ark: -6, prof: 3, en: 4 }, r: 'Telefonu sessize aldın. Arkadaşların biraz bozuldu.' },
    ] },
  { id: 'sinav', w: 3, cd: 14, if: () => S.fl.okul,
    t: 'Sınav haftası', d: 'Yarın matematik sınavı var. Hoca aynı akşam ek antrenman koydu.',
    o: [
      { t: 'Sınava çalış', fx: { egt: 10, aile: 6, hoca: -3 }, r: 'Antrenmana gitmedin. Annen gururlu, hoca not aldı.' },
      { t: 'Antrenmana git', fx: { hoca: 6, aile: -8, teknik: 0.5, egt: -4 }, r: 'Sahada iyiydin. Sınav kâğıdı ise neredeyse boş.' },
      { t: 'İkisini de yap', fx: { egt: 5, hoca: 3, en: -25 }, r: 'Gece üçe kadar ders, öncesinde antrenman. Ayakta zor duruyorsun.' },
    ] },
  { id: 'okulbirak', w: 2, once: true, if: () => S.fl.okul && S.age >= 17,
    t: 'Okul mu, futbol mu?', d: 'Hoca seni kenara çekti: "Bu işi ciddi yapacaksan okul seni yavaşlatıyor. Karar ver."',
    o: [
      { t: 'Okulu bırak', fx: { hoca: 10, aile: -20, prof: 5 }, run: () => { delete S.fl.okul; S.fl.okulBirakti = 1; }, r: 'Okulu bıraktın. Evde günlerce konuşulmadı. Artık tek yolun futbol.' },
      { t: 'Açık liseye geç', fx: { hoca: 4, aile: -5, egt: 5 }, r: 'Açık liseye geçtin. İkisini de götüreceksin, ama kolay olmayacak.' },
      { t: 'Okula devam', fx: { hoca: -5, aile: 6 }, r: 'Okula devam ediyorsun. Hoca omuz silkti.' },
    ] },
  { id: 'is', w: 2, once: true, if: () => amat() && S.age >= 18 && !S.job,
    t: 'Fabrikada kadro', d: 'Dayın fabrikada sana kadrolu iş ayarlamış. "Futbol karın doyurmaz" diyor.',
    o: [
      { t: 'İşe gir', fx: { aile: 8 }, run: () => { S.job = 9000; }, r: 'Haftada ₺9.000 düzenli gelirin var. Vardiyalar enerjini yiyecek (haftalık enerji −8).' },
      { t: 'Reddet', fx: { aile: -10, prof: 5 }, r: '"Ben futbolcu olacağım" dedin. Dayın sofradan kalktı.' },
    ] },
  { id: 'aile_para', w: 3, cd: 16, if: () => S.fl.dar && S.money >= 1500,
    t: 'Evde sıkıntı', d: () => `Baban arıyor, sesi kısık: kira gecikmiş. ${fmt(nice(Math.max(1500, wref() * 2)))} lazım.`,
    o: [
      { t: 'Parayı gönder', if: () => S.money >= nice(Math.max(1500, wref() * 2)), run: () => ({ fx: { para: -nice(Math.max(1500, wref() * 2)), aile: 15, mo: 3 } }), r: 'Parayı gönderdin. Baban "hakkını helal et" dedi.' },
      { t: 'Ek vardiya çıkar', fx: { en: -18, aile: 8, para: 1000 }, r: 'Gece vardiyasına girdin, kazandığını eve yolladın.' },
      { t: 'Şu an veremem', fx: { aile: -12, mo: -4 }, r: 'Telefon sessizce kapandı.' },
    ] },
  { id: 'anne', w: 1.5, cd: 40, if: () => S.rel.aile > 20,
    t: 'Hastaneden telefon', d: 'Annen hastaneye kaldırılmış. Ciddi değil diyorlar ama bu hafta maç var.',
    o: [
      { t: 'Hemen git', fx: { aile: 20, mo: 4 }, run: () => { S.fl.skip = 1; return S.rel.hoca > 55 ? { r: 'Hoca "ailen önce gelir" dedi. Bu haftaki maçı kaçırdın.' } : { fx: { hoca: -6 }, r: 'Hoca izin verdi ama yüzü asıktı. Bu haftaki maçı kaçırdın.' }; } },
      { t: 'Maçtan sonra git', fx: { aile: -10, mo: -8 }, r: 'Maça çıkacaksın. Aklın hastanede.' },
    ] },
  { id: 'asker', must: true, cd: 76, if: () => S.age >= 20 && !S.fl.asker && inTR(),
    t: 'Askerlik çağrısı', d: 'Askerlik şubesinden kâğıt geldi. Bir karar vermen gerekiyor.',
    o: [
      { t: 'Tecil ettir', if: () => !S.fl.tecil && (S.con.wage >= 8000 || S.fl.diploma), run: () => { S.fl.tecil = 1; }, r: 'Tecil işlemi tamam. Bu konu iki yıl sonra yine önüne gelecek.' },
      { t: 'Bedelli öde (₺280.000)', if: () => S.money >= 280000, fx: { para: -280000 }, run: () => { S.fl.asker = 1; }, r: 'Bedelini ödedin, konu kapandı.' },
      { t: 'Git, yap gel', fx: { guc: 2, zihin: 3 }, run: () => { S.fl.asker = 1; S.ban = 6; S.banR = 'Askerde'; }, r: 'Altı hafta sahalardan uzaksın. Döndüğünde daha sert biri olacaksın.' },
    ] },
  { id: 'universite', w: 2, once: true, if: () => S.age >= 18 && S.age <= 20 && S.egt >= 55 && !S.fl.okul,
    t: 'Üniversite sonucu', d: 'Spor bilimleri bölümünü kazandın. Açıköğretimle de okuyabilirsin.',
    o: [
      { t: 'Kaydol', fx: { aile: 10, egt: 15 }, run: () => { S.fl.uni = 1; }, r: 'Kaydoldun. Futboldan sonra antrenörlük kapısı aralandı.' },
      { t: 'Futbola odaklan', fx: { prof: 4, aile: -5 }, r: 'Kaydı yaptırmadın.' },
    ] },

  // ---------- ilişkiler ----------
  { id: 'tanisma', w: 3, cd: 20, if: () => S.rel.par == null && S.age >= 17,
    t: 'Bir tanışma', d: 'Arkadaş ortamında biriyle göz göze geldin. Sohbet su gibi aktı.',
    o: [
      { t: 'Numarasını iste', fx: { mo: 8 }, run: () => { S.rel.par = 40; }, r: 'Artık hayatında biri var. İlgi isteyecek, ama moralin yerinde.' },
      { t: 'Futbola odaklan', fx: { prof: 3 }, r: 'Gülümsedin, yoluna devam ettin.' },
    ] },
  { id: 'ayrilik', must: true, cd: 6, if: () => S.rel.par != null && S.rel.par < 12,
    t: 'Konuşmamız lazım', d: () => `Haftalardır ${partner()} vakit ayırmıyorsun. Karşına oturdu: "Böyle devam edemeyiz."`,
    o: [
      { t: 'Söz ver, toparla', fx: { par: 22, en: -8 }, r: 'Söz verdin. Bu kez tutman gerekecek.' },
      { t: 'Yolları ayır', fx: { mo: -15 }, run: () => { S.rel.par = null; if (S.fl.evli) { delete S.fl.evli; const c = Math.round(Math.max(0, S.money) * 0.3); return { fx: { para: -c, aile: -8 }, r: `Boşandınız. Mal paylaşımı ${fmt(c)} tuttu.` }; } return { r: 'Ayrıldınız. Ev sessiz.' }; } },
    ] },
  { id: 'evlilik', w: 3, once: true, if: () => S.rel.par != null && S.rel.par > 78 && S.age >= 23 && !S.fl.evli,
    t: 'Büyük soru', d: 'İlişkiniz çok iyi gidiyor. Evlilik konusu açıldı.',
    o: [
      { t: 'Evlenelim', run: () => { S.fl.evli = 1; const c = nice(Math.max(20000, wref() * 6)); return { fx: { para: -c, mo: 15, aile: 12 }, r: `Düğün ${fmt(c)} tuttu. Hayatında artık bir düzen var.` }; } },
      { t: 'Henüz erken', fx: { par: -18 }, r: 'Erteledin. Kırıldı ama anlayış gösterdi.' },
    ] },
  { id: 'cocuk', w: 2, once: true, if: () => S.fl.evli && S.age >= 25,
    t: 'Müjde', d: 'Bir çocuğunuz oluyor.',
    o: [{ t: 'Hayatımın en güzel haberi', fx: { mo: 20, aile: 10, en: -10 }, run: () => { S.fl.cocuk = 1; }, r: 'Uykusuz geceler başlıyor. Emekli olduğunda soyadın sahada devam edebilir.' }] },

  // ---------- kulüp ve kariyer ----------
  { id: 'hoca', must: true, cd: 8, if: () => S.bench >= 4,
    t: 'Kadro dışı', d: 'Haftalardır forma yüzü görmüyorsun. Bir şey yapman lazım.',
    o: [
      { t: 'Hocayla saygıyla konuş', run: () => { S.bench = 0; return S.hid.prof >= 50 ? { fx: { hoca: 8 }, r: 'Hoca çalışmanı gördüğünü söyledi. "Şansın gelecek."' } : { fx: { hoca: 1 }, r: 'Hoca dinledi ama ikna olmadı: "Önce antrenmanda göster."' }; } },
      { t: 'Basına konuş', fx: { hoca: -15, ego: 6, taraf: 3 }, run: () => { S.bench = 0; }, r: 'Yerel gazetede manşetsin. Hoca seni soyunma odasında azarladı.' },
      { t: 'Sus, daha çok çalış', fx: { prof: 5, hoca: 4, en: -6 }, run: () => { S.bench = 0; }, r: 'Antrenmandan sonra tek başına kaldın. Hoca uzaktan izledi.' },
    ] },
  { id: 'yenileme', w: 4, cd: 30, if: () => !S.loan && S.con.until === S.season && S.rel.hoca >= 62 && S.week >= 8 && S.week <= 34,
    t: 'Yeni sözleşme masada', d: () => `Kulüp sözleşmeni iki sezon uzatmak istiyor: haftalık ${fmt(nice(Math.max(S.con.wage * 1.25, 250)))}.`,
    o: [
      { t: 'İmzala', fx: { sad: 8, taraf: 4 }, run: () => { S.con.wage = nice(Math.max(S.con.wage * 1.25, 250)); S.con.until += 2; }, r: 'İmzayı attın. İki sezon daha buradasın.' },
      { t: 'Zam iste', run: () => { if (chance(.5)) { S.con.wage = nice(Math.max(S.con.wage * 1.5, 400)); S.con.until += 2; return { r: 'Başkan homurdandı ama imzaladı: %50 zam.' }; } return { fx: { hoca: -5 }, r: 'Yönetim teklifi geri çekti. Sezon sonunda serbest kalabilirsin.' }; } },
      { t: 'Sözleşmem bitsin', fx: { sad: -6, taraf: -4 }, r: 'İmzalamadın. Sezon sonunda kaderini kendin çizeceksin.' },
    ] },
  { id: 'kaptan', w: 3, once: true, if: () => S.rel.hoca > 80 && S.rel.takim > 68 && S.season - S.since >= 1 && !S.fl.kaptan,
    t: 'Kaptanlık', d: 'Hoca pazubendi sana uzattı: "Bu takımın lideri sensin."',
    o: [
      { t: 'Kabul et', fx: { takim: 10, zihin: 2, taraf: 6 }, run: () => { S.fl.kaptan = 1; }, r: 'Artık kaptansın. Forma şansın arttı, sorumluluğun da.' },
      { t: 'Hazır değilim', fx: { hoca: -4 }, r: 'Pazubent başkasına gitti.' },
    ] },
  { id: 'kavga', neg: 1, w: 2.5, cd: 18, if: () => S.rel.takim < 75,
    t: 'Antrenmanda gerginlik', d: 'Kıdemli bir oyuncu sana kasten sert girdi, sonra da sırıttı.',
    o: [
      { t: 'Karşılık ver', fx: { takim: -10, ego: 5 }, run: () => { later('kavga2', 1); return chance(.35) ? { fx: { hoca: -8 }, r: 'İtiş kakış çıktı. Hoca ikinizi de antrenmandan attı.' } : { r: 'Üstüne yürüdün, araya girdiler. Soyunma odası buz gibi.' }; } },
      { t: 'Alttan al', fx: { takim: 3, mo: -4 }, r: 'Bir şey demeden kalktın. Bazıları bunu olgunluk saydı.' },
      { t: 'Hocaya söyle', fx: { takim: -6, hoca: 2 }, r: 'Hoca uyardı. Takımda "ispiyoncu" diye fısıldaşıyorlar.' },
    ] },
  { id: 'usta', w: 2.5, cd: 24, if: () => S.age <= 20,
    t: 'Ustadan teklif', d: 'Takımın en tecrübelisi antrenman sonrası yanına geldi: "Kal, sana bir şeyler göstereyim."',
    o: [
      { t: 'Kal ve çalış', fx: { en: -10, takim: 5, zihin: 1, teknik: 1 }, r: 'Bir saat boyunca duruşunu, bakışını düzeltti. Kitaplarda yazmayan şeyler.' },
      { t: 'Yorgunum', fx: { takim: -3 }, r: 'Başını salladı, çantasını aldı.' },
    ] },
  { id: 'maas', neg: 1, w: 2.5, cd: 26, if: () => lowPro() && S.con.wage >= 500,
    t: 'Maaşlar yatmadı', d: 'Kulüp iki aydır ödeme yapmıyor. Soyunma odası kaynıyor.',
    o: [
      { t: 'Sabret', fx: { sad: 8, mo: -5 }, run: () => ({ fx: { para: -S.con.wage * 3 }, r: 'Bekledin. Üç haftalık alacağın hâlâ içeride.' }) },
      { t: 'Arkadaşlarla idmana çıkma', fx: { hoca: -8, takim: 6 }, run: () => chance(.5) ? { r: 'Boykot işe yaradı, başkan parayı buldu.' } : { fx: { para: -S.con.wage * 2 }, r: 'Yönetim oralı olmadı. İki haftalık alacağın yandı.' } },
      { t: 'Federasyona şikâyet et', fx: { hoca: -15, sad: -10 }, r: 'Paranı aldın. Yönetim sana cephe aldı.' },
    ] },
  { id: 'krampon', neg: 1, w: 2.5, cd: 30, if: () => amat() && tier() >= 7,
    t: 'Krampon yırtıldı', d: 'Tek kramponun tabanı açıldı. Kulübün malzeme dolabı boş.',
    o: [
      { t: 'Yenisini al (₺2.500)', if: () => S.money >= 2500, fx: { para: -2500, mo: 3 }, r: 'Yeni krampon ayağına oturdu.' },
      { t: 'Yapıştır, idare et', fx: { mo: -3, hiz: -0.5 }, r: 'Japon yapıştırıcısıyla hallettin. Her adımda aklın ayağında.' },
      { t: 'Ailenden iste', fx: { aile: -6 }, r: 'Baban cebindeki son parayı verdi.' },
    ] },
  { id: 'scout', w: 3, cd: 12, if: () => inTR() && tier() >= 3 && form() >= 6.7 && !S.fl.scout && !!trialClub(),
    t: 'Tribünde biri var', d: 'Bu hafta maçı izlemeye bir üst ligden scout geleceği konuşuluyor.',
    o: [
      { t: 'Kendini göster', fx: { mo: 3 }, run: () => { S.fl.scout = 1; }, r: 'Bir sonraki maçın notu 7,0 ve üstü olursa kapı açılabilir.' },
      { t: 'Aklına takma', fx: { zihin: 0.5 }, run: () => { S.fl.scout = 1; }, r: 'Kendi oyununu oynayacaksın. Yine de biri izliyor olacak.' },
    ] },
  { id: 'deneme', chain: true, if: () => !!trialClub(), prep: () => ({ club: trialClub() }),
    t: 'Deneme antrenmanı', d: c => `${club(c.club).n} scoutu seni beğendi. Kulüp seni deneme antrenmanına çağırıyor: üç çalışmadan en az ikisinde başarılı olursan sözleşme masada.`,
    o: [
      { t: 'Denemeye git', fx: { en: -8 }, sp: 'deneme', r: '' },
      { t: 'Kulübüme sadığım', fx: { sad: 8, hoca: 4, takim: 3 }, r: 'Teşekkür edip reddettin. Kulübünde bunu duydular.' },
    ] },
  { id: 'menajer', w: 3, cd: 30, if: () => S.rep >= 10 && !S.agent,
    t: 'Menajer arayışı', d: 'Adın duyulmaya başladı. Üç menajer seninle çalışmak istiyor. Komisyon maaşından kesilir.',
    o: [
      ...AGENTS.map((a, i) => ({ t: `${a.n} (%${Math.round(a.cut * 100)})`, s: a.d, run: () => { S.agent = { ...AGENTS[i] }; }, r: `${a.n} artık menajerin. Teklifler ve ücretler buna göre şekillenecek.` })),
      { t: 'Şimdilik menajersiz', r: 'Kendi işini kendin göreceksin.' },
    ] },
  { id: 'basin', w: 2.5, cd: 16, if: () => S.con.wage >= 8000,
    t: 'Röportaj', d: 'Muhabir mikrofonu uzattı: "Bu sezonki hedefin ne?"',
    o: [
      { t: 'Takım ne isterse', fx: { takim: 4, taraf: 2 }, r: 'Mütevazı cevabın soyunma odasında beğenildi.' },
      { t: 'Gol krallığı ve şampiyonluk', fx: { taraf: 6, ego: 4, fol: 400 }, r: 'Manşet oldun. Şimdi bunu sahada göstermen gerek.' },
      { t: 'Burası bana küçük geliyor', fx: { taraf: -10, sad: -10, ego: 8, fol: 1500, hoca: -6 }, r: 'Sosyal medya yıkıldı. Kulüpte kimse yüzüne bakmıyor.' },
    ] },
  { id: 'rakip', w: 2, cd: 30, if: () => !!S.rival,
    t: 'Eski rakip', d: () => `${S.rival.n} (${S.rival.c}) bir röportajda senin için "onunla aynı kefeye konmam" demiş.`,
    o: [
      { t: 'Cevabı sahada ver', fx: { zihin: 1, prof: 3, mo: 4 }, r: 'Ekran görüntüsünü dolabının kapağına astın.' },
      { t: 'Sosyal medyadan cevap ver', fx: { ego: 5, fol: 800 }, run: () => ({ fx: { fol: Math.round(S.fol * 0.08) }, r: 'Atışma gündem oldu. Takipçin arttı, hoca hoşlanmadı.' }) },
      { t: 'Umursama', fx: { mo: -2 }, r: 'Geçtin gittin. İçinde bir yer hâlâ sızlıyor.' },
    ] },
  { id: 'dilbar', must: true, cd: 20, if: () => !!S.fl.dilBar,
    t: 'Dil bariyeri', d: 'Yeni ülkende taktik toplantılarını yarım anlıyorsun. Hoca sabırsız.',
    o: [
      { t: 'Özel öğretmen tut', if: () => S.money >= 40000, fx: { para: -40000, dil: 35, hoca: 4 }, run: () => { delete S.fl.dilBar; }, r: 'Her akşam ders. Birkaç haftada soyunma odası şakalarını anlamaya başladın.' },
      { t: 'Tercümanla idare et', fx: { hoca: -10, takim: -6 }, run: () => { delete S.fl.dilBar; }, r: 'İdare ediyorsun ama takımla aranda cam var.' },
    ] },
  { id: 'milli_tercih', must: true, once: true, if: () => S.fl.gurbet && OVR() >= 58,
    t: 'İki forma', d: 'Aynı hafta iki telefon: Almanya alt yaş milli takımı da Türkiye de seni istiyor. Seçim kalıcı.',
    o: [
      { t: 'Türkiye', fx: { taraf: 8, aile: 10 }, run: () => { S.nat = 'TR'; }, r: 'Ay-yıldızlı formayı seçtin. Baban telefonda ağladı.' },
      { t: 'Almanya', fx: { rep: 3, aile: -10 }, run: () => { S.nat = 'DE'; }, r: 'Almanya\'yı seçtin. Memlekette karışık tepkiler var.' },
    ] },

  // ---------- şöhret ve para ----------
  { id: 'sponsor', w: 3, cd: 20, if: () => S.fol >= 2000 && S.spon.length < 2,
    prep: () => { const f = S.fol; return f < 50000 ? { n: 'Yerel spor mağazası', wk: nice(1200 + f * 0.05) } : f < 1e6 ? { n: 'Ulusal spor markası', wk: nice(f * 0.25) } : { n: 'Küresel krampon markası', wk: nice(Math.min(6e6, f * 0.4)) }; },
    t: 'Sponsorluk teklifi', d: c => `${c.n} seninle bir sezonluk anlaşma istiyor: haftada ${fmt(c.wk)}.`,
    o: [
      { t: 'İmzala', run: c => { S.spon.push({ n: c.n, wk: c.wk, until: absWeek() + 38 }); }, r: 'İmzalar atıldı.' },
      { t: 'Daha fazlasını iste', run: c => { if (chance(.5)) { const w = nice(c.wk * 1.3); S.spon.push({ n: c.n, wk: w, until: absWeek() + 38 }); return { r: `Kabul ettiler: haftada ${fmt(w)}.` }; } return { r: 'Marka başka bir oyuncuyla anlaştı.' }; } },
      { t: 'Reddet', r: 'Teklifi geri çevirdin.' },
    ] },
  { id: 'viral', chain: true, cd: 20, t: 'Golün viral oldu', d: 'Son maçtaki performansın her yerde dönüyor.',
    o: [{ t: 'Keyfini çıkar', run: () => ({ fx: { fol: Math.round(Math.min(2e6, S.fol * 0.25 + 500)), mo: 6, ego: 3 } }), r: 'Telefonun susmuyor.' }] },
  { id: 'linc', neg: 1, w: 2, cd: 24, if: () => !(S.fl.kalkan > absWeek()) && S.fol >= 5000 && (form() < 6.2 || S.hid.ego > 60),
    t: 'Linç', d: 'Eski bir paylaşımın bağlamından koparılıp gündem oldu. Yorumlar acımasız.',
    o: [
      { t: 'Özür dile', fx: { taraf: 5, mo: -4 }, run: () => ({ fx: { fol: -Math.round(S.fol * 0.03) } }), r: 'Açıklama yaptın, ortalık yatıştı.' },
      { t: 'Sert cevap ver', fx: { taraf: -8, ego: 5, mo: -2 }, run: () => ({ fx: { fol: Math.round(S.fol * 0.06) } }), r: 'Ateşe benzin döktün. Takipçin arttı, saygınlığın azaldı.' },
      { t: 'Sessiz kal', fx: { mo: -6 }, r: 'Üç gün sonra herkes başka konuya geçti.' },
    ] },
  { id: 'bahis', neg: 1, w: 1.5, once: true, if: () => S.fol >= 50000,
    t: 'Kolay para', d: () => `Yasa dışı bir bahis sitesi tek hikâye paylaşımı için ${fmt(nice(wref() * 8))} öneriyor.`,
    o: [
      { t: 'Paylaş, parayı al', run: () => { later('bahis_sonuc', ri(6, 14)); return { fx: { para: nice(wref() * 8), prof: -8 } }; }, r: 'Para hesabında. Kimse bir şey demedi. Şimdilik.' },
      { t: 'Reddet', fx: { prof: 5 }, r: 'Mesajı sildin.' },
    ] },
  { id: 'bahis_sonuc', chain: true, t: 'Soruşturma', d: 'Federasyon, yasa dışı bahis reklamı nedeniyle hakkında dosya açtı.',
    o: [{ t: 'Savunmanı ver', run: () => { S.ban = 5; S.banR = 'Disiplin cezası'; return { fx: { para: -nice(wref() * 10), rep: -8, taraf: -10, hoca: -8 } }; }, r: 'Beş hafta men ve para cezası aldın. Sponsorlar tedirgin.' }] },
  { id: 'sike', neg: 1, w: 1.2, cd: 60, if: () => inTR() && tier() >= 3 && S.week >= 28,
    t: 'Otoparkta bir adam', d: () => `Rakip kulübe yakın biri kolunu omzuna attı: "Bu hafta biraz ağırdan al. ${fmt(nice(Math.max(15000, wref() * 12)))} nakit."`,
    o: [
      { t: 'Kabul et', run: () => { S.fl.sike = (S.fl.sike || 0) + 1; later('sike_sonuc', ri(10, 30)); return { fx: { para: nice(Math.max(15000, wref() * 12)), prof: -20, sad: -10 } }; }, r: 'Zarfı aldın. Maçta "kötü gününde" görüneceksin. Bu sır seninle yaşayacak.' },
      { t: 'Reddet', fx: { prof: 8 }, r: 'Kolunu ittin, yürüdün.' },
      { t: 'Reddet ve bildir', fx: { prof: 10, rep: 3, mo: -3 }, r: 'Federasyona bildirdin. Bazıları seni kahraman, bazıları muhbir sayıyor.' },
    ] },
  { id: 'sike_sonuc', chain: true, t: 'Şike soruşturması', d: 'Bir telefon dinlemesi ortaya çıktı. Adın dosyada.',
    o: [{ t: 'İfadeye git', run: () => {
      if (chance(.45)) return { r: 'Delil yetersizliğinden takipsizlik çıktı. Ucuz kurtuldun.' };
      if ((S.fl.sike || 0) >= 2) { S.over = 'Şike nedeniyle ömür boyu men cezası aldın.'; return { r: 'İkinci kez yakalandın. Ömür boyu men.' }; }
      S.ban = 20; S.banR = 'Şike cezası';
      return { fx: { rep: -25, taraf: -30, hoca: -25, aile: -15, mo: -20 }, r: 'Yirmi hafta men cezası aldın. Adın bu lekeyle anılacak.' };
    } }] },
  { id: 'doping', neg: 1, w: 1.2, once: true, if: () => S.age >= 29 || S.inj >= 4,
    t: 'Mucize takviye', d: 'Tanımadığın bir "kondisyoner" yanına geldi: "Testte çıkmaz. Üç ayda beş yaş gençleşirsin."',
    o: [
      { t: 'Kullan', fx: { hiz: 3, guc: 3, prof: -15 }, run: () => { later('doping_sonuc', ri(8, 24)); }, r: 'Bacaklarında yıllardır hissetmediğin bir güç var.' },
      { t: 'Uzak dur', fx: { prof: 5 }, r: 'Kartını çöpe attın.' },
    ] },
  { id: 'doping_sonuc', chain: true, t: 'Doping kontrolü', d: 'Maç sonrası rastgele kontrole seçildin.',
    o: [{ t: 'Numuneni ver', run: () => { if (chance(.6)) return { r: 'Sonuç temiz çıktı. Derin bir nefes aldın.' }; S.ban = 30; S.banR = 'Doping cezası'; return { fx: { rep: -30, taraf: -25, hiz: -3, guc: -3, mo: -20 }, r: 'Test pozitif. Otuz hafta men.' }; } }] },
  { id: 'yatirim', w: 2, cd: 40, if: () => S.money >= 300000,
    prep: () => ({ a: nice(S.money * 0.25) }),
    t: 'Ortaklık teklifi', d: c => `Çocukluk arkadaşın kafe açıyor, senden ${fmt(c.a)} ortaklık istiyor: "Bir yılda ikiye katlarız."`,
    o: [
      { t: 'Yatır', run: c => { later('yatirim_sonuc', 20, { a: c.a }); return { fx: { para: -c.a, ark: 8 } }; }, r: 'Parayı verdin. Tabelada adın bile var.' },
      { t: 'Yarısını yatır', run: c => { later('yatirim_sonuc', 20, { a: Math.round(c.a / 2) }); return { fx: { para: -Math.round(c.a / 2), ark: 3 } }; }, r: 'Temkinli girdin.' },
      { t: 'Arkadaşla iş olmaz', fx: { ark: -8 }, r: 'Bozuldu ama belli etmedi.' },
    ] },
  { id: 'yatirim_sonuc', chain: true, t: 'Kafenin hesabı', d: 'Yatırım yaptığın kafenin ilk bilançosu geldi.',
    o: [{ t: 'Hesaba bak', run: c => chance(.5) ? { fx: { para: Math.round(c.a * 2.2), ark: 6 }, r: 'İşler tıkırında. Payını kârıyla aldın.' } : { fx: { ark: -15, mo: -8 }, r: 'Kafe battı. Para da gitti, arkadaşlık da yara aldı.' } }] },
  { id: 'poker', neg: 1, w: 2, cd: 20, if: () => S.con.wage >= 8000,
    t: 'Poker gecesi', d: 'Takım arkadaşları kamp otelinde masa kurdu. "Gel, iki el at."',
    o: [
      { t: 'Otur', fx: { takim: 5, prof: -4, en: -6 }, run: () => { const v = Math.round(rnd(-2.5, 1.8) * wref()); return { fx: { para: v }, r: v >= 0 ? 'Şansın yaver gitti.' : 'Kaybettin. Sabaha karşı odana döndün.' }; } },
      { t: 'İyi geceler', fx: { takim: -2, prof: 2 }, r: 'Erkenden yattın.' },
    ] },
  { id: 'bagis', w: 2, cd: 50, if: () => S.con.wage >= 50000,
    t: 'İlk kulübün', d: () => `Top oynamaya başladığın mahalle kulübü malzeme alamıyor. ${fmt(nice(wref() * 2))} yeter.`,
    o: [
      { t: 'Gönder', if: () => S.money >= nice(wref() * 2), run: () => ({ fx: { para: -nice(wref() * 2), rep: 2, taraf: 4, aile: 5, mo: 5 } }), r: 'Çocuklar yeni formalarla fotoğraf yolladı.' },
      { t: 'Şimdi olmaz', fx: { mo: -2 }, r: 'Mesajı cevapsız bıraktın.' },
    ] },
  { id: 'hayran', w: 2, cd: 20, if: () => S.rel.taraf >= 35,
    t: 'Tel örgünün ardında', d: 'Maç çıkışı küçük bir çocuk formanı istiyor. Kulüp yenisini maaşından kesiyor.',
    o: [
      { t: 'Formanı ver', fx: { taraf: 6, mo: 4, para: -800 }, r: 'Çocuğun yüzünü unutamayacaksın.' },
      { t: 'İmza at, geç', fx: { taraf: 1 }, r: 'İmzayı attın, otobüse bindin.' },
    ] },
  { id: 'agir', must: true, cd: 4, if: () => !!S.fl.agir,
    t: 'Doktorun odasında', d: 'Ön çapraz bağında hasar var. Önünde dört yol var; her birinin bedeli başka.',
    o: [
      { t: 'Ameliyat ol', run: () => { delete S.fl.agir; S.inj = 16; }, fx: { mo: -8 }, r: 'On altı hafta yoksun, ama dizin eskisi gibi olacak.' },
      { t: 'Ünlü cerraha git', if: () => S.money >= nice(Math.max(150000, wref() * 20)), run: () => { delete S.fl.agir; S.inj = 11; return { fx: { para: -nice(Math.max(150000, wref() * 20)), mo: -4 } }; }, r: 'Yurt dışında, sporcuların gittiği klinikte ameliyat oldun. On bir haftada, tam sağlam dönüyorsun.' },
      { t: 'Ameliyatsız tedavi', run: () => { delete S.fl.agir; S.inj = 7; if (chance(.6)) S.fl.kronik = 1; return chance(.4) ? { fx: { hiz: -4, guc: -2 }, r: 'Yedi haftada döneceksin ama diz tam toparlamadı. Hızından kalıcı kaybın var; sakatlık kronikleşebilir.' } : { r: 'Yedi haftada döneceksin. Şimdilik şanslısın, ama diz bir gün yine hatırlatabilir.' }; } },
      { t: 'İğneyle oyna', run: () => { delete S.fl.agir; S.inj = 2; S.fl.kronik = 1; }, fx: { hiz: -2, hoca: 4, taraf: 4 }, r: 'İki haftaya sahadasın. Takım sana minnettar; dizin değil. Sakatlık kronikleşti: her maç risk, her sezon biraz hız.' },
    ] },
  { id: 'kas', chain: true, if: () => S.inj >= 3,
    t: 'Dönüş takvimi', d: 'Kas yırtığın iyileşiyor. Sağlık ekibi iki plan sundu.',
    o: [
      { t: 'Tam iyileş', fx: { prof: 2 }, r: 'Acele yok. Tam hazır olunca döneceksin.' },
      { t: 'Erken dön', run: () => { S.inj = Math.max(1, S.inj - 2); if (chance(.35)) { S.inj += 5; return { fx: { mo: -6 }, r: 'İlk idmanda aynı yer yine gitti. Dönüş daha da uzadı.' }; } return { fx: { hoca: 3 }, r: 'İki hafta kazandın. Şimdilik sorun yok.' }; } },
    ] },
  { id: 'kronik', must: true, cd: 30, if: () => !!S.fl.kronik && !S.fl.kronikOp && S.week >= 33,
    t: 'Diz yine konuşuyor', d: 'Sezon bitiyor. Doktor net: "Bu diz böyle gitmez. Sezon arasında ameliyat edelim; yoksa her yıl biraz daha hız kaybedersin."',
    o: [
      { t: 'Sezon arası ameliyat', run: () => { S.fl.kronikOp = 1; }, r: 'Karar verildi. Sezon biter bitmez masaya yatacaksın; yeni sezonun ilk sekiz haftası yok.' },
      { t: 'Böyle devam', fx: { mo: 2 }, r: 'Ertelemeyi seçtin. Diz her maç kendini hatırlatacak.' },
    ] },
  { id: 'kap_prim', w: 2.5, cd: 26, if: () => !!S.fl.kaptan,
    t: 'Prim pazarlığı', d: 'Takım seni sözcü seçti: "Kaptan, yönetimle primleri sen konuş."',
    o: [
      { t: 'Yönetime bastır', fx: { takim: 8, hoca: -3 }, run: () => (chance(.55) ? { fx: { para: nice(wref() * 3) }, r: 'Masaya yumruğunu vurdun; primler arttı. Soyunma odası seni omuzlarda taşıdı.' } : { fx: { taraf: -2 }, r: 'Yönetim geri adım atmadı. Ama takım, arkasında durduğunu gördü.' }) },
      { t: 'Orta yolu bul', fx: { takim: 3, hoca: 2 }, r: 'İki taraf da biraz verdi. Kimse tam mutlu değil, kimse küs değil.' },
      { t: 'Yönetimin yanında dur', fx: { takim: -8, hoca: 4 }, r: '"Kulübün durumu belli" dedin. Soyunma odasında bakışlar değişti.' },
    ] },
  { id: 'kap_kavga', w: 2.5, cd: 22, if: () => !!S.fl.kaptan && S.mates.length >= 4, prep: () => ({ a: S.mates[1].n, b: S.mates[3].n }),
    t: 'Antrenmanda itiş kakış', d: c => `${c.a} ile ${c.b} idmanda birbirine girdi. Herkes kaptana bakıyor.`,
    o: [
      { t: 'Araya gir, barıştır', run: () => (chance(.5 + S.rel.takim / 300) ? (S.mates.forEach(m => { m.b = clamp(m.b + 4, 0, 100); }), { fx: { takim: 6 }, r: 'İkisini soyunma odasına çektin. On dakika sonra el sıkışıp çıktılar.' }) : { fx: { takim: -2 }, r: 'Araya girdin ama laf sana da döndü. Ortam gergin kaldı.' }) },
      { t: 'Hocaya bildir', fx: { hoca: 3, takim: -4 }, r: 'Hoca ikisine de ceza kesti. Takım, kaptanın ispiyon ettiğini konuşuyor.' },
      { t: 'Karışma', fx: { takim: -3 }, r: 'Kendi aralarında çözsünler dedin. Çözmediler; soğukluk sürüyor.' },
    ] },
  { id: 'kap_genc', w: 2.5, cd: 20, if: () => !!S.fl.kaptan && S.mates.length >= 4, prep: () => ({ a: S.mates[3].n }),
    t: 'Genç oyuncu çökmüş', d: c => `${c.a} üst üste kötü oynadı, tribün ıslıkladı. Soyunma odasında tek başına oturuyor.`,
    o: [
      { t: 'İdmandan sonra onunla kal', fx: { en: -8, takim: 4 }, run: () => { S.mates[3].b = clamp(S.mates[3].b + 12, 0, 100); }, r: 'Bir saat şut çektiniz, bir saat konuştunuz. Çocuğun omuzları dikleşti.' },
      { t: 'İki kelam et', fx: { takim: 2 }, r: '"Hepimiz o yollardan geçtik" dedin. Başını salladı.' },
      { t: 'Kendi derdine düşsün', fx: { takim: -2 }, r: 'Futbol sert iş. Ayakta kalan kalır.' },
    ] },
  { id: 'kap_ceza', w: 2, cd: 24, if: () => !!S.fl.kaptan,
    t: 'Ceza kasası', d: 'Takımın yıldızı idmana yine geç geldi. Ceza kasası kaptanda; karar senin.',
    o: [
      { t: 'Cezayı kes', fx: { hoca: 4, takim: -2, prof: 2 }, r: 'Kural herkese kural. Yıldız surat astı ama hoca seni takdir etti.' },
      { t: 'Bu seferlik affet', fx: { takim: 3, hoca: -3 }, r: 'Göz yumdun. Takım rahatladı, hoca kaşlarını çattı.' },
      { t: 'Cezayı cebinden öde', if: () => S.money >= nice(Math.max(500, wref())), run: () => ({ fx: { para: -nice(Math.max(500, wref())), takim: 6 } }), r: 'Kasaya parayı kendin koydun. "Kaptan" lafı bugün başka söylendi.' },
    ] },
  { id: 'kap_al', must: true, cd: 20, if: () => !!S.fl.kaptan && (S.rel.takim < 30 || S.rel.hoca < 28),
    t: 'Pazubent', d: 'Hoca seni odasına çağırdı: "Takım seni dinlemiyor. Pazubendi başkasına vereceğim."',
    o: [
      { t: 'Kabullen', fx: { mo: -8, prof: 2 }, run: () => { delete S.fl.kaptan; }, r: 'Pazubendi masaya bıraktın. Belki bir gün geri alırsın.' },
      { t: 'İtiraz et', fx: { mo: -6, hoca: -5, ego: 3 }, run: () => { delete S.fl.kaptan; }, r: 'Sesini yükselttin; karar değişmedi. Kapıyı çarpıp çıktın.' },
    ] },
  { id: 'bakim', w: 2, once: true, if: () => S.age >= 31 && S.money >= 500000,
    t: 'Dizler eskisi gibi değil', d: 'Fizyoterapistin kişiye özel bakım programı öneriyor: ₺500.000.',
    o: [
      { t: 'Programa başla', fx: { para: -500000 }, run: () => { S.fl.bakim = 1; }, r: 'Yaşa bağlı düşüşün artık daha yavaş olacak.' },
      { t: 'Gerek yok', r: 'Vücudunu dinleyerek devam edeceksin.' },
    ] },
  // ---------- zincirler ve gerçek hayat ----------
  { id: 'kavga2', chain: true, t: 'Yardımcı antrenörün odası', d: 'Yardımcı antrenör kapıyı kapattı: "Dünkü olay neydi? Hocaya gitmeden ben çözmek istiyorum."',
    o: [
      { t: 'Özür dile', fx: { takim: 6, ego: -3, hoca: 2 }, r: 'Elini sıktı: "Konu kapandı." Soyunma odasında da duyuldu.' },
      { t: '"O başlattı"', fx: { hoca: -4, takim: -3 }, run: () => { if (chance(.4)) later('kavga3', 1); }, r: 'Başını iki yana salladı. Not aldığını gördün.' },
      { t: '"Sana hesap vermem"', fx: { ego: 6, takim: -4 }, run: () => { later('kavga3', 1); }, r: 'Odadan çıktın. Arkandan telefona sarıldı.' },
    ] },
  { id: 'kavga3', chain: true, t: 'Hocanın kararı', d: 'Teknik direktör seni herkesin önünde çağırdı: "Bu takımda kimse takımdan büyük değil."',
    o: [
      { t: 'Cezayı kabul et', run: () => { S.ban = Math.max(S.ban, 1); S.banR = 'Kadro dışı'; return { fx: { para: -nice(wref() * 2), hoca: -6 } }; }, r: 'İki haftalık maaş cezası ve bir maç kadro dışı.' },
      { t: 'Takımdan özür dile', fx: { takim: 8, hoca: 3, ego: -5 }, r: 'Ayağa kalkıp özür diledin. Hoca başıyla onayladı.' },
      { t: 'Basına konuş', fx: { hoca: -20, taraf: -6, ego: 6, fol: 2500 }, run: () => { S.tstat = 'istek'; S.fl.istek = 1; }, r: 'Manşet oldun. Kulüp seni satış listesine koydu.' },
    ] },
  { id: 'dolandirici', neg: 1, w: 2.5, cd: 80, if: () => S.agent && !own('musavir') && S.money > wref() * 20 && (S.agent.pw < .5 || S.hid.prof < 45),
    prep: () => ({ a: nice(S.money * .18) }),
    t: 'Hesapta bir tuhaflık', d: c => `Banka dökümüne baktın: menajerin ${S.agent.n}, hesabından ${fmt(c.a)} tutarını "danışmanlık" diye kendi şirketine aktarmış.`,
    o: [
      { t: 'Dava aç', run: c => { const ag = S.agent.n; S.agent = null; return chance(.65) ? { fx: { para: -Math.round(c.a * .15), mo: -4 }, r: `Avukat tuttun, paranı geri aldın. ${ag} ile yollar ayrıldı.` } : { fx: { para: -Math.round(c.a * 1.15), mo: -8 }, r: `Dava uzadı, para gitti. ${ag} ortadan kayboldu.` }; } },
      { t: 'Yüzleş', run: c => { if (chance(.5)) return { fx: { para: -Math.round(c.a * .5) }, r: 'Kızardı, bozardı. Yarısını geri yatırdı; "muhasebe hatası" dedi.' }; S.agent = null; return { fx: { para: -c.a, mo: -6 }, r: 'Telefonlarını açmıyor. Para da menajer de gitti.' }; } },
      { t: 'Sessiz kal', run: c => { later('dolandirici2', ri(18, 30)); return { fx: { para: -c.a, mo: -3 } }; }, r: 'Görmezden geldin. Belki bir açıklaması vardır.' },
    ] },
  { id: 'dolandirici2', chain: true, if: () => !!S.agent, prep: () => ({ a: nice(Math.max(S.money, wref() * 10) * .3) }),
    t: 'Bu kez imzan var', d: c => `Bankadan aradılar: adına ${fmt(c.a)} kredi çekilmiş. Evraklarda senin imzan var; ama sen atmadın.`,
    o: [
      { t: 'Savcılığa git', run: c => { S.agent = null; return { fx: { para: -Math.round(c.a * .4), mo: -8, rep: -2 } }; }, r: 'Menajerin gözaltına alındı. Borcun bir kısmı yine de sana kaldı.' },
      { t: 'İyi bir avukat tut', run: c => { S.agent = null; return { fx: { para: -Math.round(c.a * .12), mo: -4 } }; }, r: 'Sahtecilik kanıtlandı. Menajersiz kaldın ama temizsin.' },
    ] },
  { id: 'gec', neg: 1, w: 2, cd: 20, if: () => S.hid.prof < 45,
    t: 'Geç kaldın', d: 'Alarmı duymamışsın. Antrenmana yirmi dakika geç girdin; herkes ısınmayı bitirmişti.',
    o: [
      { t: 'Özür dile, ekstra koş', fx: { hoca: -2, en: -8, prof: 4 }, r: 'Antrenmandan sonra tek başına on tur attın.' },
      { t: 'Trafik de', fx: { hoca: -6, prof: -2 }, r: 'Hoca inanmadı. Kasaya para cezası yazıldı.' },
    ] },
  { id: 'paparazzi', neg: 1, w: 3, cd: 20, if: () => !(S.fl.kalkan > absWeek()) && S.fl.gecew && absWeek() - S.fl.gecew <= 2 && S.fol >= 3000,
    t: 'Gece çıkışı manşette', d: 'Gece kulübü çıkışında çekilmiş bir fotoğrafın her yerde. Altında: "Maç öncesi böyle hazırlanıyor."',
    o: [
      { t: 'Açıklama yap', fx: { taraf: 3, hoca: -2, mo: -3 }, r: '"İzin günümdü" dedin. Ortalık yatıştı.' },
      { t: 'Umursama', fx: { hoca: -8, taraf: -5, ego: 3 }, r: 'Susman kabul sayıldı. Hoca toplantıda yüzüne bile bakmadı.' },
      { t: 'Sahada cevap ver', fx: { prof: 4, mo: 2 }, r: 'Telefonu kapattın. Bu hafta herkes seni izleyecek.' },
    ] },
  { id: 'vergi', neg: 1, w: 2, cd: 60, if: () => S.con.wage >= 150000 && !own('musavir'), prep: () => ({ a: nice(S.con.wage * 6) }),
    t: 'Vergi dairesinden yazı', d: c => `Beyanname eksik verilmiş. Ödeme emri: ${fmt(c.a)}.`,
    o: [
      { t: 'Öde, kapat', run: c => ({ fx: { para: -c.a, mo: -3 } }), r: 'Ödedin. Bir daha olmasın diye not aldın.' },
      { t: 'Mali müşavirle anlaş', run: c => { if (!own('musavir')) S.assets.push('musavir'); return { fx: { para: -Math.round(c.a * .7) } }; }, r: 'Müşavir cezayı indirdi, sezon sonuna kadar hesaplarına o bakacak.' },
    ] },
  { id: 'hirsiz', neg: 1, w: 2, cd: 60, if: () => (own('ev') || own('villa') || own('spor')) && !own('guvenlik'), prep: () => ({ a: nice(Math.max(50000, S.money * .05)) }),
    t: 'Deplasmandayken', d: c => `Sen maçtayken evine girmişler. Kayıp: ${fmt(c.a)} değerinde eşya.`,
    o: [
      { t: 'Güvenlik sistemi kur', run: c => { if (!own('guvenlik')) S.assets.push('guvenlik'); const g = SHOP.find(x => x.id === 'guvenlik'); return { fx: { para: -c.a - Math.round(g.yr / 2), mo: -4 } }; }, r: 'Kamera, alarm, özel güvenlik. Bir daha olmaz.' },
      { t: 'Polise bırak', run: c => ({ fx: { para: -c.a, mo: -8, aile: -3 } }), r: 'Tutanak tutuldu. Ailen tedirgin.' },
    ] },
  { id: 'akraba', w: 2, cd: 30, if: () => S.money >= 2000000, prep: () => ({ a: nice(S.money * .04) }),
    t: 'Uzaktan bir akraba', d: c => `Yıllardır görmediğin bir kuzenin aradı: düğün yapacakmış, ${fmt(c.a)} borç istiyor.`,
    o: [
      { t: 'Ver gitsin', run: c => ({ fx: { para: -c.a, aile: 6 } }), r: 'Geri gelmeyeceğini ikiniz de biliyorsunuz.' },
      { t: 'Yarısını ver', run: c => ({ fx: { para: -Math.round(c.a / 2), aile: 2 } }), r: 'Teşekkür etti ama sesi soğuktu.' },
      { t: 'Nazikçe reddet', fx: { aile: -6 }, r: 'Sülalede "parayı bulunca değişti" diye konuşuluyor.' },
    ] },
  { id: 'yalnizlik', neg: 1, w: 3, cd: 24, if: () => !inTR() && S.rel.aile < 55,
    t: 'Uzun akşamlar', d: 'Yabancı bir şehirde akşamlar uzun. Telefonda annenin sesi titriyor.',
    o: [
      { t: 'Aileni yanına getir', if: () => S.money >= 150000, fx: { para: -150000, aile: 18, mo: 10 }, r: 'Bir aylığına geldiler. Ev ilk kez ev gibi koktu.' },
      { t: 'Her akşam görüntülü ara', fx: { aile: 6, mo: 2 }, r: 'Ekrandan da olsa aynı sofradasınız.' },
      { t: 'Kendini işe ver', fx: { prof: 4, mo: -6 }, r: 'Tesiste ışıkları sen kapatıyorsun artık.' },
    ] },
  { id: 'tukenmislik', neg: 1, must: true, cd: 16, if: () => S.mo < 28,
    t: 'Sabah kalkamıyorsun', d: 'Antrenman çantası kapının önünde duruyor. İçinden gitmek gelmiyor.',
    o: [
      { t: 'Psikoloğa git', if: () => S.money >= 8000, fx: { para: -8000, mo: 18 }, r: 'Konuşmak iyi geldi. "Bu da oyunun parçası" dedi.' },
      { t: 'Hocadan izin iste', fx: { mo: 12, hoca: -3 }, run: () => { S.fl.skip = 1; }, r: 'Bu hafta maçta yoksun. Nefes aldın.' },
      { t: 'Dişini sık', fx: { mo: -2, prof: 2 }, run: () => chance(.15) ? { fx: { inj: 2 }, r: 'Kafan başka yerdeyken bileğin döndü.' } : { r: 'Gittin. Bugün de geçti.' } },
    ] },
  { id: 'reklam', w: 2.5, cd: 30, if: () => S.fol >= 100000, prep: () => ({ a: nice(S.fol * 1.2) }),
    t: 'Reklam filmi', d: c => `Bir içecek markası iki günlük çekim için ${fmt(c.a)} öneriyor. Çekim maç haftasına denk geliyor.`,
    o: [
      { t: 'Kabul et', run: c => ({ fx: { para: c.a, en: -16, fol: Math.round(S.fol * .03), hoca: -2 } }), r: 'Yirmi kez aynı cümleyi söyledin. Para hesapta.' },
      { t: 'Sezon sonuna ertele', fx: { prof: 3, hoca: 2 }, r: 'Marka bekleyeceğini söyledi. Hoca duyunca memnun oldu.' },
    ] },
  { id: 'vakif', w: 2, once: true, if: () => S.money >= 20000000 && S.rep >= 60,
    t: 'Geriye bir şey bırakmak', d: 'Memleketinde çocuklar için ücretsiz bir futbol okulu açma fikri aklından çıkmıyor.',
    o: [
      { t: 'Okulu kur', fx: { para: -5000000, rep: 6, taraf: 8, aile: 6, mo: 10 }, r: 'Açılışta ilk topu sen attın. Tabelada adın yazıyor.' },
      { t: 'Emeklilikten sonra', r: 'Fikri bir kenara not ettin.' },
    ] },
  // ---------- ağ: tanışmalar. Kiminle yakınlaştığın ileride kapı açar ya da başını yakar ----------
  { id: 'net_abi', w: 3, once: true, if: () => amat(), prep: () => ({ n: rname('TR') }),
    t: 'Kahvehanede bir masa', d: c => `Köşedeki masada herkesin ayağa kalkıp selamladığı biri var: şehrin eski kulüp başkanı ${c.n}. Seni yanına çağırdı.`,
    o: [
      { t: 'Otur, dinle', fx: { zihin: 0.5 }, run: c => { netAdd('abi', c.n, null, 36); }, r: 'Bir saat eski maçları anlattı. Giderken "bir şeye ihtiyacın olursa ara" dedi.' },
      { t: 'Selam ver, geç', r: 'Başıyla selamladı. Fırsat geçti gitti.' },
    ] },
  { id: 'net_yildiz', w: 2.5, once: true, if: () => S.rep >= 16 || S.car.caps > 0,
    prep: () => { const o = OVR(), pool = []; for (const lid in S.lg) for (const id of S.lg[lid].t) if (S.rt[id] >= o + 4 && S.rt[id] <= o + 16) pool.push(id); return { n: rname('TR'), org: pool.length ? pick(pool) : null }; },
    t: 'Yardım maçı', d: c => `Bir yardım maçında ${c.org ? club(c.org).n : 'büyük bir kulüp'} forması giyen ${c.n} ile aynı takımdasın. Maçtan sonra yanına geldi: "Sende iş var."`,
    o: [
      { t: 'Tavsiye iste', fx: { mo: 5 }, run: c => { netAdd('yildiz', c.n, c.org, 34); }, r: 'Numarasını verdi: "Takıldığın yerde ara." Bu tanışıklık bir gün kapı açabilir.' },
      { t: 'Fotoğraf çektir', run: c => { netAdd('yildiz', c.n, c.org, 14); return { fx: { fol: Math.round(300 + S.fol * .08), ego: 2 } }; }, r: 'Fotoğraf çok beğeni aldı. Seni hatırlar mı, belli değil.' },
      { t: 'Çekindin', fx: { mo: -2 }, r: 'Yanına gidemedin. Otobüste kendine kızdın.' },
    ] },
  { id: 'net_gazeteci', w: 2, once: true, if: () => S.fol >= 3000, prep: () => ({ n: rname('TR') }),
    t: 'Kartvizit', d: c => `Antrenman çıkışında spor yazarı ${c.n} kartını uzattı: "Hikâyeni ben yazmak isterim."`,
    o: [
      { t: 'Kartı al, ara', run: c => { netAdd('gazeteci', c.n, null, 30); }, r: 'Bir kahve içtiniz. Basında bir dostun var artık.' },
      { t: 'Mesafeli dur', fx: { prof: 2 }, r: 'Teşekkür edip yürüdün.' },
    ] },
  { id: 'net_doktor', w: 2, once: true, if: () => S.car.apps + S.st.apps >= 20, prep: () => ({ n: 'Dr. ' + rname('TR') }),
    t: 'Muayenede', d: c => `Rutin kontrolde ${c.n} koşu bandındaki değerlerine baktı: "Bu vücuda iyi bakarsan uzun oynarsın. Bana uğra."`,
    o: [
      { t: 'Düzenli git', run: c => { netAdd('doktor', c.n, null, 32); }, r: 'Artık bir telefon uzağında bir hekimin var.' },
      { t: 'Gerek yok', r: 'Kendini iyi hissediyorsun.' },
    ] },
  { id: 'net_scout', w: 2.5, once: true, if: () => inTR() && tier() >= 3 && form() >= 7, prep: () => ({ n: rname('TR') }),
    t: 'Tribündeki adam', d: c => `Üç maçtır aynı koltukta oturan adam otoparkta yanına geldi: ${c.n}, serbest çalışan bir scout.`,
    o: [
      { t: 'Numaranı ver', run: c => { netAdd('scout', c.n, null, 30); }, r: '"Raporunu doğru yerlere ulaştırırım" dedi.' },
      { t: 'Menajerime yönlendir', if: () => !!S.agent, fx: { prof: 2 }, r: 'İşi menajerine bıraktın.' },
      { t: 'İlgilenme', r: 'Omuz silkip gitti.' },
    ] },
  { id: 'net_marka', w: 2, once: true, if: () => S.fol >= 20000, prep: () => ({ n: rname('TR') }),
    t: 'Davet', d: c => `Bir spor markasının lansmanına çağrıldın. Pazarlama müdürü ${c.n} seninle özel ilgilendi.`,
    o: [
      { t: 'Sohbeti ilerlet', run: c => { netAdd('marka', c.n, null, 30); }, r: 'Kartlar değişildi. Sponsorluk kapısı aralandı.' },
      { t: 'Erken ayrıl', fx: { en: 4 }, r: 'Yarın antrenman var.' },
    ] },
  { id: 'net_golge', neg: 1, w: 2.5, once: true, if: () => S.hid.prof < 50 || (S.fl.gecew && absWeek() - S.fl.gecew <= 3), prep: () => ({ n: rname('TR').split(' ')[0] + ' Abi' }),
    t: 'Masana biri oturdu', d: c => `Gece kulübünde herkesin "${c.n}" dediği biri masana oturdu. Hesabı o ödedi: "Senin gibi delikanlıya her kapı açılır."`,
    o: [
      { t: 'Uzak dur', fx: { prof: 4 }, r: 'Teşekkür edip kalktın.' },
      { t: 'Tanışıklığı sürdür', fx: { prof: -4, mo: 3 }, run: c => { netAdd('golge', c.n, null, 40); }, r: 'Numaralar alındı. Bu adamın açtığı kapılar kolay paraya çıkar, belki başka yerlere de.' },
    ] },
];

const EV = {}; for (const e of EVENTS) EV[e.id] = e;

function inst(ev, ctx) {
  const now = absWeek();
  S.cd[ev.id] = now + (ev.cd || 12);
  if (ev.once) S.fl['e_' + ev.id] = 1;
  const c = ctx || (ev.prep ? ev.prep() : {});
  return { ev, ctx: c, title: ev.t, text: typeof ev.d === 'function' ? ev.d(c) : ev.d, opts: ev.o.filter(o => !o.if || o.if(c)) };
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
  let f = { ...(opt.fx || {}) }, r = opt.r || '';
  if (opt.run) { const x = opt.run(inst0.ctx) || {}; if (x.fx) f = { ...f, ...x.fx }; if (x.r) r = x.r; }
  return { r, ch: fx(f), sp: opt.sp };
}
