import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { syncEventToExternalDatabase } from '../lib/syncService';
import { ArrowLeft, Trash2, Save, Plus, Download, Upload } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';

type Event = Database['public']['Tables']['events']['Row'];
type Speaker = Database['public']['Tables']['event_speakers']['Row'];
type Sponsor = Database['public']['Tables']['event_sponsors']['Row'];
type AgendaItem = Database['public']['Tables']['agenda_items']['Row'];

interface EventDetailProps {
  event: Event;
  onBack: () => void;
  onEventUpdated: () => void;
  onEventDeleted: () => void;
}

const BRANDS = ['ITx', 'Sentinel', 'CDAIO', 'Marketverse'];
const EVENT_TYPES = ['Dinner', 'Forum', 'Learn & Go', 'VEB', 'Virtual Roundtable'];

export function EventDetail({ event, onBack, onEventUpdated, onEventDeleted }: EventDetailProps) {
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(event.date ? event.date.substring(0, 16) : '');
  const [timezone, setTimezone] = useState(event.timezone);
  const [city, setCity] = useState(event.city);
  const [brand, setBrand] = useState(event.brand);
  const [venue, setVenue] = useState(event.venue);
  const [venueAddress, setVenueAddress] = useState(event.venue_address);
  const [venueLink, setVenueLink] = useState(event.venue_link);
  const [zipCode, setZipCode] = useState(event.zip_code);
  const [type, setType] = useState(event.type);
  const [blurb, setBlurb] = useState(event.blurb);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [hubspotFormId, setHubspotFormId] = useState(event.hubspot_form_id);
  const [slug, setSlug] = useState(event.slug);
  const [islive, setIslive] = useState(event.islive);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setTitle(event.title);
    setDate(event.date ? event.date.substring(0, 16) : '');
    setTimezone(event.timezone);
    setCity(event.city);
    setBrand(event.brand);
    setVenue(event.venue);
    setVenueAddress(event.venue_address);
    setVenueLink(event.venue_link);
    setZipCode(event.zip_code);
    setType(event.type);
    setBlurb(event.blurb);
    setHubspotFormId(event.hubspot_form_id);
    setSlug(event.slug);
    setIslive(event.islive);
    fetchSpeakersAndSponsors();
  }, [event]);

  async function fetchSpeakersAndSponsors() {
    const { data: speakersData } = await supabase
      .from('event_speakers')
      .select('*')
      .eq('event_id', event.id)
      .order('order_index', { ascending: true });

    const { data: sponsorsData } = await supabase
      .from('event_sponsors')
      .select('*')
      .eq('event_id', event.id)
      .order('order_index', { ascending: true });

    const { data: agendaData } = await supabase
      .from('agenda_items')
      .select('*')
      .eq('event_id', event.id)
      .order('order_index', { ascending: true });

    setSpeakers(speakersData || []);
    setSponsors(sponsorsData || []);
    setAgendaItems(agendaData || []);
  }

  function addSpeaker() {
    setSpeakers([...speakers, {
      id: crypto.randomUUID(),
      event_id: event.id,
      name: '',
      about: '',
      headshot_url: '',
      order_index: speakers.length,
      created_at: new Date().toISOString(),
    }]);
  }

  function removeSpeaker(index: number) {
    setSpeakers(speakers.filter((_, i) => i !== index));
  }

  function updateSpeaker(index: number, field: keyof Speaker, value: string | number) {
    const updated = [...speakers];
    (updated[index] as any)[field] = value;
    setSpeakers(updated);
  }

  function addSponsor() {
    setSponsors([...sponsors, {
      id: crypto.randomUUID(),
      event_id: event.id,
      name: '',
      about: '',
      logo_url: '',
      asset_link: '',
      sponsor_short_description: '',
      order_index: sponsors.length,
      created_at: new Date().toISOString(),
    }]);
  }

  function removeSponsor(index: number) {
    setSponsors(sponsors.filter((_, i) => i !== index));
  }

  function updateSponsor(index: number, field: keyof Sponsor, value: string | number) {
    const updated = [...sponsors];
    (updated[index] as any)[field] = value;
    setSponsors(updated);
  }

  function addAgendaItem() {
    setAgendaItems([...agendaItems, {
      id: crypto.randomUUID(),
      event_id: event.id,
      time_slot: '',
      title: '',
      description: '',
      order_index: agendaItems.length,
      created_at: new Date().toISOString(),
    }]);
  }

  function removeAgendaItem(index: number) {
    setAgendaItems(agendaItems.filter((_, i) => i !== index));
  }

  function updateAgendaItem(index: number, field: keyof AgendaItem, value: string | number) {
    const updated = [...agendaItems];
    (updated[index] as any)[field] = value;
    setAgendaItems(updated);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaveMessage(null);
    setLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('events')
        .update({
          title,
          date: date || null,
          timezone,
          city,
          brand,
          venue,
          venue_address: venueAddress,
          venue_link: venueLink,
          zip_code: zipCode,
          type,
          blurb,
          hubspot_form_id: hubspotFormId,
          slug,
          islive: islive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', event.id);

      if (updateError) throw updateError;

      const { error: deleteSpeakersError } = await supabase
        .from('event_speakers')
        .delete()
        .eq('event_id', event.id);

      if (deleteSpeakersError) throw deleteSpeakersError;

      const speakersToInsert = speakers
        .filter(s => s.name.trim())
        .map((speaker, index) => ({
          event_id: event.id,
          name: speaker.name,
          about: speaker.about,
          headshot_url: speaker.headshot_url,
          order_index: index,
        }));

      if (speakersToInsert.length > 0) {
        const { error: speakersError } = await supabase
          .from('event_speakers')
          .insert(speakersToInsert);

        if (speakersError) throw speakersError;
      }

      const { error: deleteSponsorsError } = await supabase
        .from('event_sponsors')
        .delete()
        .eq('event_id', event.id);

      if (deleteSponsorsError) throw deleteSponsorsError;

      const sponsorsToInsert = sponsors
        .filter(s => s.name.trim())
        .map((sponsor, index) => ({
          event_id: event.id,
          name: sponsor.name,
          about: sponsor.about,
          logo_url: sponsor.logo_url,
          asset_link: sponsor.asset_link || '',
          sponsor_short_description: sponsor.sponsor_short_description || '',
          order_index: index,
        }));

      if (sponsorsToInsert.length > 0) {
        const { error: sponsorsError } = await supabase
          .from('event_sponsors')
          .insert(sponsorsToInsert);

        if (sponsorsError) throw sponsorsError;
      }

      const { error: deleteAgendaError } = await supabase
        .from('agenda_items')
        .delete()
        .eq('event_id', event.id);

      if (deleteAgendaError) throw deleteAgendaError;

      const agendaToInsert = agendaItems
        .filter(a => a.time_slot.trim() || a.title.trim() || a.description.trim())
        .map((item, index) => ({
          event_id: event.id,
          time_slot: item.time_slot,
          title: item.title,
          description: item.description,
          order_index: index,
        }));

      if (agendaToInsert.length > 0) {
        const { error: agendaError } = await supabase
          .from('agenda_items')
          .insert(agendaToInsert);

        if (agendaError) throw agendaError;
      }

      setSaveMessage({
        type: 'success',
        text: 'Event saved successfully!',
      });

      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setError(null);
    setLoading(true);

    try {
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);

      if (deleteError) throw deleteError;

      onEventDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
      setLoading(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncMessage(null);

    const result = await syncEventToExternalDatabase(event.id);

    if (result.success) {
      setSyncMessage({
        type: 'success',
        text: result.message,
      });
    } else {
      setSyncMessage({
        type: 'error',
        text: result.message,
      });
    }

    setSyncing(false);

    setTimeout(() => {
      setSyncMessage(null);
    }, 5000);
  }

  function handleExportJSON() {
    const exportData = {
      event: {
        id: event.id,
        title,
        description: event.description,
        blurb,
        date: date || null,
        timezone,
        city,
        location: event.location,
        brand,
        type,
        venue,
        venue_address: venueAddress,
        venue_link: venueLink,
        hubspot_form_id: hubspotFormId,
        created_at: event.created_at,
        updated_at: event.updated_at,
      },
      agenda_items: agendaItems.map(item => ({
        time_slot: item.time_slot,
        title: item.title,
        description: item.description,
        order_index: item.order_index,
      })),
      speakers: speakers.map(speaker => ({
        name: speaker.name,
        about: speaker.about,
        headshot_url: speaker.headshot_url,
        order_index: speaker.order_index,
      })),
      sponsors: sponsors.map(sponsor => ({
        name: sponsor.name,
        about: sponsor.about,
        logo_url: sponsor.logo_url,
        asset_link: sponsor.asset_link,
        sponsor_short_description: sponsor.sponsor_short_description,
        order_index: sponsor.order_index,
      })),
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    const filename = `event-${event.id}-${new Date().toISOString().split('T')[0]}.json`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Events
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-8 py-6">
            <h1 className="text-3xl font-bold text-white">Edit Event</h1>
          </div>

          <form onSubmit={handleUpdate} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {saveMessage && (
              <div className={`${
                saveMessage.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              } border px-4 py-3 rounded-lg`}>
                {saveMessage.text}
              </div>
            )}

            {syncMessage && (
              <div className={`${
                syncMessage.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              } border px-4 py-3 rounded-lg`}>
                {syncMessage.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                  placeholder="Enter event title"
                />
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-semibold text-slate-700 mb-2">
                  Date & Time {type !== 'VEB' && type !== 'Virtual Roundtable' && '*'}
                </label>
                <input
                  type="datetime-local"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required={type !== 'VEB' && type !== 'Virtual Roundtable'}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label htmlFor="timezone" className="block text-sm font-semibold text-slate-700 mb-2">
                  Timezone
                </label>
                <input
                  type="text"
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                  placeholder="e.g., EST, PST, UTC"
                />
              </div>

              <div>
                <label htmlFor="islive" className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="islive"
                    checked={islive}
                    onChange={(e) => setIslive(e.target.checked)}
                    className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-2 focus:ring-slate-900"
                  />
                  <span className="text-sm font-semibold text-slate-700">Event is Live</span>
                </label>
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-semibold text-slate-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                  placeholder="Enter city"
                />
              </div>

              <div>
                <label htmlFor="brand" className="block text-sm font-semibold text-slate-700 mb-2">
                  Brand
                </label>
                <select
                  id="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                >
                  <option value="">Select brand</option>
                  {BRANDS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="venue" className="block text-sm font-semibold text-slate-700 mb-2">
                  Venue
                </label>
                <input
                  type="text"
                  id="venue"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                  placeholder="Enter venue name"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="venue_address" className="block text-sm font-semibold text-slate-700 mb-2">
                  Venue Address
                </label>
                <input
                  type="text"
                  id="venue_address"
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                  placeholder="Enter venue address"
                />
              </div>

              <div>
                <label htmlFor="zip_code" className="block text-sm font-semibold text-slate-700 mb-2">
                  Zip Code
                </label>
                <input
                  type="text"
                  id="zip_code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  maxLength={10}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                  placeholder="Enter zip code"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="venue_link" className="block text-sm font-semibold text-slate-700 mb-2">
                  Venue Link
                </label>
                <input
                  type="url"
                  id="venue_link"
                  value={venueLink}
                  onChange={(e) => setVenueLink(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                  placeholder="https://venue-website.com"
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-semibold text-slate-700 mb-2">
                  Event Type
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                >
                  <option value="">Select type</option>
                  {EVENT_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Blurb
                </label>
                <RichTextEditor
                  value={blurb}
                  onChange={setBlurb}
                  placeholder="Short event description"
                />
              </div>

              <div>
                <label htmlFor="hubspot_form_id" className="block text-sm font-semibold text-slate-700 mb-2">
                  HubSpot Form ID
                </label>
                <input
                  type="text"
                  id="hubspot_form_id"
                  value={hubspotFormId}
                  onChange={(e) => setHubspotFormId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                  placeholder="Enter HubSpot form ID"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-semibold text-slate-700 mb-2">
                  Event Slug
                </label>
                <input
                  type="text"
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                  placeholder="event-slug-here"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Agenda</h3>
                <button
                  type="button"
                  onClick={addAgendaItem}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                >
                  <Plus size={18} />
                  Add Time Slot
                </button>
              </div>

              {agendaItems.map((item, index) => (
                <div key={item.id} className="mb-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-sm font-semibold text-slate-700">Time Slot {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeAgendaItem(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={item.time_slot}
                      onChange={(e) => updateAgendaItem(index, 'time_slot', e.target.value)}
                      placeholder="Time slot (e.g., 9:00 AM - 10:00 AM)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm"
                    />
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateAgendaItem(index, 'title', e.target.value)}
                      placeholder="Title"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm"
                    />
                    <RichTextEditor
                      value={item.description}
                      onChange={(value) => updateAgendaItem(index, 'description', value)}
                      placeholder="Description"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Speakers</h3>
                <button
                  type="button"
                  onClick={addSpeaker}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                >
                  <Plus size={18} />
                  Add Speaker
                </button>
              </div>

              {speakers.map((speaker, index) => (
                <div key={speaker.id} className="mb-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-sm font-semibold text-slate-700">Speaker {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeSpeaker(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={speaker.name}
                      onChange={(e) => updateSpeaker(index, 'name', e.target.value)}
                      placeholder="Speaker name"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm"
                    />
                    <textarea
                      value={speaker.about}
                      onChange={(e) => updateSpeaker(index, 'about', e.target.value)}
                      placeholder="About speaker"
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all resize-none text-sm"
                    />
                    <input
                      type="text"
                      value={speaker.headshot_url}
                      onChange={(e) => updateSpeaker(index, 'headshot_url', e.target.value)}
                      placeholder="Headshot URL"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Sponsors</h3>
                <button
                  type="button"
                  onClick={addSponsor}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                >
                  <Plus size={18} />
                  Add Sponsor
                </button>
              </div>

              {sponsors.map((sponsor, index) => (
                <div key={sponsor.id} className="mb-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-sm font-semibold text-slate-700">Sponsor {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeSponsor(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={sponsor.name}
                      onChange={(e) => updateSponsor(index, 'name', e.target.value)}
                      placeholder="Sponsor name"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm"
                    />
                    <input
                      type="text"
                      value={sponsor.sponsor_short_description || ''}
                      onChange={(e) => updateSponsor(index, 'sponsor_short_description', e.target.value)}
                      placeholder="Short description"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm"
                    />
                    <textarea
                      value={sponsor.about}
                      onChange={(e) => updateSponsor(index, 'about', e.target.value)}
                      placeholder="About sponsor"
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all resize-none text-sm"
                    />
                    <input
                      type="text"
                      value={sponsor.logo_url}
                      onChange={(e) => updateSponsor(index, 'logo_url', e.target.value)}
                      placeholder="Logo URL"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm"
                    />
                    <input
                      type="text"
                      value={sponsor.asset_link || ''}
                      onChange={(e) => updateSponsor(index, 'asset_link', e.target.value)}
                      placeholder="Asset Link"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-6 border-t border-slate-200">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <Save size={20} />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleSync}
                disabled={syncing || !event.brand}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                title={!event.brand ? 'Please select a brand before syncing' : 'Sync to external database'}
              >
                <Upload size={20} />
                {syncing ? 'Syncing...' : 'Sync to External DB'}
              </button>
              <button
                type="button"
                onClick={handleExportJSON}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Download size={20} />
                Export JSON
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 text-sm text-slate-500 text-center">
          Created: {new Date(event.created_at).toLocaleString()} |
          Last updated: {new Date(event.updated_at).toLocaleString()}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Delete Event?</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete "{event.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
