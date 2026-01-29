import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { Calendar, MapPin, Plus, Edit, Building2, Tag, ArrowUpDown, X, Search, Filter, AlertCircle } from 'lucide-react';
import { isEventExpired } from '../lib/dateUtils';

type Event = Database['public']['Tables']['events']['Row'];

interface EventsListProps {
  onCreateEvent: () => void;
  onEditEvent: (event: Event) => void;
}

type SortField = 'brand' | 'type' | 'date' | 'city' | 'sponsor';
type SortDirection = 'asc' | 'desc';

interface SortCriteria {
  field: SortField;
  direction: SortDirection;
}

interface Filters {
  islive: 'all' | 'live' | 'not-live';
  type: string;
  brand: string;
  date: 'all' | 'upcoming' | 'past';
}

const brandColors: Record<string, { bg: string; border: string; text: string }> = {
  'ITx': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  'Sentinel': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  'CDAIO': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  'Marketverse': { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
};

const typeColors: Record<string, { accent: string }> = {
  'forum': { accent: 'from-violet-500 to-violet-600' },
  'dinner': { accent: 'from-orange-500 to-orange-600' },
  'virtual roundtable': { accent: 'from-cyan-500 to-cyan-600' },
  'learn and go': { accent: 'from-green-500 to-green-600' },
  'VEB': { accent: 'from-pink-500 to-pink-600' },
  'elevated experience': { accent: 'from-blue-500 to-blue-600' },
};

export function EventsList({ onCreateEvent, onEditEvent }: EventsListProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorts, setSorts] = useState<SortCriteria[]>([{ field: 'date', direction: 'asc' }]);
  const [sponsorSearch, setSponsorSearch] = useState('');
  const [filters, setFilters] = useState<Filters>({
    islive: 'all',
    type: '',
    brand: '',
    date: 'upcoming',
  });
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [expiredLiveEvents, setExpiredLiveEvents] = useState<Event[]>([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchFilterOptions();
  }, [sorts, sponsorSearch, filters]);

  async function fetchFilterOptions() {
    const { data } = await supabase
      .from('events')
      .select('type, brand');

    if (data) {
      const types = [...new Set(data.map(e => e.type).filter(Boolean))];
      const brands = [...new Set(data.map(e => e.brand).filter(Boolean))];
      setAvailableTypes(types);
      setAvailableBrands(brands);
    }
  }

  async function fetchEvents() {
    try {
      let query = supabase.from('events').select('*, event_sponsors(name)');

      if (filters.islive === 'live') {
        query = query.eq('islive', true);
      } else if (filters.islive === 'not-live') {
        query = query.eq('islive', false);
      }

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.brand) {
        query = query.eq('brand', filters.brand);
      }

      if (sponsorSearch.trim()) {
        query = query.filter('event_sponsors.name', 'ilike', `%${sponsorSearch.trim()}%`);
      }

      for (const sort of sorts) {
        if (sort.field === 'sponsor') {
          continue;
        }
        query = query.order(sort.field, { ascending: sort.direction === 'asc' });
      }

      const { data, error } = await query;

      if (error) throw error;

      let processedEvents = (data || []).map((event: any) => {
        const { event_sponsors, ...eventData } = event;
        return eventData;
      });

      processedEvents = Array.from(
        new Map(processedEvents.map((e: Event) => [e.id, e])).values()
      );

      if (filters.date === 'past') {
        processedEvents = processedEvents.filter((event: Event) =>
          event.date && isEventExpired(event.date)
        );
      } else if (filters.date === 'upcoming') {
        processedEvents = processedEvents.filter((event: Event) =>
          event.date && !isEventExpired(event.date)
        );
      }

      if (sorts.some(s => s.field === 'sponsor')) {
        const sponsorSort = sorts.find(s => s.field === 'sponsor');
        const sponsorData = await Promise.all(
          processedEvents.map(async (event: Event) => {
            const { data: sponsors } = await supabase
              .from('event_sponsors')
              .select('name')
              .eq('event_id', event.id)
              .order('name', { ascending: true })
              .limit(1);
            return { event, sponsor: sponsors?.[0]?.name || '' };
          })
        );

        sponsorData.sort((a, b) => {
          const comparison = a.sponsor.localeCompare(b.sponsor);
          return sponsorSort?.direction === 'asc' ? comparison : -comparison;
        });

        processedEvents = sponsorData.map(item => item.event);
      }

      setEvents(processedEvents);

      const expired = processedEvents.filter(
        (event: Event) => event.islive && isEventExpired(event.date)
      );
      setExpiredLiveEvents(expired);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleSort(field: SortField) {
    const existingIndex = sorts.findIndex(s => s.field === field);

    if (existingIndex === -1) {
      setSorts([...sorts, { field, direction: 'asc' }]);
    } else {
      const existing = sorts[existingIndex];
      if (existing.direction === 'asc') {
        const newSorts = [...sorts];
        newSorts[existingIndex] = { field, direction: 'desc' };
        setSorts(newSorts);
      } else {
        setSorts(sorts.filter((_, i) => i !== existingIndex));
      }
    }
  }

  function clearAllSorts() {
    setSorts([{ field: 'date', direction: 'asc' }]);
  }

  function getCardColors(event: Event) {
    const brandColor = brandColors[event.brand] || { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' };
    const typeColor = typeColors[event.type?.toLowerCase()] || { accent: 'from-slate-400 to-slate-500' };
    return { brandColor, typeColor };
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  function stripHtml(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  function clearFilters() {
    setFilters({
      islive: 'all',
      type: '',
      brand: '',
      date: 'all',
    });
  }

  async function handleBulkUncheckPastEvents() {
    setBulkUpdating(true);
    setShowBulkConfirm(false);

    try {
      const expiredIds = expiredLiveEvents.map(e => e.id);

      for (const id of expiredIds) {
        await supabase
          .from('events')
          .update({ islive: false, updated_at: new Date().toISOString() })
          .eq('id', id);
      }

      await fetchEvents();
    } catch (error) {
      console.error('Error updating events:', error);
    } finally {
      setBulkUpdating(false);
    }
  }

  const hasActiveFilters = filters.islive !== 'all' || filters.type || filters.brand || filters.date !== 'all';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-slate-600 text-lg">Loading events...</div>
      </div>
    );
  }

  const sortButtons: Array<{ field: SortField; label: string }> = [
    { field: 'brand', label: 'Brand' },
    { field: 'type', label: 'Type' },
    { field: 'date', label: 'Date' },
    { field: 'city', label: 'City' },
    { field: 'sponsor', label: 'Sponsor' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Events</h1>
            <p className="text-slate-600">Manage and track all your events</p>
          </div>
          <button
            onClick={onCreateEvent}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg hover:shadow-xl"
          >
            <Plus size={20} />
            Create Event
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          {expiredLiveEvents.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle size={20} />
                  <span className="font-semibold">
                    {expiredLiveEvents.length} past event{expiredLiveEvents.length !== 1 ? 's' : ''} still marked as live
                  </span>
                </div>
                <button
                  onClick={() => setShowBulkConfirm(true)}
                  disabled={bulkUpdating}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                >
                  {bulkUpdating ? 'Updating...' : `Uncheck ${expiredLiveEvents.length} Past Event${expiredLiveEvents.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-slate-200">
            <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Filter size={16} />
              Filters:
            </span>
            <select
              value={filters.islive}
              onChange={(e) => setFilters({ ...filters, islive: e.target.value as 'all' | 'live' | 'not-live' })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all bg-white"
            >
              <option value="all">All Events</option>
              <option value="live">Live Only</option>
              <option value="not-live">Not Live</option>
            </select>
            <select
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value as 'all' | 'upcoming' | 'past' })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all bg-white"
            >
              <option value="all">All Dates</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
            <select
              value={filters.brand}
              onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all bg-white"
            >
              <option value="">All Brands</option>
              {availableBrands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all bg-white"
            >
              <option value="">All Types</option>
              {availableTypes.map(type => (
                <option key={type} value={type} className="capitalize">{type}</option>
              ))}
            </select>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X size={14} />
                Clear Filters
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-sm font-semibold text-slate-700">Sort by:</span>
            {sortButtons.map(({ field, label }) => {
              const sortIndex = sorts.findIndex(s => s.field === field);
              const isActive = sortIndex !== -1;
              const direction = isActive ? sorts[sortIndex].direction : 'asc';
              const priority = isActive ? sortIndex + 1 : null;

              return (
                <button
                  key={field}
                  onClick={() => toggleSort(field)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {label}
                  {isActive && (
                    <>
                      <ArrowUpDown size={14} className={direction === 'desc' ? 'rotate-180' : ''} />
                      <span className="text-xs bg-white/20 rounded px-1.5 py-0.5">{priority}</span>
                    </>
                  )}
                </button>
              );
            })}
            {sorts.length > 1 && (
              <button
                onClick={clearAllSorts}
                className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X size={14} />
                Clear Sorts
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search by sponsor name..."
              value={sponsorSearch}
              onChange={(e) => setSponsorSearch(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
            />
            {sponsorSearch && (
              <button
                onClick={() => setSponsorSearch('')}
                className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-20">
            <Calendar size={64} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No events yet</h3>
            <p className="text-slate-500 mb-6">Get started by creating your first event</p>
            <button
              onClick={onCreateEvent}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus size={20} />
              Create Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const { brandColor, typeColor } = getCardColors(event);
              const isExpiredAndLive = event.islive && isEventExpired(event.date);
              return (
                <div
                  key={event.id}
                  className={`${isExpiredAndLive ? 'bg-red-50 border-red-500' : `${brandColor.bg} ${brandColor.border}`} border-2 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer relative`}
                  onClick={() => onEditEvent(event)}
                >
                  <div className="p-6 bg-white/60 backdrop-blur-sm">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-semibold text-slate-900 group-hover:text-slate-700 transition-colors line-clamp-2">
                        {event.title}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditEvent(event);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white/50 rounded-lg transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                    </div>

                    {isExpiredAndLive && (
                      <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-red-100 border border-red-300 rounded-lg">
                        <AlertCircle size={16} className="text-red-600" />
                        <span className="text-sm font-semibold text-red-700">Expired - Still Live</span>
                      </div>
                    )}

                    {event.blurb && (
                      <p className="text-slate-600 mb-4 line-clamp-2">{stripHtml(event.blurb)}</p>
                    )}

                    <div className="space-y-2 text-sm">
                      {event.date && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <Calendar size={16} className="text-slate-400" />
                          <span>{formatDate(event.date)} {event.timezone && `(${event.timezone})`}</span>
                        </div>
                      )}
                      {(event.city || event.venue) && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <MapPin size={16} className="text-slate-400" />
                          <span>{[event.city, event.venue].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                      {event.type && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <Tag size={16} className="text-slate-400" />
                          <span className="capitalize">{event.type}</span>
                        </div>
                      )}
                      {event.brand && (
                        <div className={`flex items-center gap-2 ${brandColor.text} font-medium`}>
                          <Building2 size={16} />
                          <span>{event.brand}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`h-2 bg-gradient-to-r ${typeColor.accent} group-hover:h-3 transition-all duration-300`}></div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showBulkConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Uncheck Past Events?</h3>
            <p className="text-slate-600 mb-6">
              This will mark {expiredLiveEvents.length} past event{expiredLiveEvents.length !== 1 ? 's' : ''} as not live. This action will update all events that have passed their date but are still marked as live.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkConfirm(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUncheckPastEvents}
                disabled={bulkUpdating}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {bulkUpdating ? 'Updating...' : 'Uncheck All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
