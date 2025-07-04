
export type DebouncedFunction<T extends (...args: unknown[]) => unknown> = T & {
  cancel: () => void;
};

export default function debounce<T extends (...args: unknown[]) => void>(
  func: T, 
  delay: number
): DebouncedFunction<T> {
  let timer: ReturnType<typeof setTimeout>;
  
  const debouncedFunc = function (...args: Parameters<T>) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
    }, delay);
  } as T;

  (debouncedFunc as DebouncedFunction<T>).cancel = () => {
    clearTimeout(timer);
  };

  return debouncedFunc as DebouncedFunction<T>;
}
