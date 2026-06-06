// The JamKemon mark: a map pin whose "head" is a traffic-signal stack.

export default function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M16 2C10.477 2 6 6.477 6 12c0 7.5 10 18 10 18s10-10.5 10-18c0-5.523-4.477-10-10-10z"
        fill="#e11d48"
      />
      <rect x="12" y="6" width="8" height="12" rx="4" fill="white" />
      <circle cx="16" cy="9.2" r="1.5" fill="#ef4444" />
      <circle cx="16" cy="12" r="1.5" fill="#f59e0b" />
      <circle cx="16" cy="14.8" r="1.5" fill="#22c55e" />
    </svg>
  );
}
