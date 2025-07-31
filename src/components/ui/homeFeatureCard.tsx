import { LucideIcon } from "lucide-react";

interface HomeFeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function HomeFeatureCard({ icon: Icon, title, description }: HomeFeatureCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out hover:-translate-y-2">
      <div className="w-12 h-12 bg-light dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300">
        {description}
      </p>
    </div>
  );
}