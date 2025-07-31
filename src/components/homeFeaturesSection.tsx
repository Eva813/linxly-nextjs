import { LucideIcon } from "lucide-react";
import HomeFeatureCard from "./ui/homeFeatureCard";

interface HomeFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface HomeFeaturesSectionProps {
  features: HomeFeature[];
}

export default function HomeFeaturesSection({ features }: HomeFeaturesSectionProps) {
  return (
    <section className="py-16  dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Everything you need for prompt management
          </h2>
          <p 
            className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            From simple storage to advanced collaboration, promptBear has all the features to make your AI workflow more efficient.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              data-aos="fade-up"
              data-aos-delay={300 + index * 100}
            >
              <HomeFeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}