import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, push, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyApXqCirb5XmrdkEALuSgTN6dQK6_6J-v0",
  authDomain: "planejamento-b155d.firebaseapp.com",
  databaseURL: "https://planejamento-b155d-default-rtdb.firebaseio.com/",
  projectId: "planejamento-b155d",
  storageBucket: "planejamento-b155d.firebasestorage.app",
  messagingSenderId: "994337364934",
  appId: "1:994337364934:web:d3499d294e0fd3744c70c7"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const loginView = document.getElementById('login-view');
const appContent = document.getElementById('app-content');
const mainNav = document.getElementById('main-nav');

document.getElementById('btn-google-login').onclick = () => {
    signInWithPopup(auth, provider).catch(err => alert("Erro: " + err.message));
};

document.getElementById('btn-logout').onclick = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
    const emailsAutorizados = ["limagabrielpg@gmail.com", "silva.lima.gabriel3012@escola.pr.gov.br"];

    if (user && emailsAutorizados.map(e => e.toLowerCase()).includes(user.email.toLowerCase())) { 
        loginView.style.display = 'none';
        appContent.style.display = 'block';
        mainNav.style.display = 'flex';
        carregarDados();
        carregarAgenda();
    } else if (user) {
        alert("Acesso negado. Apenas o Prof. Gabriel Lima tem permissão.");
        signOut(auth);
    } else {
        loginView.style.display = 'block';
        appContent.style.display = 'none';
        mainNav.style.display = 'none';
    }
});

const gradeFixa = {
    "Seg": [
        { turma: "1ª série", disc: "Matemática" }, { turma: "1ª série", disc: "Matemática" }, 
        { turma: "1ª série", disc: "Ed. Digital" }, { turma: "2ª série", disc: "Ed. Financeira" }, 
        { turma: "2ª série", disc: "Ed. Financeira" }, { turma: "7º ano", disc: "Matemática" }, 
        { turma: "7º ano", disc: "Matemática" }, { turma: "6º ano", disc: "Matemática" }, 
        { turma: "8º ano", disc: "Matemática" }, { turma: "8º ano", disc: "Matemática" }
    ],
    "Ter": [{ turma: "3ª série", disc: "Ed. Financeira" }],
    "Qua": [
        { turma: "9º ano", disc: "Recomposição" }, { turma: "9º ano", disc: "Recomposição" }, 
        { turma: "1ª série", disc: "Matemática" }, { turma: "1ª série", disc: "Matemática" }, 
        { turma: "7º ano", disc: "Matemática" }, { turma: "7º ano", disc: "Matemática" }, 
        { turma: "6º ano", disc: "Recomposição" }, { turma: "6º ano", disc: "Recomposição" }
    ],
    "Qui": [{ turma: "6º ano", disc: "Matemática" }],
    "Sex": [
        { turma: "3ª série", disc: "Ed. Financeira" }, { turma: "1ª série", disc: "Ed. Financeira" }, 
        { turma: "1ª série", disc: "Ed. Financeira" }, { turma: "1ª série", disc: "Ed. Digital" }, 
        { turma: "7º ano", disc: "Matemática" }, { turma: "6º ano", disc: "Matemática" }, 
        { turma: "6º ano", disc: "Matemática" }, { turma: "8º ano", disc: "Matemática" }, 
        { turma: "8º ano", disc: "Matemática" }
    ]
};

const feriados2026 = {
    "2026-01-01": "Ano Novo", "2026-04-03": "Paixão de Cristo", "2026-04-05": "Páscoa", "2026-04-21": "Tiradentes", "2026-05-01": "Dia do Trabalho", "2026-06-04": "Corpus Christi", "2026-06-05": "Recesso Escolar", "2026-09-07": "Independência", "2026-10-12": "N. Sra Aparecida", "2026-10-13": "Recesso Escolar", "2026-11-02": "Finados", "2026-11-15": "Proclamação", "2026-11-20": "Consciência Negra", "2026-12-25": "Natal"
};

let dadosPlanejamento = {};
let listaEventos = {};
let currentMonth = 4; let currentYear = 2026; let selectedDateKey = "";

function carregarDados() {
    onValue(ref(db, 'planejamentos'), (snapshot) => {
        dadosPlanejamento = snapshot.val() || {};
        renderCalendar();
        updateTable();
    });
}

// REALTIME PARA COMPONENTE DA AGENDA DE EVENTOS
function carregarAgenda() {
    onValue(ref(db, 'eventos_importantes'), (snapshot) => {
        listaEventos = snapshot.val() || {};
        const container = document.getElementById('agendaList');
        container.innerHTML = "";
        
        const chaves = Object.keys(listaEventos);
        if(chaves.length === 0) {
            container.innerHTML = `<p style="color:#7f8c8d; font-size:0.85rem;">Nenhum evento agendado.</p>`;
            return;
        }

        chaves.forEach(key => {
            const ev = listaEventos[key];
            container.innerHTML += `
                <div class="agenda-item">
                    <strong>📅 ${ev.data}</strong> ${ev.texto}
                    <button class="btn-del-event" onclick="deletarEventoAgenda('${key}')">✕</button>
                </div>`;
        });
    });
}

window.adicionarEventoAgenda = () => {
    const dataInput = document.getElementById('eventDate').value.trim();
    const textoInput = document.getElementById('eventText').value.trim();
    if(!dataInput || !textoInput) return alert("Preencha a data e a descrição do marco!");
    
    const novoRef = push(ref(db, 'eventos_importantes'));
    set(novoRef, { data: dataInput, texto: textoInput }).then(() => {
        document.getElementById('eventDate').value = "";
        document.getElementById('eventText').value = "";
    });
};

window.deletarEventoAgenda = (id) => {
    if(confirm("Deseja remover este marco da agenda?")) {
        remove(ref(db, 'eventos_importantes/' + id));
    }
};

window.mudarMes = (direcao) => {
    let novoMes = currentMonth + direcao;
    let novoAno = currentYear;
    if (novoMes > 11) { novoMes = 0; novoAno++; }
    else if (novoMes < 0) { novoMes = 11; novoAno--; }

    if (novoAno === 2026 && novoMes >= 4 && novoMes <= 11) {
        currentMonth = novoMes; currentYear = novoAno;
        renderCalendar();
    }
};

function isFerias(dateStr) {
    const d = new Date(dateStr + "T12:00:00");
    const julI = new Date("2026-07-13T12:00:00"); const julF = new Date("2026-07-24T12:00:00");
    const dezI = new Date("2026-12-21T12:00:00");
    if (d >= julI && d <= julF) return "Férias de Julho";
    if (d >= dezI) return "Férias de Dezembro";
    return null;
}

function renderCalendar() {
    const grid = document.getElementById('calendarGrid'); if(!grid) return; grid.innerHTML = "";
    const date = new Date(currentYear, currentMonth, 1);
    document.getElementById('monthDisplay').innerText = date.toLocaleString('pt-br', { month: 'long', year: 'numeric' }).toUpperCase();
    let offset = date.getDay(); for(let i=0; i<offset; i++) grid.innerHTML += `<div></div>`;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for(let d=1; d<=daysInMonth; d++) {
        const dataFormatada = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const diaData = new Date(dataFormatada + "T12:00:00");
        let diaSemana = diaData.toLocaleString('pt-br', { weekday: 'short' }).replace('.','');
        diaSemana = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1).toLowerCase();
        let isWeekend = (diaData.getDay() === 0 || diaData.getDay() === 6);
        let holidayName = feriados2026[dataFormatada]; let feriasName = isFerias(dataFormatada);
        let status = isWeekend ? "status-weekend" : "status-empty";
        let contentInside = `<span>${diaSemana}</span>`;

        if (holidayName || feriasName) { 
            status = "status-holiday"; contentInside = `<span class="holiday-name">😊<br>${holidayName || feriasName}</span>`; 
        } else if (!isWeekend && dadosPlanejamento[dataFormatada]) {
            let preenchidos = dadosPlanejamento[dataFormatada].filter(a => a.conteudo && a.conteudo.trim() !== "").length;
            if(preenchidos > 0) status = preenchidos === dadosPlanejamento[dataFormatada].length ? "status-full" : "status-partial";
        }

        const div = document.createElement('div'); div.className = `day-card ${status}`;
        if(!(status === 'status-holiday' || isWeekend)) div.onclick = () => window.openDay(dataFormatada, diaSemana);
        div.innerHTML = `<span style="font-weight:bold">${d}</span>${contentInside}`;
        grid.appendChild(div);
    }
}

window.openDay = (date, dia) => {
    selectedDateKey = date; const modal = document.getElementById('modal'); const container = document.getElementById('classInputs');
    document.getElementById('modalDateTitle').innerText = `Planejamento: ${date.split('-').reverse().join('/')}`;
    container.innerHTML = "";
    let aulas = dadosPlanejamento[date] || (gradeFixa[dia] || []).map(g => ({...g, conteudo: "", anexo: ""}));
    aulas.forEach((aula, i) => {
        container.innerHTML += `<div class="class-edit-row"><strong>${aula.turma} - ${aula.disc}</strong><input type="text" id="c_${i}" value="${aula.conteudo || ''}" placeholder="Conteúdo da aula"><input type="text" id="a_${i}" value="${aula.anexo || ''}" placeholder="Link do anexo (Drive, Video, etc)"></div>`;
    });
    modal.style.display = "block";
};

window.saveData = () => {
    const dateObj = new Date(selectedDateKey + "T12:00:00");
    let dia = dateObj.toLocaleString('pt-br', { weekday: 'short' }).replace('.','');
    dia = dia.charAt(0).toUpperCase() + dia.slice(1).toLowerCase();
    const base = gradeFixa[dia] || [];
    const novosDados = base.map((aula, i) => ({ ...aula, conteudo: document.getElementById(`c_${i}`).value, anexo: document.getElementById(`a_${i}`).value }));
    set(ref(db, 'planejamentos/' + selectedDateKey), novosDados).then(() => { document.getElementById('modal').style.display = 'none'; });
};

window.updateTable = () => {
    const tbody = document.getElementById('tableBody'); if(!tbody) return;
    const filtroDataInput = document.getElementById('searchData').value; 
    const fTurma = document.getElementById('searchTurma').value; 
    const fMateria = document.getElementById('searchMateria').value;
    let dataFiltroFormatada = filtroDataInput ? filtroDataInput.split('-').reverse().join('/') : "";

    tbody.innerHTML = "";
    Object.keys(dadosPlanejamento).sort().forEach(date => {
        const dataBR = date.split('-').reverse().join('/');
        dadosPlanejamento[date].forEach(aula => {
            const bateData = dataFiltroFormatada === "" || dataBR === dataFiltroFormatada;
            const bateTurma = fTurma === "" || aula.turma === fTurma;
            const bateMateria = fMateria === "" || aula.disc === fMateria;

            if(bateData && bateTurma && bateMateria && aula.conteudo.trim() !== "") {
                let anexoDisplay = "";
                if (aula.anexo && aula.anexo.trim() !== "") {
                    let url = aula.anexo.trim();
                    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
                    anexoDisplay = `<a href="${url}" target="_blank" class="btn-link">🔗 Abrir Link</a>`;
                }
                tbody.innerHTML += `<tr><td>${dataBR}</td><td>${aula.turma}</td><td>${aula.disc}</td><td>${aula.conteudo}</td><td>${anexoDisplay}</td></tr>`;
            }
        });
    });
};

window.showView = (v) => { 
    document.getElementById('calendar-view').style.display = v === 'calendar' ? 'block' : 'none'; 
    document.getElementById('table-view').style.display = v === 'table' ? 'block' : 'none'; 
    if(v === 'table') updateTable();
};
window.closeModal = () => { document.getElementById('modal').style.display = "none"; };
document.getElementById('prevMonth').onclick = () => window.mudarMes(-1); document.getElementById('nextMonth').onclick = () => window.mudarMes(1);
