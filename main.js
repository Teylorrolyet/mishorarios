<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Portal Bosque · Horarios</title>

<!-- PDF -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

<style>
:root{
  --bg:#f0f7f4;
  --card:#fff;
  --text:#0f172a;
  --btn:#14532d;
}
.dark{
  --bg:#0f172a;
  --card:#020617;
  --text:#e5e7eb;
  --btn:#16a34a;
}
*{box-sizing:border-box}
body{
  margin:0;
  font-family:system-ui,sans-serif;
  background:var(--bg);
  color:var(--text);
  min-height:100vh;
  display:flex;
  justify-content:center;
  align-items:center;
}
.panel{
  background:var(--card);
  width:100%;
  max-width:560px;
  padding:2rem;
  border-radius:14px;
  box-shadow:0 20px 40px rgba(0,0,0,.15);
}
input,select,button{
  width:100%;
  padding:.7rem;
  margin-bottom:.6rem;
  border-radius:8px;
  border:1px solid #94a3b8;
}
button{
  background:var(--btn);
  color:#fff;
  border:none;
  font-weight:600;
}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
.hidden{display:none}
table{width:100%;border-collapse:collapse;margin-top:1rem}
th,td{text-align:center;padding:.45rem;border-bottom:1px solid #ccc}
.summary{
  background:#00000010;
  padding:.7rem;
  border-radius:10px;
  margin:.7rem 0;
  text-align:center;
}
</style>
</head>

<body>
<div class="panel">

<!-- LOGIN -->
<div id="auth">
  <h2>Portal Bosque</h2>
  <input id="user" placeholder="Nombre">
  <input id="pin" type="password" placeholder="Seña">
  <button onclick="login()">Ingresar</button>
  <button onclick="register()">Crear usuario</button>
</div>

<!-- APP -->
<div id="app" class="hidden">
  <h3 id="welcome"></h3>

  <button onclick="toggleDark()">🌙 Modo oscuro</button>

  <label>Mes</label>
  <select id="mesFiltro" onchange="render()"></select>

  <div class="summary" id="resumen"></div>

  <label>Fecha</label>
  <input type="date" id="fecha">

  <div class="grid">
    <div>
      <label>Entrada</label>
      <input type="time" id="entrada">
    </div>
    <div>
      <label>Salida</label>
      <input type="time" id="salida">
    </div>
  </div>

  <button onclick="guardar()">Guardar jornada</button>
  <button onclick="exportarPDF()">📄 Exportar PDF del mes</button>

  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Entrada</th>
        <th>Salida</th>
        <th>Horas</th>
        <th></th>
      </tr>
    </thead>
    <tbody id="tabla"></tbody>
  </table>

  <button onclick="logout()">Cerrar sesión</button>
</div>
</div>

<script>
let currentUser=null;

// Tema
if(localStorage.getItem('dark')==='1') document.body.classList.add('dark');
function toggleDark(){
  document.body.classList.toggle('dark');
  localStorage.setItem('dark',document.body.classList.contains('dark')?'1':'0');
}

// Fecha y horas
const hoy=new Date();
fecha.value=hoy.toISOString().slice(0,10);
entrada.value="07:00";
salida.value="14:00";

// Auth simple
function register(){
  if(localStorage.getItem(user.value)) return alert('Ya existe');
  localStorage.setItem(user.value,JSON.stringify({pin:pin.value,logs:[]}));
  alert('Usuario creado');
}
function login(){
  const d=JSON.parse(localStorage.getItem(user.value));
  if(!d||d.pin!==pin.value) return alert('Datos incorrectos');
  currentUser=user.value;
  auth.classList.add('hidden');
  app.classList.remove('hidden');
  welcome.textContent='Empleado: '+currentUser;
  cargarMeses();
  render();
}
function logout(){location.reload()}

// Guardar
function guardar(){
  const d=JSON.parse(localStorage.getItem(currentUser));
  d.logs.unshift({f:fecha.value,i:entrada.value,o:salida.value});
  localStorage.setItem(currentUser,JSON.stringify(d));
  cargarMeses();render();
}

// Render
function render(){
  const d=JSON.parse(localStorage.getItem(currentUser));
  const m=mesFiltro.value;
  tabla.innerHTML='';
  let total=0, dias=0;

  d.logs.forEach((l,i)=>{
    if(m && !l.f.startsWith(m)) return;
    const min=calc(l.i,l.o);
    total+=min;dias++;
    tabla.innerHTML+=`
    <tr>
      <td>${l.f.split('-').reverse().join('/')}</td>
      <td>${l.i}</td>
      <td>${l.o}</td>
      <td>${fmt(min)}</td>
      <td><button onclick="del(${i})">X</button></td>
    </tr>`;
  });

  resumen.innerHTML=`📊 Días: ${dias} · ⏱ Total: ${fmt(total)}`;
}

// PDF
function exportarPDF(){
  const { jsPDF } = window.jspdf;
  const pdf=new jsPDF();
  pdf.text(`Portal Bosque - ${currentUser}`,10,10);
  pdf.text(`Mes: ${mesFiltro.value}`,10,20);
  let y=30;
  [...tabla.rows].forEach(r=>{
    pdf.text([...r.cells].slice(0,4).map(c=>c.innerText).join(' | '),10,y);
    y+=8;
  });
  pdf.text(resumen.innerText,10,y+10);
  pdf.save(`horarios_${currentUser}_${mesFiltro.value}.pdf`);
}

// Meses
function cargarMeses(){
  const d=JSON.parse(localStorage.getItem(currentUser));
  const ms=[...new Set(d.logs.map(l=>l.f.slice(0,7)))];
  mesFiltro.innerHTML='<option value="">Mes actual</option>';
  ms.forEach(m=>mesFiltro.innerHTML+=`<option>${m}</option>`);
}

// Utils
function del(i){
  const d=JSON.parse(localStorage.getItem(currentUser));
  d.logs.splice(i,1);
  localStorage.setItem(currentUser,JSON.stringify(d));
  render();
}
function calc(i,o){
  const [a,b]=i.split(':').map(Number);
  const [c,d]=o.split(':').map(Number);
  return c*60+d-(a*60+b);
}
function fmt(m){
  return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
}
</script>
</body>
</html>
