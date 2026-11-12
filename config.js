// =====================================================================
//  Snap to Screen: settings
//  The Supabase project's URL and public key.
//  (Supabase dashboard → Project Settings → API. Use the "anon public"
//  key or the "publishable" key – NEVER the service_role / secret key.)
// =====================================================================
window.SNAP_CONFIG = {
  supabaseUrl: 'https://pvdzkcrxhqderwqlhiwo.supabase.co',
  supabaseAnonKey: 'sb_publishable_ojVGAgRBT0k9Vx8ylHF0Tg_x7WDmsdi',

  // Branding
  schoolShort: 'CIS',
  appName: 'Snap to Screen',

  // Photo size sent from the phone (longest edge, pixels) and JPEG quality.
  // 1400 / 0.75 gives roughly 200–300 KB per photo, still sharp on a board.
  // (Was 1600 / 0.8, about 300–450 KB.)
  maxImageSize: 1400,
  jpegQuality: 0.75,
};
