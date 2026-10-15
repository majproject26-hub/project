import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_DATASETS,
  INITIAL_CHARTS,
  INITIAL_DASHBOARDS,
  INITIAL_AUDIT_LOGS,
  MOCK_ASK_QUESTIONS,
} from '../data/mockData';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

const DataContext = createContext();

export function DataProvider({ children }) {
  const { currentUser } = useAuth();
  const companyId = currentUser ? currentUser.companyId : 'ACME-001';
  const userRole = currentUser ? currentUser.role : 'STAFF';

  // Datasets
  const [datasets, setDatasets] = useState(() => {
    const saved = localStorage.getItem('lakehouse_datasets');
    return saved ? JSON.parse(saved) : INITIAL_DATASETS;
  });

  // Charts
  const [charts, setCharts] = useState(() => {
    const saved = localStorage.getItem('lakehouse_charts');
    return saved ? JSON.parse(saved) : INITIAL_CHARTS;
  });

  // Dashboards
  const [dashboards, setDashboards] = useState(() => {
    const saved = localStorage.getItem('lakehouse_dashboards');
    return saved ? JSON.parse(saved) : INITIAL_DASHBOARDS;
  });

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem('lakehouse_audits');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  // Query History & Saved Queries partitioned by active company
  const [savedQueries, setSavedQueries] = useState(() => {
    const saved = localStorage.getItem(`lakehouse_saved_queries_${companyId}`);
    if (saved) return JSON.parse(saved);
    return MOCK_ASK_QUESTIONS[companyId] || [];
  });

  useEffect(() => {
    const saved = localStorage.getItem(`lakehouse_saved_queries_${companyId}`);
    if (saved) {
      setSavedQueries(JSON.parse(saved));
    } else {
      setSavedQueries(MOCK_ASK_QUESTIONS[companyId] || []);
    }
  }, [companyId]);

  useEffect(() => {
    localStorage.setItem('lakehouse_datasets', JSON.stringify(datasets));
  }, [datasets]);

  useEffect(() => {
    localStorage.setItem('lakehouse_charts', JSON.stringify(charts));
  }, [charts]);

  useEffect(() => {
    localStorage.setItem('lakehouse_dashboards', JSON.stringify(dashboards));
  }, [dashboards]);

  useEffect(() => {
    localStorage.setItem('lakehouse_audits', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(`lakehouse_saved_queries_${companyId}`, JSON.stringify(savedQueries));
  }, [savedQueries, companyId]);

  // Sync state with FastAPI backend when company changes
  useEffect(() => {
    let isMounted = true;
    async function syncBackendData() {
      try {
        const [dsRes, chRes, dbRes, audRes] = await Promise.allSettled([
          api.getDatasets(),
          api.getCharts(),
          api.getDashboards(),
          api.getAuditLogs(),
        ]);

        if (!isMounted) return;

        if (dsRes.status === 'fulfilled' && dsRes.value?.datasets) {
          setDatasets((prev) => {
            const apiDs = dsRes.value.allCompanyDatasets || dsRes.value.datasets;
            const otherCompanies = prev.filter((d) => d.companyId !== companyId);
            return [...apiDs, ...otherCompanies];
          });
        }
        if (chRes.status === 'fulfilled' && chRes.value?.charts) {
          setCharts((prev) => {
            const apiCharts = chRes.value.charts.map((c) => {
              if (!c.data || !Array.isArray(c.data) || c.data.length === 0) {
                const existing = prev.find((p) => p.id === c.id) || INITIAL_CHARTS.find((p) => p.id === c.id);
                if (existing?.data) {
                  return { ...c, data: existing.data };
                }
              }
              return c;
            });
            const otherCompanies = prev.filter((c) => c.companyId !== companyId);
            return [...apiCharts, ...otherCompanies];
          });
        }
        if (dbRes.status === 'fulfilled' && dbRes.value?.dashboards) {
          setDashboards((prev) => {
            const otherCompanies = prev.filter((d) => d.companyId !== companyId);
            return [...dbRes.value.dashboards, ...otherCompanies];
          });
        }
        if (audRes.status === 'fulfilled' && audRes.value?.logs) {
          setAuditLogs((prev) => {
            const otherCompanies = prev.filter((a) => a.companyId !== companyId);
            return [...audRes.value.logs, ...otherCompanies];
          });
        }
      } catch (err) {
        console.warn('Backend initial sync fallback to local storage:', err);
      }
    }

    syncBackendData();
    return () => {
      isMounted = false;
    };
  }, [companyId]);

  // Filter datasets by company and permissions
  const companyDatasets = datasets.filter((d) => d.companyId === companyId);

  const permittedDatasets = companyDatasets.filter((d) => {
    if (userRole === 'ADMIN') return true;
    const level = d.accessLevel || 'All';
    if (level === 'Admin only') return false;
    if (userRole === 'HR') return level === 'All' || level === 'HR+Admin';
    if (userRole === 'STAFF') return level === 'All';
    return false;
  });

  // Filter charts and dashboards for active company
  const companyCharts = charts.filter((c) => c.companyId === companyId);
  const companyDashboards = dashboards.filter((db) => db.companyId === companyId);
  const companyAuditLogs = auditLogs.filter((a) => a.companyId === companyId);

  // Helper to log audit event
  const logEvent = ({ action, resource, details, status = 'Success' }) => {
    if (!currentUser) return;
    const newEntry = {
      id: `aud-${Date.now()}`,
      companyId: currentUser.companyId,
      timestamp:
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
        ' ' +
        new Date().toLocaleDateString(),
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      resource,
      details,
      ip: '127.0.0.1',
      status,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
    // Call backend
    api.logEvent({ action, resource, details, status }).catch(() => {});
  };

  // Dataset actions
  const addDataset = (dataset) => {
    const enriched = {
      ...dataset,
      id: dataset.id || `ds-${Date.now()}`,
      companyId: dataset.companyId || companyId,
      uploaderId: dataset.uploaderId || (currentUser ? currentUser.id : undefined),
      uploaderEmail: dataset.uploaderEmail || (currentUser ? currentUser.email : undefined),
      uploaderName: dataset.uploaderName || (currentUser ? currentUser.name : 'System Admin'),
      uploaderRole: dataset.uploaderRole || userRole,
      uploadDate: dataset.uploadDate || new Date().toISOString().split('T')[0],
      history: dataset.history || [
        {
          id: `v-${Date.now()}`,
          version: 'v1.0',
          author: currentUser ? currentUser.name : 'System',
          action: 'Initial Ingestion',
          date: new Date().toLocaleString(),
          comment: 'Ingested CSV and transformed to Parquet format.',
        },
      ],
    };
    setDatasets((prev) => [enriched, ...prev.filter((d) => d.id !== enriched.id)]);
    logEvent({
      action: 'Dataset Upload',
      resource: enriched.name,
      details: `Uploaded and converted to Parquet (${enriched.rowCount} rows).`,
    });
    return enriched;
  };

  const updateDataset = (id, updates) => {
    setDatasets((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
    api.updateDatasetMetadata(id, updates).catch((err) => console.warn('API updateDatasetMetadata:', err));
    logEvent({
      action: 'Dataset Modified',
      resource: id,
      details: `Updated metadata for dataset ${id}.`,
    });
  };

  const updateDatasetAccess = (id, newAccessLevel) => {
    const target = datasets.find((d) => d.id === id);
    setDatasets((prev) =>
      prev.map((d) => (d.id === id ? { ...d, accessLevel: newAccessLevel } : d))
    );
    api.updateDatasetAccess(id, newAccessLevel).catch((err) => console.warn('API updateDatasetAccess:', err));
    logEvent({
      action: 'Dataset Access Changed',
      resource: target ? target.name : id,
      details: `Admin changed dataset access permission to "${newAccessLevel}".`,
    });
  };

  const updateAllDatasetsAccess = (newAccessLevel) => {
    setDatasets((prev) =>
      prev.map((d) => (d.companyId === companyId ? { ...d, accessLevel: newAccessLevel } : d))
    );
    api.updateBulkDatasetAccess(newAccessLevel).catch((err) => console.warn('API updateBulkDatasetAccess:', err));
    logEvent({
      action: 'Bulk Dataset Access Changed',
      resource: `All ${companyId} Datasets`,
      details: `Admin changed visibility access for all datasets to "${newAccessLevel}".`,
    });
  };

  const canDeleteDataset = (dataset, user = currentUser) => {
    if (!user || !dataset) return false;
    if (user.role === 'ADMIN') return true;
    return (
      (dataset.uploaderId && user.id && dataset.uploaderId === user.id) ||
      (dataset.uploaderEmail && user.email && dataset.uploaderEmail.toLowerCase() === user.email.toLowerCase()) ||
      (dataset.uploaderName && user.name && dataset.uploaderName.toLowerCase() === user.name.toLowerCase())
    );
  };

  const deleteDataset = (id) => {
    const target = datasets.find((d) => d.id === id);
    if (!target) return false;

    if (!canDeleteDataset(target, currentUser)) {
      logEvent({
        action: 'Dataset Deletion Denied',
        resource: target.name,
        details: `Delete operation blocked: ${currentUser?.name || 'User'} is not an admin and was not the uploader of this dataset.`,
        status: 'Failed',
      });
      return false;
    }

    api.deleteDataset(id).catch((err) => console.warn('API deleteDataset:', err));

    setDatasets((prev) => prev.filter((d) => d.id !== id));
    logEvent({
      action: 'Dataset Deleted',
      resource: target.name,
      details: `${currentUser?.name} (${currentUser?.role === 'ADMIN' ? 'Administrator' : 'Uploader'}) permanently removed dataset from storage.`,
    });
    return true;
  };

  const deleteAllCompanyDatasets = () => {
    if (currentUser?.role !== 'ADMIN') return false;
    const targetCount = companyDatasets.length;
    api.deleteAllDatasets().catch((err) => console.warn('API deleteAllDatasets:', err));
    setDatasets((prev) => prev.filter((d) => d.companyId !== companyId));
    logEvent({
      action: 'All Datasets Deleted',
      resource: `All ${companyId} Datasets`,
      details: `Administrator ${currentUser?.name} deleted all ${targetCount} datasets for ${companyId}.`,
    });
    return true;
  };

  // Chart actions
  const addChart = (chart) => {
    const enriched = {
      ...chart,
      id: `ch-${Date.now()}`,
      companyId,
      isPinned: chart.isPinned || false,
    };
    setCharts((prev) => [enriched, ...prev]);
    api.createChart(chart).catch((err) => console.warn('API createChart:', err));
    logEvent({
      action: 'Chart Created',
      resource: enriched.title,
      details: `Created ${enriched.chartType} visualization for ${enriched.datasetName}.`,
    });
    return enriched;
  };

  const togglePinChart = (id) => {
    setCharts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
    api.togglePinChart(id).catch((err) => console.warn('API togglePinChart:', err));
  };

  const deleteChart = (id) => {
    setCharts((prev) => prev.filter((c) => c.id !== id));
    api.deleteChart(id).catch((err) => console.warn('API deleteChart:', err));
  };

  // Dashboard actions
  const addDashboard = (db) => {
    const enriched = {
      ...db,
      id: `dash-${Date.now()}`,
      companyId,
      updatedAt: new Date().toLocaleString(),
    };
    setDashboards((prev) => [enriched, ...prev]);
    api.createDashboard(db).catch((err) => console.warn('API createDashboard:', err));
    logEvent({
      action: 'Dashboard Created',
      resource: enriched.name,
      details: `Created new dashboard view with visibility ${enriched.visibility}.`,
    });
    return enriched;
  };

  const updateDashboard = (id, updates) => {
    setDashboards((prev) =>
      prev.map((db) => (db.id === id ? { ...db, ...updates, updatedAt: new Date().toLocaleString() } : db))
    );
    api.updateDashboard(id, updates).catch((err) => console.warn('API updateDashboard:', err));
  };

  const deleteDashboard = (id) => {
    setDashboards((prev) => prev.filter((db) => db.id !== id));
    api.deleteDashboard(id).catch((err) => console.warn('API deleteDashboard:', err));
  };

  // Query actions
  const saveQuery = (queryItem) => {
    const enriched = {
      ...queryItem,
      id: queryItem.id || `q-${Date.now()}`,
      companyId,
      date: 'Saved just now',
    };
    setSavedQueries((prev) => [enriched, ...prev.filter((q) => q.id !== enriched.id)]);
    api.saveQuery(enriched).catch((err) => console.warn('API saveQuery:', err));
    logEvent({
      action: 'Query Saved',
      resource: enriched.question || 'Custom SQL Query',
      details: 'Saved analytical query to library.',
    });
    return enriched;
  };

  const deleteSavedQuery = (id) => {
    setSavedQueries((prev) => prev.filter((q) => q.id !== id));
    api.deleteSavedQuery(id).catch((err) => console.warn('API deleteSavedQuery:', err));
  };

  return (
    <DataContext.Provider
      value={{
        datasets: permittedDatasets,
        allCompanyDatasets: companyDatasets,
        charts: companyCharts,
        dashboards: companyDashboards,
        auditLogs: companyAuditLogs,
        savedQueries,
        addDataset,
        updateDataset,
        updateDatasetAccess,
        updateAllDatasetsAccess,
        deleteDataset,
        deleteAllCompanyDatasets,
        canDeleteDataset,
        addChart,
        togglePinChart,
        deleteChart,
        addDashboard,
        updateDashboard,
        deleteDashboard,
        saveQuery,
        deleteSavedQuery,
        logEvent,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
