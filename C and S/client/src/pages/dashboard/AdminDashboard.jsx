import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  Users,
  Utensils,
  TrendingUp,
  Heart,
  Search,
  Filter,
  RefreshCw,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Sparkles,
  Lock,
  Unlock,
  Download,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Container from '../../components/common/Container';
import Button from '../../components/common/Button';
import FoodLoader from '../../components/animations/FoodLoader';
import adminService from '../../services/admin.service';
import { sileo } from 'sileo';

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('overview'); // overview, users, listings, requests
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Overview stats & logs
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonors: 0,
    totalReceivers: 0,
    totalListings: 0,
    availableListings: 0,
    completedDonations: 0,
    totalKgRescued: 0,
    totalBeneficiariesFed: 0,
  });
  const [recentLogs, setRecentLogs] = useState([]);

  // Users tab
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');

  // Listings tab
  const [foodList, setFoodList] = useState([]);
  const [foodSearch, setFoodSearch] = useState('');
  const [foodStatusFilter, setFoodStatusFilter] = useState('');

  // Requests tab
  const [requestList, setRequestList] = useState([]);
  const [requestStatusFilter, setRequestStatusFilter] = useState('');
  const [logActionFilter, setLogActionFilter] = useState('ALL');

  const downloadAdminReport = () => {
    const rows = [
      ["Type", "Title / Name", "Role / Status", "Detail", "Date"],
      ...usersList.map((u) => [
        "User",
        `"${(u.fullName || '').replace(/"/g, '""')}"`,
        u.role || "",
        `"${(u.email || '').replace(/"/g, '""')}"`,
        new Date(u.createdAt).toLocaleDateString(),
      ]),
      ...foodList.map((f) => [
        "Listing",
        `"${(f.title || '').replace(/"/g, '""')}"`,
        f.status || "",
        `${f.quantity || 0} ${f.quantityUnit || 'kg'} (${f.category || ''})`,
        new Date(f.createdAt).toLocaleDateString(),
      ]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FoodLink_Platform_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    sileo.success({ title: "Report Exported", description: "Admin platform report exported as CSV." });
  };

  const fetchOverview = useCallback(async () => {
    try {
      const res = await adminService.getOverview();
      if (res && res.success) {
        setStats(res.stats || {});
        setRecentLogs(res.recentLogs || []);
      }
    } catch (err) {
      console.error('Failed to load admin overview:', err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await adminService.getUsers({
        search: userSearch || undefined,
        role: userRoleFilter || undefined,
      });
      if (res && res.success) {
        setUsersList(res.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  }, [userSearch, userRoleFilter]);

  const fetchFood = useCallback(async () => {
    try {
      const res = await adminService.getFood({
        search: foodSearch || undefined,
        status: foodStatusFilter || undefined,
      });
      if (res && res.success) {
        setFoodList(res.listings || []);
      }
    } catch (err) {
      console.error('Failed to load food listings:', err);
    }
  }, [foodSearch, foodStatusFilter]);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await adminService.getRequests({
        status: requestStatusFilter || undefined,
      });
      if (res && res.success) {
        setRequestList(res.requests || []);
      }
    } catch (err) {
      console.error('Failed to load food requests:', err);
    }
  }, [requestStatusFilter]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.allSettled([
      fetchOverview(),
      fetchUsers(),
      fetchFood(),
      fetchRequests(),
    ]);
    setLoading(false);
    setRefreshing(false);
  }, [fetchOverview, fetchUsers, fetchFood, fetchRequests]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    sileo.success({
      title: 'Data Synchronized',
      description: 'Platform metrics updated from MongoDB Atlas.',
    });
  };

  const handleToggleUserStatus = async (targetUser) => {
    const newStatus = targetUser.status === 'Active' ? 'Suspended' : 'Active';
    try {
      await adminService.updateUserStatus(targetUser._id, newStatus);
      sileo.success({
        title: `User ${newStatus}`,
        description: `${targetUser.fullName}'s account is now ${newStatus.toLowerCase()}.`,
      });
      fetchUsers();
      fetchOverview();
    } catch (err) {
      sileo.error({
        title: 'Status Update Failed',
        description: err.response?.data?.message || err.message,
      });
    }
  };

  const tabs = [
    { id: 'overview', label: 'Platform Overview', icon: TrendingUp },
    { id: 'users', label: 'User Directory', count: usersList.length, icon: Users },
    { id: 'listings', label: 'All Listings', count: foodList.length, icon: Utensils },
    { id: 'requests', label: 'Active Requests', count: requestList.length, icon: FileText },
  ];

  if (loading) {
    return (
      <div className="py-24 flex justify-center items-center min-h-[60vh]">
        <FoodLoader size="lg" message="Loading Admin Command Center..." />
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12 min-h-[calc(100vh-160px)]">
      <Container>
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-6 border-b border-chocolate/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-100 border border-purple-200 text-purple-900 text-xs font-heading font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
              <span>Platform Authority • Administrative Clearance</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-chocolate tracking-tight">
              Admin Command Center
            </h1>
            <p className="mt-1 text-sm text-chocolate/75">
              Live MongoDB Atlas management console • Authenticated as <strong>{user?.fullName}</strong> ({user?.email})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadAdminReport}
              leftIcon={<Download className="w-4 h-4" />}
              className="bg-white border-chocolate/20 text-chocolate hover:bg-cream-100"
            >
              Export CSV
            </Button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 rounded-2xl bg-white border border-chocolate/15 text-chocolate/80 hover:text-chocolate hover:bg-cream-100 transition shadow-sm cursor-pointer"
              title="Refresh Platform Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-burntOrange' : ''}`} />
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 border-b border-chocolate/10 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-heading font-bold text-sm transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-chocolate text-cream shadow-md'
                    : 'bg-white text-chocolate/70 hover:bg-cream-100 hover:text-chocolate border border-chocolate/10'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-burntOrange' : 'text-chocolate/50'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                      isActive ? 'bg-burntOrange text-white' : 'bg-cream-200 text-chocolate/70'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Top Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="clay-card p-6 bg-white border border-chocolate/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-chocolate/60">
                    Community Members
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-extrabold font-heading text-chocolate">
                  {stats.totalUsers || 0}
                </p>
                <div className="mt-2 text-xs text-chocolate/70 flex items-center gap-2">
                  <span>{stats.totalDonors || 0} Donors</span>
                  <span>•</span>
                  <span>{stats.totalReceivers || 0} Receivers</span>
                </div>
              </div>

              <div className="clay-card p-6 bg-white border border-chocolate/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-chocolate/60">
                    Total Food Listings
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 text-burntOrange flex items-center justify-center">
                    <Utensils className="w-5 h-5" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-extrabold font-heading text-burntOrange">
                  {stats.totalListings || 0}
                </p>
                <div className="mt-2 text-xs text-chocolate/70 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{stats.availableListings || 0} actively available</span>
                </div>
              </div>

              <div className="clay-card p-6 bg-white border border-chocolate/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-chocolate/60">
                    Surplus Rescued
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-extrabold font-heading text-emerald-700">
                  {stats.totalKgRescued || 0} <span className="text-sm font-semibold">kg</span>
                </p>
                <p className="mt-2 text-xs text-chocolate/70">
                  From {stats.completedDonations || 0} fulfilled rescues
                </p>
              </div>

              <div className="clay-card p-6 bg-white border border-chocolate/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-chocolate/60">
                    Beneficiaries Fed
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Heart className="w-5 h-5" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-extrabold font-heading text-amber-800">
                  {stats.totalBeneficiariesFed || 0}
                </p>
                <p className="mt-2 text-xs text-chocolate/70">
                  Shelters, orphanages & community
                </p>
              </div>
            </div>

            {/* Audit Logs */}
            <div className="clay-card p-6 bg-white border border-chocolate/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-chocolate/10">
                <div>
                  <h2 className="text-lg font-bold font-heading text-chocolate">
                    Live System Activity Logs
                  </h2>
                  <p className="text-xs text-chocolate/70">
                    Audit trail of all administrative and platform actions
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={logActionFilter}
                    onChange={(e) => setLogActionFilter(e.target.value)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-cream-50 border border-chocolate/15 text-chocolate focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Event Types</option>
                    <option value="REQUEST_SUBMITTED">Requests Submitted</option>
                    <option value="REQUEST_APPROVED">Requests Approved</option>
                    <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                    <option value="COLLECTION_CONFIRMED">Collections Confirmed</option>
                    <option value="LISTING_PUBLISHED">Listings Published</option>
                    <option value="USER_REGISTERED">User Registered</option>
                  </select>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-cream-200 text-chocolate whitespace-nowrap">
                    {recentLogs.filter((l) => logActionFilter === 'ALL' || l.action === logActionFilter).length} events
                  </span>
                </div>
              </div>

              {recentLogs.filter((l) => logActionFilter === 'ALL' || l.action === logActionFilter).length > 0 ? (
                <div className="divide-y divide-chocolate/10">
                  {recentLogs
                    .filter((l) => logActionFilter === 'ALL' || l.action === logActionFilter)
                    .map((log) => (
                    <div key={log._id} className="py-3 flex items-start justify-between gap-4 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-chocolate uppercase tracking-wider text-[11px] px-2 py-0.5 rounded bg-cream-100 border border-chocolate/10">
                            {log.action}
                          </span>
                          <span className="text-chocolate/60">
                            by {log.performedBy?.fullName || log.performedBy?.email || 'System'}
                          </span>
                        </div>
                        <p className="text-chocolate/80">{log.details}</p>
                      </div>
                      <span className="text-chocolate/50 shrink-0">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-chocolate/60 text-center py-8">
                  No activity logs recorded yet. Platform actions will automatically append here.
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: USERS DIRECTORY */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-chocolate/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user by name, email, phone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-chocolate/15 text-sm text-chocolate focus:outline-none focus:ring-2 focus:ring-burntOrange/30"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-4 py-2.5 rounded-2xl bg-white border border-chocolate/15 text-sm font-semibold text-chocolate focus:outline-none focus:ring-2 focus:ring-burntOrange/30 cursor-pointer"
              >
                <option value="">All Roles</option>
                <option value="Donor">Donor</option>
                <option value="Receiver">Receiver</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            {/* Users Table */}
            <div className="clay-card overflow-hidden bg-white border border-chocolate/10 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-cream-100 text-chocolate/70 font-heading uppercase text-[11px] border-b border-chocolate/10">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Joined</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-chocolate/10">
                    {usersList.length > 0 ? (
                      usersList.map((u) => {
                        const isSelf = u._id === user?._id;
                        return (
                          <tr key={u._id} className="hover:bg-cream-50 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-chocolate">
                              <div>{u.fullName}</div>
                              <div className="text-[11px] text-chocolate/60 font-normal">{u.email}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  u.role === 'Admin'
                                    ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                    : u.role === 'Donor'
                                    ? 'bg-orange-100 text-burntOrange border border-orange-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-chocolate/80">
                              <div>{u.phone || '—'}</div>
                              {u.organizationName && (
                                <div className="text-[11px] text-chocolate/60">{u.organizationName}</div>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  u.status === 'Active'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {u.status === 'Active' ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-red-600" />
                                )}
                                {u.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-chocolate/60">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {isSelf ? (
                                <span className="text-[11px] text-chocolate/40 italic">Current Admin</span>
                              ) : (
                                <button
                                  onClick={() => handleToggleUserStatus(u)}
                                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                                    u.status === 'Active'
                                      ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                                  }`}
                                >
                                  {u.status === 'Active' ? (
                                    <>
                                      <Lock className="w-3 h-3" /> Suspend
                                    </>
                                  ) : (
                                    <>
                                      <Unlock className="w-3 h-3" /> Reactivate
                                    </>
                                  )}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-chocolate/60">
                          No users matched your query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ALL LISTINGS */}
        {activeTab === 'listings' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-chocolate/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter listings by food title or description..."
                  value={foodSearch}
                  onChange={(e) => setFoodSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-chocolate/15 text-sm text-chocolate focus:outline-none focus:ring-2 focus:ring-burntOrange/30"
                />
              </div>

              <select
                value={foodStatusFilter}
                onChange={(e) => setFoodStatusFilter(e.target.value)}
                className="px-4 py-2.5 rounded-2xl bg-white border border-chocolate/15 text-sm font-semibold text-chocolate focus:outline-none focus:ring-2 focus:ring-burntOrange/30 cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Pending Verification">Pending Verification</option>
                <option value="Fully Requested">Fully Requested</option>
                <option value="Reserved">Reserved</option>
                <option value="Completed">Completed</option>
                <option value="Expired">Expired</option>
              </select>
            </div>

            <div className="clay-card overflow-hidden bg-white border border-chocolate/10 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-cream-100 text-chocolate/70 font-heading uppercase text-[11px] border-b border-chocolate/10">
                    <tr>
                      <th className="py-3 px-4">Food Item</th>
                      <th className="py-3 px-4">Donor</th>
                      <th className="py-3 px-4">Quantity Available</th>
                      <th className="py-3 px-4">Expiry</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Listed At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-chocolate/10">
                    {foodList.length > 0 ? (
                      foodList.map((item) => (
                        <tr key={item._id} className="hover:bg-cream-50 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-chocolate">
                            <div>{item.title}</div>
                            <div className="text-[11px] text-chocolate/60 font-normal">
                              {item.category} {item.isVegetarian ? '• 🌱 Veg' : ''}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-chocolate/80">
                            <div>{item.donor?.organizationName || item.donor?.fullName || 'Donor'}</div>
                            <div className="text-[11px] text-chocolate/50">
                              {typeof item.pickupAddress === 'string'
                                ? item.pickupAddress
                                : item.pickupAddress && typeof item.pickupAddress === 'object'
                                  ? [item.pickupAddress.street, item.pickupAddress.city].filter(Boolean).join(', ')
                                  : ''}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-burntOrange">
                            {item.availableQuantity} / {item.quantity} {item.quantityUnit}
                          </td>
                          <td className="py-3.5 px-4 text-chocolate/80">
                            {new Date(item.expiresAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                item.status === 'Available'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.status === 'Completed'
                                  ? 'bg-stone-100 text-stone-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-chocolate/60">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-chocolate/60">
                          No food listings found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ACTIVE REQUESTS */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-chocolate/70 font-semibold">
                Monitor all community food requests and lifecycle transitions
              </span>

              <select
                value={requestStatusFilter}
                onChange={(e) => setRequestStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-2xl bg-white border border-chocolate/15 text-xs font-semibold text-chocolate focus:outline-none focus:ring-2 focus:ring-burntOrange/30 cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Ready for Pickup">Ready for Pickup</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="clay-card overflow-hidden bg-white border border-chocolate/10 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-cream-100 text-chocolate/70 font-heading uppercase text-[11px] border-b border-chocolate/10">
                    <tr>
                      <th className="py-3 px-4">Food Item</th>
                      <th className="py-3 px-4">Requester (Receiver)</th>
                      <th className="py-3 px-4">Donor</th>
                      <th className="py-3 px-4">Quantity</th>
                      <th className="py-3 px-4">Purpose</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-chocolate/10">
                    {requestList.length > 0 ? (
                      requestList.map((req) => (
                        <tr key={req._id} className="hover:bg-cream-50 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-chocolate">
                            <div>{req.listing?.title || 'Listing'}</div>
                            <div className="text-[11px] text-chocolate/50">{req.listing?.category}</div>
                          </td>
                          <td className="py-3.5 px-4 text-chocolate/80">
                            <div>{req.receiver?.organizationName || req.receiver?.fullName || 'Receiver'}</div>
                            <div className="text-[11px] text-chocolate/50">{req.receiver?.email}</div>
                          </td>
                          <td className="py-3.5 px-4 text-chocolate/80">
                            <div>{req.donor?.organizationName || req.donor?.fullName || 'Donor'}</div>
                            <div className="text-[11px] text-chocolate/50">{req.donor?.email}</div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-burntOrange">
                            {req.requestedQuantity} {req.listing?.quantityUnit || 'units'}
                          </td>
                          <td className="py-3.5 px-4 text-chocolate/80 max-w-xs truncate">
                            {req.purpose || 'Community distribution'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                req.status === 'Completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : req.status === 'Approved'
                                  ? 'bg-sky-100 text-sky-800'
                                  : req.status === 'Ready for Pickup'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : req.status === 'Rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {req.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-chocolate/60">
                            {new Date(req.updatedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-chocolate/60">
                          No food requests found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
