const required = [
  ["DATABASE_URL", value => /^mysql:\/\//.test(value || ""), "يجب أن يبدأ DATABASE_URL بـ mysql://"],
  ["JWT_SECRET", value => (value || "").trim().length >= 32, "يجب أن يكون JWT_SECRET بطول 32 حرفاً على الأقل"],
  ["ADMIN_PASSWORD", value => (value || "").trim().length >= 8, "يجب أن تكون ADMIN_PASSWORD بطول 8 أحرف على الأقل"],
];

let failed = false;
for (const [name, valid, message] of required) {
  const value = process.env[name];
  if (!valid(value)) {
    console.error(`[ENV] ${name}: ${message}`);
    failed = true;
  }
}

if (failed) {
  console.error("\nأوقفنا العملية لأن إعدادات البيئة غير مكتملة. أضف المتغيرات في Netlify ثم أعد النشر.");
  process.exit(1);
}

console.log("[ENV] OK");
