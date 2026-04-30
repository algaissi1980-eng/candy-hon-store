export default function Loading() {
  return (
    <main className="min-h-screen bg-[var(--cream)] flex items-center justify-center font-sans relative overflow-hidden">
      {/* خلفية ذهبية خفيفة */}
      <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-[var(--gold)]/[0.04] rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="w-14 h-14 border-4 border-[var(--gold-light)] border-t-[var(--gold)] rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-14 h-14 border-4 border-transparent border-b-[var(--gold)]/30 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        <span className="text-[var(--text-muted)] font-bold text-sm tracking-wide">جاري التحميل...</span>
      </div>
    </main>
  );
}
