import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Users,
  Search,
  Clock,
  CheckCircle2,
  PackageCheck,
  Truck,
  Heart,
  ChevronRight,
  MapPin,
  Calendar,
  XCircle,
  Filter,
  ArrowRight,
  LogOut,
  Building,
  Download,
  Navigation,
  ExternalLink,
} from 'lucide-react';
import { sileo } from 'sileo';
import Swal from 'sweetalert2';
import Container from '../../components/common/Container';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import requestService from '../../services/request.service';
import foodService from '../../services/food.service';
import CollectionVerificationModal from '../../components/food/CollectionVerificationModal';

export default function ReceiverDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const [requests, setRequests] = useState([]);
  const [availableCount, setAvailableCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchReceiverData = async () => {
    setLoading(true);
    try {
      const [requestsRes, foodRes] = await Promise.all([
        requestService.getMyRequests(),
        foodService.getAvailableFood({ limit: 1 }),
      ]);

      setRequests(requestsRes.requests || []);
      setAvailableCount(foodRes.pagination?.total || 0);
    } catch (err) {
      console.warn('Receiver dashboard fetch error:', err);
      sileo.error({
        title: 'Sync Error',
        description: 'Could not load your latest request status.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceiverData();
  }, []);

  // Compute Statistics
  const activeRequests = requests.filter((r) => r.status === 'Pending').length;
  const approvedRequests = requests.filter((r) => r.status === 'Approved').length;
  const readyForPickup = requests.filter((r) => r.status === 'Ready for Pickup').length;
  const completedCollections = requests.filter((r) => r.status === 'Completed').length;

  const totalKgCollected = requests
    .filter((r) => r.status === 'Completed')
    .reduce((sum, r) => {
      const unit = r.listing?.quantityUnit || 'kg';
      const qty = r.requestedQuantity || 0;
      if (unit === 'grams') return sum + qty / 1000;
      if (unit === 'meals') return sum + qty * 0.4;
      if (unit === 'packets') return sum + qty * 0.5;
      return sum + qty;
    }, 0);

  // Download receiver activity report as CSV
  const downloadCollectionReport = () => {
    const rows = [
      ["Food Title", "Donor Organization", "Quantity", "Unit", "Status", "Beneficiaries Fed", "Request Date"],
      ...requests.map((r) => [
        `"${(r.listing?.title || "").replace(/"/g, '""')}"`,
        `"${(r.donor?.organizationName || r.donor?.fullName || "").replace(/"/g, '""')}"`,
        r.requestedQuantity || 0,
        r.listing?.quantityUnit || "kg",
        r.status || "",
        r.beneficiaryCount || 1,
        new Date(r.createdAt).toLocaleDateString(),
      ]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FoodLink_Collection_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    sileo.success({ title: "Report Exported", description: "CSV activity report downloaded successfully." });
  };

  // Actions
  const handleConfirmCollection = (request) => {
    if (!request) return;
    setSelectedRequest(request);
    setCollectionModalOpen(true);
  };

  const handleCancelRequest = async (requestId) => {
    const confirm = await Swal.fire({
      title: 'Cancel this request?',
      text: 'Are you sure you want to cancel this food request?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Cancel',
      confirmButtonColor: '#CC5500',
      cancelButtonText: 'Keep Active',
    });

    if (confirm.isConfirmed) {
      try {
        await requestService.cancelFoodRequest(requestId);
        sileo.info({
          title: 'Request Cancelled',
          description: 'Your food request was cancelled.',
        });
        fetchReceiverData();
      } catch (err) {
        sileo.error({
          title: 'Error',
          description: err.response?.data?.message || 'Could not cancel request.',
        });
      }
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (statusFilter === 'All') return true;
    return r.status === statusFilter;
  });

  return (
    <div className="py-6 sm:py-10 min-h-[calc(100vh-160px)]">
      <Container>
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-6 border-b border-chocolate/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-heading font-bold mb-2">
              <Users className="w-3.5 h-3.5 text-emerald-700" />
              <span>Verified Food Receiver / Community Organization</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-heading text-chocolate tracking-tight">
              {user?.organizationName || user?.fullName || 'Receiver Portal'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-chocolate/75">
              Explore available surplus food, manage requests, and coordinate pickups for your community.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              onClick={downloadCollectionReport}
              leftIcon={<Download className="w-4 h-4" />}
              className="bg-white border-chocolate/20 text-chocolate hover:bg-cream-100 flex-1 sm:flex-none justify-center"
            >
              Export CSV
            </Button>
            <Link to="/explore" className="flex-1 sm:flex-none">
              <Button
                variant="primary"
                size="md"
                leftIcon={<Search className="w-4 h-4" />}
                className="w-full justify-center shadow-clay-btn"
              >
                Explore Food Listings
              </Button>
            </Link>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white border border-chocolate/10 shadow-sm overflow-x-auto mb-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'requests', label: `My Requests (${requests.length})` },
            { id: 'ready', label: `Ready for Pickup (${readyForPickup})` },
            { id: 'history', label: `Collection History (${completedCollections})` },
            { id: 'profile', label: 'Organization Profile' },
            { id: 'settings', label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-heading font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-chocolate/70 hover:bg-cream-100 hover:text-chocolate'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* =================================================================== */}
        {/* TAB 1: OVERVIEW                                                     */}
        {/* =================================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
              <div className="clay-card p-4 sm:p-5 bg-white">
                <span className="text-[11px] font-bold text-chocolate/60 uppercase tracking-wider block">
                  Available Food
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-heading text-burntOrange mt-1 block">
                  {availableCount}
                </span>
              </div>

              <div className="clay-card p-4 sm:p-5 bg-white border-l-4 border-l-amber-500">
                <span className="text-[11px] font-bold text-chocolate/60 uppercase tracking-wider block">
                  My Pending
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-heading text-amber-600 mt-1 block">
                  {activeRequests}
                </span>
              </div>

              <div className="clay-card p-4 sm:p-5 bg-white border-l-4 border-l-blue-600">
                <span className="text-[11px] font-bold text-chocolate/60 uppercase tracking-wider block">
                  Approved
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-heading text-blue-700 mt-1 block">
                  {approvedRequests}
                </span>
              </div>

              <div className="clay-card p-4 sm:p-5 bg-white border-l-4 border-l-purple-600">
                <span className="text-[11px] font-bold text-chocolate/60 uppercase tracking-wider block">
                  Ready for Pickup
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-heading text-purple-700 mt-1 block">
                  {readyForPickup}
                </span>
              </div>

              <div className="clay-card p-4 sm:p-5 bg-white border-l-4 border-l-emerald-600">
                <span className="text-[11px] font-bold text-chocolate/60 uppercase tracking-wider block">
                  Completed
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-heading text-emerald-700 mt-1 block">
                  {completedCollections}
                </span>
              </div>

              <div className="clay-card p-4 sm:p-5 bg-white border-l-4 border-l-emerald-600">
                <span className="text-[11px] font-bold text-chocolate/60 uppercase tracking-wider block">
                  Rescued (kg)
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-heading text-emerald-800 mt-1 block">
                  {Math.round(totalKgCollected * 10) / 10}
                </span>
              </div>
            </div>

            {/* Ready for Pickup Action Callout */}
            {readyForPickup > 0 && (
              <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-purple-950 text-base">
                      {readyForPickup} {readyForPickup === 1 ? 'donation is' : 'donations are'} ready for your pickup!
                    </h3>
                    <p className="text-xs text-purple-900/70">
                      The donor has prepared the food. Confirm receipt once you arrive and collect.
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveTab('ready')}
                  className="bg-purple-700 hover:bg-purple-800 text-white shadow-sm"
                >
                  View Pickup Locations
                </Button>
              </div>
            )}

            {/* Active Requests Summary */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold font-heading text-chocolate">
                  Active Food Requests
                </h2>
                <button
                  onClick={() => setActiveTab('requests')}
                  className="text-xs font-bold text-burntOrange hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View All ({requests.length}) <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {requests.length === 0 ? (
                <div className="clay-card p-10 bg-white text-center rounded-3xl border border-dashed border-chocolate/20">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading font-bold text-chocolate">No Food Requests Yet</h3>
                  <p className="text-xs text-chocolate/60 mt-1 max-w-sm mx-auto">
                    Browse surplus food listings donated by local restaurants and households to request meals for your shelter.
                  </p>
                  <Link to="/explore">
                    <Button variant="primary" size="sm" className="mt-4 shadow-clay-btn">
                      Explore Food Listings
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.slice(0, 4).map((req) => (
                    <div
                      key={req._id}
                      className="clay-card p-4 bg-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              req.status === 'Ready for Pickup'
                                ? 'bg-purple-100 text-purple-800'
                                : req.status === 'Approved'
                                ? 'bg-blue-100 text-blue-800'
                                : req.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {req.status}
                          </span>
                          <span className="font-heading font-bold text-chocolate text-sm">
                            {req.listing?.title}
                          </span>
                        </div>
                        <p className="text-xs text-chocolate/70 mt-1">
                          Offered by {req.donor?.organizationName || req.donor?.fullName} • {req.requestedQuantity} {req.listing?.quantityUnit} requested
                        </p>
                      </div>

                      {req.status === 'Ready for Pickup' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleConfirmCollection(req)}
                          className="bg-purple-700 hover:bg-purple-800 text-white w-full sm:w-auto"
                          leftIcon={<PackageCheck className="w-4 h-4" />}
                        >
                          Confirm Collection
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: MY REQUESTS                                                  */}
        {/* =================================================================== */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-chocolate/10 overflow-x-auto">
              <span className="text-xs font-bold text-chocolate/60">Status:</span>
              {['All', 'Pending', 'Approved', 'Ready for Pickup', 'Completed', 'Rejected', 'Cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                    statusFilter === st
                      ? 'bg-emerald-800 text-white'
                      : 'bg-cream-100 text-chocolate/70 hover:bg-cream-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {filteredRequests.length === 0 ? (
              <div className="clay-card p-12 bg-white text-center rounded-3xl">
                <p className="text-sm font-bold text-chocolate">No requests match this filter.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((req) => (
                  <div key={req._id} className="clay-card p-5 bg-white rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            req.status === 'Ready for Pickup'
                              ? 'bg-purple-100 text-purple-800'
                              : req.status === 'Approved'
                              ? 'bg-blue-100 text-blue-800'
                              : req.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'Pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {req.status}
                        </span>
                        <h3 className="font-heading font-extrabold text-chocolate text-base">
                          {req.listing?.title}
                        </h3>
                      </div>

                      <div className="text-xs text-chocolate/80 space-y-1">
                        <p>
                          <strong>Donor:</strong> {req.donor?.organizationName || req.donor?.fullName} ({req.donor?.phone})
                        </p>
                        <p>
                          <strong>Pickup Location:</strong> {req.listing?.pickupAddress?.street}, {req.listing?.pickupAddress?.city}
                        </p>
                        <p>
                          <strong>Requested:</strong> <span className="font-bold text-burntOrange">{req.requestedQuantity} {req.listing?.quantityUnit}</span> for {req.beneficiaryCount} people
                        </p>
                        {req.rejectionReason && (
                          <p className="text-softRed"><strong>Decline Reason:</strong> {req.rejectionReason}</p>
                        )}

                        {/* Request Tracking Timeline */}
                        <div className="pt-3 pb-1 border-t border-chocolate/10">
                          <div className="flex items-center justify-between max-w-md text-[10px] font-bold">
                            {['Pending', 'Approved', 'Ready for Pickup', 'Completed'].map((step, idx) => {
                              const stepOrder = { Pending: 1, Approved: 2, 'Ready for Pickup': 3, Completed: 4 };
                              const currentOrder = stepOrder[req.status] || 0;
                              const isDone = currentOrder >= idx + 1;
                              const isCurrent = currentOrder === idx + 1;
                              return (
                                <div key={step} className="flex flex-col items-center flex-1">
                                  <div
                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${
                                      isDone ? 'bg-emerald-600 text-white' : 'bg-cream-200 text-chocolate/50'
                                    }`}
                                  >
                                    {idx + 1}
                                  </div>
                                  <span className={`mt-1 text-center truncate px-0.5 ${isCurrent ? 'text-burntOrange font-extrabold' : 'text-chocolate/60'}`}>
                                    {step}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-chocolate/10">
                      {req.status === 'Ready for Pickup' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleConfirmCollection(req)}
                          className="bg-purple-700 hover:bg-purple-800 text-white w-full md:w-auto shadow-sm"
                          leftIcon={<PackageCheck className="w-4 h-4" />}
                        >
                          Confirm Collection
                        </Button>
                      )}

                      {['Pending', 'Approved'].includes(req.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelRequest(req._id)}
                          className="text-softRed border-softRed/30 hover:bg-softRed/10 w-full md:w-auto"
                        >
                          Cancel Request
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: READY FOR PICKUP                                             */}
        {/* =================================================================== */}
        {activeTab === 'ready' && (
          <div className="space-y-6">
            <h2 className="text-xl font-extrabold font-heading text-chocolate">
              Donations Ready for Pickup
            </h2>

            {requests.filter((r) => r.status === 'Ready for Pickup').length === 0 ? (
              <div className="clay-card p-12 bg-white text-center rounded-3xl">
                <p className="text-sm font-bold text-chocolate">No food donations are currently waiting for pickup.</p>
                <p className="text-xs text-chocolate/60 mt-1">Once a donor marks your approved request ready, details and location will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requests
                  .filter((r) => r.status === 'Ready for Pickup')
                  .map((item) => (
                    <div key={item._id} className="clay-card p-6 bg-white border-2 border-purple-200 rounded-3xl space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold uppercase tracking-wider">
                            Ready Now
                          </span>
                          <h3 className="font-heading font-extrabold text-chocolate text-lg mt-2">
                            {item.listing?.title}
                          </h3>
                        </div>
                        <span className="text-xl font-extrabold text-burntOrange font-heading">
                          {item.requestedQuantity} {item.listing?.quantityUnit}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-cream-100/70 border border-chocolate/10 text-xs space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-chocolate flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-burntOrange shrink-0" />
                            <span>{item.listing?.pickupAddress?.street}, {item.listing?.pickupAddress?.city}</span>
                          </p>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              typeof item.listing?.pickupAddress === 'object'
                                ? `${item.listing?.pickupAddress?.street || ''}, ${item.listing?.pickupAddress?.city || ''}`
                                : item.listing?.pickupAddress || 'Delhi'
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-burntOrange hover:text-burntOrange-600 shrink-0 hover:underline"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            Directions
                          </a>
                        </div>
                        <p className="text-chocolate/70">
                          <strong>Donor Contact:</strong> {item.donor?.fullName} ({item.donor?.phone})
                        </p>
                      </div>

                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => handleConfirmCollection(item)}
                        className="w-full justify-center bg-purple-700 hover:bg-purple-800 shadow-md text-sm"
                        leftIcon={<PackageCheck className="w-5 h-5" />}
                      >
                        Confirm Food Collection
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: COLLECTION HISTORY                                           */}
        {/* =================================================================== */}
        {activeTab === 'history' && (
          <div className="clay-card p-6 sm:p-8 bg-white rounded-3xl space-y-6">
            <h2 className="text-xl font-extrabold font-heading text-chocolate">
              Completed Food Collections
            </h2>

            {requests.filter((r) => r.status === 'Completed').length === 0 ? (
              <p className="text-xs text-chocolate/60 text-center py-8">
                No completed collections recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {requests
                  .filter((r) => r.status === 'Completed')
                  .map((item) => (
                    <div key={item._id} className="p-4 rounded-2xl bg-cream-50 border border-chocolate/10 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-chocolate text-sm">{item.listing?.title}</p>
                        <p className="text-chocolate/60">
                          Donated by {item.donor?.organizationName || item.donor?.fullName} • Received on {new Date(item.completedAt || item.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono">
                          {item.requestedQuantity} {item.listing?.quantityUnit}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 5: PROFILE & SETTINGS                                          */}
        {/* =================================================================== */}
        {(activeTab === 'profile' || activeTab === 'settings') && (
          <div className="clay-card p-6 sm:p-8 bg-white max-w-2xl mx-auto rounded-3xl space-y-6">
            <h2 className="text-xl font-extrabold font-heading text-chocolate">
              {activeTab === 'profile' ? 'Organization Profile' : 'Settings'}
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <label className="text-xs font-bold text-chocolate/60 block">Organization Name</label>
                <p className="font-bold text-chocolate">{user?.organizationName || 'Community Shelter'}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-chocolate/60 block">Contact Representative</label>
                <p className="font-bold text-chocolate">{user?.fullName}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-chocolate/60 block">Email</label>
                <p className="font-bold text-chocolate">{user?.email}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-chocolate/60 block">Phone</label>
                <p className="font-bold text-chocolate">{user?.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-chocolate/60 block">Assigned Role</label>
                <p className="font-bold text-emerald-800">{user?.role}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-chocolate/10 flex justify-end">
              <Button variant="outline" size="sm" onClick={logout}>
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </Container>

      <CollectionVerificationModal
        isOpen={collectionModalOpen}
        onClose={() => {
          setCollectionModalOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        onSuccess={() => {
          setCollectionModalOpen(false);
          setSelectedRequest(null);
          fetchReceiverData();
        }}
      />
    </div>
  );
}
