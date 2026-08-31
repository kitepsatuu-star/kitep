# СоцТоо — Telegram/Instagram стилдеги сайт

Бул демо төмөнкү функцияларды камтыйт:
- 5 туруктуу, бирок төмөн жакка жабышып калбаган floating навигация: Башкы / Видео / Сүйлөшүү / Издөө / Профиль
- Башкы бетте лента
- Cloudinary аркылуу сүрөт жана видео upload
- Firebase Authentication аркылуу Google login
- Биринчи киргенде аты, жашы, телефон номери, жынысы
- Firestore'до аккаунт профилдери
- Firestore real-time 1-to-1 чат
- Адамдар боюнча издөө
- Китептер жана видеолор боюнча издөө
- Сунушталгандар тизмеси

## 1. Firebase
Firebase Console'до:
1. New project түзүңүз.
2. Authentication → Sign-in method → Google → Enable.
3. Project settings → Web app түзүңүз.
4. Firebase config'ти `app.js` ичиндеги `firebaseConfig` ордуна коюңуз.
5. Firestore Database түзүңүз.
6. `firestore.rules` мазмунун Firestore Rules бөлүгүнө коюңуз.

## 2. Cloudinary
Cloudinary'де (сиздин биринчи берген Cloudinary маалыматтарыңыз керек):
1. Account түзүңүз.
2. Settings → Upload presets → Add upload preset.
3. Signing mode = Unsigned.
4. `cloud_name` жана upload preset'тин атын `app.js` ичиндеги эки туруктууга коюңуз.

## 3. Иштетүү
HTML файлды түз эле file:// менен ачпастан, локалдык сервер колдонгон оң.
Python орнотулган болсо:
`python -m http.server 5500`
андан кийин браузерден:
`http://localhost:5500`

## Маанилүү
Бул версия — күчтүү frontend/MVP. Чыныгы production үчүн Cloudinary upload көлөмү/форматы, Firestore индекстер, moderation, notification, privacy policy, rate limit жана сервердик валидация кошулушу керек.
