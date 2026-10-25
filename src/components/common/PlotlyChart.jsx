import React, { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

export function PlotlyChart({ spec, className = 'w-full h-80' }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const renderChart = () => {
      if (!window.Plotly || !containerRef.current || !spec) return;

      const layout = {
        ...(spec.layout || {}),
        autosize: true,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(15,23,42,0.4)',
        font: { color: '#94a3b8', family: 'ui-sans-serif, system-ui, sans-serif' },
      };

      const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        toImageButtonOptions: {
          format: 'png',
          filename: 'lakehouse_plotly_chart',
          height: 500,
          width: 900,
          scale: 2,
        },
        ...(spec.config || {}),
      };

      try {
        window.Plotly.newPlot(containerRef.current, spec.data || [], layout, config);
        if (isMounted) setLoading(false);
      } catch (err) {
        console.error('Plotly render error:', err);
        if (isMounted) setError(err.message);
      }
    };

    if (window.Plotly) {
      renderChart();
    } else {
      // Load Plotly from CDN
      const existingScript = document.getElementById('plotly-cdn-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'plotly-cdn-script';
        script.src = 'https://cdn.plot.ly/plotly-2.35.2.min.js';
        script.async = true;
        script.onload = () => {
          if (isMounted) renderChart();
        };
        script.onerror = () => {
          if (isMounted) {
            setError('Could not load Plotly library. You can use the Matplotlib view.');
            setLoading(false);
          }
        };
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', renderChart);
      }
    }

    const handleResize = () => {
      if (window.Plotly && containerRef.current) {
        try {
          window.Plotly.Plots.resize(containerRef.current);
        } catch (e) {}
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      if (window.Plotly && containerRef.current) {
        try {
          window.Plotly.purge(containerRef.current);
        } catch (e) {}
      }
    };
  }, [spec]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-72 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 p-6 text-center">
        <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{error}</p>
        <p className="text-[11px] text-slate-400 mt-1">Please switch to the Matplotlib view to inspect this graphic.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/10 dark:bg-slate-950/40 rounded-xl z-10 backdrop-blur-xs">
          <div className="flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400 font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Rendering interactive Plotly visualization...</span>
          </div>
        </div>
      )}
      <div ref={containerRef} className={className} />
    </div>
  );
}
