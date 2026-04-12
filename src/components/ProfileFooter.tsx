export default function ProfileFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full mt-8 pb-6 flex flex-col items-center gap-1 select-none">
      {/* Divider dot */}
      <div className="flex items-center gap-2 mb-1">
        <span className="h-px w-12 bg-current opacity-20 rounded-full" />
        <span className="text-[10px] opacity-30">✦</span>
        <span className="h-px w-12 bg-current opacity-20 rounded-full" />
      </div>

      <p className="text-[11px] text-muted-foreground/60 font-medium tracking-wide text-center">
        © {year} Design &amp; Developed By
      </p>
      <p className="text-[12px] font-semibold text-muted-foreground/70 tracking-wide text-center">
        <a
          href="https://www.creativexlab.online/services"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors underline-offset-2 hover:underline"
        >
          CreativeX Technology Pvt Ltd
        </a>
      </p>
    </footer>
  );
}
