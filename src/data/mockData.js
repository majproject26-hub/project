// Comprehensive Data Lakehouse - Mock Data Store
// Realistic multi-company isolation for ACME-001 (Acme Technologies) and NOVA-002 (Nova Dynamics)

export const INITIAL_COMPANIES = {
  'ACME-001': {
    id: 'ACME-001',
    name: 'Acme Technologies Inc.',
    tagline: 'Enterprise Cloud & AI Solutions',
    industry: 'Enterprise Software & SaaS',
    timezone: 'America/New_York (EST)',
    logo: '⚡',
    createdDate: '2023-01-15',
    storageTier: 'Enterprise Lakehouse (50 TB)',
    defaultAccess: 'Public to Company',
    allowedRegistrationRoles: ['HR', 'STAFF'],
    dataRetentionDays: 365,
    autoArchiveParquet: true,
  },
  'NOVA-002': {
    id: 'NOVA-002',
    name: 'Nova Dynamics Global',
    tagline: 'Aerospace & Autonomous Systems',
    industry: 'Aerospace & Advanced Defense',
    timezone: 'America/Los_Angeles (PST)',
    logo: '🚀',
    createdDate: '2023-06-20',
    storageTier: 'Mission Critical Lakehouse (100 TB)',
    defaultAccess: 'Restricted (Admin approval)',
    allowedRegistrationRoles: ['STAFF'],
    dataRetentionDays: 730,
    autoArchiveParquet: true,
  }
};

export const INITIAL_USERS = [
  // ACME-001 Users
  {
    id: 'u-acme-1',
    companyId: 'ACME-001',
    name: 'Sarah Jenkins',
    email: 'sarah.admin@acme.io',
    password: 'password123',
    role: 'ADMIN',
    title: 'VP of Data Architecture',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    joinDate: '2023-02-01',
    lastActive: 'Just now',
    voiceLanguage: 'en-US',
  },
  {
    id: 'u-acme-2',
    companyId: 'ACME-001',
    name: 'David Chen',
    email: 'david.hr@acme.io',
    password: 'password123',
    role: 'HR',
    title: 'Senior People Analytics Lead',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    joinDate: '2023-04-12',
    lastActive: '12 mins ago',
    voiceLanguage: 'en-US',
  },
  {
    id: 'u-acme-3',
    companyId: 'ACME-001',
    name: 'Maya Patel',
    email: 'maya.staff@acme.io',
    password: 'password123',
    role: 'STAFF',
    title: 'Financial Revenue Analyst',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    joinDate: '2023-08-20',
    lastActive: '1 hour ago',
    voiceLanguage: 'en-US',
  },
  {
    id: 'u-acme-4',
    companyId: 'ACME-001',
    name: 'Robert Taylor',
    email: 'robert.taylor@acme.io',
    password: 'password123',
    role: 'HR',
    title: 'Compensation Consultant',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'PENDING',
    joinDate: '2026-10-08',
    lastActive: 'Pending approval',
    voiceLanguage: 'en-US',
  },
  {
    id: 'u-acme-5',
    companyId: 'ACME-001',
    name: 'Kevin Vance',
    email: 'kevin.rejected@external.com',
    password: 'password123',
    role: 'STAFF',
    title: 'Contractor',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    status: 'REJECTED',
    rejectionReason: 'Non-corporate email domain domain is not permitted for Acme Lakehouse access.',
    joinDate: '2026-10-02',
    lastActive: 'Rejected',
    voiceLanguage: 'en-US',
  },

  // NOVA-002 Users
  {
    id: 'u-nova-1',
    companyId: 'NOVA-002',
    name: 'Dr. Alex Vance',
    email: 'alex.admin@nova.space',
    password: 'password123',
    role: 'ADMIN',
    title: 'Chief Lakehouse Architect & Director',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    joinDate: '2023-07-01',
    lastActive: 'Just now',
    voiceLanguage: 'en-US',
  },
  {
    id: 'u-nova-2',
    companyId: 'NOVA-002',
    name: 'Elena Rostova',
    email: 'elena.hr@nova.space',
    password: 'password123',
    role: 'HR',
    title: 'Director of Aerospace Operations Talent',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    joinDate: '2023-09-15',
    lastActive: '45 mins ago',
    voiceLanguage: 'en-GB',
  },
  {
    id: 'u-nova-3',
    companyId: 'NOVA-002',
    name: 'Liam O\'Connor',
    email: 'liam.staff@nova.space',
    password: 'password123',
    role: 'STAFF',
    title: 'Orbital Telemetry Systems Specialist',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    joinDate: '2024-01-10',
    lastActive: '3 hours ago',
    voiceLanguage: 'en-US',
  },
  {
    id: 'u-nova-4',
    companyId: 'NOVA-002',
    name: 'Sophia Kim',
    email: 'sophia.kim@nova.space',
    password: 'password123',
    role: 'STAFF',
    title: 'Guidance Sensor Researcher',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    status: 'PENDING',
    joinDate: '2026-10-07',
    lastActive: 'Pending approval',
    voiceLanguage: 'en-US',
  },
  {
    id: 'u-nova-5',
    companyId: 'NOVA-002',
    name: 'Marcus Brody',
    email: 'marcus.brody@nova.space',
    password: 'password123',
    role: 'STAFF',
    title: 'Former Flight Test Analyst',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    status: 'DEACTIVATED',
    joinDate: '2023-11-05',
    lastActive: 'Deactivated on 2026-09-30',
    voiceLanguage: 'en-US',
  }
];

// Realistic Sample Row Records for Interactive Datasets
export const SAMPLE_EMPLOYEES_DATA = [
  { id: 'EMP-101', name: 'John Doe', department: 'Engineering', role: 'Staff Backend Eng', salary: 145000, tenure_years: 4.2, rating: 4.8, location: 'San Francisco, CA', status: 'Full-Time' },
  { id: 'EMP-102', name: 'Alicia Keys', department: 'Sales', role: 'Strategic Enterprise AE', salary: 132000, tenure_years: 2.8, rating: 4.5, location: 'New York, NY', status: 'Full-Time' },
  { id: 'EMP-103', name: 'Michael Chang', department: 'Product', role: 'Principal Product Mgr', salary: 168000, tenure_years: 5.1, rating: 4.9, location: 'Seattle, WA', status: 'Full-Time' },
  { id: 'EMP-104', name: 'Priya Sharma', department: 'Engineering', role: 'Senior ML Engineer', salary: 158000, tenure_years: 3.0, rating: 4.7, location: 'San Francisco, CA', status: 'Full-Time' },
  { id: 'EMP-105', name: 'Carlos Morales', department: 'Customer Success', role: 'Enterprise CSM Lead', salary: 98000, tenure_years: 2.1, rating: 4.3, location: 'Austin, TX', status: 'Full-Time' },
  { id: 'EMP-106', name: 'Emma Watson', department: 'Marketing', role: 'Head of Growth Marketing', salary: 125000, tenure_years: 3.7, rating: 4.6, location: 'New York, NY', status: 'Full-Time' },
  { id: 'EMP-107', name: 'Derrick Ross', department: 'Finance', role: 'Senior FP&A Analyst', salary: 112000, tenure_years: 1.8, rating: 4.2, location: 'Chicago, IL', status: 'Full-Time' },
  { id: 'EMP-108', name: 'Samantha Miller', department: 'Engineering', role: 'DevOps & Infra Architect', salary: 172000, tenure_years: 6.0, rating: 4.9, location: 'Remote', status: 'Full-Time' },
  { id: 'EMP-109', name: 'Brian O\'Neal', department: 'Sales', role: 'Mid-Market Account Exec', salary: 105000, tenure_years: 1.5, rating: 4.0, location: 'Boston, MA', status: 'Full-Time' },
  { id: 'EMP-110', name: 'Zoe Kravitz', department: 'Design', role: 'Lead Design Systems UI', salary: 130000, tenure_years: 3.4, rating: 4.8, location: 'San Francisco, CA', status: 'Full-Time' },
  { id: 'EMP-111', name: 'Kenji Sato', department: 'Engineering', role: 'Senior Frontend Eng', salary: 140000, tenure_years: 2.9, rating: 4.6, location: 'Remote', status: 'Full-Time' },
  { id: 'EMP-112', name: 'Laura Bailey', department: 'Human Resources', role: 'Senior Talent Partner', salary: 102000, tenure_years: 3.2, rating: 4.4, location: 'Denver, CO', status: 'Full-Time' },
];

export const SAMPLE_SALES_DATA = [
  { deal_id: 'DL-901', account_name: 'Stark Logistics', region: 'North America', deal_size: 240000, product_line: 'Lakehouse Cloud', sales_rep: 'Alicia Keys', close_date: '2026-08-14', status: 'Closed Won' },
  { deal_id: 'DL-902', account_name: 'Helios Financial', region: 'EMEA', deal_size: 185000, product_line: 'Enterprise Engine', sales_rep: 'Brian O\'Neal', close_date: '2026-08-20', status: 'Closed Won' },
  { deal_id: 'DL-903', account_name: 'Oasis Biotech', region: 'North America', deal_size: 320000, product_line: 'Lakehouse Cloud', sales_rep: 'Alicia Keys', close_date: '2026-09-02', status: 'Closed Won' },
  { deal_id: 'DL-904', account_name: 'Tokyo Tech Corp', region: 'APAC', deal_size: 95000, product_line: 'Vector Analytics', sales_rep: 'Kenji Sato', close_date: '2026-09-11', status: 'In Pipeline' },
  { deal_id: 'DL-905', account_name: 'Nordic Clean Energy', region: 'EMEA', deal_size: 210000, product_line: 'Enterprise Engine', sales_rep: 'Brian O\'Neal', close_date: '2026-09-18', status: 'Closed Won' },
  { deal_id: 'DL-906', account_name: 'Apex Health Systems', region: 'North America', deal_size: 450000, product_line: 'Lakehouse Cloud', sales_rep: 'Alicia Keys', close_date: '2026-09-25', status: 'Closed Won' },
  { deal_id: 'DL-907', account_name: 'Sao Paulo Retailers', region: 'LATAM', deal_size: 78000, product_line: 'Vector Analytics', sales_rep: 'Carlos Morales', close_date: '2026-10-01', status: 'Contract Sent' },
  { deal_id: 'DL-908', account_name: 'Bavaria Automotive', region: 'EMEA', deal_size: 390000, product_line: 'Lakehouse Cloud', sales_rep: 'Brian O\'Neal', close_date: '2026-10-04', status: 'Closed Won' },
];

export const SAMPLE_CHURN_DATA = [
  { customer_id: 'CST-401', company_name: 'CloudSync IO', mrr: 12000, nps_score: 9, health_score: 94, risk_level: 'Low', renewal_month: 'Nov 2026', csm: 'Carlos Morales' },
  { customer_id: 'CST-402', company_name: 'Vortex Logistics', mrr: 28000, nps_score: 6, health_score: 61, risk_level: 'High', renewal_month: 'Dec 2026', csm: 'Carlos Morales' },
  { customer_id: 'CST-403', company_name: 'Pulse Media', mrr: 8500, nps_score: 10, health_score: 98, risk_level: 'Low', renewal_month: 'Jan 2027', csm: 'Carlos Morales' },
  { customer_id: 'CST-404', company_name: 'Delta Cyber', mrr: 34000, nps_score: 7, health_score: 72, risk_level: 'Medium', renewal_month: 'Feb 2027', csm: 'Carlos Morales' },
  { customer_id: 'CST-405', company_name: 'Quantum Bio', mrr: 45000, nps_score: 9, health_score: 92, risk_level: 'Low', renewal_month: 'Mar 2027', csm: 'Carlos Morales' },
];

export const SAMPLE_HARDWARE_DATA = [
  { sku: 'AV-7001', component_name: 'StarTracker Optic v4', category: 'Sensors', warehouse_id: 'WH-Mojave', stock_qty: 48, unit_cost: 14200, lead_days: 21, status: 'Optimal' },
  { sku: 'AV-7002', component_name: 'Ion Thruster Valve B', category: 'Propulsion', warehouse_id: 'WH-Kenedy', stock_qty: 12, unit_cost: 28900, lead_days: 45, status: 'Low Stock' },
  { sku: 'AV-7003', component_name: 'Gallium Nitride Solar Wing', category: 'Power', warehouse_id: 'WH-Mojave', stock_qty: 85, unit_cost: 8400, lead_days: 14, status: 'Optimal' },
  { sku: 'AV-7004', component_name: 'Rad-Hard Flight Computer', category: 'Avionics', warehouse_id: 'WH-Seattle', stock_qty: 6, unit_cost: 54000, lead_days: 60, status: 'Critical' },
  { sku: 'AV-7005', component_name: 'S-Band Transceiver Matrix', category: 'Comms', warehouse_id: 'WH-Kenedy', stock_qty: 34, unit_cost: 11500, lead_days: 18, status: 'Optimal' },
  { sku: 'AV-7006', component_name: 'Reaction Wheel Gyro 20Nms', category: 'Attitude Control', warehouse_id: 'WH-Mojave', stock_qty: 19, unit_cost: 32000, lead_days: 30, status: 'Reorder' },
];

export const SAMPLE_TELEMETRY_DATA = [
  { packet_id: 'PKT-9921', satellite_id: 'NOVA-SAT-01', orbital_altitude_km: 542.4, velocity_km_s: 7.62, solar_temp_c: 44.2, battery_soc_pct: 92.1, status: 'Nominal' },
  { packet_id: 'PKT-9922', satellite_id: 'NOVA-SAT-02', orbital_altitude_km: 550.1, velocity_km_s: 7.59, solar_temp_c: 51.8, battery_soc_pct: 88.4, status: 'Nominal' },
  { packet_id: 'PKT-9923', satellite_id: 'NOVA-SAT-03', orbital_altitude_km: 538.9, velocity_km_s: 7.64, solar_temp_c: 68.4, battery_soc_pct: 71.0, status: 'Warning' },
  { packet_id: 'PKT-9924', satellite_id: 'NOVA-SAT-04', orbital_altitude_km: 545.2, velocity_km_s: 7.61, solar_temp_c: 42.1, battery_soc_pct: 94.8, status: 'Nominal' },
  { packet_id: 'PKT-9925', satellite_id: 'NOVA-SAT-05', orbital_altitude_km: 541.0, velocity_km_s: 7.63, solar_temp_c: 46.5, battery_soc_pct: 90.2, status: 'Nominal' },
];

export const INITIAL_DATASETS = [
  // ACME-001 Datasets
  {
    id: 'ds-acme-1',
    companyId: 'ACME-001',
    name: 'acme_employees_2025.parquet',
    displayName: 'Global Employee Directory & Compensation',
    description: 'Comprehensive workforce dataset including engineering, sales, department hierarchy, salaries, and performance ratings.',
    format: 'Parquet (Snappy)',
    size: '4.2 MB',
    rowCount: 64280,
    colCount: 9,
    compressionRatio: '68% (vs CSV)',
    accessLevel: 'HR+Admin',
    uploaderName: 'David Chen',
    uploaderRole: 'HR',
    uploadDate: '2026-09-14',
    tags: ['workforce', 'salaries', 'hr', 'ratings', 'compensation'],
    previewData: SAMPLE_EMPLOYEES_DATA,
    schema: [
      { column: 'id', type: 'VARCHAR(16)', nullCount: 0, nullPct: '0.0%', uniqueCount: 64280, sample: 'EMP-101' },
      { column: 'name', type: 'VARCHAR(64)', nullCount: 0, nullPct: '0.0%', uniqueCount: 63900, sample: 'John Doe' },
      { column: 'department', type: 'VARCHAR(32)', nullCount: 0, nullPct: '0.0%', uniqueCount: 8, sample: 'Engineering' },
      { column: 'role', type: 'VARCHAR(64)', nullCount: 0, nullPct: '0.0%', uniqueCount: 42, sample: 'Staff Backend Eng' },
      { column: 'salary', type: 'INTEGER', nullCount: 0, nullPct: '0.0%', uniqueCount: 1450, sample: '145000' },
      { column: 'tenure_years', type: 'FLOAT', nullCount: 12, nullPct: '0.02%', uniqueCount: 88, sample: '4.2' },
      { column: 'rating', type: 'FLOAT', nullCount: 40, nullPct: '0.06%', uniqueCount: 25, sample: '4.8' },
      { column: 'location', type: 'VARCHAR(64)', nullCount: 0, nullPct: '0.0%', uniqueCount: 14, sample: 'San Francisco, CA' },
      { column: 'status', type: 'VARCHAR(24)', nullCount: 0, nullPct: '0.0%', uniqueCount: 3, sample: 'Full-Time' },
    ],
    columnStats: [
      { column: 'salary', min: 65000, max: 210000, mean: 132400, stdDev: 24500, distribution: [
        { label: '<$80k', value: 8500 },
        { label: '$80k-$110k', value: 16200 },
        { label: '$110k-$140k', value: 23100 },
        { label: '$140k-$170k', value: 12800 },
        { label: '$170k+', value: 3680 }
      ]},
      { column: 'rating', min: 3.1, max: 5.0, mean: 4.52, stdDev: 0.38, distribution: [
        { label: '3.0-3.5', value: 3200 },
        { label: '3.5-4.0', value: 9400 },
        { label: '4.0-4.5', value: 24600 },
        { label: '4.5-5.0', value: 27080 }
      ]},
      { column: 'department', uniqueCount: 8, distribution: [
        { label: 'Engineering', value: 28400 },
        { label: 'Sales', value: 14200 },
        { label: 'Product', value: 6800 },
        { label: 'Marketing', value: 5200 },
        { label: 'Customer Success', value: 4900 },
        { label: 'Finance', value: 2600 },
        { label: 'Design', value: 1300 },
        { label: 'HR', value: 880 }
      ]}
    ],
    history: [
      { id: 'v-3', version: 'v1.2', author: 'David Chen', action: 'Schema Update', date: '2026-09-14 14:20', comment: 'Added location column and converted to Snappy Parquet.' },
      { id: 'v-2', version: 'v1.1', author: 'Sarah Jenkins', action: 'Indexing Optimized', date: '2026-09-02 09:12', comment: 'Created Z-Order clustering on department and salary.' },
      { id: 'v-1', version: 'v1.0', author: 'David Chen', action: 'Initial Ingestion', date: '2026-08-28 11:45', comment: 'Uploaded raw CSV and converted to Lakehouse Delta/Parquet.' },
    ]
  },
  {
    id: 'ds-acme-2',
    companyId: 'ACME-001',
    name: 'q3_global_sales_revenue.parquet',
    displayName: 'Q3 Enterprise Sales Pipeline & Revenue',
    description: 'Closed-won deals, deal sizes, account names, sales reps, and regional revenue breakdown for Q3 fiscal reporting.',
    format: 'Parquet (ZSTD)',
    size: '8.6 MB',
    rowCount: 128450,
    colCount: 8,
    compressionRatio: '74% (vs CSV)',
    accessLevel: 'All',
    uploaderName: 'Sarah Jenkins',
    uploaderRole: 'ADMIN',
    uploadDate: '2026-10-02',
    tags: ['sales', 'pipeline', 'deals', 'revenue', 'q3', 'finance'],
    previewData: SAMPLE_SALES_DATA,
    schema: [
      { column: 'deal_id', type: 'VARCHAR(16)', nullCount: 0, nullPct: '0.0%', uniqueCount: 128450, sample: 'DL-901' },
      { column: 'account_name', type: 'VARCHAR(64)', nullCount: 0, nullPct: '0.0%', uniqueCount: 3200, sample: 'Stark Logistics' },
      { column: 'region', type: 'VARCHAR(24)', nullCount: 0, nullPct: '0.0%', uniqueCount: 4, sample: 'North America' },
      { column: 'deal_size', type: 'INTEGER', nullCount: 0, nullPct: '0.0%', uniqueCount: 840, sample: '240000' },
      { column: 'product_line', type: 'VARCHAR(32)', nullCount: 0, nullPct: '0.0%', uniqueCount: 5, sample: 'Lakehouse Cloud' },
      { column: 'sales_rep', type: 'VARCHAR(48)', nullCount: 0, nullPct: '0.0%', uniqueCount: 48, sample: 'Alicia Keys' },
      { column: 'close_date', type: 'DATE', nullCount: 0, nullPct: '0.0%', uniqueCount: 92, sample: '2026-08-14' },
      { column: 'status', type: 'VARCHAR(20)', nullCount: 0, nullPct: '0.0%', uniqueCount: 4, sample: 'Closed Won' },
    ],
    columnStats: [
      { column: 'deal_size', min: 25000, max: 750000, mean: 218000, stdDev: 89000, distribution: [
        { label: '<$100k', value: 24000 },
        { label: '$100k-$250k', value: 58000 },
        { label: '$250k-$500k', value: 34000 },
        { label: '$500k+', value: 12450 }
      ]},
      { column: 'region', uniqueCount: 4, distribution: [
        { label: 'North America', value: 58000 },
        { label: 'EMEA', value: 38450 },
        { label: 'APAC', value: 21000 },
        { label: 'LATAM', value: 11000 }
      ]}
    ],
    history: [
      { id: 'v-1', version: 'v1.0', author: 'Sarah Jenkins', action: 'Initial Ingestion', date: '2026-10-02 18:30', comment: 'Synced from Salesforce lakehouse ingest connector.' }
    ]
  },
  {
    id: 'ds-acme-3',
    companyId: 'ACME-001',
    name: 'customer_churn_analytics.parquet',
    displayName: 'Customer Churn & Health Risk Metrics',
    description: 'Account risk telemetry, Net Promoter Score, Monthly Recurring Revenue, and CSM assignments for active cohorts.',
    format: 'Parquet (Snappy)',
    size: '3.1 MB',
    rowCount: 42100,
    colCount: 8,
    compressionRatio: '65% (vs CSV)',
    accessLevel: 'All',
    uploaderName: 'Maya Patel',
    uploaderRole: 'STAFF',
    uploadDate: '2026-09-28',
    tags: ['churn', 'customer_success', 'mrr', 'retention', 'saas'],
    previewData: SAMPLE_CHURN_DATA,
    schema: [
      { column: 'customer_id', type: 'VARCHAR(16)', nullCount: 0, nullPct: '0.0%', uniqueCount: 42100, sample: 'CST-401' },
      { column: 'company_name', type: 'VARCHAR(64)', nullCount: 0, nullPct: '0.0%', uniqueCount: 42100, sample: 'CloudSync IO' },
      { column: 'mrr', type: 'INTEGER', nullCount: 0, nullPct: '0.0%', uniqueCount: 920, sample: '12000' },
      { column: 'nps_score', type: 'INTEGER', nullCount: 50, nullPct: '0.1%', uniqueCount: 11, sample: '9' },
      { column: 'health_score', type: 'INTEGER', nullCount: 0, nullPct: '0.0%', uniqueCount: 90, sample: '94' },
      { column: 'risk_level', type: 'VARCHAR(16)', nullCount: 0, nullPct: '0.0%', uniqueCount: 3, sample: 'Low' },
      { column: 'renewal_month', type: 'VARCHAR(16)', nullCount: 0, nullPct: '0.0%', uniqueCount: 12, sample: 'Nov 2026' },
      { column: 'csm', type: 'VARCHAR(48)', nullCount: 0, nullPct: '0.0%', uniqueCount: 16, sample: 'Carlos Morales' },
    ],
    columnStats: [
      { column: 'health_score', min: 28, max: 100, mean: 84.2, stdDev: 12.1, distribution: [
        { label: '0-50 (Critical)', value: 3100 },
        { label: '51-75 (At Risk)', value: 7800 },
        { label: '76-90 (Good)', value: 16400 },
        { label: '91-100 (Champion)', value: 14800 }
      ]}
    ],
    history: [
      { id: 'v-1', version: 'v1.0', author: 'Maya Patel', action: 'Initial Ingestion', date: '2026-09-28 10:15', comment: 'Imported from CS telemetry database.' }
    ]
  },

  // NOVA-002 Datasets
  {
    id: 'ds-nova-1',
    companyId: 'NOVA-002',
    name: 'nova_hardware_inventory.parquet',
    displayName: 'Spacecraft Avionics & Hardware Inventory',
    description: 'Warehouse components, flight computer stocks, optical sensors, radiation-hardened parts, and lead time logistics.',
    format: 'Parquet (Snappy)',
    size: '3.9 MB',
    rowCount: 54200,
    colCount: 8,
    compressionRatio: '71% (vs CSV)',
    accessLevel: 'All',
    uploaderName: 'Dr. Alex Vance',
    uploaderRole: 'ADMIN',
    uploadDate: '2026-09-18',
    tags: ['aerospace', 'hardware', 'inventory', 'warehouse', 'avionics'],
    previewData: SAMPLE_HARDWARE_DATA,
    schema: [
      { column: 'sku', type: 'VARCHAR(16)', nullCount: 0, nullPct: '0.0%', uniqueCount: 54200, sample: 'AV-7001' },
      { column: 'component_name', type: 'VARCHAR(64)', nullCount: 0, nullPct: '0.0%', uniqueCount: 8900, sample: 'StarTracker Optic v4' },
      { column: 'category', type: 'VARCHAR(32)', nullCount: 0, nullPct: '0.0%', uniqueCount: 8, sample: 'Sensors' },
      { column: 'warehouse_id', type: 'VARCHAR(24)', nullCount: 0, nullPct: '0.0%', uniqueCount: 4, sample: 'WH-Mojave' },
      { column: 'stock_qty', type: 'INTEGER', nullCount: 0, nullPct: '0.0%', uniqueCount: 240, sample: '48' },
      { column: 'unit_cost', type: 'INTEGER', nullCount: 0, nullPct: '0.0%', uniqueCount: 1200, sample: '14200' },
      { column: 'lead_days', type: 'INTEGER', nullCount: 0, nullPct: '0.0%', uniqueCount: 45, sample: '21' },
      { column: 'status', type: 'VARCHAR(16)', nullCount: 0, nullPct: '0.0%', uniqueCount: 4, sample: 'Optimal' },
    ],
    columnStats: [
      { column: 'unit_cost', min: 1200, max: 98000, mean: 24500, stdDev: 14200, distribution: [
        { label: '<$10k', value: 16500 },
        { label: '$10k-$25k', value: 21400 },
        { label: '$25k-$50k', value: 11800 },
        { label: '$50k+', value: 4500 }
      ]}
    ],
    history: [
      { id: 'v-1', version: 'v1.0', author: 'Dr. Alex Vance', action: 'Initial Ingestion', date: '2026-09-18 08:00', comment: 'Inventory ERP batch export.' }
    ]
  },
  {
    id: 'ds-nova-2',
    companyId: 'NOVA-002',
    name: 'orbital_telemetry_logs.parquet',
    displayName: 'Orbital Constellation Live Telemetry Logs',
    description: 'High-frequency telemetry stream from low-earth orbit satellites: altitude, velocity, battery state of charge, and solar panel thermals.',
    format: 'Parquet (ZSTD)',
    size: '19.4 MB',
    rowCount: 310000,
    colCount: 7,
    compressionRatio: '81% (vs CSV)',
    accessLevel: 'All',
    uploaderName: 'Liam O\'Connor',
    uploaderRole: 'STAFF',
    uploadDate: '2026-10-05',
    tags: ['telemetry', 'satellites', 'orbit', 'sensors', 'flight'],
    previewData: SAMPLE_TELEMETRY_DATA,
    schema: [
      { column: 'packet_id', type: 'VARCHAR(16)', nullCount: 0, nullPct: '0.0%', uniqueCount: 310000, sample: 'PKT-9921' },
      { column: 'satellite_id', type: 'VARCHAR(24)', nullCount: 0, nullPct: '0.0%', uniqueCount: 12, sample: 'NOVA-SAT-01' },
      { column: 'orbital_altitude_km', type: 'FLOAT', nullCount: 0, nullPct: '0.0%', uniqueCount: 890, sample: '542.4' },
      { column: 'velocity_km_s', type: 'FLOAT', nullCount: 0, nullPct: '0.0%', uniqueCount: 140, sample: '7.62' },
      { column: 'solar_temp_c', type: 'FLOAT', nullCount: 0, nullPct: '0.0%', uniqueCount: 420, sample: '44.2' },
      { column: 'battery_soc_pct', type: 'FLOAT', nullCount: 0, nullPct: '0.0%', uniqueCount: 350, sample: '92.1' },
      { column: 'status', type: 'VARCHAR(16)', nullCount: 0, nullPct: '0.0%', uniqueCount: 3, sample: 'Nominal' },
    ],
    columnStats: [
      { column: 'solar_temp_c', min: -20.5, max: 92.4, mean: 47.8, stdDev: 14.5, distribution: [
        { label: '<30°C', value: 42000 },
        { label: '30-50°C', value: 168000 },
        { label: '50-70°C', value: 84000 },
        { label: '>70°C (High)', value: 16000 }
      ]}
    ],
    history: [
      { id: 'v-1', version: 'v1.0', author: 'Liam O\'Connor', action: 'Live Lakehouse Stream', date: '2026-10-05 21:00', comment: 'Streaming parquet ingestion.' }
    ]
  }
];

// Preset Sample Files for Upload Playground
export const PRESET_CSV_FILES = [
  {
    name: 'employee_salaries_q4.csv',
    size: '1.8 MB',
    rowCount: 2450,
    headers: ['employee_id', 'full_name', 'department', 'base_salary', 'bonus_pct', 'hire_date', 'performance_band'],
    sampleRows: [
      ['EMP-8821', 'Claire Underwood', 'Finance', '142000', '15.0', '2022-04-10', 'Band 4 (Exceeds)'],
      ['EMP-8822', 'Tyler Durden', 'Operations', '98000', '10.0', '2023-01-15', 'Band 3 (Meets)'],
      ['EMP-8823', 'Dana Scully', 'R&D', '165000', '18.5', '2021-08-20', 'Band 5 (Top 5%)'],
      ['EMP-8824', 'Fox Mulder', 'Investigations', '120000', '12.0', '2022-11-01', 'Band 4 (Exceeds)'],
      ['EMP-8825', 'Walter White', 'Chemical Engineering', '178000', '22.0', '2020-05-18', 'Band 5 (Top 5%)']
    ]
  },
  {
    name: 'sales_pipeline_deals.csv',
    size: '2.4 MB',
    rowCount: 4890,
    headers: ['opportunity_id', 'customer_name', 'deal_val_usd', 'sales_stage', 'close_probability', 'lead_source'],
    sampleRows: [
      ['OPP-4101', 'Acme Logistics', '320000', 'Negotiation', '85%', 'Enterprise Partner'],
      ['OPP-4102', 'Zenith Retail', '145000', 'Proposal Sent', '60%', 'Inbound Web'],
      ['OPP-4103', 'Omni Corp', '620000', 'Closed Won', '100%', 'Direct Sales'],
      ['OPP-4104', 'Veritas Bio', '210000', 'Discovery', '35%', 'Outbound Campaign'],
      ['OPP-4105', 'Nova Energy', '480000', 'Contract Review', '90%', 'Executive Referral']
    ]
  },
  {
    name: 'warehouse_parts_supply.csv',
    size: '1.2 MB',
    rowCount: 1850,
    headers: ['part_number', 'description', 'unit_cost', 'quantity_on_hand', 'reorder_point', 'vendor_code'],
    sampleRows: [
      ['PN-9901', 'Silicon Carbide Power MOSFET', '84.50', '320', '50', 'VND-TEXAS'],
      ['PN-9902', 'High-Temp Thermal Blanket', '412.00', '48', '15', 'VND-AERO'],
      ['PN-9903', 'FPGA Accelerator Module', '1250.00', '18', '5', 'VND-XILINX'],
      ['PN-9904', 'Titanium Fastener Array (x100)', '195.00', '140', '30', 'VND-PREC'],
      ['PN-9905', 'Lithium-Sulfate Cell 18650', '32.00', '850', '200', 'VND-BATT']
    ]
  }
];

// Pre-packaged Ask-Your-Data Question / Answer Scenarios
export const MOCK_ASK_QUESTIONS = {
  'ACME-001': [
    {
      id: 'q-acme-1',
      question: 'What is the average salary and employee count by department?',
      interpreted: 'Calculates the arithmetic mean of employee compensation and count of records grouped by department hierarchy.',
      datasetId: 'ds-acme-1',
      datasetName: 'acme_employees_2025.parquet',
      sql: `SELECT 
  department,
  COUNT(*) AS employee_count,
  ROUND(AVG(salary), 2) AS avg_salary,
  MAX(salary) AS max_salary
FROM read_parquet('s3://lakehouse-acme/acme_employees_2025.parquet')
GROUP BY department
ORDER BY avg_salary DESC;`,
      chartType: 'bar',
      xAxis: 'department',
      yAxis: 'avg_salary',
      summary: 'Engineering commands the highest compensation average ($153,750 with 28,400 staff), followed by Product ($168,000 avg) and Management. HR and Customer Success have the lowest salary spread with high retention.',
      results: [
        { department: 'Product', employee_count: 6800, avg_salary: 168000, max_salary: 210000 },
        { department: 'Engineering', employee_count: 28400, avg_salary: 153750, max_salary: 205000 },
        { department: 'Design', employee_count: 1300, avg_salary: 130000, max_salary: 165000 },
        { department: 'Sales', employee_count: 14200, avg_salary: 118500, max_salary: 195000 },
        { department: 'Marketing', employee_count: 5200, avg_salary: 125000, max_salary: 170000 },
        { department: 'Finance', employee_count: 2600, avg_salary: 112000, max_salary: 155000 },
        { department: 'HR', employee_count: 880, avg_salary: 102000, max_salary: 140000 },
        { department: 'Customer Success', employee_count: 4900, avg_salary: 98000, max_salary: 135000 }
      ],
      date: 'Today at 10:14 AM'
    },
    {
      id: 'q-acme-2',
      question: 'Show closed deal revenue breakdown by region for Q3',
      interpreted: 'Aggregates total closed-won contract value partitioned across regional market segments.',
      datasetId: 'ds-acme-2',
      datasetName: 'q3_global_sales_revenue.parquet',
      sql: `SELECT 
  region,
  COUNT(deal_id) AS total_deals,
  SUM(deal_size) AS total_revenue
FROM read_parquet('s3://lakehouse-acme/q3_global_sales_revenue.parquet')
WHERE status = 'Closed Won'
GROUP BY region
ORDER BY total_revenue DESC;`,
      chartType: 'pie',
      xAxis: 'region',
      yAxis: 'total_revenue',
      summary: 'North America dominated Q3 with $1,010,000 in closed-won ARR (53% of total), followed by EMEA at $785,000 (41%). APAC and LATAM represent emerging expansion frontiers.',
      results: [
        { region: 'North America', total_deals: 3, total_revenue: 1010000 },
        { region: 'EMEA', total_deals: 3, total_revenue: 785000 },
        { region: 'APAC', total_deals: 1, total_revenue: 95000 },
        { region: 'LATAM', total_deals: 1, total_revenue: 78000 }
      ],
      date: 'Yesterday at 3:45 PM'
    },
    {
      id: 'q-acme-3',
      question: 'Which accounts are currently at high churn risk?',
      interpreted: 'Filters active customer cohorts where risk level is tagged as High or health score is below 65.',
      datasetId: 'ds-acme-3',
      datasetName: 'customer_churn_analytics.parquet',
      sql: `SELECT 
  customer_id,
  company_name,
  mrr,
  nps_score,
  health_score,
  csm
FROM read_parquet('s3://lakehouse-acme/customer_churn_analytics.parquet')
WHERE risk_level = 'High' OR health_score < 65
ORDER BY mrr DESC;`,
      chartType: 'bar',
      xAxis: 'company_name',
      yAxis: 'mrr',
      summary: 'Vortex Logistics ($28,000 MRR) has the lowest health score (61/100) and NPS 6. Immediate executive sponsor outreach is recommended prior to their December 2026 renewal.',
      results: [
        { customer_id: 'CST-402', company_name: 'Vortex Logistics', mrr: 28000, nps_score: 6, health_score: 61, csm: 'Carlos Morales' },
        { customer_id: 'CST-408', company_name: 'Aero Freight Ltd', mrr: 19500, nps_score: 5, health_score: 58, csm: 'Carlos Morales' },
        { customer_id: 'CST-412', company_name: 'Nexis Media Group', mrr: 14200, nps_score: 6, health_score: 64, csm: 'Carlos Morales' }
      ],
      date: '2 days ago'
    }
  ],
  'NOVA-002': [
    {
      id: 'q-nova-1',
      question: 'Which hardware components have low or critical stock levels?',
      interpreted: 'Retrieves aerospace warehouse inventory items with stock quantities below safety thresholds.',
      datasetId: 'ds-nova-1',
      datasetName: 'nova_hardware_inventory.parquet',
      sql: `SELECT 
  sku,
  component_name,
  category,
  warehouse_id,
  stock_qty,
  lead_days,
  status
FROM read_parquet('s3://lakehouse-nova/nova_hardware_inventory.parquet')
WHERE status IN ('Low Stock', 'Critical', 'Reorder')
ORDER BY lead_days DESC;`,
      chartType: 'bar',
      xAxis: 'component_name',
      yAxis: 'stock_qty',
      summary: 'Rad-Hard Flight Computers have reached critical status with only 6 units remaining and a 60-day procurement lead time. Ion Thruster Valve B is also below minimum threshold at WH-Kennedy.',
      results: [
        { sku: 'AV-7004', component_name: 'Rad-Hard Flight Computer', category: 'Avionics', warehouse_id: 'WH-Seattle', stock_qty: 6, lead_days: 60, status: 'Critical' },
        { sku: 'AV-7002', component_name: 'Ion Thruster Valve B', category: 'Propulsion', warehouse_id: 'WH-Kenedy', stock_qty: 12, lead_days: 45, status: 'Low Stock' },
        { sku: 'AV-7006', component_name: 'Reaction Wheel Gyro', category: 'Attitude Control', warehouse_id: 'WH-Mojave', stock_qty: 19, lead_days: 30, status: 'Reorder' }
      ],
      date: 'Today at 09:30 AM'
    },
    {
      id: 'q-nova-2',
      question: 'What is the telemetry status and battery state of charge across the satellite constellation?',
      interpreted: 'Queries current telemetry packets for all orbiting platforms to verify power subsystem health.',
      datasetId: 'ds-nova-2',
      datasetName: 'orbital_telemetry_logs.parquet',
      sql: `SELECT 
  satellite_id,
  ROUND(orbital_altitude_km, 1) AS altitude_km,
  battery_soc_pct,
  solar_temp_c,
  status
FROM read_parquet('s3://lakehouse-nova/orbital_telemetry_logs.parquet')
ORDER BY battery_soc_pct ASC;`,
      chartType: 'line',
      xAxis: 'satellite_id',
      yAxis: 'battery_soc_pct',
      summary: 'NOVA-SAT-03 triggered a telemetry thermal warning with solar array temp at 68.4°C and battery state of charge reduced to 71.0%. All other 4 spacecraft report nominal conditions (>88% SoC).',
      results: [
        { satellite_id: 'NOVA-SAT-03', altitude_km: 538.9, battery_soc_pct: 71.0, solar_temp_c: 68.4, status: 'Warning' },
        { satellite_id: 'NOVA-SAT-02', altitude_km: 550.1, battery_soc_pct: 88.4, solar_temp_c: 51.8, status: 'Nominal' },
        { satellite_id: 'NOVA-SAT-05', altitude_km: 541.0, battery_soc_pct: 90.2, solar_temp_c: 46.5, status: 'Nominal' },
        { satellite_id: 'NOVA-SAT-01', altitude_km: 542.4, battery_soc_pct: 92.1, solar_temp_c: 44.2, status: 'Nominal' },
        { satellite_id: 'NOVA-SAT-04', altitude_km: 545.2, battery_soc_pct: 94.8, solar_temp_c: 42.1, status: 'Nominal' }
      ],
      date: 'Yesterday at 11:20 AM'
    }
  ],
  'IEDC-001': [
    {
      id: 'q-iedc-1',
      question: 'What is the average base salary and employee count by department?',
      interpreted: 'Calculates the arithmetic mean of employee compensation and count of records grouped by department hierarchy.',
      datasetId: 'ds-1792057376282',
      datasetName: 'iedc-001_employee_salaries_q4parquet.parquet',
      sql: `SELECT 
  department,
  ROUND(AVG(base_salary), 2) AS avg_base_salary,
  COUNT(*) AS headcount
FROM read_parquet('s3://lakehouse-iedc-001/iedc-001_employee_salaries_q4parquet.parquet')
GROUP BY department
ORDER BY avg_base_salary DESC;`,
      chartType: 'bar',
      xAxis: 'department',
      yAxis: 'avg_base_salary',
      summary: 'Chemical Engineering commands the highest average compensation ($178,000), followed by R&D ($165,000) and Finance ($142,000). Investigations and Operations represent stable organizational functions.',
      results: [
        { department: 'Chemical Engineering', avg_base_salary: 178000, headcount: 1 },
        { department: 'R&D', avg_base_salary: 165000, headcount: 1 },
        { department: 'Finance', avg_base_salary: 142000, headcount: 1 },
        { department: 'Investigations', avg_base_salary: 120000, headcount: 1 },
        { department: 'Operations', avg_base_salary: 98000, headcount: 1 }
      ],
      date: 'Just now'
    },
    {
      id: 'q-iedc-2',
      question: 'Who are the highest compensated staff in the company?',
      interpreted: 'Queries individual employee base salaries and performance bands sorted in descending order.',
      datasetId: 'ds-1792057376282',
      datasetName: 'iedc-001_employee_salaries_q4parquet.parquet',
      sql: `SELECT 
  full_name,
  department,
  base_salary,
  performance_band
FROM read_parquet('s3://lakehouse-iedc-001/iedc-001_employee_salaries_q4parquet.parquet')
ORDER BY base_salary DESC
LIMIT 5;`,
      chartType: 'bar',
      xAxis: 'full_name',
      yAxis: 'base_salary',
      summary: 'Walter White ($178,000 in Chemical Engineering) and Dana Scully ($165,000 in R&D) are top earners with Band 5 ratings.',
      results: [
        { full_name: 'Walter White', department: 'Chemical Engineering', base_salary: 178000, performance_band: 'Band 5 (Top 5%)' },
        { full_name: 'Dana Scully', department: 'R&D', base_salary: 165000, performance_band: 'Band 5 (Top 5%)' },
        { full_name: 'Claire Underwood', department: 'Finance', base_salary: 142000, performance_band: 'Band 4 (Exceeds)' },
        { full_name: 'Fox Mulder', department: 'Investigations', base_salary: 120000, performance_band: 'Band 4 (Exceeds)' },
        { full_name: 'Tyler Durden', department: 'Operations', base_salary: 98000, performance_band: 'Band 3 (Meets)' }
      ],
      date: 'Today at 02:15 PM'
    }
  ]
};

// Default Visualizations / Charts Store
export const INITIAL_CHARTS = [
  // ACME-001 Charts
  {
    id: 'ch-acme-1',
    companyId: 'ACME-001',
    title: 'Department Salary Distribution',
    subtitle: 'Average base compensation across functional groups',
    chartType: 'bar',
    datasetId: 'ds-acme-1',
    datasetName: 'acme_employees_2025.parquet',
    xAxis: 'department',
    yAxis: 'salary',
    aggregation: 'AVG',
    colorPalette: 'teal',
    isPinned: true,
    data: [
      { department: 'Product', salary: 168000 },
      { department: 'Engineering', salary: 153750 },
      { department: 'Design', salary: 130000 },
      { department: 'Marketing', salary: 125000 },
      { department: 'Sales', salary: 118500 },
      { department: 'Finance', salary: 112000 },
      { department: 'HR', salary: 102000 },
      { department: 'Support', salary: 98000 },
    ]
  },
  {
    id: 'ch-acme-2',
    companyId: 'ACME-001',
    title: 'Q3 Closed Won Revenue by Region',
    subtitle: 'Regional share of total quarterly bookings',
    chartType: 'pie',
    datasetId: 'ds-acme-2',
    datasetName: 'q3_global_sales_revenue.parquet',
    xAxis: 'region',
    yAxis: 'revenue',
    aggregation: 'SUM',
    colorPalette: 'blue',
    isPinned: true,
    data: [
      { name: 'North America', value: 1010000 },
      { name: 'EMEA', value: 785000 },
      { name: 'APAC', value: 95000 },
      { name: 'LATAM', value: 78000 },
    ]
  },
  {
    id: 'ch-acme-3',
    companyId: 'ACME-001',
    title: 'Monthly Query Volume Growth',
    subtitle: 'Lakehouse queries executed per calendar month',
    chartType: 'line',
    datasetId: 'ds-acme-2',
    datasetName: 'Lakehouse System Logs',
    xAxis: 'month',
    yAxis: 'queries',
    aggregation: 'COUNT',
    colorPalette: 'emerald',
    isPinned: false,
    data: [
      { month: 'May', queries: 12400 },
      { month: 'Jun', queries: 18900 },
      { month: 'Jul', queries: 24500 },
      { month: 'Aug', queries: 32800 },
      { month: 'Sep', queries: 41200 },
      { month: 'Oct', queries: 48900 },
    ]
  },

  // NOVA-002 Charts
  {
    id: 'ch-nova-1',
    companyId: 'NOVA-002',
    title: 'Spacecraft Battery State of Charge',
    subtitle: 'Orbital energy storage percentage across fleet',
    chartType: 'line',
    datasetId: 'ds-nova-2',
    datasetName: 'orbital_telemetry_logs.parquet',
    xAxis: 'satellite',
    yAxis: 'battery_soc',
    aggregation: 'AVG',
    colorPalette: 'teal',
    isPinned: true,
    data: [
      { satellite: 'SAT-01', battery_soc: 92.1 },
      { satellite: 'SAT-02', battery_soc: 88.4 },
      { satellite: 'SAT-03', battery_soc: 71.0 },
      { satellite: 'SAT-04', battery_soc: 94.8 },
      { satellite: 'SAT-05', battery_soc: 90.2 },
    ]
  },
  {
    id: 'ch-nova-2',
    companyId: 'NOVA-002',
    title: 'Warehouse Critical Spares Value',
    subtitle: 'Inventory capitalization grouped by component category',
    chartType: 'bar',
    datasetId: 'ds-nova-1',
    datasetName: 'nova_hardware_inventory.parquet',
    xAxis: 'category',
    yAxis: 'total_cost',
    aggregation: 'SUM',
    colorPalette: 'blue',
    isPinned: true,
    data: [
      { category: 'Avionics', total_cost: 324000 },
      { category: 'Propulsion', total_cost: 346800 },
      { category: 'Sensors', total_cost: 681600 },
      { category: 'Power', total_cost: 714000 },
      { category: 'Comms', total_cost: 391000 },
    ]
  }
];

// Dashboards Store
export const INITIAL_DASHBOARDS = [
  // ACME-001 Dashboards
  {
    id: 'dash-acme-1',
    companyId: 'ACME-001',
    name: 'Executive Analytics Hub',
    description: 'High-level executive metrics covering compensation, sales traction, and lakehouse load.',
    visibility: 'Company-wide',
    refreshInterval: '5 minutes',
    updatedAt: '2026-10-09 09:15 AM',
    chartIds: ['ch-acme-1', 'ch-acme-2', 'ch-acme-3'],
    tiles: [
      { chartId: 'ch-acme-1', colSpan: 'col-span-12 lg:col-span-8' },
      { chartId: 'ch-acme-2', colSpan: 'col-span-12 lg:col-span-4' },
      { chartId: 'ch-acme-3', colSpan: 'col-span-12' },
    ]
  },
  {
    id: 'dash-acme-2',
    companyId: 'ACME-001',
    name: 'Sales & Revenue Performance',
    description: 'Dedicated pipeline visibility, regional quotas, and closed deal performance.',
    visibility: 'Company-wide',
    refreshInterval: '15 minutes',
    updatedAt: '2026-10-08 04:30 PM',
    chartIds: ['ch-acme-2'],
    tiles: [
      { chartId: 'ch-acme-2', colSpan: 'col-span-12' }
    ]
  },

  // NOVA-002 Dashboards
  {
    id: 'dash-nova-1',
    companyId: 'NOVA-002',
    name: 'Flight Ops & Constellation Center',
    description: 'Real-time telemetry, orbital parameters, and inventory reserves for upcoming launch manifest.',
    visibility: 'Company-wide',
    refreshInterval: '30 seconds',
    updatedAt: '2026-10-09 10:45 AM',
    chartIds: ['ch-nova-1', 'ch-nova-2'],
    tiles: [
      { chartId: 'ch-nova-1', colSpan: 'col-span-12 lg:col-span-6' },
      { chartId: 'ch-nova-2', colSpan: 'col-span-12 lg:col-span-6' },
    ]
  }
];

// Audit & Activity Logs Store
export const INITIAL_AUDIT_LOGS = [
  // ACME-001 Audit
  {
    id: 'aud-acme-1',
    companyId: 'ACME-001',
    timestamp: '2026-10-09 10:42 AM',
    userName: 'Sarah Jenkins',
    userRole: 'ADMIN',
    action: 'Query Executed',
    resource: 'acme_employees_2025.parquet',
    details: 'Ran analytical query for department compensation benchmarks.',
    ip: '192.168.1.14',
    status: 'Success'
  },
  {
    id: 'aud-acme-2',
    companyId: 'ACME-001',
    timestamp: '2026-10-09 09:12 AM',
    userName: 'David Chen',
    userRole: 'HR',
    action: 'Dataset Upload',
    resource: 'acme_employees_2025.parquet',
    details: 'Converted CSV to Parquet with Snappy compression (4.2 MB).',
    ip: '192.168.1.88',
    status: 'Success'
  },
  {
    id: 'aud-acme-3',
    companyId: 'ACME-001',
    timestamp: '2026-10-08 05:22 PM',
    userName: 'Sarah Jenkins',
    userRole: 'ADMIN',
    action: 'User Registered',
    resource: 'robert.taylor@acme.io',
    details: 'Self-registration submitted with requested role HR. Status: Pending.',
    ip: '172.56.21.9',
    status: 'Warning'
  },
  {
    id: 'aud-acme-4',
    companyId: 'ACME-001',
    timestamp: '2026-10-08 02:18 PM',
    userName: 'Maya Patel',
    userRole: 'STAFF',
    action: 'Chart Created',
    resource: 'Q3 Closed Won Revenue by Region',
    details: 'Created and pinned regional revenue pie chart to Executive Hub.',
    ip: '192.168.1.42',
    status: 'Success'
  },
  {
    id: 'aud-acme-5',
    companyId: 'ACME-001',
    timestamp: '2026-10-07 11:05 AM',
    userName: 'Sarah Jenkins',
    userRole: 'ADMIN',
    action: 'Company Settings Modified',
    resource: 'ACME-001 Configuration',
    details: 'Updated retention rule to 365 days and enabled Parquet auto-archive.',
    ip: '192.168.1.14',
    status: 'Success'
  },
  {
    id: 'aud-acme-6',
    companyId: 'ACME-001',
    timestamp: '2026-10-02 04:30 PM',
    userName: 'Sarah Jenkins',
    userRole: 'ADMIN',
    action: 'User Rejected',
    resource: 'kevin.rejected@external.com',
    details: 'Rejected registration. Reason: Non-corporate email domain not permitted.',
    ip: '192.168.1.14',
    status: 'Failed'
  },

  // NOVA-002 Audit
  {
    id: 'aud-nova-1',
    companyId: 'NOVA-002',
    timestamp: '2026-10-09 10:15 AM',
    userName: 'Dr. Alex Vance',
    userRole: 'ADMIN',
    action: 'Telemetry Ingest',
    resource: 'orbital_telemetry_logs.parquet',
    details: 'High-frequency telemetry stream synced (310,000 rows).',
    ip: '10.0.4.12',
    status: 'Success'
  },
  {
    id: 'aud-nova-2',
    companyId: 'NOVA-002',
    timestamp: '2026-10-09 08:44 AM',
    userName: 'Liam O\'Connor',
    userRole: 'STAFF',
    action: 'Query Executed',
    resource: 'orbital_telemetry_logs.parquet',
    details: 'Executed read-only telemetry scan for satellite SAT-03 battery anomaly.',
    ip: '10.0.4.55',
    status: 'Success'
  },
  {
    id: 'aud-nova-3',
    companyId: 'NOVA-002',
    timestamp: '2026-10-07 03:10 PM',
    userName: 'Dr. Alex Vance',
    userRole: 'ADMIN',
    action: 'User Registered',
    resource: 'sophia.kim@nova.space',
    details: 'Self-registration submitted with requested role STAFF. Status: Pending.',
    ip: '10.0.4.89',
    status: 'Warning'
  }
];

// Notifications Store
export const INITIAL_NOTIFICATIONS = [
  // ACME-001
  {
    id: 'notif-acme-1',
    companyId: 'ACME-001',
    title: 'New Registration Pending',
    message: 'Robert Taylor requested HR role access. Awaiting admin review.',
    time: '2 hours ago',
    unread: true,
    type: 'user',
    targetLink: '/users'
  },
  {
    id: 'notif-acme-2',
    companyId: 'ACME-001',
    title: 'Parquet Ingestion Complete',
    message: 'Dataset "q3_global_sales_revenue.parquet" (128,450 rows) is ready for queries.',
    time: '1 day ago',
    unread: true,
    type: 'upload',
    targetLink: '/datasets'
  },
  {
    id: 'notif-acme-3',
    companyId: 'ACME-001',
    title: 'Chart Shared With You',
    message: 'Maya Patel added "Q3 Closed Won Revenue" to Executive Analytics Hub.',
    time: '2 days ago',
    unread: false,
    type: 'chart',
    targetLink: '/dashboards'
  },

  // NOVA-002
  {
    id: 'notif-nova-1',
    companyId: 'NOVA-002',
    title: 'Telemetry Warning Detected',
    message: 'NOVA-SAT-03 solar array thermal reached 68.4°C.',
    time: '30 mins ago',
    unread: true,
    type: 'alert',
    targetLink: '/ask'
  },
  {
    id: 'notif-nova-2',
    companyId: 'NOVA-002',
    title: 'New Registration Pending',
    message: 'Sophia Kim requested STAFF role. Awaiting admin approval.',
    time: '2 days ago',
    unread: true,
    type: 'user',
    targetLink: '/users'
  }
];
