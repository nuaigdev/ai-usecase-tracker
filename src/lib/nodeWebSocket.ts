// Server-only side-effect module. supabase-js's createClient() eagerly constructs
// a RealtimeClient, which looks up a global WebSocket constructor. Node < 22 has no
// global WebSocket, so createClient() throws on the Vercel Node 20 function runtime
// even though we never use realtime. Provide `ws` as the constructor so the lookup
// succeeds. No connection is ever opened (we don't subscribe to any channel).
//
// NEVER import this from browser code — `ws` is Node-only and browsers already have
// a native WebSocket. Import it only from server-only files (storage, admin route).
import WebSocket from 'ws';

if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === 'undefined') {
  (globalThis as { WebSocket?: unknown }).WebSocket = WebSocket;
}
