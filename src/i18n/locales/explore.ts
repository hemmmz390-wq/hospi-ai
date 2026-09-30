import { e } from "./entry";

/** Teks fitur rekomendasi wisata (tamu) dan transport wisata (staf). */
export const explore = {
  // ---------- Halaman ----------
  "ex.title": e("Wisata sekitar", "Explore nearby", "周辺の観光", "주변 관광", "周边景点", "Что посмотреть рядом", "À découvrir autour", "Ausflüge in der Nähe"),
  "ex.subtitle": e(
    "Tempat pilihan concierge kami di dekat hotel. Kami bisa siapkan mobil dan sopir.",
    "Places our concierge recommends near the hotel. We can arrange a car and driver.",
    "ホテル周辺のコンシェルジュおすすめスポットです。車とドライバーの手配も可能です。",
    "컨시어지가 추천하는 호텔 근처 명소입니다. 차량과 기사도 준비해 드립니다.",
    "礼宾部推荐的酒店附近好去处。我们可以为您安排车辆和司机。",
    "Места рядом с отелем, которые советует наш консьерж. Мы можем организовать машину с водителем.",
    "Les adresses conseillées par notre concierge près de l'hôtel. Nous pouvons organiser une voiture avec chauffeur.",
    "Orte in Hotelnähe, die unser Concierge empfiehlt. Wir organisieren gern ein Auto mit Fahrer."
  ),
  "ex.now.morning": e("Cocok untuk pagi ini", "Best this morning", "今朝のおすすめ", "오늘 아침 추천", "今天上午推荐", "Лучше всего этим утром", "Idéal ce matin", "Ideal für heute Vormittag"),
  "ex.now.afternoon": e("Cocok untuk siang ini", "Best this afternoon", "今日の午後のおすすめ", "오늘 오후 추천", "今天下午推荐", "Лучше всего сегодня днём", "Idéal cet après-midi", "Ideal für heute Nachmittag"),
  "ex.now.evening": e("Cocok untuk sore & malam ini", "Best this evening", "今夕のおすすめ", "오늘 저녁 추천", "今晚推荐", "Лучше всего этим вечером", "Idéal ce soir", "Ideal für heute Abend"),
  "ex.now.night": e("Cocok untuk besok pagi", "Best tomorrow morning", "明朝のおすすめ", "내일 아침 추천", "明天上午推荐", "Лучше всего завтра утром", "Idéal demain matin", "Ideal für morgen früh"),
  "ex.nowBadge": e("Cocok sekarang", "Good right now", "今がおすすめ", "지금 추천", "现在适合", "Сейчас в самый раз", "Idéal maintenant", "Jetzt ideal"),
  "ex.filter": e("Jenis tempat", "Type of place", "スポットの種類", "장소 유형", "地点类型", "Тип места", "Type de lieu", "Art des Ortes"),
  "ex.cat.all": e("Semua", "All", "すべて", "전체", "全部", "Все", "Tout", "Alle"),
  "ex.cat.culture": e("Budaya", "Culture", "文化", "문화", "文化", "Культура", "Culture", "Kultur"),
  "ex.cat.nature": e("Alam", "Nature", "自然", "자연", "自然", "Природа", "Nature", "Natur"),
  "ex.cat.beach": e("Pantai", "Beach", "ビーチ", "해변", "海滩", "Пляж", "Plage", "Strand"),
  "ex.cat.food": e("Kuliner", "Food", "グルメ", "맛집", "美食", "Еда", "Cuisine", "Essen"),
  "ex.cat.shopping": e("Belanja", "Shopping", "ショッピング", "쇼핑", "购物", "Покупки", "Shopping", "Shopping"),
  "ex.easyOnly": e("Hanya yang jalannya ringan", "Easy walking only", "歩きやすい場所のみ", "걷기 쉬운 곳만", "只看步行轻松的", "Только лёгкая ходьба", "Marche facile uniquement", "Nur leichte Wege"),
  "ex.drive": e("{n} menit naik mobil", "{n} min by car", "車で{n}分", "차로 {n}분", "车程{n}分钟", "{n} мин на машине", "{n} min en voiture", "{n} Min. mit dem Auto"),
  "ex.free": e("Masuk gratis", "Free entry", "入場無料", "무료 입장", "免费入场", "Вход свободный", "Entrée gratuite", "Eintritt frei"),
  "ex.fee": e("Tiket ± {fee}", "Ticket ± {fee}", "入場料 約{fee}", "입장료 약 {fee}", "门票约{fee}", "Билет ≈ {fee}", "Entrée ≈ {fee}", "Eintritt ca. {fee}"),
  "ex.effort.easy": e("Jalan kaki ringan", "Easy walking", "歩きやすい", "걷기 쉬움", "步行轻松", "Лёгкая ходьба", "Marche facile", "Leichter Weg"),
  "ex.effort.moderate": e("Ada tangga / jalan agak jauh", "Some stairs or longer walk", "階段・やや長い徒歩あり", "계단 또는 다소 긴 도보", "有台阶或需步行较远", "Есть ступени или долгая прогулка", "Quelques marches ou marche plus longue", "Treppen oder längerer Fußweg"),
  "ex.effort.hard": e("Medan berat, banyak tangga", "Steep path, many steps", "急な道・階段が多い", "가파른 길, 계단 많음", "路陡、台阶多", "Крутая тропа, много ступеней", "Chemin raide, beaucoup de marches", "Steiler Weg, viele Stufen"),
  "ex.family": e("Cocok untuk keluarga & lansia", "Good for families & seniors", "家族・ご年配の方にも", "가족·어르신께 적합", "适合家庭和长者", "Подходит для семей и пожилых", "Adapté aux familles et aux seniors", "Gut für Familien und Senioren"),
  "ex.bookCar": e("Pesan mobil ke sini", "Book a car here", "ここへの車を手配", "이곳으로 차량 예약", "预约车辆前往", "Заказать машину сюда", "Réserver une voiture", "Auto hierher buchen"),
  "ex.map": e("Peta", "Map", "地図", "지도", "地图", "Карта", "Carte", "Karte"),
  "ex.mapAria": e("Buka {place} di Google Maps", "Open {place} in Google Maps", "{place}をGoogleマップで開く", "Google 지도에서 {place} 열기", "在谷歌地图中打开{place}", "Открыть {place} в Google Картах", "Ouvrir {place} dans Google Maps", "{place} in Google Maps öffnen"),
  "ex.tour": e("Atau ikut tur hotel: {title} · {price}", "Or join the hotel tour: {title} · {price}", "ホテルのツアーもあります：{title}・{price}", "호텔 투어도 있어요: {title} · {price}", "也可参加酒店旅游团：{title} · {price}", "Или экскурсия от отеля: {title} · {price}", "Ou la visite de l'hôtel : {title} · {price}", "Oder die Hoteltour: {title} · {price}"),
  "ex.none": e("Belum ada tempat untuk pilihan ini.", "No places match this choice.", "この条件に合うスポットはありません。", "조건에 맞는 장소가 없습니다.", "没有符合条件的地点。", "Нет мест для этого выбора.", "Aucun lieu ne correspond.", "Keine passenden Orte."),
  "ex.pricesNote": e(
    "Harga tiket adalah perkiraan dan bisa berubah. Concierge kami siap membantu info terbaru.",
    "Ticket prices are estimates and may change. Our concierge can confirm the latest details.",
    "入場料は目安で、変更される場合があります。最新情報はコンシェルジュにお尋ねください。",
    "입장료는 예상 금액이며 변동될 수 있습니다. 최신 정보는 컨시어지에 문의하세요.",
    "门票价格仅供参考，可能有变动。最新信息请咨询礼宾部。",
    "Цены на билеты примерные и могут меняться. Консьерж подскажет актуальную информацию.",
    "Les prix sont indicatifs et peuvent changer. Notre concierge peut confirmer les dernières informations.",
    "Die Preise sind Richtwerte und können sich ändern. Unser Concierge bestätigt gern den aktuellen Stand."
  ),

  // ---------- Deskripsi tempat ----------
  "ex.place.ubud-palace": e(
    "Istana kerajaan Ubud di pusat kota, dengan pasar seni di seberangnya. Malam hari ada pertunjukan tari Legong.",
    "Ubud's royal palace in the town centre, with the art market across the road. Legong dance shows in the evening.",
    "ウブド中心部の王宮で、向かいには美術市場があります。夜はレゴンダンスの公演があります。",
    "우붓 중심의 왕궁으로, 길 건너에 예술 시장이 있습니다. 저녁에는 레공 춤 공연이 열립니다.",
    "位于乌布市中心的王宫，对面就是艺术市场。晚上有黎弓舞表演。",
    "Королевский дворец в центре Убуда, напротив — рынок искусств. Вечером — танец легонг.",
    "Le palais royal au cœur d'Ubud, avec le marché d'art en face. Spectacles de danse legong le soir.",
    "Der Königspalast im Zentrum von Ubud, gegenüber der Kunstmarkt. Abends Legong-Tanzaufführungen."
  ),
  "ex.place.monkey-forest": e(
    "Hutan teduh dengan ratusan monyet dan pura kuno. Simpan kacamata dan makanan di tas.",
    "A shady forest with hundreds of monkeys and old temples. Keep glasses and snacks in your bag.",
    "数百匹の猿と古い寺院がある木陰の森。眼鏡や食べ物はかばんにしまっておきましょう。",
    "수백 마리의 원숭이와 오래된 사원이 있는 숲입니다. 안경과 간식은 가방에 넣어 두세요.",
    "林荫中有数百只猴子和古老寺庙。请把眼镜和零食收进包里。",
    "Тенистый лес с сотнями обезьян и древними храмами. Очки и еду лучше убрать в сумку.",
    "Une forêt ombragée avec des centaines de singes et de vieux temples. Rangez lunettes et en-cas dans votre sac.",
    "Schattiger Wald mit Hunderten Affen und alten Tempeln. Brille und Snacks in der Tasche lassen."
  ),
  "ex.place.campuhan": e(
    "Jalan setapak di punggung bukit hijau. Paling sejuk saat pagi, paling indah saat matahari terbenam.",
    "A path along a green ridge. Coolest in the early morning, prettiest at sunset.",
    "緑の尾根沿いの散歩道。早朝は涼しく、夕暮れ時が最も美しい景色です。",
    "초록 능선을 따라 걷는 산책로입니다. 이른 아침엔 시원하고 해 질 녘이 가장 아름답습니다.",
    "沿着绿色山脊的步道。清晨最凉爽，日落时分最美。",
    "Тропа по зелёному хребту. Прохладнее всего рано утром, красивее всего на закате.",
    "Un sentier sur une crête verdoyante. Plus frais tôt le matin, plus beau au coucher du soleil.",
    "Ein Weg über einen grünen Hügelkamm. Frühmorgens am kühlsten, bei Sonnenuntergang am schönsten."
  ),
  "ex.place.goa-gajah": e(
    "Gua pertapaan abad ke-11 dengan pahatan batu dan kolam pemandian kuno. Pinjam sarung di pintu masuk.",
    "An 11th-century meditation cave with stone carvings and ancient bathing pools. Sarongs are lent at the gate.",
    "11世紀の瞑想洞窟で、石の彫刻と古代の沐浴場があります。サロンは入口で借りられます。",
    "11세기 명상 동굴로 석조 조각과 고대 목욕탕이 있습니다. 사롱은 입구에서 빌려줍니다.",
    "11世纪的冥想洞窟，有石雕和古老浴池。入口处可借纱笼。",
    "Пещера для медитаций XI века с каменной резьбой и древними купальнями. Саронг выдают на входе.",
    "Une grotte de méditation du XIe siècle, avec sculptures et bassins anciens. Sarongs prêtés à l'entrée.",
    "Meditationshöhle aus dem 11. Jahrhundert mit Steinreliefs und alten Badebecken. Sarongs gibt es am Eingang."
  ),
  "ex.place.bebek-sawah": e(
    "Bebek goreng renyah khas Bali dengan pemandangan sawah. Sekitar Rp 150.000 per orang.",
    "Balinese crispy duck with a view over the rice fields. Around Rp 150,000 per person.",
    "田んぼを眺めながら味わうバリ風クリスピーダック。1人あたり約15万ルピア。",
    "논 풍경을 보며 즐기는 발리식 바삭한 오리 요리. 1인 약 150,000루피아.",
    "边看稻田边品尝巴厘脆皮鸭，人均约15万印尼盾。",
    "Хрустящая утка по-балийски с видом на рисовые поля. Около 150 000 рупий на человека.",
    "Canard croustillant balinais face aux rizières. Environ 150 000 Rp par personne.",
    "Knusprige Ente nach balinesischer Art mit Blick auf die Reisfelder. Etwa 150.000 Rp pro Person."
  ),
  "ex.place.tegallalang": e(
    "Terasering sawah yang paling terkenal di Bali. Datang sebelum jam 9 supaya sejuk dan belum ramai.",
    "Bali's most famous rice terraces. Arrive before 9 a.m. while it's cool and quiet.",
    "バリで最も有名なライステラス。涼しく空いている朝9時前がおすすめです。",
    "발리에서 가장 유명한 계단식 논입니다. 시원하고 한적한 오전 9시 전에 방문하세요.",
    "巴厘岛最著名的梯田。建议上午9点前到，凉爽且人少。",
    "Самые известные рисовые террасы Бали. Приезжайте до 9 утра, пока прохладно и мало людей.",
    "Les rizières en terrasses les plus célèbres de Bali. Arrivez avant 9 h, au frais et au calme.",
    "Balis berühmteste Reisterrassen. Vor 9 Uhr kommen, solange es kühl und ruhig ist."
  ),
  "ex.place.tirta-empul": e(
    "Pura mata air suci tempat warga melakukan ritual penyucian. Sarung disediakan, jalannya datar.",
    "A holy spring temple where locals come for purification rituals. Sarongs provided, flat paths.",
    "地元の人々が清めの儀式を行う聖なる泉の寺院。サロン貸出あり、道は平坦です。",
    "현지인들이 정화 의식을 하는 성스러운 샘물 사원입니다. 사롱 제공, 길이 평탄합니다.",
    "当地人进行净化仪式的圣泉寺庙。提供纱笼，道路平坦。",
    "Храм священного источника, где местные проходят обряд очищения. Саронги выдают, дорожки ровные.",
    "Temple de la source sacrée où les habitants viennent se purifier. Sarongs fournis, chemins plats.",
    "Tempel der heiligen Quelle für Reinigungsrituale. Sarongs werden gestellt, ebene Wege."
  ),
  "ex.place.sukawati": e(
    "Pasar seni besar untuk oleh-oleh: kain, ukiran, dan tas anyaman. Harga bisa ditawar.",
    "A big art market for souvenirs: fabrics, carvings and woven bags. Bargaining is expected.",
    "布、木彫り、編みバッグなどのお土産が揃う大きな市場。値段交渉ができます。",
    "천, 조각품, 라탄 가방 등 기념품을 파는 큰 예술 시장. 흥정이 가능합니다.",
    "大型艺术市场，适合买纪念品：布料、木雕和编织包。可以讲价。",
    "Большой рынок сувениров: ткани, резьба, плетёные сумки. Принято торговаться.",
    "Un grand marché d'art pour les souvenirs : tissus, sculptures, sacs tressés. On y marchande.",
    "Großer Kunstmarkt für Souvenirs: Stoffe, Schnitzereien, geflochtene Taschen. Handeln ist üblich."
  ),
  "ex.place.tukad-cepung": e(
    "Air terjun di dalam gua dengan cahaya matahari yang menembus celah batu. Jalurnya licin, pakai sandal gunung.",
    "A waterfall inside a cave with sunbeams through the rocks. The path is slippery; wear sturdy sandals.",
    "岩の隙間から光が差し込む洞窟の中の滝。道が滑りやすいので丈夫なサンダルで。",
    "바위 틈으로 햇살이 비치는 동굴 속 폭포입니다. 길이 미끄러우니 튼튼한 샌들을 신으세요.",
    "洞穴中的瀑布，阳光从岩缝洒下。路面湿滑，请穿防滑凉鞋。",
    "Водопад в пещере, солнечные лучи сквозь скалы. Тропа скользкая — нужна крепкая обувь.",
    "Une cascade dans une grotte, traversée de rayons de soleil. Chemin glissant : prévoyez de bonnes sandales.",
    "Wasserfall in einer Höhle mit Sonnenstrahlen durch die Felsen. Rutschiger Weg, feste Sandalen tragen."
  ),
  "ex.place.sanur": e(
    "Pantai tenang dengan ombak kecil dan jalur sepeda di tepi laut. Cocok untuk anak-anak.",
    "A calm beach with small waves and a seaside cycling path. Great for children.",
    "波が穏やかで海沿いにサイクリングロードがあるビーチ。お子様連れに最適です。",
    "파도가 잔잔하고 해변 자전거길이 있는 해변. 아이들과 함께하기 좋습니다.",
    "海浪平缓的海滩，海边有自行车道，很适合孩子。",
    "Спокойный пляж с небольшими волнами и велодорожкой вдоль моря. Отлично для детей.",
    "Une plage calme aux petites vagues, avec une piste cyclable en bord de mer. Idéale pour les enfants.",
    "Ruhiger Strand mit kleinen Wellen und Radweg am Meer. Ideal für Kinder."
  ),
  "ex.place.kintamani": e(
    "Pemandangan Gunung Batur dan danaunya dari restoran di tepi kawah. Udaranya sejuk, bawa jaket tipis.",
    "Views of Mount Batur and its lake from restaurants on the crater rim. It's cool up there; bring a light jacket.",
    "火口縁のレストランからバトゥール山と湖を一望。涼しいので薄手の上着を。",
    "분화구 가장자리 식당에서 바투르 산과 호수를 볼 수 있습니다. 서늘하니 얇은 겉옷을 챙기세요.",
    "在火山口边的餐厅欣赏巴图尔火山和湖景。山上较凉，请带薄外套。",
    "Вид на вулкан Батур и озеро из ресторанов на краю кратера. Прохладно — возьмите лёгкую куртку.",
    "Vue sur le mont Batur et son lac depuis les restaurants du bord du cratère. Il fait frais : prenez une veste légère.",
    "Blick auf den Mount Batur und seinen See von Restaurants am Kraterrand. Oben ist es kühl, leichte Jacke mitnehmen."
  ),
  "ex.place.tanah-lot": e(
    "Pura di atas batu karang di tengah laut. Berangkat jam 3 sore supaya sampai sebelum matahari terbenam.",
    "A temple on a rock in the sea. Leave around 3 p.m. to arrive before sunset.",
    "海に浮かぶ岩の上の寺院。夕日に間に合うよう午後3時頃に出発しましょう。",
    "바다 위 바위에 세워진 사원입니다. 해 지기 전에 도착하려면 오후 3시쯤 출발하세요.",
    "建在海中岩石上的寺庙。下午3点左右出发，可赶上日落。",
    "Храм на скале посреди моря. Выезжайте около 15:00, чтобы успеть к закату.",
    "Un temple sur un rocher en mer. Partez vers 15 h pour arriver avant le coucher du soleil.",
    "Ein Tempel auf einem Felsen im Meer. Gegen 15 Uhr losfahren, um vor Sonnenuntergang da zu sein."
  ),

  // ---------- Lembar pesan mobil ----------
  "ex.sheet.title": e("Mobil ke {place}", "Car to {place}", "{place}への車", "{place}행 차량", "前往{place}的车辆", "Машина до {place}", "Voiture pour {place}", "Auto nach {place}"),
  "ex.sheet.sub": e(
    "Mobil ber-AC dengan sopir hotel, dijemput di lobi. Front Office akan mengabari harga sebelum berangkat.",
    "An air-conditioned car with a hotel driver, pick-up at the lobby. The Front Office will confirm the price before you leave.",
    "ホテルのドライバー付きエアコン車で、ロビーからお迎えします。料金は出発前にフロントからご連絡します。",
    "호텔 기사가 운전하는 에어컨 차량으로 로비에서 픽업합니다. 출발 전 프런트에서 요금을 안내해 드립니다.",
    "由酒店司机驾驶的空调车，在大堂接您。出发前前台会告知费用。",
    "Машина с кондиционером и водителем отеля, посадка в лобби. Стоимость ресепшен сообщит до выезда.",
    "Voiture climatisée avec chauffeur de l'hôtel, départ du hall. La réception vous confirmera le prix avant le départ.",
    "Klimatisiertes Auto mit Hotelfahrer, Abholung in der Lobby. Die Rezeption bestätigt den Preis vor der Abfahrt."
  ),
  "ex.sheet.when": e("Kapan dijemput?", "When should we pick you up?", "お迎えの時間は？", "언제 픽업할까요?", "什么时候接您？", "Когда вас забрать?", "À quelle heure ?", "Wann sollen wir Sie abholen?"),
  "ex.sheet.asap": e("Secepatnya", "As soon as possible", "できるだけ早く", "가능한 빨리", "尽快", "Как можно скорее", "Dès que possible", "So bald wie möglich"),
  "ex.sheet.today": e("Hari ini {time}", "Today {time}", "今日 {time}", "오늘 {time}", "今天 {time}", "Сегодня в {time}", "Aujourd'hui {time}", "Heute {time}"),
  "ex.sheet.tomorrow": e("Besok {time}", "Tomorrow {time}", "明日 {time}", "내일 {time}", "明天 {time}", "Завтра в {time}", "Demain {time}", "Morgen {time}"),
  "ex.sheet.people": e("Berapa orang?", "How many people?", "人数は？", "몇 분이세요?", "几位？", "Сколько человек?", "Combien de personnes ?", "Wie viele Personen?"),
  "ex.sheet.fewer": e("Kurangi", "Fewer", "減らす", "줄이기", "减少", "Меньше", "Moins", "Weniger"),
  "ex.sheet.more": e("Tambah", "More", "増やす", "늘리기", "增加", "Больше", "Plus", "Mehr"),
  "ex.sheet.assist": e(
    "Perlu bantuan khusus (lansia, kursi roda, atau anak kecil)",
    "Need extra help (seniors, wheelchair or small children)",
    "特別なサポートが必要（ご年配の方・車椅子・小さなお子様）",
    "추가 도움 필요 (어르신, 휠체어, 어린이)",
    "需要特别协助（长者、轮椅或小孩）",
    "Нужна помощь (пожилые, коляска или маленькие дети)",
    "Besoin d'aide (seniors, fauteuil roulant ou jeunes enfants)",
    "Brauche Unterstützung (Senioren, Rollstuhl oder kleine Kinder)"
  ),
  "ex.sheet.note": e("Catatan (tidak wajib)", "Note (optional)", "メモ（任意）", "메모 (선택)", "备注（可选）", "Комментарий (необязательно)", "Note (facultatif)", "Notiz (optional)"),
  "ex.sheet.notePh": e("Misalnya: mau mampir beli oleh-oleh", "For example: we'd like to stop for souvenirs", "例：お土産を買いに寄りたい", "예: 기념품 가게에 들르고 싶어요", "例如：想顺路买纪念品", "Например: хотим заехать за сувенирами", "Par exemple : un arrêt pour des souvenirs", "Zum Beispiel: kurz Souvenirs kaufen"),
  "ex.sheet.send": e("Kirim permintaan", "Send request", "依頼を送信", "요청 보내기", "发送请求", "Отправить запрос", "Envoyer la demande", "Anfrage senden"),
  "ex.sheet.sent": e("Permintaan mobil terkirim", "Car request sent", "車の依頼を送信しました", "차량 요청을 보냈습니다", "用车请求已发送", "Запрос на машину отправлен", "Demande de voiture envoyée", "Autoanfrage gesendet"),
  "ex.sheet.sentBody": e(
    "Nomor {id}. Front Office akan menghubungi Anda untuk konfirmasi harga dan jam jemput.",
    "Number {id}. The Front Office will contact you to confirm the price and pick-up time.",
    "番号 {id}。料金とお迎え時間の確認のため、フロントからご連絡します。",
    "번호 {id}. 프런트에서 요금과 픽업 시간을 확인하기 위해 연락드립니다.",
    "编号 {id}。前台会联系您确认费用和接送时间。",
    "Номер {id}. Ресепшен свяжется с вами, чтобы подтвердить цену и время.",
    "Numéro {id}. La réception vous contactera pour confirmer le prix et l'heure.",
    "Nummer {id}. Die Rezeption meldet sich, um Preis und Abholzeit zu bestätigen."
  ),
  "ex.tourSheet.body": e(
    "Biaya {price} masuk ke tagihan kamar. Front Office akan menghubungi Anda untuk jadwalnya.",
    "{price} will be added to your room bill. The Front Office will contact you about the schedule.",
    "{price}がお部屋付けになります。スケジュールはフロントからご連絡します。",
    "{price}이(가) 객실 요금에 추가됩니다. 일정은 프런트에서 연락드립니다.",
    "{price}将计入房账。前台会联系您安排时间。",
    "{price} будет добавлено к счёту номера. Ресепшен свяжется с вами по расписанию.",
    "{price} sera ajouté à votre note de chambre. La réception vous contactera pour l'horaire.",
    "{price} wird auf Ihre Zimmerrechnung gebucht. Die Rezeption meldet sich wegen des Termins."
  ),
  "ex.tourSheet.confirm": e("Pesan tur", "Book the tour", "ツアーを予約", "투어 예약", "预订旅游团", "Забронировать экскурсию", "Réserver la visite", "Tour buchen"),

  // ---------- Titik masuk lain ----------
  "ex.home.title": e("Jalan-jalan hari ini", "Going out today?", "今日のおでかけ", "오늘 나들이", "今天出去逛逛", "Прогулка сегодня", "Sortir aujourd'hui", "Heute unterwegs?"),
  "ex.home.hint": e("Rekomendasi tempat wisata dekat hotel", "Places to visit near the hotel", "ホテル周辺のおすすめスポット", "호텔 근처 추천 명소", "酒店附近推荐景点", "Что посмотреть рядом с отелем", "Lieux à visiter près de l'hôtel", "Sehenswertes in Hotelnähe"),
  "ex.home.all": e("Lihat semua tempat", "See all places", "すべて見る", "모든 장소 보기", "查看全部地点", "Все места", "Voir tous les lieux", "Alle Orte ansehen"),
  "g.chat.openExplore": e("Lihat tempat wisata", "See places to visit", "観光スポットを見る", "관광 명소 보기", "查看景点", "Посмотреть места", "Voir les lieux à visiter", "Ausflugsziele ansehen"),
  "g.exTitle": e("Mobil ke {place}", "Car to {place}", "{place}への車", "{place}행 차량", "前往{place}的车辆", "Машина до {place}", "Voiture pour {place}", "Auto nach {place}"),

  // ---------- Mode presentasi ----------
  "pm.sc.explore": e("Rekomendasi wisata", "Places to visit", "観光のおすすめ", "관광 추천", "景点推荐", "Что посмотреть", "Lieux à visiter", "Ausflugstipps"),
  "pm.sc.exploreText": e(
    "Ada rekomendasi tempat wisata dekat sini?",
    "Any places to visit near here?",
    "近くにおすすめの観光スポットはありますか？",
    "근처에 가볼 만한 관광 명소 있나요?",
    "附近有什么推荐的景点吗？",
    "Что посмотреть рядом с отелем?",
    "Que visiter près d'ici ?",
    "Welche Ausflüge empfehlen Sie hier in der Nähe?"
  ),

  // ---------- Staf ----------
  "cat.excursion": e("Transport wisata", "Excursion transport", "観光送迎", "관광 차량", "观光用车", "Трансфер на экскурсию", "Transport excursion", "Ausflugstransfer"),
  "tk.ex.title": e("Mobil & sopir untuk tamu", "Car & driver for the guest", "ゲスト用の車とドライバー", "고객용 차량 및 기사", "为客人安排车辆和司机", "Машина с водителем для гостя", "Voiture avec chauffeur", "Auto mit Fahrer für den Gast"),
  "tk.ex.dest": e("Tujuan", "Destination", "行き先", "목적지", "目的地", "Куда", "Destination", "Ziel"),
  "tk.ex.pickup": e("Jemput di lobi", "Lobby pick-up", "ロビーお迎え", "로비 픽업", "大堂接客", "Посадка в лобби", "Départ du hall", "Abholung Lobby"),
  "tk.ex.asap": e("Secepatnya (±{time})", "As soon as possible (≈{time})", "できるだけ早く（{time}頃）", "가능한 빨리 (약 {time})", "尽快（约{time}）", "Как можно скорее (≈{time})", "Dès que possible (≈{time})", "So bald wie möglich (ca. {time})"),
  "tk.ex.people": e("Jumlah tamu", "Guests", "人数", "인원", "人数", "Гостей", "Personnes", "Personen"),
  "tk.ex.assist": e(
    "Tamu butuh bantuan khusus: lansia, kursi roda, atau anak kecil.",
    "Guest needs extra help: seniors, wheelchair or small children.",
    "特別なサポートが必要：ご年配の方・車椅子・小さなお子様。",
    "추가 도움 필요: 어르신, 휠체어 또는 어린이.",
    "客人需要特别协助：长者、轮椅或小孩。",
    "Гостю нужна помощь: пожилые, коляска или маленькие дети.",
    "Le client a besoin d'aide : seniors, fauteuil roulant ou jeunes enfants.",
    "Gast braucht Unterstützung: Senioren, Rollstuhl oder kleine Kinder."
  ),
  "tk.ex.confirmPrice": e(
    "Hubungi tamu untuk konfirmasi harga sebelum mobil berangkat.",
    "Call the guest to confirm the price before the car leaves.",
    "出発前にゲストへ料金を確認してください。",
    "출발 전 고객에게 요금을 확인하세요.",
    "出发前请与客人确认费用。",
    "Подтвердите цену с гостем до выезда.",
    "Confirmez le prix avec le client avant le départ.",
    "Preis vor der Abfahrt mit dem Gast bestätigen."
  ),
};
