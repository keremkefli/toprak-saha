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
  { id: 'tr1', c: 'TR', name: 'Süper Lig', tier: 1, teams: T(`
    Galatasaray|82|RY
    Fenerbahçe|81|NY
    Beşiktaş|77|KW
    Trabzonspor|76|MS
    Başakşehir|73|ON
    Samsunspor|73|RW
    Göztepe|72|YR
    Eyüpspor|70|PY
    Çaykur Rizespor|69|GB
    Kasımpaşa|69|BW
    Konyaspor|69|GW
    Alanyaspor|69|OG
    Kocaelispor|68|GK
    Antalyaspor|68|RW
    Gaziantep FK|68|RK
    Kayserispor|67|YR
    Gençlerbirliği|67|RK
    Fatih Karagümrük|67|RK`) },
  { id: 'tr2', c: 'TR', name: '1. Lig', tier: 2, teams: T(`
    Sivasspor|65|RW
    Bodrum FK|64|GW
    Hatayspor|63|MW
    Bandırmaspor|63|MW
    Çorum FK|63|RK
    Erzurumspor FK|63|BW
    Esenler Erokspor|63|GY
    Amed SF|63|GR
    Sakaryaspor|62|GK
    İstanbulspor|62|YK
    Iğdır FK|62|GW
    Boluspor|61|RW
    Keçiörengücü|61|MW
    Manisa FK|61|KW
    Pendikspor|61|RW
    Ümraniyespor|61|RW
    Vanspor FK|60|RK
    Sarıyer|59|NW
    Serik Belediyespor|59|GW
    Adana Demirspor|58|SN`) },
  { id: 'tr3', c: 'TR', name: '2. Lig', tier: 3, teams: T(`
    Bursaspor|60|GW
    MKE Ankaragücü|59|NY
    Batman Petrolspor|57|RW
    Muğlaspor|57|GW
    Mardin 1969 Spor|57|RN
    Menemen FK|56|YN
    Elazığspor|56|MW
    Aksarayspor|56|RG
    Adanaspor|55|OW
    Şanlıurfaspor|55|YG
    Kastamonuspor|55|RK
    Altınordu|55|RN
    Isparta 32 Spor|55|PG
    Güzide Gebzespor|55|PW
    Fethiyespor|55|BW
    Kırklarelispor|54|GW
    Somaspor|54|KW
    Yeni Malatyaspor|52|YK`) },
  { id: 'tr4', c: 'TR', name: '3. Lig', tier: 4, teams: T(`
    Altay|53|KW
    Karşıyaka|53|GR
    Eskişehirspor|53|RK
    Denizlispor|52|GK
    Balıkesirspor|51|RW
    Giresunspor|51|GW
    Kütahyaspor|50|BW
    Orduspor 1967|50|PW
    Düzcespor|50|RB
    İnegölspor|50|MW
    Zonguldakspor FK|49|RN
    Çorluspor 1947|49|RW
    Silivrispor|49|RB
    Ayvalıkgücü Belediyespor|49|YR
    Nazillispor|49|KW
    Uşakspor|48|RK
    Edirnespor|48|RY
    Pazarspor|48|GW`) },
  { id: 'tr5', c: 'TR', name: 'Bölgesel Amatör Lig', tier: 5, teams: T(`
    Darıca Gençlerbirliği|47|RW
    Kartalspor|47|RB
    Tepecikspor|46|BW
    Hendekspor|45|GW
    Gölcükspor|45|RW
    Yalovaspor|45|BW
    Çengelköyspor|45|RN
    Tekirdağspor|45|RN
    Sapanca Gençlikspor|44|GY
    Bozüyük Vitraspor|44|BY
    Lüleburgazspor|44|GW
    Modafenspor|44|NW
    Çanakkalespor|44|RW
    Bilecikspor|43|RW
    Mudanyaspor|43|BW
    Orhangazispor|43|RW`) },
  { id: 'tr6', c: 'TR', name: 'Süper Amatör Lig', tier: 6, gen: true },
  { id: 'tr7', c: 'TR', name: '1. Amatör Lig', tier: 7, gen: true },
  { id: 'tr8', c: 'TR', name: '2. Amatör Lig', tier: 8, gen: true },
  { id: 'en1', c: 'EN', name: 'Premier League', tier: 1, teams: T(`
    Liverpool|89|RW
    Arsenal|88|RW
    Manchester City|88|SW
    Chelsea|85|BW
    Newcastle United|83|KW
    Aston Villa|83|MS
    Manchester United|82|RK
    Tottenham|82|WN
    Brighton|80|BW
    Nottingham Forest|80|RW
    Crystal Palace|79|RB
    Bournemouth|79|RK
    Brentford|78|RW
    Fulham|78|WK
    Everton|77|BW
    West Ham|77|MS
    Wolves|75|OK
    Leeds United|75|WY
    Sunderland|75|RW
    Burnley|74|MS`) },
  { id: 'es1', c: 'ES', name: 'LaLiga', tier: 1, teams: T(`
    Real Madrid|90|WC
    Barcelona|90|BM
    Atlético Madrid|86|RW
    Athletic Club|82|RW
    Villarreal|82|YN
    Real Betis|80|GW
    Real Sociedad|79|BW
    Sevilla|77|WR
    Valencia|77|WK
    Celta Vigo|77|SW
    Girona|76|RW
    Osasuna|76|RN
    Rayo Vallecano|76|WR
    Mallorca|75|RK
    Getafe|75|BW
    Espanyol|74|BW
    Alavés|74|BW
    Levante|73|NM
    Elche|73|WG
    Real Oviedo|72|BW`) },
  { id: 'de1', c: 'DE', name: 'Bundesliga', tier: 1, teams: T(`
    Bayern München|90|RW
    Borussia Dortmund|85|YK
    Bayer Leverkusen|84|RK
    RB Leipzig|83|WR
    Eintracht Frankfurt|81|KR
    VfB Stuttgart|80|WR
    Freiburg|78|RK
    Mainz 05|77|RW
    Mönchengladbach|77|WG
    Wolfsburg|77|GW
    Werder Bremen|76|GW
    Hoffenheim|76|BW
    Augsburg|75|RG
    Union Berlin|75|RW
    Köln|74|WR
    Hamburger SV|74|BW
    St. Pauli|73|MW
    Heidenheim|72|RB`) },
  { id: 'it1', c: 'IT', name: 'Serie A', tier: 1, teams: T(`
    Inter|88|BK
    Napoli|86|SW
    Juventus|85|KW
    Milan|84|RK
    Atalanta|83|BK
    Roma|83|MO
    Lazio|80|SW
    Bologna|80|RN
    Fiorentina|79|PW
    Como|77|BW
    Torino|76|MW
    Udinese|75|KW
    Genoa|75|RN
    Sassuolo|74|GK
    Cagliari|73|RN
    Parma|73|YB
    Lecce|72|YR
    Verona|72|YN
    Pisa|71|KB
    Cremonese|71|RE`) },
  { id: 'fr1', c: 'FR', name: 'Ligue 1', tier: 1, teams: T(`
    Paris Saint-Germain|90|NR
    Marseille|82|WS
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
    Paris FC|73|NW
    Lorient|72|OK
    Angers|71|KW
    Le Havre|71|SN
    Metz|71|MW`) },
  { id: 'nl1', c: 'NL', name: 'Eredivisie', tier: 1, teams: T(`
    PSV|80|RW
    Ajax|79|WR
    Feyenoord|79|RW
    AZ Alkmaar|76|RW
    Twente|75|RW
    Utrecht|75|RW
    NEC Nijmegen|71|RG
    Go Ahead Eagles|71|RY
    Heerenveen|70|BW
    Sparta Rotterdam|70|RW
    Groningen|70|GW
    Fortuna Sittard|69|YG
    Heracles|68|KW
    PEC Zwolle|68|BW
    NAC Breda|68|YK
    Volendam|67|OK
    Excelsior|67|RK
    Telstar|66|WB`) },
  { id: 'pt1', c: 'PT', name: 'Liga Portugal', tier: 1, teams: T(`
    Benfica|82|RW
    Sporting CP|82|GW
    Porto|81|BW
    Braga|77|RW
    Vitória SC|73|WK
    Famalicão|71|BW
    Santa Clara|71|RW
    Estoril|70|YB
    Casa Pia|70|KW
    Rio Ave|70|GW
    Moreirense|70|GW
    Gil Vicente|70|RB
    Arouca|69|YB
    Nacional|68|KW
    Estrela Amadora|68|RG
    AVS|67|RW
    Tondela|67|GY
    Alverca|67|RB`) },
  { id: 'sa1', c: 'SA', name: 'Saudi Pro League', tier: 1, teams: T(`
    Al-Hilal|82|BW
    Al-Nassr|81|YB
    Al-Ittihad|81|YK
    Al-Ahli|81|GW
    Al-Qadsiah|77|RY
    Al-Shabab|74|WK
    Neom SC|73|TW
    Al-Ettifaq|73|GR
    Al-Taawoun|72|YB
    Al-Fateh|70|BG
    Al-Khaleej|70|YG
    Al-Fayha|69|OB
    Damac|69|RY
    Al-Riyadh|68|RK
    Al-Kholood|68|YK
    Al-Okhdood|67|SW
    Al-Najma|66|GW
    Al-Hazem|66|RY`) },
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

// Liglerimizin dışındaki Avrupa kulüpleri: yalnızca Şampiyonlar Ligi ve Avrupa Ligi'nde görünürler
export const XIDS = T(`
  Celtic|73|GW|İskoçya
  Rangers|72|BW|İskoçya
  Club Brugge|75|BK|Belçika
  Anderlecht|72|PW|Belçika
  Union SG|73|YB|Belçika
  Genk|71|BW|Belçika
  RB Salzburg|72|RW|Avusturya
  Sturm Graz|70|KW|Avusturya
  Shakhtar Donetsk|73|OK|Ukrayna
  Dinamo Kiev|71|WB|Ukrayna
  Olympiakos|74|RW|Yunanistan
  PAOK|72|KW|Yunanistan
  Panathinaikos|71|GW|Yunanistan
  Kızılyıldız|72|RW|Sırbistan
  Partizan|69|KW|Sırbistan
  Kopenhag|72|WB|Danimarka
  Midtjylland|71|KR|Danimarka
  Young Boys|71|YK|İsviçre
  Basel|71|RB|İsviçre
  Dinamo Zagreb|72|BW|Hırvatistan
  Slavia Prag|74|RW|Çekya
  Sparta Prag|73|MW|Çekya
  Viktoria Plzen|71|RB|Çekya
  Ferencvaros|71|GW|Macaristan
  Bodo/Glimt|73|YK|Norveç
  Malmö|70|SW|İsveç
  Karabağ|71|KW|Azerbaycan
  Ludogorets|69|GW|Bulgaristan
  Legia Varşova|70|GW|Polonya
  Maccabi Tel Aviv|70|YB|İsrail
  Hearts|68|MW|İskoçya
  Aberdeen|67|RW|İskoçya
  Gent|70|BW|Belçika
  Antwerp|70|RW|Belçika
  LASK|68|KW|Avusturya
  Rapid Wien|69|GW|Avusturya
  AEK Atina|71|YK|Yunanistan
  Aris|68|YK|Yunanistan
  Bröndby|69|YB|Danimarka
  Lugano|68|KW|İsviçre
  Servette|68|MW|İsviçre
  Hajduk Split|69|WB|Hırvatistan
  Rijeka|68|WB|Hırvatistan
  Jagiellonia|68|YR|Polonya
  Rakow|69|RB|Polonya
  CFR Cluj|68|MW|Romanya
  Rosenborg|68|WK|Norveç
  Molde|69|BW|Norveç
  Djurgarden|68|SB|İsveç
  Hammarby|68|GW|İsveç
  HJK Helsinki|66|BW|Finlandiya
  Shamrock Rovers|65|GW|İrlanda
  Omonia|66|GW|Kıbrıs
  APOEL|66|YB|Kıbrıs
  Slovan Bratislava|68|SW|Slovakya
  Olimpija Ljubljana|66|GW|Slovenya
`).map((t, i) => { const [n, r, c, x] = t.split('|'), id = 'x_' + i; CLUBS[id] = { n, r: +r, c1: PAL[c[0]], c2: PAL[c[1]], x }; return id; });

// Kıtalararası Kupa rakipleri: Şampiyonlar Ligi'ni kazanan kulübün karşısına çıkar
export const WIDS = T(`
  Flamengo|80|RK|Brezilya
  Palmeiras|79|GW|Brezilya
  River Plate|78|WR|Arjantin
  Boca Juniors|77|NY|Arjantin
  Monterrey|74|NW|Meksika
  Al Ahly|72|RW|Mısır
  Urawa Reds|70|RK|Japonya
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
  KL: { n: tt('Kaleci'), w: { kaleci: .55, zihin: .2, guc: .1, pas: .08, hiz: .07 }, m: { kurtaris: 62, pas: 14, duvar: 8, penkurtar: 5, cikis: 12 }, b: { kaleci: 24, zihin: 3 } },
  DF: { n: tt('Defans'), w: { savunma: .35, guc: .18, kafa: .15, hiz: .12, zihin: .12, pas: .08 }, m: { savunma: 42, markaj: 14, kafa: 12, pas: 20, orta: 12 }, b: { savunma: 9, guc: 5, kafa: 4 } },
  OS: { n: tt('Orta Saha'), w: { pas: .3, teknik: .2, zihin: .15, sut: .1, savunma: .1, guc: .08, hiz: .07 }, m: { pas: 28, sut: 14, calim: 12, savunma: 12, markaj: 6, frikik: 7, orta: 10, korner: 7, vole: 2, ribaund: 3 }, b: { pas: 8, teknik: 5, zihin: 3 } },
  KN: { n: tt('Kanat'), w: { hiz: .25, teknik: .25, pas: .18, sut: .17, zihin: .1, guc: .05 }, m: { calim: 26, pas: 14, sut: 19, kafa: 4, orta: 22, vole: 5, korner: 6, kosu: 9 }, b: { hiz: 8, teknik: 6, pas: 2 } },
  FV: { n: tt('Forvet'), w: { sut: .3, teknik: .18, hiz: .15, kafa: .12, zihin: .1, guc: .08, pas: .07 }, m: { sut: 32, kafa: 12, calim: 13, pas: 10, penalti: 5, vole: 8, rovesata: 4, orta: 6, kosu: 11, ribaund: 8 }, b: { sut: 8, kafa: 4, teknik: 3 } },
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
  { id: 'kofte', n: tt('Islama köfte restoranı'), d: tt('Adapazarı\'nda şube. Haftalık ₺240.000 gelir.'), p: 15000000, e: { inc: 240000 } },
  { id: 'villa', n: tt('Sapanca\'da villa'), d: tt('Göl manzarası. Enerji +4, moral +8.'), p: 60000000, e: { en: 4, mo: 8 } },
];

export const AGENTS = [
  { n: 'Kemal Aksoy', d: tt('Mahallenin abisi. Az komisyon, az bağlantı.'), cut: .05, pw: .2 },
  { n: 'Selin Karaca', d: tt('Ligleri iyi tanır. Dengeli seçim.'), cut: .10, pw: .55 },
  { n: 'Viktor Lang', d: tt('Avrupa bağlantılı ağır top. Pahalı.'), cut: .15, pw: .95 },
  { n: 'Deniz Arman', d: tt('Yıldızların menajeri. Kapıları tekmeyle açar; payı da ona göre.'), cut: .2, pw: 1.25, rep: 60 },
  { n: 'Amcan', d: tt('Aileden biri. Seni kandırmaz ama kimseyi de tanımaz.'), cut: .03, pw: .08 },
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
};

export const FILL = [
  tt('Orta sahada sert mücadele var.'), tt('Tribünler ayakta.'), tt('Rakip topu çeviriyor, pres yapıyorsunuz.'),
  tt('Köşe vuruşundan sonuç çıkmadı.'), tt('Hakem oyunu devam ettirdi.'), tt('Hoca kenardan bağırıyor.'),
  tt('Tempo düştü, iki takım da kontrollü.'), tt('Zemin oyunu zorlaştırıyor.'), tt('Uzun top auta çıktı.'),
  tt('Rakip ofsayta düştü.'), tt('Kenar yönetimi ısınanlara işaret etti.'),
];

export const CUPS = { EN: 'FA Cup', ES: 'Copa del Rey', DE: 'DFB-Pokal', IT: 'Coppa Italia', FR: 'Coupe de France', NL: 'KNVB Beker', PT: 'Taça de Portugal', SA: 'Kral Kupası' };
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
export const POSTS = [
  { id: 'idman', n: tt('Antrenman karesi'), i: 'train', fx: { hoca: 1 }, f: 1, t: [tt('Bugün de eksiksiz. Hafta sonu hazırız.'), tt('Ter atmadan forma yok.')] },
  { id: 'taraf', n: tt('Taraftara mesaj'), i: 'heart', fx: { taraf: 5 }, f: 1.3, t: [tt('Tribünde sizi duymak başka. Hafta sonu görüşürüz!'), tt('Bu forma sizin için terliyor.')] },
  { id: 'aile', n: tt('Aile ve memleket'), i: 'home', fx: { aile: 5, mo: 2 }, f: 1, t: [tt('Anne yemeği gibisi yok.'), tt('Nereye gidersem gideyim, memleket burada.')] },
  { id: 'luks', n: tt('Lüks hayat'), i: 'star', fx: { ego: 4, taraf: -3 }, f: 2.4, need: ['araba', 'spor', 'villa', 'ev'], t: [tt('Emeklerin karşılığı.'), tt('Yeni oyuncak.')] },
  { id: 'spon', n: tt('Sponsor paylaşımı'), i: 'tag', fx: {}, f: .8, spon: 1, t: [tt('Yeni sezonda yanımda olanlar belli. #işbirliği')] },
];
export const FANS = ['tribun54', 'sakaryali_reis', 'kale_arkasi', 'gol_hasreti', 'mahallenin_sesi', 'forma_asigi', 'deplasman_yolcusu', 'eski_acik'];

export const ACH = [
  ['ilkgol', tt('İlk gol'), 'ball'], ['hat', 'Hat-trick', 'star'], ['g50', tt('50 gol'), 'ball'], ['g100', tt('100 gol'), 'ball'], ['g250', tt('250 gol'), 'ball'],
  ['pro', tt('İlk profesyonel sözleşme'), 'pen'], ['sl', tt('Süper Lig oyuncusu'), 'shield'], ['yurt', tt('Yurt dışı macerası'), 'globe'], ['milli', tt('Milli forma'), 'flag'],
  ['kupa', tt('Kupa kaldırdın'), 'trophy'], ['avrupa', tt('Şampiyonlar Ligi şampiyonu'), 'crown'], ['al', tt('Avrupa Ligi şampiyonu'), 'trophy'], ['hayal', tt('Hayalindeki forma'), 'heart'], ['m1', tt('1 milyon takipçi'), 'phone'],
  ['ay', tt('Ayın oyuncusu'), 'star'], ['yil11', tt('Yılın 11\'i'), 'users'],
  ['milk', tt('Milli takımla kupa'), 'flag'], ['efsane', tt('Kulüp efsanesi'), 'crown'],
];

// Maç içi kararlar. p: konuşan kişi, i: ikon
export const DEC = {
  ht: { t: tt('Devre arası'), p: 'hoca', i: 'whistle', o: [tt('Takımı ateşle'), tt('Kendi oyununa odaklan'), tt('Riskli oyna')], s: [tt('Tutarsa takım gol bulabilir'), tt('Kalan anlar daha sakin akar'), tt('Fazladan pozisyon, fazladan sakatlık riski')] },
  pen: { t: tt('Penaltı!'), p: 'takim', i: 'target', o: [tt('Ben atarım'), tt('Ustası atsın')], s: [tt('Penaltıyı sen kullanırsın'), tt('Takımın penaltıcısı atar')] },
  ref: { t: tt('Tartışmalı karar'), p: 'fed', i: 'alert', o: [tt('İtiraz et'), tt('Oyuna dön')], s: [tt('Tribün sever, kart riski var'), tt('Hoca takdir eder')] },
  knock: { t: tt('Bir şey oldu'), p: 'doktor', i: 'plus', o: [tt('Devam et'), tt('Değişiklik iste')], s: [tt('Sakatlık riski artar'), tt('Maç senin için biter')] },
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
};
export const DERBY = [['Galatasaray', 'Fenerbahçe', 'Beşiktaş', 'Trabzonspor'], ['Sakaryaspor', 'Kocaelispor'], ['Göztepe', 'Karşıyaka', 'Altay'], ['Bursaspor', 'Eskişehirspor'], ['Adana Demirspor', 'Adanaspor'], ['Gençlerbirliği', 'MKE Ankaragücü'],
  ['Real Madrid', 'Barcelona', 'Atlético Madrid'], ['Manchester United', 'Manchester City', 'Liverpool'], ['Arsenal', 'Tottenham', 'Chelsea'], ['Inter', 'Milan', 'Juventus'], ['Roma', 'Lazio'], ['Bayern München', 'Borussia Dortmund'],
  ['Paris Saint-Germain', 'Marseille'], ['Ajax', 'Feyenoord', 'PSV'], ['Benfica', 'Porto', 'Sporting CP'], ['Al-Hilal', 'Al-Nassr', 'Al-Ittihad']];
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
