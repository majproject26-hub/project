import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, Sparkles, Terminal, AlertTriangle } from 'lucide-react';
import { useToast } from './Toast';

// SQL Keywords and functions
const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'LIMIT', 'JOIN', 'LEFT JOIN',
  'RIGHT JOIN', 'INNER JOIN', 'ON', 'AS', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'HAVING',
  'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ROUND', 'CASE', 'WHEN', 'THEN',
  'ELSE', 'END', 'DESC', 'ASC', 'UNION', 'ALL', 'DROP', 'DELETE', 'UPDATE', 'INSERT',
  'ALTER', 'TRUNCATE', 'CREATE', 'TABLE'
];

export function SqlCodeEditor({
  value = '',
  onChange,
  onRun,
  readOnly = false,
  tables = [],
  placeholder = '-- Write standard SQL or click schema items to insert...',
  height = '240px',
  destructiveWarning = null,
  className = '',
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionPos, setSuggestionPos] = useState({ top: 0, left: 0 });
  const textareaRef = useRef(null);

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (onRun) onRun();
    }
  };

  // Line numbers calculation
  const lines = value ? value.split('\n') : [''];

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast({
      title: 'Copied to clipboard',
      message: 'SQL query has been copied to your clipboard.',
      type: 'success',
      duration: 2000
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSql = () => {
    if (!value.trim()) return;
    let formatted = value
      .replace(/\s+/g, ' ')
      .replace(/\s*(SELECT|FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|LEFT JOIN|RIGHT JOIN|INNER JOIN|JOIN)\s*/gi, (match) => `\n${match.trim().toUpperCase()} `)
      .replace(/,\s*/g, ',\n  ')
      .trim();

    if (onChange) {
      onChange(formatted);
      toast({
        title: 'SQL Formatted',
        message: 'Query indented with standard SQL conventions.',
        type: 'info',
        duration: 2000
      });
    }
  };

  // Autocomplete detection based on cursor position
  const handleKeyUp = (e) => {
    if (readOnly) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastWordMatch = textBeforeCursor.match(/([a-zA-Z_0-9]+)$/);

    if (lastWordMatch && lastWordMatch[1].length >= 2) {
      const currentWord = lastWordMatch[1].toUpperCase();

      // Collect suggestions from keywords, tables, and table columns
      const allSuggestions = [
        ...SQL_KEYWORDS.map(k => ({ label: k, type: 'keyword' })),
        ...tables.map(t => ({ label: t.name || t, type: 'table' })),
        ...tables.flatMap(t => (t.columns || []).map(c => ({ label: c.column || c, type: 'column' }))),
      ];

      const matched = allSuggestions
        .filter(s => s.label.toUpperCase().startsWith(currentWord) && s.label.toUpperCase() !== currentWord)
        .slice(0, 6);

      if (matched.length > 0) {
        setSuggestions(matched);
        setShowSuggestions(true);
        return;
      }
    }
    setShowSuggestions(false);
  };

  const applySuggestion = (s) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const textAfterCursor = value.slice(cursorPos);
    const lastWordMatch = textBeforeCursor.match(/([a-zA-Z_0-9]+)$/);

    if (lastWordMatch) {
      const prefix = textBeforeCursor.slice(0, -lastWordMatch[1].length);
      const newValue = prefix + s.label + ' ' + textAfterCursor;
      onChange(newValue);
      setShowSuggestions(false);
      setTimeout(() => {
        textarea.focus();
        const newPos = prefix.length + s.label.length + 1;
        textarea.setSelectionRange(newPos, newPos);
      }, 10);
    }
  };

  // Syntax highlighting renderer function
  const renderHighlightedCode = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, lineIdx) => {
      // Regex tokenizer for SQL strings, keywords, numbers, comments
      const tokenRegex = /(--.*$)|('[^']*')|(\b(?:SELECT|FROM|WHERE|GROUP BY|ORDER BY|LIMIT|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|ON|AS|AND|OR|NOT|IN|LIKE|HAVING|DISTINCT|COUNT|SUM|AVG|MIN|MAX|ROUND|CASE|WHEN|THEN|ELSE|END|DESC|ASC|UNION|ALL|DROP|DELETE|UPDATE|INSERT|ALTER|TRUNCATE|CREATE|TABLE)\b)|(\b\d+\b)/gi;

      const elements = [];
      let lastIndex = 0;
      let match;

      while ((match = tokenRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          elements.push(line.substring(lastIndex, match.index));
        }

        const [fullMatch, comment, stringLit, keyword, number] = match;
        if (comment) {
          elements.push(<span key={match.index} className="text-emerald-500/80 italic">{comment}</span>);
        } else if (stringLit) {
          elements.push(<span key={match.index} className="text-amber-400">{stringLit}</span>);
        } else if (keyword) {
          const isDestructive = ['DROP', 'DELETE', 'UPDATE', 'TRUNCATE', 'ALTER'].includes(keyword.toUpperCase());
          elements.push(
            <span
              key={match.index}
              className={`font-semibold ${isDestructive ? 'text-rose-400 underline decoration-rose-500/50' : 'text-sky-400'}`}
            >
              {keyword.toUpperCase()}
            </span>
          );
        } else if (number) {
          elements.push(<span key={match.index} className="text-purple-400">{number}</span>);
        }
        lastIndex = match.index + fullMatch.length;
      }

      if (lastIndex < line.length) {
        elements.push(line.substring(lastIndex));
      }

      return (
        <div key={lineIdx} className="leading-6 min-h-[1.5rem]">
          {elements.length > 0 ? elements : '\u00A0'}
        </div>
      );
    });
  };

  return (
    <div className={`relative rounded-xl border border-slate-700/80 bg-slate-950 font-mono text-xs sm:text-sm overflow-hidden shadow-inner ${className}`}>
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900 border-b border-slate-800 text-slate-400 text-xs">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-semibold text-slate-300">DuckDB / Parquet SQL Engine</span>
          {readOnly && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
              Read-Only
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && (
            <button
              type="button"
              onClick={formatSql}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs"
              title="Format SQL Query"
            >
              <Sparkles className="w-3 h-3 text-teal-400" />
              <span>Format</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs"
            title="Copy SQL"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Editor Main Content Area */}
      <div className="flex relative overflow-auto" style={{ height }}>
        {/* Line Numbers Bar */}
        <div className="shrink-0 select-none px-3 py-3 bg-slate-900/60 border-r border-slate-800/80 text-right text-slate-600 text-xs font-mono">
          {lines.map((_, i) => (
            <div key={i} className="leading-6">{i + 1}</div>
          ))}
        </div>

        {/* Text Area & Syntax Overlay */}
        <div className="relative flex-1 min-w-0">
          {/* Overlay Highlighted View */}
          <div
            aria-hidden="true"
            className="absolute inset-0 p-3 pointer-events-none text-slate-200 whitespace-pre font-mono overflow-hidden"
          >
            {renderHighlightedCode(value)}
          </div>

          {/* Actual Transparent Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            readOnly={readOnly}
            onChange={(e) => onChange && onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            placeholder={placeholder}
            spellCheck="false"
            autoCapitalize="off"
            autoComplete="off"
            className="w-full h-full p-3 font-mono text-transparent caret-[#DCE4C2] bg-transparent resize-none focus:outline-none whitespace-pre leading-6 selection:bg-[#4D5A2A]/40 selection:text-white"
          />

          {/* Autocomplete Suggestion Popup */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-30 bottom-4 left-6 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 w-52 text-xs">
              <div className="px-2.5 py-1 text-[10px] text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-800">
                Suggestions (Click to insert)
              </div>
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applySuggestion(s)}
                  className="w-full px-2.5 py-1.5 flex items-center justify-between text-left hover:bg-slate-800 text-slate-200 transition-colors"
                >
                  <span className="font-mono">{s.label}</span>
                  <span className={`text-[10px] uppercase font-bold px-1 rounded ${
                    s.type === 'keyword' ? 'text-sky-400 bg-sky-950/80' : s.type === 'table' ? 'text-teal-400 bg-teal-950/80' : 'text-purple-400 bg-purple-950/80'
                  }`}>
                    {s.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Inline Warning for Destructive Queries if detected */}
      {destructiveWarning && (
        <div className="px-3 py-2 bg-rose-950/80 border-t border-rose-800/80 flex items-center gap-2 text-rose-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{destructiveWarning}</span>
        </div>
      )}
    </div>
  );
}
