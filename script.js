// script.js - AÑADIR O REUBICAR ESTO AL PRINCIPIO

// -----------------------------
// 🔥 1. VERIFICACIÓN Y PROTECCIÓN DE LOGIN
// -----------------------------
const userToken = localStorage.getItem('user_token');
if (!userToken) {
    // Redirige inmediatamente si no hay token.
    window.location.href = 'login.html';
    // Detener la ejecución del script para evitar errores.
    // Retornamos de inmediato para que no se ejecute el resto.
    // Aunque el navegador ya redirigió, es una buena práctica:
    // return; // Usar 'return' si no estás usando módulos, o simplemente confiar en la redirección.
}

// -----------------------------
// 🔥 2. LÓGICA DE LOGOUT Y ELEMENTOS FIJOS
// -----------------------------
// Asignar Logout
document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_data');
    window.location.href = 'login.html';
});

// Lógica de Toggle theme (moverla de la parte de variables a un listener aquí)
document.getElementById('toggleTheme').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? null : 'dark';
    if (next) document.documentElement.setAttribute('data-theme', next);
    else document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', next || 'light');
});

// Restaurar tema al inicio de la carga del script
if (localStorage.getItem('theme') === 'dark') document.documentElement.setAttribute('data-theme','dark');

// -----------------------------
// 3. EL RESTO DE TUS VARIABLES Y FUNCIONES DE VENTAS
// -----------------------------
const API_BASE = "https://appwebback.onrender.com"; // backend base
const ENDPOINT_VENTAS = API_BASE + "/ventas";
const ENDPOINT_PDVS = API_BASE + "/pdvs";
const ENDPOINT_EXPORT = API_BASE + "/export/excel";

const tablaBody = document.getElementById("tabla-ventas-body");
const tableFoot = document.getElementById("table-foot");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("error-msg");
const status = document.getElementById("status");
let chart = null;

// helpers
function showLoading(on){ loading.style.display = on? 'block':'none'; }
function showError(msg){ errorBox.style.display='block'; errorBox.textContent = msg; }
function hideError(){ errorBox.style.display='none'; errorBox.textContent = ''; }
function fmt(n){ return Number(n || 0).toFixed(2); }

// consultar ventas
async function consultar(){
  hideError();
  const desde = document.getElementById('desde').value;
  const hasta = document.getElementById('hasta').value;
  const grupo = document.getElementById('grupo').value.trim();
  const pdv = document.getElementById('pdv').value;

  if(!desde || !hasta){ showError('Seleccioná desde y hasta'); return; }
  const params = new URLSearchParams({desde,hasta});
  if(grupo!=='') params.set('grupo',grupo);
  if(pdv!=='') params.set('pdv',pdv);

  await cargarVentas(params.toString());
}

async function cargarVentas(queryString){
  showLoading(true);
  tablaBody.innerHTML=''; tableFoot.innerHTML='';
  status.textContent = 'Consultando...';
  try{
    const res = await fetch(ENDPOINT_VENTAS + '?' + queryString);
    if(!res.ok) throw new Error('Error servidor');
    const json = await res.json();
    const lista = json.data || [];
    renderTabla(lista);
    renderChart(lista);
    status.textContent = `Registros: ${lista.length}`;
  }catch(err){
    showError(err.message);
    status.textContent = '';
  }finally{
    showLoading(false);
  }
}

function renderTabla(lista){
  if(!lista.length){
    tablaBody.innerHTML = `<tr><td colspan="13" style="text-align:center;color:#666;">Sin datos disponibles</td></tr>`;
    return;
  }
  // rows
  tablaBody.innerHTML = lista.map(item => `
    <tr>
      <td>${item.PDV}</td>
      <td>${Math.round(item.ARREGLOS).toLocaleString('es-AR')}</td>
      <td>${Math.round(item.EFEC).toLocaleString('es-AR')}</td>
      <td>${Math.round(item.MP).toLocaleString('es-AR')}</td>
      <td>${Math.round(item.RAPPI).toLocaleString('es-AR')}</td>
      <td>${Math.round(item.PYT).toLocaleString('es-AR')}</td>
      <td>${Math.round(item.PYE).toLocaleString('es-AR')}</td>
      <td>${Math.round(item.TDB).toLocaleString('es-AR')}</td>
      <td>${Math.round(item.TDC).toLocaleString('es-AR')}</td>
      <td>${Math.round(item.BITCOIN).toLocaleString('es-AR')}</td>
      <td>${Math.round(item.DELIVERY).toLocaleString('es-AR')}</td>
      <td>${Math.round(item.CTA_CORRIENTE).toLocaleString('es-AR')}</td>
      <td>${Math.round(item.TOTAL).toLocaleString('es-AR')}</td>
    </tr>
  `).join('');

  // total foot
  const totals = lista.reduce((acc,it)=>{
    acc.ARREGLOS += Math.round(it.ARREGLOS||0);
    acc.EFEC += Math.round(it.EFEC||0);
    acc.MP += Math.round(it.MP||0);
    acc.RAPPI += Math.round(it.RAPPI||0);
    acc.PYT += Math.round(it.PYT||0);
    acc.PYE += Math.round(it.PYE||0);
    acc.TDB += Math.round(it.TDB||0);
    acc.TDC += Math.round(it.TDC||0);
    acc.BITCOIN += Math.round(it.BITCOIN||0);
    acc.DELIVERY += Math.round(it.DELIVERY||0);
    acc.CTA_CORRIENTE += Math.round(it.CTA_CORRIENTE||0);
    acc.TOTAL += Math.round(it.TOTAL||0);
    return acc;
  }, {ARREGLOS:0,EFEC:0,MP:0,RAPPI:0,PYT:0,PYE:0,TDB:0,TDC:0,BITCOIN:0,DELIVERY:0,CTA_CORRIENTE:0,TOTAL:0});

  tableFoot.innerHTML = `<tr>
    <td>Total</td>
    <td>${Math.round(totals.ARREGLOS).toLocaleString('es-AR')}</td>
    <td>${Math.round(totals.EFEC).toLocaleString('es-AR')}</td>
    <td>${Math.round(totals.MP).toLocaleString('es-AR')}</td>
    <td>${Math.round(totals.RAPPI).toLocaleString('es-AR')}</td>
    <td>${Math.round(totals.PYT).toLocaleString('es-AR')}</td>
    <td>${Math.round(totals.PYE).toLocaleString('es-AR')}</td>
    <td>${Math.round(totals.TDB).toLocaleString('es-AR')}</td>
    <td>${Math.round(totals.TDC).toLocaleString('es-AR')}</td>
    <td>${Math.round(totals.BITCOIN).toLocaleString('es-AR')}</td>
    <td>${Math.round(totals.DELIVERY).toLocaleString('es-AR')}</td>
    <td>${Math.round(totals.CTA_CORRIENTE).toLocaleString('es-AR')}</td>
    <td>${Math.round(totals.TOTAL).toLocaleString('es-AR')}</td>
  </tr>`;
}

// export Excel
document.getElementById('btnExportExcel').addEventListener('click', async ()=>{
  const desde = document.getElementById('desde').value;
  const hasta = document.getElementById('hasta').value;
  const grupo = document.getElementById('grupo').value.trim(); // <-- AGREGAR GRUPO
  const pdv = document.getElementById('pdv').value; // <-- AGREGAR PDV
    
  if(!desde || !hasta){ showError('Seleccione fechas para exportar'); return; }
  
  const params = new URLSearchParams({desde,hasta});
  if(grupo!=='') params.set('grupo',grupo); // <-- AGREGAR GRUPO AL QUERY
  if(pdv!=='') params.set('pdv',pdv); // <-- AGREGAR PDV AL QUERY
    
  const url = ENDPOINT_EXPORT + '?' + params.toString();
  // fuerza descarga
  window.open(url, '_blank');
});


function renderChart(lista){
  const labels = lista.map(i=>i.PDV);
  const totals = lista.map(i=>parseInt(i.TOTAL || 0));
  const ctx = document.getElementById('grafico').getContext('2d');
  if(chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label:'Total por PDV', data: totals, backgroundColor: 'rgba(0,122,255,0.8)'}] },
    options: { responsive:true, plugins:{legend:{display:false}} }
  });
}

// events
document.getElementById('btnConsultar').addEventListener('click', consultar);

// -----------------------------
// Cargar PDVs en el desplegable
// -----------------------------
async function loadPDVs() {
    try {
        const resp = await fetch("http://127.0.0.1:8000/pdvs");

        if (!resp.ok) throw new Error("No se pudo cargar PDVs");

        const result = await resp.json();
        const lista = result.data || [];

        const select = document.getElementById("pdv");
        select.innerHTML = `<option value="">Todos</option>`;

        lista.forEach(item => {
            const opt = document.createElement("option");
            opt.value = item.pdv;
            opt.textContent = item.nombre;
            select.appendChild(opt);
        });

    } catch (err) {
        console.error("Error cargando PDVs:", err);
    }
}
// events (Asegúrate de que este bloque esté al final y solo contenga los listeners principales)
document.getElementById('btnConsultar').addEventListener('click', consultar);

loadPDVs();


