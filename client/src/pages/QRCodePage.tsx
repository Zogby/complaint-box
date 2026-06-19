import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import OfficialHeader from '@/components/OfficialHeader';
import OfficialFrame from '@/components/OfficialFrame';

const QRCodePage = () => {
  const qrRef = useRef<HTMLDivElement>(null);
  const complaintUrl = `${window.location.origin}/`;

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'complaint-box-qr.png';
        link.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="official-page py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="official-shell max-w-3xl">
        <OfficialHeader />
        <div className="text-center my-10">
          <span className="official-chip mb-4">مشاركة سريعة وآمنة</span>
          <h1 className="text-4xl font-black text-[#161616] mb-2">رمز QR</h1>
          <p className="text-[#3d3a3b] text-lg">رابط صندوق الشكاوى الإلكتروني</p>
        </div>

        <OfficialFrame><Card className="p-12 border-0 bg-white text-center shadow-none relative z-[1]">
          <div className="mb-8">
            <p className="text-[#3d3a3b] mb-6">امسح الرمز أدناه للوصول إلى صندوق الشكاوى</p>
            <div ref={qrRef} className="flex justify-center mb-8">
              <QRCodeSVG
                value={complaintUrl}
                size={300}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>

          <div className="bg-[#edebe0] rounded-lg p-4 mb-8">
            <p className="text-sm text-[#3d3a3b] mb-2">الرابط المباشر:</p>
            <p className="text-lg font-mono text-[#054239] break-all">{complaintUrl}</p>
          </div>

          <div className="flex gap-4 justify-center print:hidden">
            <Button
              onClick={handleDownload}
              className="flex items-center gap-2 official-button text-white font-semibold py-2 px-4 rounded-lg transition-all"
            >
              <Download className="w-5 h-5" />
              تحميل
            </Button>
            <Button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-[#3d3a3b] hover:bg-[#161616] text-white font-semibold py-2 px-4 rounded-lg transition-all"
            >
              <Printer className="w-5 h-5" />
              طباعة
            </Button>
          </div>
        </Card></OfficialFrame>

        <div className="mt-8 text-center text-[#3d3a3b] text-sm">
          <p>يمكن طباعة هذا الرمز ونشره في الأماكن العامة</p>
        </div>
      </div>

      <style>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default QRCodePage;
