# صندوق الشكاوى الإلكتروني

مشروع React/Vite + Express/tRPC + Drizzle MySQL/TiDB، مضبوط للنشر على Netlify.

## النشر السريع على Netlify

1. ارفع المشروع إلى GitHub.
2. اربط المستودع في Netlify.
3. تأكد أن Netlify يستخدم الإعدادات الموجودة في `netlify.toml`:

```toml
command = "pnpm netlify:build"
functions = "dist"
publish = "dist/public"
```

4. أضف متغيرات البيئة:

```env
DATABASE_URL=mysql://user:password@host:3306/database
JWT_SECRET=ضع_سراً_قوياً_أكثر_من_32_حرف
ADMIN_PASSWORD=ضع_كلمة_مرور_قوية
VITE_APP_TITLE=صندوق الشكاوى الإلكتروني
```

اختياري:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

5. انشر. أمر البناء `pnpm netlify:build` سيفحص البيئة، يشغل الهجرات، ثم يبني المشروع.

## روابط التطبيق

- `/` الصفحة الرئيسية
- `/admin` لوحة الإدارة
- `/qr` QR Code

## التشغيل المحلي

```bash
pnpm install
pnpm setup:local
# افتح .env وعدّل DATABASE_URL إلى قاعدة حقيقية
pnpm db:migrate
pnpm dev
```

## الأمان

- لا يوجد `admin123` داخل الكود.
- كلمة مرور الإدارة تأتي من `ADMIN_PASSWORD` فقط.
- جلسة الإدارة موقعة عبر `JWT_SECRET`.
- ملفات `.env` و `.project-config.json` مستثناة من Git.
- إعدادات Telegram محفوظة في قاعدة البيانات أو متغيرات البيئة حسب الاستخدام.

## فشل البناء المتوقع

إذا فشل البناء برسالة `[ENV]`، فهذا يعني أن متغيرات Netlify ناقصة أو ضعيفة. هذا مقصود حتى لا يتم نشر نظام ناقص.

## الهوية البصرية المضافة

تم تطبيق هوية بصرية مستوحاة من اللوحة التي زودتني بها:

- Forest: `#428177`, `#054239`, `#002623`
- Golden Wheat: `#edebe0`, `#b9a779`, `#988561`
- Deep Umber: `#6b1f2a`, `#4a151e`, `#260f14`
- Charcoal: `#ffffff`, `#3d3a3b`, `#161616`

تم استخراج الشعار من ملف HTML الأصلي بصيغة Base64 وتحويله إلى ملف مستقل:

```text
client/public/assets/syria-emblem.png
```

والترويسة المعتمدة داخل الصفحات هي:

```text
الجمهورية العربية السورية
وزارة الداخلية
قيادة الأمن الداخلي بريف دمشق
فرع القضايا والملاحقات المسلكية
صندوق الشكاوى الإلكتروني
```
