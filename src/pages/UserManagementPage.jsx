import React, { useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  KeyRound,
  Activity,
  AlertTriangle,
  Mail,
  Building2,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../components/common/Toast';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Tabs } from '../components/common/Tabs';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export function UserManagementPage() {
  const {
    currentUser,
    currentCompany,
    users,
    approveUser,
    bulkApproveUsers,
    rejectUser,
    changeUserRole,
    toggleUserStatus,
    resetUserPassword,
  } = useAuth();
  const { auditLogs } = useData();
  const { toast } = useToast();

  const companyId = currentUser ? currentUser.companyId : 'ACME-001';

  // Sub-tab: 'pending' | 'active' | 'deactivated'
  const [activeTab, setActiveTab] = useState('pending');

  // Search & Role Filter for Active tab
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetUser, setRejectTargetUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityTargetUser, setActivityTargetUser] = useState(null);

  // Bulk selection for pending
  const [selectedPendingIds, setSelectedPendingIds] = useState([]);

  // Filter users by current company
  const companyUsers = useMemo(() => {
    return users.filter((u) => u.companyId === companyId);
  }, [users, companyId]);

  const pendingUsers = useMemo(
    () => companyUsers.filter((u) => u.status === 'PENDING'),
    [companyUsers]
  );

  const activeUsers = useMemo(() => {
    return companyUsers.filter((u) => {
      const matchStatus = u.status === 'ACTIVE';
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.title && u.title.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchStatus && matchRole && matchSearch;
    });
  }, [companyUsers, roleFilter, searchTerm]);

  const deactivatedUsers = useMemo(
    () => companyUsers.filter((u) => u.status === 'DEACTIVATED' || u.status === 'REJECTED'),
    [companyUsers]
  );

  // Handlers for Pending
  const handleApprove = (userId) => {
    approveUser(userId);
    toast({
      title: 'Registration Approved',
      message: 'User account has been activated and granted login permissions.',
      type: 'success',
    });
  };

  const handleBulkApprove = () => {
    if (selectedPendingIds.length === 0) return;
    bulkApproveUsers(selectedPendingIds);
    setSelectedPendingIds([]);
    toast({
      title: 'Bulk Approval Complete',
      message: `Approved ${selectedPendingIds.length} registration request(s).`,
      type: 'success',
    });
  };

  const handleOpenReject = (user) => {
    setRejectTargetUser(user);
    setRejectionReason('Access request does not meet company lakehouse credential guidelines.');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (!rejectTargetUser) return;
    rejectUser(rejectTargetUser.id, rejectionReason);
    setRejectModalOpen(false);
    toast({
      title: 'Registration Rejected',
      message: `User marked as rejected with documented justification.`,
      type: 'info',
    });
  };

  // Handlers for Active
  const handleRoleChange = (userId, newRole) => {
    changeUserRole(userId, newRole);
    toast({
      title: 'Role Updated',
      message: `User permissions updated to ${newRole}.`,
      type: 'success',
    });
  };

  const handleToggleActive = (user) => {
    toggleUserStatus(user.id);
    const nextState = user.status === 'ACTIVE' ? 'Deactivated' : 'Reactivated';
    toast({
      title: `User ${nextState}`,
      message: `Account status toggled for ${user.name}.`,
      type: 'info',
    });
  };

  const handleOpenResetPassword = (user) => {
    setPasswordTargetUser(user);
    setNewPassword('TempPass2026!');
    setPasswordModalOpen(true);
  };

  const handleConfirmResetPassword = () => {
    if (!passwordTargetUser || !newPassword) return;
    resetUserPassword(passwordTargetUser.id, newPassword);
    setPasswordModalOpen(false);
    toast({
      title: 'Password Reset',
      message: `Temporary password established for ${passwordTargetUser.email}.`,
      type: 'success',
    });
  };

  const handleOpenActivity = (user) => {
    setActivityTargetUser(user);
    setActivityModalOpen(true);
  };

  // Sub-tabs list
  const tabs = [
    { id: 'pending', label: 'Pending Requests', badge: pendingUsers.length },
    { id: 'active', label: 'Active Users', badge: activeUsers.length },
    { id: 'deactivated', label: 'Rejected & Deactivated', badge: deactivatedUsers.length },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            User Management & RBAC
            <Badge variant="ADMIN" size="xs">
              ADMIN Console
            </Badge>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Authorize team access, review applicant roles, and control permission tiers for tenant{' '}
            <span className="font-mono font-semibold text-teal-600 dark:text-teal-400">{companyId}</span>.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB 1: PENDING REQUESTS */}
      {activeTab === 'pending' && (
        <Card>
          <CardHeader
            title="Awaiting Approval"
            subtitle="Review pending employee registration applications before activating credentials"
            action={
              pendingUsers.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    size="xs"
                    variant="success"
                    onClick={handleBulkApprove}
                    disabled={selectedPendingIds.length === 0}
                  >
                    Bulk Approve ({selectedPendingIds.length})
                  </Button>
                </div>
              )
            }
          />

          <CardContent className="p-0">
            {pendingUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="py-3 px-4 w-10">
                        <input
                          type="checkbox"
                          checked={
                            selectedPendingIds.length === pendingUsers.length && pendingUsers.length > 0
                          }
                          onChange={(e) => {
                            if (e.target.value && selectedPendingIds.length !== pendingUsers.length) {
                              setSelectedPendingIds(pendingUsers.map((u) => u.id));
                            } else {
                              setSelectedPendingIds([]);
                            }
                          }}
                          className="rounded text-sky-600 focus:ring-sky-500"
                        />
                      </th>
                      <th className="py-3 px-4 font-semibold">Applicant</th>
                      <th className="py-3 px-4 font-semibold">Corporate Email</th>
                      <th className="py-3 px-4 font-semibold">Requested Role</th>
                      <th className="py-3 px-4 font-semibold">Registration Date</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pendingUsers.map((user) => {
                      const isChecked = selectedPendingIds.includes(user.id);
                      return (
                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSelectedPendingIds((prev) =>
                                  isChecked ? prev.filter((id) => id !== user.id) : [...prev, user.id]
                                );
                              }}
                              className="rounded text-sky-600 focus:ring-sky-500"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div>
                                <span className="font-semibold text-slate-900 dark:text-white block">
                                  {user.name}
                                </span>
                                <span className="text-[10px] text-slate-400">{user.title}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                            {user.email}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={user.role} size="xs">
                              {user.role}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-slate-500">{user.joinDate}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="xs"
                                variant="outline"
                                className="text-rose-600 border-rose-300 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950"
                                onClick={() => handleOpenReject(user)}
                              >
                                Reject
                              </Button>
                              <Button
                                size="xs"
                                variant="success"
                                onClick={() => handleApprove(user.id)}
                              >
                                Approve
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                No registration requests currently pending review for this organization.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: ACTIVE USERS */}
      {activeTab === 'active' && (
        <Card className="space-y-4">
          <CardHeader
            title="Active Organization Accounts"
            subtitle="Manage roles, authentication credentials, and user lifecycle states"
          />

          {/* Search & Filter Toolbar */}
          <div className="p-4 pt-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search active users..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Filter Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="all">All Roles</option>
                <option value="ADMIN">ADMIN</option>
                <option value="HR">HR</option>
                <option value="STAFF">STAFF</option>
              </select>
            </div>
          </div>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="py-3 px-4 font-semibold">User</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th className="py-3 px-4 font-semibold">Role Tier</th>
                    <th className="py-3 px-4 font-semibold">Last Active</th>
                    <th className="py-3 px-4 font-semibold text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activeUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              {user.name}
                            </span>
                            <span className="text-[10px] text-slate-400">{user.title}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {user.email}
                      </td>
                      <td className="py-3 px-4">
                        {/* Change Role Dropdown */}
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="HR">HR</option>
                          <option value="STAFF">STAFF</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{user.lastActive}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenActivity(user)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="View Activity Logs"
                          >
                            <Activity className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenResetPassword(user)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Reset Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {user.id !== currentUser.id && (
                            <button
                              type="button"
                              onClick={() => handleToggleActive(user)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title="Deactivate Account"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: REJECTED & DEACTIVATED */}
      {activeTab === 'deactivated' && (
        <Card>
          <CardHeader
            title="Rejected Applications & Deactivated Accounts"
            subtitle="Past denial records and suspended identities"
          />
          <CardContent className="p-0">
            {deactivatedUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="py-3 px-4 font-semibold">User</th>
                      <th className="py-3 px-4 font-semibold">Email</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Documented Reason</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {deactivatedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-8 h-8 rounded-full object-cover grayscale"
                            />
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-white block">
                                {user.name}
                              </span>
                              <span className="text-[10px] text-slate-400">{user.title}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                          {user.email}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="rose" size="xs">
                            {user.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                          {user.rejectionReason || 'Deactivated by administrator.'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => handleToggleActive(user)}
                          >
                            Reinstate Access
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No rejected or deactivated accounts recorded.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal: Rejection Reason */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title={`Reject Request for ${rejectTargetUser?.name}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Please document the administrative reason for rejecting this lakehouse registration. The applicant will see this explanation if they attempt sign-in.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Rejection Reason
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmReject}>
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Reset Password */}
      <Modal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title={`Reset Password for ${passwordTargetUser?.name}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Specify a temporary password for this user:
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Temporary Password
            </label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setPasswordModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirmResetPassword}>
              Update Password
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: View Activity */}
      <Modal
        isOpen={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        title={`Audit Trail: ${activityTargetUser?.name}`}
        maxWidth="max-w-lg"
      >
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs flex justify-between">
            <span className="text-slate-500">Corporate Email:</span>
            <span className="font-mono text-slate-800 dark:text-slate-200">{activityTargetUser?.email}</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto pr-1">
            {auditLogs
              .filter((a) => a.userName === activityTargetUser?.name)
              .map((a) => (
                <div key={a.id} className="py-2.5 space-y-0.5 text-xs">
                  <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-200">
                    <span>{a.action}</span>
                    <span className="text-[10px] text-slate-400">{a.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{a.details}</p>
                </div>
              ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button size="xs" onClick={() => setActivityModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
