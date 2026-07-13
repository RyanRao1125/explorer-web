const API = 'http://localhost:3000';

async function init() {
  try {
    const res = await fetch(`${API}/auth/status`, { credentials: 'include' });
    const data = await res.json();

    if (data.authenticated) {
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('dashboard').style.display = 'block';
      document.getElementById('adminUsername').textContent = data.username;

      document.getElementById('searchInput').addEventListener('input', applyFilters);
      document.getElementById('statusFilter').addEventListener('change', applyFilters);
      document.getElementById('gradeFilter').addEventListener('change', applyFilters);

      loadRegistrations();
    } else {
      document.getElementById('loginScreen').style.display = 'flex';
      document.getElementById('dashboard').style.display = 'none';

      const params = new URLSearchParams(window.location.search);
      if (params.get('error') === 'unauthorized') {
        document.getElementById('loginError').style.display = 'block';
      }
    }
  } catch (err) {
    document.getElementById('loginScreen').style.display = 'flex';
  }
}

async function loadRegistrations() {
  try {
    const res = await fetch(`${API}/api/admin/registrations`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    window._allRegistrations = data;
    renderTable(data);
    renderStats(data);
    renderGradeStats(data);
  } catch (err) {
    document.getElementById('registrationsTable').innerHTML =
      `<tr><td colspan="6" class="table-loading">Failed to load registrations. Is the server running?</td></tr>`;
  }
}

function renderStats(data) {
  document.getElementById('statTotal').textContent = data.length;
  document.getElementById('statPending').textContent = data.filter(r => r.status === 'pending').length;
  document.getElementById('statContacted').textContent = data.filter(r => r.status === 'contacted').length;
  document.getElementById('statConfirmed').textContent = data.filter(r => r.status === 'confirmed').length;
}

function renderGradeStats(data) {
  const grades = {};
  data.forEach(r => {
    const grade = r.grade || 'Unknown';
    grades[grade] = (grades[grade] || 0) + 1;
  });

  const grid = document.getElementById('gradeStatsGrid');
  if (Object.keys(grades).length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted);font-size:0.875rem;">No data yet.</p>';
    return;
  }

  const sorted = Object.entries(grades).sort((a, b) => {
    const numA = parseInt(a[0].replace('Grade ', '')) || 999;
    const numB = parseInt(b[0].replace('Grade ', '')) || 999;
    return numA - numB;
  });

  grid.innerHTML = sorted.map(([grade, count]) => `
    <div class="grade-stat-card">
      <strong>${count}</strong>
      <span>${grade}</span>
    </div>
  `).join('');
}

function renderTable(data) {
  const tbody = document.getElementById('registrationsTable');
  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-loading">No registrations yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(m => {
    const date = new Date(m.created_at).toLocaleDateString('en-CA');
    const birthDate = m.birth_month && m.birth_day && m.birth_year
      ? `${m.birth_month} ${m.birth_day}, ${m.birth_year}` : '—';
    const address = [m.street_address, m.street_address_2, m.city, m.province, m.postal_code]
      .filter(Boolean).join(', ') || '—';
    const parentPhone = m.parent_area_code
      ? `(${m.parent_area_code}) ${m.parent_phone}` : m.parent_phone || '—';
    const emergencyName = m.emergency_first_name
      ? `${m.emergency_first_name} ${m.emergency_last_name} (${m.emergency_relationship || '—'})` : '—';
    const emergencyPhone = m.emergency_area_code
      ? `(${m.emergency_area_code}) ${m.emergency_phone}` : m.emergency_phone || '—';
    const referredBy = m.referred_first_name
      ? `${m.referred_first_name} ${m.referred_last_name}` : '—';
    const signed = m.signature ? `Yes — ${m.signature}` : '—';

    return `
      <tr class="reg-row" onclick="toggleExpand('${m.id}')" style="cursor:pointer;">
        <td>
          <span class="expand-icon" id="icon-${m.id}">▶</span>
          ${m.student_first_name || ''} ${m.student_last_name || ''}
        </td>
        <td>${m.grade || '—'}</td>
        <td>${m.parent_first_name || ''} ${m.parent_last_name || ''}</td>
        <td>${m.parent_email || '—'}</td>
        <td>${date}</td>
        <td onclick="event.stopPropagation()">
          <select onchange="updateStatus('${m.id}', this.value)" class="admin-select">
            <option value="pending" ${m.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="contacted" ${m.status === 'contacted' ? 'selected' : ''}>Contacted</option>
            <option value="confirmed" ${m.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
          </select>
        </td>
        <td onclick="event.stopPropagation()">
          <button onclick="deleteRegistration('${m.id}')" class="btn btn-sm btn-danger">Delete</button>
        </td>
      </tr>
      <tr class="reg-detail-row" id="detail-${m.id}" style="display:none;">
        <td colspan="7">
          <div class="reg-detail-grid">
            <div class="reg-detail-section">
              <h4>Student</h4>
              <p><strong>Name:</strong> ${m.student_first_name || ''} ${m.student_last_name || ''}</p>
              <p><strong>Birth Date:</strong> ${birthDate}</p>
              <p><strong>Grade:</strong> ${m.grade || '—'}</p>
              <p><strong>Gender:</strong> ${m.gender || '—'}</p>
              <p><strong>Email:</strong> ${m.student_email || '—'}</p>
              <p><strong>Address:</strong> ${address}</p>
            </div>
            <div class="reg-detail-section">
              <h4>Parent / Guardian</h4>
              <p><strong>Name:</strong> ${m.parent_first_name || ''} ${m.parent_last_name || ''}</p>
              <p><strong>Email:</strong> ${m.parent_email || '—'}</p>
              <p><strong>Phone:</strong> ${parentPhone}</p>
            </div>
            <div class="reg-detail-section">
              <h4>Emergency Contact</h4>
              <p><strong>Name:</strong> ${emergencyName}</p>
              <p><strong>Phone:</strong> ${emergencyPhone}</p>
            </div>
            <div class="reg-detail-section">
              <h4>Other</h4>
              <p><strong>Referred By:</strong> ${referredBy}</p>
              <p><strong>Signed:</strong> ${signed}</p>
              <p><strong>Consent:</strong> ${m.consent ? 'Yes' : 'No'}</p>
              <p><strong>Registered:</strong> ${date}</p>
            </div>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function toggleExpand(id) {
  const detailRow = document.getElementById(`detail-${id}`);
  const icon = document.getElementById(`icon-${id}`);
  const isOpen = detailRow.style.display !== 'none';
  detailRow.style.display = isOpen ? 'none' : 'table-row';
  icon.textContent = isOpen ? '▶' : '▼';
}

async function updateStatus(id, status) {
  await fetch(`${API}/api/admin/registrations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status })
  });
}

async function deleteRegistration(id) {
  if (!confirm('Delete this registration? This cannot be undone.')) return;
  await fetch(`${API}/api/admin/registrations/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  loadRegistrations();
}

async function applyFilters() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const status = document.getElementById('statusFilter').value;
  const grade = document.getElementById('gradeFilter').value;

  const data = window._allRegistrations || [];

  const filtered = data.filter(r => {
    const fullName = `${r.student_first_name || ''} ${r.student_last_name || ''}`.toLowerCase();
    const matchSearch = fullName.includes(search) ||
                        (r.student_email || '').toLowerCase().includes(search) ||
                        (r.parent_email || '').toLowerCase().includes(search) ||
                        (r.grade || '').toLowerCase().includes(search);
    const matchStatus = status ? r.status === status : true;
    const matchGrade = grade ? r.grade === grade : true;
    return matchSearch && matchStatus && matchGrade;
  });

  renderTable(filtered);
  renderStats(filtered);
  renderGradeStats(filtered);
}

init();