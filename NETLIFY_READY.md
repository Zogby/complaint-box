# جاهز للنشر على Netlify

## ما الذي تم ضبطه

- بناء الواجهة إلى `dist/public`.
- بناء Netlify Function إلى `dist/index.js`.
- توجيه `/api/*` إلى Netlify Function.
- تشغيل فحص متغيرات البيئة قبل البناء.
- تشغيل هجرات Drizzle تلقائياً أثناء بناء Netlify عبر `pnpm netlify:build`.
- تسجيل دخول الإدارة أصبح من السيرفر عبر `ADMIN_PASSWORD` و `JWT_SECRET`.
- حماية عمليات الإدارة بتوكن Bearer موقّع.
- إزالة الأسرار المكشوفة والملفات المحلية الحساسة من المشروع.

## متغيرات Netlify المطلوبة

أضفها من:
Site settings → Environment variables

```env
DATABASE_URL=mysql://user:password@host:3306/database
JWT_SECRET=ضع_سراً_عشوائياً_قوياً_أكثر_من_32_حرف
ADMIN_PASSWORD=ضع_كلمة_مرور_قوية_للوحة_الإدارة
VITE_APP_TITLE=صندوق الشكاوى الإلكتروني
```

اختياري:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

يمكن أيضاً ضبط Telegram من `/admin` بعد النشر.

## إعدادات Netlify المضبوطة داخل `netlify.toml`

```toml
[build]
command = "pnpm netlify:build"
functions = "dist"
publish = "dist/public"
```

## التشغيل المحلي

```bash
pnpm install
pnpm setup:local
# عدّل DATABASE_URL داخل .env
pnpm db:migrate
pnpm dev
```

## ملاحظة مهمة

الهجرات لن تعمل بدون قاعدة MySQL/TiDB حقيقية. إذا كان `DATABASE_URL` غير صحيح، سيفشل البناء عمداً بدل أن يعطيك موقعاً مكسوراً بصمت.

## تحديث الهوية البصرية

النسخة الحالية تتضمن الترويسة الرسمية والشعار المستخرج من النموذج المرفق، مع ألوان الهوية السورية المطبقة على الصفحة الرئيسية ولوحة الإدارة وصفحة QR.
