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
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxcqbBslyoeJNL2pkrSksN3XBfBan8dUwnBetDBueUBovPfLh5V6aJE71W_53PIOaVG/exec';

/* ============================================================
   MULTI-STEP FORM STATE
   ============================================================ */
let currentStep = 1;
const TOTAL_STEPS = 5;

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
  if (!validateStep(currentStep)) return;

  showStep(n);
}

function showStep(n) {
  document.getElementById('step' + currentStep).classList.remove('active');
  currentStep = n;
  document.getElementById('step' + currentStep).classList.add('active');
  updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
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

    ok = nombre && tel;
  }

  if (step === 2) {
    const val = document.querySelector('input[name="asistencia"]:checked');
    setError('asistenciaError', !val);
    ok = !!val;
  }

  if (step === 3) {
    const menu     = document.querySelector('input[name="menu"]:checked');
    const alergias = document.querySelector('input[name="alergias"]:checked');
    let alergiasOk = true;

    setError('menuError',     !menu);
    setError('alergiasError', !alergias);

    if (alergias && alergias.value === 'si') {
      const texto = document.getElementById('alergiasTexto').value.trim();
      setError('alergiasTextoError', !texto);
      alergiasOk = !!texto;
    }

    ok = menu && alergias && alergiasOk;
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

    ok = transporte && paradaOk;
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

/* Menu step: show allergy detail field if "yes" selected */
function toggleAlergias() {
  const val = document.querySelector('input[name="alergias"]:checked');
  document.getElementById('alergiasDetalle').classList.toggle('show', val && val.value === 'si');
}

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

// Step 3: menu, allergies, and allergy detail text
document.querySelectorAll('input[name="menu"]').forEach(radio => {
  radio.addEventListener('change', () => setError('menuError', false));
});
document.querySelectorAll('input[name="alergias"]').forEach(radio => {
  radio.addEventListener('change', () => setError('alergiasError', false));
});
document.getElementById('alergiasTexto').addEventListener('input', function() {
  if (this.value.trim()) setError('alergiasTextoError', false);
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
  if (!validateStep(2)) return;
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
   Collects all form data and POSTs to the Apps Script endpoint.
   Uses no-cors mode since the endpoint does not return CORS headers.
   ============================================================ */
async function enviarFormulario(noAsiste = false) {
  // Only validate step 4 if the guest is attending
  if (!noAsiste && !validateStep(4)) return;

  // Collect all form data
  const nombre        = document.getElementById('nombre').value.trim();
  const telefono      = document.getElementById('telefono').value.trim();
  const asistencia    = document.querySelector('input[name="asistencia"]:checked')?.value || 'no';
  const mensajeNo     = document.getElementById('mensajeNoAsiste').value.trim();
  const menu          = document.querySelector('input[name="menu"]:checked')?.value || '';
  const alergiasVal   = document.querySelector('input[name="alergias"]:checked')?.value || '';
  const alergiasText  = document.getElementById('alergiasTexto').value.trim();
  const transporte    = document.querySelector('input[name="transporte"]:checked')?.value || '';
  const paradaBus     = document.getElementById('paradaBus').value;
  const mensajeNovios = document.getElementById('mensajeNovios').value.trim();

  const datos = {
    timestamp:  new Date().toISOString(),
    nombre,
    telefono,
    asistencia,
    mensajeNoAsiste: mensajeNo,
    menu,
    alergias:          alergiasVal,
    alergiasDetalle:   alergiasText,
    transporte,
    paradaBus,
    mensajeNovios
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
    mostrarExito(asistencia, nombre);
    return;
  }

  // Test mode: entering "test" as name simulates submission without calling Apps Script
  if (nombre.toLowerCase() === 'test') {
    console.warn('Test mode active. Simulating submission without calling Apps Script.');
    console.log('Data that would be sent:', datos);
    await new Promise(r => setTimeout(r, 900));
    mostrarExito(asistencia, nombre);
    return;
  }

  try {
    await fetch(APPS_SCRIPT_URL, {
      method:  'POST',
      mode:    'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(datos)
    });
    mostrarExito(asistencia, nombre);
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
function mostrarExito(asistencia, nombre) {
  // Hide all form steps and the progress bar
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.getElementById('progressBar').style.display = 'none';

  const screen = document.getElementById('successScreen');
  const title  = document.getElementById('successTitle');
  const msg    = document.getElementById('successMsg');
  const note   = document.getElementById('successNote');

  if (asistencia === 'si') {
    title.textContent = '¡Hasta pronto, ' + nombre.split(' ')[0] + '!';
    msg.textContent   = 'Hemos recibido tu confirmación. ¡Estamos deseando celebrarlo contigo el 12 de septiembre!';
    note.textContent  = '¡Muchas gracias por tomarte el tiempo de confirmarnos! Recuerda que, por motivos logísticos, el formulario debe rellenarse de forma individual. Si vienes acompañado/a, pide a tu pareja o familiar que complete también su propia confirmación.';
  } else {
    title.textContent = 'Lo sentimos mucho';
    screen.querySelector('.success-icon svg').innerHTML = '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>';
    msg.className     = 'success-msg-no';
    msg.textContent   = 'Te echaremos de menos. Gracias por hacérnoslo saber y por el mensaje que nos has dejado.';
  }

  screen.classList.add('show');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
