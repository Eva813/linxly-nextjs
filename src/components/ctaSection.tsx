import Link from "next/link";
import { Check, Zap, Globe } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-secondary via-primary to-primary dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 text-center">

        {/* Main Heading */}
        <h2 className="text-4xl md:text-5xl font-bold text-white dark:text-gray-100 mb-6">
          Ready to transform your
          <br />
          AI workflow?
        </h2>

        {/* Subtitle */}
        <p className="text-xl text-blue-100 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
          Join 10,00+ AI professionals who&apos;ve revolutionized their prompt management with promptBear.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link
            href="/prompts"
            className="bg-white text-blue-700 dark:bg-gray-100 dark:text-blue-800 font-semibold px-8 py-4 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-200 transition-colors duration-200 inline-flex items-center gap-2 min-w-[200px] justify-center"
          >
            Start Trial
            <span className="text-lg">→</span>
          </Link>

          <Link
            href="/sign-up"
            className="bg-transparent border-2 border-white dark:border-gray-300 text-white dark:text-gray-100 font-semibold px-8 py-4 rounded-lg hover:bg-white/10 dark:hover:bg-gray-800/40 transition-colors duration-200 min-w-[200px] text-center"
          >
            Learn More
          </Link>
        </div>

        {/* Benefits */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-blue-100 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-400 dark:text-green-300" />
            <span>Completely free</span>
          </div>

          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400 dark:text-yellow-300" />
            <span>Start instantly</span>
          </div>

          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-300 dark:text-blue-200" />
            <span>Works anywhere</span>
          </div>
        </div>
      </div>
    </section>
  );
}