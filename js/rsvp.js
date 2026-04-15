/* ============================================================
   rsvp.js — RSVP form scripts
   Wedding website: Rocío & Emilio · 12.09.2026
   rocioyemilio.es
   ============================================================ */

/* ============================================================
   CONFIGURATION — Google Apps Script endpoint
   Replace with your deployed Apps Script URL to enable
   form submissions to Google Sheets.
   ============================================================ */
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwcjyFQrX8WkVEkjQsDVfTuB43kTDsOl2kXJl6N1psilOSnZ_QLINOALbQTXyxWgcZo/exec';

/* ============================================================
   MULTI-STEP FORM STATE
   ============================================================ */
let currentStep = 1;
const TOTAL_STEPS = 5;

// Companions state
let companions      = [];   // array of { id: string }
let companionCounter = 0;   // ever-increasing counter for unique IDs

/* ============================================================
   MULTI-STEP FORM — Navigation between steps
   ============================================================ */
function goToStep(n) {
  if (n < currentStep) {
    // Going back — skip validation
    showStep(n);
    return;
  }

  // Validate current step before advancing
  if (!validateStep(currentStep)) {
    scrollToFirstError();
    return;
  }

  showStep(n);
}

function showStep(n) {
  document.getElementById('step' + currentStep).classList.remove('active');
  currentStep = n;
  // Rebuild menu cards each time step 3 is shown so they match current companions
  if (n === 3) buildMenuStep();
  // Update plural/singular texts based on companion count
  updatePluralTexts();
  document.getElementById('step' + currentStep).classList.add('active');
  updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============================================================
   PLURAL TEXTS — Update step texts based on companion count
   ============================================================ */
function updatePluralTexts() {
  const plural = companions.length > 0;

  // Step 2
  const step2Title = document.getElementById('step2Title');
  if (step2Title) step2Title.textContent = plural ? '¿Nos acompañáis?' : '¿Nos acompañas?';

  const asistenciaLabel = document.getElementById('asistenciaLabel');
  if (asistenciaLabel) asistenciaLabel.textContent = plural ? '¿Confirmáis vuestra asistencia?' : '¿Confirmas tu asistencia?';

  const asisteSiText = document.getElementById('asisteSiText');
  if (asisteSiText) asisteSiText.textContent = plural ? 'Sí, allí estaremos' : 'Sí, allí estaré';

  const asisteSiSmall = document.getElementById('asisteSiSmall');
  if (asisteSiSmall) asisteSiSmall.textContent = plural ? '¡Contamos los días!' : '¡Cuento los días!';

  const asisteNoText = document.getElementById('asisteNoText');
  if (asisteNoText) asisteNoText.textContent = plural ? 'No podremos asistir' : 'No podré asistir';

  const asisteNoSmall = document.getElementById('asisteNoSmall');
  if (asisteNoSmall) asisteNoSmall.textContent = plural ? 'Lo sentimos mucho' : 'Lo siento mucho';

  // Step 4
  const step4Subtitle = document.getElementById('step4Subtitle');
  if (step4Subtitle) step4Subtitle.textContent = plural ? '¿Cómo llegaréis a la boda?' : '¿Cómo llegarás a la boda?';

  const transporteLabel = document.getElementById('transporteLabel');
  if (transporteLabel) transporteLabel.textContent = plural ? '¿Cómo vais a venir? *' : '¿Cómo vas a venir? *';

  const transportePropioText = document.getElementById('transportePropioText');
  if (transportePropioText) transportePropioText.textContent = plural ? 'Por nuestra propia cuenta' : 'Por mi propia cuenta';

  const transporteError = document.getElementById('transporteError');
  if (transporteError) transporteError.textContent = plural ? 'Por favor, selecciona cómo vendréis' : 'Por favor, selecciona cómo vendrás';

  // Step 5
  const step5Subtitle = document.getElementById('step5Subtitle');
  if (step5Subtitle) step5Subtitle.textContent = plural
    ? 'Si queréis dejarnos unas palabras, ¡las guardaremos con mucho cariño!'
    : 'Si quieres dejarnos unas palabras, ¡las guardaremos con mucho cariño!';
}

/* ============================================================
   SCROLL TO FIRST ERROR — Focus the first visible error
   ============================================================ */
function scrollToFirstError() {
  const activeStep = document.querySelector('.step.active');
  if (!activeStep) return;
  const firstError = activeStep.querySelector('.field-error.show, input.error');
  if (!firstError) return;
  const target = firstError.closest('.person-menu-card, .companion-row, .field') || firstError;
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function updateProgress() {
  document.querySelectorAll('.progress-step').forEach(el => {
    const s = parseInt(el.dataset.step);
    el.classList.remove('active', 'done');
    if (s < currentStep) el.classList.add('done');
    if (s === currentStep) el.classList.add('active');
  });
}

/* ============================================================
   COMPANION MANAGEMENT — Add / remove / render
   ============================================================ */
function addCompanion() {
  if (companions.length >= 3) return;
  companionCounter++;
  companions.push({ id: 'companion_' + companionCounter });
  renderCompanions();
}

function removeCompanion(id) {
  companions = companions.filter(c => c.id !== id);
  renderCompanions();
}

function renderCompanions() {
  const list = document.getElementById('companionList');
  const btn  = document.getElementById('btnAddCompanion');
  const note = document.getElementById('companionNote');

  // Preserve existing input values before rebuilding
  const savedValues = {};
  companions.forEach(c => {
    const el = document.getElementById(c.id);
    if (el) savedValues[c.id] = el.value;
  });

  list.innerHTML = companions.map((c, i) => `
    <div class="companion-row" id="row_${c.id}">
      <div class="companion-label">Acompañante ${i + 1}</div>
      <div class="companion-input-wrap">
        <input type="text" id="${c.id}" placeholder="Nombre y apellidos" autocomplete="off"
               oninput="clearCompanionError('${c.id}')">
        <button type="button" class="btn-remove-companion"
                onclick="removeCompanion('${c.id}')" aria-label="Eliminar acompañante">✕</button>
      </div>
      <p class="field-error" id="${c.id}_error">Por favor, escribe el nombre</p>
    </div>
  `).join('');

  // Restore saved values
  companions.forEach(c => {
    const el = document.getElementById(c.id);
    if (el && savedValues[c.id] !== undefined) el.value = savedValues[c.id];
  });

  btn.style.display  = companions.length >= 3 ? 'none' : '';
  note.style.display = companions.length >= 3 ? 'none' : '';
}

function clearCompanionError(id) {
  const el = document.getElementById(id);
  if (el && el.value.trim()) {
    setError(id + '_error', false);
    el.classList.remove('error');
  }
}

/* ============================================================
   MENU STEP — Dynamic cards (one card per person)
   ============================================================ */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildMenuStep() {
  const container = document.getElementById('menuPersonsContainer');
  const persons = [
    { label: 'Tú', nombre: document.getElementById('nombre').value.trim() },
    ...companions.map((c, i) => ({
      label:  'Acompañante ' + (i + 1),
      nombre: document.getElementById(c.id)?.value.trim() || ''
    }))
  ];

  container.innerHTML = persons.map((p, i) => `
    <div class="person-menu-card" id="menuCard_${i}">
      <div class="person-menu-header">
        <span class="person-menu-label">${p.label}</span>
        <span class="person-menu-name">${escapeHtml(p.nombre)}</span>
      </div>

      <div class="field" style="margin-top:1rem">
        <label>Elige tu menú *</label>
        <div class="radio-group">
          <label class="radio-option">
            <input type="radio" name="menu_${i}" value="carne"
                   onchange="setError('menuError_${i}',false)">
            <span class="radio-custom"></span>
            <span class="radio-text">
              Carne + pescado
              <small>Menú principal</small>
            </span>
          </label>
          <label class="radio-option">
            <input type="radio" name="menu_${i}" value="vegano"
                   onchange="setError('menuError_${i}',false)">
            <span class="radio-custom"></span>
            <span class="radio-text">Vegano</span>
          </label>
        </div>
        <p class="field-error" id="menuError_${i}">Por favor, elige un menú</p>
      </div>

      <div class="field" style="margin-top:1.2rem">
        <label>¿Tienes alergias o intolerancias? *</label>
        <div class="radio-group">
          <label class="radio-option">
            <input type="radio" name="alergias_${i}" value="no"
                   onchange="toggleAlergiasCard(${i})">
            <span class="radio-custom"></span>
            <span class="radio-text">No, ninguna</span>
          </label>
          <label class="radio-option">
            <input type="radio" name="alergias_${i}" value="si"
                   onchange="toggleAlergiasCard(${i})">
            <span class="radio-custom"></span>
            <span class="radio-text">Sí, tengo alergias</span>
          </label>
        </div>
        <p class="field-error" id="alergiasError_${i}">Por favor, selecciona una opción</p>
      </div>

      <div class="conditional" id="alergiasDetalle_${i}">
        <div class="field">
          <label for="alergiasTexto_${i}">Descríbenos tus alergias *</label>
          <textarea id="alergiasTexto_${i}" placeholder="Gluten, lactosa, frutos secos..."
                    oninput="if(this.value.trim())setError('alergiasTextoError_${i}',false)"></textarea>
          <p class="field-error" id="alergiasTextoError_${i}">Por favor, describe tus alergias</p>
        </div>
      </div>
    </div>
  `).join('');
}

function toggleAlergiasCard(i) {
  const val = document.querySelector(`input[name="alergias_${i}"]:checked`);
  document.getElementById(`alergiasDetalle_${i}`).classList.toggle('show', val && val.value === 'si');
  if (val) setError(`alergiasError_${i}`, false);
}

/* ============================================================
   FORM VALIDATION — Per-step validation rules
   ============================================================ */
function validateStep(step) {
  let ok = true;

  if (step === 1) {
    const nombre = document.getElementById('nombre').value.trim();
    const tel    = document.getElementById('telefono').value.trim();

    setError('nombreError',   !nombre);
    setError('telefonoError', !tel);
    if (!nombre) document.getElementById('nombre').classList.add('error');
    else         document.getElementById('nombre').classList.remove('error');
    if (!tel)    document.getElementById('telefono').classList.add('error');
    else         document.getElementById('telefono').classList.remove('error');

    ok = !!(nombre && tel);

    // Validate each companion name
    companions.forEach(c => {
      const input = document.getElementById(c.id);
      const val   = input ? input.value.trim() : '';
      setError(c.id + '_error', !val);
      if (input) {
        if (!val) input.classList.add('error');
        else      input.classList.remove('error');
      }
      if (!val) ok = false;
    });
  }

  if (step === 2) {
    const val = document.querySelector('input[name="asistencia"]:checked');
    setError('asistenciaError', !val);
    ok = !!val;
  }

  if (step === 3) {
    const totalPersons = 1 + companions.length;
    for (let i = 0; i < totalPersons; i++) {
      const menu     = document.querySelector(`input[name="menu_${i}"]:checked`);
      const alergias = document.querySelector(`input[name="alergias_${i}"]:checked`);
      setError(`menuError_${i}`,     !menu);
      setError(`alergiasError_${i}`, !alergias);

      let textoOk = true;
      if (alergias && alergias.value === 'si') {
        const texto = document.getElementById(`alergiasTexto_${i}`)?.value.trim();
        setError(`alergiasTextoError_${i}`, !texto);
        textoOk = !!texto;
      }

      if (!menu || !alergias || !textoOk) ok = false;
    }
  }

  if (step === 4) {
    const transporte = document.querySelector('input[name="transporte"]:checked');
    setError('transporteError', !transporte);
    let paradaOk = true;

    if (transporte && transporte.value === 'autobus') {
      const parada = document.getElementById('paradaBus').value;
      setError('paradaBusError', !parada);
      paradaOk = !!parada;
    }

    ok = !!(transporte && paradaOk);
  }

  return ok;
}

function setError(id, show) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('show', show);
}

/* ============================================================
   CONDITIONAL FIELDS — Show/hide based on radio selection
   ============================================================ */

/* Attendance step: show optional message field if "no" selected */
document.querySelectorAll('input[name="asistencia"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const noWrap = document.getElementById('noAsisteMensaje');
    noWrap.classList.toggle('show', radio.value === 'no');
  });
});

/* Transport step: show bus stop selector if bus selected */
function toggleTransporte() {
  const val = document.querySelector('input[name="transporte"]:checked');
  document.getElementById('paradaWrap').classList.toggle('show', val && val.value === 'autobus');
}

/* ============================================================
   REAL-TIME ERROR CLEARING — Remove error state on user input
   ============================================================ */

// Step 1: name and phone
document.getElementById('nombre').addEventListener('input', function() {
  if (this.value.trim()) {
    setError('nombreError', false);
    this.classList.remove('error');
  }
});
document.getElementById('telefono').addEventListener('input', function() {
  if (this.value.trim()) {
    setError('telefonoError', false);
    this.classList.remove('error');
  }
});

// Step 2: attendance
document.querySelectorAll('input[name="asistencia"]').forEach(radio => {
  radio.addEventListener('change', () => setError('asistenciaError', false));
});

// Step 4: transport and bus stop
document.querySelectorAll('input[name="transporte"]').forEach(radio => {
  radio.addEventListener('change', () => setError('transporteError', false));
});
document.getElementById('paradaBus').addEventListener('change', function() {
  if (this.value) setError('paradaBusError', false);
});

/* ============================================================
   ATTENDANCE HANDLER — Routes to form step 3 or submits directly
   When the guest selects "no", the form submits without steps 3–5.
   ============================================================ */
function handleAsistencia() {
  if (!validateStep(2)) { scrollToFirstError(); return; }
  const val = document.querySelector('input[name="asistencia"]:checked').value;

  if (val === 'no') {
    // Not attending → disable button and submit directly
    const btn = document.getElementById('btnAsistencia');
    btn.disabled = true;
    document.getElementById('btnAsistenciaLabel').textContent = 'Enviando...';
    document.getElementById('btnAsistenciaArrow').innerHTML = '<span class="spinner"></span>';
    enviarFormulario(true);
  } else {
    goToStep(3);
  }
}

/* ============================================================
   FORM SUBMISSION — Google Apps Script integration
   Sends one row per attendee (main person + companions).
   ============================================================ */
async function enviarFormulario(noAsiste = false) {
  // Only validate transport step if the guest is attending
  if (!noAsiste && !validateStep(4)) return;

  const nombre        = document.getElementById('nombre').value.trim();
  const telefono      = document.getElementById('telefono').value.trim();
  const mensajeNo     = document.getElementById('mensajeNoAsiste').value.trim();
  const transporte    = document.querySelector('input[name="transporte"]:checked')?.value || '';
  const paradaBus     = document.getElementById('paradaBus').value;
  const mensajeNovios = document.getElementById('mensajeNovios').value.trim();

  const asistentes = [];

  if (noAsiste) {
    // Only main person, not attending
    asistentes.push({
      esPrincipal: true,
      nombre,
      asistencia:      'no',
      menu:            '',
      alergias:        '',
      alergiasDetalle: '',
    });
  } else {
    // Main person attending
    asistentes.push({
      esPrincipal:     true,
      nombre,
      asistencia:      'si',
      menu:            document.querySelector('input[name="menu_0"]:checked')?.value || '',
      alergias:        document.querySelector('input[name="alergias_0"]:checked')?.value || '',
      alergiasDetalle: document.getElementById('alergiasTexto_0')?.value.trim() || '',
    });
    // Companions
    companions.forEach((c, i) => {
      const idx = i + 1;
      asistentes.push({
        esPrincipal:     false,
        nombre:          document.getElementById(c.id)?.value.trim() || '',
        asistencia:      'si',
        menu:            document.querySelector(`input[name="menu_${idx}"]:checked`)?.value || '',
        alergias:        document.querySelector(`input[name="alergias_${idx}"]:checked`)?.value || '',
        alergiasDetalle: document.getElementById(`alergiasTexto_${idx}`)?.value.trim() || '',
      });
    });
  }

  const payload = {
    asistentes,
    telefono,
    mensajeNoAsiste: mensajeNo,
    transporte,
    paradaBus,
    mensajeNovios,
  };

  // Show loading state
  const btnEnviar = document.getElementById('btnEnviar');
  if (btnEnviar) {
    btnEnviar.disabled = true;
    document.getElementById('btnEnviarLabel').textContent = 'Enviando...';
    document.getElementById('btnEnviarArrow').innerHTML = '<span class="spinner"></span>';
  }

  // If the Apps Script URL is not configured, simulate a successful submission
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'TU_URL_DE_APPS_SCRIPT_AQUI') {
    console.warn('Apps Script URL not configured. Simulating successful submission.');
    await new Promise(r => setTimeout(r, 900));
    mostrarExito(noAsiste ? 'no' : 'si', nombre, asistentes.length);
    return;
  }

  // Test mode: entering "test" as name simulates submission without calling Apps Script
  if (nombre.toLowerCase() === 'test') {
    console.warn('Test mode active. Simulating submission without calling Apps Script.');
    console.log('Data that would be sent:', payload);
    await new Promise(r => setTimeout(r, 900));
    mostrarExito(noAsiste ? 'no' : 'si', nombre, asistentes.length);
    return;
  }

  try {
    await fetch(APPS_SCRIPT_URL, {
      method:  'POST',
      mode:    'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
    mostrarExito(noAsiste ? 'no' : 'si', nombre, asistentes.length);
  } catch (err) {
    console.error('Submission error:', err);
    if (btnEnviar) {
      btnEnviar.disabled = false;
      document.getElementById('btnEnviarLabel').textContent = 'Enviar confirmación';
      document.getElementById('btnEnviarArrow').textContent = '→';
    }
    const btnAsistencia = document.getElementById('btnAsistencia');
    if (btnAsistencia && btnAsistencia.disabled) {
      btnAsistencia.disabled = false;
      document.getElementById('btnAsistenciaLabel').textContent = 'Siguiente';
      document.getElementById('btnAsistenciaArrow').textContent = '→';
    }
    alert('Ha ocurrido un error al enviar. Por favor, inténtalo de nuevo o contáctanos directamente.');
  }
}

/* ============================================================
   SUCCESS SCREEN — Personalized message based on RSVP answer
   ============================================================ */
function mostrarExito(asistencia, nombre, totalPersonas = 1) {
  // Hide all form steps and the progress bar
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.getElementById('progressBar').style.display = 'none';

  const screen = document.getElementById('successScreen');
  const title  = document.getElementById('successTitle');
  const msg    = document.getElementById('successMsg');
  const note   = document.getElementById('successNote');

  const plural = totalPersonas > 1;
  const nombre1 = nombre.split(' ')[0];

  // Build first-name list: "Juan, María, Rocío y Mar"
  const allFirstNames = [nombre1, ...companions.map(c => {
    const el = document.getElementById(c.id);
    return el ? el.value.trim().split(' ')[0] : '';
  }).filter(Boolean)];
  const namesFormatted = allFirstNames.length > 1
    ? allFirstNames.slice(0, -1).join(', ') + ' y ' + allFirstNames[allFirstNames.length - 1]
    : allFirstNames[0];

  if (asistencia === 'si') {
    title.textContent = plural ? '¡Hasta pronto a todos!' : `¡Hasta pronto, ${nombre1}!`;
    msg.textContent = plural
      ? `¡Hemos recibido la confirmación de ${namesFormatted}! Estamos deseando celebrarlo con vosotros el 12 de septiembre.`
      : `¡Hemos recibido tu confirmación! Estamos deseando celebrarlo contigo el 12 de septiembre.`;
    note.textContent = '';
  } else {
    title.textContent = 'Lo sentimos mucho';
    screen.querySelector('.success-icon svg').innerHTML = '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>';
    msg.className    = 'success-msg-no';
    msg.textContent  = companions.length > 0
      ? 'Os echaremos de menos. Gracias por hacérnoslo saber.'
      : 'Te echaremos de menos. Gracias por hacérnoslo saber.';
    note.textContent = '';
  }

  screen.classList.add('show');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
