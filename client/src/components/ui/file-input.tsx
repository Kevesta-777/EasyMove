import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";

interface FileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  text: string;
  icon: React.ReactNode;
  onChange: (file: File | null) => void;
}

export function FileInput({ text, icon, accept, onChange, ...props }: FileInputProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      setFileName(file.name);
      onChange(file);
    } else {
      setFileName(null);
      onChange(null);
    }
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
      {icon}
      <p className="text-sm text-gray-500 mb-2">{text}</p>
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        accept={accept}
        onChange={handleFileChange}
        {...props}
      />
      <Button
        type="button"
        onClick={handleButtonClick}
        variant="outline"
        className={`${
          fileName
            ? "bg-blue-100 text-primary border-blue-200"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
      >
        {fileName ? "File Selected" : "Choose File"}
      </Button>
      {fileName && (
        <p className="mt-2 text-xs text-gray-500 truncate max-w-full">{fileName}</p>
      )}
    </div>
  );
}
