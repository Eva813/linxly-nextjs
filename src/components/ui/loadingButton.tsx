import { Button } from "@/components/ui/button";

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  children: React.ReactNode;
}

export function LoadingButton({ isLoading, children, ...props }: LoadingButtonProps) {
  return (
    <Button {...props} disabled={isLoading}>
      {isLoading ? "Loading..." : children}
    </Button>
  );
}
