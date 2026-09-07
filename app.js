import { db } from './firebase.js';
import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js';

const qs = (s) => document.querySelector(s);
const showStatus = (el, message, ok = true) => { if (!el) return; el.textContent = message; el.className = ok ? 'form-status success' : 'form-status error'; };

const COLLECTIONS = {
  bookings: 'glamour_bookings',
  contacts: 'glamour_contacts',
  testimonials: 'glamour_testimonials',
  gallery: 'glamour_gallery'
};

async function submitForm(form, collectionName, extra = {}) {
  const status = form.querySelector('.form-status');
  const data = Object.fromEntries(new FormData(form).entries());
  try {
    await addDoc(collection(db, collectionName), { ...data, ...extra, createdAt: serverTimestamp() });
    showStatus(status, 'Thank you! Your information was sent successfully.');
    form.reset();
  } catch (err) {
    console.error(err);
    showStatus(status, 'We could not send this right now. Please call (478) 960-0406.', false);
  }
}

qs('#booking-form')?.addEventListener('submit', (e) => { e.preventDefault(); submitForm(e.currentTarget, COLLECTIONS.bookings, { status: 'new' }); });
qs('#contact-form')?.addEventListener('submit', (e) => { e.preventDefault(); submitForm(e.currentTarget, COLLECTIONS.contacts, { status: 'new' }); });
qs('#testimonial-form')?.addEventListener('submit', (e) => { e.preventDefault(); submitForm(e.currentTarget, COLLECTIONS.testimonials, { approved: false }); });

async function loadGallery() {
  const root = qs('#firebase-gallery');
  if (!root) return;
  try {
    const snap = await getDocs(query(collection(db, COLLECTIONS.gallery), where('published', '==', true)));
    if (snap.empty) return;
    root.innerHTML = '';
    snap.forEach((doc) => {
      const item = doc.data();
      const card = document.createElement('figure');
      card.className = 'live-gallery-card';
      const img = document.createElement('img');
      img.src = item.imageUrl;
      img.alt = item.alt || item.styleName || 'Glamour African Hair Braiding style';
      img.loading = 'lazy';
      const cap = document.createElement('figcaption');
      cap.textContent = item.styleName || 'Glamour style';
      card.append(img, cap);
      root.append(card);
    });
  } catch (err) { console.warn('Gallery not available yet', err); }
}

async function loadTestimonials() {
  const root = qs('#testimonials-list');
  if (!root) return;
  try {
    const snap = await getDocs(query(collection(db, COLLECTIONS.testimonials), where('approved', '==', true)));
    root.innerHTML = '';
    snap.forEach((doc) => {
      const t = doc.data();
      const card = document.createElement('blockquote');
      card.className = 'testimonial-card';
      const text = document.createElement('p');
      text.textContent = `“${t.message || ''}”`;
      const cite = document.createElement('cite');
      cite.textContent = t.name || 'Glamour client';
      card.append(text, cite);
      root.append(card);
    });
    if (snap.empty) root.innerHTML = '<p class="muted">Client testimonials will appear here after approval.</p>';
  } catch (err) { console.warn('Testimonials not available yet', err); }
}

loadGallery();
loadTestimonials();
