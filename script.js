// ============================================
// CONFIGURACIÓN DE SUPABASE
// ============================================
const SUPABASE_URL = "https://degtkcvzqmxfcjunkpxz.supabase.co";
const SUPABASE_KEY = "sb_publishable_vZ0zpCSW4hTBtFdXdWzl4g_x23IT90a";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================
// REFERENCIAS A ELEMENTOS DEL HTML
// ============================================
const form = document.getElementById("form-mascota");
const selectEspecie = document.getElementById("especie");
const selectRaza = document.getElementById("raza");
const selectTipoAtencion = document.getElementById("tipo_atencion");
const selectCondicionMedica = document.getElementById("condicion_medica");
const selectFiltroEspecie = document.getElementById("filtro-especie");
const tablaBody = document.getElementById("tabla-body");
const mensajeDiv = document.getElementById("mensaje");
const btnSubmit = document.getElementById("btn-submit");

// Guardamos aquí todas las razas para poder filtrarlas según la especie elegida
let todasLasRazas = [];

// ============================================
// CARGA DE CATÁLOGOS DESDE SUPABASE
// ============================================

async function cargarEspecies() {
  const { data, error } = await supabaseClient.from("especies").select("*").order("nombre");

  if (error) {
    console.error("Error cargando especies:", error);
    return;
  }

  // Llenamos el select del formulario
  data.forEach((especie) => {
    const option = document.createElement("option");
    option.value = especie.id;
    option.textContent = especie.nombre;
    selectEspecie.appendChild(option);
  });

  // Llenamos también el select del filtro en el listado
  data.forEach((especie) => {
    const option = document.createElement("option");
    option.value = especie.id;
    option.textContent = especie.nombre;
    selectFiltroEspecie.appendChild(option);
  });
}

async function cargarRazas() {
  const { data, error } = await supabaseClient.from("razas").select("*").order("nombre");

  if (error) {
    console.error("Error cargando razas:", error);
    return;
  }

  todasLasRazas = data;
}

async function cargarTiposAtencion() {
  const { data, error } = await supabaseClient.from("tipos_atencion").select("*").order("nombre");

  if (error) {
    console.error("Error cargando tipos de atención:", error);
    return;
  }

  data.forEach((tipo) => {
    const option = document.createElement("option");
    option.value = tipo.id;
    option.textContent = tipo.nombre;
    selectTipoAtencion.appendChild(option);
  });
}

async function cargarCondicionesMedicas() {
  const { data, error } = await supabaseClient.from("condiciones_medicas").select("*").order("nombre");

  if (error) {
    console.error("Error cargando condiciones médicas:", error);
    return;
  }

  data.forEach((condicion) => {
    const option = document.createElement("option");
    option.value = condicion.id;
    option.textContent = condicion.nombre;
    selectCondicionMedica.appendChild(option);
  });
}

// Cuando el usuario elige una especie, filtramos las razas que corresponden a esa especie
function actualizarRazasSegunEspecie() {
  const especieId = selectEspecie.value;

  selectRaza.innerHTML = "";

  if (!especieId) {
    selectRaza.innerHTML = '<option value="">Seleccione primero la especie</option>';
    return;
  }

  const razasFiltradas = todasLasRazas.filter(
    (raza) => String(raza.especie_id) === String(especieId)
  );

  selectRaza.innerHTML = '<option value="">Seleccione...</option>';

  razasFiltradas.forEach((raza) => {
    const option = document.createElement("option");
    option.value = raza.id;
    option.textContent = raza.nombre;
    selectRaza.appendChild(option);
  });
}

selectEspecie.addEventListener("change", actualizarRazasSegunEspecie);

// ============================================
// REGISTRO DE MASCOTA (INSERT)
// ============================================

function mostrarMensaje(texto, tipo) {
  mensajeDiv.textContent = texto;
  mensajeDiv.className = "mensaje show " + tipo;

  setTimeout(() => {
    mensajeDiv.className = "mensaje";
  }, 4000);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  btnSubmit.disabled = true;
  btnSubmit.textContent = "Registrando...";

  const nuevoRegistro = {
    nombre_mascota: document.getElementById("nombre_mascota").value.trim(),
    edad: parseFloat(document.getElementById("edad").value),
    peso: parseFloat(document.getElementById("peso").value),
    nombre_dueno: document.getElementById("nombre_dueno").value.trim(),
    apellido_dueno: document.getElementById("apellido_dueno").value.trim(),
    dni_dueno: document.getElementById("dni_dueno").value.trim(),
    celular: document.getElementById("celular").value.trim(),
    correo: document.getElementById("correo").value.trim(),
    especie_id: parseInt(selectEspecie.value),
    raza_id: parseInt(selectRaza.value),
    tipo_atencion_id: parseInt(selectTipoAtencion.value),
    condicion_medica_id: parseInt(selectCondicionMedica.value),
    observaciones: document.getElementById("observaciones").value.trim(),
  };

  const { error } = await supabaseClient.from("mascotas").insert([nuevoRegistro]);

  btnSubmit.disabled = false;
  btnSubmit.textContent = "Registrar mascota";

  if (error) {
    console.error("Error al registrar:", error);
    mostrarMensaje("Ocurrió un error al registrar. Intenta nuevamente.", "error");
    return;
  }

  mostrarMensaje("¡Mascota registrada con éxito!", "success");
  form.reset();
  selectRaza.innerHTML = '<option value="">Seleccione primero la especie</option>';

  // Recargamos el listado para mostrar el nuevo registro
  cargarListado();
});

// ============================================
// LISTADO DE MASCOTAS (GET con joins a catálogos)
// ============================================

async function cargarListado(especieIdFiltro) {
  tablaBody.innerHTML = '<tr><td colspan="10" class="loading-row">Cargando registros...</td></tr>';

  let query = supabaseClient
    .from("mascotas")
    .select(`
      id,
      nombre_mascota,
      edad,
      peso,
      nombre_dueno,
      apellido_dueno,
      dni_dueno,
      celular,
      especies ( nombre ),
      razas ( nombre ),
      tipos_atencion ( nombre ),
      condiciones_medicas ( nombre )
    `)
    .order("id", { ascending: true });

  if (especieIdFiltro) {
    query = query.eq("especie_id", especieIdFiltro);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error cargando listado:", error);
    tablaBody.innerHTML = '<tr><td colspan="10" class="empty-row">No se pudo cargar el listado.</td></tr>';
    return;
  }

  if (!data || data.length === 0) {
    tablaBody.innerHTML = '<tr><td colspan="10" class="empty-row">No hay registros para mostrar.</td></tr>';
    return;
  }

  tablaBody.innerHTML = "";

  data.forEach((registro) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${registro.nombre_mascota}</td>
      <td>${registro.edad ?? "-"}</td>
      <td>${registro.peso ?? "-"} kg</td>
      <td>${registro.nombre_dueno} ${registro.apellido_dueno}</td>
      <td>${registro.dni_dueno}</td>
      <td>${registro.celular}</td>
      <td>${registro.especies?.nombre ?? "-"}</td>
      <td>${registro.razas?.nombre ?? "-"}</td>
      <td>${registro.tipos_atencion?.nombre ?? "-"}</td>
      <td>${registro.condiciones_medicas?.nombre ?? "-"}</td>
    `;
    tablaBody.appendChild(fila);
  });
}

// Cuando el usuario cambia el filtro de especie, recargamos el listado filtrado
selectFiltroEspecie.addEventListener("change", () => {
  const valor = selectFiltroEspecie.value;
  cargarListado(valor || undefined);
});

// ============================================
// INICIALIZACIÓN: se ejecuta al cargar la página
// ============================================

async function iniciar() {
  await cargarEspecies();
  await cargarRazas();
  await cargarTiposAtencion();
  await cargarCondicionesMedicas();
  await cargarListado();
}

iniciar();