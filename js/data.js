// Toprak Saha — veri tabanı (2025/26 sezonu kadroları baz alınmıştır)
// Kulüp satırı: "Ad|güç|renk kodu (2 harf)"
import { tt } from './i18n.js';
import { KLEAGUES, KXIDS, KWIDS, KPROV, KNAMES, KNATIONS, KWORLD, KCUPS, KDERBY } from './kadin.js';
export { KPROV, KWORLD };

export const PAL = {
  R: '#d81e2c', W: '#f2f2f2', K: '#161616', G: '#0f8a4b', B: '#1c57c4', N: '#12265e',
  Y: '#ffd21a', O: '#f47b20', M: '#7b1c3a', P: '#5b2c83', S: '#62b5e5', T: '#18a8a0',
  C: '#c9a227', E: '#8a8f98',
};

const T = s => s.trim().split('\n').map(x => x.trim()).filter(Boolean);

export const COUNTRIES = {
  TR: 'Türkiye', EN: 'İngiltere', ES: 'İspanya', DE: 'Almanya', IT: 'İtalya',
  FR: 'Fransa', NL: 'Hollanda', PT: 'Portekiz', SA: 'Suudi Arabistan',
};

export const LEAGUES = [
  { id: 'tr1', c: 'TR', name: 'Elit Lig', tier: 1, teams: T(`
    Galata|82|RY
    Kadıköy|81|NY
    Beşiktaş|77|KW
    Trabzon|76|MS
    Başakşehir|73|ON
    Samsun|73|RW
    Göztepe|72|YR
    Eyüp|70|PY
    Rize|69|GB
    Kasımpaşa|69|BW
    Konya|69|GW
    Alanya|69|OG
    Kocaeli|68|GK
    Antalya|68|RW
    Gaziantep|68|RK
    Kayseri|67|YR
    Ankara G|67|RK
    Karagümrük|67|RK`) },
  { id: 'tr2', c: 'TR', name: '1. Lig', tier: 2, teams: T(`
    Sivas|65|RW
    Bodrum|64|GW
    Hatay|63|MW
    Bandırma|63|MW
    Çorum|63|RK
    Erzurum|63|BW
    Esenler|63|GY
    Diyarbakır|63|GR
    Sakarya|62|GK
    İstanbul|62|YK
    Iğdır|62|GW
    Bolu|61|RW
    Keçiören|61|MW
    Manisa|61|KW
    Pendik|61|RW
    Ümraniye|61|RW
    Van|60|RK
    Sarıyer|59|NW
    Serik|59|GW
    Adana D|58|SN`) },
  { id: 'tr3', c: 'TR', name: '2. Lig', tier: 3, teams: T(`
    Bursa|60|GW
    Ankara A|59|NY
    Batman|57|RW
    Muğla|57|GW
    Mardin|57|RN
    Menemen|56|YN
    Elazığ|56|MW
    Aksaray|56|RG
    Adana|55|OW
    Şanlıurfa|55|YG
    Kastamonu|55|RK
    İzmir O|55|RN
    Isparta|55|PG
    Gebze|55|PW
    Fethiye|55|BW
    Kırklareli|54|GW
    Soma|54|KW
    Malatya|52|YK`) },
  { id: 'tr4', c: 'TR', name: '3. Lig', tier: 4, teams: T(`
    İzmir A|53|KW
    Karşıyaka|53|GR
    Eskişehir|53|RK
    Denizli|52|GK
    Balıkesir|51|RW
    Giresun|51|GW
    Kütahya|50|BW
    Ordu|50|PW
    Düzce|50|RB
    İnegöl|50|MW
    Zonguldak|49|RN
    Çorlu|49|RW
    Silivri|49|RB
    Ayvalık|49|YR
    Nazilli|49|KW
    Uşak|48|RK
    Edirne|48|RY
    Pazar|48|GW`) },
  { id: 'tr5', c: 'TR', name: 'Bölgesel Amatör Lig', tier: 5, teams: T(`
    Darıca|47|RW
    Kartal|47|RB
    Tepecik|46|BW
    Hendek|45|GW
    Gölcük|45|RW
    Yalova|45|BW
    Çengelköy|45|RN
    Tekirdağ|45|RN
    Sapanca|44|GY
    Bozüyük|44|BY
    Lüleburgaz|44|GW
    Moda|44|NW
    Çanakkale|44|RW
    Bilecik|43|RW
    Mudanya|43|BW
    Orhangazi|43|RW`) },
  { id: 'tr6', c: 'TR', name: 'Süper Amatör Lig', tier: 6, gen: true },
  { id: 'tr7', c: 'TR', name: '1. Amatör Lig', tier: 7, gen: true },
  { id: 'tr8', c: 'TR', name: '2. Amatör Lig', tier: 8, gen: true },
  { id: 'en1', c: 'EN', name: 'İngiltere Ligi', tier: 1, teams: T(`
    Liverpool|89|RW
    Londra A|88|RW
    Manchester C|88|SW
    Chelsea|85|BW
    Newcastle|83|KW
    Birmingham V|83|MS
    Manchester U|82|RK
    Tottenham|82|WN
    Brighton|80|BW
    Nottingham|80|RW
    Londra P|79|RB
    Bournemouth|79|RK
    Brentford|78|RW
    Fulham|78|WK
    Everton|77|BW
    West Ham|77|MS
    Wolverhampton|75|OK
    Leeds|75|WY
    Sunderland|75|RW
    Burnley|74|MS`) },
  { id: 'es1', c: 'ES', name: 'İspanya Ligi', tier: 1, teams: T(`
    Madrid|90|WC
    Barcelona|90|BM
    Madrid A|86|RW
    Bilbao|82|RW
    Villarreal|82|YN
    Sevilla B|80|GW
    San Sebastián|79|BW
    Sevilla|77|WR
    Valencia|77|WK
    Vigo|77|SW
    Girona|76|RW
    Pamplona|76|RN
    Vallecas|76|WR
    Mallorca|75|RK
    Getafe|75|BW
    Barcelona E|74|BW
    Vitoria|74|BW
    Valencia L|73|NM
    Elche|73|WG
    Oviedo|72|BW`) },
  { id: 'de1', c: 'DE', name: 'Almanya Ligi', tier: 1, teams: T(`
    Münih|90|RW
    Dortmund|85|YK
    Leverkusen|84|RK
    Leipzig|83|WR
    Frankfurt|81|KR
    Stuttgart|80|WR
    Freiburg|78|RK
    Mainz|77|RW
    Mönchengladbach|77|WG
    Wolfsburg|77|GW
    Bremen|76|GW
    Hoffenheim|76|BW
    Augsburg|75|RG
    Berlin U|75|RW
    Köln|74|WR
    Hamburg|74|BW
    St. Pauli|73|MW
    Heidenheim|72|RB`) },
  { id: 'it1', c: 'IT', name: 'İtalya Ligi', tier: 1, teams: T(`
    Milano I|88|BK
    Napoli|86|SW
    Torino J|85|KW
    Milano|84|RK
    Bergamo|83|BK
    Roma|83|MO
    Lazio|80|SW
    Bologna|80|RN
    Floransa|79|PW
    Como|77|BW
    Torino|76|MW
    Udine|75|KW
    Cenova|75|RN
    Sassuolo|74|GK
    Cagliari|73|RN
    Parma|73|YB
    Lecce|72|YR
    Verona|72|YN
    Pisa|71|KB
    Cremona|71|RE`) },
  { id: 'fr1', c: 'FR', name: 'Fransa Ligi', tier: 1, teams: T(`
    Paris|90|NR
    Marsilya|82|WS
    Monaco|82|RW
    Lille|80|RN
    Lyon|80|WB
    Nice|79|RK
    Lens|78|RY
    Strasbourg|78|BW
    Rennes|77|RK
    Toulouse|75|PW
    Brest|75|RW
    Nantes|73|YG
    Auxerre|73|WB
    Paris F|73|NW
    Lorient|72|OK
    Angers|71|KW
    Le Havre|71|SN
    Metz|71|MW`) },
  { id: 'nl1', c: 'NL', name: 'Hollanda Ligi', tier: 1, teams: T(`
    Eindhoven|80|RW
    Amsterdam|79|WR
    Rotterdam|79|RW
    Alkmaar|76|RW
    Twente|75|RW
    Utrecht|75|RW
    Nijmegen|71|RG
    Deventer|71|RY
    Heerenveen|70|BW
    Rotterdam S|70|RW
    Groningen|70|GW
    Sittard|69|YG
    Almelo|68|KW
    Zwolle|68|BW
    Breda|68|YK
    Volendam|67|OK
    Rotterdam E|67|RK
    Velsen|66|WB`) },
  { id: 'pt1', c: 'PT', name: 'Portekiz Ligi', tier: 1, teams: T(`
    Lizbon|82|RW
    Lizbon S|82|GW
    Porto|81|BW
    Braga|77|RW
    Guimarães|73|WK
    Famalicão|71|BW
    Ponta Delgada|71|RW
    Estoril|70|YB
    Lizbon C|70|KW
    Vila do Conde|70|GW
    Moreira|70|GW
    Barcelos|70|RB
    Arouca|69|YB
    Funchal|68|KW
    Amadora|68|RG
    Vila das Aves|67|RW
    Tondela|67|GY
    Alverca|67|RB`) },
  { id: 'sa1', c: 'SA', name: 'Suudi Ligi', tier: 1, teams: T(`
    Riyad H|82|BW
    Riyad N|81|YB
    Cidde İ|81|YK
    Cidde A|81|GW
    Hubar|77|RY
    Riyad Ş|74|WK
    Neom|73|TW
    Dammam|73|GR
    Bureyde|72|YB
    Hasa|70|BG
    Seyhat|70|YG
    Mecmaa|69|OB
    Hamis Muşeyt|69|RY
    Riyad R|68|RK
    Ras K|68|YK
    Necran|67|SW
    Uneyze|66|GW
    Ras H|66|RY`) },
];

export const CLUBS = {};
export const LMAP = {};
for (const L of LEAGUES) {
  LMAP[L.id] = L;
  if (L.gen) continue;
  L.ids = L.teams.map((t, i) => {
    const [n, r, c] = t.split('|');
    const id = L.id + '_' + i;
    CLUBS[id] = { n, r: +r, c1: PAL[c[0]], c2: PAL[c[1]] };
    return id;
  });
}

// Liglerimizin dışındaki Avrupa kulüpleri: yalnızca Kıta Ligi ve Kıta Kupası'nda görünürler
export const XIDS = T(`
  Glasgow C|73|GW|İskoçya
  Glasgow R|72|BW|İskoçya
  Brugge|75|BK|Belçika
  Anderlecht|72|PW|Belçika
  Brüksel U|73|YB|Belçika
  Genk|71|BW|Belçika
  Salzburg|72|RW|Avusturya
  Graz|70|KW|Avusturya
  Donetsk|73|OK|Ukrayna
  Kiev|71|WB|Ukrayna
  Pire|74|RW|Yunanistan
  Selanik|72|KW|Yunanistan
  Atina P|71|GW|Yunanistan
  Belgrad K|72|RW|Sırbistan
  Belgrad P|69|KW|Sırbistan
  Kopenhag|72|WB|Danimarka
  Midtjylland|71|KR|Danimarka
  Bern|71|YK|İsviçre
  Basel|71|RB|İsviçre
  Zagreb|72|BW|Hırvatistan
  Prag S|74|RW|Çekya
  Prag|73|MW|Çekya
  Plzen|71|RB|Çekya
  Budapeşte|71|GW|Macaristan
  Bodø|73|YK|Norveç
  Malmö|70|SW|İsveç
  Ağdam|71|KW|Azerbaycan
  Razgrad|69|GW|Bulgaristan
  Varşova|70|GW|Polonya
  Tel Aviv|70|YB|İsrail
  Edinburgh|68|MW|İskoçya
  Aberdeen|67|RW|İskoçya
  Gent|70|BW|Belçika
  Anvers|70|RW|Belçika
  Linz|68|KW|Avusturya
  Viyana|69|GW|Avusturya
  Atina A|71|YK|Yunanistan
  Selanik A|68|YK|Yunanistan
  Brøndby|69|YB|Danimarka
  Lugano|68|KW|İsviçre
  Cenevre|68|MW|İsviçre
  Split|69|WB|Hırvatistan
  Rijeka|68|WB|Hırvatistan
  Białystok|68|YR|Polonya
  Częstochowa|69|RB|Polonya
  Cluj|68|MW|Romanya
  Trondheim|68|WK|Norveç
  Molde|69|BW|Norveç
  Stockholm D|68|SB|İsveç
  Stockholm H|68|GW|İsveç
  Helsinki|66|BW|Finlandiya
  Dublin|65|GW|İrlanda
  Lefkoşa O|66|GW|Kıbrıs
  Lefkoşa A|66|YB|Kıbrıs
  Bratislava|68|SW|Slovakya
  Ljubljana|66|GW|Slovenya
`).map((t, i) => { const [n, r, c, x] = t.split('|'), id = 'x_' + i; CLUBS[id] = { n, r: +r, c1: PAL[c[0]], c2: PAL[c[1]], x }; return id; });

// Kıtalararası Kupa rakipleri: Kıta Ligi'ni kazanan kulübün karşısına çıkar
export const WIDS = T(`
  Rio F|80|RK|Brezilya
  São Paulo P|79|GW|Brezilya
  Buenos Aires R|78|WR|Arjantin
  Buenos Aires B|77|NY|Arjantin
  Monterrey|74|NW|Meksika
  Kahire|72|RW|Mısır
  Saitama|70|RK|Japonya
`).map((t, i) => { const [n, r, c, x] = t.split('|'), id = 'w_' + i; CLUBS[id] = { n, r: +r, c1: PAL[c[0]], c2: PAL[c[1]], x }; return id; });

// İl bazlı amatör ligler. l: elle yazılmış 3 kademe, d: ilçelerden üretilir.
export const PROV = {
  'Sakarya': { l: [
    ['Serdivanspor', 'Erenler Gençlikspor', 'Arifiyespor', 'Karasuspor', 'Akyazıspor', 'Geyvespor', 'Pamukovaspor', 'Ferizlispor', 'Söğütlüspor', 'Kaynarcaspor', 'Kocaalispor', 'Adapazarı Yıldırımspor', 'Sakarya Tekspor', 'Güneşlerspor'],
    ['Taraklıspor', 'Karapürçekspor', 'Yenikentspor', 'Ozanlarspor', 'Hızırtepespor', 'Serdivan Belediyespor', 'Akyazı Gençlikspor', 'Karasu Gençlerbirliği', 'Geyve Belediyespor', 'Kırkpınarspor', 'Erenler İdman Yurdu', 'Arifiye Kalaycıspor', 'Kazımpaşaspor', 'Kuruçeşmespor'],
    ['Tığcılarspor', 'Mithatpaşa Gençlik', 'Yağcılarspor', 'Semerciler SK', 'Tepekumspor', 'Hanlıspor', 'Dağdibispor', 'Beşköprüspor', 'Şeker Mahallesi SK', 'Bağlarspor', 'Camili Gençlik', 'Küpçülerspor', 'Çark Gücü', 'Ada Gençlikspor'],
  ] },
  'İstanbul': { d: ['Kadıköy', 'Üsküdar', 'Bakırköy', 'Zeytinburnu', 'Bağcılar', 'Esenyurt', 'Maltepe', 'Tuzla', 'Bayrampaşa', 'Gaziosmanpaşa', 'Kağıthane', 'Avcılar', 'Sultanbeyli', 'Çekmeköy'] },
  'Ankara': { d: ['Çankaya', 'Mamak', 'Yenimahalle', 'Etimesgut', 'Sincan', 'Altındağ', 'Pursaklar', 'Gölbaşı', 'Polatlı', 'Çubuk', 'Beypazarı', 'Kahramankazan', 'Elmadağ', 'Akyurt'] },
  'İzmir': { d: ['Bornova', 'Buca', 'Konak', 'Bayraklı', 'Çiğli', 'Gaziemir', 'Balçova', 'Narlıdere', 'Torbalı', 'Menderes', 'Aliağa', 'Bergama', 'Ödemiş', 'Urla'] },
  'Bursa': { d: ['Nilüfer', 'Osmangazi', 'Yıldırım', 'Gemlik', 'Mustafakemalpaşa', 'Karacabey', 'Orhaneli', 'İznik', 'Yenişehir', 'Kestel', 'Gürsu', 'Keles', 'Harmancık', 'Büyükorhan'] },
  'Kocaeli': { d: ['İzmit', 'Derince', 'Körfez', 'Kartepe', 'Başiskele', 'Karamürsel', 'Kandıra', 'Çayırova', 'Dilovası', 'Hereke', 'Yarımca', 'Değirmendere', 'Bahçecik', 'Tavşancıl'] },
  'Trabzon': { d: ['Ortahisar', 'Akçaabat', 'Araklı', 'Of', 'Yomra', 'Arsin', 'Vakfıkebir', 'Sürmene', 'Maçka', 'Beşikdüzü', 'Çarşıbaşı', 'Tonya', 'Düzköy', 'Şalpazarı'] },
  'Adana': { d: ['Seyhan', 'Çukurova', 'Yüreğir', 'Sarıçam', 'Ceyhan', 'Kozan', 'İmamoğlu', 'Karataş', 'Pozantı', 'Karaisalı', 'Feke', 'Saimbeyli', 'Tufanbeyli', 'Yumurtalık'] },
  'Antalya': { d: ['Muratpaşa', 'Konyaaltı', 'Kepez', 'Manavgat', 'Kemer', 'Kumluca', 'Finike', 'Kaş', 'Demre', 'Elmalı', 'Korkuteli', 'Gazipaşa', 'Aksu', 'Döşemealtı'] },
  'Konya': { d: ['Selçuklu', 'Meram', 'Karatay', 'Ereğli', 'Akşehir', 'Beyşehir', 'Seydişehir', 'Çumra', 'Cihanbeyli', 'Ilgın', 'Kulu', 'Karapınar', 'Bozkır', 'Sarayönü'] },
  'Samsun': { d: ['İlkadım', 'Atakum', 'Canik', 'Tekkeköy', 'Bafra', 'Çarşamba', 'Terme', 'Vezirköprü', 'Havza', 'Kavak', 'Ladik', 'Alaçam', 'Ayvacık', 'Salıpazarı'] },
  'Adıyaman': { d: ["Adıyaman", "Besni", "Çelikhan", "Gerger", "Gölbaşı", "Kahta", "Samsat", "Sincik", "Tut"] },
  'Afyonkarahisar': { d: ["Afyon", "Sandıklı", "Dinar", "Bolvadin", "Emirdağ", "Şuhut", "Çay", "İhsaniye", "İscehisar", "Sultandağı", "Dazkırı", "Sinanpaşa", "Başmakçı", "Çobanlar"] },
  'Ağrı': { d: ["Ağrı", "Doğubayazıt", "Patnos", "Diyadin", "Eleşkirt", "Hamur", "Taşlıçay", "Tutak"] },
  'Amasya': { d: ["Amasya", "Merzifon", "Suluova", "Taşova", "Gümüşhacıköy", "Göynücek", "Hamamözü"] },
  'Artvin': { d: ["Artvin", "Hopa", "Arhavi", "Borçka", "Şavşat", "Yusufeli", "Ardanuç", "Murgul", "Kemalpaşa"] },
  'Aydın': { d: ["Efeler", "Nazilli", "Söke", "Kuşadası", "Didim", "Çine", "Germencik", "İncirliova", "Koçarlı", "Kuyucak", "Sultanhisar", "Bozdoğan", "Karacasu", "Yenipazar"] },
  'Balıkesir': { d: ["Karesi", "Altıeylül", "Bandırma", "Edremit", "Ayvalık", "Burhaniye", "Gönen", "Bigadiç", "Dursunbey", "Erdek", "Havran", "İvrindi", "Susurluk", "Sındırgı"] },
  'Bilecik': { d: ["Bilecik", "Bozüyük", "Osmaneli", "Pazaryeri", "Söğüt", "Gölpazarı", "İnhisar", "Yenipazar"] },
  'Bingöl': { d: ["Bingöl", "Genç", "Solhan", "Karlıova", "Kiğı", "Adaklı", "Yayladere", "Yedisu"] },
  'Bitlis': { d: ["Bitlis", "Tatvan", "Ahlat", "Adilcevaz", "Güroymak", "Hizan", "Mutki"] },
  'Bolu': { d: ["Bolu", "Gerede", "Mengen", "Mudurnu", "Göynük", "Yeniçağa", "Dörtdivan", "Seben", "Kıbrıscık"] },
  'Burdur': { d: ["Burdur", "Bucak", "Gölhisar", "Yeşilova", "Tefenni", "Ağlasun", "Altınyayla", "Çavdır", "Çeltikçi", "Karamanlı", "Kemer"] },
  'Çanakkale': { d: ["Çanakkale", "Biga", "Çan", "Gelibolu", "Ezine", "Ayvacık", "Bayramiç", "Lapseki", "Yenice", "Eceabat", "Gökçeada", "Bozcaada"] },
  'Çankırı': { d: ["Çankırı", "Ilgaz", "Çerkeş", "Şabanözü", "Orta", "Kurşunlu", "Eldivan", "Atkaracalar", "Kızılırmak", "Korgun", "Yapraklı", "Bayramören"] },
  'Çorum': { d: ["Çorum", "Sungurlu", "Osmancık", "İskilip", "Alaca", "Bayat", "Kargı", "Mecitözü", "Ortaköy", "Oğuzlar", "Dodurga", "Laçin", "Uğurludağ", "Boğazkale"] },
  'Denizli': { d: ["Merkezefendi", "Pamukkale", "Çivril", "Acıpayam", "Tavas", "Sarayköy", "Honaz", "Buldan", "Çal", "Bozkurt", "Çameli", "Güney", "Kale", "Serinhisar"] },
  'Diyarbakır': { d: ["Bağlar", "Kayapınar", "Yenişehir", "Sur", "Bismil", "Ergani", "Silvan", "Çermik", "Çınar", "Lice", "Hani", "Hazro", "Kulp", "Dicle"] },
  'Edirne': { d: ["Edirne", "Keşan", "Uzunköprü", "İpsala", "Havsa", "Meriç", "Enez", "Lalapaşa", "Süloğlu"] },
  'Elazığ': { d: ["Elazığ", "Kovancılar", "Karakoçan", "Palu", "Baskil", "Maden", "Sivrice", "Arıcak", "Keban", "Alacakaya", "Ağın"] },
  'Erzincan': { d: ["Erzincan", "Tercan", "Üzümlü", "Refahiye", "Kemah", "İliç", "Çayırlı", "Kemaliye", "Otlukbeli"] },
  'Erzurum': { d: ["Yakutiye", "Palandöken", "Aziziye", "Oltu", "Horasan", "Pasinler", "Hınıs", "Tortum", "İspir", "Aşkale", "Karayazı", "Narman", "Tekman", "Şenkaya"] },
  'Eskişehir': { d: ["Odunpazarı", "Tepebaşı", "Sivrihisar", "Çifteler", "Seyitgazi", "Alpu", "Mihalıççık", "Mahmudiye", "Beylikova", "İnönü", "Günyüzü", "Han", "Mihalgazi", "Sarıcakaya"] },
  'Gaziantep': { d: ["Şahinbey", "Şehitkamil", "Nizip", "İslahiye", "Nurdağı", "Oğuzeli", "Araban", "Yavuzeli", "Karkamış"] },
  'Giresun': { d: ["Giresun", "Bulancak", "Espiye", "Görele", "Tirebolu", "Şebinkarahisar", "Keşap", "Dereli", "Eynesil", "Alucra", "Piraziz", "Yağlıdere", "Güce", "Çanakçı"] },
  'Gümüşhane': { d: ["Gümüşhane", "Kelkit", "Şiran", "Torul", "Kürtün", "Köse"] },
  'Hakkari': { d: ["Hakkari", "Yüksekova", "Şemdinli", "Çukurca", "Derecik"] },
  'Hatay': { d: ["Antakya", "İskenderun", "Defne", "Dörtyol", "Kırıkhan", "Reyhanlı", "Samandağ", "Arsuz", "Payas", "Altınözü", "Hassa", "Erzin", "Belen", "Yayladağı"] },
  'Isparta': { d: ["Isparta", "Yalvaç", "Eğirdir", "Şarkikaraağaç", "Gelendost", "Keçiborlu", "Senirkent", "Sütçüler", "Gönen", "Uluborlu", "Atabey", "Aksu", "Yenişarbademli"] },
  'Mersin': { d: ["Yenişehir", "Mezitli", "Toroslar", "Akdeniz", "Tarsus", "Erdemli", "Silifke", "Anamur", "Mut", "Gülnar", "Bozyazı", "Aydıncık", "Çamlıyayla"] },
  'Kars': { d: ["Kars", "Sarıkamış", "Kağızman", "Selim", "Digor", "Arpaçay", "Akyaka", "Susuz"] },
  'Kastamonu': { d: ["Kastamonu", "Tosya", "Taşköprü", "İnebolu", "Cide", "Araç", "Daday", "Devrekani", "Küre", "Abana", "Bozkurt", "Azdavay", "Çatalzeytin", "Hanönü"] },
  'Kayseri': { d: ["Melikgazi", "Kocasinan", "Talas", "Develi", "Yahyalı", "Bünyan", "İncesu", "Pınarbaşı", "Tomarza", "Sarız", "Yeşilhisar", "Hacılar", "Felahiye", "Sarıoğlan"] },
  'Kırklareli': { d: ["Kırklareli", "Lüleburgaz", "Babaeski", "Vize", "Pınarhisar", "Demirköy", "Pehlivanköy", "Kofçaz"] },
  'Kırşehir': { d: ["Kırşehir", "Kaman", "Mucur", "Çiçekdağı", "Akpınar", "Akçakent", "Boztepe"] },
  'Kütahya': { d: ["Kütahya", "Tavşanlı", "Simav", "Gediz", "Emet", "Altıntaş", "Domaniç", "Hisarcık", "Aslanapa", "Dumlupınar", "Pazarlar", "Şaphane", "Çavdarhisar"] },
  'Malatya': { d: ["Battalgazi", "Yeşilyurt", "Doğanşehir", "Akçadağ", "Darende", "Hekimhan", "Pütürge", "Yazıhan", "Arapgir", "Arguvan", "Kuluncak", "Kale", "Doğanyol"] },
  'Manisa': { d: ["Şehzadeler", "Yunusemre", "Akhisar", "Turgutlu", "Salihli", "Soma", "Alaşehir", "Saruhanlı", "Kula", "Kırkağaç", "Demirci", "Sarıgöl", "Gördes", "Selendi"] },
  'Kahramanmaraş': { d: ["Onikişubat", "Dulkadiroğlu", "Elbistan", "Afşin", "Türkoğlu", "Pazarcık", "Göksun", "Andırın", "Çağlayancerit", "Nurhak", "Ekinözü"] },
  'Mardin': { d: ["Artuklu", "Kızıltepe", "Midyat", "Nusaybin", "Derik", "Mazıdağı", "Ömerli", "Savur", "Dargeçit", "Yeşilli"] },
  'Muğla': { d: ["Menteşe", "Bodrum", "Fethiye", "Marmaris", "Milas", "Dalaman", "Ortaca", "Köyceğiz", "Datça", "Ula", "Yatağan", "Seydikemer", "Kavaklıdere"] },
  'Muş': { d: ["Muş", "Bulanık", "Malazgirt", "Varto", "Hasköy", "Korkut"] },
  'Nevşehir': { d: ["Nevşehir", "Ürgüp", "Avanos", "Gülşehir", "Hacıbektaş", "Derinkuyu", "Kozaklı", "Acıgöl"] },
  'Niğde': { d: ["Niğde", "Bor", "Ulukışla", "Çiftlik", "Altunhisar", "Çamardı"] },
  'Ordu': { d: ["Altınordu", "Ünye", "Fatsa", "Perşembe", "Korgan", "Kumru", "Gölköy", "Ulubey", "Aybastı", "Akkuş", "Mesudiye", "Gürgentepe", "Çaybaşı", "İkizce"] },
  'Rize': { d: ["Rize", "Çayeli", "Ardeşen", "Pazar", "Fındıklı", "Güneysu", "Kalkandere", "İyidere", "Derepazarı", "Çamlıhemşin", "İkizdere", "Hemşin"] },
  'Siirt': { d: ["Siirt", "Kurtalan", "Pervari", "Baykan", "Şirvan", "Eruh", "Tillo"] },
  'Sinop': { d: ["Sinop", "Boyabat", "Gerze", "Ayancık", "Türkeli", "Durağan", "Erfelek", "Dikmen", "Saraydüzü"] },
  'Sivas': { d: ["Sivas", "Şarkışla", "Suşehri", "Zara", "Yıldızeli", "Gemerek", "Kangal", "Divriği", "Gürün", "Hafik", "İmranlı", "Koyulhisar", "Ulaş", "Altınyayla"] },
  'Tekirdağ': { d: ["Süleymanpaşa", "Çorlu", "Çerkezköy", "Ergene", "Kapaklı", "Malkara", "Saray", "Hayrabolu", "Şarköy", "Muratlı", "Marmaraereğlisi"] },
  'Tokat': { d: ["Tokat", "Erbaa", "Turhal", "Niksar", "Zile", "Reşadiye", "Almus", "Pazar", "Artova", "Yeşilyurt", "Sulusaray", "Başçiftlik"] },
  'Tunceli': { d: ["Tunceli", "Pertek", "Hozat", "Ovacık", "Mazgirt", "Çemişgezek", "Nazımiye", "Pülümür"] },
  'Şanlıurfa': { d: ["Haliliye", "Eyyübiye", "Karaköprü", "Siverek", "Viranşehir", "Suruç", "Birecik", "Akçakale", "Ceylanpınar", "Harran", "Hilvan", "Bozova", "Halfeti"] },
  'Uşak': { d: ["Uşak", "Banaz", "Eşme", "Sivaslı", "Ulubey", "Karahallı"] },
  'Van': { d: ["İpekyolu", "Tuşba", "Edremit", "Erciş", "Özalp", "Muradiye", "Başkale", "Gevaş", "Çaldıran", "Gürpınar", "Saray", "Bahçesaray", "Çatak"] },
  'Yozgat': { d: ["Yozgat", "Sorgun", "Akdağmadeni", "Boğazlıyan", "Yerköy", "Sarıkaya", "Çekerek", "Şefaatli", "Çayıralan", "Kadışehri", "Saraykent", "Aydıncık", "Çandır", "Yenifakılı"] },
  'Zonguldak': { d: ["Zonguldak", "Ereğli", "Çaycuma", "Devrek", "Alaplı", "Gökçebey", "Kilimli", "Kozlu"] },
  'Aksaray': { d: ["Aksaray", "Ortaköy", "Eskil", "Gülağaç", "Güzelyurt", "Sarıyahşi", "Ağaçören", "Sultanhanı"] },
  'Bayburt': { d: ["Bayburt", "Aydıntepe", "Demirözü"] },
  'Karaman': { d: ["Karaman", "Ermenek", "Ayrancı", "Kazımkarabekir", "Başyayla", "Sarıveliler"] },
  'Kırıkkale': { d: ["Kırıkkale", "Yahşihan", "Keskin", "Delice", "Sulakyurt", "Balışeyh", "Bahşılı", "Karakeçili", "Çelebi"] },
  'Batman': { d: ["Batman", "Kozluk", "Sason", "Beşiri", "Gercüş", "Hasankeyf"] },
  'Şırnak': { d: ["Şırnak", "Cizre", "Silopi", "İdil", "Uludere", "Beytüşşebap", "Güçlükonak"] },
  'Bartın': { d: ["Bartın", "Amasra", "Kurucaşile", "Ulus"] },
  'Ardahan': { d: ["Ardahan", "Göle", "Çıldır", "Hanak", "Posof", "Damal"] },
  'Iğdır': { d: ["Iğdır", "Aralık", "Tuzluca", "Karakoyunlu"] },
  'Yalova': { d: ["Yalova", "Çınarcık", "Altınova", "Armutlu", "Çiftlikköy", "Termal"] },
  'Karabük': { d: ["Karabük", "Safranbolu", "Eskipazar", "Yenice", "Eflani", "Ovacık"] },
  'Kilis': { d: ["Kilis", "Musabeyli", "Elbeyli", "Polateli"] },
  'Osmaniye': { d: ["Osmaniye", "Kadirli", "Düziçi", "Bahçe", "Toprakkale", "Hasanbeyli", "Sumbas"] },
  'Düzce': { d: ["Düzce", "Akçakoca", "Kaynaşlı", "Gölyaka", "Gümüşova", "Cumayeri", "Çilimli", "Yığılca"] }
};

export const NAMES = {
  TR: { f: ['Ahmet', 'Mehmet', 'Mustafa', 'Emre', 'Burak', 'Arda', 'Kerem', 'Yusuf', 'Ozan', 'Cengiz', 'Hakan', 'Oğuzhan', 'Enes', 'Barış', 'Umut', 'Kaan', 'Berkay', 'Semih', 'Volkan', 'Tolga', 'Eren', 'Furkan', 'Onur', 'Serkan', 'Uğur', 'Çağlar', 'Doğukan', 'İsmail', 'Salih', 'Batuhan'],
    l: ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Aydın', 'Öztürk', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özdemir', 'Polat', 'Aktaş', 'Güneş', 'Bulut', 'Tekin', 'Korkmaz', 'Özkan', 'Şimşek', 'Uçar', 'Bozkurt', 'Karaca', 'Sarı', 'Tunç'] },
  EN: { f: ['Jack', 'Harry', 'Luke', 'Mason', 'Declan', 'Kyle', 'Callum', 'Ollie', 'Reece', 'Jordan'], l: ['Walker', 'Shaw', 'Mills', 'Barnes', 'Cooper', 'Hughes', 'Bennett', 'Foster', 'Reid', 'Palmer'] },
  ES: { f: ['Álvaro', 'Sergio', 'Pablo', 'Iker', 'Dani', 'Marc', 'Hugo', 'Javi', 'Adrián', 'Mikel'], l: ['García', 'Moreno', 'Navarro', 'Ortega', 'Ruiz', 'Vidal', 'Castro', 'Molina', 'Serrano', 'Herrera'] },
  DE: { f: ['Lukas', 'Jonas', 'Felix', 'Leon', 'Max', 'Niklas', 'Tim', 'Julian', 'Florian', 'Kai'], l: ['Müller', 'Becker', 'Wagner', 'Hoffmann', 'Schulz', 'Krüger', 'Vogt', 'Brandt', 'Keller', 'Richter'] },
  IT: { f: ['Luca', 'Marco', 'Matteo', 'Andrea', 'Davide', 'Simone', 'Nicolò', 'Federico', 'Alessio', 'Giacomo'], l: ['Rossi', 'Ferrari', 'Bianchi', 'Romano', 'Gallo', 'Conti', 'Greco', 'Marino', 'Rinaldi', 'Barbieri'] },
  FR: { f: ['Hugo', 'Lucas', 'Théo', 'Enzo', 'Mathis', 'Adrien', 'Maxime', 'Rayan', 'Yanis', 'Loïc'], l: ['Martin', 'Bernard', 'Dubois', 'Laurent', 'Girard', 'Fontaine', 'Mercier', 'Lambert', 'Diallo', 'Traoré'] },
  NL: { f: ['Daan', 'Sem', 'Luuk', 'Jesse', 'Thijs', 'Ruben', 'Stijn', 'Noa', 'Mats', 'Joey'], l: ['de Jong', 'Bakker', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder', 'Bos', 'Vos', 'Peters'] },
  PT: { f: ['João', 'Tiago', 'Diogo', 'Rui', 'Gonçalo', 'André', 'Pedro', 'Bruno', 'Nuno', 'Rafael'], l: ['Silva', 'Santos', 'Ferreira', 'Costa', 'Pereira', 'Oliveira', 'Carvalho', 'Gomes', 'Lopes', 'Marques'] },
  SA: { f: ['Salem', 'Fahad', 'Abdullah', 'Saud', 'Nawaf', 'Turki', 'Khalid', 'Yasser', 'Sultan', 'Faisal'], l: ['Al-Dawsari', 'Al-Shehri', 'Al-Ghamdi', 'Al-Harbi', 'Al-Otaibi', 'Al-Qahtani', 'Al-Malki', 'Al-Zahrani', 'Al-Faraj', 'Al-Amri'] },
};

export const ATTR = { sut: tt('Şut'), pas: tt('Pas'), teknik: tt('Teknik'), hiz: tt('Hız'), guc: tt('Güç'), savunma: tt('Savunma'), kafa: tt('Kafa'), zihin: tt('Zihin'), kaleci: tt('Kalecilik') };

// w: genel güç ağırlıkları, m: maç anı ağırlıkları, b: başlangıç bonusu
export const POS = {
  KL: { n: tt('Kaleci'), w: { kaleci: .55, zihin: .2, guc: .1, pas: .08, hiz: .07 }, m: { kurtaris: 56, pas: 14, duvar: 8, penkurtar: 5, cikis: 12, birebir: 10 }, b: { kaleci: 24, zihin: 3 } },
  DF: { n: tt('Defans'), w: { savunma: .35, guc: .18, kafa: .15, hiz: .12, zihin: .12, pas: .08 }, m: { savunma: 38, markaj: 14, kafa: 12, pas: 20, orta: 12, blok: 12 }, b: { savunma: 9, guc: 5, kafa: 4 } },
  OS: { n: tt('Orta Saha'), w: { pas: .3, teknik: .2, zihin: .15, sut: .1, savunma: .1, guc: .08, hiz: .07 }, m: { pas: 26, sut: 14, calim: 12, savunma: 10, markaj: 6, frikik: 7, orta: 10, korner: 7, vole: 2, ribaund: 3, kesme: 10 }, b: { pas: 8, teknik: 5, zihin: 3 } },
  KN: { n: tt('Kanat'), w: { hiz: .25, teknik: .25, pas: .18, sut: .17, zihin: .1, guc: .05 }, m: { calim: 24, pas: 12, sut: 19, kafa: 4, orta: 20, vole: 5, korner: 6, kosu: 9, verkac: 11 }, b: { hiz: 8, teknik: 6, pas: 2 } },
  FV: { n: tt('Forvet'), w: { sut: .3, teknik: .18, hiz: .15, kafa: .12, zihin: .1, guc: .08, pas: .07 }, m: { sut: 30, kafa: 12, calim: 13, pas: 9, penalti: 5, vole: 8, rovesata: 4, orta: 6, kosu: 11, ribaund: 8, asirtma: 8 }, b: { sut: 8, kafa: 4, teknik: 3 } },
};

export const ORIGINS = {
  mahalle: { n: tt('Mahalle Sahası'), d: tt('Toprak sahada büyüdün, kimse seni tanımıyor. En alttan, 2. Amatör Lig\'den başlarsın. Evde para dar.'), tier: 8, at: { teknik: 4, zihin: 3 }, money: 500, fl: { dar: 1 }, pot: 1 },
  okul: { n: tt('Okul Takımı'), d: tt('Beden eğitimi öğretmenin seni fark etti. 1. Amatör Lig\'de başlarsın, okul notların iyi.'), tier: 7, at: { pas: 2, zihin: 2 }, money: 2500, egt: 25 },
  altyapi: { n: tt('Akademi Çıkışlı'), d: tt('Profesyonel bir kulübün akademisinde yetiştin ama sözleşme alamadın. Süper Amatör Lig\'de başlarsın. Ailen uzakta.'), tier: 6, all: 5, money: 4000, pot: 2, rel: { aile: -10 } },
  gurbet: { n: tt('Gurbetçi'), d: tt('Avrupa\'da doğdun, ailen memlekete döndü. Doğduğun ülkenin dilini bilirsin. İleride milli takım tercihi önüne gelir.'), tier: 7, at: { teknik: 3, guc: 3 }, money: 9000, dil: 55, fl: { gurbet: 1 } },
};

export const TRAITS = {
  hirsli: { n: tt('Hırslı'), d: tt('Antrenmandan %15 fazla verim alırsın. Egon da buna eşlik eder.'), hid: { prof: 15, ego: 10 }, tr: 1.15 },
  sakin: { n: tt('Soğukkanlı'), d: tt('Baskı anında elin titremez: maç anları biraz daha yavaş akar.'), at: { zihin: 5 } },
  asi: { n: tt('Asi'), d: tt('Taraftar bayılır, hocalar zorlanır. Top tekniğin doğuştan.'), hid: { ego: 25, prof: -10 }, rel: { taraf: 10, hoca: -6 }, at: { teknik: 3 } },
  lider: { n: tt('Lider'), d: tt('Soyunma odası seni dinler. Kaptanlık yolu açık.'), rel: { takim: 15, hoca: 5 }, at: { zihin: 3 } },
};

export const TRAIN = [
  { id: 'bit', n: tt('Bitiricilik'), a: ['sut', 'kafa'], g: 'sut', pos: ['DF', 'OS', 'KN', 'FV'] },
  { id: 'top', n: tt('Top Tekniği'), a: ['teknik', 'pas'], g: 'pas' },
  { id: 'fiz', n: tt('Fizik'), a: ['hiz', 'guc'], g: 'calim', pos: ['DF', 'OS', 'KN', 'FV'] },
  { id: 'kon', n: tt('Kondisyon'), a: ['hiz', 'guc'], pos: ['KL'] },
  { id: 'sav', n: tt('Savunma'), a: ['savunma', 'kafa'], g: 'savunma', pos: ['DF', 'OS', 'KN', 'FV'] },
  { id: 'kal', n: tt('Kaleci Çalışması'), a: ['kaleci', 'zihin'], g: 'kurtaris', pos: ['KL'] },
  { id: 'zih', n: tt('Zihin'), a: ['zihin'], g: 'penalti', pos: ['DF', 'OS', 'KN', 'FV'] },
  { id: 'ort', n: tt('Orta ve Duran Top'), a: ['pas', 'teknik'], g: 'orta', pos: ['DF', 'OS', 'KN', 'FV'] },
];

// p: tek seferlik fiyat, yr: sezonluk anlaşma bedeli (sezon sonunda biter), e: etkiler
export const SHOP = [
  { id: 'krampon', n: tt('Profesyonel krampon'), d: tt('Maç anlarında küçük beceri artışı.'), p: 12000 },
  { id: 'telefon', n: tt('Yeni telefon'), d: tt('Takipçi artışı hızlanır.'), p: 45000, e: { fol: .5 } },
  { id: 'backer', n: tt('Backer Sport · maç günü tasarımı'), d: tt('Her maç gününe özel afişin hazırlanır, sosyal medyanda paylaşılır. Takipçi ve taraftar ilgisi artar.'), yr: 60000, e: { fol: .25 }, img: 'img/backer.png' },
  { id: 'araba', n: tt('İkinci el araba'), d: tt('Yol yorgunluğu biter. Haftalık enerji +3.'), p: 650000, e: { en: 3 } },
  { id: 'daire', n: tt('Kiralık daire'), d: tt('Kendi düzenin. Enerji +4, moral +4.'), yr: 260000, e: { en: 4, mo: 4 } },
  { id: 'diyet', n: tt('Diyetisyen'), d: tt('Haftalık enerji +5.'), yr: 300000, e: { en: 5 } },
  { id: 'musavir', n: tt('Mali müşavir'), d: tt('Vergi sürprizlerini ve dolandırıcıları uzak tutar.'), yr: 400000 },
  { id: 'guvenlik', n: tt('Ev güvenliği'), d: tt('Hırsızlık riskini kaldırır.'), yr: 250000 },
  { id: 'psikolog', n: tt('Spor psikoloğu'), d: tt('Moralin daha hızlı toparlanır. Moral +6.'), yr: 350000, e: { mo: 6 } },
  { id: 'pt', n: tt('Kişisel antrenör'), d: tt('Antrenman verimi +%20.'), yr: 600000, e: { tr: .2 } },
  { id: 'halisaha', n: tt('Halı saha işletmesi'), d: tt('Haftalık ₺45.000 gelir.'), p: 3000000, e: { inc: 45000 } },
  { id: 'ev', n: tt('Ev satın al'), d: tt('Aile rahat eder. Enerji +3, moral +6.'), p: 6000000, e: { en: 3, mo: 6 } },
  { id: 'spor', n: tt('Spor araba'), d: tt('Göz alıcı. Moral +5, takipçi artışı.'), p: 12000000, e: { mo: 5, fol: .5 } },
  { id: 'kofte', n: tt('Memleket lezzeti dükkânı'), d: tt('Memleketinin meşhur lezzetini satan dükkân. Haftalık ₺240.000 gelir.'), p: 15000000, e: { inc: 240000 }, loc: 1 },
  { id: 'villa', n: tt('Manzaralı villa'), d: tt('Doğanın içinde, sakin bir ev. Enerji +4, moral +8.'), p: 60000000, e: { en: 4, mo: 8 } },
  // ikinci kademe: ilk kademedeki kalıcı her şey alınınca açılır (t2)
  { id: 'muze', t2: 1, n: tt('Kişisel müze'), d: tt('Formaların, kupaların sergide. Takipçi artışı hızlanır.'), p: 60000000, e: { fol: .6 } },
  { id: 'tekne', t2: 1, n: tt('Tekne'), d: tt('Maç sonrası açık deniz. Moral +6.'), p: 90000000, e: { mo: 6 } },
  { id: 'akademi', t2: 1, n: tt('Futbol akademisi'), d: tt('Kendi adını taşıyan okul. Haftalık ₺600.000 gelir, çocuğunun yeteneği hızlı gelişir.'), p: 120000000, e: { inc: 600000 } },
  { id: 'jet', t2: 1, n: tt('Özel uçak payı'), d: tt('Deplasman yorgunluğu biter. Haftalık enerji +6.'), p: 180000000, e: { en: 6 } },
  { id: 'hisse', t2: 1, n: tt('Kulüp hissesi'), d: tt('Bir kulübe ortak oldun. Haftalık ₺2.200.000 gelir.'), p: 250000000, e: { inc: 2200000 } },
  { id: 'yali', t2: 1, n: tt('Boğaz\'da yalı'), d: tt('Şehrin en iyi adresi. Enerji +3, moral +10.'), p: 400000000, e: { en: 3, mo: 10 } },
];

// Memleket lezzeti: ilin meşhur yemeğine ya da ürününe göre işletme adı ve açıklaması (yoksa genel lokanta)
export const YEREL = {
  'Adana': [tt('Adana kebap salonu'), tt('Acılı, zırhla çekilmiş kebap. Kuyruk kapıya kadar.')], 'Adıyaman': [tt('Çiğ köfte dükkânı'), tt('Elde yoğrulmuş çiğ köfte, yanında ayran.')],
  'Afyonkarahisar': [tt('Sucuk ve kaymak dükkânı'), tt('Afyon sucuğu, kaymaklı lokum.')], 'Amasya': [tt('Elma ve çörek dükkânı'), tt('Misket elması, Amasya çöreği.')],
  'Ankara': [tt('Ankara tava lokantası'), tt('Fırında tava, yanında simit.')], 'Antalya': [tt('Piyaz ve şiş köfte salonu'), tt('Tahinli piyaz, közde şiş köfte.')],
  'Aydın': [tt('İncir ve çöp şiş dükkânı'), tt('Kuru incir, çöp şiş, bol yeşillik.')], 'Balıkesir': [tt('Höşmerim tatlıcısı'), tt('Peynirli höşmerim, sıcak servis.')],
  'Bolu': [tt('Aşçılar lokantası'), tt('Mengen ustalarının tencere yemekleri.')], 'Bursa': [tt('İskender kebap salonu'), tt('Tereyağlı iskender, yanında kestane şekeri.')],
  'Çanakkale': [tt('Peynir helvası dükkânı'), tt('Sıcak peynir helvası, Ezine peyniri.')], 'Çorum': [tt('Leblebi dükkânı'), tt('Taze kavrulmuş leblebi çeşitleri.')],
  'Denizli': [tt('Kebap ve leblebi salonu'), tt('Fırın kebabı, yanında ayran.')], 'Diyarbakır': [tt('Ciğer kebap salonu'), tt('Közde ciğer, yanında soğan salatası.')],
  'Edirne': [tt('Tava ciğer lokantası'), tt('İnce kıyılmış tava ciğer, kızarmış biber.')], 'Elazığ': [tt('Orcik ve köfte dükkânı'), tt('Harput köftesi, cevizli orcik.')],
  'Erzincan': [tt('Tulum peyniri dükkânı'), tt('Şavak tulumu, köy ekmeği.')], 'Erzurum': [tt('Cağ kebap salonu'), tt('Şişte cağ kebabı, lavaşla.')],
  'Eskişehir': [tt('Çibörek salonu'), tt('Çıtır çibörek, yanında ayran.')], 'Gaziantep': [tt('Baklava ve kebap salonu'), tt('Fıstıklı baklava, beyran çorbası.')],
  'Giresun': [tt('Fındık ve hamsi dükkânı'), tt('Kavrulmuş fındık, tavada hamsi.')], 'Hatay': [tt('Künefe tatlıcısı'), tt('Sıcak künefe, Antakya usulü.')],
  'Isparta': [tt('Gül ürünleri dükkânı'), tt('Gül lokumu, gül reçeli, gül suyu.')], 'Mersin': [tt('Tantuni dükkânı'), tt('Sacda tantuni, yanında şalgam.')],
  'İstanbul': [tt('Balık ekmek teknesi'), tt('Sahilde balık ekmek, turşu suyu.')], 'İzmir': [tt('Boyoz ve kumru fırını'), tt('Sabah boyozu, öğlen kumru.')],
  'Kahramanmaraş': [tt('Dövme dondurma dükkânı'), tt('Keçi sütüyle dövülmüş dondurma.')], 'Kars': [tt('Kaşar ve kaz lokantası'), tt('Kars kaşarı, fırında kaz.')],
  'Kastamonu': [tt('Etli ekmek ve pastırma dükkânı'), tt('Taşköprü sarımsağıyla pastırma.')], 'Kayseri': [tt('Mantı ve pastırma dükkânı'), tt('El açması mantı, pastırma, sucuk.')],
  'Kocaeli': [tt('Pişmaniye dükkânı'), tt('Tel tel pişmaniye, kutu kutu.')], 'Konya': [tt('Etli ekmek fırını'), tt('Upuzun etli ekmek, fırından yeni çıkmış.')],
  'Malatya': [tt('Kayısı dükkânı'), tt('Gün kurusu kayısı, kayısı pestili.')], 'Manisa': [tt('Mesir macunu dükkânı'), tt('Kırk bir baharatlı mesir macunu.')],
  'Mardin': [tt('Kaburga dolması lokantası'), tt('İçli kaburga, Mardin çöreği.')], 'Nevşehir': [tt('Testi kebabı lokantası'), tt('Masada kırılan testi kebabı.')],
  'Ordu': [tt('Fındık ezmesi dükkânı'), tt('Fındık ezmesi, fındıklı kurabiye.')], 'Rize': [tt('Çay bahçesi'), tt('Demli Rize çayı, yanında muhlama.')],
  'Sakarya': [tt('Islama köfte salonu'), tt('Islama köfte, ekmeği suya batırılmış.')], 'Samsun': [tt('Pide salonu'), tt('Bafra pidesi, kapalı ve açık.')],
  'Sivas': [tt('Sivas köftesi salonu'), tt('Uzun uzun köfte, közde biber.')], 'Şanlıurfa': [tt('Lahmacun ve ciğer salonu'), tt('İnce lahmacun, sabah ciğeri.')],
  'Tekirdağ': [tt('Köfte salonu'), tt('Tekirdağ köftesi, yanında piyaz.')], 'Tokat': [tt('Tokat kebabı lokantası'), tt('Patlıcanlı, odun ateşinde kebap.')],
  'Trabzon': [tt('Pide ve hamsi lokantası'), tt('Akçaabat köftesi, hamsili pilav.')], 'Van': [tt('Kahvaltı salonu'), tt('Otlu peynir, murtuğa, kahvaltı sabaha kadar.')],
  'Yozgat': [tt('Testi kebabı ve tandır lokantası'), tt('Tandır kebabı, arabaşı çorbası.')], 'Zonguldak': [tt('Kömürcü lokantası'), tt('Maden işçilerinin sofrası, bol porsiyon.')],
  'Sinop': [tt('Mantı ve balık lokantası'), tt('Sinop mantısı, taze balık.')], 'Bayburt': [tt('Tandır ve lor dolması lokantası'), tt('Bayburt tandırı, lor dolması.')],
};
// Kademeli yatırımlar: her seviye daha pahalı. e: seviye başına etki, max: en yüksek seviye, need: açılma koşulu (2 = ikinci kademe)
export const UPG = [
  { id: 'salon', n: tt('Ev spor salonu'), d: tt('Her seviye antrenman verimini %3 artırır.'), i: 'train', base: 800000, k: 1.7, max: 8, e: { tr: .03 } },
  { id: 'ekip', n: tt('Kişisel ekip'), d: tt('Aşçı, fizyoterapist, analist. Her seviye enerji +1, sakatlık riski −%4.'), i: 'users', base: 1500000, k: 1.7, max: 6, e: { en: 1 } },
  { id: 'marka', n: tt('Kendi markan'), d: tt('Her seviye takipçi artışını hızlandırır ve haftalık ₺60.000 kazandırır.'), i: 'tag', base: 5000000, k: 1.6, max: 10, need: 2, e: { fol: .15, inc: 60000 } },
  { id: 'vakif', n: tt('Vakıf'), d: tt('Her bağış itibar, taraftar sevgisi ve basın ilişkisi kazandırır. Sınırı yok.'), i: 'heart', base: 4000000, k: 1.25, max: 999, need: 2 },
];
// Ücretli seanslar: haftada her biri bir kez, eylem hakkı harcamaz. c: haftalık ücretin katı, min: en düşük bedel
export const SESS = [
  { id: 'ozel', n: tt('Özel antrenman'), d: tt('Mevkinin iki ana özelliği gelişir.'), i: 'train', c: 1.6, min: 3000 },
  { id: 'analiz', n: tt('Rakip analizi'), d: tt('Sıradaki maçta anlar kolaylaşır.'), i: 'eye', c: .6, min: 1200 },
  { id: 'mental', n: tt('Mental koç'), d: tt('Moral toparlanır, zihin gelişir.'), i: 'smile', c: .8, min: 1500 },
  { id: 'fizik', n: tt('Kurtarma seansı'), d: tt('Masaj ve buz banyosu: enerji +18.'), i: 'heart', c: .7, min: 1500 },
];
// Piyasadaki algın
export const PTAG = { formsuz: tt('Formsuz'), duzenli: tt('Düzenli oyuncu'), yukselen: tt('Yükselen oyuncu'), genc: tt('Genç yetenek'), yildiz: tt('Ligin yıldızı') };

export const AGENTS = [
  { n: 'Kemal Aksoy', d: tt('Mahallenin abisi. Az komisyon, az bağlantı.'), cut: .05, pw: .2, hi: tt('"Söyle bakalım, dinliyorum."') },
  { n: 'Selin Karaca', d: tt('Ligleri iyi tanır. Dengeli seçim.'), cut: .10, pw: .55, hi: tt('"Rakamlar önümde. Ne konuşuyoruz?"') },
  { n: 'Viktor Lang', d: tt('Avrupa bağlantılı ağır top. Pahalı.'), cut: .15, pw: .95, hi: tt('"Kısa tut, üç telefon bekliyor."') },
  { n: 'Deniz Arman', d: tt('Yıldızların menajeri. Kapıları tekmeyle açar; payı da ona göre.'), cut: .2, pw: 1.25, rep: 60, hi: tt('"Yıldızım, bugün kimin kapısını çalıyoruz?"') },
  { n: 'Amcan', d: tt('Aileden biri. Seni kandırmaz ama kimseyi de tanımaz.'), cut: .03, pw: .08, hi: tt('"Çayı koydum, anlat."') },
];

export const NATIONS = [['İspanya', 86], ['Fransa', 87], ['Almanya', 85], ['İtalya', 83], ['Hollanda', 83], ['Portekiz', 85], ['Hırvatistan', 80], ['İsviçre', 78], ['Avusturya', 77], ['Çekya', 75], ['Macaristan', 74], ['Galler', 73], ['Gürcistan', 72], ['İzlanda', 70], ['Bulgaristan', 68], ['Karadağ', 68], ['Türkiye', 79]];

export const ROLE = { '11': tt('İlk 11'), rot: tt('Rotasyon'), genc: tt('Gelecek vaat eden'), yedek: tt('Yedek'), yok: tt('Kadro dışı') };

export const MOM = {
  sut: { n: tt('Şut', 'an'), i: tt('Ceza sahası önünde top sende. Kaleyi düşün!') },
  kafa: { n: tt('Kafa vuruşu'), i: tt('Orta geliyor, yükseliyorsun!') },
  frikik: { n: tt('Frikik'), i: tt('Ceza yayı önünde frikik. Topun başında sen varsın.') },
  penalti: { n: tt('Penaltı'), i: tt('Penaltı! Topun başına sen geçiyorsun.') },
  pas: { n: tt('Pas', 'an'), i: tt('Orta alanda top sende, arkadaşların koşu yapıyor.') },
  calim: { n: tt('Çalım'), i: tt('Önünde savunma var. Adam eksilt!') },
  savunma: { n: tt('Savunma'), i: tt('Rakip hızla üstüne geliyor. Durdur!') },
  kurtaris: { n: tt('Kurtarış'), i: tt('Rakip şut pozisyonunda!') },
  vole: { n: tt('Vole'), i: tt('Top havadan geliyor, yere indirmeden vurabilirsin!') },
  rovesata: { n: tt('Röveşata'), i: tt('Top arkanda kaldı. Tek yol: röveşata!') },
  orta: { n: tt('Orta'), i: tt('Kanatta boşsun, ceza sahasına koşu var.') },
  korner: { n: tt('Korner'), i: tt('Korner vuruşunu sen kullanıyorsun.') },
  duvar: { n: tt('Frikik savunması'), i: tt('Ceza yayı önünde rakip frikik. Barajı sen kuracaksın.') },
  penkurtar: { n: tt('Penaltı kurtarışı'), i: tt('Hakem beyaz noktayı gösterdi. Sen ve o; başka kimse yok.') },
  kosu: { n: tt('Arkaya koşu'), i: tt('Savunma çizgisindesin. Pas çıktığı an arkaya sark!') },
  ribaund: { n: tt('Dönen top'), i: tt('Kaleci topu elinden kaçırdı, top ceza sahasında sekiyor!') },
  markaj: { n: tt('Markaj'), i: tt('Rakibin en tehlikeli adamı senin bölgende. Top aldırma!') },
  cikis: { n: tt('Yan topa çıkış'), i: tt('Kanattan orta geliyor, ceza sahası kalabalık. Çık ve al!') },
  birebir: { n: tt('Bire bir'), i: tt('Savunma delindi, forvet topla tek başına geliyor!') },
  blok: { n: tt('Şut bloku'), i: tt('Rakip ceza sahası önünde şut açısı arıyor. Önüne at kendini!') },
  kesme: { n: tt('Pas arası'), i: tt('Rakip orta sahada topu döndürüyor. Araya gir!') },
  verkac: { n: tt('Ver-kaç'), i: tt('Kanatta önünde bir adam var, arkadaşın içeride boşta.') },
  asirtma: { n: tt('Aşırtma'), i: tt('Kaleciyle karşı karşıyasın ve o üstüne çıkıyor!') },
};

export const FILL = [
  tt('Orta sahada sert mücadele var.'), tt('Tribünler ayakta.'), tt('Rakip topu çeviriyor, pres yapıyorsunuz.'),
  tt('Köşe vuruşundan sonuç çıkmadı.'), tt('Hakem oyunu devam ettirdi.'), tt('Hoca kenardan bağırıyor.'),
  tt('Tempo düştü, iki takım da kontrollü.'), tt('Zemin oyunu zorlaştırıyor.'), tt('Uzun top auta çıktı.'),
  tt('Rakip ofsayta düştü.'), tt('Kenar yönetimi ısınanlara işaret etti.'),
];

export const CUPS = { EN: 'İngiltere Kupası', ES: 'İspanya Kupası', DE: 'Almanya Kupası', IT: 'İtalya Kupası', FR: 'Fransa Kupası', NL: 'Hollanda Kupası', PT: 'Portekiz Kupası', SA: 'Kral Kupası' };
export const TSTAT = { mutlu: tt('Mutluyum'), acik: tt('Tekliflere açığım'), istek: tt('Transfer istiyorum'), kiralik: tt('Kiralık gitmek istiyorum') };
export const STANCE = { kilit: tt('Satılık değil'), acik: tt('Uygun teklife açık'), liste: tt('Satış listesinde'), kiralik: tt('Kiralık oyuncu') };

// Yetenek ağacı. c: puan bedeli
export const PERKS = [
  { id: 'plase', n: tt('Plase ustası'), d: tt('Şutların daha isabetli.'), c: 2, i: 'target', no: 'KL' },
  { id: 'frikik', n: tt('Frikikçi'), d: tt('Frikikte isabet artar, baraj daralır.'), c: 2, i: 'star', no: 'KL' },
  { id: 'buz', n: tt('Buz gibi'), d: tt('Penaltıda kaleci seni okuyamaz.'), c: 1, i: 'lock', no: 'KL' },
  { id: 'hava', n: tt('Hava hâkimi'), d: tt('Kafa vuruşunda zamanlama payı genişler.'), c: 1, i: 'up', no: 'KL' },
  { id: 'bilek', n: tt('Bilek'), d: tt('Çalımda savunmacılar daha geç kayar.'), c: 2, i: 'bolt', no: 'KL' },
  { id: 'gorus', n: tt('Görüş'), d: tt('Pasların yerini kolay bulur, asist şansı artar.'), c: 2, i: 'eye' },
  { id: 'makas', n: tt('Makas'), d: tt('Kayarak müdahalen daha uzun menzilli.'), c: 2, i: 'shield', no: 'KL' },
  { id: 'refleks', n: tt('Refleks'), d: tt('Eldivenin daha hızlı.'), c: 2, i: 'bolt', only: 'KL' },
  { id: 'akciger', n: tt('Demir akciğer'), d: tt('Maçlar %30 daha az yorar.'), c: 2, i: 'heart' },
  { id: 'celik', n: tt('Çelik gibi'), d: tt('Sakatlık riski %40 azalır.'), c: 2, i: 'plus' },
  { id: 'sahne', n: tt('Sahne ışığı'), d: tt('Takipçi kazancın %50 artar.'), c: 1, i: 'phone' },
  { id: 'kaptan', n: tt('Kaptan ruhu'), d: tt('Hoca güveni daha hızlı artar.'), c: 1, i: 'crown' },
];

// Arkadaşlarla aktiviteler
export const HANG = [
  { id: 'hali', n: tt('Halı saha maçı'), d: tt('Ter at, top oyna.'), i: 'ball', fx: { ark: 10, mo: 5, en: -10, teknik: 0.3 }, risk: .04, r: tt('Üç maç üst üste. Bacaklar yandı ama değdi.') },
  { id: 'konsol', n: tt('Konsol gecesi'), d: tt('Evde turnuva.'), i: 'phone', fx: { ark: 8, mo: 6, en: -2 }, r: tt('Finalde uzatmalarda kaybettin. Rövanş istendi.') },
  { id: 'mangal', n: tt('Sapanca\'da mangal'), d: tt('Göl kenarı, uzun sofra.'), i: 'heart', fx: { ark: 12, mo: 8, en: 4, para: -1500 }, r: tt('Köz, çay, göl. Kafan boşaldı.') },
  { id: 'kahve', n: tt('Kahvehanede maç'), d: tt('Çay, tavla, derbi.'), i: 'users', fx: { ark: 7, mo: 3 }, r: tt('Tavlada mars oldun, derbi berabere bitti.') },
  { id: 'gece', n: tt('Gece hayatı'), d: tt('Sabaha kadar.'), i: 'moon', fx: { ark: 14, mo: 10, en: -22, prof: -4 }, hoca: .3, r: tt('Eve güneş doğarken döndün.') },
];

// Sosyal medya paylaşım türleri. f: takipçi çarpanı
// Paylaşımlar: if = koşul (core'da), t = metinler. {ad} adın, {kulup} kulübün, {rakip} sıradaki rakip, {il} memleket, {skor} son skor, {num} forma no.
// Maç sonrası paylaşımda t yerine w/d/l (galibiyet, beraberlik, yenilgi) listeleri var.
export const POSTS = [
  { id: 'idman', n: tt('Antrenman karesi'), i: 'train', fx: { hoca: 1 }, f: 1, t: [tt('Bugün de eksiksiz. Hafta sonu hazırız.'), tt('Ter atmadan forma yok.'), tt('Sabah 7, saha ıslak, bacaklar yanıyor. Devam.'), tt('Fazladan yarım saat şut çalıştım. Kale büyüdü sanki.'), tt('Hoca bugün çok yüklendi. İyi ki yüklendi.'), tt('Kimse izlemezken çalışılan saatler maçta görünür.'), tt('Kondisyon tamam, kafa tamam. Sıra sahada.'), tt('{num} numara bugün de ilk gelen, son giden.')] },
  { id: 'taraf', n: tt('Taraftara mesaj'), i: 'heart', fx: { taraf: 5 }, f: 1.3, t: [tt('Tribünde sizi duymak başka. Hafta sonu görüşürüz!'), tt('Bu forma sizin için terliyor.'), tt('Deplasmana gelen herkese teşekkürler. Yol uzun, sesiniz uzaktan geldi.'), tt('{kulup} taraftarı, bu sezon birlikte büyüyeceğiz.'), tt('Kale arkasındaki o pankartı gördüm. Saklayacağım.'), tt('Çocuklara imza sözüm var, cumartesi antrenman çıkışı oradayım.'), tt('Kazanınca da kaybedince de yanımızdasınız. Hak etmek bizim işimiz.')] },
  { id: 'aile', n: tt('Aile ve memleket'), i: 'home', fx: { aile: 5, mo: 2 }, f: 1, t: [tt('Anne yemeği gibisi yok.'), tt('Nereye gidersem gideyim, memleket burada.'), tt('{il} kokusu başka. Hafta sonu evdeyim.'), tt('Babamla aynı kahvede maç izledik, herkes tanıdık.'), tt('Küçük kardeşim formamla okula gitmiş. Gururlandım.'), tt('Dedemin eski fotoğrafını buldum, o da top oynarmış. Genlerde var.'), tt('Ev, aile, bir tabak pilav. Gerisi teferruat.')] },
  { id: 'luks', n: tt('Lüks hayat'), i: 'star', fx: { ego: 4, taraf: -3 }, f: 2.4, need: ['araba', 'spor', 'villa', 'ev'], t: [tt('Emeklerin karşılığı.'), tt('Yeni oyuncak.'), tt('Bazı günler kendine iyi davranacaksın.'), tt('Çalış, kazan, hak et.'), tt('Manzara fena değil.')] },
  { id: 'spon', n: tt('Sponsor paylaşımı'), i: 'tag', fx: {}, f: .8, spon: 1, t: [tt('Yeni sezonda yanımda olanlar belli. #işbirliği'), tt('Sahada da dışarıda da aynı ekip. #işbirliği'), tt('Kramponlar bağlandı, iş başına. #reklam')] },
  { id: 'mac', n: tt('Maç sonrası'), i: 'ball', fx: { taraf: 2 }, f: 1.4, w: [tt('3 puan bizim! {skor}. Herkesin emeğine sağlık.'), tt('Böyle gecelerin tadı başka. {kulup} kazandı!'), tt('Soyunma odası şarkı söylüyor. {skor}.'), tt('Gol de geldi, puan da. Sıradaki maça bakıyoruz.'), tt('Tribün itti, biz koştuk. Bu galibiyet sizin.')], d: [tt('Bir puan bir puandır ama daha fazlasını istiyorduk.'), tt('{skor}. Kafalar önde değil, ileri bakıyoruz.'), tt('Zor deplasmandı, eli boş dönmedik.'), tt('Fırsatları değerlendirseydik başka olurdu. Çalışmaya devam.')], l: [tt('Bugün olmadı. Özür borçluyuz, telafi edeceğiz.'), tt('{skor}. Acı ama ders çıkaracağız.'), tt('Kafamızı kaldırıp çalışacağız. Bu forma bunu hak ediyor.'), tt('Kaybettik, bahane yok. Pazartesi idmanda görüşürüz.')] },
  { id: 'derbi', n: tt('Derbi havası'), i: 'bolt', fx: { taraf: 6, ego: 1 }, f: 1.8, t: [tt('Bu hafta başka hafta. {rakip}, sahada görüşürüz.'), tt('Şehir ikiye bölündü. Hangi taraftasın belli.'), tt('Derbi haftası uyku yok, sadece maç var.'), tt('Çocukken tribünden izlediğim derbiye bu kez sahadan çıkıyorum.')] },
  { id: 'sakat', n: tt('Sakatlık güncellemesi'), i: 'plus', fx: { mo: 3, taraf: 2 }, f: 1.2, t: [tt('Tedavi sürüyor. Her gün biraz daha iyiyim.'), tt('Kısa bir ara. Daha güçlü döneceğim.'), tt('Fizyoterapistlerime teşekkürler. Yakında sahadayım.'), tt('Kenardan izlemek oynamaktan zor. Az kaldı.')] },
  { id: 'soru', n: tt('Takipçilere soru'), i: 'phone', fx: { taraf: 1 }, f: 1.5, t: [tt('Hafta sonu kaç gol atayım? Tahminler yoruma!'), tt('Maç öncesi hangi şarkıyı dinleyeyim?'), tt('En sevdiğiniz golüm hangisi?'), tt('Gol sevincim için fikir verin, en çok beğenileni yapacağım.'), tt('{kulup} tarihinin en iyi 11\'ini yazın, bakalım ben var mıyım.')] },
  { id: 'tbt', n: tt('Eski fotoğraf'), i: 'cal', fx: { aile: 2, taraf: 1 }, f: 1.1, t: [tt('#tbt Toprak sahada ilk kramponlarım. Bir numara büyüktü.'), tt('#tbt Mahalle turnuvası, 11 yaş. Kupa hâlâ annemin vitrininde.'), tt('#tbt Okul takımı. O gün de forvetteydim, o gün de kaçırdım.'), tt('#tbt {il} sokakları, iki taş bir kale.')] },
  { id: 'meydan', n: tt('Rakibe gönderme'), i: 'alert', fx: { ego: 3, taraf: 3, basin: -2 }, f: 1.9, hate: 10, t: [tt('{rakip} çok konuşuyor. Cumartesi sahada konuşalım.'), tt('Bazıları maçı sosyal medyada kazanıyor. Biz sahada.'), tt('Hafta sonu {rakip} savunmasına selam olsun.'), tt('Korkan rakip lafla oynar. Biz topla oynarız.')] },
  { id: 'hayir', n: tt('Yardım kampanyası'), i: 'heart', fx: { taraf: 4, rep: 1 }, f: 1.3, cost: 1, t: [tt('Memleketimdeki okulun spor salonu için kampanya başlattım. Destek olan herkese teşekkürler.'), tt('Köy okullarına forma ve top gönderiyoruz. Her paylaşım bir top.'), tt('Bu ayki maç primimin bir kısmı hayvan barınağına. Siz de katılın.')] },
  { id: 'cevap', n: tt('Eleştirilere cevap'), i: 'mic', fx: { mo: 2 }, f: 1.2, hate: -18, t: [tt('Eleştirileri okuyorum. Cevabı sahada vereceğim.'), tt('Herkes fikrini söyleyebilir. Ben işimi yapmaya devam.'), tt('Kötü günde arkamızda duranları unutmayacağız.'), tt('Klavyeden gol atılmıyor. Cumartesi görüşürüz.')] },
];
// Eleştirmen (hater) hesapları ve akışta görünen yorumları
export const HATERS = ['klavye_ustasi', 'yorumcu_dayi', 'her_seyi_bilen', 'kanepe_hocasi', 'anonim_34', 'gol_kaciran_uzman', 'sert_elestirmen', 'tribun_profesoru', 'eski_futbolcu_degil', 'cay_ocagi_analist'];
export const FANS = ['tribun54', 'mahalle_reisi', 'kale_arkasi', 'gol_hasreti', 'mahallenin_sesi', 'forma_asigi', 'deplasman_yolcusu', 'eski_acik'];

export const ACH = [
  ['ilkgol', tt('İlk gol'), 'ball'], ['hat', 'Hat-trick', 'star'], ['g50', tt('50 gol'), 'ball'], ['g100', tt('100 gol'), 'ball'], ['g250', tt('250 gol'), 'ball'],
  ['pro', tt('İlk profesyonel sözleşme'), 'pen'], ['sl', tt('Elit Lig oyuncusu'), 'shield'], ['yurt', tt('Yurt dışı macerası'), 'globe'], ['milli', tt('Milli forma'), 'flag'],
  ['kupa', tt('Kupa kaldırdın'), 'trophy'], ['avrupa', tt('Kıta Ligi şampiyonu'), 'crown'], ['al', tt('Kıta Kupası şampiyonu'), 'trophy'], ['hayal', tt('Hayalindeki forma'), 'heart'], ['m1', tt('1 milyon takipçi'), 'phone'],
  ['ay', tt('Ayın oyuncusu'), 'star'], ['yil11', tt('Yılın 11\'i'), 'users'],
  ['milk', tt('Milli takımla kupa'), 'flag'], ['efsane', tt('Kulüp efsanesi'), 'crown'],
  ['sc_kurtar', tt('Kurtarıcı'), 'shield'], ['sc_donus', tt('Büyük dönüş'), 'plus'], ['sc_sondans', tt('Son dans'), 'crown'], ['derbi', tt('Derbi kahramanı'), 'bolt'], ['akil', tt('Akıl hocası'), 'book'], ['koleksiyon', tt('Koleksiyoncu'), 'star'],
];

// Maç içi kararlar. p: konuşan kişi, i: ikon
export const DEC = {
  ht: { t: tt('Devre arası'), p: 'hoca', i: 'whistle', ic: ['bolt', 'target', 'alert', 'whistle', 'x'], o: [tt('Takımı ateşle'), tt('Kendi oyununa odaklan'), tt('Riskli oyna'), tt('Hocaya plan sor'), tt('Hocaya itiraz et')], s: [tt('Tutarsa takım gol bulabilir'), tt('Kalan anlar daha sakin akar'), tt('Fazladan pozisyon, fazladan sakatlık riski'), tt('İstediği an ikinci yarıda karşına çıkar'), tt('Tutarsa sistem sana göre değişir; tutmazsa kenara gelebilirsin')] },
  pen: { t: tt('Penaltı!'), p: 'takim', i: 'target', ic: ['target', 'users'], o: [tt('Ben atarım'), tt('Ustası atsın')], s: [tt('Penaltıyı sen kullanırsın'), tt('Takımın penaltıcısı atar')] },
  ref: { t: tt('Tartışmalı karar'), p: 'fed', i: 'alert', ic: ['alert', 'right'], o: [tt('İtiraz et'), tt('Oyuna dön')], s: [tt('Tribün sever, kart riski var'), tt('Hoca takdir eder')] },
  knock: { t: tt('Bir şey oldu'), p: 'doktor', i: 'plus', ic: ['shield', 'plus', 'heart'], o: [tt('Devam et'), tt('Değişiklik iste'), tt('Tedavi iste')], s: [tt('Sakatlık riski artar'), tt('Maç senin için biter'), tt('Bandajla dönersin; risk azalır, kondisyon düşer')] },
};

// Oyuncu yaratma ayrıntıları
export const HT = { kisa: { n: tt('Kısa'), at: { hiz: 2, teknik: 1, kafa: -2 } }, orta: { n: tt('Orta', 'boy'), at: {} }, uzun: { n: tt('Uzun'), at: { kafa: 3, guc: 1, hiz: -2 } } };
export const BUILD = { cevik: { n: tt('Çevik'), at: { hiz: 1, teknik: 1, guc: -2 } }, atletik: { n: tt('Atletik'), at: {} }, guclu: { n: tt('Güçlü'), at: { guc: 3, hiz: -2 } } };
export const STYLES = {
  KL: [{ n: tt('Çizgi kalecisi'), at: { kaleci: 2 } }, { n: tt('Libero kaleci'), at: { pas: 2, hiz: 1 } }],
  DF: [{ n: tt('Sert stoper'), at: { savunma: 2, guc: 1 } }, { n: tt('Top kullanan'), at: { pas: 2, teknik: 1 } }, { n: tt('Hızlı bek'), at: { hiz: 3 } }],
  OS: [{ n: tt('Oyun kurucu'), at: { pas: 3 } }, { n: tt('İki yönlü'), at: { guc: 2, hiz: 1 } }, { n: tt('Ön libero'), at: { savunma: 3 } }],
  KN: [{ n: tt('Çizgi kanadı'), at: { hiz: 2, pas: 1 } }, { n: tt('İçe kat eden'), at: { sut: 2, teknik: 1 } }],
  FV: [{ n: tt('Fırsatçı'), at: { sut: 2, zihin: 1 } }, { n: tt('Hedef santrfor'), at: { kafa: 3, guc: 1, hiz: -1 } }, { n: tt('Sürükleyici'), at: { teknik: 2, hiz: 1 } }],
};
export const CELE = { kayarak: [tt('Dizüstü kayış'), tt('dizlerinin üstünde korner bayrağına kaydı')], takla: [tt('Takla'), tt('havada takla attı')], kalp: [tt('Kalp'), tt('tribüne elleriyle kalp yaptı')], sus: [tt('Sus işareti'), tt('parmağını dudağına götürdü')] };

// Ağ (network): tanıdık türleri. f: isteyebileceğin iyilik
export const NET = {
  yildiz: { n: tt('Yıldız futbolcu'), i: 'star', p: 'rakip', d: tt('Seni kulübüne önerebilir. Görüştükçe oyunun gelişir.'), f: tt('Kulübüne öner') },
  abi: { n: tt('Şehrin kıdemlisi'), i: 'home', p: 'baskan', d: tt('Eski kulüp başkanı. Deneme, sponsor, iş kapısı açar.'), f: tt('Bir kapı aç') },
  gazeteci: { n: tt('Gazeteci'), i: 'mic', p: 'basin', d: tt('Hakkında iyi yazar, kötü haberi yumuşatır.'), f: tt('Haber yaptır') },
  doktor: { n: tt('Spor hekimi'), i: 'plus', p: 'doktor', d: tt('Sakatlıkta öncelik: dönüş süren kısalır.'), f: tt('Özel tedavi') },
  scout: { n: 'Scout', i: 'eye', p: 'scout', d: tt('Raporunu üst lig kulüplerine ulaştırır.'), f: tt('Raporumu gönder') },
  hoca: { n: tt('Eski hocan'), i: 'whistle', p: 'hoca', d: tt('Çalıştığı kulübe seni isteyebilir.'), f: tt('Beni iste') },
  marka: { n: tt('Marka müdürü'), i: 'tag', p: 'sponsor', d: tt('Sponsorluk kapısı.'), f: tt('Anlaşma iste') },
  eski: { n: tt('Eski takım arkadaşı'), i: 'users', p: 'takim', d: tt('Oynadığı kulübe seni önerebilir.'), f: tt('Kulübüne öner') },
  golge: { n: tt('Karanlık tanıdık'), i: 'lock', p: 'golge', d: tt('Kolay para vadeder. Açtığı kapılar tehlikelidir.'), f: tt('İş sor') },
};
// Takım arkadaşıyla aktiviteler. b: bağ artışı, cost: haftalık ücretin katı
export const MACT = {
  kal: { n: tt('Antrenmandan sonra kal'), i: 'train', b: 8, fx: { en: -6 }, grow: 1, r: tt('{n} ile yarım saat fazladan çalıştınız.') },
  yemek: { n: tt('Yemeğe çık'), i: 'heart', b: 10, cost: .4, fx: { mo: 3 }, r: tt('{n} hesabı ödemek istedi ama sen ısrar ettin.') },
  oyun: { n: tt('Oyun gecesi'), i: 'phone', b: 7, fx: { mo: 4, en: -2 }, r: tt('{n} sabaha karşı rövanş istedi.') },
  akil: { n: tt('Akıl hocalığı yap'), i: 'book', b: 9, vet: 1, fx: { hoca: 2, takim: 2 }, r: tt('{n} ile maç görüntülerini izlediniz; nerede duracağını tek tek gösterdin.') },
};
export const DERBY = [['Galata', 'Kadıköy', 'Beşiktaş', 'Trabzon'], ['Sakarya', 'Kocaeli'], ['Göztepe', 'Karşıyaka', 'İzmir A'], ['Bursa', 'Eskişehir'], ['Adana D', 'Adana'], ['Ankara G', 'Ankara A'],
  ['Madrid', 'Barcelona', 'Madrid A'], ['Manchester U', 'Manchester C', 'Liverpool'], ['Londra A', 'Tottenham', 'Chelsea'], ['Milano I', 'Milano', 'Torino J'], ['Roma', 'Lazio'], ['Münih', 'Dortmund'],
  ['Paris', 'Marsilya'], ['Amsterdam', 'Rotterdam', 'Eindhoven'], ['Lizbon', 'Porto', 'Lizbon S'], ['Riyad H', 'Riyad N', 'Cidde İ']];
export const DIFF = { kolay: [tt('Kolay'), .85], normal: ['Normal', 1], zor: [tt('Zor'), 1.15], gercek: [tt('Gerçekçi'), 1.22] };

// Hoca taktikleri. m: maç anı ağırlık çarpanları, add: mevkide olmayan ana eklenen ağırlık,
// lu/lo: takımın attığı/yediği gol çarpanı, st: enerji tüketimi, fit: yakışan mevkiler, key: aranan özellik
export const TACT = {
  hucum: { n: tt('Hücum futbolu'), d: tt('Önde oyna, çok pozisyon bul. Arkada boşluk kalır.'), i: 'bolt', m: { sut: 1.35, vole: 1.3, calim: 1.1, savunma: .75 }, lu: 1.15, lo: 1.12, st: 1.05, fit: ['FV', 'KN'], bad: ['DF'], key: 'sut' },
  kontra: { n: tt('Kontra atak'), d: tt('Geride bekle, topu kapınca hızlı çık.'), i: 'right', m: { calim: 1.6, sut: 1.15, pas: .75, savunma: 1.2 }, lu: .95, lo: .85, st: 1, fit: ['KN', 'FV'], bad: [], key: 'hiz' },
  top: { n: tt('Topa sahip olma'), d: tt('Kısa pas, sabır. Top kaybı affedilmez.'), i: 'swap', m: { pas: 1.8, calim: .9, kafa: .7, orta: .7 }, lu: 1.05, lo: .9, st: .95, fit: ['OS'], bad: [], key: 'pas' },
  kanat: { n: tt('Kanat oyunu'), d: tt('Çizgiye in, ortala. Ceza sahası kalabalık.'), i: 'up', m: { orta: 2.3, korner: 1.6, kafa: 1.9, pas: .8 }, add: { orta: 12, kafa: 8 }, lu: 1.05, lo: 1, st: 1.05, fit: ['KN', 'FV', 'DF'], bad: [], key: 'kafa' },
  pres: { n: tt('Yüksek pres'), d: tt('Her topa bas. Çok yorar, çok top kazandırır.'), i: 'alert', m: { savunma: 1.7, calim: 1.1, pas: .9 }, add: { savunma: 12 }, lu: 1.08, lo: .95, st: 1.3, fit: ['OS', 'DF'], bad: [], key: 'guc' },
  otobus: { n: tt('Kapalı savunma'), d: tt('Önce gol yeme. Pozisyon az, hata pahalı.'), i: 'shield', m: { savunma: 1.9, kafa: 1.2, sut: .7, calim: .8 }, add: { savunma: 14 }, lu: .8, lo: .75, st: .9, fit: ['DF', 'KL'], bad: ['FV', 'KN'], key: 'savunma' },
};

// İkinci kademe yetenekler: ilk kademe tamamlanınca açılır
export const PERKS2 = [
  { id: 'buyuk', n: tt('Büyük maç oyuncusu'), d: tt('Derbi, final ve Avrupa gecelerinde anlar kolaylaşır.'), c: 3, i: 'trophy' },
  { id: 'nefes', n: tt('İkinci nefes'), d: tt('Devre arasında enerjin iki kat dolar.'), c: 2, i: 'bolt' },
  { id: 'lider', n: tt('Soyunma odası lideri'), d: tt('Takım kimyası yükselir, asist şansın artar.'), c: 3, i: 'users' },
  { id: 'ikon', n: tt('Marka yüzü'), d: tt('Sponsor gelirlerin %30 artar.'), c: 3, i: 'tag' },
  { id: 'genclik', n: tt('Bitmeyen gençlik'), d: tt('Yaşa bağlı düşüş %40 yavaşlar.'), c: 3, i: 'heart' },
  { id: 'taktik', n: tt('Hocanın adamı'), d: tt('Her taktiğe uyarsın; hoca görevleri iki kat güven kazandırır.'), c: 2, i: 'whistle' },
];

// Kulüpsüz geçen ay: iki hafta için bir seçim
export const FREE = [
  { id: 'birey', n: tt('Bireysel antrenman'), s: tt('Mevkinin iki ana özelliği gelişir'), i: 'train' },
  { id: 'mahalle', n: tt('Mahalle turnuvası'), s: tt('Teknik ve arkadaşlık artar'), i: 'ball' },
  { id: 'kamp', n: tt('Kondisyon kampı'), s: tt('Hız ve güç artar · ₺1.500'), i: 'bolt', cost: 1500 },
  { id: 'is', n: tt('Sanayide çalış'), s: tt('Cebine para girer, ailen rahatlar'), i: 'briefcase' },
  { id: 'okul', n: tt('Derslere ağırlık ver'), s: tt('Eğitim ve aile artar'), i: 'book' },
  { id: 'tanidik', n: tt('Bir tanıdık bul'), s: tt('Şehrin kıdemlisi sıradaki denemede kapı aralar'), i: 'users' },
];

// Gurbetçinin doğduğu ülke: milli takım tercihi ve dil avantajı buna bağlı
export const NATN = { TR: 'Türkiye', DE: 'Almanya', NL: 'Hollanda', FR: 'Fransa', BE: 'Belçika' };
export const NATC = { TR: ['#d81e2c', '#f2f2f2'], DE: ['#161616', '#ffd21a'], NL: ['#f47b20', '#12265e'], FR: ['#12265e', '#f2f2f2'], BE: ['#d81e2c', '#ffd21a'] };

// Hava ve zemin. [ad, ikon, açıklama, enerji tüketimi çarpanı, zorlaşan anlar, zorluk çarpanı]
export const WX = {
  acik: [tt('Açık hava'), 'sun', tt('Zemin iyi, bahane yok.'), 1, [], 1],
  yagmur: [tt('Yağmur'), 'rain', tt('Top kayıyor: pas ve çalım zorlaşır, kaleciler de zorlanır.'), 1.05, ['pas', 'orta', 'korner', 'calim'], 1.07],
  camur: [tt('Çamur'), 'rain', tt('Saha bataklık: koşmak ve dönmek zor, enerji çabuk biter.'), 1.18, ['calim', 'savunma', 'pas'], 1.09],
  ruzgar: [tt('Rüzgâr'), 'wind', tt('Havadan gelen her top oyun oynar: orta, korner ve frikik zorlaşır.'), 1, ['orta', 'korner', 'frikik', 'kafa'], 1.1],
  sicak: [tt('Sıcak'), 'sun', tt('Hava bunaltıyor: enerji çok hızlı tükenir.'), 1.28, [], 1],
  kar: [tt('Kar'), 'snow', tt('Zemin beyaz, top ağır. Her şey biraz daha zor.'), 1.12, ['pas', 'orta', 'calim', 'savunma', 'sut'], 1.05],
};

// Yatırımlar. [ad, açıklama, haftalık ortalama getiri, oynaklık, ikon]
export const INV = {
  ev: [tt('Gayrimenkul'), tt('Yavaş ama sağlam. Yılda yaklaşık %8.'), .0015, .004, 'home'],
  fon: [tt('Borsa fonu'), tt('Orta risk. İyi yılda %20, kötü yılda eksi.'), .0021, .022, 'chart'],
  isl: [tt('İşletme ortaklığı'), tt('Ortağına bağlı. İyi giderse kazandırır, batarsa gider.'), .0028, .03, 'cart'],
  kripto: [tt('Kripto'), tt('Yüksek risk. Katlanabilir de, eriyebilir de.'), .0036, .085, 'bolt'],
};

// ---------- kariyer türü: 'e' erkek, 'k' kadın ----------
// İki dünya aynı tabloları (LEAGUES, CLUBS, LMAP, XIDS, WIDS, NAMES, NATIONS, CUPS, DERBY) paylaşır; setWorld içeriklerini yerinde değiştirir.
// Lig kimlikleri iki dünyada ortaktır (tr1, en1…); bir kayıt tek dünyada yaşar, türü S.w alanında durur.
const mkWorld = (leagues, xs, ws) => {
  const C = {}, mk = (list, pre) => list.map((t, i) => { const [n, r, c, x] = t.split('|'), id = pre + i; C[id] = { n, r: +r, c1: PAL[c[0]], c2: PAL[c[1]], x }; return id; });
  for (const L of leagues) if (!L.gen) L.ids = L.teams.map((t, i) => { const [n, r, c] = t.split('|'), id = L.id + '_' + i; C[id] = { n, r: +r, c1: PAL[c[0]], c2: PAL[c[1]] }; return id; });
  return { L: leagues, C, X: mk(xs, 'x_'), W: mk(ws, 'w_') };
};
const KN = {}; for (const c in KNAMES) KN[c] = { f: KNAMES[c], l: NAMES[c].l, m: NAMES[c].f };   // m: erkek ön adları (hocalar için)
const OTXT = {
  e: { mahalle: [ORIGINS.mahalle.d, 8], okul: [ORIGINS.okul.d, 7], altyapi: [ORIGINS.altyapi.d, 6], gurbet: [ORIGINS.gurbet.d, 7] },
  k: {
    mahalle: [tt('Mahallede erkeklerle top oynayarak büyüdün, kimse seni tanımıyor. En alttan, Kadınlar 3. Ligi\'nden başlarsın. Evde para dar.'), 4],
    okul: [tt('Beden eğitimi öğretmenin seni fark etti. Kadınlar 3. Ligi\'nde başlarsın, okul notların iyi.'), 4],
    altyapi: [tt('Büyük bir kulübün kız akademisinde yetiştin ama A takıma alınmadın. Kadınlar 2. Ligi\'nde başlarsın. Ailen uzakta.'), 3],
    gurbet: [ORIGINS.gurbet.d, 4],
  },
};
const PTXT = { e: [MOM.calim.i, [...PERKS, ...PERKS2].find(p => p.id === 'taktik').n], k: [tt('Önünde savunma var. Rakip eksilt!'), tt('Hocanın gözdesi')] };
const WORLDS = {
  e: { L: [...LEAGUES], C: { ...CLUBS }, X: [...XIDS], W: [...WIDS], N: NATIONS.map(x => [...x]), NM: { ...NAMES }, CU: { ...CUPS }, D: [...DERBY] },
  k: { ...mkWorld(KLEAGUES, KXIDS, KWIDS), N: KNATIONS, NM: KN, CU: KCUPS, D: KDERBY },
};
const refill = (o, src) => { for (const k in o) delete o[k]; Object.assign(o, src); };
export let WLD = 'e';
export function setWorld(w) {
  w = w === 'k' ? 'k' : 'e'; if (w === WLD) return;
  const D = WORLDS[w]; WLD = w;
  LEAGUES.length = 0; LEAGUES.push(...D.L); refill(LMAP, {}); for (const L of D.L) LMAP[L.id] = L;
  refill(CLUBS, D.C); XIDS.length = 0; XIDS.push(...D.X); WIDS.length = 0; WIDS.push(...D.W);
  NATIONS.length = 0; NATIONS.push(...D.N); refill(NAMES, D.NM); refill(CUPS, D.CU); DERBY.length = 0; DERBY.push(...D.D);
  for (const k in OTXT[w]) { ORIGINS[k].d = OTXT[w][k][0]; ORIGINS[k].tier = OTXT[w][k][1]; }
  MOM.calim.i = PTXT[w][0]; [...PERKS, ...PERKS2].find(p => p.id === 'taktik').n = PTXT[w][1];
}

// Maçın havası: her maç başka akar. w: an ağırlığı çarpanları, add: mevkide olmayan ana eklenen ağırlık,
// mom: an sayısı farkı, lu/lo: atılan/yenen gol çarpanı, vars: bu maçta sık çıkan çeşitlemeler
export const SCN = {
  denge: { n: tt('Dengeli maç'), d: tt('İki takım da birbirini tartıyor.'), i: 'swap' },
  acik: { n: tt('Açık maç'), d: tt('İki takım da gidip geliyor: bol pozisyon, bol gol.'), i: 'bolt', mom: 1, lu: 1.18, lo: 1.18, w: { sut: 1.3, vole: 1.3, kosu: 1.4, ribaund: 1.6 }, vars: ['kontra'] },
  kilit: { n: tt('Kilit maç'), d: tt('Alan yok, pozisyon az. Her top altın değerinde.'), i: 'lock', mom: -1, lu: .78, lo: .78, vars: ['kalabalik', 'baski', 'sondk'] },
  pres: { n: tt('Önde baskı'), d: tt('Rakip nefes aldırmıyor: top ayağında durmayacak.'), i: 'alert', w: { pas: 1.5, calim: 1.3 }, vars: ['baski'] },
  duran: { n: tt('Duran top günü'), d: tt('Hakem düdüğü elinden bırakmıyor: frikik, korner, yan top.'), i: 'whistle', w: { frikik: 3, korner: 2.5, kafa: 1.7, duvar: 3, cikis: 2.5, penalti: 1.5 }, add: { frikik: 8, korner: 7, kafa: 8 } },
  kontra: { n: tt('Kontra fırsatları'), d: tt('Rakip açık veriyor: arkaya koşu ve bire bir.'), i: 'right', w: { calim: 1.6, kosu: 2.2, sut: 1.15 }, add: { kosu: 8 }, vars: ['kontra', 'yorgun'] },
  kusatma: { n: tt('Kuşatma'), d: tt('Rakip üstünüze geliyor. Bugün savunma günü.'), i: 'shield', lu: .88, lo: 1.15, w: { savunma: 2, markaj: 2.2, kurtaris: 1.3, kafa: 1.2 }, add: { savunma: 12, markaj: 8 }, vars: ['yildiz'] },
  duello: { n: tt('Özel markaj'), d: tt('Rakibin en iyisi bugün senin peşinde.'), i: 'eye', w: { calim: 1.7, savunma: 1.4, markaj: 1.7 }, vars: ['yildiz'] },
};

// An çeşitlemeleri: aynı an her seferinde başka koşulda gelir. k: uyduğu anlar, vr: mini oyuna giden ayar
// (t süre, sp rakip hızı, acc isabet dağılımı, n fazladan savunmacı, side dar açı), dif: simülasyonda zorluk, rt: başarırsan ek maç notu, from: en erken dakika
export const MVAR = {
  dar: { n: tt('Dar açı'), d: tt('Top kanatta kaldı, kale dar görünüyor.'), k: ['sut'], vr: { side: 1, acc: 1.12 }, dif: .04, rt: .2 },
  kalabalik: { n: tt('Kalabalık'), d: tt('Önün insan dolu; bir kişi fazla basıyor.'), k: ['sut', 'pas', 'calim'], vr: { n: 1 }, dif: .04, rt: .15 },
  kontra: { n: tt('Kontra atak'), d: tt('Savunma dağınık, önün açık. Çabuk ol.'), k: ['sut', 'calim', 'pas'], vr: { n: -1, t: .75 }, dif: -.03, rt: 0 },
  baski: { n: tt('Baskı altında'), d: tt('Düşünecek vakit yok.'), k: ['pas', 'sut', 'orta', 'korner', 'ribaund'], vr: { t: .64 }, dif: .04, rt: .15 },
  yildiz: { n: tt('Zorlu rakip'), d: tt('Karşındaki bugün gününde: daha hızlı, daha sert.'), k: ['calim', 'savunma', 'markaj'], vr: { sp: 1.15 }, dif: .05, rt: .25 },
  yorgun: { n: tt('Yorgun savunma'), d: tt('Rakibin bacakları ağırlaştı.'), k: ['calim', 'sut', 'pas', 'kosu'], vr: { sp: .84 }, dif: -.04, rt: 0, from: 65 },
  sondk: { n: tt('Son dakikalar'), d: tt('Bu top maçın kaderini belirler.'), k: ['sut', 'kafa', 'pas', 'calim', 'savunma', 'markaj', 'orta', 'korner', 'frikik', 'kurtaris', 'kosu'], vr: { t: .85, acc: 1.08, sp: 1.06 }, dif: .03, rt: .35, from: 82 },
  uzak: { n: tt('Uzak mesafe'), d: tt('Kale uzak: isabet zor, kaleci hazır.'), k: ['sut', 'frikik'], vr: { acc: 1.28 }, dif: .05, rt: .3 },
  sert: { n: tt('Yakın mesafe'), d: tt('Vuruş burnunun dibinden geliyor.'), k: ['kurtaris', 'cikis'], vr: { sp: 1.22 }, dif: .06, rt: .3 },
};

// ---------- oyun rolleri: maçta karşına çıkan anları değiştirir. m: an ağırlığı çarpanı, add: mevkide olmayan an, tac: uyduğu sistemler ----------
export const PROLE = {
  FV: [
    { id: 'hedef', n: tt('Hedef forvet'), d: tt('Sırtı dönük oyna, hava toplarını indir. Kafa ve dönen top çok gelir, koşu azalır.'), i: 'shield', m: { kafa: 1.9, ribaund: 1.6, calim: .5, kosu: .55 }, tac: ['kanat', 'otobus'] },
    { id: 'firsatci', n: tt('Fırsatçı'), d: tt('Savunmanın arkasına koş, ceza sahasında bekle. Koşu ve tek vuruş çok gelir, pas azalır.'), i: 'bolt', m: { kosu: 2, ribaund: 1.5, sut: 1.1, pas: .55, kafa: .8 }, tac: ['kontra', 'hucum'] },
    { id: 'sahte9', n: tt('Sahte dokuz'), d: tt('Geriye gel, oyunu kur. Pas ve çalım artar, kafa azalır; frikik de gelir.'), i: 'swap', m: { pas: 2.2, calim: 1.4, sut: .8, kafa: .45 }, add: { frikik: 5 }, tac: ['top', 'pres'] },
  ],
  KN: [
    { id: 'cizgi', n: tt('Çizgi kanadı'), d: tt('Çizgiye in, ortayı kes. Orta ve korner artar, şut azalır.'), i: 'right', m: { orta: 1.8, korner: 1.4, sut: .55, calim: 1.1 }, tac: ['kanat'] },
    { id: 'iceri', n: tt('İçe kat eden kanat'), d: tt('İçeri gir, kaleyi yokla. Şut ve çalım artar, orta azalır.'), i: 'target', m: { sut: 1.7, calim: 1.3, orta: .5, vole: 1.3 }, tac: ['hucum', 'kontra'] },
    { id: 'kbek', n: tt('Kanat bek'), d: tt('Bütün çizgi senin: geride top kap, önde orta aç. Şut neredeyse hiç gelmez.'), i: 'shield', m: { orta: 1.3, sut: .45, calim: .7 }, add: { savunma: 16, markaj: 6 }, tac: ['otobus', 'pres'] },
  ],
  OS: [
    { id: 'kurucu', n: tt('Oyun kurucu'), d: tt('Top hep sende. Pas ve duran top artar, savunma görevi azalır.'), i: 'swap', m: { pas: 1.7, frikik: 1.5, korner: 1.4, savunma: .6, markaj: .6 }, tac: ['top'] },
    { id: 'kutu', n: tt('İki yönlü orta saha'), d: tt('Bir ceza sahasından ötekine. Şut, dönen top ve müdahale artar; pas azalır.'), i: 'bolt', m: { sut: 1.5, savunma: 1.4, ribaund: 2.2, pas: .8 }, tac: ['pres', 'hucum'] },
    { id: 'kesici', n: tt('Ön libero'), d: tt('Savunmanın önünde süpür. Müdahale ve markaj çok gelir, şut ve çalım azalır.'), i: 'shield', m: { savunma: 2, markaj: 2.4, sut: .45, calim: .5 }, tac: ['otobus', 'kontra'] },
  ],
  DF: [
    { id: 'stoper', n: tt('Stoper'), d: tt('Ceza sahasının bekçisi. Markaj, kafa ve müdahale artar; orta neredeyse hiç gelmez.'), i: 'shield', m: { savunma: 1.3, markaj: 1.6, kafa: 1.4, orta: .25 }, tac: ['otobus'] },
    { id: 'hbek', n: tt('Hücum beki'), d: tt('Çizgiden bindir. Orta ve pas artar, çalım da gelir; markaj azalır.'), i: 'right', m: { orta: 2.2, pas: 1.2, kafa: .6, markaj: .7 }, add: { calim: 8 }, tac: ['kanat', 'hucum'] },
    { id: 'kuran', n: tt('Oyun kuran stoper'), d: tt('Oyunu geriden sen başlat. Pas çok gelir, orta azalır.'), i: 'swap', m: { pas: 2, savunma: .9, orta: .5 }, tac: ['top'] },
  ],
  KL: [
    { id: 'kcizgi', n: tt('Çizgi kalecisi'), d: tt('Çizgide kal, refleksine güven. Kurtarış artar; hava topu ve ayakla oyun azalır.'), i: 'shield', m: { kurtaris: 1.25, cikis: .5, pas: .5 }, tac: ['otobus'] },
    { id: 'libero', n: tt('Libero kaleci'), d: tt('Kalenden çık, oyuna katıl. Pas ve hava topu çok gelir.'), i: 'swap', m: { pas: 2.4, cikis: 1.7, kurtaris: .85 }, tac: ['top', 'pres'] },
    { id: 'penci', n: tt('Penaltı avcısı'), d: tt('Büyük anların kalecisi. Penaltı ve frikik kurtarışı çok gelir.'), i: 'target', m: { penkurtar: 2.6, duvar: 1.6 }, tac: [] },
  ],
};

// ---------- senaryolu başlangıçlar ----------
export const SCENS = [
  { id: 'kurtar', n: tt('Kurtarıcı'), d: tt('24 yaşındasın. En üst ligin en zayıf takımındasın; herkes düşmenizi bekliyor.'), g: tt('Sezonu küme düşmeden bitir'), i: 'shield' },
  { id: 'donus', n: tt('Dönüş'), d: tt('27 yaşındasın. Ağır bir diz sakatlığından çıkıyorsun: ilk sekiz hafta yoksun, hızın eskisi gibi değil.'), g: tt('15 maça çık ve 7,0 ortalama yakala'), i: 'plus' },
  { id: 'sondans', n: tt('Son dans'), d: tt('35 yaşındasın. Zirveye oynayan bir takımda belki de son sezonun.'), g: tt('Şampiyon ol ya da 15 maçta 7,2 ortalama yakala'), i: 'crown' },
];

// ---------- koleksiyon: mağazanın üçüncü kademesi, her sezon yeni parçalar ----------
export const COLK = {
  forma: { n: tt('İmzalı forma'), i: 'shirt', base: 4e6, l: [tt('1954 finalinin forması'), tt('Çamurlu derbi forması'), tt('Efsane kalecinin eldiveni'), tt('İlk milli maç forması'), tt('Kupa finali kaptan pazubendi'), tt('Yüzüncü gol topu'), tt('Eski mahalle takımı forması'), tt('Veda maçı kramponu')] },
  saat: { n: tt('Saat'), i: 'clock', base: 15e6, l: [tt('Çelik kasa dalgıç saati'), tt('Altın kordonlu klasik'), tt('Ay takvimli el işi'), tt('Yarış kronografı'), tt('Platin ince kasa'), tt('Pilot saati'), tt('Sınırlı üretim iskelet'), tt('Cep saati, 1920')] },
  tablo: { n: tt('Tablo'), i: 'star', base: 40e6, l: [tt('Boğaz\'da sabah'), tt('Toprak sahada çocuklar'), tt('Kırmızı tribün'), tt('Sapanca\'da sis'), tt('Maç günü kalabalığı'), tt('Limanda akşam'), tt('Soyut: doksan artı üç'), tt('Yağmurda kale direği')] },
  araba: { n: tt('Klasik araba'), i: 'car', base: 90e6, l: [tt('1965 kırmızı coupe'), tt('1972 üstü açık roadster'), tt('1958 krem rengi sedan'), tt('1969 yeşil yarış arabası'), tt('1981 köşeli hatchback'), tt('1954 gümüş martı kanat'), tt('1977 sarı arazi aracı'), tt('1990 siyah süper spor')] },
};

// ---------- krampon sponsoru ve menajerin bulduğu markalar ----------
export const BOOTS = ['Poyraz', 'Zirve', 'Akın', 'Kıvılcım'];
export const SPN = [tt('Enerji içeceği markası'), tt('Banka reklamı'), tt('Otomobil bayisi'), tt('Telefon operatörü'), tt('Giyim markası'), tt('Yerel süt markası')];

// ---------- soyunma odası klikleri: r takım arkadaşı sırası (kaptan, yıldız, kıdemli, genç, kaleci) ----------
export const KLIK = { kid: { n: tt('Kıdemliler'), r: [0, 2], i: 'crown' }, yil: { n: tt('Yıldızlar'), r: [1, 4], i: 'star' }, gen: { n: tt('Gençler'), r: [3], i: 'up' } };

// ---------- sezon öncesi kamp ----------
export const CAMP = [
  { id: 'kon', n: tt('Kondisyon'), d: tt('Sezon boyunca her hafta enerji +3'), i: 'bolt' },
  { id: 'tak', n: tt('Taktik'), d: tt('Bu sezon hocanın sistemine uyumun +8'), i: 'whistle' },
  { id: 'tek', n: tt('Bireysel teknik'), d: tt('Mevkinin iki ana özelliği hemen gelişir'), i: 'ball' },
  { id: 'bag', n: tt('Takım ruhu'), d: tt('Takım arkadaşlarınla bağ +8, soyunma odası gerginliği düşer'), i: 'users' },
];

// ---------- sözleşme pazarlığı maddeleri ----------
export const NEGO = [
  { id: 'wage', n: tt('Ücret'), d: tt('Haftalık ücrete %12 zam'), i: 'coin' },
  { id: 'sign', n: tt('İmza parası'), d: tt('İmza parasını %35 artır'), i: 'pen' },
  { id: 'goalB', n: tt('Gol primi'), d: tt('Gol başına primi ikiye katla'), i: 'ball' },
  { id: 'img', n: tt('İmaj hakkı'), d: tt('Sponsor gelirin %25 artar'), i: 'tag' },
  { id: 'loy', n: tt('Sadakat primi'), d: tt('Kulüpte kaldığın her sezon sonunda toplu ödeme'), i: 'heart' },
  { id: 'rel', n: tt('Serbest kalma bedeli'), d: tt('Bedeli düşük tut: ayrılmak kolaylaşır'), i: 'lock' },
  { id: 'kisa', n: tt('Süreyi kısalt'), d: tt('Bir sezon erken serbest kalırsın'), i: 'clock' },
  { id: 'app', n: tt('Maç başı prim'), d: tt('Oynadığın her maç için ek ödeme'), i: 'shirt' },
  { id: 'forma', n: tt('Forma garantisi'), d: tt('Hocanın tercihinde öne geçersin'), i: 'shield' },
  { id: 'kap', n: tt('Kaptanlık maddesi'), d: tt('Pazubent sözleşmeyle senin'), i: 'crown' },
];

// ---------- menajerle konuşma ----------
export const AGTOP = {
  durum: { n: tt('Piyasam nasıl?'), d: tt('Kulüpler seni nasıl görüyor'), i: 'chart' },
  bul: { n: tt('Bana kulüp bul'), d: tt('Ne istediğini söyle, kapıları çalsın'), i: 'eye' },
  zam: { n: tt('Zam iste'), d: tt('Kulüple masaya otursun: sezonda bir kez'), i: 'coin' },
  spon: { n: tt('Sponsor bul'), d: tt('Yeni bir reklam anlaşması arasın'), i: 'tag' },
  hayal: { n: tt('Hedef takımım'), d: tt('O formaya ne kadar uzaksın'), i: 'heart' },
  kiralik: { n: tt('Kiralık ayarla'), d: tt('Forma giyeceğin bir kulüp bulsun'), i: 'clock' },
};
export const AGBR = {
  ust: { n: tt('Daha güçlü bir kulüp'), d: tt('Seviye atlamak istiyorum'), i: 'up' },
  sure: { n: tt('Forma şansı'), d: tt('Güç fark etmez, oynayacağım bir yer olsun'), i: 'shirt' },
  para: { n: tt('En yüksek ücret'), d: tt('Kim çok veriyorsa'), i: 'coin' },
  yurt: { n: tt('Yurt dışı'), d: tt('Başka bir ülkede oynamak istiyorum'), i: 'globe' },
};

// Eski kayıtlardaki gerçek kulüp, lig ve kupa adlarının yeni karşılıkları (bir kez, yüklerken çevrilir)
export const REN = {"Galatasaray": "Galata", "Fenerbahçe": "Kadıköy", "Trabzonspor": "Trabzon", "Samsunspor": "Samsun", "Eyüpspor": "Eyüp", "Çaykur Rizespor": "Rize", "Konyaspor": "Konya", "Alanyaspor": "Alanya", "Kocaelispor": "Kocaeli", "Antalyaspor": "Antalya", "Gaziantep FK": "Gaziantep", "Kayserispor": "Kayseri", "Fatih Karagümrük": "Karagümrük", "Sivasspor": "Sivas", "Bodrum FK": "Bodrum", "Hatayspor": "Hatay", "Bandırmaspor": "Bandırma", "Çorum FK": "Çorum", "Erzurumspor FK": "Erzurum", "Esenler Erokspor": "Esenler", "Amed SF": "Diyarbakır", "Sakaryaspor": "Sakarya", "İstanbulspor": "İstanbul", "Iğdır FK": "Iğdır", "Boluspor": "Bolu", "Keçiörengücü": "Keçiören", "Manisa FK": "Manisa", "Pendikspor": "Pendik", "Ümraniyespor": "Ümraniye", "Vanspor FK": "Van", "Serik Belediyespor": "Serik", "Adana Demirspor": "Adana D", "Bursaspor": "Bursa", "MKE Ankaragücü": "Ankara A", "Batman Petrolspor": "Batman", "Muğlaspor": "Muğla", "Mardin 1969 Spor": "Mardin", "Menemen FK": "Menemen", "Elazığspor": "Elazığ", "Aksarayspor": "Aksaray", "Adanaspor": "Adana", "Şanlıurfaspor": "Şanlıurfa", "Kastamonuspor": "Kastamonu", "Altınordu": "İzmir O", "Isparta 32 Spor": "Isparta", "Güzide Gebzespor": "Gebze", "Fethiyespor": "Fethiye", "Kırklarelispor": "Kırklareli", "Somaspor": "Soma", "Yeni Malatyaspor": "Malatya", "Altay": "İzmir A", "Eskişehirspor": "Eskişehir", "Denizlispor": "Denizli", "Balıkesirspor": "Balıkesir", "Giresunspor": "Giresun", "Kütahyaspor": "Kütahya", "Orduspor 1967": "Ordu", "Düzcespor": "Düzce", "İnegölspor": "İnegöl", "Zonguldakspor FK": "Zonguldak", "Çorluspor 1947": "Çorlu", "Silivrispor": "Silivri", "Ayvalıkgücü Belediyespor": "Ayvalık", "Nazillispor": "Nazilli", "Uşakspor": "Uşak", "Edirnespor": "Edirne", "Pazarspor": "Pazar", "Darıca Gençlerbirliği": "Darıca", "Kartalspor": "Kartal", "Tepecikspor": "Tepecik", "Hendekspor": "Hendek", "Gölcükspor": "Gölcük", "Yalovaspor": "Yalova", "Çengelköyspor": "Çengelköy", "Tekirdağspor": "Tekirdağ", "Sapanca Gençlikspor": "Sapanca", "Bozüyük Vitraspor": "Bozüyük", "Lüleburgazspor": "Lüleburgaz", "Modafenspor": "Moda", "Çanakkalespor": "Çanakkale", "Bilecikspor": "Bilecik", "Mudanyaspor": "Mudanya", "Orhangazispor": "Orhangazi", "Arsenal": "Londra A", "Manchester City": "Manchester C", "Newcastle United": "Newcastle", "Aston Villa": "Birmingham V", "Manchester United": "Manchester U", "Nottingham Forest": "Nottingham", "Crystal Palace": "Londra P", "Wolves": "Wolverhampton", "Leeds United": "Leeds", "London City Lionesses": "Londra L", "Birmingham City": "Birmingham C", "Charlton Athletic": "Charlton", "Real Madrid": "Madrid", "Atlético Madrid": "Madrid A", "Athletic Club": "Bilbao", "Real Betis": "Sevilla B", "Real Sociedad": "San Sebastián", "Celta Vigo": "Vigo", "Osasuna": "Pamplona", "Rayo Vallecano": "Vallecas", "Espanyol": "Barcelona E", "Alavés": "Vitoria", "Levante": "Valencia L", "Real Oviedo": "Oviedo", "Madrid CFF": "Madrid C", "Badalona Women": "Badalona", "Deportivo Abanca": "La Coruña", "Logroño United": "Logroño", "Bayern München": "Münih", "Borussia Dortmund": "Dortmund", "Bayer Leverkusen": "Leverkusen", "RB Leipzig": "Leipzig", "Eintracht Frankfurt": "Frankfurt", "VfB Stuttgart": "Stuttgart", "Mainz 05": "Mainz", "Werder Bremen": "Bremen", "Union Berlin": "Berlin U", "Hamburger SV": "Hamburg", "VfL Wolfsburg": "Wolfsburg", "TSG Hoffenheim": "Hoffenheim", "SC Freiburg": "Freiburg", "1. FC Köln": "Köln", "1. FC Nürnberg": "Nürnberg", "Inter": "Milano I", "Juventus": "Torino J", "Milan": "Milano", "Atalanta": "Bergamo", "Fiorentina": "Floransa", "Udinese": "Udine", "Genoa": "Cenova", "Cremonese": "Cremona", "Como 1907": "Como", "Como Women": "Como K", "Ternana": "Terni", "Paris Saint-Germain": "Paris", "Marseille": "Marsilya", "Paris FC": "Paris F", "OL Lyonnes": "Lyon", "PSV": "Eindhoven", "Ajax": "Amsterdam", "Feyenoord": "Rotterdam", "AZ Alkmaar": "Alkmaar", "NEC Nijmegen": "Nijmegen", "Go Ahead Eagles": "Deventer", "Sparta Rotterdam": "Rotterdam S", "Fortuna Sittard": "Sittard", "Heracles": "Almelo", "PEC Zwolle": "Zwolle", "NAC Breda": "Breda", "Excelsior": "Rotterdam E", "Telstar": "Velsen", "ADO Den Haag": "Lahey", "De Graafschap": "Doetinchem", "Benfica": "Lizbon", "Sporting CP": "Lizbon S", "Vitória SC": "Guimarães", "Santa Clara": "Ponta Delgada", "Casa Pia": "Lizbon C", "Rio Ave": "Vila do Conde", "Moreirense": "Moreira", "Gil Vicente": "Barcelos", "Nacional": "Funchal", "Estrela Amadora": "Amadora", "AVS": "Vila das Aves", "Torreense": "Torres Vedras", "Racing Power": "Seixal", "Valadares Gaia": "Gaia", "Marítimo": "Funchal M", "Al-Hilal": "Riyad H", "Al-Nassr": "Riyad N", "Al-Ittihad": "Cidde İ", "Al-Ahli": "Cidde A", "Al-Qadsiah": "Hubar", "Al-Shabab": "Riyad Ş", "Neom SC": "Neom", "Al-Ettifaq": "Dammam", "Al-Taawoun": "Bureyde", "Al-Fateh": "Hasa", "Al-Khaleej": "Seyhat", "Al-Fayha": "Mecmaa", "Damac": "Hamis Muşeyt", "Al-Riyadh": "Riyad R", "Al-Kholood": "Ras K", "Al-Okhdood": "Necran", "Al-Najma": "Uneyze", "Al-Hazem": "Ras H", "Celtic": "Glasgow C", "Rangers": "Glasgow R", "Club Brugge": "Brugge", "Union SG": "Brüksel U", "RB Salzburg": "Salzburg", "Sturm Graz": "Graz", "Shakhtar Donetsk": "Donetsk", "Dinamo Kiev": "Kiev", "Olympiakos": "Pire", "PAOK": "Selanik", "Panathinaikos": "Atina P", "Kızılyıldız": "Belgrad K", "Partizan": "Belgrad P", "Young Boys": "Bern", "Dinamo Zagreb": "Zagreb", "Slavia Prag": "Prag S", "Sparta Prag": "Prag", "Viktoria Plzen": "Plzen", "Ferencvaros": "Budapeşte", "Bodo/Glimt": "Bodø", "Karabağ": "Ağdam", "Ludogorets": "Razgrad", "Legia Varşova": "Varşova", "Maccabi Tel Aviv": "Tel Aviv", "Hearts": "Edinburgh", "Antwerp": "Anvers", "LASK": "Linz", "Rapid Wien": "Viyana", "AEK Atina": "Atina A", "Aris": "Selanik A", "Bröndby": "Brøndby", "Servette": "Cenevre", "Hajduk Split": "Split", "Jagiellonia": "Białystok", "Rakow": "Częstochowa", "CFR Cluj": "Cluj", "Rosenborg": "Trondheim", "Djurgarden": "Stockholm D", "Hammarby": "Stockholm H", "HJK Helsinki": "Helsinki", "Shamrock Rovers": "Dublin", "Omonia": "Lefkoşa O", "APOEL": "Lefkoşa A", "Slovan Bratislava": "Bratislava", "Olimpija Ljubljana": "Ljubljana", "Flamengo": "Rio F", "Palmeiras": "São Paulo P", "River Plate": "Buenos Aires R", "Boca Juniors": "Buenos Aires B", "Al Ahly": "Kahire", "Urawa Reds": "Saitama", "ABB FOMGET": "Ankara F", "Amed": "Diyarbakır", "Hakkarigücü": "Hakkari", "Ünye Kadın": "Ünye", "Sultanbeyligücü": "Sultanbeyli", "1207 Antalyaspor": "Antalya", "Giresun Sanayispor": "Giresun", "Şile Bilgidoğa": "Şile", "Kayseri Kadın": "Kayseri", "Bakırköy Kadın": "Bakırköy", "Haymanaspor": "Haymana", "Kocaeli Bayan FK": "Kocaeli", "Sakarya Kadın FK": "Sakarya", "Dudulluspor": "Dudullu", "Hatay Defnespor": "Hatay", "Gaziantep Safir": "Gaziantep", "Adana İdman Yurdu": "Adana", "Genç Ülküm": "Ankara Ü", "Soma Zaferspor": "Soma", "Gazikentspor": "Gaziantep G", "Şırnak Kadın SK": "Şırnak", "Avcılar Cihangirspor": "Avcılar", "Sancaktepe Belediyespor": "Sancaktepe", "Afyon Anadolu Gücü": "Afyon", "Kdz. Ereğli Lisesi": "Ereğli", "Siverek Kadın SK": "Siverek", "Bursa Soğanlıspor": "Bursa", "Tuzla Sahilspor": "Tuzla", "Pendik Güvenspor": "Pendik", "Tekirdağ Gençlik": "Tekirdağ", "Antalya Deniz Kadın": "Antalya D", "Denizli Sultanlar": "Denizli", "7 Eylül Gençlikspor": "7 Eylül", "Uşak 64 Belediye": "Uşak", "Kılıçaslan Yıldızspor": "Kılıçaslan", "Karabük Gençlerbirliği": "Karabük", "Yakacık Genç Erlerbirliği": "Yakacık", "Rusumat-4": "Rusumat", "Amasyaspor": "Amasya", "1955 Batman Belediyespor": "Batman", "Vangücü": "Van", "Kahramanmaraş Anadolu": "Kahramanmaraş", "Defne Belediyespor": "Defne", "Asenalar Kadın FK": "Asenalar", "BK Häcken": "Göteborg", "Malmö FF": "Malmö", "Rosengård": "Malmö R", "Vålerenga": "Oslo", "Brann": "Bergen", "Austria Wien": "Viyana A", "OH Leuven": "Leuven", "Fortuna Hjørring": "Hjørring", "HB Køge": "Køge", "Glasgow City": "Glasgow S", "Vorskla Poltava": "Poltava", "Ferencváros": "Budapeşte", "Breiðablik": "Kópavogur", "Valur": "Reykjavik", "GKS Katowice": "Katowice", "Apollon": "Limasol", "FC Minsk": "Minsk", "KuPS": "Kuopio", "Spartak Subotica": "Subotica", "SFK 2000 Saraybosna": "Saraybosna", "Mura": "Murska Sobota", "Shelbourne": "Dublin", "BIIK Şımkent": "Şımkent", "Gintra": "Şiauliai", "Farul Köstence": "Köstence", "Vllaznia": "İşkodra", "Gotham FC": "New York", "Corinthians": "São Paulo C", "Wuhan Jiangda": "Wuhan", "AS FAR": "Rabat", "FIFA Kadınlar Şampiyonlar Kupası": "Kadınlar Kıtalararası Kupa", "Şampiyonlar Ligi": "Kıta Ligi", "Şamp. Ligi": "Kıta Ligi", "Avrupa Ligi": "Kıta Kupası", "Konferans Ligi": "Kıta Kalkanı", "Dünya Kupası": "Dünya Turnuvası", "Avrupa Şampiyonası": "Avrupa Turnuvası", "Kadınlar Süper Ligi": "Kadınlar Elit Ligi", "Süper Lig": "Elit Lig", "Premier League": "İngiltere Ligi", "LaLiga": "İspanya Ligi", "Frauen-Bundesliga": "Almanya Kadın Ligi", "Bundesliga": "Almanya Ligi", "Serie A Femminile": "İtalya Kadın Ligi", "Serie A": "İtalya Ligi", "Ligue 1": "Fransa Ligi", "Vrouwen Eredivisie": "Hollanda Kadın Ligi", "Eredivisie": "Hollanda Ligi", "Liga Portugal": "Portekiz Ligi", "Saudi Pro League": "Suudi Ligi", "Women's Super League": "İngiltere Kadın Ligi", "Liga F": "İspanya Kadın Ligi", "Première Ligue": "Fransa Kadın Ligi", "Liga BPI": "Portekiz Kadın Ligi", "Women's FA Cup": "İngiltere Kadın Kupası", "FA Cup": "İngiltere Kupası", "Copa de la Reina": "İspanya Kadın Kupası", "Copa del Rey": "İspanya Kupası", "DFB-Pokal Frauen": "Almanya Kadın Kupası", "DFB-Pokal": "Almanya Kupası", "Coppa Italia Femminile": "İtalya Kadın Kupası", "Coppa Italia": "İtalya Kupası", "Coupe de France Féminine": "Fransa Kadın Kupası", "Coupe de France": "Fransa Kupası", "KNVB Beker Vrouwen": "Hollanda Kadın Kupası", "KNVB Beker": "Hollanda Kupası", "Taça de Portugal Feminina": "Portekiz Kadın Kupası", "Taça de Portugal": "Portekiz Kupası", "Avrupa Ligi'nde": "Kıta Kupası'nda", "Avrupa Ligi'ne": "Kıta Kupası'na", "Kadınlar Avrupa Kupası": "Kadınlar Kıta Kupası", "La Liga": "İspanya Ligi"};
