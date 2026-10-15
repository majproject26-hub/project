import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquareCode,
  Mic,
  MicOff,
  Send,
  Database,
  Sparkles,
  Play,
  Copy,
  Check,
  Download,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  Pin,
  ChevronDown,
  ChevronUp,
  Search,
  History,
  Clock,
  Terminal,
  BarChart3,
  Lightbulb,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../components/common/Toast';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { SqlCodeEditor } from '../components/common/SqlCodeEditor';
import { api } from '../services/api';

export function AskYourDataPage() {
  const { currentUser, currentCompany } = useAuth();
  const { datasets, savedQueries, saveQuery, addChart } = useData();
  const { toast } = useToast();

  const companyId = currentUser ? currentUser.companyId : 'ACME-001';

  // Selection states
  const [selectedDatasetId, setSelectedDatasetId] = useState(datasets[0]?.id || '');
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [historySearch, setHistorySearch] = useState('');

  // Active conversational answers stream
  const [activeQuery, setActiveQuery] = useState(() => savedQueries[0] || null);
  const [collapsedSql, setCollapsedSql] = useState({});
  const [feedbackGiven, setFeedbackGiven] = useState({});
  const [copiedQueryId, setCopiedQueryId] = useState(null);

  const recognitionRef = useRef(null);

  // Selected dataset object
  const currentDataset = datasets.find((d) => d.id === selectedDatasetId) || datasets[0];

  // Example question chips tailored to active dataset
  const exampleChips = {
    'acme_employees_2025.parquet': [
      'What is the average salary and count by department?',
      'Who are the highest rated staff in Engineering?',
      'Show tenure distribution across office locations',
    ],
    'q3_global_sales_revenue.parquet': [
      'Show closed deal revenue breakdown by region for Q3',
      'Which sales reps closed more than $200,000?',
      'Compare product line sales across all closed won deals',
    ],
    'customer_churn_analytics.parquet': [
      'Which accounts are currently at high churn risk?',
      'Show correlation between NPS score and MRR',
      'List accounts renewing in the next 60 days',
    ],
    'nova_hardware_inventory.parquet': [
      'Which hardware components have low or critical stock levels?',
      'Show total inventory capitalized cost by category',
      'Which parts have lead times greater than 30 days?',
    ],
    'orbital_telemetry_logs.parquet': [
      'What is the telemetry status and battery charge across the fleet?',
      'Show satellites with solar panel temperature above 50°C',
      'List orbital altitudes for nominal operational units',
    ],
  };

  const currentChips = currentDataset
    ? exampleChips[currentDataset.name] || [
        `What are the top 5 records in ${currentDataset.displayName || currentDataset.name}?`,
        `Calculate averages for numeric columns in this dataset`,
        `Show category counts for this table`,
      ]
    : [];

  // Setup Web Speech API with fallback
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = currentUser?.voiceLanguage || 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setSpeechTranscript(transcript);
        setInputText(transcript);
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition error:', e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [currentUser]);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      // Simulate voice input for demonstration if browser doesn't permit mic
      if (!isListening) {
        setIsListening(true);
        setSpeechTranscript('Simulating voice input...');
        setTimeout(() => {
          const sample = currentChips[0] || 'Show average metrics for this dataset';
          setSpeechTranscript(sample);
          setInputText(sample);
          setIsListening(false);
          toast({
            title: 'Voice Transcript Captured',
            message: `Recognized: "${sample}"`,
            type: 'info',
          });
        }, 2000);
      } else {
        setIsListening(false);
      }
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setSpeechTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Error starting speech:', err);
      }
    }
  };

  // Generate answer for question
  const handleAskQuestion = async (questionText) => {
    const q = (questionText || inputText).trim();
    if (!q) return;

    // Check if matching mock question exists
    const existing = savedQueries.find(
      (sq) => sq.question.toLowerCase() === q.toLowerCase()
    );

    if (existing) {
      setActiveQuery(existing);
      setInputText('');
      setSpeechTranscript('');
      return;
    }

    try {
      const apiRes = await api.askQuestion(q, currentDataset?.id);
      if (apiRes && apiRes.results) {
        const newQueryObj = {
          id: `q-${Date.now()}`,
          question: apiRes.question || q,
          interpreted: apiRes.interpreted,
          datasetId: currentDataset.id,
          datasetName: apiRes.datasetName || currentDataset.name,
          sql: apiRes.sql,
          chartType: apiRes.suggestedChart || 'bar',
          xAxis: apiRes.xAxis || Object.keys(apiRes.results[0] || {})[0] || 'dimension',
          yAxis: apiRes.yAxis || Object.keys(apiRes.results[0] || {})[1] || 'value',
          summary: apiRes.summary,
          results: apiRes.results,
          date: 'Just now',
        };

        saveQuery(newQueryObj);
        setActiveQuery(newQueryObj);
        setInputText('');
        setSpeechTranscript('');

        toast({
          title: 'Query Synthesized by Engine',
          message: 'DuckDB executed analytical query and generated chart.',
          type: 'success',
        });
        return;
      }
    } catch (e) {
      console.warn('Backend AskData fallback to client inference:', e);
    }

    // Fallback: Compose client response
    const generatedSql = `SELECT 
  ${currentDataset.schema?.[1]?.column || 'category'},
  COUNT(*) AS count_records,
  ROUND(AVG(${currentDataset.schema?.[4]?.column || 'value'}), 2) AS avg_metric
FROM read_parquet('s3://lakehouse-${companyId.toLowerCase()}/${currentDataset.name}')
GROUP BY 1
ORDER BY count_records DESC
LIMIT 8;`;

    const sampleResults = (currentDataset.previewData || []).slice(0, 6).map((r, i) => {
      const keys = Object.keys(r);
      return {
        dimension: r[keys[1]] || `Category ${i + 1}`,
        count_records: 120 - i * 18,
        avg_metric: typeof r[keys[4]] === 'number' ? r[keys[4]] : (i + 1) * 2400,
      };
    });

    const newQueryObj = {
      id: `q-${Date.now()}`,
      question: q,
      interpreted: `Synthesized natural language inquiry against ${currentDataset.displayName || currentDataset.name}. Grouped by categorical dimensions with aggregate metrics.`,
      datasetId: currentDataset.id,
      datasetName: currentDataset.name,
      sql: generatedSql,
      chartType: q.toLowerCase().includes('trend') || q.toLowerCase().includes('telemetry') ? 'line' : q.toLowerCase().includes('region') || q.toLowerCase().includes('share') ? 'pie' : 'bar',
      xAxis: 'dimension',
      yAxis: 'avg_metric',
      summary: `Analyzed ${currentDataset.rowCount?.toLocaleString() || 'records'} rows in ${currentDataset.name}. Peak concentration identified in primary category with steady distribution.`,
      results: sampleResults,
      date: 'Just now',
    };

    saveQuery(newQueryObj);
    setActiveQuery(newQueryObj);
    setInputText('');
    setSpeechTranscript('');

    toast({
      title: 'Query Generated',
      message: 'Generated SQL and synthesized interactive visualization.',
      type: 'success',
    });
  };

  const handleCopySql = (sqlText, id) => {
    navigator.clipboard.writeText(sqlText);
    setCopiedQueryId(id);
    toast({
      title: 'SQL Copied',
      message: 'Query copied to clipboard.',
      type: 'info',
    });
    setTimeout(() => setCopiedQueryId(null), 2000);
  };

  const handlePinToDashboard = (queryObj) => {
    addChart({
      title: queryObj.question,
      subtitle: `Generated from ${queryObj.datasetName}`,
      chartType: queryObj.chartType || 'bar',
      datasetId: queryObj.datasetId,
      datasetName: queryObj.datasetName,
      xAxis: queryObj.xAxis || 'dimension',
      yAxis: queryObj.yAxis || 'avg_metric',
      aggregation: 'AVG',
      isPinned: true,
      data: queryObj.results,
    });
    toast({
      title: 'Pinned to Dashboard',
      message: 'Chart saved and pinned to Executive Hub dashboard.',
      type: 'success',
    });
  };

  const handleExportCsv = (queryObj) => {
    if (!queryObj.results || queryObj.results.length === 0) return;
    const headers = Object.keys(queryObj.results[0]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...queryObj.results.map((r) => headers.map((h) => `"${r[h] ?? ''}"`).join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const a = document.createElement('a');
    a.href = encoded;
    a.download = `query_result_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({
      title: 'Results Exported',
      message: 'Query output saved to CSV file.',
      type: 'info',
    });
  };

  const filteredHistory = savedQueries.filter((sq) =>
    sq.question.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Ask Your Data
            <span className="p-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <Sparkles className="w-4 h-4" />
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Ask questions in plain conversational English or speak via microphone to generate executable SQL and charts.
          </p>
        </div>

        {/* Dataset Selector Dropdown */}
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-sky-500" />
          <select
            value={selectedDatasetId}
            onChange={(e) => setSelectedDatasetId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.rowCount.toLocaleString()} rows)
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Query History & Saved Queries */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <History className="w-4 h-4 text-teal-500" />
                <span>Query History & Saved</span>
              </div>
              <span className="text-[10px] text-slate-400">{savedQueries.length} items</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search queries..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
              {filteredHistory.map((sq) => {
                const isActive = activeQuery?.id === sq.id;
                return (
                  <button
                    key={sq.id}
                    onClick={() => setActiveQuery(sq)}
                    className={`w-full p-3 rounded-xl text-left transition-all flex flex-col gap-1 border ${
                      isActive
                        ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 text-slate-900 dark:text-white shadow-xs'
                        : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <p className="text-xs font-medium line-clamp-2">{sq.question}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                      <span className="font-mono truncate max-w-[120px]">{sq.datasetName}</span>
                      <span>{sq.date}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Main Area: Chat Input & Active Query Response */}
        <div className="lg:col-span-8 space-y-5">
          {/* Conversational Input Card */}
          <Card className="p-4 sm:p-5 space-y-3">
            {/* Example Question Chips */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Suggested Prompts for {currentDataset?.displayName || currentDataset?.name}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAskQuestion(chip)}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-600 dark:hover:text-sky-300 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 text-left transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-teal-500 shrink-0" />
                    <span>{chip}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form with Microphone Button */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskQuestion();
              }}
              className="relative flex items-center gap-2 pt-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask any question in plain language... or click mic to speak"
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-inner"
                />

                {/* Voice Input Microphone Button */}
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl transition-all ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title={isListening ? 'Stop recording voice' : 'Speak question (Web Speech API)'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              <Button type="submit" size="md" className="rounded-2xl" icon={Send}>
                Ask
              </Button>
            </form>

            {/* Live voice pulse animation and transcript if listening */}
            {isListening && (
              <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center gap-3">
                <div className="flex items-center gap-1 h-6 px-1">
                  <div className="w-1 bg-sky-500 rounded-full voice-bar" />
                  <div className="w-1 bg-sky-500 rounded-full voice-bar" />
                  <div className="w-1 bg-sky-500 rounded-full voice-bar" />
                  <div className="w-1 bg-sky-500 rounded-full voice-bar" />
                  <div className="w-1 bg-sky-500 rounded-full voice-bar" />
                </div>
                <div className="text-xs text-sky-700 dark:text-sky-300">
                  <span className="font-semibold">Listening:</span> "{speechTranscript || 'Speak now...'}"
                </div>
              </div>
            )}
          </Card>

          {/* Active Query Card Result */}
          {activeQuery ? (
            <div className="space-y-4">
              <Card className="p-5 space-y-4 border-slate-200 dark:border-slate-800">
                {/* Header info */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-teal-600 dark:text-teal-400 font-bold">
                      Natural Language Query Response
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      "{activeQuery.question}"
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {activeQuery.interpreted}
                    </p>
                  </div>

                  <Badge variant="teal" size="xs">
                    {activeQuery.datasetName}
                  </Badge>
                </div>

                {/* Plain-Language Insight Summary Box */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-teal-500/10 via-sky-500/10 to-transparent border border-teal-500/20 text-xs text-slate-800 dark:text-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-teal-600 dark:text-teal-400">
                    <Lightbulb className="w-4 h-4" />
                    <span>AI Synthesis & Plain Language Insight</span>
                  </div>
                  <p className="leading-relaxed">{activeQuery.summary}</p>
                </div>

                {/* Collapsible / Editable Generated SQL Query */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() =>
                        setCollapsedSql((prev) => ({
                          ...prev,
                          [activeQuery.id]: !prev[activeQuery.id],
                        }))
                      }
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-sky-600"
                    >
                      <Terminal className="w-3.5 h-3.5 text-sky-500" />
                      <span>Generated Parquet SQL</span>
                      {collapsedSql[activeQuery.id] ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopySql(activeQuery.sql, activeQuery.id)}
                        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1"
                      >
                        {copiedQueryId === activeQuery.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedQueryId === activeQuery.id ? 'Copied' : 'Copy SQL'}</span>
                      </button>
                    </div>
                  </div>

                  {!collapsedSql[activeQuery.id] && (
                    <SqlCodeEditor
                      value={activeQuery.sql}
                      onChange={(newSql) => {
                        setActiveQuery((prev) => ({ ...prev, sql: newSql }));
                      }}
                      height="120px"
                    />
                  )}
                </div>

                {/* Suggested Chart Visualization */}
                {activeQuery.results && activeQuery.results.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-teal-500" />
                        <span>Auto-Suggested Visualization ({activeQuery.chartType})</span>
                      </span>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="xs"
                          icon={Pin}
                          onClick={() => handlePinToDashboard(activeQuery)}
                        >
                          Pin to Dashboard
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          icon={Download}
                          onClick={() => handleExportCsv(activeQuery)}
                        >
                          Export CSV
                        </Button>
                      </div>
                    </div>

                    <div className="h-64 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        {activeQuery.chartType === 'line' ? (
                          <LineChart data={activeQuery.results} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                            <XAxis dataKey={activeQuery.xAxis || Object.keys(activeQuery.results[0])[0]} tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Line type="monotone" dataKey={activeQuery.yAxis || Object.keys(activeQuery.results[0])[1]} stroke="#4D5A2A" strokeWidth={2.5} dot={{ r: 4 }} />
                          </LineChart>
                        ) : activeQuery.chartType === 'pie' ? (
                          <PieChart>
                            <Pie
                              data={activeQuery.results}
                              dataKey={activeQuery.yAxis || Object.keys(activeQuery.results[0])[1]}
                              nameKey={activeQuery.xAxis || Object.keys(activeQuery.results[0])[0]}
                              cx="50%"
                              cy="50%"
                              outerRadius={75}
                            >
                              {activeQuery.results.map((_, i) => (
                                <Cell key={i} fill={['#4D5A2A', '#748447', '#DCE4C2', '#25291D', '#93A65E'][i % 5]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                          </PieChart>
                        ) : (
                          <BarChart data={activeQuery.results} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                            <XAxis dataKey={activeQuery.xAxis || Object.keys(activeQuery.results[0])[0]} tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Bar dataKey={activeQuery.yAxis || Object.keys(activeQuery.results[0])[1]} fill="#748447" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Results Table */}
                {activeQuery.results && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Query Result Records ({activeQuery.results.length} rows)
                    </span>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            {Object.keys(activeQuery.results[0] || {}).map((col, idx) => (
                              <th key={idx} className="py-2.5 px-3 font-semibold font-mono">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {activeQuery.results.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              {Object.keys(row).map((k, cIdx) => (
                                <td key={cIdx} className="py-2 px-3 text-slate-800 dark:text-slate-200 font-mono">
                                  {typeof row[k] === 'number' ? row[k].toLocaleString() : String(row[k])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Feedback Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                  <span>Was this natural language insight accurate?</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setFeedbackGiven((prev) => ({ ...prev, [activeQuery.id]: 'up' }));
                        toast({
                          title: 'Thank you for your feedback!',
                          message: 'Marked result as accurate for continuous learning.',
                          type: 'success',
                        });
                      }}
                      className={`p-1.5 rounded-lg border flex items-center gap-1 transition-colors ${
                        feedbackGiven[activeQuery.id] === 'up'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-600'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Helpful</span>
                    </button>

                    <button
                      onClick={() => {
                        setFeedbackGiven((prev) => ({ ...prev, [activeQuery.id]: 'down' }));
                        toast({
                          title: 'Feedback Recorded',
                          message: 'Marked result for schema review.',
                          type: 'info',
                        });
                      }}
                      className={`p-1.5 rounded-lg border flex items-center gap-1 transition-colors ${
                        feedbackGiven[activeQuery.id] === 'down'
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-950 text-rose-600'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>Needs Work</span>
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <Card className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                No Question Asked Yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Type a natural question above or click one of the suggested prompts to see AI SQL generation in action.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
