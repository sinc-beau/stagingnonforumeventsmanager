import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Event {
  id: string;
  title: string;
  date: string;
  timezone: string;
  city: string;
  brand: string;
  venue: string;
  venue_address: string;
  venue_link: string;
  type: string;
  blurb: string;
  hubspot_form_id: string;
  slug: string;
  islive: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Speaker {
  id: string;
  event_id: string;
  name: string;
  about: string;
  headshot_url: string;
  order_index: number;
  created_at: string;
}

interface Sponsor {
  id: string;
  event_id: string;
  name: string;
  about: string;
  logo_url: string;
  asset_link: string;
  order_index: number;
  created_at: string;
}

interface AgendaItem {
  id: string;
  event_id: string;
  time_slot: string;
  title: string;
  description: string;
  order_index: number;
  created_at: string;
}

interface SyncPayload {
  event: Event;
  speakers: Speaker[];
  sponsors: Sponsor[];
  agendaItems: AgendaItem[];
}

const getBrandConfig = (brand: string): { url: string; serviceRoleKey: string } | null => {
  const brandUpper = brand.toUpperCase();

  const configs: Record<string, { url: string; serviceRoleKey: string }> = {
    'ITX': {
      url: Deno.env.get('ITX_SUPABASE_URL') || '',
      serviceRoleKey: Deno.env.get('ITX_SERVICE_ROLE_KEY') || '',
    },
    'SENTINEL': {
      url: Deno.env.get('SENTINEL_SUPABASE_URL') || '',
      serviceRoleKey: Deno.env.get('SENTINEL_SERVICE_ROLE_KEY') || '',
    },
    'MARKETVERSE': {
      url: Deno.env.get('MARKETVERSE_SUPABASE_URL') || '',
      serviceRoleKey: Deno.env.get('MARKETVERSE_SERVICE_ROLE_KEY') || '',
    },
    'CDAIO': {
      url: Deno.env.get('CDAIO_SUPABASE_URL') || '',
      serviceRoleKey: Deno.env.get('CDAIO_SERVICE_ROLE_KEY') || '',
    },
  };

  return configs[brandUpper] || null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('[EDGE] Parsing request body...');
    const body = await req.json();
    console.log('[EDGE] Body parsed, keys:', Object.keys(body));

    const { event, speakers, sponsors, agendaItems }: SyncPayload = body;

    if (!event) {
      throw new Error('Missing event in payload');
    }

    if (!event.brand || event.brand.trim() === '') {
      throw new Error('Event must have a brand assigned');
    }

    console.log('[EDGE] Received sync request for event:', event.title);
    console.log('[EDGE] Brand:', event.brand);

    const config = getBrandConfig(event.brand);

    if (!config) {
      throw new Error(`No database configuration found for brand: ${event.brand}`);
    }

    if (!config.url || !config.serviceRoleKey) {
      throw new Error(`Database configuration for ${event.brand} is incomplete`);
    }

    console.log('[EDGE] Target database:', config.url);
    console.log('[EDGE] Speakers:', speakers?.length || 0, 'Sponsors:', sponsors?.length || 0, 'Agenda items:', agendaItems?.length || 0);

    const targetSupabase = createClient(config.url, config.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('[EDGE] Supabase client created, starting event upsert');

    const { error: eventError } = await targetSupabase
      .from("events")
      .upsert({
        id: event.id,
        title: event.title,
        date: event.date,
        timezone: event.timezone,
        city: event.city,
        brand: event.brand,
        venue: event.venue,
        venue_address: event.venue_address,
        venue_link: event.venue_link,
        type: event.type,
        blurb: event.blurb,
        hubspot_form_id: event.hubspot_form_id,
        slug: event.slug,
        islive: event.islive,
        user_id: null,
        created_at: event.created_at,
        updated_at: event.updated_at,
      }, {
        onConflict: 'id'
      });

    if (eventError) {
      console.error('[EDGE] Event upsert failed:', eventError);
      throw new Error(`Failed to sync event: ${eventError.message}`);
    }

    console.log('[EDGE] Event upserted successfully');

    const { error: deleteSpeakersError } = await targetSupabase
      .from("event_speakers")
      .delete()
      .eq("event_id", event.id);

    if (deleteSpeakersError) {
      throw new Error(`Failed to delete old speakers: ${deleteSpeakersError.message}`);
    }

    if (speakers && speakers.length > 0) {
      const { error: speakersError } = await targetSupabase
        .from("event_speakers")
        .insert(speakers);

      if (speakersError) {
        throw new Error(`Failed to insert speakers: ${speakersError.message}`);
      }
    }

    const { error: deleteSponsorsError } = await targetSupabase
      .from("event_sponsors")
      .delete()
      .eq("event_id", event.id);

    if (deleteSponsorsError) {
      throw new Error(`Failed to delete old sponsors: ${deleteSponsorsError.message}`);
    }

    if (sponsors && sponsors.length > 0) {
      const { error: sponsorsError } = await targetSupabase
        .from("event_sponsors")
        .insert(sponsors);

      if (sponsorsError) {
        throw new Error(`Failed to insert sponsors: ${sponsorsError.message}`);
      }
    }

    const { error: deleteAgendaError } = await targetSupabase
      .from("agenda_items")
      .delete()
      .eq("event_id", event.id);

    if (deleteAgendaError) {
      throw new Error(`Failed to delete old agenda items: ${deleteAgendaError.message}`);
    }

    if (agendaItems && agendaItems.length > 0) {
      const { error: agendaError } = await targetSupabase
        .from("agenda_items")
        .insert(agendaItems);

      if (agendaError) {
        throw new Error(`Failed to insert agenda items: ${agendaError.message}`);
      }
    }

    console.log('[EDGE] All data synced successfully');

    return new Response(
      JSON.stringify({ success: true, message: "Event synced successfully" }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("[EDGE] Sync error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to sync event";
    console.error("[EDGE] Error message:", errorMessage);

    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});