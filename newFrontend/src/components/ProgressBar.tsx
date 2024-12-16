interface ProgressBarProps {
    progress: number;
  }
  
  export function ProgressBar({ progress }: ProgressBarProps) {
    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div
          className="bg-blue-500 h-2.5 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    );
  }