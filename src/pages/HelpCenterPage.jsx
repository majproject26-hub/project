import React, { useState } from 'react';
import {
  HelpCircle,
  Search,
  BookOpen,
  MessageSquareCode,
  Mic,
  Database,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  Terminal,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export function HelpCenterPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState({ 0: true });

  const faqs = [
    {
      category: 'Data Lakehouse & Parquet',
      q: 'How does automatic Parquet conversion work?',
      a: 'When you upload a raw CSV or JSON file, the lakehouse ingestion engine analyzes the first several thousand rows to infer appropriate schema types (VARCHAR, INTEGER, FLOAT, TIMESTAMP). It then transforms the row-based data into Apache Arrow columnar format and applies Snappy compression, saving up to 75% storage while speeding up analytical scans by 10x.',
    },
    {
      category: 'Data Lakehouse & Parquet',
      q: 'Are datasets shared across different companies?',
      a: 'Never. The platform enforces strict cryptographic and metadata isolation. ACME-001 and NOVA-002 have completely partitioned S3/Blob storage paths, catalogs, access keys, and user directories. It is impossible for users in one tenant to view, query, or enumerate data from another.',
    },
    {
      category: 'Conversational BI & Voice',
      q: 'How does Ask Your Data translate plain language into SQL?',
      a: 'The engine uses semantic parsing trained on standard lakehouse schemas. When you speak into the microphone or type a question, it detects intended measures (e.g. salary, revenue, stock), dimensions (e.g. department, region), and aggregations (AVG, SUM, COUNT), generating optimized DuckDB / Parquet SQL statements automatically.',
    },
    {
      category: 'Conversational BI & Voice',
      q: 'Does voice speech recognition work in all browsers?',
      a: 'Voice input utilizes the standard HTML5 Web Speech API (supported natively in Chrome, Edge, Safari, and Brave). On browsers where microphone hardware access is restricted, the platform provides an intelligent simulation fallback so you can test conversational flows seamlessly.',
    },
    {
      category: 'Security & User Roles',
      q: 'What are the differences between ADMIN, HR, and STAFF roles?',
      a: 'ADMIN has comprehensive governance powers: approving registrations, modifying user roles, changing tenant settings, and deleting any or all datasets. Any user who uploaded a dataset (whether STAFF, HR, or ADMIN) can permanently delete the data they uploaded, ensuring creator control while preserving full administrative oversight.',
    },
    {
      category: 'Security & User Roles',
      q: 'Why are DROP, DELETE, and UPDATE queries blocked for STAFF?',
      a: 'To guarantee data lakehouse immutability and prevent accidental loss, STAFF roles are restricted to read-only analytical SELECT queries. Destructive statements trigger an inline security barrier.',
    },
  ];

  const sampleQuestions = [
    { q: 'What is the average salary and employee count by department?', cat: 'Human Resources' },
    { q: 'Show closed deal revenue breakdown by region for Q3', cat: 'Sales Analytics' },
    { q: 'Which hardware components have low or critical stock levels?', cat: 'Aerospace Operations' },
    { q: 'Which accounts are currently at high churn risk?', cat: 'Customer Success' },
    { q: 'What is the telemetry status and battery charge across the fleet?', cat: 'Flight Telemetry' },
  ];

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.a.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="text-center space-y-2 py-4">
        <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400 mx-auto shadow-sm">
          <BookOpen className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Help Center & Documentation
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Everything you need to know about multi-company lakehouse operations, voice queries, and Parquet analytics.
        </p>

        {/* Search */}
        <div className="pt-3 max-w-md mx-auto relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search FAQs, features, or questions..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
          />
        </div>
      </div>

      {/* Suggested Natural Language Questions Cheat Sheet */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Curated Natural Language Prompts
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Try asking these plain-language questions in the "Ask Your Data" console:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {sampleQuestions.map((sq, i) => (
            <div
              key={i}
              className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-start justify-between gap-2"
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">"{sq.q}"</p>
                <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400">{sq.cat}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Frequently Asked Questions Accordion */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white px-1">
          Frequently Asked Questions ({filteredFaqs.length})
        </h2>

        {filteredFaqs.map((faq, idx) => {
          const isExpanded = !!expandedFaq[idx];
          return (
            <Card key={idx} className="overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedFaq((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="space-y-0.5 pr-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-teal-600 dark:text-teal-400 font-bold block">
                    {faq.category}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                    {faq.q}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                  {faq.a}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
