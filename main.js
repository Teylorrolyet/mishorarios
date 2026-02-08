// main.js
import { auth } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

let currentUser = null;

// Elementos
const email = document.getElementById('email');
const pass = document.getElementById('pass');
const authDiv = document.getElementById('auth');
const appDiv = document.getElementById('app');
const tabla = document.getElementById('tabla');
const welcome = document.getElementById('welcome');
const fecha = document.getElementById('fecha');
const entrada = document.getElementById('entrada');
const salida = document.getElementById('salida');
const mes = document.getElementById('mes');
const total = document.getElementById('total');
const authNotice = document.getElementById('authNotice');
const appNotice = document.getElementById('appNotice');

// Fecha por defecto
const now = new Date();
const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
mes.value = today.toISOString().slice(0,7);
fecha.value = today.toISOString().slice(0,10);

// Función de aviso
function notice(msg){
  const el = currentUser ? appNotice : authNotice;
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3000);
}

// Registro
document.getElementById('btnRegister').onclick = () => {
  if(!email.value || !pass.value){ notice('Completá los datos'); return; }
  createUserWithEmailAndPassword(auth, email.value, pass.value)
    .then(() => notice('✅ Cuenta creada correctamente'))
    .catch(e => notice('Error: '+e.message));
};

// Login
document.getElementById('btnLogin').onclick = () => {
  if(!email.value || !pass.value){ notice('Completá los datos'); return; }
  signInWithEmailAndPassword(auth, email.value, pass.value)
    .then(userCredential => {
      currentUser = userCredential.user.email;
      authDiv.classList.add('hidden');
      appDiv.classList.remove('hidden');
      welcome.textContent = 'Usuario: ' + currentUser;
      render();
    })
    .catch(e => notice('Error: '+e.message));
};

// Logout
document.getElementById('btnLogout').onclick = () => {
  currentUser = null;
  authDiv.classList.remove('hidden');
  appDiv.classList.add('hidden');
};

// Datos de horarios guardados en localStorage (por usuario)
function getData(){
  return JSON.parse(localStorage.getItem(currentUser) || '{"logs":[]}');
}
function saveData(d){ localStorage.setItem(currentUser, JSON.stringify(d)); }

// Guardar jornada
document.getElementById('btnGuardar').onclick = () => {
  if(!fecha.value || !entrada.value || !salida.value) return;
  if(diff(entrada.value,salida.value)<=0){ notice('La salida debe ser mayor que la entrada'); return; }
  const d = getData();
  d.logs.unshift({ f: fecha.value, i: entrada.value, o: salida.value });
  saveData(d);
  entrada.value=''; salida.value='';
  render();
};

// Diferencia minutos
function diff(i,o){
  const [ih,im] = i.split(':').map(Number);
  const [oh,om] = o.split(':').map(Number);
  return (oh*60+om)-(ih*60+im);
}

// Formato hh:mm
function fmt(m){
  const h=Math.floor(m/60);
  const mm=m%60;
  return String(h).padStart(2,'0')+':'+String(mm).padStart(2,'0')+' hs';
}

// Render tabla
function render(){
  tabla.innerHTML='';
  let tot=0, mesTot=0;
  const d = getData();
  d.logs.forEach((l,i)=>{
    if(mes.value && !l.f.startsWith(mes.value)) return;
    const mins = diff(l.i,l.o);
    tot+=mins; mesTot+=mins;
    // fecha invertida: dd/mm/yyyy
    const f = l.f.split('-').reverse().join('/');
    tabla.innerHTML += `<tr>
      <td>${f}</td>
      <td>${l.i}</td>
      <td>${l.o}</td>
      <td><strong>${fmt(mins)}</strong></td>
      <td><button class="link" onclick="del(${i})">✕</button></td>
    </tr>`;
  });
  const name = mes.value ? new Date(mes.value+'-01').toLocaleDateString('es-ES',{month:'long',year:'numeric'}) : 'todos los meses';
  total.textContent = `Total ${name}: ${fmt(mesTot)} | General: ${fmt(tot)}`;
}

// Eliminar fila
window.del = function(i){
  const d=getData();
  d.logs.splice(i,1);
  saveData(d);
  render();
};

// Eliminar cuenta
document.getElementById('btnDelete').onclick = () => document.getElementById('deleteConfirm').classList.remove('hidden');
document.getElementById('btnCancelDelete').onclick = () => document.getElementById('deleteConfirm').classList.add('hidden');
document.getElementById('btnConfirmDelete').onclick = () => {
  localStorage.removeItem(currentUser);
  currentUser=null;
  document.getElementById('deleteConfirm').classList.add('hidden');
  authDiv.classList.remove('hidden');
  appDiv.classList.add('hidden');
  notice('Cuenta eliminada correctamente');
};

// Compartir por WhatsApp
document.getElementById('btnShare').onclick = () => {
  const d = getData();
  const phone = prompt('Ingresá el número de celular (código país, ej: 5989XXXXXXX)');
  if(!phone) return;
  let text = `🕒 *Horario Portal Bosque*\nEmpleado: ${currentUser}\nMes: ${mes.value}\n\n`;
  let totalMin=0;
  d.logs.forEach(l=>{
    if(mes.value && !l.f.startsWith(mes.value)) return;
    const mins = diff(l.i,l.o); totalMin+=mins;
    const f = l.f.split('-').reverse().join('/');
    text+=`📅 ${f} | ${l.i} - ${l.o} (${fmt(mins)})\n`;
  });
  text+=`\n✅ Total del mes: ${fmt(totalMin)}`;
  const url=`https://wa.me/${phone}?text=`+encodeURIComponent(text);
  window.open(url,'_blank');
};
