// Toprak Saha — kadın futbolu veri tabanı (2026/27 sezonu baz alınmıştır)
// Kulüp satırı erkeklerdeki gibi: "Ad|güç|renk kodu (2 harf)". Güçler kadın futbolunun kendi içindeki ölçektir.
// Kaynaklar: TFF 2026-2027 Kadın Ligleri Statüsü (EK-5), tff.org fikstür sayfaları, Wikipedia 2026–27 sezon sayfaları, UEFA erişim listesi.
// Bu dosya yalnızca ham veridir; tablolar js/data.js içindeki setWorld ile kurulur.

const T = s => s.trim().split('\n').map(x => x.trim()).filter(Boolean);

// Türkiye: Süper Lig 16 takım (son 3 düşer), 1. Lig 16 takım (gerçekte 8'erli 2 grup), 2. Lig (gerçekte 4 grup, 23 takım; burada 20'si),
// 3. Lig yerel gruplardır ve ilden üretilir (gen).
export const KLEAGUES = [
  { id: 'tr1', c: 'TR', name: 'Kadınlar Süper Ligi', tier: 1, teams: T(`
    Fenerbahçe|71|NY
    Galatasaray|70|RY
    Beşiktaş|69|KW
    Trabzonspor|69|MS
    ABB FOMGET|67|BW
    Yüksekova|65|GY
    Amed|64|GR
    Hakkarigücü|64|BW
    Ünye Kadın|61|RW
    Sultanbeyligücü|60|YK
    1207 Antalyaspor|60|RW
    Giresun Sanayispor|59|GW
    Şile Bilgidoğa|59|BY
    Kayseri Kadın|59|YR
    Bakırköy Kadın|58|GK
    Haymanaspor|58|RK`) },
  { id: 'tr2', c: 'TR', name: 'Kadınlar 1. Ligi', tier: 2, teams: T(`
    Kocaeli Bayan FK|53|GK
    Sakarya Kadın FK|51|GK
    Dudulluspor|51|RW
    Hatay Defnespor|51|MW
    Gaziantep Safir|50|RK
    Adana İdman Yurdu|50|OW
    Horozkent|50|GW
    Genç Ülküm|49|GW
    Soma Zaferspor|49|KW
    Gazikentspor|48|RW
    Şırnak Kadın SK|48|YG
    Avcılar Cihangirspor|48|BW
    Sancaktepe Belediyespor|47|NW
    Afyon Anadolu Gücü|47|PW
    Kdz. Ereğli Lisesi|46|RB
    Siverek Kadın SK|46|GY`) },
  { id: 'tr3', c: 'TR', name: 'Kadınlar 2. Ligi', tier: 3, teams: T(`
    Eskişehirspor|43|RK
    Bursa Soğanlıspor|42|GW
    Tuzla Sahilspor|42|BW
    Pendik Güvenspor|41|RW
    Tekirdağ Gençlik|40|RN
    Antalya Deniz Kadın|42|SW
    Denizli Sultanlar|41|GK
    7 Eylül Gençlikspor|40|KW
    Uşak 64 Belediye|39|RK
    Akıncılar|38|BY
    Kılıçaslan Yıldızspor|41|YR
    Karabük Gençlerbirliği|40|RB
    Yakacık Genç Erlerbirliği|40|NY
    Rusumat-4|39|PW
    Amasyaspor|38|RW
    1955 Batman Belediyespor|41|RW
    Vangücü|40|RK
    Kahramanmaraş Anadolu|39|RW
    Defne Belediyespor|38|GW
    Asenalar Kadın FK|37|MW`) },
  { id: 'tr4', c: 'TR', name: 'Kadınlar 3. Ligi', tier: 4, gen: true },
  { id: 'en1', c: 'EN', name: 'Women\'s Super League', tier: 1, teams: T(`
    Chelsea|88|BW
    Arsenal|88|RW
    Manchester City|87|SW
    Manchester United|83|RK
    London City Lionesses|78|NO
    Tottenham|78|WN
    Brighton|77|BW
    Aston Villa|76|MS
    Everton|76|BW
    Liverpool|76|RW
    West Ham|74|MS
    Birmingham City|72|BW
    Crystal Palace|71|RB
    Charlton Athletic|70|RW`) },
  { id: 'es1', c: 'ES', name: 'Liga F', tier: 1, teams: T(`
    Barcelona|91|BM
    Real Madrid|84|WC
    Atlético Madrid|79|RW
    Real Sociedad|78|BW
    Athletic Club|75|RW
    Tenerife|74|BW
    Sevilla|73|WR
    Granada|72|RW
    Madrid CFF|72|WM
    Badalona Women|71|BK
    Deportivo Abanca|70|BW
    Espanyol|70|BW
    Valencia|69|WK
    Eibar|69|BM
    Logroño United|68|RW
    Alavés|67|BW`) },
  { id: 'de1', c: 'DE', name: 'Frauen-Bundesliga', tier: 1, teams: T(`
    Bayern München|87|RW
    VfL Wolfsburg|84|GW
    Eintracht Frankfurt|81|KW
    Bayer Leverkusen|78|RK
    TSG Hoffenheim|77|BW
    SC Freiburg|76|RK
    Werder Bremen|75|GW
    RB Leipzig|74|WR
    1. FC Köln|73|WR
    Union Berlin|73|RW
    Hamburger SV|72|WB
    1. FC Nürnberg|71|MK
    VfB Stuttgart|71|WR
    Mainz 05|69|RW`) },
  { id: 'it1', c: 'IT', name: 'Serie A Femminile', tier: 1, teams: T(`
    Roma|81|MY
    Juventus|81|KW
    Inter|79|BK
    Fiorentina|76|PW
    Milan|76|RK
    Como 1907|74|BW
    Lazio|74|SW
    Napoli|73|SW
    Sassuolo|72|GK
    Como Women|72|TW
    Parma|71|YB
    Ternana|70|RG`) },
  { id: 'fr1', c: 'FR', name: 'Première Ligue', tier: 1, teams: T(`
    OL Lyonnes|89|WR
    Paris Saint-Germain|83|NR
    Paris FC|80|NS
    Nantes|73|YG
    Fleury|73|RK
    Marseille|72|WS
    Montpellier|72|NO
    Strasbourg|71|BW
    Le Havre|70|SN
    Lens|69|RY
    Toulouse|68|PW
    Saint-Malo|67|KW`) },
  { id: 'nl1', c: 'NL', name: 'Vrouwen Eredivisie', tier: 1, teams: T(`
    PSV|76|RW
    Ajax|76|WR
    Twente|76|RW
    Feyenoord|73|RW
    AZ Alkmaar|71|RW
    Utrecht|71|RW
    ADO Den Haag|69|GY
    PEC Zwolle|68|BW
    Heerenveen|68|BW
    De Graafschap|65|BW`) },
  { id: 'pt1', c: 'PT', name: 'Liga BPI', tier: 1, teams: T(`
    Benfica|78|RW
    Sporting CP|75|GW
    Braga|72|RW
    Porto|70|BW
    Torreense|70|BM
    Racing Power|68|KY
    Valadares Gaia|67|GY
    Vitória SC|67|WK
    Rio Ave|65|GW
    Marítimo|65|GR`) },
];

// Liglerimizin dışındaki Avrupa kulüpleri: yalnızca Kadınlar Şampiyonlar Ligi ve Avrupa Kupası'nda görünürler
export const KXIDS = T(`
  BK Häcken|76|YK|İsveç
  Hammarby|74|GW|İsveç
  Malmö FF|72|SW|İsveç
  Rosengård|72|SW|İsveç
  Vålerenga|74|BR|Norveç
  Brann|73|RW|Norveç
  Rosenborg|70|WK|Norveç
  St. Pölten|72|BY|Avusturya
  Austria Wien|67|PW|Avusturya
  Slavia Prag|72|RW|Çekya
  Sparta Prag|71|MW|Çekya
  OH Leuven|70|WG|Belçika
  Anderlecht|68|PW|Belçika
  Fortuna Hjørring|69|GW|Danimarka
  Nordsjælland|69|RY|Danimarka
  HB Køge|68|KS|Danimarka
  Young Boys|68|YK|İsviçre
  Servette|68|MW|İsviçre
  Basel|67|RB|İsviçre
  Glasgow City|67|OK|İskoçya
  Rangers|67|BW|İskoçya
  Celtic|66|GW|İskoçya
  Vorskla Poltava|66|GW|Ukrayna
  Ferencváros|66|GW|Macaristan
  Breiðablik|66|GW|İzlanda
  Valur|65|RW|İzlanda
  GKS Katowice|65|GY|Polonya
  Apollon|64|BW|Kıbrıs
  FC Minsk|64|RB|Belarus
  HJK Helsinki|63|BW|Finlandiya
  KuPS|63|YK|Finlandiya
  Spartak Subotica|63|BW|Sırbistan
  Kızılyıldız|63|RW|Sırbistan
  SFK 2000 Saraybosna|63|BW|Bosna Hersek
  Mura|62|KW|Slovenya
  Osijek|62|BW|Hırvatistan
  PAOK|62|KW|Yunanistan
  Shelbourne|62|RW|İrlanda
  BIIK Şımkent|62|BW|Kazakistan
  Gintra|61|YG|Litvanya
  Farul Köstence|61|BW|Romanya
  Vllaznia|61|RB|Arnavutluk
`);

// FIFA Kadınlar Şampiyonlar Kupası rakipleri: Avrupa şampiyonunun karşısına çıkar
export const KWIDS = T(`
  Gotham FC|80|KS|ABD
  Corinthians|78|KW|Brezilya
  Wuhan Jiangda|70|OW|Çin
  AS FAR|68|KR|Fas
`);

// Kadınlar 3. Ligi yerel gruplardır; ilçe adlarından üretilir. Sakarya için ilçeler (erkek listesinde elle yazılı kulüpler var).
export const KPROV = { Sakarya: ['Adapazarı', 'Serdivan', 'Erenler', 'Arifiye', 'Akyazı', 'Hendek', 'Karasu', 'Sapanca', 'Geyve', 'Pamukova', 'Ferizli', 'Söğütlü', 'Kaynarca', 'Kocaali'] };

// Yalnızca ön adlar; soyadlar erkek listesiyle ortaktır
export const KNAMES = {
  TR: ['Ayşe', 'Elif', 'Zeynep', 'Ebru', 'Kader', 'Selin', 'Melike', 'Büşra', 'Esra', 'Derya', 'İlayda', 'Ece', 'Fatma', 'Gülbin', 'Birgül', 'Kezban', 'Sevgi', 'Yağmur', 'Arzu', 'Didem', 'Berna', 'Cansu', 'Emine', 'Gamze', 'Miray', 'İpek', 'Başak', 'Sude', 'Nazlıcan', 'Benan'],
  EN: ['Lucy', 'Leah', 'Ella', 'Chloe', 'Beth', 'Georgia', 'Millie', 'Alessia', 'Lauren', 'Keira'],
  ES: ['Aitana', 'Irene', 'Mariona', 'Olga', 'Laia', 'Patri', 'Ona', 'Claudia', 'Salma', 'Athenea'],
  DE: ['Lena', 'Giulia', 'Klara', 'Laura', 'Jule', 'Sophia', 'Lea', 'Marina', 'Felicitas', 'Sara'],
  IT: ['Sara', 'Elena', 'Martina', 'Giulia', 'Valentina', 'Arianna', 'Chiara', 'Lisa', 'Barbara', 'Cristiana'],
  FR: ['Marie', 'Amandine', 'Eugénie', 'Sandy', 'Selma', 'Élisa', 'Grace', 'Clara', 'Maëlle', 'Kadidiatou'],
  NL: ['Lieke', 'Jill', 'Daniëlle', 'Vivianne', 'Esmee', 'Victoria', 'Dominique', 'Lynn', 'Sherida', 'Jackie'],
  PT: ['Jéssica', 'Kika', 'Ana', 'Tatiana', 'Carolina', 'Diana', 'Andreia', 'Dolores', 'Inês', 'Catarina'],
};

// Milli takımlar (kadın futbolu ölçeğinde). Avrupa ülkeleri eleme gruplarında, hepsi Dünya Kupası'nda karşına çıkar.
export const KNATIONS = [['İspanya', 90], ['İngiltere', 88], ['Almanya', 86], ['Fransa', 86], ['İsveç', 85], ['Hollanda', 83], ['İtalya', 81], ['Norveç', 80], ['Danimarka', 79], ['Belçika', 76], ['İzlanda', 76], ['Avusturya', 76], ['Portekiz', 75], ['İsviçre', 75], ['İrlanda', 73], ['Polonya', 73], ['İskoçya', 72], ['Çekya', 71], ['Finlandiya', 71], ['Galler', 70], ['Sırbistan', 70], ['Ukrayna', 68], ['Macaristan', 66], ['Türkiye', 65]];
export const KWORLD = [['ABD', 90], ['Japonya', 85], ['Brezilya', 84], ['Kanada', 83], ['Kuzey Kore', 82], ['Avustralya', 80], ['Kolombiya', 78], ['Çin', 76], ['Meksika', 76], ['Nijerya', 76], ['Güney Kore', 75], ['Güney Afrika', 71], ['Yeni Zelanda', 70], ['Fas', 70], ['Arjantin', 70]];

// Ülke kupaları. Türkiye'de kadınlarda ulusal kupa düzenlenmiyor (2026-2027 statüsünde yok).
export const KCUPS = { EN: 'Women\'s FA Cup', ES: 'Copa de la Reina', DE: 'DFB-Pokal Frauen', IT: 'Coppa Italia Femminile', FR: 'Coupe de France Féminine', NL: 'KNVB Beker Vrouwen', PT: 'Taça de Portugal Feminina' };

export const KDERBY = [['Galatasaray', 'Fenerbahçe', 'Beşiktaş', 'Trabzonspor'], ['Hakkarigücü', 'Yüksekova'], ['Sakarya Kadın FK', 'Kocaeli Bayan FK'], ['ABB FOMGET', 'Haymanaspor'], ['Gaziantep Safir', 'Gazikentspor'],
  ['Real Madrid', 'Barcelona', 'Atlético Madrid'], ['Manchester United', 'Manchester City', 'Liverpool', 'Everton'], ['Arsenal', 'Tottenham', 'Chelsea'], ['Inter', 'Milan', 'Juventus'], ['Roma', 'Lazio'], ['Como 1907', 'Como Women'], ['Bayern München', 'VfL Wolfsburg'],
  ['Paris Saint-Germain', 'Paris FC', 'OL Lyonnes'], ['Ajax', 'Feyenoord', 'PSV', 'Twente'], ['Benfica', 'Porto', 'Sporting CP']];
