"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, X, FileText } from "lucide-react";

export const ItemUploader = () => {
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  return (
    <div className="space-y-4">
      <label className="relative group block border-2 border-dashed border-neutral-200 rounded-3xl p-12 text-center hover:border-accent hover:bg-blue-50/30 transition-all cursor-pointer">
        <input type="file" multiple className="hidden" onChange={handleFileChange} />
        <div className="flex flex-col items-center">
          <div className="p-4 bg-white rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
            <Upload className="text-accent" />
          </div>
          <p className="font-medium">Drop items here to ship</p>
          <p className="text-sm text-neutral-400 mt-1">PNG, JPG or PDF up to 10MB</p>
        </div>
      </label>

      {files.length > 0 && (
        <div className="grid grid-cols-1 gap-2">
          {files.map((file, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }}
              key={i} 
              className="flex items-center justify-between p-4 bg-white rounded-2xl border border-neutral-100"
            >
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-neutral-400" />
                <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
              </div>
              <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>
                <X size={16} className="text-neutral-400 hover:text-red-500" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ItemUploader;
