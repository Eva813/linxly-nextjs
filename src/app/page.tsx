import Link from "next/link";

export default function Home() {
  return (
    <div className="dark:bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.8)_0%,rgba(0,0,20,0.9)_50%,rgba(0,0,50,0.8)_100%)]">
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
          <Link href="/snippets" className="text-lg font-medium hover:underline">
            To Snippets Management
          </Link>
        </main>
        <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        </footer>
      </div>
    </div>
  );
}
