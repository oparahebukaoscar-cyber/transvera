export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-100 py-12 px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-sm text-neutral-400">© 2026 TRANSVERA. Built for the future of logistics.</p>
        <div className="flex gap-6 text-sm font-medium text-neutral-600">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Support</a>
        </div>
      </div>
    </footer>
  );
}
