import React, { useState } from 'react';
import { Check, Copy, Code2 } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  value: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-[#313244] bg-[#181825] shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1E1E2E] border-b border-[#313244] text-xs text-[#CDD6F4]">
        <div className="flex items-center gap-2 font-mono">
          <Code2 size={14} className="text-[#89B4FA]" />
          <span className="uppercase tracking-wider font-semibold text-[#89B4FA]">
            {language || 'code'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#313244] hover:bg-[#45475A] text-[#CDD6F4] transition-all"
          title="Копировать код"
        >
          {copied ? (
            <>
              <Check size={13} className="text-[#A6E3A1]" />
              <span className="text-[#A6E3A1]">Скопировано!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Копировать</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-sm font-mono leading-relaxed text-[#CDD6F4] bg-[#11111B]">
        <pre className="m-0">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
};
