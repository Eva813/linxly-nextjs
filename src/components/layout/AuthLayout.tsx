interface AuthLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <div className="flex items-center justify-center bg-gray-50 min-h-[calc(100vh-4rem-1px)]">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">{title}</h2>
        <p className="text-center text-gray-600">{description}</p>
        {children}
      </div>
    </div>
  );
}
