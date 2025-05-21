import Link from "next/link";
import Image from "next/image";



export default function Home () {

  return (
    <div className="dark:bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.8)_0%,rgba(0,0,20,0.9)_50%,rgba(0,0,50,0.8)_100%)]">
      <section className="bg-white py-20">
        <div className="container mx-auto px-4 text-center flex flex-col md:flex-row items-center md:items-start">
          <div className="md:w-1/2 flex flex-col justify-center h-full">
            <span className="inline-block bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1 rounded-full mb-4 max-w-max text-center mx-auto">
              Don&apos;t hesitate to try it out
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Revolutionizing <span className="text-mask">Snippet</span> management
            </h1>
            <div className="lines relative w-50 overflow-hidden">
              <div className="animatedLine"></div>
            </div>
            <div className="flex justify-center gap-4 mt-4">
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
          
          <div className="md:w-1/2 flex justify-center mt-8 md:mt-0 relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 100 100"
              width="200"
              height="200"
              style={{
                display: "block",
                transform: "translateX(70px)",
                marginTop: "-10px",
              }}
            >
              <circle cx="50" cy="50" r="50" fill="#BDCCED" />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 100 100"
              width="60"
              height="60"
              style={{
                display: "block",
                transform: "translateX(5px)",
                marginTop: "250px",
              }}
            >
              <circle cx="50" cy="50" r="50" fill="#98B1E4" />
            </svg>
            <Image src="/assets/manWithPuzzle.svg" alt="Man with puzzle"  width={380} height={380} />
            <Image src="/assets/puzzle.svg" alt="puzzle"  style={{ transform: 'rotate(-15deg)' }}  className="hidden md:block absolute top-[-32px] right-[90px] hover:animate-swing-left"  width={80} height={80} />
            <Image src="/assets/puzzle.svg" alt="puzzle"  style={{ transform: 'rotate(5deg)' }}  className="hidden md:block absolute top-[-20px] right-[-10px] hover:animate-swing-right"  width={80} height={80} />

              <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 100 100"
              width="120"
              height="120"
              style={{
                display: "block",
                transform: "translateX(5px)",
                marginTop: "200px",
              }}
            >
              <circle cx="50" cy="50" r="50" fill="#98B1E4" />
            </svg>
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
