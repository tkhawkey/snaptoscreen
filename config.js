// =====================================================================
//  Snap to Screen: settings
//  Paste in the library project's URL and public key.
//  (Supabase dashboard → Project Settings → API. Use the "anon public"
//  key or the "publishable" key – NEVER the service_role / secret key.)
// =====================================================================
window.SNAP_CONFIG = {
  supabaseUrl: 'https://qjysbzyzlqdnjnizirxu.supabase.co',
  supabaseAnonKey: 'sb_publishable_qvcH21IHxpi_QYHY6GxnwA_SGniJp_5',

  // Branding
  schoolShort: 'CIS',
  appName: 'Snap to Screen',

  // Photo size sent from the phone (longest edge, pixels) and JPEG quality.
  // 1400 / 0.75 gives roughly 200–300 KB per photo, still sharp on a board.
  // (Was 1600 / 0.8, about 300–450 KB.)
  maxImageSize: 1400,
  jpegQuality: 0.75,
};
