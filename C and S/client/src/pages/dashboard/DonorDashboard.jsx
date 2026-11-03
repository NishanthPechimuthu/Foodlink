import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Heart,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  Truck,
  Users,
  Search,
  Filter,
  Eye,
  Trash2,
  Calendar,
  MapPin,
  ChevronRight,
  TrendingUp,
  XCircle,
  User,
  Settings as SettingsIcon,
  Sparkles,
  ArrowRight,
  Utensils,
  Download,
} from "lucide-react";
import { sileo } from "sileo";
import Swal from "sweetalert2";
import Container from "../../components/common/Container";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import foodService from "../../services/food.service";
import requestService from "../../services/request.service";
import AddFoodModal from "../../components/food/AddFoodModal";
import FoodLoader from "../../components/animations/FoodLoader";

export default function DonorDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // State
  const [listings, setListings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [listingFilter, setListingFilter] = useState("All");
  const [requestFilter, setRequestFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch Donor Data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [listingsRes, requestsRes] = await Promise.all([
        foodService.getMyListings(),
        requestService.getIncomingRequests(),
      ]);

      setListings(listingsRes.listings || []);
      setRequests(requestsRes.requests || []);
    } catch (err) {
      console.warn("Dashboard fetch error:", err);
      sileo.error({
        title: "Data Sync Error",
        description: "Could not load your latest donation data.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute Statistics directly from MongoDB data
  const totalListings = listings.length;
  const activeListings = listings.filter(
    (l) => l.status === "Available",
  ).length;
  const pendingRequests = requests.filter((r) => r.status === "Pending").length;
  const approvedRequests = requests.filter((r) =>
    ["Approved", "Ready for Pickup"].includes(r.status),
  ).length;
  const completedDonations = requests.filter(
    (r) => r.status === "Completed",
  ).length;

  // Approximate total rescued kg from completed requests
  const totalKgRescued = requests
    .filter((r) => r.status === "Completed")
    .reduce((sum, r) => {
      const unit = r.listing?.quantityUnit || "kg";
      const qty = r.requestedQuantity || 0;
      if (unit === "grams") return sum + qty / 1000;
      if (unit === "meals") return sum + qty * 0.4;
      if (unit === "packets") return sum + qty * 0.5;
      return sum + qty;
    }, 0);

  // Check for listings expiring soon (within 12 hours)
  const expiringSoon = listings.filter((l) => {
    if (l.status !== "Available") return false;
    const diff = new Date(l.expiresAt).getTime() - Date.now();
    return diff > 0 && diff < 12 * 60 * 60 * 1000;
  });

  // Download donor activity report as CSV
  const downloadDonationReport = () => {
    const rows = [
      ["Food Title", "Category", "Quantity", "Unit", "Status", "Created At", "Expires At", "Pickup City"],
      ...listings.map((l) => [
        `"${(l.title || "").replace(/"/g, '""')}"`,
        l.category || "",
        l.quantity || 0,
        l.quantityUnit || "kg",
        l.status || "",
        new Date(l.createdAt).toLocaleDateString(),
        new Date(l.expiresAt).toLocaleDateString(),
        typeof l.pickupAddress === "object" ? l.pickupAddress?.city || "Delhi" : "Delhi",
      ]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FoodLink_Donor_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    sileo.success({ title: "Report Exported", description: "CSV activity report downloaded successfully." });
  };

  // Actions
  const handleApproveRequest = async (requestId) => {
    try {
      await requestService.approveRequest(requestId);
      sileo.success({
        title: "Request Approved!",
        description:
          "The requested quantity is reserved. You can mark it ready when prepared.",
      });
      fetchDashboardData();
    } catch (err) {
      sileo.error({
        title: "Action Failed",
        description:
          err.response?.data?.message || "Could not approve request.",
      });
    }
  };

  const handleRejectRequest = async (requestId) => {
    const { value: reason } = await Swal.fire({
      title: "Decline Food Request",
      input: "text",
      inputLabel: "Reason for declining (optional)",
      inputPlaceholder: "e.g. Food already committed or pickup time conflict",
      showCancelButton: true,
      confirmButtonText: "Decline Request",
      confirmButtonColor: "#4E342E",
      cancelButtonText: "Back",
    });

    if (reason !== undefined) {
      try {
        await requestService.rejectRequest(requestId, reason);
        sileo.info({
          title: "Request Declined",
          description: "The receiver has been notified.",
        });
        fetchDashboardData();
      } catch (err) {
        sileo.error({
          title: "Error",
          description:
            err.response?.data?.message || "Could not decline request.",
        });
      }
    }
  };

  const handleMarkReady = async (requestId) => {
    try {
      await requestService.markReadyForPickup(requestId);
      sileo.success({
        title: "Ready for Pickup!",
        description:
          "Receiver has been notified that the food is packaged and ready.",
      });
      fetchDashboardData();
    } catch (err) {
      sileo.error({
        title: "Action Failed",
        description: err.response?.data?.message || "Could not update request.",
      });
    }
  };

  const handleCancelListing = async (listingId) => {
    const confirm = await Swal.fire({
      title: "Cancel this listing?",
      text: "This will remove the listing from Explore and decline any pending requests.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Cancel Listing",
      confirmButtonColor: "#CC5500",
      cancelButtonText: "Keep Active",
    });

    if (confirm.isConfirmed) {
      try {
        await foodService.deleteFoodListing(listingId);
        sileo.info({
          title: "Listing Cancelled",
          description: "The food listing has been cancelled.",
        });
        fetchDashboardData();
      } catch (err) {
        sileo.error({
          title: "Cancellation Failed",
          description:
            err.response?.data?.message || "Could not cancel listing.",
        });
      }
    }
  };

  // Filtered lists
  const filteredListings = listings.filter((l) => {
    const matchesFilter = listingFilter === "All" || l.status === listingFilter;
    const matchesSearch =
      !searchQuery ||
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredRequests = requests.filter((r) => {
    if (requestFilter === "All") return true;
    return r.status === requestFilter;
  });

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center min-h-[60vh]">
        <FoodLoader size="lg" message="Loading your donor dashboard & community listings..." />
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-10 min-h-[calc(100vh-160px)]">
      <Container>
        {/* Top Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-6 border-b border-chocolate/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-burntOrange/10 border border-burntOrange/20 text-burntOrange text-xs font-heading font-bold mb-2">
              <Heart className="w-3.5 h-3.5 fill-burntOrange" />
              <span>Verified Food Donor</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-heading text-chocolate tracking-tight">
              {user?.organizationName || user?.fullName || "Donor Portal"}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-chocolate/75">
              Manage surplus food donations, incoming receiver requests, and
              community impact.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              onClick={downloadDonationReport}
              leftIcon={<Download className="w-4 h-4" />}
              className="bg-white border-chocolate/20 text-chocolate hover:bg-cream-100 flex-1 sm:flex-none justify-center"
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setAddModalOpen(true)}
              leftIcon={<PlusCircle className="w-5 h-5" />}
              className="shadow-clay-btn flex-1 sm:flex-none justify-center"
            >
              Add Food Listing
            </Button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white border border-chocolate/10 shadow-sm overflow-x-auto mb-8">
          {[
            { id: "overview", label: "Overview" },
            { id: "listings", label: `My Listings (${totalListings})` },
            {
              id: "requests",
              label: `Incoming Requests (${pendingRequests} Pending)`,
            },
            {
              id: "history",
              label: `Donation History (${completedDonations})`,
            },
            { id: "profile", label: "Profile & Location" },
            { id: "settings", label: "Settings" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-heading font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-burntOrange text-white shadow-clay-btn"
                  : "text-chocolate/70 hover:bg-cream-100 hover:text-chocolate"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* =================================================================== */}
        {/* TAB 1: OVERVIEW                                                     */}
        {/* =================================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Expiry Warning Alert Banner */}
            {expiringSoon.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-burntOrange/15 to-amber-500/10 border border-burntOrange/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-burntOrange text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-chocolate text-sm sm:text-base">
                      {expiringSoon.length} {expiringSoon.length === 1 ? "Listing Expires" : "Listings Expire"} Within 12 Hours!
                    </h3>
                    <p className="text-xs text-chocolate/75">
                      {expiringSoon.map((l) => l.title).join(", ")} will expire soon. Confirm requests promptly to prevent food waste.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("listings")}
                  className="bg-white border-burntOrange/40 text-burntOrange hover:bg-burntOrange/10 whitespace-nowrap"
                >
                  View Listings
                </Button>
              </div>
            )}

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
              <div className="clay-card p-4 sm:p-5 bg-white">
                <span className="text-[11px] font-bold text-chocolate/60 uppercase tracking-wider block">
                  Total Listings
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-heading text-chocolate mt-1 block">
                  {totalListings}
                </span>
              </div>

              <div className="clay-card p-4 sm:p-5 bg-white border-l-4 border-l-emerald-600">
                <span className="text-[11px] font-bold text-chocolate/60 uppercase tracking-wider block">
                  Active Available
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-heading text-emerald-700 mt-1 block">
                  {activeListings}
                </span>
              </div>

              <div className="clay-card p-4 sm:p-5 bg-white border-l-4 border-l-amber-500">
                <span className="text-[11px] font-bold text-chocolate/60 uppercase tracking-wider block">
                  Pending Requests
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-heading text-amber-600 mt-1 block">
                  {pendingRequests}
                </span>
              </div>

              <div className="clay-card p-4 sm:p-5 bg-white border-l-4 border-l-burntOrange">
                <span className="text-[11px] font-bold text-chocolate/60 uppercase tracking-wider block">
                  Approved / Ready
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-heading text-burntOrange mt-1 block">
                  {approvedRequests}
                </span>
              </div>

              <div className="clay-card p-4 sm:p-5 bg-white border-l-4 border-l-indigo-600">
                <span className="text-[11px] font-bold text-chocolate/60 uppercase tracking-wider block">
                  Completed
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-heading text-indigo-700 mt-1 block">
                  {completedDonations}
                </span>
              </div>

              <div className="clay-card p-4 sm:p-5 bg-white border-l-4 border-l-burntOrange">
                <span className="text-[11px] font-bold text-chocolate/60 uppercase tracking-wider block">
                  Rescued (kg)
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-heading text-burntOrange mt-1 block">
                  {Math.round(totalKgRescued * 10) / 10}
                </span>
              </div>
            </div>

            {/* Quick Action & Urgent Attention Banner */}
            {pendingRequests > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-chocolate text-sm sm:text-base">
                      You have {pendingRequests} incoming food{" "}
                      {pendingRequests === 1 ? "request" : "requests"} waiting
                    </h3>
                    <p className="text-xs text-chocolate/70">
                      Community shelters are waiting for your approval to
                      arrange volunteer pickup.
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveTab("requests")}
                  className="shadow-sm whitespace-nowrap"
                >
                  Review Requests
                </Button>
              </div>
            )}

            {/* Active Listings Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold font-heading text-chocolate">
                  Current Active Listings
                </h2>
                <button
                  onClick={() => setActiveTab("listings")}
                  className="text-xs font-bold text-burntOrange hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View All ({totalListings}){" "}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {listings.filter((l) => l.status === "Available").length === 0 ? (
                <div className="clay-card p-8 bg-white text-center rounded-3xl border border-dashed border-chocolate/20">
                  <div className="w-12 h-12 rounded-2xl bg-cream-100 text-burntOrange mx-auto flex items-center justify-center mb-3">
                    <Utensils className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading font-bold text-chocolate">
                    No Active Listings
                  </h3>
                  <p className="text-xs text-chocolate/60 mt-1 max-w-sm mx-auto">
                    You currently have no food published on the Explore page.
                    Publish extra meals to support local community members.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setAddModalOpen(true)}
                    className="mt-4 shadow-clay-btn"
                    leftIcon={<PlusCircle className="w-4 h-4" />}
                  >
                    Add Food Listing
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {listings
                    .filter((l) => l.status === "Available")
                    .slice(0, 3)
                    .map((item) => (
                      <div
                        key={item._id}
                        className="clay-card bg-white p-4 flex flex-col justify-between"
                      >
                        <div>
                          <div className="h-36 rounded-xl overflow-hidden mb-3 relative bg-cream-100">
                            <img
                              src={
                                item.images?.[0] ||
                                "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800"
                              }
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-bold font-heading text-chocolate">
                              {item.category}
                            </span>
                          </div>
                          <h3 className="font-heading font-bold text-chocolate text-base leading-tight">
                            {item.title}
                          </h3>
                          <div className="mt-2 flex items-center justify-between text-xs text-chocolate/70">
                            <span>Available:</span>
                            <span className="font-extrabold text-burntOrange">
                              {item.availableQuantity} {item.quantityUnit}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-chocolate/10 flex items-center justify-between">
                          <span className="text-[11px] text-chocolate/60 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Exp:{" "}
                            {new Date(item.expiresAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            Live
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: MY LISTINGS                                                  */}
        {/* =================================================================== */}
        {activeTab === "listings" && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-chocolate/10 shadow-sm">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-chocolate/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search your listings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-cream-50 border border-chocolate/15 text-xs text-chocolate focus:border-burntOrange focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                <span className="text-xs font-bold text-chocolate/60 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Status:
                </span>
                {[
                  "All",
                  "Available",
                  "Fully Requested",
                  "Reserved",
                  "Completed",
                  "Cancelled",
                ].map((st) => (
                  <button
                    key={st}
                    onClick={() => setListingFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                      listingFilter === st
                        ? "bg-burntOrange text-white"
                        : "bg-cream-100 text-chocolate/70 hover:bg-cream-200"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Listings Grid */}
            {filteredListings.length === 0 ? (
              <div className="clay-card p-12 bg-white text-center rounded-3xl">
                <p className="text-sm font-bold text-chocolate">
                  No food listings match your criteria.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((item) => (
                  <div
                    key={item._id}
                    className="clay-card bg-white p-5 rounded-2xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-44 rounded-xl overflow-hidden mb-3 relative bg-cream-100">
                        <img
                          src={
                            item.images?.[0] ||
                            "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800"
                          }
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        <span
                          className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            item.status === "Available"
                              ? "bg-emerald-600 text-white"
                              : item.status === "Fully Requested" ||
                                  item.status === "Reserved"
                                ? "bg-amber-600 text-white"
                                : item.status === "Completed"
                                  ? "bg-indigo-600 text-white"
                                  : "bg-gray-600 text-white"
                          }`}
                        >
                          {item.status}
                        </span>
                        <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-md bg-white/95 text-[11px] font-bold text-chocolate">
                          {item.category}
                        </span>
                      </div>

                      <h3 className="font-heading font-extrabold text-chocolate text-lg leading-tight">
                        {item.title}
                      </h3>
                      <p className="text-xs text-chocolate/70 mt-1 line-clamp-2">
                        {item.description || "No description provided."}
                      </p>

                      <div className="mt-4 p-3 rounded-xl bg-cream-50 border border-chocolate/10 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-chocolate/60">
                            Total Quantity:
                          </span>
                          <span className="font-bold text-chocolate">
                            {item.quantity} {item.quantityUnit}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-chocolate/60">Available:</span>
                          <span className="font-extrabold text-burntOrange">
                            {item.availableQuantity} {item.quantityUnit}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-chocolate/60">Reserved:</span>
                          <span className="font-bold text-amber-700">
                            {item.reservedQuantity} {item.quantityUnit}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-chocolate/10 flex items-center justify-between">
                      <span className="text-[11px] text-chocolate/60">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>

                      {item.status === "Available" && (
                        <button
                          type="button"
                          onClick={() => handleCancelListing(item._id)}
                          className="text-xs font-bold text-softRed hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Cancel Listing
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: INCOMING REQUESTS                                            */}
        {/* =================================================================== */}
        {activeTab === "requests" && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-chocolate/10 overflow-x-auto">
              <span className="text-xs font-bold text-chocolate/60">
                Filter Requests:
              </span>
              {[
                "All",
                "Pending",
                "Approved",
                "Ready for Pickup",
                "Completed",
                "Rejected",
              ].map((st) => (
                <button
                  key={st}
                  onClick={() => setRequestFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                    requestFilter === st
                      ? "bg-burntOrange text-white"
                      : "bg-cream-100 text-chocolate/70 hover:bg-cream-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {filteredRequests.length === 0 ? (
              <div className="clay-card p-12 bg-white text-center rounded-3xl">
                <p className="text-sm font-bold text-chocolate">
                  No requests match this filter.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((req) => (
                  <div
                    key={req._id}
                    className="clay-card p-5 sm:p-6 bg-white rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            req.status === "Pending"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : req.status === "Approved"
                                ? "bg-blue-100 text-blue-800 border border-blue-300"
                                : req.status === "Ready for Pickup"
                                  ? "bg-purple-100 text-purple-800 border border-purple-300"
                                  : req.status === "Completed"
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                    : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {req.status}
                        </span>
                        <h3 className="font-heading font-extrabold text-chocolate text-base">
                          {req.listing?.title || "Food Listing"}
                        </h3>
                      </div>

                      <div className="text-xs text-chocolate/80 space-y-1">
                        <p>
                          <strong>Requested By:</strong>{" "}
                          {req.receiver?.organizationName ||
                            req.receiver?.fullName}{" "}
                          ({req.receiver?.phone})
                        </p>
                        <p>
                          <strong>Quantity:</strong>{" "}
                          <span className="font-extrabold text-burntOrange">
                            {req.requestedQuantity} {req.listing?.quantityUnit}
                          </span>{" "}
                          • <strong>Beneficiaries:</strong>{" "}
                          {req.beneficiaryCount} people
                        </p>
                        {req.purpose && (
                          <p>
                            <strong>Purpose:</strong> {req.purpose}
                          </p>
                        )}
                        {req.notes && (
                          <p className="italic text-chocolate/70">
                            "{req.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Controls according to status */}
                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-chocolate/10">
                      {req.status === "Pending" && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApproveRequest(req._id)}
                            leftIcon={<CheckCircle2 className="w-4 h-4" />}
                            className="flex-1 md:flex-none"
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectRequest(req._id)}
                            leftIcon={<XCircle className="w-4 h-4" />}
                            className="flex-1 md:flex-none text-softRed border-softRed/30 hover:bg-softRed/10"
                          >
                            Decline
                          </Button>
                        </>
                      )}

                      {req.status === "Approved" && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleMarkReady(req._id)}
                          leftIcon={<Truck className="w-4 h-4" />}
                          className="bg-purple-700 hover:bg-purple-800 text-white w-full md:w-auto"
                        >
                          Mark Ready for Pickup
                        </Button>
                      )}

                      {req.status === "Ready for Pickup" && (
                        <span className="text-xs font-bold text-purple-700 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200">
                          <Clock className="w-4 h-4" /> Awaiting Receiver Pickup
                        </span>
                      )}

                      {req.status === "Completed" && (
                        <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
                          <PackageCheck className="w-4 h-4 text-emerald-600" />{" "}
                          Collected & Completed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: DONATION HISTORY & IMPACT                                    */}
        {/* =================================================================== */}
        {activeTab === "history" && (
          <div className="space-y-6">
            <div className="clay-card p-6 bg-white rounded-3xl">
              <h2 className="text-xl font-extrabold font-heading text-chocolate mb-4">
                Verified Community Impact
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-cream-100 text-center">
                  <span className="text-xs font-bold text-chocolate/60 uppercase">
                    Total Completed
                  </span>
                  <p className="text-3xl font-extrabold font-heading text-chocolate mt-1">
                    {completedDonations}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 text-center">
                  <span className="text-xs font-bold text-emerald-800 uppercase">
                    Rescued Weight
                  </span>
                  <p className="text-3xl font-extrabold font-heading text-emerald-700 mt-1">
                    {Math.round(totalKgRescued * 10) / 10} kg
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-burntOrange/10 text-center">
                  <span className="text-xs font-bold text-burntOrange uppercase">
                    Estimated People Fed
                  </span>
                  <p className="text-3xl font-extrabold font-heading text-burntOrange mt-1">
                    {requests
                      .filter((r) => r.status === "Completed")
                      .reduce((sum, r) => sum + (r.beneficiaryCount || 1), 0)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {requests.filter((r) => r.status === "Completed").length ===
                0 ? (
                  <p className="text-xs text-chocolate/60 text-center py-6">
                    No completed donations yet. When a receiver confirms food
                    pickup, verified impact records will appear here.
                  </p>
                ) : (
                  requests
                    .filter((r) => r.status === "Completed")
                    .map((item) => (
                      <div
                        key={item._id}
                        className="p-4 rounded-2xl bg-cream-50 border border-chocolate/10 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-chocolate text-sm">
                            {item.listing?.title}
                          </p>
                          <p className="text-chocolate/60">
                            Received by{" "}
                            {item.receiver?.organizationName ||
                              item.receiver?.fullName}{" "}
                            on{" "}
                            {new Date(
                              item.completedAt || item.updatedAt,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono">
                            {item.requestedQuantity}{" "}
                            {item.listing?.quantityUnit}
                          </span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 5: PROFILE & SETTINGS                                          */}
        {/* =================================================================== */}
        {(activeTab === "profile" || activeTab === "settings") && (
          <div className="clay-card p-6 sm:p-8 bg-white max-w-2xl mx-auto rounded-3xl space-y-6">
            <h2 className="text-xl font-extrabold font-heading text-chocolate">
              {activeTab === "profile"
                ? "Donor Profile & Coordinates"
                : "Account Settings"}
            </h2>

            <div className="space-y-4 text-sm">
              <div>
                <label className="text-xs font-bold text-chocolate/60 block">
                  Full Name
                </label>
                <p className="font-bold text-chocolate">{user?.fullName}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-chocolate/60 block">
                  Organization Name
                </label>
                <p className="font-bold text-chocolate">
                  {user?.organizationName || "Individual Donor"}
                </p>
              </div>
              <div>
                <label className="text-xs font-bold text-chocolate/60 block">
                  Email
                </label>
                <p className="font-bold text-chocolate">{user?.email}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-chocolate/60 block">
                  Phone
                </label>
                <p className="font-bold text-chocolate">
                  {user?.phone || "Not provided"}
                </p>
              </div>
              <div>
                <label className="text-xs font-bold text-chocolate/60 block">
                  City
                </label>
                <p className="font-bold text-chocolate">
                  {user?.address?.city || "New Delhi"}
                </p>
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

      {/* Add Food Modal with Phone OTP Verification Step */}
      <AddFoodModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onListingCreated={() => {
          fetchDashboardData();
          setActiveTab("listings");
        }}
      />
    </div>
  );
}
