type OwlLogoProps = {
  size?: number;
  className?: string;
  reading?: boolean;
};

export function OwlLogo({ size = 44, className = "", reading = true }: OwlLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="جغد سبز در حال مطالعه"
    >
      <defs>
        <linearGradient id="owlBody" x1="24" y1="14" x2="96" y2="104" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4ade80" />
          <stop offset="0.55" stopColor="#22c55e" />
          <stop offset="1" stopColor="#15803d" />
        </linearGradient>
        <linearGradient id="owlWing" x1="20" y1="62" x2="40" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#16a34a" />
          <stop offset="1" stopColor="#0d6b3f" />
        </linearGradient>
      </defs>

      <ellipse cx="60" cy="111" rx="38" ry="5.5" fill="#0f2e25" opacity="0.10" />

      <path
        d="M29 36C24 25 26 16 31 12c6 3.5 11 8 14 14M91 36c5-11 3-20-2-24-6 3.5-11 8-14 14"
        fill="#15803d"
      />
      <path
        d="M60 14c-23 0-38 16.5-38 40 0 26 16.5 46 38 46s38-20 38-46c0-23.5-15-40-38-40Z"
        fill="url(#owlBody)"
      />
      <ellipse cx="60" cy="80" rx="23" ry="20" fill="#dcfce7" opacity="0.92" />
      <path d="M46 88c4 3 9 4 14 4s10-1 14-4" stroke="#86efac" strokeWidth="2.5" strokeLinecap="round" />

      <circle cx="45" cy="52" r="14" fill="#ffffff" />
      <circle cx="75" cy="52" r="14" fill="#ffffff" />
      <circle cx="47.5" cy="53" r="6.3" fill="#134e4a" />
      <circle cx="72.5" cy="53" r="6.3" fill="#134e4a" />
      <circle cx="49.6" cy="50.7" r="2.1" fill="#ffffff" />
      <circle cx="74.6" cy="50.7" r="2.1" fill="#ffffff" />

      <circle cx="45" cy="52" r="16" stroke="#f59e0b" strokeWidth="3" />
      <circle cx="75" cy="52" r="16" stroke="#f59e0b" strokeWidth="3" />
      <path d="M58 49c1.6-2 2.6-2 4 0" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />

      <path d="M54.5 64c1.8-2.8 9.2-2.8 11 0-1.2 5.2-3.4 8-5.5 8s-4.3-2.8-5.5-8Z" fill="#f59e0b" />
      <path d="M56.5 66.5h7" stroke="#b45309" strokeWidth="1.6" strokeLinecap="round" />

      {reading && (
        <>
          <path d="M23 86c11-6 26-5 35 3v17c-9-8-24-9-35-3V86Z" fill="#fef3c7" stroke="#b45309" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M97 86c-11-6-26-5-35 3v17c9-8 24-9 35-3V86Z" fill="#fffbeb" stroke="#b45309" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M58 89v16" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M30 92c6-2 13-2 19 1M90 92c-6-2-13-2-19 1" stroke="#d97706" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
          <path d="M25 75c-5 4-7 12-5 18 4-2 8-7 10-13l-5-5Z" fill="url(#owlWing)" />
          <path d="M95 75c5 4 7 12 5 18-4-2-8-7-10-13l5-5Z" fill="url(#owlWing)" />
        </>
      )}

      <path d="M60 12c2.5-6.5 8-8.5 13-8.5-2.5 6-6.5 9-13 8.5Z" fill="#84cc16" />
      <path d="M60 12c1.4-3.6 4-6.1 7.4-7.4" stroke="#3f6212" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex flex-col leading-none ${className}`}>
      <span className="text-xl font-black tracking-tight text-forest">
        جوانه‌<span className="text-amber-500">بازار</span>
      </span>
      <span className="mt-1 text-[10px] font-semibold text-emerald-700/70">بازارچهٔ ساخته‌های بچه‌ها</span>
    </span>
  );
}
