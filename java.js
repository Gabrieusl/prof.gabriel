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
        carregarDadosNotas(); 
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

window.showView = (v) => { 
    document.getElementById('calendar-view').style.display = v === 'calendar' ? 'block' : 'none'; 
    document.getElementById('table-view').style.display = v === 'table' ? 'block' : 'none'; 
    document.getElementById('notas-view').style.display = v === 'notas' ? 'block' : 'none'; 
    if(v === 'table') updateTable();
};

window.closeModal = () => { document.getElementById('modal').style.display = "none"; };
document.getElementById('prevMonth').onclick = () => window.mudarMes(-1); document.getElementById('nextMonth').onclick = () => window.mudarMes(1);


/* ==========================================================================
   ACRÉSCIMO COMPLETO: BANCO NOMINAL DE ALUNOS E GERENCIAMENTO DINÂMICO
   ========================================================================== */

const listaAlunosPadrao = {
    "6A_MAT": ["Adryan", "Agatha", "Amanda", "Arthur", "Chandele", "Davi Lucas", "Davi Luca", "Emilly", "Erick", "Evellyn", "Gabriela", "Guilherme", "Igor", "Jaine", "Jean", "João Vitor Bueno", "João Vitor Paixão", "Leticia", "Luiz Gabriel", "Maria Eduarda", "Maria Eloiza", "Paola", "Raylan", "Ruan", "Sophia", "Tayson", "Thaylline", "Vitor Gabriel", "Willian", "Arthur Zampieri", "Renato"],
    "6A_REC": ["Adryan", "Agatha", "Amanda", "Arthur", "Chandele", "Davi Lucas", "Davi Luca", "Emilly", "Erick", "Evellyn", "Gabriela", "Guilherme", "Igor", "Jaine", "Jean", "João Vitor Bueno", "João Vitor Paixão", "Leticia", "Luiz Gabriel", "Maria Eduarda", "Maria Eloiza", "Paola", "Raylan", "Ruan", "Sophia", "Tayson", "Thaylline", "Vitor Gabriel", "Willian", "Arthur Zampieri", "Renato"],
    "7A_MAT": ["Alan", "Allan", "Any", "Bárbara", "Breno Gustavo", "Bruno", "Carlos Eduardo", "Danilo", "Emanuel", "Esteffany", "Evelin", "Giovanna", "Isabelle", "Isabelly", "Jairo", "Julia", "Lara", "Luiz Otávio", "Micaelly", "Milena", "Renata", "Sofia", "Welison", "Yago", "Davi Luiz", "Marlon"],
    "8A_MAT": ["Abner", "Alexandre", "Alex", "Ana Flavia", "Ana Paula", "Ana Vitória", "Andriele", "Breno Murilo", "César Henrique", "Cibele", "Claudinei", "David Nathan", "Emanuel", "Flavio", "Igor", "Kauan", "Lana", "Lucas", "Luiz Carlos", "Maria Eloara", "Matheus", "Nátali", "Pablo Junior", "Renata Aparecida", "Ryan", "Thaís", "Wesley"],
    "9A_REC": ["Adryan", "Ana Paula", "Breno Iran", "Datah", "Emanuel", "Everton Felipe", "Fernanda", "Gabriel", "Graziely", "Gustavo Mendes", "Gusthavo Henrique", "Jonathan Eduardo", "Josiel", "Juliane", "Kauã Vinícius", "Leopoldo", "Maria Izabel", "Maria Luiza", "Mario Eduardo", "Mateus", "Murilo Henrique", "Natalia", "Natália Yasmim", "Pedro", "Pietro", "Rafael Antonio", "Rafaeli Cristina", "Rafael", "Samuel", "Thaemy", "Vitor Daniel", "Willy Otávio"],
    "1A_MAT": ["Andre", "Augusto Junior", "Eder Kaua", "Eduarda Gabrielly", "Estefany", "Fabricio", "Gabriel", "Gabrielli", "Graziela Vitória", "Hayan", "Hendryk Gabriel", "Isabel Cristina", "Jennifer Kauane", "João Gabriel", "José Guilherme", "Kadu", "Kauã", "Kenedy Gustavo", "Luis Adriano", "Luna Maria", "Maria Klara", "Matheus Kalinoski", "Maycon", "Millena Graziela", "Nicolas Mateus", "Thiago Vinicius", "Vanessa Pires", "Victor Hugo", "Vanessa Milena", "Wesley Gabriel", "Yasmin Alves", "Livia", "Maria Vitória"],
    "1A_FIN": ["Andre", "Augusto Junior", "Eder Kaua", "Eduarda Gabrielly", "Estefany", "Fabricio", "Gabriel", "Gabrielli", "Graziela Vitória", "Hayan", "Hendryk Gabriel", "Isabel Cristina", "Jennifer Kauane", "João Gabriel", "José Guilherme", "Kadu", "Kauã", "Kenedy Gustavo", "Luis Adriano", "Luna Maria", "Maria Klara", "Matheus Kalinoski", "Maycon", "Millena Graziela", "Nicolas Mateus", "Thiago Vinicius", "Vanessa Pires", "Victor Hugo", "Vanessa Milena", "Wesley Gabriel", "Yasmin Alves", "Livia", "Maria Vitória"],
    "1A_DIG": ["Andre", "Augusto Junior", "Eder Kaua", "Eduarda Gabrielly", "Estefany", "Fabricio", "Gabriel", "Gabrielli", "Graziela Vitória", "Hayan", "Hendryk Gabriel", "Isabel Cristina", "Jennifer Kauane", "João Gabriel", "José Guilherme", "Kadu", "Kauã", "Kenedy Gustavo", "Luis Adriano", "Luna Maria", "Maria Klara", "Matheus Kalinoski", "Maycon", "Millena Graziela", "Nicolas Mateus", "Thiago Vinicius", "Vanessa Pires", "Victor Hugo", "Vanessa Milena", "Wesley Gabriel", "Yasmin Alves", "Livia", "Maria Vitória"],
    "2A_FIN": ["Adrielly", "Ághata Vitória", "Emanuele", "Evellyn Vitória", "Gabriel", "Guilherme", "Henrique", "Isabela", "Jamile Vitória", "Jhony Entony", "Kauã", "Kauane", "Kemilly Crislaine", "Leticia", "Maisa Aparecida", "Maisa Maia", "Maria Geovana", "Matheus", "Nathaly Kutner", "Otavio Mateus", "Renan Gonçalves", "Thalyta Luciele", "Thiago Rafael", "Victor Emanuel", "Diego"],
    "3A_FIN": ["André Gustavo", "Anik", "Anna Izabely", "Cassiano", "Cauã Gabriel", "Cezidio Vicente", "Daniel", "Everton Lucas", "Evilyn Gabrieli", "Flávio", "Gabriel de Méo", "Gabriely Ferreira", "Gladson Cauã", "Gustavo Mendes", "Janaina", "Jennifer Maria", "Julio Cesar", "Maiquel", "Nicole Andrade", "Paulo Guilherme", "Rafael Trindade", "Sabrina", "Bryan"]
};

function carregarDadosNotas() {
    onValue(ref(db, 'diario_notas'), (snapshot) => {
        dadosNotasFirebase = snapshot.val() || {};
        const turmaAtiva = document.getElementById('selectTurmaNotas').value;
        if(turmaAtiva) renderizarTabelaNotas(turmaAtiva);
    });
}

document.getElementById('selectTurmaNotas').onchange = (e) => {
    renderizarTabelaNotas(e.target.value);
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

    // Se a turma não existir no banco da nuvem, cria a estrutura inicial com sua lista nominal fixa
    if (!dadosNotasFirebase[turmaKey]) {
        let cargaInicial = {};
        const alunosPadrao = listaAlunosPadrao[turmaKey] || [];
        
        alunosPadrao.forEach((nomeAluno, index) => {
            const idGerado = `aluno_${Date.now()}_${index}`;
            cargaInicial[idGerado] = { nome: nomeAluno, n1: "", n2: "", n3: "" };
        });

        // Envia imediatamente para dar persistência inicial ao banco remoto
        set(ref(db, 'diario_notas/' + turmaKey), cargaInicial);
        return; 
    }

    const alunosDaTurma = dadosNotasFirebase[turmaKey];

    // Ordena os alunos em ordem alfabética para facilitar a chamada
    const alunosOrdenados = Object.keys(alunosDaTurma).map(id => ({
        id: id,
        ...alunosDaTurma[id]
    })).sort((a, b) => a.nome.localeCompare(b.nome));

    if (alunosOrdenados.length === 0) {
        corpo.innerHTML = `<tr><td colspan="6" style="padding: 20px; text-align: center; color: #7f8c8d;">Nenhum aluno matriculado nesta turma.</td></tr>`;
        return;
    }

    alunosOrdenados.forEach(aluno => {
        let mediaDisplay = "-";
        const v1 = parseFloat(aluno.n1);
        const v2 = parseFloat(aluno.n2);
        const v3 = parseFloat(aluno.n3);
        if(!isNaN(v1) && !isNaN(v2) && !isNaN(v3)) {
            mediaDisplay = ((v1 + v2 + v3) / 3).toFixed(1);
        }

        const tr = document.createElement('tr');
        tr.style.borderBottom = "1px solid #f1f1f1";
        tr.innerHTML = `
            <td style="padding: 12px; font-weight: 500;">${aluno.nome}</td>
            <td style="padding: 12px; text-align: center;"><input type="number" min="0" max="10" step="0.1" class="nota-input" data-aluno="${aluno.id}" data-nota="n1" value="${aluno.n1 || ''}" style="width: 70px; padding: 6px; text-align: center; border: 1px solid #ccc; border-radius: 4px;"></td>
            <td style="padding: 12px; text-align: center;"><input type="number" min="0" max="10" step="0.1" class="nota-input" data-aluno="${aluno.id}" data-nota="n2" value="${aluno.n2 || ''}" style="width: 70px; padding: 6px; text-align: center; border: 1px solid #ccc; border-radius: 4px;"></td>
            <td style="padding: 12px; text-align: center;"><input type="number" min="0" max="10" step="0.1" class="nota-input" data-aluno="${aluno.id}" data-nota="n3" value="${aluno.n3 || ''}" style="width: 70px; padding: 6px; text-align: center; border: 1px solid #ccc; border-radius: 4px;"></td>
            <td style="padding: 12px; text-align: center; font-weight: bold;">${mediaDisplay}</td>
            <td style="padding: 12px; text-align: center;">
                <button class="btn-excluir-aluno" data-id="${aluno.id}" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">✕</button>
            </td>
        `;
        corpo.appendChild(tr);
    });

    // Escuta de alteração de campos para atualizar médias na tela de forma ágil
    corpo.querySelectorAll('.nota-input').forEach(input => {
        input.oninput = () => {
            const alunoId = input.getAttribute('data-aluno');
            const inputsDoAluno = corpo.querySelectorAll(`.nota-input[data-aluno="${alunoId}"]`);
            const v1 = parseFloat(inputsDoAluno[0].value);
            const v2 = parseFloat(inputsDoAluno[1].value);
            const v3 = parseFloat(inputsDoAluno[2].value);
            const tdMedia = input.closest('tr').querySelector('td:nth-child(5)');
            
            if(!isNaN(v1) && !isNaN(v2) && !isNaN(v3)) {
                tdMedia.innerHTML = ((v1 + v2 + v3) / 3).toFixed(1);
            } else {
                tdMedia.innerHTML = "-";
            }
        };
    });

    // Vincula ação dos botões de exclusão individual de alunos
    corpo.querySelectorAll('.btn-excluir-aluno').forEach(btn => {
        btn.onclick = () => {
            const idAluno = btn.getAttribute('data-id');
            const nomeAluno = alunosDaTurma[idAluno].nome;
            if (confirm(`Tem certeza que deseja remover o(a) aluno(a) "${nomeAluno}" desta turma?`)) {
                remove(ref(db, `diario_notas/${turmaKey}/${idAluno}`))
                    .then(() => alert("Aluno removido com sucesso!"));
            }
        };
    });
}

// Lógica de inclusão manual de novos estudantes na lista
document.getElementById('btnAdicionarAluno').onclick = () => {
    const turmaKey = document.getElementById('selectTurmaNotas').value;
    const inputNome = document.getElementById('novoAlunoNome');
    const nome = inputNome.value.trim();

    if (!turmaKey) return;
    if (!nome) return alert("Digite o nome do aluno para incluí-lo!");

    const novoId = `aluno_${Date.now()}`;
    
    // Insere o novo nó diretamente na coleção estruturada da turma correspondente
    set(ref(db, `diario_notas/${turmaKey}/${novoId}`), {
        nome: nome,
        n1: "",
        n2: "",
        n3: ""
    }).then(() => {
        inputNome.value = "";
        alert(`Aluno "${nome}" adicionado com sucesso!`);
    }).catch(err => alert("Erro ao adicionar aluno: " + err.message));
};

document.getElementById('btnSalvarNotas').onclick = () => {
    const turmaKey = document.getElementById('selectTurmaNotas').value;
    if(!turmaKey) return;

    const corpo = document.getElementById('corpoTabelaNotas');
    const inputs = corpo.querySelectorAll('.nota-input');
    
    // Clona o estado atual da turma para não apagar os nomes ao atualizar as notas
    let dadosParaSalvar = JSON.parse(JSON.stringify(dadosNotasFirebase[turmaKey] || {}));

    inputs.forEach(input => {
        const alunoId = input.getAttribute('data-aluno');
        const tipoNota = input.getAttribute('data-nota');
        const valor = input.value.trim();

        if(dadosParaSalvar[alunoId]) {
            dadosParaSalvar[alunoId][tipoNota] = valor;
        }
    });

    set(ref(db, 'diario_notas/' + turmaKey), dadosParaSalvar)
        .then(() => alert("Notas sincronizadas com a nuvem com sucesso!"))
        .catch(err => alert("Erro ao salvar notas: " + err.message));
};
