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
  // 1600 / 0.8 gives roughly 300–450 KB per photo.
  maxImageSize: 1600,
  jpegQuality: 0.8,
};
