import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Configuração corrigida do seu Firebase
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

const gradeFixa = {
    "Seg": [{ turma: "1ª série", disc: "Matemática" }, { turma: "1ª série", disc: "Ed. Digital" }, { turma: "2ª série", disc: "Ed. Financeira" }, { turma: "2ª série", disc: "Ed. Financeira" }, { turma: "7º ano", disc: "Matemática" }, { turma: "7º ano", disc: "Matemática" }, { turma: "6º ano", disc: "Matemática" }, { turma: "8º ano", disc: "Matemática" }, { turma: "8º ano", disc: "Matemática" }],
    "Ter": [{ turma: "3ª série", disc: "Ed. Financeira" }],
    "Qua": [{ turma: "9º ano", disc: "Recomposição" }, { turma: "9º ano", disc: "Recomposição" }, { turma: "1ª série", disc: "Matemática" }, { turma: "1ª série", disc: "Matemática" }, { turma: "7º ano", disc: "Matemática" }, { turma: "7º ano", disc: "Matemática" }, { turma: "6º ano", disc: "Recomposição" }, { turma: "6º ano", disc: "Recomposição" }],
    "Qui": [{ turma: "6º ano", disc: "Matemática" }],
    "Sex": [{ turma: "3ª série", disc: "Ed. Financeira" }, { turma: "1ª série", disc: "Ed. Financeira" }, { turma: "1ª série", disc: "Ed. Financeira" }, { turma: "1ª série", disc: "Ed. Digital" }, { turma: "7º ano", disc: "Matemática" }, { turma: "6º ano", disc: "Matemática" }, { turma: "6º ano", disc: "Matemática" }, { turma: "8º ano", disc: "Matemática" }, { turma: "8º ano", disc: "Matemática" }]
};

const feriados2026 = {
    "2026-01-01": "Ano Novo", "2026-04-03": "Paixão de Cristo", "2026-04-05": "Páscoa", "2026-04-21": "Tiradentes", "2026-05-01": "Dia do Trabalho", "2026-06-04": "Corpus Christi", "2026-06-05": "Recesso Escolar", "2026-09-07": "Independência", "2026-10-12": "N. Sra Aparecida", "2026-10-13": "Recesso Escolar", "2026-11-02": "Finados", "2026-11-15": "Proclamação", "2026-11-20": "Consciência Negra", "2026-12-25": "Natal"
};

let dadosPlanejamento = {};
let currentMonth = 4; let currentYear = 2026; let selectedDateKey = "";

// Carregamento de dados em tempo real
onValue(ref(db, 'planejamentos'), (snapshot) => {
    dadosPlanejamento = snapshot.val() || {};
    renderCalendar();
    updateTable();
});

window.mudarMes = (direcao) => {
    currentMonth += direcao;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; } else if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
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
    
    // Começa no domingo (getDay() 0=Dom)
    let offset = date.getDay(); for(let i=0; i<offset; i++) grid.innerHTML += `<div></div>`;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for(let d=1; d<=daysInMonth; d++) {
        const dataFormatada = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const diaData = new Date(dataFormatada + "T12:00:00");
        let diaSemana = diaData.toLocaleString('pt-br', { weekday: 'short' }).replace('.','');
        diaSemana = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1).toLowerCase();
        
        let isWeekend = (diaData.getDay() === 0 || diaData.getDay() === 6);
        let holidayName = feriados2026[dataFormatada]; 
        let feriasName = isFerias(dataFormatada);
        
        let status = isWeekend ? "status-weekend" : "status-empty";
        let contentInside = `<span>${diaSemana}</span>`;

        if (holidayName || feriasName) { 
            status = "status-holiday"; 
            contentInside = `<span class="holiday-name">😊<br>${holidayName || feriasName}</span>`; 
        }
        else if (!isWeekend && dadosPlanejamento[dataFormatada]) {
            let preenchidos = dadosPlanejamento[dataFormatada].filter(a => a.conteudo && a.conteudo.trim() !== "").length;
            let total = dadosPlanejamento[dataFormatada].length;
            if(total > 0) { 
                if(preenchidos === total) status = "status-full"; 
                else if(preenchidos > 0) status = "status-partial"; 
            }
        }

        const div = document.createElement('div'); div.className = `day-card ${status}`;
        if(!(status === 'status-holiday' || isWeekend)) {
            div.onclick = () => window.openDay(dataFormatada, diaSemana);
        }
        div.innerHTML = `<span style="font-weight:bold; font-size:1.1rem">${d}</span>${contentInside}`;
        grid.appendChild(div);
    }
}

window.openDay = (date, dia) => {
    selectedDateKey = date; const modal = document.getElementById('modal'); const container = document.getElementById('classInputs');
    document.getElementById('modalDateTitle').innerText = `Planejamento: ${date.split('-').reverse().join('/')}`;
    container.innerHTML = "";
    let aulas = dadosPlanejamento[date] || (gradeFixa[dia] || []).map(g => ({...g, conteudo: "", anexo: ""}));
    aulas.forEach((aula, i) => {
        container.innerHTML += `<div class="class-edit-row"><strong>${aula.turma} - ${aula.disc}</strong><input type="text" id="c_${i}" placeholder="Conteúdo..." value="${aula.conteudo || ''}"><input type="text" id="a_${i}" placeholder="Link ou Anexo..." value="${aula.anexo || ''}"></div>`;
    });
    modal.style.display = "block";
};

window.saveData = () => {
    const dateObj = new Date(selectedDateKey + "T12:00:00");
    let dia = dateObj.toLocaleString('pt-br', { weekday: 'short' }).replace('.','');
    dia = dia.charAt(0).toUpperCase() + dia.slice(1).toLowerCase();
    const base = gradeFixa[dia] || [];
    const novosDados = base.map((aula, i) => ({ 
        ...aula, 
        conteudo: document.getElementById(`c_${i}`).value, 
        anexo: document.getElementById(`a_${i}`).value 
    }));
    set(ref(db, 'planejamentos/' + selectedDateKey), novosDados).then(() => { closeModal(); });
};

window.updateTable = () => {
    const tbody = document.getElementById('tableBody'); const fData = document.getElementById('searchData').value;
    const fTurma = document.getElementById('searchTurma').value; const fMateria = document.getElementById('searchMateria').value;
    tbody.innerHTML = "";
    Object.keys(dadosPlanejamento).sort().forEach(date => {
        const dataBR = date.split('-').reverse().join('/');
        dadosPlanejamento[date].forEach(aula => {
            if(dataBR.includes(fData) && (fTurma === "" || aula.turma === fTurma) && (fMateria === "" || aula.disc === fMateria) && aula.conteudo.trim() !== "") {
                let anexoDisplay = aula.anexo; 
                if (aula.anexo && (aula.anexo.startsWith('http') || aula.anexo.startsWith('www'))) {
                    let url = aula.anexo.startsWith('www') ? 'https://' + aula.anexo : aula.anexo;
                    anexoDisplay = `<a href="${url}" target="_blank" class="btn-link">🔗 Abrir</a>`;
                }
                tbody.innerHTML += `<tr><td>${dataBR}</td><td>${aula.turma}</td><td>${aula.disc}</td><td>${aula.conteudo}</td><td>${anexoDisplay}</td></tr>`;
            }
        });
    });
};

window.showView = (view) => { 
    document.getElementById('calendar-view').style.display = view === 'calendar' ? 'block' : 'none'; 
    document.getElementById('table-view').style.display = view === 'table' ? 'block' : 'none'; 
    if(view === 'table') updateTable(); 
};

window.closeModal = () => { document.getElementById('modal').style.display = "none"; };
document.getElementById('prevMonth').onclick = () => window.mudarMes(-1);
document.getElementById('nextMonth').onclick = () => window.mudarMes(1);