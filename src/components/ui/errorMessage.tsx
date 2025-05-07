interface ErrorMessageProps {
  message: string;
  id?: string;
}

export function ErrorMessage({ message, id }: ErrorMessageProps) {
  if (!message) return null;
  return <p className="text-sm text-red-600" id={id}>{message}</p>;
}
