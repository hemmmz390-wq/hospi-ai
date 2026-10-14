import { e } from "./entry";

/**
 * Teks laporan untuk staf: judul tiket dan instruksi operasional dalam bahasa
 * staf (diatur Front Office). Judul tiket disimpan dalam bahasa Inggris di
 * data; src/lib/ticketText.ts memetakannya ke key di sini.
 */
export const ops = {
  // ---------- Judul tiket ----------
  "tt.roomCleaning": e("Pembersihan kamar", "Room cleaning", "客室清掃", "객실 청소", "打扫房间", "Уборка номера", "Ménage de la chambre", "Zimmerreinigung"),
  "tt.bathTowels": e("Tambahan handuk mandi", "Extra bath towels", "バスタオルの追加", "목욕 수건 추가", "加浴巾", "Дополнительные банные полотенца", "Serviettes de bain supplémentaires", "Zusätzliche Badetücher"),
  "tt.noHotWater": e("Air panas tidak keluar", "No hot water", "お湯が出ない", "온수가 나오지 않음", "没有热水", "Нет горячей воды", "Pas d'eau chaude", "Kein Warmwasser"),
  "tt.extraPillows": e("Tambahan bantal", "Extra pillows", "枕の追加", "베개 추가", "加枕头", "Дополнительные подушки", "Oreillers supplémentaires", "Zusätzliche Kissen"),
  "tt.acNotCooling": e("AC tidak dingin", "AC not cooling", "エアコンが冷えない", "에어컨이 시원하지 않음", "空调不制冷", "Кондиционер не охлаждает", "La climatisation ne refroidit pas", "Klimaanlage kühlt nicht"),
  "tt.acNoise": e("AC berisik", "AC making noise", "エアコンの異音", "에어컨 소음", "空调有噪音", "Кондиционер шумит", "La climatisation fait du bruit", "Klimaanlage macht Geräusche"),
  "tt.acLeaking": e("AC bocor", "AC leaking", "エアコンの水漏れ", "에어컨 누수", "空调漏水", "Кондиционер протекает", "La climatisation fuit", "Klimaanlage tropft"),
  "tt.acIssue": e("Masalah AC", "AC issue", "エアコンの不具合", "에어컨 문제", "空调故障", "Проблема с кондиционером", "Problème de climatisation", "Problem mit der Klimaanlage"),
  "tt.waterTissues": e("Air mineral & tisu", "Water & tissues", "水とティッシュ", "생수와 휴지", "矿泉水和纸巾", "Вода и салфетки", "Eau et mouchoirs", "Wasser & Taschentücher"),
  "tt.tvRemote": e("Remote TV tidak berfungsi", "TV remote not responding", "テレビのリモコンが反応しない", "TV 리모컨 작동 안 함", "电视遥控器失灵", "Пульт от телевизора не работает", "La télécommande ne répond pas", "TV-Fernbedienung reagiert nicht"),
  "tt.tvBroken": e("TV tidak berfungsi", "TV not working", "テレビが映らない", "TV 작동 안 함", "电视无法使用", "Телевизор не работает", "La télévision ne fonctionne pas", "Fernseher funktioniert nicht"),
  "tt.wifiBroken": e("Wi-Fi bermasalah", "Wi-Fi not working", "Wi-Fiにつながらない", "와이파이 안 됨", "Wi-Fi 无法使用", "Wi-Fi не работает", "Le Wi-Fi ne fonctionne pas", "WLAN funktioniert nicht"),
  "tt.specialRequest": e("Permintaan khusus", "Special request", "特別なご依頼", "특별 요청", "特殊请求", "Особая просьба", "Demande spéciale", "Sonderwunsch"),
  "tt.soapShampoo": e("Sabun & sampo", "Soap & shampoo", "石鹸とシャンプー", "비누와 샴푸", "香皂和洗发水", "Мыло и шампунь", "Savon et shampooing", "Seife & Shampoo"),
  "tt.slippers": e("Sandal kamar", "Room slippers", "ルームスリッパ", "실내 슬리퍼", "拖鞋", "Тапочки", "Chaussons", "Hausschuhe"),
  "tt.poolTowels": e("Handuk kolam renang", "Pool towels", "プールタオル", "수영장 수건", "泳池毛巾", "Полотенца для бассейна", "Serviettes de piscine", "Pooltücher"),
  "tt.luggagePickup": e("Ambil barang bawaan", "Luggage pick-up", "荷物の引き取り", "짐 수거", "取行李", "Забрать багаж", "Récupération des bagages", "Gepäckabholung"),
  "tt.luggageHelp": e("Bantuan bawa barang", "Help with luggage", "荷物の運搬", "짐 운반 도움", "协助搬运行李", "Помощь с багажом", "Aide pour les bagages", "Hilfe mit dem Gepäck"),
  "tt.escort": e("Antar tamu", "Escort", "ご案内", "안내", "陪同引导", "Сопровождение", "Accompagnement", "Begleitung"),
  "tt.bellService": e("Layanan bellboy", "Bell service", "ベルサービス", "벨 서비스", "行李员服务", "Услуги портье", "Service bagagiste", "Pagenservice"),
  "tt.lateRequest": e("Permintaan late check-out", "Late checkout request", "レイトチェックアウトのご依頼", "레이트 체크아웃 요청", "延迟退房申请", "Запрос позднего выезда", "Demande de départ tardif", "Anfrage später Check-out"),
  "tt.keyCard": e("Kartu kunci tidak berfungsi", "Key card not working", "カードキーが使えない", "카드키 작동 안 함", "房卡失效", "Ключ-карта не работает", "La carte-clé ne fonctionne pas", "Schlüsselkarte funktioniert nicht"),
  "tt.doorLock": e("Kunci pintu / kartu kamar", "Door lock / key card", "ドアロック・カードキー", "도어락 / 카드키", "门锁 / 房卡", "Замок / ключ-карта", "Serrure / carte-clé", "Türschloss / Schlüsselkarte"),
  "tt.blanket": e("Tambahan selimut", "Extra blanket", "毛布の追加", "담요 추가", "加毯子", "Дополнительное одеяло", "Couverture supplémentaire", "Zusätzliche Decke"),
  "tt.complaintNotCleaned": e("Komplain: kamar belum dibersihkan", "Complaint: room not cleaned", "苦情：部屋が清掃されていない", "불만: 객실 미청소", "投诉：房间未打扫", "Жалоба: номер не убран", "Plainte : chambre non nettoyée", "Beschwerde: Zimmer nicht gereinigt"),
  "tt.blockedSink": e("Wastafel mampet", "Blocked sink", "洗面台の詰まり", "세면대 막힘", "洗手池堵塞", "Засор раковины", "Lavabo bouché", "Verstopftes Waschbecken"),
  "tt.lamp": e("Lampu samping tempat tidur mati", "Bedside lamp not working", "ベッドランプが点かない", "침대 옆 램프 고장", "床头灯不亮", "Не работает прикроватная лампа", "La lampe de chevet ne fonctionne pas", "Nachttischlampe funktioniert nicht"),
  "tt.guestComplaint": e("Komplain tamu", "Guest complaint", "ゲストからの苦情", "고객 불만", "客人投诉", "Жалоба гостя", "Plainte d'un client", "Gästebeschwerde"),
  "tt.foodOrder": e("Pesanan makanan", "Food order", "料理の注文", "음식 주문", "点餐", "Заказ еды", "Commande de repas", "Essensbestellung"),
  "tt.electrical": e("Gangguan listrik", "Electrical issue", "電気の不具合", "전기 문제", "电路故障", "Проблема с электричеством", "Problème électrique", "Elektrisches Problem"),
  "tt.plumbing": e("Gangguan saluran air", "Plumbing issue", "水回りの不具合", "배관 문제", "水管故障", "Проблема с сантехникой", "Problème de plomberie", "Sanitärproblem"),
  "tt.emergency": e("Laporan darurat", "Emergency reported", "緊急事態の報告", "긴급 상황 신고", "紧急情况报告", "Сообщение о ЧП", "Urgence signalée", "Notfall gemeldet"),
  "tt.fire": e("Api atau asap", "Fire or smoke", "火災・煙", "화재 또는 연기", "火灾或烟雾", "Пожар или дым", "Feu ou fumée", "Feuer oder Rauch"),
  "tt.medical": e("Darurat medis", "Medical emergency", "医療緊急", "의료 응급", "医疗急救", "Медицинская помощь", "Urgence médicale", "Medizinischer Notfall"),
  "tt.security": e("Keamanan", "Security", "セキュリティ", "보안", "安保", "Безопасность", "Sécurité", "Sicherheit"),
  "tt.linenPillows": e("Tambahan linen atau bantal", "Extra linen or pillows", "リネン・枕の追加", "침구·베개 추가", "加床品或枕头", "Дополнительное бельё или подушки", "Linge ou oreillers supplémentaires", "Zusätzliche Bettwäsche oder Kissen"),
  "tt.talkToStaff": e("Tamu ingin bicara dengan staf", "Guest asked to talk to staff", "スタッフとの会話を希望", "직원 상담 요청", "客人要求与员工沟通", "Гость просит связаться с сотрудником", "Le client souhaite parler au personnel", "Gast möchte mit Personal sprechen"),
  "tt.guestRequest": e("Permintaan tamu", "Guest request", "ゲストのご依頼", "고객 요청", "客人请求", "Запрос гостя", "Demande du client", "Gästeanfrage"),
  "tt.aiUnavailable": e("Pesan tamu (AI tidak tersedia)", "Guest message (AI unavailable)", "ゲストのメッセージ（AI利用不可）", "고객 메시지 (AI 사용 불가)", "客人消息（AI 不可用）", "Сообщение гостя (ИИ недоступен)", "Message du client (IA indisponible)", "Gästenachricht (KI nicht verfügbar)"),
  "tt.amenities": e("Amenities", "Amenities", "アメニティ", "어메니티", "客房用品", "Принадлежности", "Produits d'accueil", "Pflegeartikel"),
  "tt.bottledWater": e("Air mineral", "Bottled water", "ミネラルウォーター", "생수", "瓶装水", "Бутилированная вода", "Eau en bouteille", "Mineralwasser"),
  "tt.dining": e("Pesanan ke kamar ({n} item)", "In-room dining ({n} items)", "ルームサービス（{n}品）", "룸서비스 ({n}개)", "送餐服务（{n} 件）", "Еда в номер ({n} поз.)", "Service en chambre ({n} articles)", "Zimmerservice ({n} Artikel)"),
  "tt.table": e("Pesanan meja {table} ({n} item)", "Table {table} order ({n} items)", "{table}番テーブルの注文（{n}品）", "{table}번 테이블 주문 ({n}개)", "{table} 号桌订单（{n} 件）", "Заказ стола {table} ({n} поз.)", "Commande table {table} ({n} articles)", "Bestellung Tisch {table} ({n} Artikel)"),
  "tt.late": e("Late check-out sampai {hour}", "Late checkout until {hour}", "{hour}までのレイトチェックアウト", "{hour}까지 레이트 체크아웃", "延迟退房至 {hour}", "Поздний выезд до {hour}", "Départ tardif jusqu'à {hour}", "Später Check-out bis {hour}"),
  "tt.escalation": e("Eskalasi: {title}", "Escalation: {title}", "エスカレーション：{title}", "에스컬레이션: {title}", "升级处理：{title}", "Эскалация: {title}", "Escalade : {title}", "Eskalation: {title}"),
  "tt.extra": e("Tambahan {items}", "Extra {items}", "{items}の追加", "{items} 추가", "加{items}", "Дополнительно: {items}", "Supplément : {items}", "Zusätzlich: {items}"),
  "ti.towels": e("handuk", "towels", "タオル", "수건", "毛巾", "полотенца", "serviettes", "Handtücher"),
  "ti.toiletries": e("perlengkapan mandi", "toiletries", "洗面用具", "세면도구", "洗漱用品", "туалетные принадлежности", "produits de toilette", "Pflegeartikel"),
  "ti.tissues": e("tisu", "tissues", "ティッシュ", "휴지", "纸巾", "салфетки", "mouchoirs", "Taschentücher"),
  "ti.slippers": e("sandal kamar", "slippers", "スリッパ", "슬리퍼", "拖鞋", "тапочки", "chaussons", "Hausschuhe"),
  "ti.dental": e("sikat & pasta gigi", "dental kit", "歯ブラシセット", "칫솔 세트", "牙具", "зубной набор", "kit dentaire", "Zahnpflegeset"),
  "ti.water": e("air mineral", "water", "水", "생수", "矿泉水", "вода", "eau", "Wasser"),

  // ---------- Instruksi operasional ----------
  "op.head": e("{title} — Kamar {room}.", "{title} — Room {room}.", "{title}（{room}号室）。", "{title} — {room}호.", "{title} — {room} 房。", "{title} — номер {room}.", "{title} — chambre {room}.", "{title} — Zimmer {room}."),
  "op.qty": e("Jumlah: {n}.", "Quantity: {n}.", "数量：{n}。", "수량: {n}.", "数量：{n}。", "Количество: {n}.", "Quantité : {n}.", "Menge: {n}."),
  "op.lang": e(
    "Tamu menulis dalam {lang}; pesan aslinya ada di atas.",
    "The guest wrote in {lang}; the original message is shown above.",
    "ゲストは{lang}で書いています。原文は上にあります。",
    "고객은 {lang}(으)로 작성했습니다. 원문은 위에 있습니다.",
    "客人使用{lang}书写，原文见上方。",
    "Гость писал на языке: {lang}. Исходное сообщение выше.",
    "Le client a écrit en {lang} ; le message original figure ci-dessus.",
    "Der Gast schrieb auf {lang}; die Originalnachricht steht oben."
  ),
  "op.title": e("Instruksi operasional ({lang})", "Operational request ({lang})", "作業指示（{lang}）", "작업 지시 ({lang})", "操作指令（{lang}）", "Задание для персонала ({lang})", "Consigne opérationnelle ({lang})", "Arbeitsanweisung ({lang})"),
  "op.do.towel": e("Antar ke kamar.", "Deliver to the room.", "お部屋へお届けください。", "객실로 전달해 주세요.", "请送到房间。", "Доставьте в номер.", "À livrer en chambre.", "Bitte aufs Zimmer bringen."),
  "op.do.cleaning": e("Bersihkan kamar (make up room).", "Make up the room.", "客室を清掃してください。", "객실을 청소해 주세요.", "请打扫房间。", "Уберите номер.", "Faire la chambre.", "Zimmer reinigen."),
  "op.do.ac": e("Kirim teknisi untuk memeriksa unit AC.", "Send a technician to check the AC unit.", "技術者を派遣してエアコンを点検してください。", "기술자를 보내 에어컨을 점검해 주세요.", "请派技术员检查空调。", "Отправьте техника проверить кондиционер.", "Envoyer un technicien vérifier la climatisation.", "Techniker zur Prüfung der Klimaanlage schicken."),
  "op.do.electricity": e("Kirim teknisi untuk memeriksa listrik dan lampu.", "Send a technician to check the electrics.", "技術者を派遣して電気設備を点検してください。", "기술자를 보내 전기 설비를 점검해 주세요.", "请派技术员检查电路。", "Отправьте техника проверить электрику.", "Envoyer un technicien vérifier l'électricité.", "Techniker zur Prüfung der Elektrik schicken."),
  "op.do.plumbing": e("Kirim teknisi untuk memeriksa saluran air.", "Send a technician to check the plumbing.", "技術者を派遣して水回りを点検してください。", "기술자를 보내 배관을 점검해 주세요.", "请派技术员检查水管。", "Отправьте техника проверить сантехнику.", "Envoyer un technicien vérifier la plomberie.", "Techniker zur Prüfung der Sanitäranlage schicken."),
  "op.do.tv_wifi": e("Periksa TV / Wi-Fi di kamar.", "Check the TV / Wi-Fi in the room.", "客室のテレビ・Wi-Fiを確認してください。", "객실 TV·와이파이를 확인해 주세요.", "请检查房间的电视 / Wi-Fi。", "Проверьте телевизор / Wi-Fi в номере.", "Vérifier la télévision / le Wi-Fi de la chambre.", "TV / WLAN im Zimmer prüfen."),
  "op.do.key_lock": e("Siapkan kartu kunci baru dan periksa kunci pintu.", "Prepare a new key card and check the door lock.", "新しいカードキーを用意し、ドアロックを確認してください。", "새 카드키를 준비하고 도어락을 확인해 주세요.", "请准备新房卡并检查门锁。", "Подготовьте новую ключ-карту и проверьте замок.", "Préparer une nouvelle carte-clé et vérifier la serrure.", "Neue Schlüsselkarte vorbereiten und Türschloss prüfen."),
  "op.do.billing_checkout": e("Setujui atau tolak late check-out, lalu kabari tamu.", "Approve or decline the late checkout and inform the guest.", "レイトチェックアウトを承認または却下し、ゲストに連絡してください。", "레이트 체크아웃을 승인 또는 거절하고 고객에게 알려 주세요.", "请批准或拒绝延迟退房，并通知客人。", "Одобрите или отклоните поздний выезд и сообщите гостю.", "Accepter ou refuser le départ tardif et prévenir le client.", "Späten Check-out genehmigen oder ablehnen und Gast informieren."),
  "op.do.complaint": e("Duty Manager harap segera menghubungi tamu.", "Duty Manager, please contact the guest right away.", "デューティーマネージャーはすぐにゲストへ連絡してください。", "당직 매니저는 즉시 고객에게 연락해 주세요.", "请值班经理立即联系客人。", "Дежурный менеджер, немедленно свяжитесь с гостем.", "Duty Manager : contacter le client immédiatement.", "Duty Manager bitte sofort den Gast kontaktieren."),
  "op.do.emergency": e("Security, Front Office, dan Duty Manager segera ke kamar.", "Security, Front Office and Duty Manager go to the room now.", "警備、フロント、デューティーマネージャーは直ちに客室へ。", "보안팀, 프런트, 당직 매니저는 즉시 객실로 가 주세요.", "保安、前台和值班经理请立即前往房间。", "Охрана, ресепшен и дежурный менеджер — немедленно в номер.", "Sécurité, réception et Duty Manager : en chambre immédiatement.", "Sicherheit, Rezeption und Duty Manager sofort zum Zimmer."),
  "op.do.dining": e("Siapkan pesanan sesuai daftar; tagihan ke kamar.", "Prepare the order as listed; charge to the room.", "リストの通りに用意し、お部屋付けにしてください。", "목록대로 주문을 준비하고 객실로 청구해 주세요.", "请按清单准备订单，费用计入房账。", "Приготовьте заказ по списку, счёт на номер.", "Préparer la commande telle que listée ; facturer sur la chambre.", "Bestellung laut Liste zubereiten; aufs Zimmer buchen."),
  "op.do.bellboy": e("Kirim bellboy ke kamar.", "Send a bell attendant to the room.", "ベルスタッフを客室へ向かわせてください。", "벨보이를 객실로 보내 주세요.", "请派行李员到房间。", "Отправьте портье в номер.", "Envoyer un bagagiste en chambre.", "Pagen zum Zimmer schicken."),
  "op.do.excursion": e("Siapkan mobil dan sopir; konfirmasi harga ke tamu.", "Arrange a car and driver; confirm the price with the guest.", "車とドライバーを手配し、料金をゲストに確認してください。", "차량과 기사를 준비하고 고객에게 요금을 확인해 주세요.", "请安排车辆和司机，并与客人确认费用。", "Организуйте машину с водителем, согласуйте цену с гостем.", "Organiser une voiture avec chauffeur ; confirmer le prix avec le client.", "Auto mit Fahrer organisieren; Preis mit dem Gast bestätigen."),
  "op.do.upsell": e("Siapkan layanan yang dipesan; tagihan sudah masuk ke kamar.", "Prepare the booked service; it is already charged to the room.", "予約されたサービスを準備してください（お部屋付け済み）。", "예약된 서비스를 준비해 주세요 (객실 청구 완료).", "请准备已预订的服务（已计入房账）。", "Подготовьте заказанную услугу (уже в счёте номера).", "Préparer le service réservé (déjà facturé sur la chambre).", "Gebuchten Service vorbereiten (bereits aufs Zimmer gebucht)."),
  "op.do.unclassified": e("Baca pesan asli tamu dan tindak lanjuti.", "Read the guest's original message and follow up.", "ゲストの原文を読み、対応してください。", "고객 원문 메시지를 읽고 후속 조치해 주세요.", "请阅读客人原始消息并跟进。", "Прочитайте исходное сообщение гостя и примите меры.", "Lire le message original du client et donner suite.", "Originalnachricht des Gastes lesen und nachfassen."),

  // ---------- Makan di restoran (dine-in) ----------
  "g.step.served": e("Disajikan", "Served", "提供済み", "제공 완료", "已上菜", "Подано", "Servie", "Serviert"),
  "g.food.atTable": e("Meja {table}", "Table {table}", "{table}番テーブル", "{table}번 테이블", "{table} 号桌", "Стол {table}", "Table {table}", "Tisch {table}"),
  "g.food.placedBodyTable": e(
    "Sudah kami kirim ke dapur. Silakan menuju restoran; pesanan Anda disajikan di Meja {table}. Tagihan masuk ke kamar {room}.",
    "We've sent it to the kitchen. Please head to the restaurant; your order will be served at table {table}. It will be charged to room {room}.",
    "キッチンに送りました。レストランへお越しください。{table}番テーブルにお出しします。料金は{room}号室付けとなります。",
    "주방으로 전달했습니다. 레스토랑으로 와 주세요. {table}번 테이블로 서빙해 드립니다. 요금은 {room}호로 청구됩니다.",
    "已发送至厨房。请前往餐厅，餐点将送到 {table} 号桌，费用计入 {room} 房。",
    "Заказ передан на кухню. Проходите в ресторан, его подадут к столу {table}. Оплата будет включена в счёт номера {room}.",
    "C'est transmis à la cuisine. Rendez-vous au restaurant : votre commande sera servie à la table {table}. Elle sera portée sur la chambre {room}.",
    "Wir haben sie an die Küche geschickt. Bitte kommen Sie ins Restaurant; serviert wird an Tisch {table}. Sie wird auf Zimmer {room} gebucht."
  ),
  "tk.markServed": e("Tandai disajikan", "Mark served", "提供済みにする", "제공 완료로 표시", "标记已上菜", "Отметить как поданный", "Marquer comme servie", "Als serviert markieren"),

  // ---------- Kompensasi & eskalasi komplain ----------
  "g.chat.compensation": e(
    "Sebagai permintaan maaf, kami ingin memberikan:",
    "As an apology, we would like to offer you:",
    "お詫びのしるしとして、以下をご用意いたします：",
    "사과의 뜻으로 다음을 제공해 드리고자 합니다:",
    "为表歉意，我们为您提供：",
    "В качестве извинения мы хотим предложить вам:",
    "Pour nous excuser, nous souhaitons vous offrir :",
    "Als Entschuldigung möchten wir Ihnen Folgendes anbieten:"
  ),
  "g.chat.connectingDM": e(
    "Anda sedang dihubungkan dengan Duty Manager. Asisten akan diam sampai beliau membalas.",
    "You're being connected with the Duty Manager. The assistant will stay quiet until they reply.",
    "デューティーマネージャーにおつなぎしています。返信があるまでアシスタントは応答を控えます。",
    "당직 매니저에게 연결하고 있습니다. 답변이 올 때까지 어시스턴트는 응답하지 않습니다.",
    "正在为您转接值班经理。在其回复前，助手将暂停回复。",
    "Соединяем вас с дежурным менеджером. Ассистент не будет отвечать, пока он не ответит.",
    "Nous vous mettons en relation avec le Duty Manager. L'assistant restera silencieux jusqu'à sa réponse.",
    "Wir verbinden Sie mit dem Duty Manager. Der Assistent schweigt, bis er antwortet."
  ),
  "toast.compensationSent": e(
    "Kompensasi dikirim ke tamu kamar {room}",
    "Compensation sent to the guest in room {room}",
    "{room}号室のゲストに補償を送りました",
    "{room}호 고객에게 보상을 전달했습니다",
    "已向 {room} 房客人发送补偿",
    "Компенсация отправлена гостю номера {room}",
    "Compensation envoyée au client de la chambre {room}",
    "Entschädigung an den Gast in Zimmer {room} gesendet"
  ),
  "conv.compensation": e("Kompensasi: {item}", "Compensation: {item}", "補償：{item}", "보상: {item}", "补偿：{item}", "Компенсация: {item}", "Compensation : {item}", "Entschädigung: {item}"),

  // ---------- Aplikasi HOSPI Staff & notifikasi push ----------
  "pwa.title": e("Aplikasi HOSPI Staff", "HOSPI Staff app", "HOSPI Staff アプリ", "HOSPI Staff 앱", "HOSPI Staff 应用", "Приложение HOSPI Staff", "Application HOSPI Staff", "HOSPI-Staff-App"),
  "pwa.hint": e(
    "Pasang di HP, tablet, atau komputer kerja supaya terbuka seperti aplikasi dan bisa menerima notifikasi.",
    "Install it on a work phone, tablet or computer so it opens like an app and can receive notifications.",
    "業務用のスマホ・タブレット・PCにインストールすると、アプリとして開き通知を受け取れます。",
    "업무용 휴대폰, 태블릿, 컴퓨터에 설치하면 앱처럼 열리고 알림을 받을 수 있습니다.",
    "安装到工作手机、平板或电脑上，即可像应用一样打开并接收通知。",
    "Установите на рабочий телефон, планшет или компьютер — приложение будет открываться отдельно и получать уведомления.",
    "Installez-la sur un téléphone, une tablette ou un ordinateur de travail pour l'ouvrir comme une application et recevoir des notifications.",
    "Auf einem Arbeitshandy, Tablet oder Computer installieren, damit sie wie eine App öffnet und Benachrichtigungen empfängt."
  ),
  "pwa.install": e("Pasang aplikasi", "Install app", "アプリをインストール", "앱 설치", "安装应用", "Установить приложение", "Installer l'application", "App installieren"),
  "pwa.installed": e("Sudah terpasang di perangkat ini", "Installed on this device", "この端末にインストール済み", "이 기기에 설치됨", "已安装在此设备上", "Установлено на этом устройстве", "Installée sur cet appareil", "Auf diesem Gerät installiert"),
  "pwa.ios": e(
    "Di iPhone/iPad: buka di Safari, ketuk tombol Bagikan, lalu pilih \"Tambah ke Layar Utama\".",
    "On iPhone/iPad: open in Safari, tap Share, then choose \"Add to Home Screen\".",
    "iPhone/iPadの場合：Safariで開き、共有ボタンから「ホーム画面に追加」を選びます。",
    "iPhone/iPad: Safari에서 열고 공유 버튼을 누른 뒤 \"홈 화면에 추가\"를 선택하세요.",
    "iPhone/iPad：在 Safari 中打开，点击“分享”，然后选择“添加到主屏幕”。",
    "На iPhone/iPad: откройте в Safari, нажмите «Поделиться» и выберите «На экран „Домой“».",
    "Sur iPhone/iPad : ouvrez dans Safari, touchez Partager, puis « Sur l'écran d'accueil ».",
    "Auf iPhone/iPad: in Safari öffnen, auf Teilen tippen und „Zum Home-Bildschirm“ wählen."
  ),
  "pwa.manual": e(
    "Buka menu browser, lalu pilih \"Install aplikasi\" atau \"Tambahkan ke layar utama\".",
    "Open the browser menu and choose \"Install app\" or \"Add to Home screen\".",
    "ブラウザのメニューから「アプリをインストール」または「ホーム画面に追加」を選びます。",
    "브라우저 메뉴에서 \"앱 설치\" 또는 \"홈 화면에 추가\"를 선택하세요.",
    "打开浏览器菜单，选择“安装应用”或“添加到主屏幕”。",
    "Откройте меню браузера и выберите «Установить приложение» или «Добавить на главный экран».",
    "Ouvrez le menu du navigateur et choisissez « Installer l'application » ou « Ajouter à l'écran d'accueil ».",
    "Im Browsermenü „App installieren“ oder „Zum Startbildschirm hinzufügen“ wählen."
  ),
  "pwa.cta": e("Pasang aplikasi & aktifkan notifikasi", "Install the app & turn on notifications", "アプリをインストールして通知をオン", "앱 설치 및 알림 켜기", "安装应用并开启通知", "Установить приложение и включить уведомления", "Installer l'app et activer les notifications", "App installieren & Benachrichtigungen aktivieren"),
  "push.title": e("Notifikasi di perangkat ini", "Notifications on this device", "この端末の通知", "이 기기의 알림", "此设备的通知", "Уведомления на этом устройстве", "Notifications sur cet appareil", "Benachrichtigungen auf diesem Gerät"),
  "push.hint": e(
    "Perangkat berbunyi saat ada tugas baru untuk {role}, keadaan darurat, atau tiket yang lewat batas waktu, walau aplikasi sedang ditutup.",
    "The device alerts you about new tasks for {role}, emergencies and overdue tickets, even when the app is closed.",
    "アプリを閉じていても、{role}の新しいタスク、緊急事態、期限超過のチケットを通知します。",
    "앱을 닫아도 {role}의 새 작업, 긴급 상황, 기한 초과 티켓을 알려 드립니다.",
    "即使应用已关闭，也会提醒 {role} 的新任务、紧急情况和超时工单。",
    "Устройство сообщит о новых задачах для {role}, ЧП и просроченных заявках, даже если приложение закрыто.",
    "L'appareil vous alerte des nouvelles tâches pour {role}, des urgences et des tickets en retard, même application fermée.",
    "Das Gerät meldet neue Aufgaben für {role}, Notfälle und überfällige Tickets, auch wenn die App geschlossen ist."
  ),
  "push.enable": e("Aktifkan notifikasi", "Turn on notifications", "通知をオンにする", "알림 켜기", "开启通知", "Включить уведомления", "Activer les notifications", "Benachrichtigungen aktivieren"),
  "push.disable": e("Matikan", "Turn off", "オフにする", "끄기", "关闭", "Выключить", "Désactiver", "Ausschalten"),
  "push.test": e("Kirim notifikasi uji", "Send a test notification", "テスト通知を送信", "테스트 알림 보내기", "发送测试通知", "Отправить тестовое уведомление", "Envoyer une notification test", "Testbenachrichtigung senden"),
  "push.testSent": e("Notifikasi uji dikirim", "Test notification sent", "テスト通知を送信しました", "테스트 알림을 보냈습니다", "测试通知已发送", "Тестовое уведомление отправлено", "Notification test envoyée", "Testbenachrichtigung gesendet"),
  "push.testFailed": e("Notifikasi uji gagal dikirim", "Couldn't send the test notification", "テスト通知を送信できませんでした", "테스트 알림을 보내지 못했습니다", "测试通知发送失败", "Не удалось отправить тестовое уведомление", "Échec de l'envoi de la notification test", "Testbenachrichtigung konnte nicht gesendet werden"),
  "push.on": e("Aktif untuk {role}", "On for {role}", "{role}向けにオン", "{role}용으로 켜짐", "已为 {role} 开启", "Включено для {role}", "Activées pour {role}", "Aktiv für {role}"),
  "push.off": e("Belum aktif", "Off", "オフ", "꺼짐", "未开启", "Выключено", "Désactivées", "Aus"),
  "push.denied": e(
    "Notifikasi diblokir di browser. Izinkan lewat pengaturan situs, lalu coba lagi.",
    "Notifications are blocked in the browser. Allow them in the site settings, then try again.",
    "ブラウザで通知がブロックされています。サイトの設定で許可してから再度お試しください。",
    "브라우저에서 알림이 차단되어 있습니다. 사이트 설정에서 허용한 뒤 다시 시도하세요.",
    "浏览器已阻止通知。请在网站设置中允许后重试。",
    "Уведомления заблокированы в браузере. Разрешите их в настройках сайта и попробуйте снова.",
    "Les notifications sont bloquées dans le navigateur. Autorisez-les dans les paramètres du site, puis réessayez.",
    "Benachrichtigungen sind im Browser blockiert. In den Website-Einstellungen erlauben und erneut versuchen."
  ),
  "push.unsupported": e(
    "Browser ini belum mendukung notifikasi push. Di iPhone, pasang aplikasinya ke layar utama dulu.",
    "This browser doesn't support push notifications. On iPhone, add the app to the Home Screen first.",
    "このブラウザはプッシュ通知に対応していません。iPhoneでは先にホーム画面に追加してください。",
    "이 브라우저는 푸시 알림을 지원하지 않습니다. iPhone에서는 먼저 홈 화면에 앱을 추가하세요.",
    "此浏览器不支持推送通知。在 iPhone 上，请先将应用添加到主屏幕。",
    "Этот браузер не поддерживает push-уведомления. На iPhone сначала добавьте приложение на экран «Домой».",
    "Ce navigateur ne prend pas en charge les notifications push. Sur iPhone, ajoutez d'abord l'app à l'écran d'accueil.",
    "Dieser Browser unterstützt keine Push-Benachrichtigungen. Auf dem iPhone die App zuerst zum Home-Bildschirm hinzufügen."
  ),
  "push.serverOff": e("Notifikasi push belum diaktifkan di server.", "Push notifications aren't enabled on the server yet.", "サーバーでプッシュ通知がまだ有効になっていません。", "서버에서 푸시 알림이 아직 활성화되지 않았습니다.", "服务器尚未启用推送通知。", "Push-уведомления ещё не включены на сервере.", "Les notifications push ne sont pas encore activées sur le serveur.", "Push-Benachrichtigungen sind auf dem Server noch nicht aktiviert."),
  "push.testTitle": e("HOSPI · Notifikasi uji", "HOSPI · Test notification", "HOSPI・テスト通知", "HOSPI · 테스트 알림", "HOSPI · 测试通知", "HOSPI · Тестовое уведомление", "HOSPI · Notification test", "HOSPI · Testbenachrichtigung"),
  "push.testBody": e("Notifikasi di perangkat ini sudah berfungsi.", "Notifications are working on this device.", "この端末で通知が正常に動作しています。", "이 기기에서 알림이 정상 작동합니다.", "此设备的通知已正常工作。", "Уведомления на этом устройстве работают.", "Les notifications fonctionnent sur cet appareil.", "Benachrichtigungen funktionieren auf diesem Gerät."),

  // ---------- Ganti peran di aplikasi HOSPI Staff ----------
  "sw.roleButton": e("Ganti peran", "Switch role", "役割を切り替え", "역할 전환", "切换角色", "Сменить роль", "Changer de rôle", "Rolle wechseln"),
  "sw.roleTitle": e("Masuk sebagai bagian apa?", "Which team are you on?", "どの部門で使いますか？", "어느 부서로 사용하시나요?", "您属于哪个部门？", "В каком вы отделе?", "Dans quelle équipe êtes-vous ?", "In welchem Team sind Sie?"),
  "sw.roleSubtitle": e(
    "Aplikasi ini khusus staf hotel. Notifikasi di perangkat ini ikut pindah ke peran yang dipilih.",
    "This app is for hotel staff only. Notifications on this device follow the role you choose.",
    "このアプリはホテルスタッフ専用です。この端末の通知は選んだ役割に切り替わります。",
    "이 앱은 호텔 직원 전용입니다. 이 기기의 알림은 선택한 역할을 따릅니다.",
    "此应用仅供酒店员工使用。此设备的通知会跟随所选角色。",
    "Приложение только для персонала отеля. Уведомления на этом устройстве переключатся на выбранную роль.",
    "Cette application est réservée au personnel. Les notifications de cet appareil suivent le rôle choisi.",
    "Diese App ist nur für Hotelpersonal. Benachrichtigungen auf diesem Gerät folgen der gewählten Rolle."
  ),

  // ---------- Pengaturan bahasa staf ----------
  "set.staffLanguage": e("Bahasa staf & laporan", "Staff & report language", "スタッフ・レポートの言語", "직원·보고서 언어", "员工与报告语言", "Язык персонала и отчётов", "Langue du personnel et des rapports", "Sprache für Personal & Berichte"),
  "set.staffLanguageHint": e(
    "Dashboard staf dan instruksi di setiap tiket memakai bahasa ini. Tamu tetap melihat aplikasi dalam bahasanya masing-masing.",
    "The staff dashboard and the instruction on every ticket use this language. Guests still see the app in their own language.",
    "スタッフのダッシュボードと各チケットの作業指示はこの言語で表示されます。ゲストは自分の言語でアプリを利用します。",
    "직원 대시보드와 각 티켓의 작업 지시는 이 언어로 표시됩니다. 고객은 각자의 언어로 앱을 이용합니다.",
    "员工后台和每张工单的操作指令都使用此语言。客人仍以各自的语言使用应用。",
    "Панель персонала и задания в каждой заявке отображаются на этом языке. Гости по-прежнему видят приложение на своём языке.",
    "Le tableau de bord du personnel et la consigne de chaque ticket utilisent cette langue. Les clients gardent leur propre langue.",
    "Das Personal-Dashboard und die Anweisung in jedem Ticket nutzen diese Sprache. Gäste sehen die App weiterhin in ihrer Sprache."
  ),
};
