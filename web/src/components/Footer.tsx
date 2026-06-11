export function Footer() {
  return (
    <footer className="mt-10 border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-6 sm:flex-row sm:justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-wordmark.svg" alt="Tu Chamba" className="h-7 w-auto" />
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} Tu Chamba — Portal de empleos
        </p>
      </div>
    </footer>
  );
}
