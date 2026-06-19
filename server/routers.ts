import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { addLike, createComplaint, getSetting, getTotalComplaints, getTotalLikes, hasUserLiked, resetComplaintsStatistics, setSetting } from "./db";
import axios from "axios";
import { createAdminToken, isAdminPasswordConfigured, verifyAdminPassword } from "./adminAuth";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";

// Rate Limiting - تخزين آخر محاولة لكل IP
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60000; // 60 ثانية

const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const lastAttempt = rateLimitMap.get(ip);
  
  if (!lastAttempt || now - lastAttempt >= RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, now);
    return true;
  }
  
  return false;
};

const getTelegramConfig = async () => {
  const botToken = (await getSetting('telegram_bot_token')) || process.env.TELEGRAM_BOT_TOKEN || '';
  const chatId = (await getSetting('telegram_chat_id')) || process.env.TELEGRAM_CHAT_ID || '';
  return { botToken, chatId };
};

export const appRouter = router({
  auth: router({
    loginAdmin: publicProcedure
      .input(z.object({ password: z.string().min(1, "كلمة المرور مطلوبة") }))
      .mutation(async ({ input }) => {
        if (!isAdminPasswordConfigured()) {
          return {
            success: false,
            message: "ADMIN_PASSWORD غير مضبوط أو أقصر من 8 أحرف في متغيرات البيئة.",
          };
        }

        const valid = await verifyAdminPassword(input.password);
        if (!valid) {
          return { success: false, message: "كلمة المرور غير صحيحة" };
        }

        const token = await createAdminToken();
        return { success: true, token, message: "تم فتح لوحة الإدارة" };
      }),

    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  complaints: router({
    submitComplaint: publicProcedure
      .input(z.object({
        fullName: z.string().min(1, "الاسم مطلوب"),
        phoneNumber: z.string().min(1, "رقم الهاتف مطلوب"),
        complaintSubject: z.string().min(1, "موضوع الشكوى مطلوب"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // تطبيق Rate Limiting
          const clientIp = (ctx.req.headers['x-forwarded-for'] as string)?.split(',')[0] || ctx.req.socket?.remoteAddress || 'unknown';
          
          if (!checkRateLimit(clientIp)) {
            return { success: false, message: "يرجى الانتظار 60 ثانية قبل إرسال شكوى أخرى" };
          }

          const complaintNumber = await createComplaint(input);
          
          const { botToken, chatId } = await getTelegramConfig();

          if (botToken && chatId) {
            const message = `📬 شكوى جديدة\n\n👤 الاسم: ${input.fullName}\n📱 الهاتف: ${input.phoneNumber}\n📝 الموضوع:\n${input.complaintSubject}\n\n🔢 رقم الشكوى: ${complaintNumber}\n⏰ الوقت: ${new Date().toLocaleString('ar-SY')}`;
            
            try {
              await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                chat_id: String(chatId),
                text: message,
              });
            } catch (error) {
              console.error("Failed to send Telegram notification:", error);
            }
          }

          return {
            success: true,
            complaintNumber: complaintNumber,
          };
        } catch (error) {
          console.error("Error submitting complaint:", error);
          return { success: false, message: "حدث خطأ في إرسال الشكوى" };
        }
      }),

    getTotalComplaints: publicProcedure.query(async () => {
      try {
        const total = await getTotalComplaints();
        return total;
      } catch (error) {
        console.error("Error getting total complaints:", error);
        return 0;
      }
    }),

    getTelegramSettings: adminProcedure.query(async () => {
      try {
        const { botToken, chatId } = await getTelegramConfig();
        return { botToken: botToken ? '***' : '', chatId: chatId || '' };
      } catch (error) {
        console.error("Error getting Telegram settings:", error);
        return { botToken: '', chatId: '' };
      }
    }),

    checkTelegramConnection: adminProcedure.query(async () => {
      try {
        const { botToken, chatId } = await getTelegramConfig();

        if (!botToken || !chatId) {
          return { connected: false, message: 'لم يتم تكوين بيانات تيليجرام' };
        }

        const response = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          chat_id: String(chatId),
          text: '✅ اختبار اتصال ناجح',
        });

        if (response.data && response.data.ok) {
          return { connected: true, message: 'الاتصال ناجح' };
        } else {
          const description = response.data?.description || 'خطأ غير معروف';
          return { connected: false, message: `خطأ من تيليجرام: ${description}` };
        }
      } catch (error: any) {
        const errorMsg = error.response?.data?.description || error.message || 'فشل الاتصال بتيليجرام';
        console.error("Telegram connection error:", errorMsg);
        return { connected: false, message: `خطأ: ${errorMsg}` };
      }
    }),

    updateTelegramSettings: adminProcedure
      .input(z.object({
        botToken: z.string().min(1, "رمز البوت مطلوب"),
        chatId: z.string().min(1, "معرف المجموعة مطلوب"),
      }))
      .mutation(async ({ input }) => {
        try {
          if (input.botToken !== '***') {
            await setSetting('telegram_bot_token', input.botToken);
          }
          await setSetting('telegram_chat_id', input.chatId);
          return { success: true };
        } catch (error) {
          console.error("Error updating Telegram settings:", error);
          return { success: false, message: "فشل حفظ الإعدادات" };
        }
      }),

    getComplaintsStats: adminProcedure.query(async () => {
      try {
        const total = await getTotalComplaints();
        return { total };
      } catch (error) {
        console.error("Error getting complaints stats:", error);
        return { total: 0 };
      }
    }),

    resetComplaintsCount: adminProcedure.mutation(async () => {
      try {
        await resetComplaintsStatistics();
        return { success: true, message: 'تم تصفير عدد الشكاوى بنجاح' };
      } catch (error) {
        console.error("Error resetting complaints count:", error);
        return { success: false, message: 'فشل تصفير عدد الشكاوى' };
      }
    }),

    addLike: publicProcedure
      .input(z.object({
        userType: z.enum(['citizen', 'employee']),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const clientIp = (ctx.req.headers['x-forwarded-for'] as string)?.split(',')[0] || ctx.req.socket?.remoteAddress || 'unknown';
          const alreadyLiked = await hasUserLiked(clientIp);
          
          if (alreadyLiked) {
            return { success: false, message: 'لقد أعجبت بالفكرة من قبل' };
          }
          
          await addLike(input.userType, clientIp);
          return { success: true, message: 'شكراً لإعجابك بالفكرة!' };
        } catch (error) {
          console.error('Error adding like:', error);
          return { success: false, message: 'حدث خطأ في إضافة الإعجاب' };
        }
      }),

    getLikesStats: publicProcedure.query(async () => {
      try {
        const stats = await getTotalLikes();
        return stats;
      } catch (error) {
        console.error('Error getting likes stats:', error);
        return { total: 0, citizens: 0, employees: 0 };
      }
    }),

    sendTestMessage: adminProcedure.mutation(async () => {
      try {
        const { botToken, chatId } = await getTelegramConfig();

        if (!botToken || !chatId) {
          return { success: false, message: 'لم يتم تكوين بيانات تيليجرام' };
        }

        const names = ['أحمد محمود', 'فاطمة علي', 'محمد سالم', 'سارة خالد', 'علي حسن', 'ليلى عبدالله', 'خالد إبراهيم', 'نور محمد'];
        const phones = ['+963912345678', '+963922334455', '+963933445566', '+963944556677', '+963955667788', '+963966778899', '+963977889900', '+963988990011'];
        const subjects = ['تحسين الخدمات', 'مشكلة في النظام', 'اقتراح تطويري', 'شكوى إدارية', 'ملاحظة مهمة', 'تقرير مشكلة', 'طلب تحسين', 'استفسار عام'];

        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomPhone = phones[Math.floor(Math.random() * phones.length)];
        const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];

        const message = `🧪 رسالة اختبار\n\n👤 الاسم: ${randomName}\n📱 الهاتف: ${randomPhone}\n📝 الموضوع:\n${randomSubject}\n\n🔢 رقم الشكوى: TEST-${Date.now()}\n⏰ الوقت: ${new Date().toLocaleString('ar-SY')}\n\n⚠️ هذه رسالة اختبار من النظام`;

        const response = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          chat_id: String(chatId),
          text: message,
        });

        if (response.data && response.data.ok) {
          return { success: true, message: 'تم إرسال رسالة الاختبار بنجاح' };
        } else {
          const description = response.data?.description || 'خطأ غير معروف';
          return { success: false, message: `خطأ من تيليجرام: ${description}` };
        }
      } catch (error: any) {
        const errorMsg = error.response?.data?.description || error.message || 'فشل إرسال رسالة الاختبار';
        console.error("Error sending test message:", errorMsg);
        return { success: false, message: `خطأ: ${errorMsg}` };
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
