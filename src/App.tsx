import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { EventsList } from './components/EventsList';
import { CreateEventModal } from './components/CreateEventModal';
import { EventDetail } from './components/EventDetail';
import type { Database } from './lib/database.types';

type Event = Database['public']['Tables']['events']['Row'];
type View = 'list' | 'create' | 'detail';

function App() {
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (authMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setAuthError('Sign up successful! You can now sign in.');
        setAuthMode('signin');
        setPassword('');
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentView('list');
    setEmail('');
    setPassword('');
  }

  function handleCreateEvent() {
    setCurrentView('create');
  }

  function handleEditEvent(event: Event) {
    setSelectedEvent(event);
    setCurrentView('detail');
  }

  function handleBack() {
    setCurrentView('list');
    setSelectedEvent(null);
    setRefreshKey(prev => prev + 1);
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Events Manager</h1>
          <p className="text-slate-600 mb-8">
            {authMode === 'signin' ? 'Sign in to manage your events' : 'Create an account to get started'}
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            {authError && (
              <div className={`px-4 py-3 rounded-lg text-sm ${
                authError.includes('successful')
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {authError}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
              {authMode === 'signup' && (
                <p className="mt-1 text-xs text-slate-500">Minimum 6 characters</p>
              )}
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {authLoading ? 'Loading...' : authMode === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                setAuthError(null);
              }}
              className="text-slate-600 hover:text-slate-900 text-sm transition-colors"
            >
              {authMode === 'signin'
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"
              }
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentView === 'list' && (
        <div>
          <div className="absolute top-4 right-4">
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign Out
            </button>
          </div>
          <EventsList
            key={refreshKey}
            onCreateEvent={handleCreateEvent}
            onEditEvent={handleEditEvent}
          />
        </div>
      )}

      {currentView === 'create' && (
        <CreateEventModal
          onClose={handleBack}
          onEventCreated={handleBack}
        />
      )}

      {currentView === 'detail' && selectedEvent && (
        <EventDetail
          event={selectedEvent}
          onBack={handleBack}
          onEventUpdated={handleBack}
          onEventDeleted={handleBack}
        />
      )}
    </>
  );
}

export default App;
