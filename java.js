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
        carregarDadosNotas(); // ACRÉSCIMO: inicia o monitoramento do banco de notas
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
   "2026-05-19": "Prova Paraná","2026-05-20": "Prova Paraná", "2026-01-01": "Ano Novo", "2026-04-03": "Paixão de Cristo", "2026-04-05": "Páscoa", "2026-04-21": "Tiradentes", "2026-05-01": "Dia do Trabalho", "2026-06-04": "Corpus Christi", "2026-06-05": "Recesso Escolar", "2026-09-07": "Independência", "2026-10-12": "N. Sra Aparecida", "2026-10-13": "Recesso Escolar", "2026-11-02": "Finados", "2026-11-15": "Proclamação", "2026-11-20": "Consciência Negra", "2026-12-25": "Natal"
};

let dadosPlanejamento = {};
let listaEventos = {};

// ACRÉSCIMO: Variável de escopo global para armazenar as notas resgatadas da nuvem
let dadosNotasFirebase = {};

const dataDispositivo = new Date();
let currentMonth = dataDispositivo.getMonth(); 
let currentYear = dataDispositivo.getFullYear(); 
let selectedDateKey = "";

function carregarDados() {
    onValue(ref(db, 'planejamentos'), (snapshot) => {
        dadosPlanejamento = snapshot.val() || {};
        renderCalendar();
        updateTable();
    });
}

function carregarAgenda() {
    onValue(ref(db, 'eventos_importantes'), (snapshot) => {
        listaEventos = snapshot.val() || {};
        const container = document.getElementById('agendaList');
        if (!container) return; 
        container.innerHTML = "";
        
        const chaves = Object.keys(listaEventos);
        const chavesFiltradas = chaves.filter(k => listaEventos[k]); 
        
        if(chavesFiltradas.length === 0) {
            container.innerHTML = `<p style="color:#7f8c8d; font-size:0.85rem;">Nenhum evento agendado.</p>`;
            return;
        }

        chavesFiltradas.forEach(key => {
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

    if (novoAno === 2026) {
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

// MODIFICADO: Gerenciamento unificado de views integrando o notas-view
window.showView = (v) => { 
    document.getElementById('calendar-view').style.display = v === 'calendar' ? 'block' : 'none'; 
    document.getElementById('table-view').style.display = v === 'table' ? 'block' : 'none'; 
    document.getElementById('notas-view').style.display = v === 'notas' ? 'block' : 'none'; 
    if(v === 'table') updateTable();
};

window.closeModal = () => { document.getElementById('modal').style.display = "none"; };
document.getElementById('prevMonth').onclick = () => window.mudarMes(-1); document.getElementById('nextMonth').onclick = () => window.mudarMes(1);


/* ==========================================================================
   ACRÉSCIMO: MÓDULO EXCLUSIVO DE LANÇAMENTO E CÁLCULO DE NOTAS NO FIREBASE
   ========================================================================== */

function carregarDadosNotas() {
    onValue(ref(db, 'diario_notas'), (snapshot) => {
        dadosNotasFirebase = snapshot.val() || {};
        // Se já houver turma selecionada na tela, atualiza a tabela em tempo real
        const turmaAtiva = document.getElementById('selectTurmaNotas').value;
        if(turmaAtiva) renderizarTabelaNotas(turmaAtiva);
    });
}

// Vincula o evento de mudança na seleção de turma para atualizar a tabela
document.getElementById('selectTurmaNotas').onchange = (e) => {
    const turma = e.target.value;
    renderizarTabelaNotas(turma);
};

function renderizarTabelaNotas(turmaKey) {
    const container = document.getElementById('container-tabela-notas');
    const corpo = document.getElementById('corpoTabelaNotas');
    const titulo = document.getElementById('tituloTurmaNotas');
    const select = document.getElementById('selectTurmaNotas');

    if (!turmaKey) {
        container.style.display = 'none';
        return;
    }

    titulo.innerText = `Lançamento - ${select.options[select.selectedIndex].text}`;
    corpo.innerHTML = "";
    container.style.display = 'block';

    // Lista fixa padrão com 10 slots de alunos estruturais para inicialização limpa da turma
    let listaAlunos = [];
    for(let i = 1; i <= 10; i++) {
        listaAlunos.push({ id: `aluno_${i}`, nome: `Estudante Nº ${String(i).padStart(2, '0')}` });
    }

    // Busca dados preexistentes salvos nessa chave do Firebase
    const dadosSalvosTurma = dadosNotasFirebase[turmaKey] || {};

    listaAlunos.forEach(aluno => {
        const notasAluno = dadosSalvosTurma[aluno.id] || { n1: "", n2: "", n3: "" };
        
        // Calcula média em tempo real se houver valores numéricos informados
        let mediaDisplay = "-";
        const v1 = parseFloat(notasAluno.n1);
        const v2 = parseFloat(notasAluno.n2);
        const v3 = parseFloat(notasAluno.n3);
        if(!isNaN(v1) && !isNaN(v2) && !isNaN(v3)) {
            mediaDisplay = ((v1 + v2 + v3) / 3).toFixed(1);
        }

        const tr = document.createElement('tr');
        tr.style.borderBottom = "1px solid #f1f1f1";
        tr.innerHTML = `
            <td style="padding: 12px; font-weight: 500;">${aluno.nome}</td>
            <td style="padding: 12px; text-align: center;"><input type="number" min="0" max="10" step="0.1" class="nota-input" data-aluno="${aluno.id}" data-nota="n1" value="${notasAluno.n1}" style="width: 70px; padding: 6px; text-align: center; border: 1px solid #ccc; border-radius: 4px;"></td>
            <td style="padding: 12px; text-align: center;"><input type="number" min="0" max="10" step="0.1" class="nota-input" data-aluno="${aluno.id}" data-nota="n2" value="${notasAluno.n2}" style="width: 70px; padding: 6px; text-align: center; border: 1px solid #ccc; border-radius: 4px;"></td>
            <td style="padding: 12px; text-align: center;"><input type="number" min="0" max="10" step="0.1" class="nota-input" data-aluno="${aluno.id}" data-nota="n3" value="${notasAluno.n3}" style="width: 70px; padding: 6px; text-align: center; border: 1px solid #ccc; border-radius: 4px;"></td>
            <td style="padding: 12px; text-align: center; font-weight: bold; id="med_${aluno.id}">${mediaDisplay}</td>
        `;
        corpo.appendChild(tr);
    });

    // Vincula escuta de eventos nos inputs para calcular a média de forma reativa na interface
    const inputs = corpo.querySelectorAll('.nota-input');
    inputs.forEach(input => {
        input.oninput = () => {
            const alunoId = input.getAttribute('data-aluno');
            const inputsDoAluno = corpo.querySelectorAll(`.nota-input[data-aluno="${alunoId}"]`);
            const v1 = parseFloat(inputsDoAluno[0].value);
            const v2 = parseFloat(inputsDoAluno[1].value);
            const v3 = parseFloat(inputsDoAluno[2].value);
            const tdMedia = input.closest('tr').querySelector('td:last-child');
            
            if(!isNaN(v1) && !isNaN(v2) && !isNaN(v3)) {
                tdMedia.innerHTML = ((v1 + v2 + v3) / 3).toFixed(1);
            } else {
                tdMedia.innerHTML = "-";
            }
        };
    });
}

document.getElementById('btnSalvarNotas').onclick = () => {
    const turmaKey = document.getElementById('selectTurmaNotas').value;
    if(!turmaKey) return;

    const corpo = document.getElementById('corpoTabelaNotas');
    const inputs = corpo.querySelectorAll('.nota-input');
    let dadosParaSalvar = {};

    inputs.forEach(input => {
        const alunoId = input.getAttribute('data-aluno');
        const tipoNota = input.getAttribute('data-nota');
        const valor = input.value.trim();

        if(!dadosParaSalvar[alunoId]) {
            dadosParaSalvar[alunoId] = { n1: "", n2: "", n3: "" };
        }
        dadosParaSalvar[alunoId][tipoNota] = valor;
    });

    // Envia o payload completo da estrutura de notas para a tabela correspondente no Realtime Database
    set(ref(db, 'diario_notas/' + turmaKey), dadosParaSalvar)
        .then(() => alert("Notas sincronizadas com a nuvem com sucesso!"))
        .catch(err => alert("Erro ao salvar notas: " + err.message));
};
