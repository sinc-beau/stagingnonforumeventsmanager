# WordPress Events Display Plugin - Development Instructions

## Overview
Create a WordPress plugin that connects to the Supabase events database and displays event cards with sponsor images. The plugin should support filtering by brand and event type, and automatically link events to the correct domain based on their brand.

## Database Schema Reference

### Events Table (`events`)
- `id` (uuid) - Primary key
- `title` (text) - Event title
- `slug` (text) - URL slug for the event
- `date` (timestamptz, nullable) - Event date/time (null for VEB and Virtual Roundtable)
- `timezone` (text) - Timezone string
- `city` (text) - City location
- `brand` (text) - One of: ITx, Sentinel, CDAIO, Marketverse
- `venue` (text) - Venue name
- `venue_address` (text) - Full venue address
- `venue_link` (text) - URL to venue website
- `type` (text) - One of: Dinner, Forum, Learn & Go, VEB, Virtual Roundtable
- `blurb` (text) - Short description (HTML)
- `hubspot_form_id` (text) - HubSpot form ID
- `islive` (boolean) - Whether event is live/published
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### Event Sponsors Table (`event_sponsors`)
- `id` (uuid) - Primary key
- `event_id` (uuid) - Foreign key to events
- `name` (text) - Sponsor name
- `about` (text) - Description
- `logo_url` (text) - URL to sponsor logo
- `asset_link` (text) - Link to sponsor assets
- `sponsor_short_description` (text) - Short description
- `order_index` (integer) - Display order
- `created_at` (timestamptz)

### Event Speakers Table (`event_speakers`)
- `id` (uuid) - Primary key
- `event_id` (uuid) - Foreign key to events
- `name` (text) - Speaker name
- `about` (text) - Biography
- `headshot_url` (text) - URL to headshot
- `order_index` (integer) - Display order
- `created_at` (timestamptz)

### Agenda Items Table (`agenda_items`)
- `id` (uuid) - Primary key
- `event_id` (uuid) - Foreign key to events
- `time_slot` (text) - Time range (e.g., "9:00 AM - 10:00 AM")
- `title` (text) - Agenda item title
- `description` (text) - Description (HTML)
- `order_index` (integer) - Display order
- `created_at` (timestamptz)

## Plugin Structure

### File Organization
```
wp-events-display/
├── wp-events-display.php (main plugin file)
├── includes/
│   ├── class-database-connection.php
│   ├── class-events-query.php
│   └── class-events-shortcode.php
├── assets/
│   ├── css/
│   │   └── events-display.css
│   └── js/
│       └── events-filter.js
└── README.md
```

## Implementation Requirements

### 1. Database Connection (class-database-connection.php)

Create a class to handle Supabase API connections:

```php
class WP_Events_Database_Connection {
    private $supabase_url;
    private $supabase_key;

    public function __construct() {
        // Store these in WordPress options or as constants
        $this->supabase_url = get_option('events_supabase_url');
        $this->supabase_key = get_option('events_supabase_anon_key');
    }

    public function query($table, $filters = [], $select = '*') {
        // Use Supabase REST API
        // https://[project-ref].supabase.co/rest/v1/[table]?select=[columns]
        // Add Authorization header with Bearer token
        // Return JSON decoded response
    }
}
```

**Security Note:** Store Supabase credentials securely using WordPress options or wp-config.php constants.

### 2. Events Query Class (class-events-query.php)

```php
class WP_Events_Query {
    private $db;

    public function get_events($args = []) {
        // Default args
        $defaults = [
            'brand' => null,      // Filter by brand
            'type' => null,       // Filter by event type
            'islive' => true,     // Only show live events
            'limit' => 10,        // Number of events
            'order' => 'date',    // Order by field
        ];

        $args = wp_parse_args($args, $defaults);

        // Query events table with filters
        // Return array of event objects with sponsors loaded
    }

    public function get_event_sponsors($event_id) {
        // Query event_sponsors table
        // Order by order_index
        // Return array of sponsor objects
    }
}
```

### 3. Shortcode Implementation (class-events-shortcode.php)

Create shortcode: `[events_display]`

**Shortcode Attributes:**
- `brand` - Filter by brand (ITx, Sentinel, CDAIO, Marketverse)
- `type` - Filter by type (Dinner, Forum, Learn & Go, VEB, Virtual Roundtable)
- `limit` - Number of events to show (default: 10)
- `show_filters` - Show filter dropdowns (default: true)

**Example Usage:**
```
[events_display brand="ITx" limit="5"]
[events_display type="Dinner" show_filters="false"]
[events_display show_filters="true"]
```

### 4. Event Card HTML Structure

Each event card should include:
- Event title (clickable link to event detail page)
- Event date and timezone (if not null)
- Event type badge
- Brand badge with color coding
- City/venue information
- Sponsor logos (displayed horizontally)
- Blurb excerpt

### 5. URL Construction Logic

Implement domain prefix logic:

```php
function get_event_url($event) {
    $slug = $event->slug;
    $brand = $event->brand;

    // Determine base URL by brand
    if ($brand === 'ITx') {
        $base_url = 'https://itxcollective.org';
    } else {
        // All other brands use sentinelnexus.org
        $base_url = 'https://sentinelnexus.org';
    }

    // Construct full URL
    return $base_url . '/events/' . $slug;
}
```

### 6. Filtering UI

Create dropdown filters for:
1. **Brand Filter:**
   - All Brands (default)
   - ITx
   - Sentinel
   - CDAIO
   - Marketverse

2. **Event Type Filter:**
   - All Types (default)
   - Dinner
   - Forum
   - Learn & Go
   - VEB
   - Virtual Roundtable

Use AJAX to reload events without page refresh when filters change.

### 7. Styling Requirements

Create CSS that matches the existing design system:
- Clean, modern card layout
- Responsive design (mobile-friendly)
- Color coding for brands:
  - ITx: Blue theme
  - Sentinel: Green theme
  - CDAIO: Orange theme
  - Marketverse: Purple theme
- Hover effects on cards
- Grid layout (2-3 columns on desktop, 1 column on mobile)

### 8. Plugin Settings Page

Add WordPress admin page under Settings → Events Display:
- Supabase URL input
- Supabase Anon Key input (password field)
- Test connection button
- Cache duration setting (default: 5 minutes)

### 9. Caching Strategy

Implement WordPress transients for caching:
- Cache events data for 5 minutes
- Clear cache when manually triggered from settings
- Cache key should include filter parameters

```php
function get_cached_events($args) {
    $cache_key = 'events_' . md5(serialize($args));
    $cached = get_transient($cache_key);

    if ($cached !== false) {
        return $cached;
    }

    $events = $this->query_events($args);
    set_transient($cache_key, $events, 5 * MINUTE_IN_SECONDS);

    return $events;
}
```

### 10. Error Handling

- Display user-friendly messages for connection errors
- Log errors to WordPress debug log
- Show fallback content when no events found
- Validate all inputs and sanitize outputs

## JavaScript Functionality

### Filter Handling (events-filter.js)

```javascript
// Handle filter changes
jQuery(document).ready(function($) {
    $('.events-filter').on('change', function() {
        var brand = $('#brand-filter').val();
        var type = $('#type-filter').val();

        // AJAX request to reload events
        $.ajax({
            url: eventsData.ajaxUrl,
            type: 'POST',
            data: {
                action: 'filter_events',
                brand: brand,
                type: type,
                nonce: eventsData.nonce
            },
            success: function(response) {
                $('#events-container').html(response);
            }
        });
    });
});
```

## Example Event Card HTML Output

```html
<div class="event-card" data-brand="ITx" data-type="Dinner">
    <a href="https://itxcollective.org/events/event-slug" class="event-card-link">
        <div class="event-card-header">
            <h3 class="event-title">Event Title Here</h3>
            <div class="event-badges">
                <span class="brand-badge brand-itx">ITx</span>
                <span class="type-badge">Dinner</span>
            </div>
        </div>

        <div class="event-details">
            <div class="event-date">
                <svg class="icon"><!-- Calendar icon --></svg>
                <span>January 15, 2026 (EST)</span>
            </div>
            <div class="event-location">
                <svg class="icon"><!-- Location icon --></svg>
                <span>New York, NY</span>
            </div>
        </div>

        <div class="event-blurb">
            <p>Short event description excerpt...</p>
        </div>

        <div class="event-sponsors">
            <h4>Sponsors</h4>
            <div class="sponsor-logos">
                <img src="sponsor-logo-1.jpg" alt="Sponsor Name">
                <img src="sponsor-logo-2.jpg" alt="Sponsor Name">
            </div>
        </div>
    </a>
</div>
```

## Security Checklist

- [ ] Sanitize all user inputs
- [ ] Escape all outputs
- [ ] Use WordPress nonces for AJAX requests
- [ ] Validate Supabase credentials
- [ ] Use HTTPS for all API calls
- [ ] Implement rate limiting on API calls
- [ ] Don't expose Supabase service role key (only use anon key)
- [ ] Validate event data before displaying

## Testing Checklist

- [ ] Test with different brands
- [ ] Test with different event types
- [ ] Test with events that have no date (VEB, Virtual Roundtable)
- [ ] Test with events that have no sponsors
- [ ] Test filter combinations
- [ ] Test on mobile devices
- [ ] Test with slow network (loading states)
- [ ] Test error handling (invalid credentials, network errors)
- [ ] Test cache invalidation
- [ ] Test with WordPress multisite

## API Query Examples

### Get Live Events
```
GET https://[project-ref].supabase.co/rest/v1/events?islive=eq.true&order=date.asc
Authorization: Bearer [anon-key]
```

### Get Events by Brand
```
GET https://[project-ref].supabase.co/rest/v1/events?brand=eq.ITx&islive=eq.true
Authorization: Bearer [anon-key]
```

### Get Event Sponsors
```
GET https://[project-ref].supabase.co/rest/v1/event_sponsors?event_id=eq.[uuid]&order=order_index.asc
Authorization: Bearer [anon-key]
```

## Additional Features to Consider

1. **Pagination** - For sites with many events
2. **Search** - Allow users to search events by title
3. **Date Range Filter** - Filter events by date range
4. **Export** - Allow admins to export event data
5. **Widget** - Create a WordPress widget for sidebar display
6. **Gutenberg Block** - Create a custom block for the block editor
7. **RSS Feed** - Generate RSS feed for events
8. **iCal Export** - Allow users to add events to calendar

## Resources

- [Supabase REST API Documentation](https://supabase.com/docs/guides/api)
- [WordPress Shortcode API](https://developer.wordpress.org/plugins/shortcodes/)
- [WordPress AJAX](https://developer.wordpress.org/plugins/javascript/ajax/)
- [WordPress Transients API](https://developer.wordpress.org/apis/transients/)

## Support

For issues related to the database schema or API access, refer to the main event management application or contact the database administrator.
