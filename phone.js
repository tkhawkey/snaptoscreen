(() => {
  const { CFG, configured, sb, rpc, normCode, channelName, store, loadImg, friendlyError } = Snap;
  const $ = (s) => document.querySelector(s);
  const CODE_KEY = 'snap.phone.code';

  let code = null;
  let channel = null;
  const items = []; // { id, b64, w, h, thumb, time, status, el }

  $('#mark').textContent = CFG.schoolShort;
  $('#appName').textContent = CFG.appName;

  // ---------- Start-up ----------------------------------------------------
  async function init() {
    if (!configured) { $('#notConfigured').classList.remove('hidden'); return; }
    const saved = store.get(CODE_KEY);
    if (saved) {
      try { await signIn(saved); return; } catch (e) {
        if (!/passcode/i.test(e.message)) { // offline etc.: let them try anyway
          code = saved; showMain(''); return;
        }
        store.del(CODE_KEY);
      }
    }
    $('#gate').classList.remove('hidden');
    $('#code').focus();
  }

  async function signIn(c) {
    const label = await rpc('snap_check', { p_code: normCode(c) });
    code = normCode(c);
    store.set(CODE_KEY, code);
    showMain(label || '');
  }

  function showMain(label) {
    $('#gate').classList.add('hidden');
    $('#main').classList.remove('hidden');
    $('#signOut').classList.remove('hidden');
    $('#roomLabel').textContent = label;
    getChannel(); // warm up the realtime connection
  }

  $('#gate').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('#gateErr').textContent = '';
    $('#gateBtn').disabled = true;
    try { await signIn($('#code').value); }
    catch (err) { $('#gateErr').textContent = friendlyError(err); }
    finally { $('#gateBtn').disabled = false; }
  });

  $('#signOut').addEventListener('click', () => {
    if (!confirm('Forget the passcode on this phone?')) return;
    store.del(CODE_KEY);
    location.reload();
  });

  // ---------- Realtime ------------------------------------------------------
  async function getChannel() {
    if (channel) return channel;
    channel = sb().channel(await channelName(code), { config: { broadcast: { self: false } } });
    await new Promise((res) => {
      const t = setTimeout(res, 3000);
      channel.subscribe((s) => { if (s === 'SUBSCRIBED') { clearTimeout(t); res(); } });
    });
    return channel;
  }

  async function notify(event, payload) {
    try {
      const ch = await getChannel();
      await ch.send({ type: 'broadcast', event, payload });
    } catch (e) {
      console.warn('Realtime notify failed (board will still pick it up within ~15 s)', e);
    }
  }

  // ---------- Taking / choosing photos -------------------------------------
  $('#camera').addEventListener('change', onFiles);
  $('#library').addEventListener('change', onFiles);

  async function onFiles(e) {
    const files = [...e.target.files];
    e.target.value = ''; // allow the same photo again
    for (const f of files) {
      try {
        const r = await resize(f);
        const it = { ...r, time: new Date(), status: 'sending', id: null };
        items.unshift(it);
        render();
        await upload(it);
      } catch (err) {
        alert(friendlyError(err));
      }
    }
  }

  async function resize(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImg(url); // browsers apply the photo's EXIF rotation here
      const max = CFG.maxImageSize || 1600;
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * k);
      const h = Math.round(img.naturalHeight * k);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const x = c.getContext('2d');
      x.fillStyle = '#fff';
      x.fillRect(0, 0, w, h);
      x.drawImage(img, 0, 0, w, h);
      const dataUrl = c.toDataURL('image/jpeg', CFG.jpegQuality || 0.8);
      return { b64: dataUrl.slice(dataUrl.indexOf(',') + 1), w, h, thumb: dataUrl };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function upload(it) {
    it.status = 'sending'; it.error = ''; render();
    try {
      it.id = await rpc('snap_post', { p_code: code, p_data: it.b64, p_width: it.w, p_height: it.h });
      it.status = 'ok';
      it.b64 = null; // free memory
      notify('new', { id: it.id });
    } catch (e) {
      it.status = 'fail';
      it.error = friendlyError(e);
    }
    render();
  }

  async function removeFromBoard(it) {
    if (!confirm('Remove this photo from the board?')) return;
    try {
      await rpc('snap_delete', { p_code: code, p_id: it.id });
      notify('deleted', { id: it.id });
      items.splice(items.indexOf(it), 1);
      render();
    } catch (e) {
      alert(friendlyError(e));
    }
  }

  // ---------- List of sent photos -----------------------------------------
  function render() {
    const ul = $('#sent');
    ul.innerHTML = '';
    $('#sentTitle').classList.toggle('hidden', items.length === 0);
    for (const it of items) {
      const li = document.createElement('li');
      const img = document.createElement('img');
      img.src = it.thumb; img.alt = '';
      const info = document.createElement('div');
      info.className = 'info';
      const st = document.createElement('div');
      st.className = 'status st-' + it.status;
      st.textContent = it.status === 'ok' ? '✓ On the board' : it.status === 'sending' ? 'Sending…' : 'Not sent';
      const tm = document.createElement('div');
      tm.className = 'time';
      tm.textContent = it.status === 'fail' ? it.error : it.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      info.append(st, tm);
      li.append(img, info);
      if (it.status === 'fail') {
        const b = document.createElement('button');
        b.textContent = 'Retry';
        b.onclick = () => upload(it);
        li.append(b);
      } else if (it.status === 'ok') {
        const b = document.createElement('button');
        b.textContent = 'Remove';
        b.onclick = () => removeFromBoard(it);
        li.append(b);
      }
      ul.append(li);
    }
  }

  init();
})();
