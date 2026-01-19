import { supabase } from './supabase';

interface SyncResult {
  success: boolean;
  message: string;
  database?: string;
}

export const syncEventToExternalDatabase = async (eventId: string): Promise<SyncResult> => {
  try {
    console.log('[SYNC] Starting sync for event:', eventId);

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .maybeSingle();

    if (eventError || !event) {
      console.error('[SYNC] Failed to fetch event:', eventError);
      return {
        success: false,
        message: `Failed to fetch event: ${eventError?.message || 'Event not found'}`,
      };
    }

    console.log('[SYNC] Event found:', event.title, 'Brand:', event.brand);

    if (!event.brand || event.brand.trim() === '') {
      console.error('[SYNC] No brand assigned to event');
      return {
        success: false,
        message: 'Event must have a brand assigned before syncing',
      };
    }

    const { data: speakers } = await supabase
      .from('event_speakers')
      .select('*')
      .eq('event_id', eventId);

    const { data: sponsors } = await supabase
      .from('event_sponsors')
      .select('*')
      .eq('event_id', eventId);

    const { data: agendaItems } = await supabase
      .from('agenda_items')
      .select('*')
      .eq('event_id', eventId);

    const syncPayload = {
      event,
      speakers: speakers || [],
      sponsors: sponsors || [],
      agendaItems: agendaItems || [],
    };

    console.log('[SYNC] Payload prepared:', {
      eventTitle: event.title,
      speakersCount: syncPayload.speakers.length,
      sponsorsCount: syncPayload.sponsors.length,
      agendaItemsCount: syncPayload.agendaItems.length,
      brand: event.brand,
    });

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-event`;
    console.log('[SYNC] Calling Edge Function:', apiUrl);

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return {
        success: false,
        message: 'You must be logged in to sync events',
      };
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(syncPayload),
    });

    console.log('[SYNC] Edge Function response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[SYNC] Edge Function error response:', errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'Unknown error' };
      }

      return {
        success: false,
        message: errorData.error || `Sync failed with status: ${response.status}`,
      };
    }

    const result = await response.json();
    console.log('[SYNC] Success response:', result);

    return {
      success: true,
      message: `Event successfully synced to ${event.brand} database`,
      database: event.brand,
    };
  } catch (error) {
    console.error('[SYNC] Exception caught:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred during sync',
    };
  }
};
