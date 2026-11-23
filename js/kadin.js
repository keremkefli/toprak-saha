// Toprak Saha — kadın futbolu veri tabanı (2026/27 sezonu baz alınmıştır)
// Kulüp satırı erkeklerdeki gibi: "Ad|güç|renk kodu (2 harf)". Güçler kadın futbolunun kendi içindeki ölçektir.
// Kaynaklar: TFF 2026-2027 Kadın Ligleri Statüsü (EK-5), tff.org fikstür sayfaları, Wikipedia 2026–27 sezon sayfaları, UEFA erişim listesi.
// Bu dosya yalnızca ham veridir; tablolar js/data.js içindeki setWorld ile kurulur.

const T = s => s.trim().split('\n').map(x => x.trim()).filter(Boolean);

// Türkiye: Elit Lig 16 takım (son 3 düşer), 1. Lig 16 takım (gerçekte 8'erli 2 grup), 2. Lig (gerçekte 4 grup, 23 takım; burada 20'si),
// 3. Lig yerel gruplardır ve ilden üretilir (gen).
export const KLEAGUES = [
  { id: 'tr1', c: 'TR', name: 'Kadınlar Elit Ligi', tier: 1, teams: T(`
    Kadıköy|71|NY
    Galata|70|RY
    Beşiktaş|69|KW
    Trabzon|69|MS
    Ankara F|67|BW
    Yüksekova|65|GY
    Diyarbakır|64|GR
    Hakkari|64|BW
    Ünye|61|RW
    Sultanbeyli|60|YK
    Antalya|60|RW
    Giresun|59|GW
    Şile|59|BY
    Kayseri|59|YR
    Bakırköy|58|GK
    Haymana|58|RK`) },
  { id: 'tr2', c: 'TR', name: 'Kadınlar 1. Ligi', tier: 2, teams: T(`
    Kocaeli|53|GK
    Sakarya|51|GK
    Dudullu|51|RW
    Hatay|51|MW
    Gaziantep|50|RK
    Adana|50|OW
    Horozkent|50|GW
    Ankara Ü|49|GW
    Soma|49|KW
    Gaziantep G|48|RW
    Şırnak|48|YG
    Avcılar|48|BW
    Sancaktepe|47|NW
    Afyon|47|PW
    Ereğli|46|RB
    Siverek|46|GY`) },
  { id: 'tr3', c: 'TR', name: 'Kadınlar 2. Ligi', tier: 3, teams: T(`
    Eskişehir|43|RK
    Bursa|42|GW
    Tuzla|42|BW
    Pendik|41|RW
    Tekirdağ|40|RN
    Antalya D|42|SW
    Denizli|41|GK
    7 Eylül|40|KW
    Uşak|39|RK
    Akıncılar|38|BY
    Kılıçaslan|41|YR
    Karabük|40|RB
    Yakacık|40|NY
    Rusumat|39|PW
    Amasya|38|RW
    Batman|41|RW
    Van|40|RK
    Kahramanmaraş|39|RW
    Defne|38|GW
    Asenalar|37|MW`) },
  { id: 'tr4', c: 'TR', name: 'Kadınlar 3. Ligi', tier: 4, gen: true },
  { id: 'en1', c: 'EN', name: 'İngiltere Kadın Ligi', tier: 1, teams: T(`
    Chelsea|88|BW
    Londra A|88|RW
    Manchester C|87|SW
    Manchester U|83|RK
    Londra L|78|NO
    Tottenham|78|WN
    Brighton|77|BW
    Birmingham V|76|MS
    Everton|76|BW
    Liverpool|76|RW
    West Ham|74|MS
    Birmingham C|72|BW
    Londra P|71|RB
    Charlton|70|RW`) },
  { id: 'es1', c: 'ES', name: 'İspanya Kadın Ligi', tier: 1, teams: T(`
    Barcelona|91|BM
    Madrid|84|WC
    Madrid A|79|RW
    San Sebastián|78|BW
    Bilbao|75|RW
    Tenerife|74|BW
    Sevilla|73|WR
    Granada|72|RW
    Madrid C|72|WM
    Badalona|71|BK
    La Coruña|70|BW
    Barcelona E|70|BW
    Valencia|69|WK
    Eibar|69|BM
    Logroño|68|RW
    Vitoria|67|BW`) },
  { id: 'de1', c: 'DE', name: 'Almanya Kadın Ligi', tier: 1, teams: T(`
    Münih|87|RW
    Wolfsburg|84|GW
    Frankfurt|81|KW
    Leverkusen|78|RK
    Hoffenheim|77|BW
    Freiburg|76|RK
    Bremen|75|GW
    Leipzig|74|WR
    Köln|73|WR
    Berlin U|73|RW
    Hamburg|72|WB
    Nürnberg|71|MK
    Stuttgart|71|WR
    Mainz|69|RW`) },
  { id: 'it1', c: 'IT', name: 'İtalya Kadın Ligi', tier: 1, teams: T(`
    Roma|81|MY
    Torino J|81|KW
    Milano I|79|BK
    Floransa|76|PW
    Milano|76|RK
    Como|74|BW
    Lazio|74|SW
    Napoli|73|SW
    Sassuolo|72|GK
    Como K|72|TW
    Parma|71|YB
    Terni|70|RG`) },
  { id: 'fr1', c: 'FR', name: 'Fransa Kadın Ligi', tier: 1, teams: T(`
    Lyon|89|WR
    Paris|83|NR
    Paris F|80|NS
    Nantes|73|YG
    Fleury|73|RK
    Marsilya|72|WS
    Montpellier|72|NO
    Strasbourg|71|BW
    Le Havre|70|SN
    Lens|69|RY
    Toulouse|68|PW
    Saint-Malo|67|KW`) },
  { id: 'nl1', c: 'NL', name: 'Hollanda Kadın Ligi', tier: 1, teams: T(`
    Eindhoven|76|RW
    Amsterdam|76|WR
    Twente|76|RW
    Rotterdam|73|RW
    Alkmaar|71|RW
    Utrecht|71|RW
    Lahey|69|GY
    Zwolle|68|BW
    Heerenveen|68|BW
    Doetinchem|65|BW`) },
  { id: 'pt1', c: 'PT', name: 'Portekiz Kadın Ligi', tier: 1, teams: T(`
    Lizbon|78|RW
    Lizbon S|75|GW
    Braga|72|RW
    Porto|70|BW
    Torres Vedras|70|BM
    Seixal|68|KY
    Gaia|67|GY
    Guimarães|67|WK
    Vila do Conde|65|GW
    Funchal M|65|GR`) },
];

// Liglerimizin dışındaki Avrupa kulüpleri: yalnızca Kadınlar Kıta Ligi ve Kıta Kupası'nda görünürler
export const KXIDS = T(`
  Göteborg|76|YK|İsveç
  Stockholm H|74|GW|İsveç
  Malmö|72|SW|İsveç
  Malmö R|72|SW|İsveç
  Oslo|74|BR|Norveç
  Bergen|73|RW|Norveç
  Trondheim|70|WK|Norveç
  St. Pölten|72|BY|Avusturya
  Viyana A|67|PW|Avusturya
  Prag S|72|RW|Çekya
  Prag|71|MW|Çekya
  Leuven|70|WG|Belçika
  Anderlecht|68|PW|Belçika
  Hjørring|69|GW|Danimarka
  Nordsjælland|69|RY|Danimarka
  Køge|68|KS|Danimarka
  Bern|68|YK|İsviçre
  Cenevre|68|MW|İsviçre
  Basel|67|RB|İsviçre
  Glasgow S|67|OK|İskoçya
  Glasgow R|67|BW|İskoçya
  Glasgow C|66|GW|İskoçya
  Poltava|66|GW|Ukrayna
  Budapeşte|66|GW|Macaristan
  Kópavogur|66|GW|İzlanda
  Reykjavik|65|RW|İzlanda
  Katowice|65|GY|Polonya
  Limasol|64|BW|Kıbrıs
  Minsk|64|RB|Belarus
  Helsinki|63|BW|Finlandiya
  Kuopio|63|YK|Finlandiya
  Subotica|63|BW|Sırbistan
  Belgrad K|63|RW|Sırbistan
  Saraybosna|63|BW|Bosna Hersek
  Murska Sobota|62|KW|Slovenya
  Osijek|62|BW|Hırvatistan
  Selanik|62|KW|Yunanistan
  Dublin|62|RW|İrlanda
  Şımkent|62|BW|Kazakistan
  Şiauliai|61|YG|Litvanya
  Köstence|61|BW|Romanya
  İşkodra|61|RB|Arnavutluk
`);

// Kadınlar Kıtalararası Kupa rakipleri: Avrupa şampiyonunun karşısına çıkar
export const KWIDS = T(`
  New York|80|KS|ABD
  São Paulo C|78|KW|Brezilya
  Wuhan|70|OW|Çin
  Rabat|68|KR|Fas
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

// Milli takımlar (kadın futbolu ölçeğinde). Avrupa ülkeleri eleme gruplarında, hepsi Dünya Turnuvası'nda karşına çıkar.
export const KNATIONS = [['İspanya', 90], ['İngiltere', 88], ['Almanya', 86], ['Fransa', 86], ['İsveç', 85], ['Hollanda', 83], ['İtalya', 81], ['Norveç', 80], ['Danimarka', 79], ['Belçika', 76], ['İzlanda', 76], ['Avusturya', 76], ['Portekiz', 75], ['İsviçre', 75], ['İrlanda', 73], ['Polonya', 73], ['İskoçya', 72], ['Çekya', 71], ['Finlandiya', 71], ['Galler', 70], ['Sırbistan', 70], ['Ukrayna', 68], ['Macaristan', 66], ['Türkiye', 65]];
export const KWORLD = [['ABD', 90], ['Japonya', 85], ['Brezilya', 84], ['Kanada', 83], ['Kuzey Kore', 82], ['Avustralya', 80], ['Kolombiya', 78], ['Çin', 76], ['Meksika', 76], ['Nijerya', 76], ['Güney Kore', 75], ['Güney Afrika', 71], ['Yeni Zelanda', 70], ['Fas', 70], ['Arjantin', 70]];

// Ülke kupaları. Türkiye'de kadınlarda ulusal kupa düzenlenmiyor (2026-2027 statüsünde yok).
export const KCUPS = { EN: 'İngiltere Kadın Kupası', ES: 'İspanya Kadın Kupası', DE: 'Almanya Kadın Kupası', IT: 'İtalya Kadın Kupası', FR: 'Fransa Kadın Kupası', NL: 'Hollanda Kadın Kupası', PT: 'Portekiz Kadın Kupası' };

export const KDERBY = [['Galata', 'Kadıköy', 'Beşiktaş', 'Trabzon'], ['Hakkari', 'Yüksekova'], ['Sakarya', 'Kocaeli'], ['Ankara F', 'Haymana'], ['Gaziantep', 'Gaziantep G'],
  ['Madrid', 'Barcelona', 'Madrid A'], ['Manchester U', 'Manchester C', 'Liverpool', 'Everton'], ['Londra A', 'Tottenham', 'Chelsea'], ['Milano I', 'Milano', 'Torino J'], ['Roma', 'Lazio'], ['Como', 'Como K'], ['Münih', 'Wolfsburg'],
  ['Paris', 'Paris F', 'Lyon'], ['Amsterdam', 'Rotterdam', 'Eindhoven', 'Twente'], ['Lizbon', 'Porto', 'Lizbon S']];
