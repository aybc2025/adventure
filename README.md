# Hero Kids Platform

פלטפורמת משחק תפקידים בעברית מבוססת על מערכת **Hero Kids Fantasy RPG** מאת Justin Halliday.
תומכת ב-GM שמנהל הרפתקאות, ושחקנים שיוצרים גיבור ומשחקים אונליין.

## תכונות

- 🎮 **ממשק כפול** — GM (יצירת תוכן) ושחקן (משחק)
- ⚔️ **מנוע קרב מלא** — קוביות Hero Kids, סטטוסים, מפלצות עם triggers
- 🌟 **התקדמות גיבורים** — XP, רמות 1–5, שדרוגים אישיים
- 🗺️ **עורך הרפתקאות** — חדרים, גריד צבעוני, מפלצות מותאמות אישית
- 📱 **PWA** — ניתן להתקנה כאפליקציה, עם עדכון אוטומטי
- 🔒 **Firestore Rules** — אבטחה ברמת השרת, לא רק בלקוח
- 🇮🇱 **עברית RTL** — מלא, כולל גופנים פנטזיים

## מבנה הפרויקט

```
src/
├── config/         # Firebase, קבועים, נתיבים
├── engine/         # מנוע משחק טהור (ללא UI)
│   ├── DiceRoller.js
│   ├── TriggerResolver.js
│   ├── InventoryEngine.js
│   ├── ProgressionEngine.js
│   └── CombatEngine.js
├── contexts/       # AuthContext, SessionContext
├── hooks/          # Firestore hooks
├── components/     # רכיבי UI
│   ├── shared/     # ErrorBoundary, ProtectedRoute, UpdateBanner...
│   ├── ui/         # Button, Card, Modal, HPBar...
│   ├── combat/     # HeroStats, MonsterCard, DiceAnimation...
│   ├── grid/       # GridRenderer (קריאה בלבד), GridEditor
│   └── gm/         # MonsterEditor
├── pages/
│   ├── Landing.jsx
│   ├── player/     # PlayerHome, HeroCreate, RoomView...
│   └── gm/         # GMDashboard, AdventureEditor, RoomEditor...
└── styles/         # globals.css (Tailwind + custom)

public/
├── favicon.svg
├── icons/icon-192.png, icon-512.png
└── seed-data.json  # 3 הרפתקאות + כיתות + פריטים
```

## דרישות מקדימות

- Node.js **22+**
- חשבון Firebase (חינמי)
- חשבון GitHub (לפריסה)

## התקנה ראשונית

### 1. Firebase

#### יצירת פרויקט
1. כנס ל-[Firebase Console](https://console.firebase.google.com/)
2. צור פרויקט חדש (כל שם)
3. בתפריט: **Build → Authentication → Get Started → Google → Enable**
4. בתפריט: **Build → Firestore Database → Create database → Start in production mode**

#### הוסף את האפליקציה
1. בהגדרות הפרויקט (⚙️) → **Your apps → Web app (</> icon)**
2. רשום את האפליקציה, **אל תפעיל** Firebase Hosting
3. שמור את `firebaseConfig` — תזדקק לערכים הבאים:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `appId`

#### הוסף את עצמך כ-GM
ב-Firestore Console, צור באופן ידני מסמך:

- **Collection:** `config`
- **Document ID:** `admins`
- **Field:** `emails` (array of strings)
- **Values:** `["your-email@gmail.com"]` — את האימייל שאיתו תתחבר ל-Google

#### פריסת Firestore Rules
**אופציה א׳ — ידני (פשוט):** העתק את התוכן של `firestore.rules` ולעורך החוקים ב-Console (Firestore → Rules → Publish).

**אופציה ב׳ — CLI (Firebase Tools):**
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,firestore:indexes
```
(תצטרך `firebase init` לפני זה.)

### 2. הרצה מקומית

```bash
cp .env.example .env
# ערוך את .env עם הערכים מ-firebaseConfig
npm install
npm run dev
```

הפתח דפדפן ב-`http://localhost:5173/hero-kids-platform/` (שים לב לתיקייה!).

### 3. ייבוא תוכן ראשוני

לאחר הכניסה כ-GM:
1. תפריט GM → **ייבוא JSON**
2. לחץ **"טען seed-data.json"**
3. לחץ **ייבא**

יתווספו 6 כיתות גיבורים, 8 פריטים, ו-3 הרפתקאות מלאות:
- **מרתף העכברושים** (קושי 1, 5 חדרים)
- **סופת השלג של המכשפה** (קושי 3, 5 חדרים)
- **הגן הקפוא** (קושי 2, 5 חדרים)

## פריסה ל-GitHub Pages

### 1. צור repository
- שם: `hero-kids-platform`
- שייך לך: `aybc2025/hero-kids-platform`

### 2. הוסף Secrets
ב-GitHub: **Settings → Secrets and variables → Actions → New repository secret**

הוסף את ה-secrets הבאים:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_GM_EMAILS` — אימייל ה-GM (מופרד בפסיקים אם יותר מאחד)

### 3. הפעל Pages
**Settings → Pages → Source: GitHub Actions**

### 4. דחוף את הקוד
```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/aybc2025/hero-kids-platform.git
git push -u origin main
```

> **טיפ:** הרץ `npm install` מקומית **לפני** ה-push הראשון כדי ליצור `package-lock.json` ולוודא שהוא נכנס ל-git. זה יזרז עתידיים builds עם `npm ci`.

ה-GitHub Action יבנה ויפרוס אוטומטית. לאחר ~2 דקות האתר יהיה זמין ב:
`https://aybc2025.github.io/hero-kids-platform/`

### 5. הוסף את הדומיין ל-Firebase
**Firebase Console → Authentication → Settings → Authorized domains → Add domain:**
`aybc2025.github.io`

(אחרת ה-Google Sign-In לא יעבוד באתר הפרוס.)

## שימוש

### זרימת GM
1. **כיתות גיבורים** — צור כיתות שמהן שחקנים יוצרים גיבור (HP, dice, special, level-up options)
2. **פריטים** — קטלוג פריטים שיכולים ליפול מהרפתקאות
3. **הרפתקאות** — צור הרפתקה ולאחר השמירה הראשונה הוסף לה **חדרים**
4. **חדרים** — עורך הגריד (ציור קירות, דלתות, מלכודות) + מפלצות עם **triggers**
5. **פרסום** — הפעל את ה-toggle "פורסם" כדי לאפשר לשחקנים לבחור את ההרפתקה

### זרימת שחקן
1. כניסה עם Google
2. **בחר גיבור** — בחר כיתה ותן שם
3. **בחר הרפתקה** מהרשימה
4. **שחק** — תקיפה (בחר מפלצת → לחץ "תקוף"), השתמש בפריטים, יכולת מיוחדת
5. סיים את כל החדרים בהרפתקה כדי לזכות ב-XP
6. **רמה חדשה** — בחר שדרוג מתוך 2 אפשרויות אקראיות

## מערכת ה-Triggers (מתקדם)

מפלצות יכולות להגיב לאירועים:

| Event | מתי |
|---|---|
| `on_hit` | כשתוקפים את המפלצת |
| `on_death` | כשהמפלצת מתה |
| `on_round_start` | בתחילת כל סיבוב |
| `on_player_enter` | כשהגיבור נכנס לחדר |

| Effect | תוצאה |
|---|---|
| `deal_damage` | פגיעה בגיבור |
| `heal` | ריפוי (גיבור/מפלצת) |
| `apply_status` | מורעל / קפוא / מסונוור / בוער |
| `spawn_monster` | זימון מפלצת חדשה לקרב |
| `drop_item` | הפלת פריט |

**דוגמה:** מלך העכברושים ב-seed-data.json מתרפא +1 בכל סיבוב, ומרעיל את הגיבור בכל פגיעה.

## תחזוקה

- **עדכוני קוד:** דחוף ל-`main` → GitHub Action יפרוס אוטומטית. ה-PWA יבקש מהמשתמש לרענן.
- **גיבוי Firestore:** מומלץ להפעיל גיבוי יומי ב-Firebase Console (Firestore → Backups).
- **GM נוסף:** ערוך את `/config/admins` ב-Firestore והוסף לערך `emails`. **גם** הוסף את האימייל ל-secret `VITE_GM_EMAILS` ב-GitHub.
- **שמירת היסטוריה:** ניתן לייצא היסטוריה של כל השחקנים ל-CSV מתפריט GM.

## פתרון בעיות נפוצות

**"אין הרשאה" אחרי כניסה כ-GM:**
- ודא שהאימייל ב-`/config/admins` (Firestore) זהה לאימייל ב-`VITE_GM_EMAILS` (env) — שניהם חייבים להיות זהים, באותיות קטנות.

**Google Sign-In לא עובד באתר הפרוס:**
- הוסף את `aybc2025.github.io` ב-Firebase Auth → Authorized domains.

**אחרי `npm install` יש שגיאות:**
- ודא Node.js גרסה 22+. הרץ `node -v`.

**GitHub Action נכשל:**
- ודא שכל ה-Secrets הוגדרו. בדוק את ה-Actions log לפרטים.

## רישוי

הקוד שלך — תחת המגבלה של רישוי המשחק המקורי **Hero Kids Fantasy RPG** של Justin Halliday. הפלטפורמה היא כלי המאפשר משחק בעברית; הכללים והעולם של Hero Kids הם של היוצר המקורי.

---

נבנה עם ❤️ למשפחה שאוהבת משחקי תפקידים.
