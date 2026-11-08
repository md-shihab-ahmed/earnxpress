'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, Globe, Sparkles } from 'lucide-react';
import {
  ISO_3166_1_COUNTRIES,
  CountryItem,
  getCountryFlagEmoji,
  POPULAR_COUNTRY_CODES,
} from '@/lib/constants/countries';

interface CountrySelectProps {
  value: string;
  onChange: (countryCode: string) => void;
  disabled?: boolean;
  error?: string;
  id?: string;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onChange,
  disabled = false,
  error,
  id = 'country-select',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = useMemo(() => {
    const code = value?.toUpperCase()?.trim();
    return ISO_3166_1_COUNTRIES.find((c) => c.code === code) || null;
  }, [value]);

  const popularCountries = useMemo(() => {
    return POPULAR_COUNTRY_CODES.map((code) =>
      ISO_3166_1_COUNTRIES.find((c) => c.code === code),
    ).filter(Boolean) as CountryItem[];
  }, []);

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return ISO_3166_1_COUNTRIES;
    const q = search.toLowerCase().trim();
    return ISO_3166_1_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.dialCode && c.dialCode.includes(q)),
    );
  }, [search]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (country: CountryItem) => {
    onChange(country.code);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-slate-50 dark:bg-navy-800 border text-xs pl-3 pr-3 py-2.5 rounded-lg outline-none transition-all ${
          error
            ? 'border-red-500 text-red-700 dark:text-red-400'
            : isOpen
            ? 'border-teal-500 ring-1 ring-teal-500 text-slate-900 dark:text-white'
            : 'border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white hover:border-slate-300'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2.5 truncate">
          {selectedCountry ? (
            <>
              <span className="text-lg leading-none shrink-0" role="img" aria-label={selectedCountry.name}>
                {getCountryFlagEmoji(selectedCountry.code)}
              </span>
              <span className="truncate">
                <strong className="font-semibold text-slate-900 dark:text-white">
                  {selectedCountry.name}
                </strong>{' '}
                <span className="text-[11px] text-slate-400">({selectedCountry.code})</span>
              </span>
            </>
          ) : (
            <>
              <Globe className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-400">Select your country (240+ countries)</span>
            </>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
            isOpen ? 'rotate-180 text-teal-600' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in-50 duration-150">
          {/* Search Header */}
          <div className="p-2.5 border-b border-slate-100 dark:border-navy-800 bg-slate-50/80 dark:bg-navy-800/60">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search country name, ISO code, or dial code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-xs pl-8 pr-3 py-1.5 rounded-md outline-none focus:border-teal-500 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              <span>{filteredCountries.length} countries available</span>
              <span className="text-teal-600 dark:text-teal-400 font-semibold">ISO 3166-1 Global</span>
            </div>
          </div>

          {/* Country List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-navy-800/60 text-xs">
            {/* Show Popular section if no search active */}
            {!search.trim() && (
              <div>
                <div className="px-3 py-1.5 bg-slate-100/70 dark:bg-navy-800/80 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Popular &amp; High-Activity Countries
                </div>
                {popularCountries.map((c) => {
                  const isSelected = selectedCountry?.code === c.code;
                  return (
                    <button
                      key={`popular-${c.code}`}
                      type="button"
                      onClick={() => handleSelect(c)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                        isSelected
                          ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 font-semibold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-base leading-none shrink-0" role="img" aria-label={c.name}>
                          {getCountryFlagEmoji(c.code)}
                        </span>
                        <span className="truncate">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {c.dialCode && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {c.dialCode}
                          </span>
                        )}
                        {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />}
                      </div>
                    </button>
                  );
                })}
                <div className="px-3 py-1.5 bg-slate-100/70 dark:bg-navy-800/80 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-teal-600" />
                  All Countries (A–Z)
                </div>
              </div>
            )}

            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching countries found for &quot;{search}&quot;
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = selectedCountry?.code === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 font-semibold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-base leading-none shrink-0" role="img" aria-label={c.name}>
                        {getCountryFlagEmoji(c.code)}
                      </span>
                      <span className="truncate">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-[10px] bg-slate-100 dark:bg-navy-800 px-1 py-0.5 rounded text-slate-400">
                        {c.code}
                      </span>
                      {c.dialCode && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {c.dialCode}
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
};
