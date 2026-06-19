import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2, QrCode, Clock } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import LikesSection from './LikesSection';
import OfficialHeader from '@/components/OfficialHeader';
import OfficialFrame from '@/components/OfficialFrame';

const ComplaintSubmission = () => {
  const [, navigate] = useLocation();
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [complaintSubject, setComplaintSubject] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [complaintNumber, setComplaintNumber] = useState('');
  const [cooldownTime, setCooldownTime] = useState(0);

  const { data: totalComplaints = 0 } = trpc.complaints.getTotalComplaints.useQuery();
  const submitComplaintMutation = trpc.complaints.submitComplaint.useMutation();

  // تحديث المؤقت
  useEffect(() => {
    if (cooldownTime <= 0) return;

    const interval = setInterval(() => {
      setCooldownTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownTime]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'الاسم الكامل مطلوب';
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'رقم الهاتف مطلوب';
    } else if (!/^[0-9+\-\s()]{7,}$/.test(phoneNumber)) {
      newErrors.phoneNumber = 'رقم الهاتف غير صحيح';
    }

    if (!complaintSubject.trim()) {
      newErrors.complaintSubject = 'موضوع الشكوى مطلوب';
    } else if (complaintSubject.trim().length < 10) {
      newErrors.complaintSubject = 'يجب أن يكون موضوع الشكوى على الأقل 10 أحرف';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cooldownTime > 0) {
      toast.error(`يرجى الانتظار ${cooldownTime} ثانية قبل إرسال شكوى أخرى`);
      return;
    }

    if (!validateForm()) {
      toast.error('يرجى تصحيح الأخطاء في النموذج');
      return;
    }

    try {
      const result = await submitComplaintMutation.mutateAsync({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        complaintSubject: complaintSubject.trim(),
      });

      setComplaintNumber(result.complaintNumber || '');
      setSubmitted(true);
      setFullName('');
      setPhoneNumber('');
      setComplaintSubject('');
      setErrors({});

      // تفعيل Rate Limiting - منع الإرسال لمدة 60 ثانية
      setCooldownTime(60);

      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (error) {
      toast.error('حدث خطأ أثناء إرسال الشكوى. يرجى المحاولة لاحقاً');
    }
  };

  const getRandomSuccessMessage = () => {
    const messages = [
      'شكراً لك على تقديم شكواك. سيتم معالجتها بأولوية عالية.',
      'نقدر اهتمامك! تم استقبال شكواك بنجاح.',
      'شكراً على ملاحظاتك القيمة. فريقنا سيراجعها قريباً.',
      'تم تسجيل شكواك بنجاح. شكراً لتعاونك معنا.',
      'نشكرك على مساهمتك في تحسين الخدمات.',
      'تم استلام شكواك. سنعمل على حلها في أقرب وقت.',
      'شكراً على ثقتك بنا. سيتم الرد عليك قريباً.',
      'نقدر تعليقاتك! تم حفظ شكواك بنجاح.',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  if (submitted) {
    return (
      <div className="min-h-screen official-page flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center shadow-xl border-0">
          <div className="flex justify-center mb-6">
            <CheckCircle2 className="w-16 h-16 text-[#428177]" />
          </div>
          <h2 className="text-2xl font-bold text-[#161616] mb-2">تم الإرسال بنجاح</h2>
          <p className="text-[#3d3a3b] mb-4">{getRandomSuccessMessage()}</p>
          <div className="bg-[#edebe0] border border-[#b9a779]/60 rounded-lg p-4 mb-6">
            <p className="text-sm text-[#3d3a3b] mb-1">رقم الشكوى:</p>
            <p className="text-lg font-mono font-bold text-[#054239]">{complaintNumber}</p>
          </div>
          <p className="text-sm text-[#3d3a3b]/75">سيتم إعادة تحميل النموذج تلقائياً...</p>
        </Card>
      </div>
    );
  }

  const inputErrorClass = (fieldName: string) => {
    return errors[fieldName]
      ? 'border-red-500 bg-red-50'
      : 'border-[#054239]/20 hover:border-[#428177] focus:border-[#428177] official-input';
  };

  return (
    <div className="official-page py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="official-shell max-w-3xl">
        <OfficialHeader />

        <div className="text-center my-10">
          <span className="official-chip mb-4">منصة استقبال ومتابعة الشكاوى</span>
          <h1 className="text-4xl font-black text-[#161616] mb-2">تقديم الشكوى</h1>
          <p className="text-[#3d3a3b] text-lg">نرحب بملاحظاتك واقتراحاتك، وسيتم التعامل معها بسرية وجدية.</p>
        </div>

        <div className="mb-8 official-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#3d3a3b] text-sm font-medium">إجمالي الشكاوى المقدمة</p>
              <p className="text-4xl font-bold text-[#054239] mt-2">{totalComplaints}</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-[#edebe0] to-[#b9a779]/40 rounded-full flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <OfficialFrame><Card className="p-8 border-0 bg-white shadow-none relative z-[1]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-[#161616] mb-2">
                الاسم الكامل <span className="text-red-500">*</span>
              </label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) {
                    setErrors({ ...errors, fullName: '' });
                  }
                }}
                placeholder="أدخل اسمك الكامل"
                className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${inputErrorClass('fullName')}`}
                disabled={submitComplaintMutation.isPending || cooldownTime > 0}
              />
              {errors.fullName && (
                <div className="flex items-center mt-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.fullName}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-semibold text-[#161616] mb-2">
                رقم الهاتف <span className="text-red-500">*</span>
              </label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (errors.phoneNumber) {
                    setErrors({ ...errors, phoneNumber: '' });
                  }
                }}
                placeholder="مثال: +963912345678"
                className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${inputErrorClass('phoneNumber')}`}
                disabled={submitComplaintMutation.isPending || cooldownTime > 0}
              />
              {errors.phoneNumber && (
                <div className="flex items-center mt-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.phoneNumber}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="complaintSubject" className="block text-sm font-semibold text-[#161616] mb-2">
                موضوع الشكوى <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="complaintSubject"
                value={complaintSubject}
                onChange={(e) => {
                  setComplaintSubject(e.target.value);
                  if (errors.complaintSubject) {
                    setErrors({ ...errors, complaintSubject: '' });
                  }
                }}
                placeholder="اشرح موضوع شكواك بالتفصيل..."
                rows={5}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-colors resize-none ${inputErrorClass('complaintSubject')}`}
                disabled={submitComplaintMutation.isPending || cooldownTime > 0}
              />
              {errors.complaintSubject && (
                <div className="flex items-center mt-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.complaintSubject}
                </div>
              )}
              <p className="text-[#3d3a3b]/75 text-xs mt-1">{complaintSubject.length} / 1000</p>
            </div>

            {cooldownTime > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <div>
                  <p className="text-yellow-900 font-semibold">يرجى الانتظار</p>
                  <p className="text-yellow-800 text-sm">يمكنك إرسال شكوى أخرى بعد {cooldownTime} ثانية</p>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitComplaintMutation.isPending || cooldownTime > 0}
              className="w-full official-button text-white font-semibold py-3 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitComplaintMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري الإرسال...
                </>
              ) : cooldownTime > 0 ? (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  انتظر {cooldownTime}ث
                </>
              ) : (
                'إرسال الشكوى'
              )}
            </Button>
          </form>
        </Card></OfficialFrame>

        <div className="mt-8 text-center text-[#3d3a3b] text-sm">
          <p>جميع المعلومات المقدمة محمية وسرية</p>
        </div>

        <div className="mt-6 flex gap-4 justify-center">
          <Button
            onClick={() => navigate('/qr')}
            variant="outline"
            className="flex items-center gap-2 border-[#b9a779] text-[#054239] hover:bg-[#edebe0]"
          >
            <QrCode className="w-4 h-4" />
            عرض رمز QR
          </Button>
          <Button
            onClick={() => navigate('/admin')}
            variant="outline"
            className="flex items-center gap-2 border-[#054239]/30 text-[#3d3a3b] hover:bg-[#edebe0]"
          >
            لوحة الإدارة
          </Button>
        </div>
      </div>

      {/* قسم الإعجابات والنص التنويهي */}
      <LikesSection />
    </div>
  );
};

export default ComplaintSubmission;
