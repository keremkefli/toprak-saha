// Toprak Saha — veri tabanı (2025/26 sezonu kadroları baz alınmıştır)
// Kulüp satırı: "Ad|güç|renk kodu (2 harf)"

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

export const ATTR = { sut: 'Şut', pas: 'Pas', teknik: 'Teknik', hiz: 'Hız', guc: 'Güç', savunma: 'Savunma', kafa: 'Kafa', zihin: 'Zihin', kaleci: 'Kalecilik' };

// w: genel güç ağırlıkları, m: maç anı ağırlıkları, b: başlangıç bonusu
export const POS = {
  KL: { n: 'Kaleci', w: { kaleci: .55, zihin: .2, guc: .1, pas: .08, hiz: .07 }, m: { kurtaris: 85, pas: 15 }, b: { kaleci: 24, zihin: 3 } },
  DF: { n: 'Defans', w: { savunma: .35, guc: .18, kafa: .15, hiz: .12, zihin: .12, pas: .08 }, m: { savunma: 60, kafa: 12, pas: 28 }, b: { savunma: 9, guc: 5, kafa: 4 } },
  OS: { n: 'Orta Saha', w: { pas: .3, teknik: .2, zihin: .15, sut: .1, savunma: .1, guc: .08, hiz: .07 }, m: { pas: 42, sut: 18, calim: 15, savunma: 18, frikik: 7 }, b: { pas: 8, teknik: 5, zihin: 3 } },
  KN: { n: 'Kanat', w: { hiz: .25, teknik: .25, pas: .18, sut: .17, zihin: .1, guc: .05 }, m: { calim: 40, pas: 28, sut: 27, kafa: 5 }, b: { hiz: 8, teknik: 6, pas: 2 } },
  FV: { n: 'Forvet', w: { sut: .3, teknik: .18, hiz: .15, kafa: .12, zihin: .1, guc: .08, pas: .07 }, m: { sut: 45, kafa: 15, calim: 18, pas: 15, penalti: 7 }, b: { sut: 8, kafa: 4, teknik: 3 } },
};

export const ORIGINS = {
  mahalle: { n: 'Mahalle Sahası', d: 'Toprak sahada büyüdün, kimse seni tanımıyor. En alttan, 2. Amatör Lig\'den başlarsın. Evde para dar.', tier: 8, at: { teknik: 4, zihin: 3 }, money: 500, fl: { dar: 1 }, pot: 1 },
  okul: { n: 'Okul Takımı', d: 'Beden eğitimi öğretmenin seni fark etti. 1. Amatör Lig\'de başlarsın, okul notların iyi.', tier: 7, at: { pas: 2, zihin: 2 }, money: 2500, egt: 25 },
  altyapi: { n: 'Akademi Çıkışlı', d: 'Profesyonel bir kulübün akademisinde yetiştin ama sözleşme alamadın. Süper Amatör Lig\'de başlarsın. Ailen uzakta.', tier: 6, all: 5, money: 4000, pot: 2, rel: { aile: -10 } },
  gurbet: { n: 'Gurbetçi', d: 'Almanya\'da doğdun, ailen memlekete döndü. Almancan var. İleride milli takım tercihi önüne gelir.', tier: 7, at: { teknik: 3, guc: 3 }, money: 9000, dil: 55, fl: { gurbet: 1 } },
};

export const TRAITS = {
  hirsli: { n: 'Hırslı', d: 'Antrenmandan %15 fazla verim alırsın. Egon da buna eşlik eder.', hid: { prof: 15, ego: 10 }, tr: 1.15 },
  sakin: { n: 'Soğukkanlı', d: 'Baskı anında elin titremez: maç anları biraz daha yavaş akar.', at: { zihin: 5 } },
  asi: { n: 'Asi', d: 'Taraftar bayılır, hocalar zorlanır. Top tekniğin doğuştan.', hid: { ego: 25, prof: -10 }, rel: { taraf: 10, hoca: -6 }, at: { teknik: 3 } },
  lider: { n: 'Lider', d: 'Soyunma odası seni dinler. Kaptanlık yolu açık.', rel: { takim: 15, hoca: 5 }, at: { zihin: 3 } },
};

export const TRAIN = [
  { id: 'bit', n: 'Bitiricilik', a: ['sut', 'kafa'], g: 'sut', pos: ['DF', 'OS', 'KN', 'FV'] },
  { id: 'top', n: 'Top Tekniği', a: ['teknik', 'pas'], g: 'pas' },
  { id: 'fiz', n: 'Fizik', a: ['hiz', 'guc'], g: 'calim', pos: ['DF', 'OS', 'KN', 'FV'] },
  { id: 'kon', n: 'Kondisyon', a: ['hiz', 'guc'], pos: ['KL'] },
  { id: 'sav', n: 'Savunma', a: ['savunma', 'kafa'], g: 'savunma', pos: ['DF', 'OS', 'KN', 'FV'] },
  { id: 'kal', n: 'Kaleci Çalışması', a: ['kaleci', 'zihin'], g: 'kurtaris', pos: ['KL'] },
  { id: 'zih', n: 'Zihin', a: ['zihin'], g: 'penalti', pos: ['DF', 'OS', 'KN', 'FV'] },
];

// p: tek seferlik fiyat, wk: haftalık gider, e: etkiler
export const SHOP = [
  { id: 'krampon', n: 'Profesyonel krampon', d: 'Maç anlarında küçük beceri artışı.', p: 12000 },
  { id: 'telefon', n: 'Yeni telefon', d: 'Takipçi artışı hızlanır.', p: 45000, e: { fol: .5 } },
  { id: 'araba', n: 'İkinci el araba', d: 'Yol yorgunluğu biter. Haftalık enerji +3.', p: 650000, e: { en: 3 } },
  { id: 'daire', n: 'Kiralık daire', d: 'Kendi düzenin. Enerji +4, moral +4.', wk: 7500, e: { en: 4, mo: 4 } },
  { id: 'diyet', n: 'Diyetisyen', d: 'Haftalık enerji +5.', wk: 9000, e: { en: 5 } },
  { id: 'pt', n: 'Kişisel antrenör', d: 'Antrenman verimi +%20.', wk: 18000, e: { tr: .2 } },
  { id: 'halisaha', n: 'Halı saha işletmesi', d: 'Haftalık ₺45.000 gelir.', p: 3000000, e: { inc: 45000 } },
  { id: 'ev', n: 'Ev satın al', d: 'Aile rahat eder. Enerji +3, moral +6.', p: 6000000, e: { en: 3, mo: 6 } },
  { id: 'spor', n: 'Spor araba', d: 'Göz alıcı. Moral +5, takipçi artışı.', p: 12000000, e: { mo: 5, fol: .5 } },
  { id: 'kofte', n: 'Islama köfte restoranı', d: 'Adapazarı\'nda şube. Haftalık ₺240.000 gelir.', p: 15000000, e: { inc: 240000 } },
  { id: 'villa', n: 'Sapanca\'da villa', d: 'Göl manzarası. Enerji +4, moral +8.', p: 60000000, e: { en: 4, mo: 8 } },
];

export const AGENTS = [
  { n: 'Kemal Aksoy', d: 'Mahallenin abisi. Az komisyon, az bağlantı.', cut: .05, pw: .2 },
  { n: 'Selin Karaca', d: 'Ligleri iyi tanır. Dengeli seçim.', cut: .10, pw: .55 },
  { n: 'Viktor Lang', d: 'Avrupa bağlantılı ağır top. Pahalı.', cut: .15, pw: .95 },
];

export const NATIONS = [['İspanya', 86], ['Fransa', 87], ['Almanya', 85], ['İtalya', 83], ['Hollanda', 83], ['Portekiz', 85], ['Hırvatistan', 80], ['İsviçre', 78], ['Avusturya', 77], ['Çekya', 75], ['Macaristan', 74], ['Galler', 73], ['Gürcistan', 72], ['İzlanda', 70], ['Bulgaristan', 68], ['Karadağ', 68], ['Türkiye', 79]];

export const ROLE = { '11': 'İlk 11', rot: 'Rotasyon', genc: 'Gelecek vaat eden', yedek: 'Yedek', yok: 'Kadro dışı' };

export const MOM = {
  sut: { n: 'Şut', i: 'Ceza sahası önünde top sende. Kaleyi düşün!' },
  kafa: { n: 'Kafa vuruşu', i: 'Orta geliyor, yükseliyorsun!' },
  frikik: { n: 'Frikik', i: 'Ceza yayı önünde frikik. Topun başında sen varsın.' },
  penalti: { n: 'Penaltı', i: 'Penaltı! Topun başına sen geçiyorsun.' },
  pas: { n: 'Pas', i: 'Orta alanda top sende, arkadaşların koşu yapıyor.' },
  calim: { n: 'Çalım', i: 'Önünde savunma var. Adam eksilt!' },
  savunma: { n: 'Savunma', i: 'Rakip hızla üstüne geliyor. Durdur!' },
  kurtaris: { n: 'Kurtarış', i: 'Rakip şut pozisyonunda!' },
};

export const FILL = [
  'Orta sahada sert mücadele var.', 'Tribünler ayakta.', 'Rakip topu çeviriyor, pres yapıyorsunuz.',
  'Köşe vuruşundan sonuç çıkmadı.', 'Hakem oyunu devam ettirdi.', 'Hoca kenardan bağırıyor.',
  'Tempo düştü, iki takım da kontrollü.', 'Zemin oyunu zorlaştırıyor.', 'Uzun top auta çıktı.',
  'Rakip ofsayta düştü.', 'Kenar yönetimi ısınanlara işaret etti.',
];

export const CUPS = { EN: 'FA Cup', ES: 'Copa del Rey', DE: 'DFB-Pokal', IT: 'Coppa Italia', FR: 'Coupe de France', NL: 'KNVB Beker', PT: 'Taça de Portugal', SA: 'Kral Kupası' };
export const TSTAT = { mutlu: 'Mutluyum', acik: 'Tekliflere açığım', istek: 'Transfer istiyorum', kiralik: 'Kiralık gitmek istiyorum' };
export const STANCE = { kilit: 'Satılık değil', acik: 'Uygun teklife açık', liste: 'Satış listesinde', kiralik: 'Kiralık oyuncu' };
