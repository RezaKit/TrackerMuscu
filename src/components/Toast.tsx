interface ToastProps {
  message: string;
  type: 'success' | 'info' | 'record';
}

export default function Toast({ message, type }: ToastProps) {
  const bg =
    type === 'success'
      ? 'bg-green-600'
      : type === 'record'
      ? 'bg-primary'
      : 'bg-secondary';

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
      <div className={`${bg} text-white px-4 py-3 rounded-lg shadow-lg font-bold text-sm`}>
        {message}
      </div>
    </div>
  );
}
