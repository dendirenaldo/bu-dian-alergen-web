export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:p-4 focus:bg-primary-600 focus:text-white"
    >
      Lewati ke konten utama
    </a>
  );
}
