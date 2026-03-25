import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Building2, X } from "lucide-react";

export interface CompanyData {
  inn: string;
  companyName: string;
  companyFullName: string;
  companyKpp: string;
  companyOgrn: string;
  companyLegalAddress: string;
  companyDirector: string;
}

interface DadataSuggestion {
  value: string;
  data: {
    inn: string;
    kpp?: string;
    ogrn?: string;
    name: {
      short_with_opf: string;
      full_with_opf: string;
    };
    address?: { value: string };
    management?: { name: string; post: string };
    type: "LEGAL" | "INDIVIDUAL";
  };
}

interface Props {
  onSelect: (company: CompanyData) => void;
  onClear: () => void;
  selected: CompanyData | null;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function InnAutocomplete({ onSelect, onClear, selected }: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<DadataSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 350);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSuggestions([]); setIsOpen(false); return; }
    setIsLoading(true);
    try {
      const res = await fetch("/api/dadata/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, count: 7 }),
      });
      if (!res.ok) return;
      const data = await res.json() as { suggestions: DadataSuggestion[] };
      setSuggestions(data.suggestions ?? []);
      setIsOpen((data.suggestions ?? []).length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions(debouncedQuery);
  }, [debouncedQuery, fetchSuggestions]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSelect(s: DadataSuggestion) {
    const company: CompanyData = {
      inn: s.data.inn,
      companyName: s.data.name.short_with_opf,
      companyFullName: s.data.name.full_with_opf,
      companyKpp: s.data.kpp ?? "",
      companyOgrn: s.data.ogrn ?? "",
      companyLegalAddress: s.data.address?.value ?? "",
      companyDirector: s.data.management?.name ?? "",
    };
    onSelect(company);
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
  }

  function handleClear() {
    onClear();
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
  }

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-1.5">
        <Building2 className="w-4 h-4 text-slate-400" />
        Юридическое лицо{" "}
        <span className="text-slate-400 font-normal text-xs">(необязательно)</span>
      </Label>

      {selected ? (
        <div className="relative rounded-xl border border-blue-200 bg-blue-50 p-4">
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
            aria-label="Убрать компанию"
          >
            <X className="w-4 h-4" />
          </button>
          <p className="font-semibold text-slate-800 pr-6">{selected.companyName}</p>
          <p className="text-xs text-slate-500 mt-0.5">{selected.companyFullName}</p>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
            <span><span className="text-slate-400">ИНН:</span> {selected.inn}</span>
            {selected.companyKpp && <span><span className="text-slate-400">КПП:</span> {selected.companyKpp}</span>}
            {selected.companyOgrn && <span><span className="text-slate-400">ОГРН:</span> {selected.companyOgrn}</span>}
            {selected.companyDirector && (
              <span className="col-span-2">
                <span className="text-slate-400">Рук.:</span> {selected.companyDirector}
              </span>
            )}
            {selected.companyLegalAddress && (
              <span className="col-span-2 truncate" title={selected.companyLegalAddress}>
                <span className="text-slate-400">Адрес:</span> {selected.companyLegalAddress}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div ref={wrapperRef} className="relative">
          <div className="relative">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setIsOpen(true)}
              placeholder="Введите ИНН или название компании"
              className="bg-slate-50 pr-8"
              autoComplete="off"
            />
            {isLoading && (
              <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
            )}
          </div>

          {isOpen && suggestions.length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              {suggestions.map((s) => (
                <button
                  key={s.data.inn}
                  type="button"
                  onClick={() => handleSelect(s)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                >
                  <div className="font-medium text-sm text-slate-800">{s.data.name.short_with_opf}</div>
                  <div className="flex gap-3 mt-0.5 text-xs text-slate-500">
                    <span>ИНН {s.data.inn}</span>
                    {s.data.address?.value && (
                      <span className="truncate max-w-xs">{s.data.address.value}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
