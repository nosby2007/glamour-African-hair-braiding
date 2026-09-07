import { auth, db, storage } from './firebase.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js';
import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js';
import { getDownloadURL, ref, uploadBytes } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-storage.js';

const $ = (s) => document.querySelector(s);
const loginPanel = $('#login-panel');
const dashboard = $('#dashboard');

async function isAdmin(user) {
  if (!user) return false;
  const snap = await getDoc(doc(db, 'admins', user.uid));
  return snap.exists();
}

$('#login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  const msg = $('#login-status');
  try {
    const credential = await signInWithEmailAndPassword(auth, fd.get('email'), fd.get('password'));
    if (!(await isAdmin(credential.user))) {
      await signOut(auth);
      throw new Error('This account is not authorized as an admin.');
    }
    msg.textContent = '';
  } catch (err) { msg.textContent = err.message; }
});

$('#logout')?.addEventListener('click', () => signOut(auth));

async function loadCollection(name, rootId, renderer) {
  const root = document.getElementById(rootId);
  root.innerHTML = '<p>Loading…</p>';
  const snap = await getDocs(query(collection(db, name), orderBy('createdAt', 'desc')));
  root.innerHTML = '';
  snap.forEach((d) => root.append(renderer(d.id, d.data())));
  if (snap.empty) root.innerHTML = '<p>No records yet.</p>';
}

function simpleRecord(type) {
  return (id, data) => {
    const card = document.createElement('article'); card.className = 'admin-card';
    const title = document.createElement('strong'); title.textContent = data.name || data.email || type;
    const meta = document.createElement('p'); meta.textContent = [data.phone, data.email, data.service, data.preferredDate].filter(Boolean).join(' • ');
    const message = document.createElement('p'); message.textContent = data.message || data.notes || '';
    card.append(title, meta, message); return card;
  };
}

function testimonialRecord(id, data) {
  const card = simpleRecord('Testimonial')(id, data);
  const btn = document.createElement('button'); btn.textContent = data.approved ? 'Approved' : 'Approve'; btn.disabled = !!data.approved;
  btn.onclick = async () => { await updateDoc(doc(db, 'testimonials', id), { approved: true, approvedAt: serverTimestamp() }); await refresh(); };
  card.append(btn); return card;
}

$('#gallery-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.currentTarget); const file = fd.get('image'); const status = $('#gallery-status');
  try {
    if (!(file instanceof File) || !file.size) throw new Error('Choose an image.');
    if (!file.type.startsWith('image/')) throw new Error('Only image files are allowed.');
    if (file.size > 8 * 1024 * 1024) throw new Error('Image must be under 8 MB.');
    const path = `gallery/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file, { contentType: file.type });
    const imageUrl = await getDownloadURL(storageRef);
    await addDoc(collection(db, 'gallery'), { styleName: fd.get('styleName'), alt: fd.get('alt'), imageUrl, storagePath: path, published: true, createdAt: serverTimestamp() });
    e.currentTarget.reset(); status.textContent = 'Photo published.';
    await refresh();
  } catch (err) { status.textContent = err.message; }
});

async function refresh() {
  await Promise.all([
    loadCollection('bookings', 'bookings-list', simpleRecord('Booking')),
    loadCollection('contacts', 'contacts-list', simpleRecord('Contact')),
    loadCollection('testimonials', 'testimonial-admin-list', testimonialRecord),
    loadCollection('gallery', 'gallery-admin-list', simpleRecord('Gallery'))
  ]);
}

onAuthStateChanged(auth, async (user) => {
  const ok = await isAdmin(user).catch(() => false);
  loginPanel.hidden = !!ok; dashboard.hidden = !ok;
  if (ok) refresh();
});
