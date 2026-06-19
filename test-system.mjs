import axios from 'axios';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

console.log('🧪 اختبار نظام صندوق الشكاوى الإلكتروني\n');

console.log('1️⃣  اختبار الحصول على عدد الشكاوى...');
try {
  const response = await axios.get(`${BASE_URL}/api/trpc/complaints.getTotalComplaints`);
  console.log('✅ نجح - عدد الشكاوى:', response.data.result?.data?.json ?? response.data.result?.data);
} catch (error) {
  console.log('❌ فشل:', error.response?.data || error.message);
}

console.log('\n2️⃣  اختبار إرسال شكوى...');
try {
  const response = await axios.post(`${BASE_URL}/api/trpc/complaints.submitComplaint`, {
    json: {
      fullName: 'اختبار النظام',
      phoneNumber: '+963912345678',
      complaintSubject: 'هذه رسالة اختبار من النظام',
    },
  });

  const result = response.data.result?.data?.json || response.data.result?.data;
  if (result?.success) {
    console.log('✅ نجح - رقم الشكوى:', result.complaintNumber);
  } else {
    console.log('❌ فشل:', result?.message || 'خطأ غير معروف');
  }
} catch (error) {
  console.log('❌ فشل:', error.response?.data || error.message);
}

if (BOT_TOKEN && CHAT_ID) {
  console.log('\n3️⃣  اختبار الاتصال بتيليجرام...');
  try {
    const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: String(CHAT_ID),
      text: '✅ اختبار الاتصال - النظام يعمل بشكل صحيح',
    });

    if (response.data.ok) {
      console.log('✅ نجح - تم إرسال الرسالة بنجاح');
    } else {
      console.log('❌ فشل:', response.data.description);
    }
  } catch (error) {
    console.log('❌ فشل:', error.response?.data || error.message);
  }
} else {
  console.log('\n3️⃣  تخطّي Telegram: TELEGRAM_BOT_TOKEN و TELEGRAM_CHAT_ID غير مضبوطين في البيئة.');
}

console.log('\n✨ انتهى الاختبار');
