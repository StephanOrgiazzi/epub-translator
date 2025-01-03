'use client'

import { TargetLanguage, languages } from '../types/languages';

interface LanguageSelectorProps {
  value: TargetLanguage;
  onChange: (value: TargetLanguage) => void;
  disabled?: boolean;
}

export function LanguageSelector({ value, onChange, disabled }: LanguageSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-white text-sm font-medium mb-1 drop-shadow-md">
        Select Target Language
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as TargetLanguage)}
        disabled={disabled}
        className="w-full px-4 py-2.5 rounded-xl bg-black/30 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 transition-all duration-300 cursor-pointer hover:border-white/50"
      >
        {Object.entries(languages).map(([code, { name, flag }]) => (
          <option key={code} value={code} className="bg-gray-900 text-white">
            {flag} {name}
          </option>
        ))}
      </select>
    </div>
  );
}
