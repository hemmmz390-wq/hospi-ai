import { e } from "./entry";

/** Tamu sungguhan: check-in & check-out oleh Front Office, kartu akses QR, dan masuk dengan kode. */
export const guests = {
  // ---------- Check-in (staf) ----------
  "ci.button": e("Check-in tamu", "Check in a guest", "チェックイン", "체크인", "办理入住", "Заселить гостя", "Enregistrer un client", "Gast einchecken"),
  "ci.title": e("Check-in tamu baru", "Check in a new guest", "新しいゲストのチェックイン", "새 고객 체크인", "为新客人办理入住", "Заселение нового гостя", "Enregistrer un nouveau client", "Neuen Gast einchecken"),
  "ci.sub": e(
    "Tamu mendapat kode akses dan QR untuk membuka aplikasi tamu dari HP-nya sendiri.",
    "The guest gets an access code and QR code to open the guest app on their own phone.",
    "ゲストには、自分のスマホでゲストアプリを開くためのアクセスコードとQRコードが発行されます。",
    "고객은 본인 휴대폰에서 고객 앱을 열 수 있는 접속 코드와 QR 코드를 받습니다.",
    "客人将获得访问码和二维码，可在自己的手机上打开客人应用。",
    "Гость получит код доступа и QR-код, чтобы открыть гостевое приложение на своём телефоне.",
    "Le client reçoit un code d'accès et un QR code pour ouvrir l'application sur son propre téléphone.",
    "Der Gast erhält einen Zugangscode und QR-Code, um die Gäste-App auf dem eigenen Handy zu öffnen."
  ),
  "ci.room": e("Kamar", "Room", "部屋", "객실", "房间", "Номер", "Chambre", "Zimmer"),
  "ci.name": e("Nama tamu", "Guest name", "ゲスト名", "고객 이름", "客人姓名", "Имя гостя", "Nom du client", "Name des Gastes"),
  "ci.language": e("Bahasa tamu", "Guest language", "ゲストの言語", "고객 언어", "客人语言", "Язык гостя", "Langue du client", "Sprache des Gastes"),
  "ci.nights": e("Lama menginap (malam)", "Length of stay (nights)", "宿泊数（泊）", "숙박 기간 (박)", "入住天数（晚）", "Срок проживания (ночей)", "Durée du séjour (nuits)", "Aufenthalt (Nächte)"),
  "ci.phone": e("No. HP (tidak wajib)", "Phone (optional)", "電話番号（任意）", "전화번호 (선택)", "电话（可选）", "Телефон (необязательно)", "Téléphone (facultatif)", "Telefon (optional)"),
  "ci.nationality": e("Kewarganegaraan (tidak wajib)", "Nationality (optional)", "国籍（任意）", "국적 (선택)", "国籍（可选）", "Гражданство (необязательно)", "Nationalité (facultatif)", "Staatsangehörigkeit (optional)"),
  "ci.submit": e("Check-in & buat kartu akses", "Check in & create access card", "チェックインしてアクセスカードを作成", "체크인 및 접속 카드 만들기", "办理入住并生成访问卡", "Заселить и создать карту доступа", "Enregistrer et créer la carte d'accès", "Einchecken & Zugangskarte erstellen"),
  "ci.done": e("Tamu kamar {room} sudah check-in", "Room {room} is checked in", "{room}号室のチェックインが完了しました", "{room}호 체크인 완료", "{room} 房已办理入住", "Номер {room}: гость заселён", "Chambre {room} enregistrée", "Zimmer {room} eingecheckt"),
  "ci.failed": e("Gagal membuat kode akses. Periksa koneksi lalu coba lagi.", "Couldn't create the access code. Check the connection and try again.", "アクセスコードを作成できませんでした。接続を確認して再度お試しください。", "접속 코드를 만들지 못했습니다. 연결을 확인하고 다시 시도하세요.", "无法生成访问码，请检查网络后重试。", "Не удалось создать код доступа. Проверьте соединение и попробуйте снова.", "Impossible de créer le code d'accès. Vérifiez la connexion et réessayez.", "Zugangscode konnte nicht erstellt werden. Verbindung prüfen und erneut versuchen."),
  "ci.noVacant": e("Tidak ada kamar kosong.", "No vacant rooms.", "空室がありません。", "빈 객실이 없습니다.", "没有空房。", "Нет свободных номеров.", "Aucune chambre libre.", "Keine freien Zimmer."),
  "ci.nameRequired": e("Isi nama tamu.", "Enter the guest's name.", "ゲスト名を入力してください。", "고객 이름을 입력하세요.", "请输入客人姓名。", "Введите имя гостя.", "Saisissez le nom du client.", "Namen des Gastes eingeben."),

  // ---------- Kartu akses ----------
  "acc.title": e("Kartu akses kamar {room}", "Access card · room {room}", "{room}号室のアクセスカード", "{room}호 접속 카드", "{room} 房访问卡", "Карта доступа · номер {room}", "Carte d'accès · chambre {room}", "Zugangskarte · Zimmer {room}"),
  "acc.sub": e(
    "Berikan ke tamu. Tamu cukup memindai QR dengan kamera HP, atau membuka alamat di bawah lalu memasukkan nomor kamar dan kode.",
    "Give this to the guest. They just scan the QR with their phone camera, or open the address below and enter the room number and code.",
    "ゲストにお渡しください。スマホのカメラでQRを読み取るか、下記のアドレスを開いて部屋番号とコードを入力します。",
    "고객에게 전달하세요. 휴대폰 카메라로 QR을 스캔하거나, 아래 주소를 열고 객실 번호와 코드를 입력하면 됩니다.",
    "请交给客人。客人用手机相机扫描二维码，或打开下方网址并输入房号和访问码即可。",
    "Передайте гостю. Достаточно отсканировать QR камерой телефона или открыть адрес ниже и ввести номер и код.",
    "À remettre au client. Il scanne le QR avec l'appareil photo, ou ouvre l'adresse ci-dessous et saisit le numéro de chambre et le code.",
    "Dem Gast übergeben. Einfach den QR-Code mit der Handykamera scannen oder die Adresse unten öffnen und Zimmernummer und Code eingeben."
  ),
  "acc.code": e("Kode akses", "Access code", "アクセスコード", "접속 코드", "访问码", "Код доступа", "Code d'accès", "Zugangscode"),
  "acc.once": e(
    "Kode hanya ditampilkan sekarang. Bila hilang, buat kode baru; kode lama otomatis tidak berlaku.",
    "The code is only shown now. If it's lost, create a new one; the old code stops working.",
    "コードはこの画面でのみ表示されます。紛失した場合は新しいコードを作成してください（古いコードは無効になります）。",
    "코드는 지금만 표시됩니다. 분실하면 새 코드를 만드세요. 이전 코드는 자동으로 무효가 됩니다.",
    "访问码仅在此显示一次。如遗失，请生成新码，旧码将自动失效。",
    "Код показывается только сейчас. Если он потерян, создайте новый — старый перестанет действовать.",
    "Le code n'est affiché que maintenant. En cas de perte, créez-en un nouveau ; l'ancien ne fonctionnera plus.",
    "Der Code wird nur jetzt angezeigt. Bei Verlust einen neuen erstellen; der alte wird ungültig."
  ),
  "acc.print": e("Cetak kartu", "Print card", "カードを印刷", "카드 인쇄", "打印卡片", "Распечатать", "Imprimer la carte", "Karte drucken"),
  "acc.copy": e("Salin link", "Copy link", "リンクをコピー", "링크 복사", "复制链接", "Скопировать ссылку", "Copier le lien", "Link kopieren"),
  "acc.copied": e("Link disalin", "Link copied", "リンクをコピーしました", "링크를 복사했습니다", "链接已复制", "Ссылка скопирована", "Lien copié", "Link kopiert"),
  "acc.reissue": e("Buat kode akses baru", "Create a new access code", "新しいアクセスコードを作成", "새 접속 코드 만들기", "生成新访问码", "Создать новый код доступа", "Créer un nouveau code d'accès", "Neuen Zugangscode erstellen"),
  "acc.welcome": e(
    "Pindai untuk meminta layanan hotel dari HP Anda",
    "Scan to request hotel services from your phone",
    "スマホからホテルのサービスを依頼するにはスキャン",
    "스캔하여 휴대폰으로 호텔 서비스를 요청하세요",
    "扫码即可用手机呼叫酒店服务",
    "Отсканируйте, чтобы заказывать услуги отеля с телефона",
    "Scannez pour demander les services de l'hôtel depuis votre téléphone",
    "Scannen, um Hotelservices per Handy anzufragen"
  ),

  // ---------- Check-out ----------
  "co.button": e("Check-out tamu", "Check out guest", "チェックアウト", "체크아웃", "办理退房", "Выселить гостя", "Départ du client", "Gast auschecken"),
  "co.confirm": e(
    "Check-out {name} dari kamar {room}? Akses aplikasi tamu langsung berakhir dan kamar ditandai perlu dibersihkan.",
    "Check out {name} from room {room}? Their guest app access ends immediately and the room is marked for cleaning.",
    "{room}号室の{name}様をチェックアウトしますか？ゲストアプリへのアクセスは直ちに終了し、部屋は清掃待ちになります。",
    "{room}호 {name} 님을 체크아웃할까요? 고객 앱 접속이 즉시 종료되고 객실은 청소 필요로 표시됩니다.",
    "为 {room} 房的 {name} 办理退房？客人应用的访问将立即结束，房间标记为待清洁。",
    "Выселить {name} из номера {room}? Доступ к гостевому приложению сразу прекратится, номер будет отмечен для уборки.",
    "Départ de {name}, chambre {room} ? L'accès à l'application prend fin immédiatement et la chambre passe en ménage.",
    "{name} aus Zimmer {room} auschecken? Der Zugang zur Gäste-App endet sofort und das Zimmer wird zur Reinigung markiert."
  ),
  "co.done": e("Kamar {room} sudah check-out", "Room {room} is checked out", "{room}号室のチェックアウトが完了しました", "{room}호 체크아웃 완료", "{room} 房已退房", "Номер {room}: гость выселен", "Chambre {room} libérée", "Zimmer {room} ausgecheckt"),
  "guests.real": e("Tamu terdaftar", "Registered guest", "登録ゲスト", "등록 고객", "登记客人", "Зарегистрированный гость", "Client enregistré", "Registrierter Gast"),
  "guests.demo": e("Demo", "Demo", "デモ", "데모", "演示", "Демо", "Démo", "Demo"),

  // ---------- Kabar dari AI: pekerjaan selesai ----------
  "g.notice.order_ready_table": e(
    "Pesanan {order} Anda sudah siap dan disajikan di Meja {table}. Selamat menikmati!",
    "Your order {order} is ready and being served at table {table}. Enjoy your meal!",
    "ご注文 {order} の準備ができました。{table}番テーブルにお出しします。どうぞお召し上がりください！",
    "주문하신 {order}이(가) 준비되어 {table}번 테이블로 서빙됩니다. 맛있게 드세요!",
    "您的订单 {order} 已备好，正在送到 {table} 号桌。请慢用！",
    "Ваш заказ {order} готов, его подают к столу {table}. Приятного аппетита!",
    "Votre commande {order} est prête et servie à la table {table}. Bon appétit !",
    "Ihre Bestellung {order} ist fertig und wird an Tisch {table} serviert. Guten Appetit!"
  ),
  "g.notice.cleaning_done": e(
    "Kamar Anda sudah selesai dibersihkan. Selamat beristirahat!",
    "Your room has been cleaned. Enjoy your stay!",
    "お部屋の清掃が完了しました。ごゆっくりお過ごしください！",
    "객실 청소가 완료되었습니다. 편안히 쉬세요!",
    "您的房间已打扫完毕，祝您入住愉快！",
    "Уборка вашего номера завершена. Приятного отдыха!",
    "Votre chambre a été nettoyée. Bon séjour !",
    "Ihr Zimmer ist gereinigt. Einen schönen Aufenthalt!"
  ),
  "g.notice.ac_fixed": e(
    "AC di kamar Anda sudah selesai diperbaiki. Kalau masih ada kendala, beri tahu kami di sini.",
    "The air conditioning in your room has been fixed. If anything is still wrong, just tell us here.",
    "お部屋のエアコンの修理が完了しました。まだ不具合があれば、こちらでお知らせください。",
    "객실 에어컨 수리가 완료되었습니다. 아직 문제가 있으면 여기서 말씀해 주세요.",
    "您房间的空调已修好。如仍有问题，请在这里告诉我们。",
    "Кондиционер в вашем номере починили. Если что-то ещё не так, напишите нам здесь.",
    "La climatisation de votre chambre a été réparée. Si quelque chose ne va toujours pas, dites-le-nous ici.",
    "Die Klimaanlage in Ihrem Zimmer ist repariert. Falls noch etwas nicht stimmt, sagen Sie es uns hier."
  ),
  "g.notice.repair_done": e(
    "Perbaikan di kamar Anda sudah selesai. Kalau masih ada kendala, beri tahu kami di sini.",
    "The repair in your room is done. If anything is still wrong, just tell us here.",
    "お部屋の修理が完了しました。まだ不具合があれば、こちらでお知らせください。",
    "객실 수리가 완료되었습니다. 아직 문제가 있으면 여기서 말씀해 주세요.",
    "您房间的维修已完成。如仍有问题，请在这里告诉我们。",
    "Ремонт в вашем номере завершён. Если что-то ещё не так, напишите нам здесь.",
    "La réparation dans votre chambre est terminée. Si quelque chose ne va toujours pas, dites-le-nous ici.",
    "Die Reparatur in Ihrem Zimmer ist erledigt. Falls noch etwas nicht stimmt, sagen Sie es uns hier."
  ),

  // ---------- Notifikasi HP untuk tamu ----------
  "g.notify.title": e("Kabari saya lewat notifikasi", "Notify me on my phone", "スマホに通知を受け取る", "휴대폰으로 알림 받기", "通过手机通知我", "Уведомлять меня на телефоне", "Me prévenir sur mon téléphone", "Mich per Benachrichtigung informieren"),
  "g.notify.hint": e(
    "Dapat pemberitahuan saat pesanan siap, kamar selesai dibersihkan, atau perbaikan selesai.",
    "Get a notification when your order is ready, your room is cleaned, or a repair is done.",
    "ご注文の準備完了、客室清掃の完了、修理の完了をお知らせします。",
    "주문 준비, 객실 청소 완료, 수리 완료 시 알림을 받습니다.",
    "订单备好、房间打扫完毕或维修完成时通知您。",
    "Уведомим, когда заказ готов, номер убран или ремонт завершён.",
    "Recevez une notification quand votre commande est prête, la chambre nettoyée ou une réparation terminée.",
    "Benachrichtigung, wenn die Bestellung fertig, das Zimmer gereinigt oder eine Reparatur erledigt ist."
  ),
  "g.notify.enable": e("Aktifkan", "Turn on", "オンにする", "켜기", "开启", "Включить", "Activer", "Aktivieren"),
  "g.notify.on": e("Notifikasi aktif", "Notifications on", "通知オン", "알림 켜짐", "通知已开启", "Уведомления включены", "Notifications activées", "Benachrichtigungen an"),
  "g.notify.denied": e("Notifikasi diblokir di browser. Kabar tetap muncul di chat.", "Notifications are blocked in the browser. Updates still appear in the chat.", "ブラウザで通知がブロックされています。お知らせはチャットに表示されます。", "브라우저에서 알림이 차단되었습니다. 소식은 채팅에 표시됩니다.", "浏览器已阻止通知，动态仍会显示在聊天中。", "Уведомления заблокированы в браузере. Новости всё равно появятся в чате.", "Les notifications sont bloquées. Les nouvelles s'affichent quand même dans le chat.", "Benachrichtigungen sind blockiert. Neuigkeiten erscheinen trotzdem im Chat."),

  // ---------- Masuk tamu dengan kode ----------
  "entry.code": e("Kode akses", "Access code", "アクセスコード", "접속 코드", "访问码", "Код доступа", "Code d'accès", "Zugangscode"),
  "entry.codeHint": e(
    "Ada di kartu dari resepsionis. Kamar demo (508, 812, 501, 102) tidak perlu kode.",
    "It's on the card from reception. Demo rooms (508, 812, 501, 102) don't need a code.",
    "フロントからのカードに記載されています。デモ用の部屋（508・812・501・102）はコード不要です。",
    "프런트에서 받은 카드에 있습니다. 데모 객실(508, 812, 501, 102)은 코드가 필요 없습니다.",
    "访问码在前台给您的卡片上。演示房间（508、812、501、102）无需访问码。",
    "Код указан на карте от ресепшена. Для демо-номеров (508, 812, 501, 102) код не нужен.",
    "Il figure sur la carte remise à la réception. Les chambres de démo (508, 812, 501, 102) n'en ont pas besoin.",
    "Er steht auf der Karte von der Rezeption. Demo-Zimmer (508, 812, 501, 102) brauchen keinen Code."
  ),
  "entry.errorCode": e("Kode akses salah. Periksa kartu dari resepsionis.", "Wrong access code. Check the card from reception.", "アクセスコードが違います。フロントからのカードをご確認ください。", "접속 코드가 올바르지 않습니다. 프런트에서 받은 카드를 확인하세요.", "访问码错误，请核对前台给您的卡片。", "Неверный код доступа. Проверьте карту от ресепшена.", "Code d'accès incorrect. Vérifiez la carte remise à la réception.", "Falscher Zugangscode. Bitte die Karte der Rezeption prüfen."),
  "entry.errorNotIn": e("Kamar {room} belum terdaftar. Silakan hubungi resepsionis.", "Room {room} isn't checked in yet. Please contact reception.", "{room}号室はまだ登録されていません。フロントにお問い合わせください。", "{room}호는 아직 등록되지 않았습니다. 프런트에 문의하세요.", "{room} 房尚未登记，请联系前台。", "Номер {room} ещё не зарегистрирован. Обратитесь на ресепшен.", "La chambre {room} n'est pas encore enregistrée. Contactez la réception.", "Zimmer {room} ist noch nicht eingecheckt. Bitte an die Rezeption wenden."),
  "entry.errorNeedCode": e("Kamar ini memerlukan kode akses dari resepsionis.", "This room needs the access code from reception.", "この部屋にはフロントのアクセスコードが必要です。", "이 객실은 프런트의 접속 코드가 필요합니다.", "此房间需要前台提供的访问码。", "Для этого номера нужен код доступа от ресепшена.", "Cette chambre nécessite le code d'accès de la réception.", "Für dieses Zimmer ist der Zugangscode der Rezeption nötig."),
  "entry.errorLimit": e("Terlalu banyak percobaan. Coba lagi dalam beberapa menit.", "Too many attempts. Try again in a few minutes.", "試行回数が多すぎます。数分後に再度お試しください。", "시도 횟수가 너무 많습니다. 몇 분 후 다시 시도하세요.", "尝试次数过多，请几分钟后再试。", "Слишком много попыток. Повторите через несколько минут.", "Trop de tentatives. Réessayez dans quelques minutes.", "Zu viele Versuche. In ein paar Minuten erneut versuchen."),
  "entry.errorOffline": e("Tidak bisa terhubung. Periksa internet lalu coba lagi.", "Can't connect. Check the internet and try again.", "接続できません。インターネットを確認して再度お試しください。", "연결할 수 없습니다. 인터넷을 확인하고 다시 시도하세요.", "无法连接，请检查网络后重试。", "Нет подключения. Проверьте интернет и попробуйте снова.", "Connexion impossible. Vérifiez Internet et réessayez.", "Keine Verbindung. Internet prüfen und erneut versuchen."),
  "entry.ended": e("Masa menginap Anda di kamar ini telah berakhir. Terima kasih sudah menginap!", "Your stay in this room has ended. Thank you for staying with us!", "このお部屋でのご滞在は終了しました。ご宿泊ありがとうございました！", "이 객실에서의 숙박이 종료되었습니다. 이용해 주셔서 감사합니다!", "您在此房间的入住已结束，感谢您的光临！", "Ваше проживание в этом номере завершено. Спасибо, что были с нами!", "Votre séjour dans cette chambre est terminé. Merci de votre visite !", "Ihr Aufenthalt in diesem Zimmer ist beendet. Danke für Ihren Besuch!"),
  "entry.checking": e("Memeriksa…", "Checking…", "確認中…", "확인 중…", "正在验证…", "Проверяем…", "Vérification…", "Wird geprüft…"),
};
