import './style.css';
import { i18n } from './i18n.js';

const lang = i18n.pt;
let currentUser = localStorage.getItem('vm_user') || null;
let bookings = [];
let currentWeekStart = getStartOfWeek(new Date());
let currentTheme = localStorage.getItem('vm_theme') || 'dark';

document.documentElement.setAttribute('data-theme', currentTheme);

const app = document.querySelector('#app');
const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api';

function getStartOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(date.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start;
}

async function fetchBookings() {
  try {
    const res = await fetch(`${API_URL}/bookings`);
    bookings = await res.json();
    if (currentUser) renderDashboard();
  } catch (err) {
    console.error('Erro ao buscar reservas:', err);
  }
}

async function handleBooking(date, hour) {
  try {
    const res = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, hour, user: currentUser })
    });
    if (res.ok) await fetchBookings();
    else {
      const data = await res.json();
      alert(data.error || 'Erro ao agendar');
    }
  } catch (err) {
    console.error('Erro ao agendar:', err);
  }
}

async function handleCancel(date, hour) {
  try {
    const res = await fetch(`${API_URL}/bookings`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, hour, user: currentUser })
    });
    if (res.ok) await fetchBookings();
  } catch (err) {
    console.error('Erro ao cancelar:', err);
  }
}

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('vm_theme', currentTheme);
  renderDashboard();
}

function render() {
  if (!currentUser) {
    renderLogin();
  } else {
    fetchBookings();
    renderDashboard();
  }
}

function renderLogin() {
  app.innerHTML = `
    <div class="container auth-container">
      <div class="auth-card">
        <h2 style="margin-bottom: 2rem; font-size: 2.5rem; color: var(--primary);">${lang.login.title}</h2>
        <div style="margin-bottom: 2rem; text-align: left;">
          <label style="display: block; margin-bottom: 0.5rem; color: var(--text-dim);">${lang.login.placeholder}</label>
          <input type="text" id="username" placeholder="Seu nome..." style="width: 100%; padding: 1rem; background: var(--badge-bg); border: 1px solid var(--surface-border); border-radius: 0.75rem; color: var(--text-main); outline: none;">
        </div>
        <button id="login-btn" class="btn btn-primary" style="width: 100%;">${lang.login.button}</button>
      </div>
    </div>
  `;

  document.querySelector('#login-btn').addEventListener('click', () => {
    const username = document.querySelector('#username').value.trim();
    if (username) {
      currentUser = username;
      localStorage.setItem('vm_user', username);
      render();
    }
  });
}

function formatDateRange() {
  const end = new Date(currentWeekStart);
  end.setDate(end.getDate() + 6);
  const options = { day: 'numeric', month: 'long' };
  return `${currentWeekStart.toLocaleDateString('pt-BR', options)} - ${end.toLocaleDateString('pt-BR', { ...options, year: 'numeric' })}`;
}

function renderDashboard() {
  app.innerHTML = `
    <div class="dashboard-layout">
      <aside class="sidebar">
        <div class="sidebar-item active">
          <span style="font-size: 1.5rem;">📅</span>
          <span>Calendário</span>
        </div>
        
        <div class="sidebar-spacer"></div>

        <div class="sidebar-item" id="theme-toggle">
          <span class="theme-toggle-icon">${currentTheme === 'dark' ? '☀️' : '🌙'}</span>
          <span>${lang.login.theme}</span>
        </div>

        <div class="sidebar-item" id="logout-btn">
          <span style="font-size: 1.5rem;">🚪</span>
          <span>Sair</span>
        </div>
      </aside>

      <main class="main-content">
        <header class="header">
          <h1 class="date-range-title">${formatDateRange()}</h1>
          <div class="nav-controls">
            <button id="prev-week" class="nav-btn"><</button>
            <button id="today-btn" class="nav-btn highlight">${lang.calendar.today}</button>
            <button id="next-week" class="nav-btn">></button>
          </div>
        </header>
        
        <div class="week-columns">
          ${[0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + dayOffset);
    return renderDayColumn(date, dayOffset);
  }).join('')}
        </div>
      </main>
    </div>

    <!-- Modal Placeholder -->
    <div id="modal" class="modal-overlay">
      <div class="modal-content">
        <h3 id="modal-title" style="font-size: 1.75rem; margin-bottom: 1rem;"></h3>
        <p id="modal-desc" style="color: var(--text-dim); margin-bottom: 2rem;"></p>
        <div class="modal-actions">
          <button id="modal-cancel" class="btn" style="background: var(--badge-bg); color: var(--text-main);">Voltar</button>
          <button id="modal-confirm" class="btn btn-primary"></button>
        </div>
      </div>
    </div>
  `;

  addDashboardListeners();
}

function renderDayColumn(date, dayOffset) {
  const isToday = date.toDateString() === new Date().toDateString();
  const dayName = date.toLocaleDateString('pt-BR', { weekday: 'long' });
  const dayDisplay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  const dateStr = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });

  return `
    <div class="day-column ${isToday ? 'current-day' : ''}">
      <div class="day-header">
        <div class="day-name">${dayDisplay}</div>
        <div class="day-date">${dateStr}</div>
      </div>
      <div class="slots-container">
        ${getHoursRange().map(hour => renderSlotItem(date, hour)).join('')}
      </div>
    </div>
  `;
}

function renderSlotItem(date, hour) {
  const dateKey = date.toISOString().split('T')[0];
  const booking = bookings.find(b => b.date === dateKey && b.hour === hour);
  const isMine = booking && booking.user === currentUser;

  return `
    <div class="task-slot ${booking ? (isMine ? 'mine' : 'booked') : ''}" data-date="${dateKey}" data-hour="${hour}">
      <div class="task-info">
        <div class="task-title">${booking ? (isMine ? 'Minha Reserva' : 'VM em Uso') : 'Disponível'}</div>
        <div class="task-time ${booking ? 'active' : ''}">${hour.toString().padStart(2, '0')}:00</div>
      </div>
      <div class="task-user">${booking ? booking.user : ''}</div>
      ${isMine ? '<div class="cancel-tag">Clique p/ Cancelar</div>' : ''}
    </div>
  `;
}

function addDashboardListeners() {
  const logoutBtn = document.querySelector('#logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('vm_user');
    currentUser = null;
    render();
  });

  const themeToggle = document.querySelector('#theme-toggle');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  const prevWeek = document.querySelector('#prev-week');
  if (prevWeek) prevWeek.addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    renderDashboard();
  });

  const nextWeek = document.querySelector('#next-week');
  if (nextWeek) nextWeek.addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    renderDashboard();
  });

  const todayBtn = document.querySelector('#today-btn');
  if (todayBtn) todayBtn.addEventListener('click', () => {
    currentWeekStart = getStartOfWeek(new Date());
    renderDashboard();
  });

  document.querySelectorAll('.task-slot').forEach(slot => {
    slot.addEventListener('click', () => {
      const date = slot.dataset.date;
      const hour = parseInt(slot.dataset.hour);
      handleSlotClick(date, hour);
    });
  });
}

function getHoursRange() {
  const hours = [];
  for (let i = 8; i <= 20; i++) hours.push(i);
  return hours;
}

function handleSlotClick(date, hour) {
  const bookingIndex = bookings.findIndex(b => b.date === date && b.hour === hour);
  const booking = bookings[bookingIndex];

  if (booking && booking.user !== currentUser) return;

  const modal = document.querySelector('#modal');
  const title = document.querySelector('#modal-title');
  const desc = document.querySelector('#modal-desc');
  const confirmBtn = document.querySelector('#modal-confirm');
  const cancelBtn = document.querySelector('#modal-cancel');

  if (booking) {
    title.innerText = 'Cancelar Reserva';
    desc.innerText = `Deseja remover sua reserva de ${hour}:00 do dia ${date}?`;
    confirmBtn.innerText = 'Remover';
    confirmBtn.className = 'btn';
    confirmBtn.style.backgroundColor = 'var(--error)';
    confirmBtn.style.color = 'white';
  } else {
    title.innerText = 'Nova Reserva';
    desc.innerText = `Confirmar reserva para às ${hour}:00 do dia ${date}?`;
    confirmBtn.innerText = 'Reservar Agora';
    confirmBtn.className = 'btn btn-primary';
    confirmBtn.style.backgroundColor = '';
  }

  modal.style.display = 'flex';

  const onConfirm = async () => {
    if (booking) {
      await handleCancel(date, hour);
    } else {
      await handleBooking(date, hour);
    }
    modal.style.display = 'none';
    cleanup();
  };

  const onCancel = () => {
    modal.style.display = 'none';
    cleanup();
  };

  const cleanup = () => {
    confirmBtn.removeEventListener('click', onConfirm);
    cancelBtn.removeEventListener('click', onCancel);
  };

  confirmBtn.addEventListener('click', onConfirm, { once: true });
  cancelBtn.addEventListener('click', onCancel, { once: true });
}

render();
