// Shared helpers for the phone and board pages.
(function () {
  const CFG = Object.assign(
    { supabaseUrl: '', supabaseAnonKey: '', schoolShort: 'CIS', appName: 'Snap to Screen', maxImageSize: 1400, jpegQuality: 0.75 },
    window.SNAP_CONFIG || {}
  );

  const configured =
    /^https:\/\/[^/]+/.test(CFG.supabaseUrl) &&
    !CFG.supabaseUrl.includes('YOUR-PROJECT') &&
    !!CFG.supabaseAnonKey &&
    !CFG.supabaseAnonKey.startsWith('YOUR-');

  let client = null;
  function sb() {
    if (!client) {
      if (!window.supabase || !window.supabase.createClient) throw new Error('The Supabase library did not load. Check the internet connection.');
      client = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
    return client;
  }

  async function rpc(fn, args) {
    const { data, error } = await sb().rpc(fn, args);
    if (error) throw new Error(error.message || String(error));
    return data;
  }

  function normCode(c) {
    return String(c || '').trim().toLowerCase();
  }

  async function sha256hex(s) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Realtime channel name is derived from the passcode, so only devices
  // that know it are listening on the same channel.
  async function channelName(code) {
    return 'snap-' + (await sha256hex('snap-channel:' + normCode(code))).slice(0, 24);
  }

  const store = {
    get(k, d = null) {
      try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; }
    },
    set(k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
    },
    del(k) {
      try { localStorage.removeItem(k); } catch {}
    },
    keys() {
      try { return Object.keys(localStorage); } catch { return []; }
    },
  };

  function loadImg(src) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => rej(new Error('Could not read that image'));
      img.src = src;
    });
  }

  function b64ToBlob(b64, type) {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type });
  }

  function friendlyError(e) {
    const m = (e && e.message) || String(e);
    if (/wrong passcode/i.test(m)) return 'That passcode was not recognised.';
    if (/failed to fetch|network/i.test(m)) return 'No connection. Check Wi-Fi and try again.';
    if (/could not find the function|schema cache/i.test(m)) return 'The database is not set up yet (run 1-setup.sql in Supabase).';
    return m;
  }

  window.Snap = { CFG, configured, sb, rpc, normCode, channelName, store, loadImg, b64ToBlob, friendlyError };
})();
