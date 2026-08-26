/* =========================================================
   MEU CENSO - PLANILHA MENSAL
========================================================= */

const usuarioLogadoRaw = sessionStorage.getItem("usuarioLogado");

if (!usuarioLogadoRaw) {
    window.location.href = "./index.html";
    throw new Error("Usuário não autenticado.");
}

let usuarioLogado;

try {
    usuarioLogado = JSON.parse(usuarioLogadoRaw);
} catch (erro) {
    sessionStorage.removeItem("usuarioLogado");
    window.location.href = "./index.html";
    throw erro;
}


/* =========================================================
   ELEMENTOS
========================================================= */

const mesAnoCenso = document.getElementById("mesAnoCenso");
const sectorName = document.getElementById("sectorName");
const userName = document.getElementById("userName");
const userRole = document.getElementById("userRole");
const userAvatar = document.getElementById("userAvatar");

const deadlineBox =
    document.getElementById("deadlineBox") ||
    document.querySelector(".deadline-box");

const deadlineText = document.getElementById("deadlineText");

const deadlineIcon =
    document.getElementById("deadlineIcon") ||
    deadlineBox?.querySelector("i");

const saveCenso = document.getElementById("saveCenso");
const saveCensoBottom = document.getElementById("saveCensoBottom");

const logoutButton =
    document.getElementById("logoutButton") ||
    document.querySelector(".logout-button");


/* =========================================================
   ESTADO
========================================================= */

let mesSelecionado = null;
let anoSelecionado = null;
let quantidadeDias = 0;
let periodoAberto = false;
let dadosMes = {};


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const camposAutomaticos = new Set([
    "encontro",
    "deixo",
    "numeroSaidas",
    "obitosTotal",
    "pacientesDia"
]);

const camposDigitaveis = new Set([
    "altas",
    "evasao",
    "obitosMenor24",
    "obitosMaior24",
    "transfExternas",
    "transfInternas",
    "admissao",
    "leitoIsolamento",
    "leitoManutencao"
]);

const gruposEspecialidades = {

    "clinica-medica": [
        "saude-mental",
        "clinica-medica",
        "neurologia-uavc",
        "oncologia-clinica"
    ],

    "clinica-cirurgica": [
        "cardiologia",
        "vascular",
        "ortotraumatologia",
        "neurocirurgia",
        "cirurgia-geral",
        "oncologia-cirurgica"
    ]
};


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

inicializar();

function inicializar() {

    preencherUsuario();

    configurarEventos();

    selecionarMesAtual();
}


/* =========================================================
   USUÁRIO NA TELA
========================================================= */

function preencherUsuario() {

    const nome =
        String(
            usuarioLogado.nome || "Usuário"
        ).trim();

    const perfil =
        String(
            usuarioLogado.perfil || ""
        )
        .trim()
        .toUpperCase();

    const setor =
        String(
            usuarioLogado.setor || "—"
        ).trim();


    if (userName) {
        userName.textContent = nome;
    }


    if (userRole) {

        userRole.textContent =
            perfil === "GESTAO"
                ? "Gestão"
                : "Coordenador";
    }


    if (sectorName) {

        sectorName.textContent =
            formatarNomeSetor(setor);
    }


    if (userAvatar) {

        userAvatar.textContent =
            gerarIniciais(nome);
    }
}


/* =========================================================
   EVENTOS
========================================================= */

function configurarEventos() {

    if (mesAnoCenso) {

        mesAnoCenso.addEventListener(
            "change",
            carregarPeriodoSelecionado
        );
    }


    if (saveCenso) {

        saveCenso.addEventListener(
            "click",
            salvarCenso
        );
    }


    if (saveCensoBottom) {

        saveCensoBottom.addEventListener(
            "click",
            salvarCenso
        );
    }


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            sair
        );
    }
}


/* =========================================================
   MÊS ATUAL
========================================================= */

function selecionarMesAtual() {

    if (!mesAnoCenso) {

        console.error(
            "Campo #mesAnoCenso não encontrado."
        );

        return;
    }


    const hoje = new Date();

    const ano = hoje.getFullYear();

    const mes =
        String(
            hoje.getMonth() + 1
        ).padStart(2, "0");


    mesAnoCenso.value =
        `${ano}-${mes}`;


    carregarPeriodoSelecionado();
}


/* =========================================================
   CARREGAR PERÍODO
========================================================= */

function carregarPeriodoSelecionado() {

    if (
        !mesAnoCenso ||
        !mesAnoCenso.value
    ) {
        return;
    }


    const [ano, mes] =
        mesAnoCenso.value.split("-");


    anoSelecionado =
        Number(ano);

    mesSelecionado =
        Number(mes);


    quantidadeDias =
        new Date(
            anoSelecionado,
            mesSelecionado,
            0
        ).getDate();


    periodoAberto =
        verificarPeriodoAberto(
            mesSelecionado,
            anoSelecionado
        );


    carregarDadosLocais();

    prepararCabecalhoDias();

    ajustarColspans();

    gerarCelulasDaPlanilha();

    aplicarEstadoPeriodo();

    recalcularTudo();
}


/* =========================================================
   CABEÇALHO DOS DIAS
========================================================= */

function prepararCabecalhoDias() {

    const cabecalhos =
        document.querySelectorAll(
            "thead th[data-day]"
        );


    const hoje =
        new Date();


    cabecalhos.forEach(th => {

        const dia =
            Number(
                th.dataset.day
            );


        const existeNoMes =
            dia <= quantidadeDias;


        th.style.display =
            existeNoMes
                ? ""
                : "none";


        th.classList.remove(
            "today-column"
        );


        if (
            existeNoMes &&
            hoje.getFullYear() === anoSelecionado &&
            hoje.getMonth() + 1 === mesSelecionado &&
            hoje.getDate() === dia
        ) {

            th.classList.add(
                "today-column"
            );
        }
    });
}


/* =========================================================
   AJUSTAR COLSPAN
========================================================= */

function ajustarColspans() {

    const colspan =
        quantidadeDias + 1;


    document
        .querySelectorAll(
            ".group-cell, .specialty-cell"
        )
        .forEach(td => {

            td.colSpan =
                colspan;
        });
}


/* =========================================================
   GERAR CÉLULAS DA PLANILHA
========================================================= */

function gerarCelulasDaPlanilha() {

    const linhasIndicadores =
        document.querySelectorAll(
            "tbody tr[data-specialty][data-field]"
        );


    linhasIndicadores.forEach(linha => {

        limparCelulasGeradas(
            linha
        );


        const especialidade =
            linha.dataset.specialty;


        const campo =
            linha.dataset.field;


        if (
            campo === "pacientesDia"
        ) {

            linha.classList.add(
                "patients-row"
            );
        }


        for (
            let dia = 1;
            dia <= quantidadeDias;
            dia++
        ) {

            const td =
                document.createElement(
                    "td"
                );


            td.dataset.specialty =
                especialidade;

            td.dataset.field =
                campo;

            td.dataset.day =
                String(dia);


            aplicarDestaqueDiaAtual(
                td,
                dia
            );


            /*
             * ENCONTRO:
             *
             * DIA 1 = MANUAL
             *
             * DIA 2 EM DIANTE = AUTOMÁTICO
             *
             * encontro atual =
             * deixo anterior + admissão atual
             */

            if (
                campo === "encontro" &&
                dia === 1
            ) {

                criarInputCelula(
                    td,
                    especialidade,
                    campo,
                    dia
                );
            }

            else if (
                camposAutomaticos.has(
                    campo
                )
            ) {

                criarCelulaAutomatica(
                    td
                );
            }

            else {

                criarInputCelula(
                    td,
                    especialidade,
                    campo,
                    dia
                );
            }


            linha.appendChild(
                td
            );
        }
    });


    gerarCelulasTotais();
}


/* =========================================================
   LIMPAR CÉLULAS ANTIGAS
========================================================= */

function limparCelulasGeradas(
    linha
) {

    while (
        linha.children.length > 1
    ) {

        linha.removeChild(
            linha.lastElementChild
        );
    }
}


/* =========================================================
   CRIAR INPUT EDITÁVEL
========================================================= */

function criarInputCelula(
    td,
    especialidade,
    campo,
    dia
) {

    const input =
        document.createElement(
            "input"
        );


    input.type =
        "number";

    input.min =
        "0";

    input.step =
        "1";

    input.inputMode =
        "numeric";


    input.className =
        "censo-cell-input";


    input.dataset.specialty =
        especialidade;

    input.dataset.field =
        campo;

    input.dataset.day =
        String(dia);


    input.value =
        String(
            obterValorSalvo(
                especialidade,
                campo,
                dia
            )
        );


    input.disabled =
        !periodoAberto;


    input.addEventListener(
        "input",
        () => {

            normalizarInput(
                input
            );


            salvarValorMemoria(
                especialidade,
                campo,
                dia,
                obterNumeroInput(
                    input
                )
            );


            /*
             * Quando qualquer campo do dia
             * for alterado, recalculamos
             * toda a especialidade.
             *
             * Isso é necessário porque:
             *
             * uma alteração no dia 2
             * pode alterar o DEIXO do dia 2,
             * que altera o ENCONTRO do dia 3,
             * que altera o DEIXO do dia 3...
             */

            recalcularEspecialidade(
                especialidade
            );


            recalcularTotais();
        }
    );


    td.appendChild(
        input
    );
}


/* =========================================================
   CRIAR CÉLULA AUTOMÁTICA
========================================================= */

function criarCelulaAutomatica(
    td
) {

    td.classList.add(
        "auto-cell"
    );


    td.textContent =
        "0";
}


/* =========================================================
   GERAR CÉLULAS DOS TOTAIS
========================================================= */

function gerarCelulasTotais() {

    const linhas =
        document.querySelectorAll(
            "tbody tr[data-total-group][data-total-field]"
        );


    linhas.forEach(linha => {

        limparCelulasGeradas(
            linha
        );


        const grupo =
            linha.dataset.totalGroup;


        const campo =
            linha.dataset.totalField;


        for (
            let dia = 1;
            dia <= quantidadeDias;
            dia++
        ) {

            const td =
                document.createElement(
                    "td"
                );


            td.classList.add(
                "auto-cell"
            );


            td.dataset.totalGroup =
                grupo;


            td.dataset.totalField =
                campo;


            td.dataset.day =
                String(dia);


            td.textContent =
                "0";


            aplicarDestaqueDiaAtual(
                td,
                dia
            );


            linha.appendChild(
                td
            );
        }
    });
}


/* =========================================================
   RECALCULAR TUDO
========================================================= */

function recalcularTudo() {

    const especialidades =
        obterEspecialidadesDaTela();


    especialidades.forEach(
        especialidade => {

            recalcularEspecialidade(
                especialidade
            );
        }
    );


    recalcularTotais();
}


/* =========================================================
   ESPECIALIDADES EXISTENTES NA TELA
========================================================= */

function obterEspecialidadesDaTela() {

    const conjunto =
        new Set();


    document
        .querySelectorAll(
            "tbody tr[data-specialty]"
        )
        .forEach(linha => {

            if (
                linha.dataset.specialty
            ) {

                conjunto.add(
                    linha.dataset.specialty
                );
            }
        });


    return [
        ...conjunto
    ];
}


/* =========================================================
   INÍCIO DOS CÁLCULOS
========================================================= */

function recalcularEspecialidade(
    especialidade
) {

    /*
     * Essa variável carrega o DEIXO
     * calculado do dia anterior.
     *
     * Exemplo:
     *
     * Dia 1 -> deixo = 20
     *
     * Dia 2:
     * encontro = 20 + admissões do dia 2
     */

    let deixoAnterior =
        0;


    for (
        let dia = 1;
        dia <= quantidadeDias;
        dia++
    ) {

        const altas =
            obterValor(
                especialidade,
                "altas",
                dia
            );


        const evasao =
            obterValor(
                especialidade,
                "evasao",
                dia
            );


        const obitosMenor24 =
            obterValor(
                especialidade,
                "obitosMenor24",
                dia
            );


        const obitosMaior24 =
            obterValor(
                especialidade,
                "obitosMaior24",
                dia
            );


        const transfExternas =
            obterValor(
                especialidade,
                "transfExternas",
                dia
            );


        const transfInternas =
            obterValor(
                especialidade,
                "transfInternas",
                dia
            );


        const admissao =
            obterValor(
                especialidade,
                "admissao",
                dia
            );
                    /* =================================================
           Nº DE SAÍDAS / DIA

           Saídas:
           - Altas
           - Evasão
           - Óbitos < 24h
           - Óbitos > 24h
           - Transferências externas

           Transferência interna fica registrada,
           mas não entra como saída hospitalar.
        ================================================= */

        const numeroSaidas =
            altas +
            evasao +
            obitosMenor24 +
            obitosMaior24 +
            transfExternas;


        /* =================================================
           ÓBITOS TOTAL
        ================================================= */

        const obitosTotal =
            obitosMenor24 +
            obitosMaior24;


        /* =================================================
           ENCONTRO

           DIA 1:
           preenchido manualmente.

           DIA 2 EM DIANTE:
           DEIXO do dia anterior
           +
           ADMISSÃO do dia atual.

           Exemplo:

           Dia 1
           Encontro = 30
           Saídas = 4
           Deixo = 26

           Dia 2
           Admissão = 3
           Encontro = 26 + 3 = 29
        ================================================= */

        let encontro;


        if (
            dia === 1
        ) {

            encontro =
                obterValor(
                    especialidade,
                    "encontro",
                    dia
                );

        }

        else {

            encontro =
                deixoAnterior +
                admissao;

        }


        /* =================================================
           DEIXO

           DEIXO =
           ENCONTRO - Nº DE SAÍDAS
        ================================================= */

        const deixo =
            Math.max(
                0,
                encontro -
                numeroSaidas
            );


        /* =================================================
           PACIENTES / DIA

           Acompanha o saldo final daquele dia.
        ================================================= */

        const pacientesDia =
            deixo;


        /* =================================================
           MOSTRAR ENCONTRO AUTOMÁTICO

           O encontro do DIA 1 não é alterado
           porque ele é manual.

           Do DIA 2 em diante mostramos
           o valor calculado.
        ================================================= */

        if (
            dia > 1
        ) {

            definirValorAutomatico(
                especialidade,
                "encontro",
                dia,
                encontro
            );

        }


        /* =================================================
           MOSTRAR Nº DE SAÍDAS
        ================================================= */

        definirValorAutomatico(
            especialidade,
            "numeroSaidas",
            dia,
            numeroSaidas
        );


        /* =================================================
           MOSTRAR ÓBITOS TOTAL
        ================================================= */

        definirValorAutomatico(
            especialidade,
            "obitosTotal",
            dia,
            obitosTotal
        );


        /* =================================================
           MOSTRAR DEIXO
        ================================================= */

        definirValorAutomatico(
            especialidade,
            "deixo",
            dia,
            deixo
        );


        /* =================================================
           MOSTRAR PACIENTES / DIA
        ================================================= */

        definirValorAutomatico(
            especialidade,
            "pacientesDia",
            dia,
            pacientesDia
        );


        /* =================================================
           GUARDAR CÁLCULOS NA MEMÓRIA
        ================================================= */

        salvarValorMemoria(
            especialidade,
            "encontroCalculado",
            dia,
            encontro
        );


        salvarValorMemoria(
            especialidade,
            "numeroSaidas",
            dia,
            numeroSaidas
        );


        salvarValorMemoria(
            especialidade,
            "obitosTotal",
            dia,
            obitosTotal
        );


        salvarValorMemoria(
            especialidade,
            "deixo",
            dia,
            deixo
        );


        salvarValorMemoria(
            especialidade,
            "pacientesDia",
            dia,
            pacientesDia
        );


        /*
         * MUITO IMPORTANTE:
         *
         * O DEIXO calculado neste dia
         * vira a base do ENCONTRO
         * do próximo dia.
         */

        deixoAnterior =
            deixo;

    }

}


/* =========================================================
   DEFINIR VALOR AUTOMÁTICO NA TABELA
========================================================= */

function definirValorAutomatico(
    especialidade,
    campo,
    dia,
    valor
) {

    const td =
        document.querySelector(
            `td[data-specialty="${especialidade}"][data-field="${campo}"][data-day="${dia}"]`
        );


    if (!td) {

        return;

    }


    /*
     * ENCONTRO DO DIA 1
     * possui INPUT manual.
     *
     * Portanto não substituímos
     * o conteúdo da célula.
     */

    if (
        campo === "encontro" &&
        dia === 1
    ) {

        return;

    }


    td.textContent =
        String(
            numero(
                valor
            )
        );

}


/* =========================================================
   OBTER VALOR DE UM CAMPO
========================================================= */

function obterValor(
    especialidade,
    campo,
    dia
) {

    /*
     * Primeiro procura um INPUT.
     *
     * Isso garante que estamos usando
     * imediatamente o que o usuário digitou.
     */

    const input =
        document.querySelector(
            `input[data-specialty="${especialidade}"][data-field="${campo}"][data-day="${dia}"]`
        );


    if (input) {

        return obterNumeroInput(
            input
        );

    }


    /*
     * Se não existir INPUT,
     * procura na memória.
     */

    return numero(
        dadosMes
            ?.[especialidade]
            ?.[dia]
            ?.[campo]
    );

}


/* =========================================================
   RECALCULAR TOTAIS DOS BLOCOS
========================================================= */

function recalcularTotais() {

    Object
        .entries(
            gruposEspecialidades
        )
        .forEach(
            ([
                grupo,
                especialidades
            ]) => {

                for (
                    let dia = 1;
                    dia <= quantidadeDias;
                    dia++
                ) {

                    let totalDiarias =
                        0;


                    let totalObitos =
                        0;


                    especialidades.forEach(
                        especialidade => {

                            /*
                             * TOTAL DE DIÁRIAS
                             *
                             * Soma Pacientes/Dia
                             * das especialidades
                             * daquele bloco.
                             */

                            totalDiarias +=
                                numero(
                                    dadosMes
                                        ?.[especialidade]
                                        ?.[dia]
                                        ?.pacientesDia
                                );


                            /*
                             * ÓBITOS TOTAL
                             *
                             * Soma os óbitos totais
                             * das especialidades.
                             */

                            totalObitos +=
                                numero(
                                    dadosMes
                                        ?.[especialidade]
                                        ?.[dia]
                                        ?.obitosTotal
                                );

                        }
                    );


                    definirTotalGrupo(
                        grupo,
                        "diarias",
                        dia,
                        totalDiarias
                    );


                    definirTotalGrupo(
                        grupo,
                        "obitos",
                        dia,
                        totalObitos
                    );

                }

            }
        );

}


/* =========================================================
   DEFINIR TOTAL NA PLANILHA
========================================================= */

function definirTotalGrupo(
    grupo,
    campo,
    dia,
    valor
) {

    const td =
        document.querySelector(
            `td[data-total-group="${grupo}"][data-total-field="${campo}"][data-day="${dia}"]`
        );


    if (td) {

        td.textContent =
            String(
                numero(
                    valor
                )
            );

    }

}


/* =========================================================
   SALVAR VALOR NA MEMÓRIA
========================================================= */

function salvarValorMemoria(
    especialidade,
    campo,
    dia,
    valor
) {

    /*
     * Se ainda não existir a especialidade,
     * criamos.
     */

    if (
        !dadosMes[
            especialidade
        ]
    ) {

        dadosMes[
            especialidade
        ] = {};

    }


    /*
     * Se ainda não existir o dia,
     * criamos.
     */

    if (
        !dadosMes[
            especialidade
        ][dia]
    ) {

        dadosMes[
            especialidade
        ][dia] = {};

    }


    /*
     * Salva o campo.
     */

    dadosMes[
        especialidade
    ][dia][campo] =
        numero(
            valor
        );

}


/* =========================================================
   OBTER VALOR JÁ SALVO
========================================================= */

function obterValorSalvo(
    especialidade,
    campo,
    dia
) {

    return numero(
        dadosMes
            ?.[especialidade]
            ?.[dia]
            ?.[campo]
    );

}


/* =========================================================
   NORMALIZAR INPUT
========================================================= */

function normalizarInput(
    input
) {

    let valor =
        Number(
            input.value
        );


    /*
     * Não aceita:
     *
     * negativo
     * NaN
     * infinito
     */

    if (
        !Number.isFinite(
            valor
        ) ||
        valor < 0
    ) {

        valor =
            0;

    }


    /*
     * Censo trabalha com
     * número inteiro de pacientes.
     */

    valor =
        Math.floor(
            valor
        );


    input.value =
        String(
            valor
        );

}


/* =========================================================
   PEGAR NÚMERO DO INPUT
========================================================= */

function obterNumeroInput(
    input
) {

    return numero(
        input.value
    );

}


/* =========================================================
   SALVAR CENSO
========================================================= */

function salvarCenso() {

    if (
        !anoSelecionado ||
        !mesSelecionado
    ) {

        alert(
            "Selecione o mês de referência."
        );

        return;

    }


    if (
        !periodoAberto
    ) {

        alert(
            "Este período está encerrado para alterações."
        );

        return;

    }


    /*
     * Primeiro atualizamos a memória
     * com tudo que está nos inputs.
     */

    sincronizarInputsComMemoria();


    /*
     * Recalcula antes de salvar.
     */

    recalcularTudo();


    const registro = {

        setor:
            String(
                usuarioLogado.setor ||
                ""
            ),

        usuario:
            String(
                usuarioLogado.nome ||
                ""
            ),

        perfil:
            String(
                usuarioLogado.perfil ||
                ""
            ),

        ano:
            anoSelecionado,

        mes:
            mesSelecionado,

        dados:
            dadosMes,

        atualizadoEm:
            new Date()
                .toISOString()

    };


    /*
     * POR ENQUANTO:
     *
     * salva no navegador.
     *
     * Depois esta parte será substituída
     * pela chamada ao Google Apps Script
     * para gravar no Google Sheets.
     */

    localStorage.setItem(
        obterChaveStorage(),
        JSON.stringify(
            registro
        )
    );


    mostrarFeedbackSalvo();

}


/* =========================================================
   SINCRONIZAR TODOS OS INPUTS
========================================================= */

function sincronizarInputsComMemoria() {

    document
        .querySelectorAll(
            ".censo-cell-input"
        )
        .forEach(
            input => {

                const especialidade =
                    input.dataset.specialty;


                const campo =
                    input.dataset.field;


                const dia =
                    Number(
                        input.dataset.day
                    );


                const valor =
                    obterNumeroInput(
                        input
                    );


                salvarValorMemoria(
                    especialidade,
                    campo,
                    dia,
                    valor
                );

            }
        );

}


/* =========================================================
   CARREGAR DADOS JÁ SALVOS
========================================================= */

function carregarDadosLocais() {

    const salvo =
        localStorage.getItem(
            obterChaveStorage()
        );


    /*
     * Não existe nada salvo
     * para esse setor/mês.
     */

    if (!salvo) {

        dadosMes =
            {};

        return;

    }


    try {

        const registro =
            JSON.parse(
                salvo
            );


        dadosMes =
            registro.dados ||
            {};

    }

    catch (erro) {

        console.error(
            "Erro ao carregar censo salvo:",
            erro
        );


        dadosMes =
            {};

    }

}


/* =========================================================
   CHAVE DO LOCALSTORAGE
========================================================= */

function obterChaveStorage() {

    const setor =
        normalizarChave(
            usuarioLogado.setor
        );


    /*
     * Cada setor e cada mês
     * possui sua própria chave.
     *
     * Exemplo:
     *
     * censo_internamento_2026_08
     */

    return (
        `censo_${setor}_${anoSelecionado}_${String(
            mesSelecionado
        ).padStart(
            2,
            "0"
        )}`
    );

}
/* =========================================================
   VERIFICAR SE O PERÍODO ESTÁ ABERTO
========================================================= */

function verificarPeriodoAberto(
    mes,
    ano
) {

    const agora =
        new Date();


    const limite =
        obterTerceiroDiaUtilMesSeguinte(
            mes,
            ano
        );


    return (
        agora <= limite
    );

}


/* =========================================================
   OBTER TERCEIRO DIA ÚTIL DO MÊS SEGUINTE
========================================================= */

function obterTerceiroDiaUtilMesSeguinte(
    mes,
    ano
) {

    /*
     * IMPORTANTE:
     *
     * mesSelecionado usa:
     *
     * 1 = Janeiro
     * 2 = Fevereiro
     * ...
     * 12 = Dezembro
     *
     * Já o Date() do JavaScript usa:
     *
     * 0 = Janeiro
     * 1 = Fevereiro
     * ...
     *
     * Por isso:
     *
     * new Date(ano, mes, 1)
     *
     * já aponta para o PRIMEIRO DIA
     * DO MÊS SEGUINTE.
     *
     * Exemplo:
     *
     * Agosto = 8
     *
     * new Date(2026, 8, 1)
     *
     * = 01/09/2026
     */

    const data =
        new Date(
            ano,
            mes,
            1
        );


    let diasUteis =
        0;


    while (
        diasUteis < 3
    ) {

        const diaSemana =
            data.getDay();


        /*
         * 0 = domingo
         * 6 = sábado
         */

        const ehDiaUtil =
            diaSemana !== 0 &&
            diaSemana !== 6;


        if (
            ehDiaUtil
        ) {

            diasUteis++;

        }


        if (
            diasUteis < 3
        ) {

            data.setDate(
                data.getDate() + 1
            );

        }

    }


    /*
     * O sistema permanece aberto
     * até 23:59:59 do terceiro dia útil.
     */

    data.setHours(
        23,
        59,
        59,
        999
    );


    return data;

}


/* =========================================================
   APLICAR ESTADO DO PERÍODO NA TELA
========================================================= */

function aplicarEstadoPeriodo() {

    const limite =
        obterTerceiroDiaUtilMesSeguinte(
            mesSelecionado,
            anoSelecionado
        );


    /* =====================================================
       PERÍODO ABERTO
    ===================================================== */

    if (
        periodoAberto
    ) {

        deadlineBox
            ?.classList
            .remove(
                "closed"
            );


        if (
            deadlineIcon
        ) {

            deadlineIcon.className =
                "fa-solid fa-lock-open";

        }


        if (
            deadlineText
        ) {

            deadlineText.textContent =
                `Aberto até ${formatarData(limite)}`;

        }


        definirBotoesSalvar(
            false
        );

    }


    /* =====================================================
       PERÍODO ENCERRADO
    ===================================================== */

    else {

        deadlineBox
            ?.classList
            .add(
                "closed"
            );


        if (
            deadlineIcon
        ) {

            deadlineIcon.className =
                "fa-solid fa-lock";

        }


        if (
            deadlineText
        ) {

            deadlineText.textContent =
                `Encerrado em ${formatarData(limite)}`;

        }


        definirBotoesSalvar(
            true
        );

    }


    /* =====================================================
       BLOQUEAR / LIBERAR INPUTS
    ===================================================== */

    document
        .querySelectorAll(
            ".censo-cell-input"
        )
        .forEach(
            input => {

                input.disabled =
                    !periodoAberto;

            }
        );

}


/* =========================================================
   HABILITAR / DESABILITAR BOTÕES SALVAR
========================================================= */

function definirBotoesSalvar(
    desabilitado
) {

    const botoes = [

        saveCenso,

        saveCensoBottom

    ];


    botoes
        .filter(Boolean)
        .forEach(
            botao => {

                botao.disabled =
                    desabilitado;

            }
        );

}


/* =========================================================
   FEEDBACK VISUAL AO SALVAR
========================================================= */

function mostrarFeedbackSalvo() {

    const botoes = [

        saveCenso,

        saveCensoBottom

    ]
    .filter(Boolean);


    /*
     * Mostra confirmação.
     */

    botoes.forEach(
        botao => {

            botao.innerHTML = `
                <i class="fa-solid fa-check"></i>
                <span>Alterações salvas</span>
            `;

        }
    );


    /*
     * Depois volta para o texto normal.
     */

    setTimeout(
        () => {

            botoes.forEach(
                botao => {

                    botao.innerHTML = `
                        <i class="fa-regular fa-floppy-disk"></i>
                        <span>Salvar alterações</span>
                    `;

                }
            );

        },
        1600
    );

}


/* =========================================================
   DESTACAR DIA ATUAL
========================================================= */

function aplicarDestaqueDiaAtual(
    elemento,
    dia
) {

    const hoje =
        new Date();


    const ehHoje =

        hoje.getFullYear() ===
            anoSelecionado

        &&

        hoje.getMonth() + 1 ===
            mesSelecionado

        &&

        hoje.getDate() ===
            dia;


    if (
        ehHoje
    ) {

        elemento.classList.add(
            "today-cell"
        );

    }

}


/* =========================================================
   LOGOUT
========================================================= */

function sair() {

    /*
     * Remove o usuário da sessão.
     */

    sessionStorage.removeItem(
        "usuarioLogado"
    );


    /*
     * Retorna para o login.
     */

    window.location.href =
        "./index.html";

}


/* =========================================================
   CONVERTER PARA NÚMERO
========================================================= */

function numero(
    valor
) {

    const convertido =
        Number(
            valor
        );


    /*
     * Evita:
     *
     * NaN
     * undefined
     * null inválido
     * infinito
     */

    if (
        !Number.isFinite(
            convertido
        )
    ) {

        return 0;

    }


    /*
     * Não permite número negativo.
     *
     * Também força número inteiro,
     * pois estamos trabalhando
     * com quantidade de pacientes.
     */

    return Math.max(
        0,
        Math.floor(
            convertido
        )
    );

}


/* =========================================================
   FORMATAR DATA
========================================================= */

function formatarData(
    data
) {

    return new Intl.DateTimeFormat(
        "pt-BR"
    )
    .format(
        data
    );

}


/* =========================================================
   GERAR INICIAIS DO USUÁRIO
========================================================= */

function gerarIniciais(
    nome
) {

    const partes =
        String(
            nome ||
            ""
        )
        .trim()
        .split(
            /\s+/
        )
        .filter(
            Boolean
        );


    /*
     * Nenhum nome.
     */

    if (
        partes.length === 0
    ) {

        return "US";

    }


    /*
     * Apenas um nome.
     *
     * Exemplo:
     *
     * Sara
     *
     * SA
     */

    if (
        partes.length === 1
    ) {

        return partes[0]
            .substring(
                0,
                2
            )
            .toUpperCase();

    }


    /*
     * Mais de um nome.
     *
     * Exemplo:
     *
     * Sara Silva
     *
     * SS
     */

    return (

        partes[0]
            .charAt(0)

        +

        partes[
            partes.length - 1
        ]
        .charAt(0)

    )
    .toUpperCase();

}


/* =========================================================
   FORMATAR NOME DO SETOR
========================================================= */

function formatarNomeSetor(
    texto
) {

    return String(
        texto ||
        ""
    )

    .trim()

    .toLowerCase()

    .split(
        /\s+/
    )

    .map(
        palavra => {

            if (
                !palavra
            ) {

                return "";

            }


            return (

                palavra
                    .charAt(0)
                    .toUpperCase()

                +

                palavra
                    .slice(1)

            );

        }
    )

    .join(
        " "
    );

}


/* =========================================================
   NORMALIZAR TEXTO PARA CHAVE
========================================================= */

function normalizarChave(
    texto
) {

    return String(
        texto ||
        ""
    )

    .trim()

    .toLowerCase()

    /*
     * Remove acentos.
     */

    .normalize(
        "NFD"
    )

    .replace(
        /[\u0300-\u036f]/g,
        ""
    )

    /*
     * Espaços viram underline.
     */

    .replace(
        /\s+/g,
        "_"
    )

    /*
     * Remove caracteres especiais.
     */

    .replace(
        /[^a-z0-9_-]/g,
        ""
    );

}


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "========================================="
);

console.log(
    "MEU CENSO CARREGADO"
);

console.log(
    "========================================="
);


console.log(
    "Usuário logado:",
    usuarioLogado
);


console.log(
    "Setor:",
    usuarioLogado.setor
);


console.log(
    "Perfil:",
    usuarioLogado.perfil
);


console.log(
    "========================================="
);


/* =========================================================
   FIM - MEU CENSO
========================================================= */