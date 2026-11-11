# Snap to Screen

Take a photo on your iPhone and it appears on the classroom board a second or two later. You can then zoom, annotate, compare and save it, and delete everything when the lesson ends.

| Page | Where | What it does |
|---|---|---|
| `phone.html` | iPhone (Safari, ideally added to the Home Screen) | A big button that opens the camera. Each photo is shrunk to 1600 px and sent straight away. |
| `board.html` | Laptop / SMART Board in Edge, full screen | Shows each new snap automatically. Zoom, annotate, compare, save and end the lesson. |

## One-time setup (about 10 minutes)

### 1. Database (Supabase library project)
1. Open the **library** project → **SQL Editor** → **New query**.
2. Open `supabase/1-setup.sql`, scroll to the bottom and **change the passcode** (three or four random words, e.g. `violet tractor puddle`). You can also change `'My classroom'` to a label such as `'Room 12'`.
3. Paste the whole file in and press **Run**. You should see "Success".
4. Optional: run `supabase/2-hourly-cleanup.sql` the same way. It adds an hourly job that deletes anything older than 12 hours, even when nobody opens the app.

Nothing here touches your existing library tables. Everything new starts with `snap`.

### 2. Settings
Open `config.js` and paste in:
- **supabaseUrl**: Project Settings → API → Project URL
- **supabaseAnonKey**: the **anon public** key (or the **publishable** key). Never use the `service_role` or secret key.

These are the same values your library site already uses.

### 3. Hosting
Upload the whole `snap-to-screen` folder to Netlify (drag and drop it onto **Sites**) or to GitHub Pages, like your other tools. You'll get an address such as `https://cis-snap.netlify.app/`.

### 4. First use
- **Board**: open `…/board.html` in Edge, enter the passcode and tick **Remember on this laptop**. Press **F** (or the full-screen button).
- **Phone**: scan the QR code on the board (or tap **Phone** in the top bar), enter the passcode once, then use **Share → Add to Home Screen** so it opens like an app.

## Using it in a lesson

**From the phone:** tap **Snap to board**, take the photo, tap **Use Photo**. The list underneath shows **✓ On the board** for each one. Use **Remove** to take a photo back off the board.

**On the board:**

| Tool | Use |
|---|---|
| Move / zoom | Drag to move. Pinch with two fingers to zoom (this works with any tool selected). Tap a cover to reveal or re-hide it. |
| Select | Tap any mark to select it. Drag it to move it, drag a corner handle to resize it, drag the round handle on the stalk to rotate it (it snaps to 15° steps, and the angle is shown while you turn it), or tap a colour to recolour it. **[** and **]** rotate the selection by 15°. The bar above it offers **Edit text**, **Duplicate**, **To front**, **Delete** and **Done**. Double-tap text to edit it. |
| Pen / highlighter | Draw freehand. |
| Arrow, box, circle | Drag from one corner to the other. |
| Text | Tap where the text should go. Choose a font (Clean, Handwriting, Serif, Typewriter), bold, italic, a background, size and colour, then press Enter. Tap existing text with this tool to edit it. Your last style is remembered. |
| Stamps | Tap the stamp button to choose: tick, cross, question mark, star, numbered steps (1, 2, 3… counting up automatically), WWW or EBI. Then tap (or drag) to place. |
| Redact | Drag a solid black box over a name. It stays visible even when annotations are hidden. |
| Hide & reveal | Drag a grey "?" card over part of the work. Tap it (with this tool or Move) and it slides away. Tap the dashed outline to cover it again. |
| Eraser | Tap or drag over a mark to remove it. |
| Spotlight | Drag a circle (or just tap) and everything else is dimmed. Drag inside the circle to move it, or drag a new one. Use **Turn off** at the top (or Esc) to remove it. |
| Laser pointer | Point without leaving marks. The red trail fades after a second. |
| Undo / redo / hide / clear | Bottom of the toolbar. Annotations are kept separately for each snap. |

**Bottom-right buttons:** zoom out, fit, zoom in, rotate, **crop** (drag the corners, then **Done**, or **Reset** to undo the crop), **grid** (tap repeatedly for medium, small or large squares, then off), and delete.

**Top bar extras:**
- **Timer**: choose 30 s to 10 min. The timer floats over the board and can be dragged by its title. It has −1 / +1 min, pause and reset, turns amber for the last 10 seconds, and beeps and flashes at zero.
- **Add**: an image from this laptop, or a new blank, squared, lined or dotted page to write on. Pages only exist on this board until you save them or end the lesson.

- **Auto-show** (on by default) switches to each new snap as it arrives. Turn it off when you don't want to lose your place: new snaps then wait in the strip.
- **Compare** shows two snaps side by side. Tap a pane, then tap a thumbnail to put it there. Each pane zooms separately.
- **Open**, drag and drop, or **Ctrl+V** puts an image from the laptop on the board. It isn't uploaded anywhere.
- **Save** offers this snap with or without annotations, both compared snaps as one image, or all snaps as a zip. Files go to Downloads. Type a lesson label (e.g. `9B Maths`) to have it added to the file names.
- **End lesson** lets you save everything first, then deletes all snaps from the cloud.

Keyboard: ← → previous/next · F full screen · H hide annotations · R rotate · G grid · 0 fit · + − zoom · Ctrl+Z / Ctrl+Y undo/redo · Ctrl+D duplicate selection · Delete removes the selection · Esc deselects / turns off spotlight / cancels crop · V move · S select · P pen · I highlighter · A arrow · B box · C circle · T text · M stamps · K hide & reveal · E eraser · O spotlight · L laser.

Saved images include crops, rotation and any covers that are still hidden. They leave out the grid, spotlight and laser.

## Privacy and automatic deletion
- Photos are deleted when you press **End lesson**. Anything older than **12 hours** is also deleted whenever the phone or board is used, and every hour if you ran `2-hourly-cleanup.sql`.
- The photo tables have no public access at all. The only way in is through the `snap_*` functions, and each one checks the passcode. Wrong guesses are slowed down.
- Keep faces out of shot, and use **Redact** to cover names.
- Annotations are remembered in the board browser until the lesson ends, so an accidental refresh doesn't lose them.

## Supabase footprint
Each photo is about 300–450 KB. Photos are stored as encoded text in the database rather than in Storage, which keeps setup to a single SQL file and makes deletion reliable. Even at about 30 snaps a day, you'd add roughly 250 MB of egress a month (5 GB allowance). Database use stays at a few MB because photos are deleted after the lesson. There are no Edge Functions.

## Changing things
- **Branding**: change `schoolShort` / `appName` in `config.js`, and `--brand` / `--accent` at the top of `board.css` and `phone.html`.
- **Photo size**: `maxImageSize` and `jpegQuality` in `config.js`.
- **Change the passcode**: in the SQL Editor run
  `update public.snap_rooms set code_hash = public.snap_hash('new words here');`
  then sign out on the phone and enter the new one. On the board, clear the site data or use the gate when it reappears.

## Updating the site (GitHub Pages)
GitHub Pages lets browsers keep files for about 10 minutes. The pages load their scripts as `board.js?v=3` and so on. Whenever you upload changed files, raise that number in `board.html` and `phone.html` (currently `?v=5`) so browsers fetch the new versions together. After uploading, wait for the Pages build to finish (repo → **Actions** shows a green tick), then press **Ctrl+F5** on the board.

## Troubleshooting
| Symptom | Fix |
|---|---|
| "The database is not set up yet" | Run `1-setup.sql` in the **library** project, and check `config.js` points at that project. |
| Board shows "Checking every 15 s" instead of "Live" | Realtime is blocked (often by school Wi-Fi). Snaps still arrive, but take up to 15 seconds. |
| Photo appears sideways | Press **R** or the rotate button. |
| "There are already 200 snaps" | Press **End lesson** on the board. |
