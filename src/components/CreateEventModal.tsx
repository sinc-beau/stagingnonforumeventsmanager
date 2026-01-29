import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Plus, Trash2 } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';

interface CreateEventModalProps {
  onClose: () => void;
  onEventCreated: () => void;
}

interface Speaker {
  name: string;
  about: string;
  headshot_url: string;
}

interface Sponsor {
  name: string;
  about: string;
  logo_url: string;
  asset_link: string;
}

interface AgendaItem {
  time_slot: string;
  title: string;
  description: string;
}

const BRANDS = ['ITx', 'Sentinel', 'CDAIO', 'Marketverse'];
const EVENT_TYPES = ['Dinner', 'Elevated Experiences', 'Forum', 'Learn & Go', 'VEB', 'Virtual Roundtable'];

export function CreateEventModal({ onClose, onEventCreated }: CreateEventModalProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [timezone, setTimezone] = useState('');
  const [city, setCity] = useState('');
  const [brand, setBrand] = useState('');
  const [venue, setVenue] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [venueLink, setVenueLink] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [type, setType] = useState('');
  const [blurb, setBlurb] = useState('');
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [hubspotFormId, setHubspotFormId] = useState('');
  const [slug, setSlug] = useState('');
  const [islive, setIslive] = useState(false);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addSpeaker() {
    setSpeakers([...speakers, { name: '', about: '', headshot_url: '' }]);
  }

  function removeSpeaker(index: number) {
    setSpeakers(speakers.filter((_, i) => i !== index));
  }

  function updateSpeaker(index: number, field: keyof Speaker, value: string) {
    const updated = [...speakers];
    updated[index][field] = value;
    setSpeakers(updated);
  }

  function addSponsor() {
    setSponsors([...sponsors, { name: '', about: '', logo_url: '', asset_link: '' }]);
  }

  function removeSponsor(index: number) {
    setSponsors(sponsors.filter((_, i) => i !== index));
  }

  function updateSponsor(index: number, field: keyof Sponsor, value: string) {
    const updated = [...sponsors];
    updated[index][field] = value;
    setSponsors(updated);
  }

  function addAgendaItem() {
    setAgendaItems([...agendaItems, { time_slot: '', title: '', description: '' }]);
  }

  function removeAgendaItem(index: number) {
    setAgendaItems(agendaItems.filter((_, i) => i !== index));
  }

  function updateAgendaItem(index: number, field: keyof AgendaItem, value: string) {
    const updated = [...agendaItems];
    updated[index][field] = value;
    setAgendaItems(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('You must be logged in to create events');
        setLoading(false);
        return;
      }

      const { data: eventData, error: insertError } = await supabase
        .from('events')
        .insert({
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
          user_id: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (eventData) {
        if (speakers.length > 0) {
          const speakersToInsert = speakers
            .filter(s => s.name.trim())
            .map((speaker, index) => ({
              event_id: eventData.id,
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
        }

        if (sponsors.length > 0) {
          const sponsorsToInsert = sponsors
            .filter(s => s.name.trim())
            .map((sponsor, index) => ({
              event_id: eventData.id,
              name: sponsor.name,
              about: sponsor.about,
              logo_url: sponsor.logo_url,
              asset_link: sponsor.asset_link || '',
              order_index: index,
            }));

          if (sponsorsToInsert.length > 0) {
            const { error: sponsorsError } = await supabase
              .from('event_sponsors')
              .insert(sponsorsToInsert);

            if (sponsorsError) throw sponsorsError;
          }
        }

        if (agendaItems.length > 0) {
          const agendaToInsert = agendaItems
            .filter(a => a.time_slot.trim() || a.title.trim() || a.description.trim())
            .map((item, index) => ({
              event_id: eventData.id,
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
        }
      }

      onEventCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-slate-900">Create New Event</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
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

            <div className="md:col-span-2">
              <label htmlFor="slug" className="block text-sm font-semibold text-slate-700 mb-2">
                Event Slug
              </label>
              <input
                type="text"
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                placeholder="event-url-slug"
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

            <div className="md:col-span-2">
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
              <div key={index} className="mb-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
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
              <div key={index} className="mb-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
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
              <div key={index} className="mb-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
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
                    value={sponsor.asset_link}
                    onChange={(e) => updateSponsor(index, 'asset_link', e.target.value)}
                    placeholder="Asset Link"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
