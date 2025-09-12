import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export default function CTASection() {
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-gray-900">
            Create your own workspace
          </h3>
          <p className="text-lg text-gray-600">
            Start organizing and sharing your own prompt collections with
            PromptBear.
          </p>
        </div>

        <div className="flex justify-start md:justify-end">
          <Link href="/sign-up">
            <Button
              size="lg"
              className="px-8 py-3 text-base font-medium transition-all duration-200 hover:scale-105"
            >
              Get Started
              <ExternalLink className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
