import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function LikesSection() {
  const [likesStats, setLikesStats] = useState({ total: 0, citizens: 0, employees: 0 });
  const [hasLiked, setHasLiked] = useState(false);

  const likesQuery = trpc.complaints.getLikesStats.useQuery();
  const addLikeMutation = trpc.complaints.addLike.useMutation();

  useEffect(() => {
    if (likesQuery.data) {
      setLikesStats(likesQuery.data);
    }
  }, [likesQuery.data]);

  // Check if user already liked
  useEffect(() => {
    const liked = localStorage.getItem('userLiked');
    if (liked) {
      setHasLiked(true);
    }
  }, []);

  const handleLike = async (userType: 'citizen' | 'employee') => {
    if (hasLiked) {
      toast.info('لقد أعجبت بالفكرة من قبل 😊');
      return;
    }

    try {
      const result = await addLikeMutation.mutateAsync({ userType });
      if (result.success) {
        setHasLiked(true);
        localStorage.setItem('userLiked', 'true');
        
        // Update stats
        setLikesStats(prev => ({
          ...prev,
          total: prev.total + 1,
          [userType === 'citizen' ? 'citizens' : 'employees']: prev[userType === 'citizen' ? 'citizens' : 'employees'] + 1,
        }));
        
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('حدث خطأ في إضافة الإعجاب');
    }
  };

  return (
    <div className="w-full bg-transparent py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* نص التنويه */}
        <Card className="mb-8 p-6 border-l-4 border-l-[#054239] official-card">
          <h3 className="text-xl font-bold text-[#161616] mb-3 flex items-center gap-2">
            <span className="text-2xl">💡</span>
            عن صندوق الشكاوى الإلكتروني
          </h3>
          <p className="text-[#3d3a3b] leading-relaxed text-right">
            تم إنشاء هذا الصندوق الإلكتروني بمبادرة من <span className="font-bold text-[#054239]">قيادة الأمن الداخلي بريف دمشق</span> بهدف تعزيز الشفافية والمساءلة، وتوفير قناة مباشرة وآمنة للمواطنين والموظفين للتواصل مع <span className="font-bold text-[#054239]">رئيس فرع القضايا والملاحقات المسلكية</span>. نؤمن بأن الحوار البناء والاستماع الفعلي للملاحظات والشكاوى هو أساس تحسين الخدمات وتطويرها بما يخدم المصلحة العامة.
          </p>
        </Card>

        {/* قسم الإعجابات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* إجمالي الإعجابات */}
          <Card className="p-6 official-card hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="text-4xl mb-2">❤️</div>
              <div className="text-3xl font-bold text-[#054239]">{likesStats.total}</div>
              <p className="text-[#3d3a3b] mt-2">إجمالي الإعجابات</p>
            </div>
          </Card>

          {/* إعجابات المواطنين */}
          <Card className="p-6 official-card hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="text-4xl mb-2">👥</div>
              <div className="text-3xl font-bold text-[#428177]">{likesStats.citizens}</div>
              <p className="text-[#3d3a3b] mt-2">المواطنون</p>
            </div>
          </Card>

          {/* إعجابات الموظفين */}
          <Card className="p-6 official-card hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="text-4xl mb-2">💼</div>
              <div className="text-3xl font-bold text-[#6b1f2a]">{likesStats.employees}</div>
              <p className="text-[#3d3a3b] mt-2">الموظفون</p>
            </div>
          </Card>
        </div>

        {/* أزرار الإعجاب */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => handleLike('citizen')}
            disabled={hasLiked || addLikeMutation.isPending}
            className={`px-8 py-6 text-lg font-semibold rounded-lg transition-all ${
              hasLiked
                ? 'bg-gray-300 text-[#3d3a3b] cursor-not-allowed'
                : 'bg-[#428177] hover:bg-[#054239] text-white shadow-lg hover:shadow-xl'
            }`}
          >
            👥 أعجبني كمواطن
          </Button>
          <Button
            onClick={() => handleLike('employee')}
            disabled={hasLiked || addLikeMutation.isPending}
            className={`px-8 py-6 text-lg font-semibold rounded-lg transition-all ${
              hasLiked
                ? 'bg-gray-300 text-[#3d3a3b] cursor-not-allowed'
                : 'bg-[#6b1f2a] hover:bg-[#4a151e] text-white shadow-lg hover:shadow-xl'
            }`}
          >
            💼 أعجبني كموظف
          </Button>
        </div>

        {hasLiked && (
          <div className="mt-6 text-center">
            <p className="text-[#428177] font-semibold text-lg">✓ شكراً لك على دعمك للفكرة!</p>
          </div>
        )}
      </div>
    </div>
  );
}
