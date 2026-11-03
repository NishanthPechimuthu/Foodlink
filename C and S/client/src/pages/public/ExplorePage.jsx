import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Filter,
  SlidersHorizontal,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Leaf,
  LayoutGrid,
  Map as MapIcon,
} from 'lucide-react';
import Container from '../../components/common/Container';
import Button from '../../components/common/Button';
import FoodCard from '../../components/food/FoodCard';
import FoodDetailModal from '../../components/food/FoodDetailModal';
import RequestFoodModal from '../../components/food/RequestFoodModal';
import FoodLoader from '../../components/animations/FoodLoader';
import FoodMap from '../../components/map/FoodMap';
import { SAMPLE_FOOD_LISTINGS } from '../../services/sampleFoodData';
import foodService from '../../services/food.service';
import { useAuth } from '../../context/AuthContext';
import { sileo } from 'sileo';

export default function ExplorePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFromDatabase, setIsFromDatabase] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Filters & Query state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [locationFilter, setLocationFilter] = useState('');
  const [debouncedLocation, setDebouncedLocation] = useState('');
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'

  // Modals state
  const [selectedFood, setSelectedFood] = useState(null);
  const [requestListing, setRequestListing] = useState(null);

  // Debounce search and location inputs to prevent spamming the backend
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLocation(locationFilter.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [locationFilter]);

  const categories = [
    'All',
    'Cooked Meals',
    'Rice and Grains',
    'Fruits',
    'Vegetables',
    'Bakery',
    'Dairy Products',
    'Packaged Food',
    'Other',
  ];

  const fetchLiveFood = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const params = {
        page,
        limit: 9,
        search: debouncedSearch || undefined,
        city: debouncedLocation || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        isVegetarian: isVegOnly ? 'true' : undefined,
        sortBy,
      };

      const res = await foodService.getAvailableFood(params);
      if (res && res.success && Array.isArray(res.listings)) {
        setListings(res.listings);
        setTotalPages(res.pagination?.pages || 1);
        setTotalCount(res.pagination?.total || res.listings.length);
        setIsFromDatabase(true);
      } else {
        setListings([]);
        setTotalPages(1);
        setTotalCount(0);
        setIsFromDatabase(true);
      }
    } catch (err) {
      console.error('Failed to fetch from MongoDB:', err);
      const errorMsg =
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK'
          ? 'Cannot connect to backend server. Please verify backend is running on port 5001.'
          : err.message || 'Database connection error.');
      setApiError(errorMsg);
      setListings([]);
      setIsFromDatabase(false);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [page, debouncedSearch, debouncedLocation, selectedCategory, isVegOnly, sortBy]);

  useEffect(() => {
    fetchLiveFood();
  }, [fetchLiveFood]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLiveFood();
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setLocationFilter('');
    setIsVegOnly(false);
    setSortBy('newest');
    setPage(1);
  };

  const handleOpenRequest = (food) => {
    if (!user) {
      sileo.warning({
        title: 'Authentication Required',
        description: 'Please sign in or register as a Receiver to request food.',
      });
      navigate('/login');
      return;
    }

    if (user.role === 'Donor') {
      sileo.info({
        title: 'Donor Account Detected',
        description: 'You are signed in as a Donor. Only verified Receiver accounts can request surplus food.',
      });
      return;
    }

    setRequestListing(food);
  };

  return (
    <div className="py-10 sm:py-14 space-y-10">
      {/* Detail Modal */}
      <FoodDetailModal
        food={selectedFood}
        isOpen={!!selectedFood}
        onClose={() => setSelectedFood(null)}
        onRequest={(food) => handleOpenRequest(food)}
      />

      {/* Request Food Modal */}
      {requestListing && (
        <RequestFoodModal
          isOpen={!!requestListing}
          listing={requestListing}
          onClose={() => setRequestListing(null)}
          onRequestSubmitted={() => {
            fetchLiveFood();
          }}
        />
      )}

      {/* Page Header */}
      <section>
        <Container>
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-burntOrange/10 text-burntOrange border border-burntOrange/20">
                <Sparkles className="w-3.5 h-3.5" />
                Real-Time Community Food Map
              </span>
              {isFromDatabase && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  MongoDB Atlas Live
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-chocolate tracking-tight">
              Explore Available <span className="text-burntOrange">Food</span>
            </h1>
            <p className="mt-3 text-base text-chocolate/75 max-w-2xl">
              Browse surplus food listed by verified restaurants, grocery stores, and households in your community. Real-time availability protected by OTP verification.
            </p>
          </div>
        </Container>
      </section>

      {/* Search & Filter Bar */}
      <section>
        <Container>
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-chocolate/10 shadow-clay-card space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
              {/* Search Keyword */}
              <div className="md:col-span-5 relative">
                <Search className="w-5 h-5 text-chocolate/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by food name, ingredients, or donor..."
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-cream-50 border border-chocolate/15 text-sm text-chocolate focus:outline-none focus:ring-2 focus:ring-burntOrange/30 focus:border-burntOrange transition-all"
                />
              </div>

              {/* Location Input */}
              <div className="md:col-span-4 relative">
                <MapPin className="w-5 h-5 text-chocolate/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={locationFilter}
                  onChange={(e) => {
                    setLocationFilter(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Filter by locality or neighborhood..."
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-cream-50 border border-chocolate/15 text-sm text-chocolate focus:outline-none focus:ring-2 focus:ring-burntOrange/30 focus:border-burntOrange transition-all"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="md:col-span-3 relative">
                <SlidersHorizontal className="w-4 h-4 text-chocolate/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-8 py-3 rounded-2xl bg-cream-50 border border-chocolate/15 text-sm font-semibold text-chocolate focus:outline-none focus:ring-2 focus:ring-burntOrange/30 focus:border-burntOrange transition-all cursor-pointer appearance-none"
                >
                  <option value="newest">Sort: Newest Listed</option>
                  <option value="expiring-soon">Sort: Expiring Soon</option>
                  <option value="quantity-desc">Sort: Highest Quantity</option>
                  <option value="quantity-asc">Sort: Lowest Quantity</option>
                </select>
              </div>
            </div>

            {/* Category Pills & Veg toggle */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-chocolate/10">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-bold transition-all shrink-0 cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-burntOrange text-white shadow-sm'
                        : 'bg-cream-100 text-chocolate/80 hover:bg-cream-200 border border-chocolate/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Vegetarian filter toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setIsVegOnly(!isVegOnly);
                    setPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    isVegOnly
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                      : 'bg-cream-100 text-chocolate/80 hover:bg-cream-200 border-chocolate/10'
                  }`}
                >
                  <Leaf className="w-3.5 h-3.5" />
                  Vegetarian Only
                </button>

                {/* View Mode Toggle: Grid vs Map */}
                <div className="flex items-center bg-cream-100 rounded-xl p-0.5 border border-chocolate/10">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'grid'
                        ? 'bg-white text-chocolate shadow-sm'
                        : 'text-chocolate/60 hover:text-chocolate'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('map')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'map'
                        ? 'bg-white text-chocolate shadow-sm'
                        : 'text-chocolate/60 hover:text-chocolate'
                    }`}
                  >
                    <MapIcon className="w-3.5 h-3.5 text-burntOrange" />
                    Map View
                  </button>
                </div>

                {/* Refresh */}
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-2 rounded-xl bg-cream-100 hover:bg-cream-200 text-chocolate/70 hover:text-chocolate transition-colors border border-chocolate/10 cursor-pointer"
                  title="Refresh Listings"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Listings Grid */}
      <section>
        <Container>
          {loading ? (
            <div className="py-20 flex justify-center">
              <FoodLoader
                size="md"
                message="Gathering available food in your area from MongoDB Atlas..."
              />
            </div>
          ) : apiError ? (
            /* Database / API Error State */
            <div className="py-16 text-center max-w-md mx-auto clay-card bg-white p-8 border border-red-200">
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="font-heading font-bold text-xl text-chocolate">
                Database Connection Issue
              </h3>
              <p className="mt-2 text-sm text-chocolate/75 leading-relaxed">
                {apiError}
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button variant="primary" size="sm" onClick={handleRefresh}>
                  Retry Connection
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Reset Filters
                </Button>
              </div>
            </div>
          ) : listings.length > 0 ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between text-xs text-chocolate/70">
                <span>
                  Showing <strong>{listings.length}</strong> available food listings ({totalCount} total)
                </span>
                <span className="font-semibold text-emerald-700">
                  ● Verified active community listings
                </span>
              </div>

              {viewMode === 'map' ? (
                <div className="space-y-4">
                  <div className="bg-white p-2 rounded-3xl border border-chocolate/10 shadow-clay-card overflow-hidden">
                    <FoodMap
                      listings={listings}
                      onSelectListing={(food) => setSelectedFood(food)}
                      height="580px"
                    />
                  </div>
                  <p className="text-center text-xs text-chocolate/60">
                    💡 Click any pin on the map to view food details and submit a claim request.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {listings.map((food) => (
                    <FoodCard
                      key={food._id || food.id}
                      food={food}
                      onSelect={(item) => setSelectedFood(item)}
                    />
                  ))}
                </div>
              )}

              {/* Pagination controls if totalPages > 1 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-6 border-t border-chocolate/10">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    leftIcon={<ChevronLeft className="w-4 h-4" />}
                  >
                    Previous
                  </Button>
                  <span className="text-xs font-bold text-chocolate px-3">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="py-16 text-center max-w-md mx-auto clay-card bg-white p-8 border border-chocolate/10">
              <div className="w-16 h-16 rounded-full bg-cream-200 text-burntOrange flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="font-heading font-bold text-xl text-chocolate">
                No matching food found
              </h3>
              <p className="mt-2 text-sm text-chocolate/70">
                Try adjusting your search terms, clearing location filters, or viewing other food categories.
              </p>
              <div className="mt-6">
                <Button variant="outlineOrange" size="sm" onClick={handleReset}>
                  Reset All Filters
                </Button>
              </div>
            </div>
          )}
        </Container>
      </section>
    </div>
  );
}
