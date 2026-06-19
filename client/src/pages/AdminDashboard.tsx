import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2, Eye, EyeOff, BarChart3, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import OfficialHeader from '@/components/OfficialHeader';
import OfficialFrame from '@/components/OfficialFrame';

const AdminDashboard = () => {
  const [adminPassword, setAdminPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(() => Boolean(window.localStorage.getItem('complaint_box_admin_token')));
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loginAdminMutation = trpc.auth.loginAdmin.useMutation();
  const getTelegramSettingsQuery = trpc.complaints.getTelegramSettings.useQuery(undefined, { enabled: isUnlocked });
  const updateSettingsMutation = trpc.complaints.updateTelegramSettings.useMutation();
  const checkConnectionMutation = trpc.complaints.checkTelegramConnection.useQuery(undefined, { enabled: false });
  const getStatsQuery = trpc.complaints.getComplaintsStats.useQuery(undefined, { enabled: isUnlocked });
  const resetCountMutation = trpc.complaints.resetComplaintsCount.useMutation();
  const sendTestMessage = trpc.complaints.sendTestMessage.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: () => {
      toast.error('فشل إرسال رسالة الاختبار');
    },
  });

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await loginAdminMutation.mutateAsync({ password: adminPassword });
      const token = 'token' in result ? result.token : undefined;
      if (!result.success || !token) {
        toast.error(result.message || 'كلمة المرور غير صحيحة');
        setAdminPassword('');
        return;
      }

      window.localStorage.setItem('complaint_box_admin_token', token);
      setIsUnlocked(true);
      setAdminPassword('');
      await Promise.all([getTelegramSettingsQuery.refetch(), getStatsQuery.refetch()]);
      toast.success(result.message || 'تم فتح لوحة الإدارة');
    } catch (error) {
      toast.error('فشل تسجيل الدخول إلى لوحة الإدارة');
      setAdminPassword('');
    }
  };

  const loadSettings = () => {
    if (getTelegramSettingsQuery.data) {
      setBotToken(getTelegramSettingsQuery.data.botToken || '');
      setChatId(getTelegramSettingsQuery.data.chatId || '');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!botToken.trim()) {
      toast.error('رمز البوت مطلوب');
      return;
    }

    if (!chatId.trim()) {
      toast.error('معرف المجموعة مطلوب');
      return;
    }

    setIsSaving(true);
    try {
      await updateSettingsMutation.mutateAsync({
        botToken: botToken.trim(),
        chatId: chatId.trim(),
      });
      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      toast.error('فشل حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      const result = await checkConnectionMutation.refetch();
      if (result.data?.connected) {
        toast.success('الاتصال ناجح');
      } else {
        toast.error(result.data?.message || 'فشل اختبار الاتصال');
      }
    } catch (error) {
      toast.error('فشل اختبار الاتصال');
    }
  };

  const handleResetCount = async () => {
    if (window.confirm('هل أنت متأكد من رغبتك في تصفير عدد الشكاوى؟')) {
      try {
        await resetCountMutation.mutateAsync();
        toast.success('تم تصفير عدد الشكاوى بنجاح');
        getStatsQuery.refetch();
      } catch (error) {
        toast.error('فشل تصفير عدد الشكاوى');
      }
    }
  };

  if (!isUnlocked) {
    return (
      <div className="official-page flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md"><OfficialHeader compact className="mb-6" /><Card className="p-8 official-card border-0">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#161616] mb-2">لوحة الإدارة</h1>
            <p className="text-[#3d3a3b]">أدخل كلمة المرور للوصول</p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[#161616] mb-2">
                كلمة المرور
              </label>
              <Input
                id="password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                className="w-full px-4 py-3 rounded-lg border-2 border-[#054239]/20 hover:border-[#428177] focus:border-[#428177]"
              />
            </div>

            <Button
              type="submit"
              disabled={loginAdminMutation.isPending}
              className="w-full official-button text-white font-semibold py-3 rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              {loginAdminMutation.isPending ? 'جاري الدخول...' : 'دخول'}
            </Button>
          </form>
        </Card></div>
      </div>
    );
  }

  return (
    <div className="official-page py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="official-shell max-w-5xl">
        <OfficialHeader />
        <div className="text-center my-10">
          <span className="official-chip mb-4">وصول إداري محمي</span>
          <h1 className="text-4xl font-black text-[#161616] mb-2">لوحة إدارة الشكاوى</h1>
          <p className="text-[#3d3a3b] text-lg">إدارة إعدادات تيليجرام والإشعارات والإحصائيات</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 official-card border-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#161616]">الإحصائيات</h3>
              <div className="w-12 h-12 bg-gradient-to-br from-[#edebe0] to-[#b9a779]/40 rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-[#6b1f2a]" />
              </div>
            </div>
            <div className="mb-4">
              <p className="text-[#3d3a3b] text-sm mb-2">إجمالي الشكاوى</p>
              <p className="text-3xl font-bold text-[#6b1f2a]">{getStatsQuery.data?.total || 0}</p>
            </div>
            <Button
              onClick={handleResetCount}
              disabled={resetCountMutation.isPending}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {resetCountMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري التصفير...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  تصفير العدد
                </>
              )}
            </Button>
          </Card>

          <Card className="p-6 official-card border-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#161616]">حالة الاتصال</h3>
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-xl">🔗</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleTestConnection}
                disabled={checkConnectionMutation.isLoading}
                className="flex-1 bg-[#428177] hover:bg-[#054239] text-white font-semibold py-2 rounded-lg transition-all"
              >
                {checkConnectionMutation.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    جاري الاختبار...
                  </>
                ) : (
                  'اختبار الاتصال'
                )}
              </Button>
              <Button
                onClick={() => sendTestMessage.mutateAsync()}
                disabled={sendTestMessage.isPending}
                className="flex-1 official-button text-white font-semibold py-2 rounded-lg transition-all"
              >
                {sendTestMessage.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  '🧪 رسالة اختبار'
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-6 official-card border-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#161616]">الإعدادات</h3>
              <div className="w-12 h-12 bg-gradient-to-br from-[#edebe0] to-[#b9a779]/40 rounded-full flex items-center justify-center">
                <span className="text-xl">⚙️</span>
              </div>
            </div>
            <p className="text-[#3d3a3b] text-sm">قم بتحديث بيانات تيليجرام</p>
          </Card>
        </div>

        <OfficialFrame><Card className="p-8 border-0 bg-white shadow-none relative z-[1]">
          <h2 className="text-2xl font-bold text-[#161616] mb-6">إعدادات تيليجرام</h2>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div>
              <label htmlFor="botToken" className="block text-sm font-semibold text-[#161616] mb-2">
                رمز البوت <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  id="botToken"
                  type={showToken ? 'text' : 'password'}
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="أدخل رمز البوت من BotFather"
                  className="w-full px-4 py-3 rounded-lg border-2 border-[#054239]/20 hover:border-[#428177] focus:border-[#428177] pr-10"
                  disabled={isSaving}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#3d3a3b]/75 hover:text-gray-700"
                >
                  {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-[#3d3a3b]/75 text-xs mt-1">احفظ رمز البوت في مكان آمن</p>
            </div>

            <div>
              <label htmlFor="chatId" className="block text-sm font-semibold text-[#161616] mb-2">
                معرف المجموعة <span className="text-red-500">*</span>
              </label>
              <Input
                id="chatId"
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="مثال: -1001234567890"
                className="w-full px-4 py-3 rounded-lg border-2 border-[#054239]/20 hover:border-[#428177] focus:border-[#428177]"
                disabled={isSaving}
              />
              <p className="text-[#3d3a3b]/75 text-xs mt-1">معرف المجموعة أو القناة التي ستستقبل الإشعارات</p>
            </div>

            <div className="bg-[#edebe0] border border-[#b9a779]/60 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-[#054239] mt-0.5 ml-3 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-[#054239] mb-1">كيفية الحصول على البيانات</h4>
                  <ol className="text-sm text-[#054239] space-y-1 list-decimal list-inside">
                    <li>تواصل مع @BotFather على تيليجرام لإنشاء بوت جديد</li>
                    <li>انسخ رمز البوت (Token) وأدخله هنا</li>
                    <li>أضف البوت إلى المجموعة أو القناة المطلوبة</li>
                    <li>احصل على معرف المجموعة باستخدام @userinfobot</li>
                  </ol>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSaving}
              className="w-full official-button text-white font-semibold py-3 rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ الإعدادات'
              )}
            </Button>
          </form>
        </Card></OfficialFrame>

        <div className="mt-8 text-center">
          <Button
            onClick={() => {
              window.localStorage.removeItem('complaint_box_admin_token');
              setIsUnlocked(false);
              setAdminPassword('');
            }}
            variant="outline"
            className="text-[#3d3a3b] border-[#054239]/30 hover:bg-[#edebe0]"
          >
            تسجيل الخروج
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
