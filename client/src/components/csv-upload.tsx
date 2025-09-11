import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileSpreadsheet, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CsvUploadProps {
  conversationId: number;
  onUploadSuccess: () => void;
}

export default function CsvUpload({ conversationId, onUploadSuccess }: CsvUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('csv', file);

      // Use fetch directly for file upload instead of apiRequest
      const response = await fetch(`/api/conversations/${conversationId}/upload-csv`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();

      toast({
        title: "CSV uploaded successfully",
        description: `Analyzed ${file.name} and generated insights.`,
      });

      onUploadSuccess();
    } catch (error) {
      console.error("CSV upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload CSV file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input value to allow re-uploading the same file
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-4 text-center transition-colors
          ${dragOver 
            ? 'border-[hsl(221,83%,53%)] bg-[hsl(221,83%,53%)]/5' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        {isUploading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-[hsl(221,83%,53%)] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600">Processing CSV...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <FileSpreadsheet className="w-8 h-8 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Upload CSV for Analysis</p>
              <p className="text-xs text-gray-500">Drag & drop or click to browse</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}