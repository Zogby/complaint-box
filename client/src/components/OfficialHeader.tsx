type OfficialHeaderProps = {
  compact?: boolean;
  className?: string;
};

export default function OfficialHeader({ compact = false, className = '' }: OfficialHeaderProps) {
  return (
    <header className={`official-header ${compact ? 'official-header--compact' : ''} ${className}`} dir="rtl">
      <div className="official-header__mark" aria-hidden="true">
        <img src="/assets/syria-emblem.png" alt="" />
      </div>

      <div className="official-header__text">
        <p className="official-header__line official-header__state">الجمهورية العربية السورية</p>
        <p className="official-header__line official-header__ministry">وزارة الداخلية</p>
        <p className="official-header__line official-header__command">قيادة الأمن الداخلي بريف دمشق</p>
        <p className="official-header__line official-header__branch">فرع القضايا والملاحقات المسلكية</p>
        <p className="official-header__line official-header__system">صندوق الشكاوى الإلكتروني</p>
      </div>
    </header>
  );
}
