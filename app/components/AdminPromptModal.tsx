'use client';
import React, { useState, useEffect, useRef } from 'react';

interface AdminPromptModalProps {
  isOpen: boolean;
  title: string;
  initialValue?: string;
  placeholder?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export default function AdminPromptModal({ isOpen, title, initialValue = '', placeholder = '', onConfirm, onCancel }: AdminPromptModalProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">{title}</h3>
          <form onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 outline-none resize-none mb-6"
              rows={3}
              dir="rtl"
            />
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                انصراف
              </button>
              <button type="submit" className="px-5 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md">
                تایید و ثبت
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
