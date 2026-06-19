import { existsSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

if (existsSync(".env")) {
  console.log(".env موجود مسبقاً، لم يتم تعديله.");
  process.exit(0);
}

const jwtSecret = randomBytes(48).toString("hex");
const adminPassword = `Admin-${randomBytes(9).toString("base64url")}`;

writeFileSync(".env", `DATABASE_URL=mysql://user:password@host:3306/database\nJWT_SECRET=${jwtSecret}\nADMIN_PASSWORD=${adminPassword}\nVITE_APP_TITLE=صندوق الشكاوى الإلكتروني\nTELEGRAM_BOT_TOKEN=\nTELEGRAM_CHAT_ID=\n`);

console.log("تم إنشاء .env محلي بقيم آمنة عشوائية لـ JWT_SECRET و ADMIN_PASSWORD.");
console.log(`ADMIN_PASSWORD=${adminPassword}`);
console.log("عدّل DATABASE_URL قبل تشغيل الهجرات.");
