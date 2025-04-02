import Link from "next/link";

export default function Home () {
  return (
    <div className="dark:bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.8)_0%,rgba(0,0,20,0.9)_50%,rgba(0,0,50,0.8)_100%)]">
      <section className="bg-white py-20">
        <div className="container mx-auto px-4 text-center">
          <span className="inline-block bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
            Don&apos;t hesitate to try it out
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Revolutionizing <span className="text-mask">Snippet</span> management
          </h1>
          {/* 新增水平動畫線條 */}
          <div className="lines relative w-50 overflow-hidden">
            <div className="animatedLine"></div>
          </div>
          {/* <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Harnesses the power of artificial intelligence to transform your business data into actionable insights, propelling you to new heights of success
          </p> */}
          <div className="flex justify-center gap-4">
            <button className="bg-primary text-white font-semibold px-6 py-3 rounded-lg">
              <Link href="/snippets" className="text-lg font-medium hover:underline">
                To Snippets Management
              </Link>
            </button>
            <button className="flex items-center border border-gray-300 hover:bg-gray-100 text-gray-800 font-semibold px-6 py-3 rounded-lg transition">
              <Link href="/workspace" className="text-lg font-medium hover:underline">
                To workspace
              </Link>
            </button>
          </div>
        </div>
      </section>
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
