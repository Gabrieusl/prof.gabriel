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
        const chavesFiltradas = Object.keys(listaEventos).filter(k => listaEventos[k]); 
        if(chavesFiltradas.length === 0) {
            container.innerHTML = `<p style="color:#7f8c8d; font-size:0.85rem;">Nenhum evento agendado.</p>`;
            return;
        }
        chavesFiltradas.forEach(key => {
            const ev = listaEventEventos ? listaEventos[key] : ev;
            container.innerHTML += `<div class="agenda-item"><strong>📅 ${ev.data}</strong> ${ev.texto}<button class="btn-del-event" onclick="deletarEventoAgenda('${key}')">✕</button></div>`;
        });
    });
}

window.adicionarEventoAgenda = () => {
    const dataInput = document.getElementById('eventDate').value.trim();
    const textoInput = document.getElementById('eventText').value.trim();
    if(!dataInput || !textoInput) return alert("Preencha a data e a descrição!");
    push(ref(db, 'eventos_importantes'), { data: dataInput, texto: textoInput }).then(() => {
        document.getElementById('eventDate').value = ""; document.getElementById('eventText').value = "";
    });
};

window.deletarEventoAgenda = (id) => { if(confirm("Remover evento?")) remove(ref(db, 'eventos_importantes/' + id)); };
window.mudarMes = (direcao) => { let nm = currentMonth + direcao; if (nm >= 0 && nm <= 11) { currentMonth = nm; renderCalendar(); } };

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
        let holidayName = feriados2026[dataFormatada];
        let status = isWeekend ? "status-weekend" : "status-empty";
        let contentInside = `<span>${diaSemana}</span>`;

        if (holidayName) { status = "status-holiday"; contentInside = `<span class="holiday-name">😊<br>${holidayName}</span>`; }
        else if (!isWeekend && dadosPlanejamento[dataFormatada]) {
            let pr = dadosPlanejamento[dataFormatada].filter(a => a.conteudo && a.conteudo.trim() !== "").length;
            if(pr > 0) status = pr === dadosPlanejamento[dataFormatada].length ? "status-full" : "status-partial";
        }
        const div = document.createElement('div'); div.className = `day-card ${status}`;
        if(!(holidayName || isWeekend)) div.onclick = () => window.openDay(dataFormatada, diaSemana);
        div.innerHTML = `<span style="font-weight:bold">${d}</span>${contentInside}`;
        grid.appendChild(div);
    }
}

window.openDay = (date, dia) => {
    selectedDateKey = date; document.getElementById('modalDateTitle').innerText = `Planejamento: ${date.split('-').reverse().join('/')}`;
    const container = document.getElementById('classInputs'); container.innerHTML = "";
    let aulas = dadosPlanejamento[date] || (gradeFixa[dia] || []).map(g => ({...g, conteudo: "", anexo: ""}));
    aulas.forEach((aula, i) => {
        container.innerHTML += `<div class="class-edit-row"><strong>${aula.turma} - ${aula.disc}</strong><input type="text" id="c_${i}" value="${aula.conteudo || ''}"><input type="text" id="a_${i}" value="${aula.anexo || ''}"></div>`;
    });
    document.getElementById('modal').style.display = "block";
};

window.saveData = () => {
    const dateObj = new Date(selectedDateKey + "T12:00:00");
    let dia = dateObj.toLocaleString('pt-br', { weekday: 'short' }).replace('.','');
    dia = dia.charAt(0).toUpperCase() + dia.slice(1).toLowerCase();
    const novosDados = (gradeFixa[dia] || []).map((aula, i) => ({ ...aula, conteudo: document.getElementById(`c_${i}`).value, anexo: document.getElementById(`a_${i}`).value }));
    set(ref(db, 'planejamentos/' + selectedDateKey), novosDados).then(() => { document.getElementById('modal').style.display = 'none'; });
};

window.updateTable = () => {
    const tbody = document.getElementById('tableBody'); if(!tbody) return;
    tbody.innerHTML = "";
    Object.keys(dadosPlanejamento).sort().forEach(date => {
        const dataBR = date.split('-').reverse().join('/');
        dadosPlanejamento[date].forEach(aula => {
            if(aula.conteudo && aula.conteudo.trim() !== "") {
                tbody.innerHTML += `<tr><td>${dataBR}</td><td>${aula.turma}</td><td>${aula.disc}</td><td>${aula.conteudo}</td><td>${aula.anexo || ''}</td></tr>`;
            }
        });
    });
};

window.showView = (v) => { 
    document.getElementById('calendar-view').style.display = v === 'calendar' ? 'block' : 'none'; 
    document.getElementById('table-view').style.display = v === 'table' ? 'block' : 'none'; 
    document.getElementById('notas-view').style.display = v === 'notas' ? 'block' : 'none'; 
};
window.closeModal = () => { document.getElementById('modal').style.display = "none"; };
document.getElementById('prevMonth').onclick = () => window.mudarMes(-1); document.getElementById('nextMonth').onclick = () => window.mudarMes(1);

/* ==========================================================================
   DIÁRIO DE NOTAS CONTROLADO DINAMICAMENTE (COMEÇA COM 4 COLUNAS FIÉIS)
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
    const header = document.getElementById('headerTabelaNotas');
    const corpo = document.getElementById('corpoTabelaNotas');
    const titulo = document.getElementById('tituloTurmaNotas');
    const select = document.getElementById('selectTurmaNotas');

    if (!turmaKey) { container.style.display = 'none'; return; }

    titulo.innerText = `Lançamento - ${select.options[select.selectedIndex].text}`;
    container.style.display = 'block';

    // Inicialização segura de turma nova estritamente com 4 colunas (n1 a n4)
    if (!dadosNotasFirebase[turmaKey]) {
        let cargaInicial = { config_colunas: {} };
        for (let i = 1; i <= 4; i++) {
            cargaInicial.config_colunas[`n${i}`] = { label: `Nota ${i}`, data: "" };
        }
        
        const alunosPadrao = listaAlunosPadrao[turmaKey] || [];
        alunosPadrao.forEach((nomeAluno, index) => {
            const idGerado = `aluno_${Date.now()}_${index}`;
            cargaInicial[idGerado] = { nome: nomeAluno, n1: "", n2: "", n3: "", n4: "" };
        });

        set(ref(db, 'diario_notas/' + turmaKey), cargaInicial);
        return; 
    }

    const estruturaTurma = dadosNotasFirebase[turmaKey];
    const colunasConfig = estruturaTurma.config_colunas || {};
    
    const chavesColunas = Object.keys(colunasConfig).sort((a,b) => {
        return parseInt(a.replace('n','')) - parseInt(b.replace('n',''));
    });

    // 1. CABEÇALHO DINÂMICO
    let htmlHeader = `<th style="padding: 12px; text-align: left;">Estudante</th>`;
    chavesColunas.forEach(key => {
        const conf = colunasConfig[key] || { label: 'Nota', data: "" };
        htmlHeader += `
            <th style="padding: 10px; text-align: center; width: 95px; background: #34495e;">
                <input type="text" class="header-input-title" id="head_label_${key}" value="${conf.label}" placeholder="Avaliação"><br>
                <input type="text" class="header-input-date" id="head_date_${key}" value="${conf.data}" placeholder="Data">
            </th>`;
    });
    htmlHeader += `
        <th style="padding: 12px; width: 80px; text-align: center; background: #16a085; color: white;">Média</th>
        <th style="padding: 12px; width: 70px; text-align: center;">Ações</th>`;
    header.innerHTML = htmlHeader;

    // 2. LINHAS DOS ALUNOS
    corpo.innerHTML = "";
    const listaAlunos = Object.keys(estruturaTurma)
        .filter(key => key !== 'config_colunas')
        .map(id => ({ id: id, ...estruturaTurma[id] }))
        .sort((a, b) => a.nome.localeCompare(b.nome));

    if (listaAlunos.length === 0) {
        corpo.innerHTML = `<tr><td colspan="${chavesColunas.length + 3}" style="padding: 20px; text-align: center; color: #7f8c8d;">Nenhum aluno matriculado.</td></tr>`;
        return;
    }

    listaAlunos.forEach(aluno => {
        let trHtml = `<td style="padding: 10px; font-weight: 500; color: #2c3e50;">${aluno.nome}</td>`;
        
        let soma = 0;
        let qtdNotasValidas = 0;

        chavesColunas.forEach(key => {
            const notaValor = aluno[key] || '';
            trHtml += `
                <td style="padding: 6px; text-align: center;">
                    <input type="number" min="0" max="10" step="0.1" class="nota-input-dinamica" 
                           data-aluno="${aluno.id}" data-nota="${key}" value="${notaValor}">
                </td>`;
            
            const num = parseFloat(notaValor);
            if(!isNaN(num)) {
                soma += num;
                qtdNotasValidas++;
            }
        });

        let mediaDisplay = qtdNotasValidas > 0 ? (soma / qtdNotasValidas).toFixed(1) : "-";

        trHtml += `
            <td style="padding: 10px; text-align: center; font-weight: bold; background: #fafffd; color: #16a085;" id="media_${aluno.id}">${mediaDisplay}</td>
            <td style="padding: 10px; text-align: center;">
                <button class="btn-excluir-aluno" data-id="${aluno.id}" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">✕</button>
            </td>`;

        const tr = document.createElement('tr');
        tr.style.borderBottom = "1px solid #f1f1f1";
        tr.innerHTML = trHtml;
        corpo.appendChild(tr);
    });

    corpo.querySelectorAll('.nota-input-dinamica').forEach(input => {
        input.oninput = () => {
            const alunoId = input.getAttribute('data-aluno');
            const inputsDoAluno = corpo.querySelectorAll(`.nota-input-dinamica[data-aluno="${alunoId}"]`);
            let soma = 0, qtd = 0;
            
            inputsDoAluno.forEach(inp => {
                const v = parseFloat(inp.value);
                if(!isNaN(v)) { soma += v; qtd++; }
            });
            
            document.getElementById(`media_${alunoId}`).innerText = qtd > 0 ? (soma / qtd).toFixed(1) : "-";
        };
    });

    corpo.querySelectorAll('.btn-excluir-aluno').forEach(btn => {
        btn.onclick = () => {
            const idAluno = btn.getAttribute('data-id');
            const nomeAluno = estruturaTurma[idAluno].nome;
            if (confirm(`Remover estudante "${nomeAluno}"?`)) {
                remove(ref(db, `diario_notas/${turmaKey}/${idAluno}`));
            }
        };
    });
}

// CORREÇÃO DEFINITIVA DO BOTÃO: Adiciona coluna com mapeamento limpo de objetos clonados
document.getElementById('btnAdicionarColunaNota').onclick = () => {
    const turmaKey = document.getElementById('selectTurmaNotas').value;
    if(!turmaKey) return alert("Selecione uma turma primeiro!");

    // Resgata o objeto direto da árvore local e garante o nó config_colunas limpo
    let dadosAtuais = dadosNotasFirebase[turmaKey] || {};
    let cloneDados = JSON.parse(JSON.stringify(dadosAtuais));
    
    if(!cloneDados.config_colunas) {
        cloneDados.config_colunas = {};
        for(let i = 1; i <= 4; i++) {
            cloneDados.config_colunas[`n${i}`] = { label: `Nota ${i}`, data: "" };
        }
    }

    const numeroProximaColuna = Object.keys(cloneDados.config_colunas).length + 1;
    const novaChave = `n${numeroProximaColuna}`;

    // Insere os metadados da nova coluna
    cloneDados.config_colunas[novaChave] = { label: `Nota ${numeroProximaColuna}`, data: "" };

    // Garante que todos os estudantes recebam a nova chave vazia
    Object.keys(cloneDados).forEach(idKey => {
        if(idKey !== 'config_colunas') {
            cloneDados[idKey][novaChave] = "";
        }
    });

    set(ref(db, 'diario_notas/' + turmaKey), cloneDados).then(() => {
        alert(`Coluna "Nota ${numeroProximaColuna}" inserida!`);
    }).catch(err => alert("Erro ao criar coluna: " + err.message));
};

document.getElementById('btnAdicionarAluno').onclick = () => {
    const turmaKey = document.getElementById('selectTurmaNotas').value;
    const inputNome = document.getElementById('novoAlunoNome');
    const nome = inputNome.value.trim();

    if (!turmaKey || !nome) return alert("Selecione a turma e digite o nome!");

    const estruturaTurma = dadosNotasFirebase[turmaKey] || {};
    const colunasConfig = estruturaTurma.config_colunas || { n1: {}, n2: {}, n3: {}, n4: {} };

    const novoId = `aluno_${Date.now()}`;
    let corpoAluno = { nome: nome };
    
    Object.keys(colunasConfig).forEach(key => {
        corpoAluno[key] = "";
    });

    set(ref(db, `diario_notas/${turmaKey}/${novoId}`), corpoAluno).then(() => {
        inputNome.value = "";
    });
};

document.getElementById('btnSalvarNotas').onclick = () => {
    const turmaKey = document.getElementById('selectTurmaNotas').value;
    if(!turmaKey) return;

    let cloneDados = JSON.parse(JSON.stringify(dadosNotasFirebase[turmaKey] || {}));
    if(!cloneDados.config_colunas) cloneDados.config_colunas = {};

    const chavesColunas = Object.keys(cloneDados.config_colunas);

    chavesColunas.forEach(key => {
        const lbl = document.getElementById(`head_label_${key}`).value.trim();
        const dt = document.getElementById(`head_date_${key}`).value.trim();
        cloneDados.config_colunas[key] = { label: lbl || `Nota`, data: dt || "" };
    });

    const inputsNotas = document.getElementById('corpoTabelaNotas').querySelectorAll('.nota-input-dinamica');
    inputsNotas.forEach(input => {
        const alunoId = input.getAttribute('data-aluno');
        const colunaNota = input.getAttribute('data-nota');
        const valor = input.value.trim();

        if(cloneDados[alunoId]) {
            cloneDados[alunoId][colunaNota] = valor;
        }
    });

    set(ref(db, 'diario_notas/' + turmaKey), cloneDados)
        .then(() => alert("Diário de notas salvo com sucesso!"))
        .catch(err => alert("Erro ao sincronizar: " + err.message));
};
