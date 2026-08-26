/* =========================================
   ELEMENTOS
========================================= */

const setorSelect =
    document.getElementById(
        "setorRelatorio"
    );

const filtroSetorContainer =
    document.getElementById(
        "filtroSetorContainer"
    );

const mesInput =
    document.getElementById(
        "mesRelatorio"
    );

const btnCarregar =
    document.getElementById(
        "btnCarregarRelatorio"
    );

const btnGerarPdf =
    document.getElementById(
        "btnGerarPdf"
    );

const emptyReport =
    document.getElementById(
        "emptyReport"
    );

const reportCard =
    document.getElementById(
        "reportCard"
    );

const reportSummary =
    document.getElementById(
        "reportSummary"
    );

const reportTableBody =
    document.getElementById(
        "reportTableBody"
    );

const summarySector =
    document.getElementById(
        "summarySector"
    );

const summaryPeriod =
    document.getElementById(
        "summaryPeriod"
    );

const summaryDiarias =
    document.getElementById(
        "summaryDiarias"
    );

const summaryObitos =
    document.getElementById(
        "summaryObitos"
    );

const footerDiarias =
    document.getElementById(
        "footerDiarias"
    );

const footerObitos =
    document.getElementById(
        "footerObitos"
    );

const footerAdmissoes =
    document.getElementById(
        "footerAdmissoes"
    );

const reportTitle =
    document.getElementById(
        "reportTitle"
    );


/* =========================================
   MESES
========================================= */

const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro"
];


/* =========================================
   USUÁRIO
========================================= */

const usuario =
    JSON.parse(
        localStorage.getItem(
            "usuarioLogado"
        )
    ) || {

        nome:
            "Maria Silva",

        perfil:
            "COORDENADOR",

        setor:
            "Internamento"

    };


const ehGestao =
    String(
        usuario.perfil
    )
    .toUpperCase()
    .includes(
        "GEST"
    );


/* =========================================
   DADOS DO RELATÓRIO ATUAL
========================================= */

let dadosRelatorioAtual = [];

let contextoRelatorioAtual = null;


/* =========================================
   INICIALIZAÇÃO
========================================= */

inicializarRelatorio();


function inicializarRelatorio() {

    configurarUsuario();

    preencherSetores();

}


/* =========================================
   CONFIGURAR PERFIL
========================================= */

function configurarUsuario() {

    const userName =
        document.getElementById(
            "userName"
        );

    const userRole =
        document.getElementById(
            "userRole"
        );

    const userAvatar =
        document.getElementById(
            "userAvatar"
        );


    if (userName) {

        userName.textContent =
            usuario.nome || "Usuário";

    }


    if (userRole) {

        userRole.textContent =
            ehGestao
                ? "Gestão"
                : "Coordenador";

    }


    if (userAvatar) {

        userAvatar.textContent =
            gerarIniciais(
                usuario.nome
            );

    }


    /*
       COORDENADOR

       Não escolhe setor.
    */

    if (!ehGestao) {

        if (
            filtroSetorContainer
        ) {

            filtroSetorContainer
                .classList
                .add(
                    "hidden"
                );

        }

    }

}


/* =========================================
   PREENCHER SETORES
========================================= */

function preencherSetores() {

    if (
        !ehGestao ||
        !setorSelect
    ) {

        return;

    }


    const censos =
        carregarBancoLocal();


    const setores =
        new Set();


    Object
        .values(censos)
        .forEach(censo => {

            if (
                censo.setor
            ) {

                setores.add(
                    censo.setor
                );

            }

        });


    setorSelect.innerHTML = `
        <option value="">
            Consolidado Geral
        </option>
    `;


    [...setores]
        .sort()
        .forEach(setor => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                setor;

            option.textContent =
                setor;


            setorSelect.appendChild(
                option
            );

        });

}


/* =========================================
   CARREGAR BANCO
========================================= */

function carregarBancoLocal() {

    return (
        JSON.parse(
            localStorage.getItem(
                "censosHospitalares"
            )
        ) || {}
    );

}


/* =========================================
   CONSULTAR
========================================= */

btnCarregar.addEventListener(
    "click",
    carregarRelatorio
);


function carregarRelatorio() {

    const periodo =
        mesInput.value;


    if (!periodo) {

        alert(
            "Selecione o mês do relatório."
        );

        return;

    }


    const [
        anoString,
        mesString
    ] = periodo.split("-");


    const ano =
        Number(
            anoString
        );

    const mes =
        Number(
            mesString
        );


    /*
       COORDENADOR:
       sempre o próprio setor.

       GESTÃO:
       vazio = consolidado.
       preenchido = setor escolhido.
    */

    const setor =
        ehGestao
            ? setorSelect.value
            : usuario.setor;


    dadosRelatorioAtual =
        montarRelatorio(
            ano,
            mes,
            setor
        );


    contextoRelatorioAtual = {

        ano,
        mes,
        setor,

        consolidado:
            ehGestao &&
            !setor

    };


    atualizarTela();

}


/* =========================================
   MONTAR RELATÓRIO
========================================= */

function montarRelatorio(
    ano,
    mes,
    setor
) {

    const censos =
        carregarBancoLocal();


    const linhas = [];


    Object
        .values(censos)
        .filter(censo => {

            /*
               Ignora rascunhos.
            */

            if (
                censo.rascunho === true
            ) {

                return false;

            }


            if (
                !censo.data
            ) {

                return false;

            }


            const [
                anoCenso,
                mesCenso
            ] =
                censo.data
                    .split("-");


            const mesmoPeriodo =
                Number(
                    anoCenso
                ) === ano &&
                Number(
                    mesCenso
                ) === mes;


            if (
                !mesmoPeriodo
            ) {

                return false;

            }


            /*
               Se Gestão deixou setor vazio,
               retorna todos.

               Se houver setor,
               filtra.
            */

            if (
                setor &&
                normalizarTexto(
                    censo.setor
                ) !==
                normalizarTexto(
                    setor
                )
            ) {

                return false;

            }


            return true;

        })
        .forEach(censo => {

            const dia =
                Number(
                    censo.data
                        .split("-")[2]
                );


            Object
                .entries(
                    censo.especialidades || {}
                )
                .forEach(
                    ([
                        especialidade,
                        dados
                    ]) => {

                        linhas.push({

                            setor:
                                censo.setor || "—",

                            dia,

                            especialidade:
                                formatarEspecialidade(
                                    especialidade
                                ),

                            encontro:
                                numero(
                                    dados.encontro
                                ),

                            altas:
                                numero(
                                    dados.altas
                                ),

                            evasao:
                                numero(
                                    dados.evasao
                                ),

                            obitosMenor24:
                                numero(
                                    dados.obitosMenor24
                                ),

                            obitosMaior24:
                                numero(
                                    dados.obitosMaior24
                                ),

                            transfExternas:
                                numero(
                                    dados.transfExternas
                                ),

                            transfInternas:
                                numero(
                                    dados.transfInternas
                                ),

                            admissao:
                                numero(
                                    dados.admissao
                                ),

                            deixo:
                                numero(
                                    dados.deixo
                                ),

                            leitoIsolamento:
                                numero(
                                    dados.leitoIsolamento
                                ),

                            leitoManutencao:
                                numero(
                                    dados.leitoManutencao
                                )

                        });

                    }
                );

        });


    linhas.sort(
        (a, b) => {

            const setorCompare =
                a.setor.localeCompare(
                    b.setor,
                    "pt-BR"
                );


            if (
                setorCompare !== 0
            ) {

                return setorCompare;

            }


            if (
                a.dia !== b.dia
            ) {

                return (
                    a.dia -
                    b.dia
                );

            }


            return (
                a.especialidade
                    .localeCompare(
                        b.especialidade,
                        "pt-BR"
                    )
            );

        }
    );


    return linhas;

}


/* =========================================
   ATUALIZAR TELA
========================================= */

function atualizarTela() {

    const {
        ano,
        mes,
        setor,
        consolidado
    } =
        contextoRelatorioAtual;


    const nomePeriodo =
        `${meses[mes - 1]} de ${ano}`;


    const nomeRelatorio =
        consolidado
            ? "Consolidado Geral"
            : setor;


    summarySector.textContent =
        nomeRelatorio;


    summaryPeriod.textContent =
        nomePeriodo;


    reportTitle.textContent =
        consolidado
            ? `Consolidado Geral - ${nomePeriodo}`
            : `${setor} - ${nomePeriodo}`;


    renderizarTabela();


    const totais =
        calcularTotais(
            dadosRelatorioAtual
        );


    summaryDiarias.textContent =
        totais.diarias;


    summaryObitos.textContent =
        totais.obitos;


    footerDiarias.textContent =
        totais.diarias;


    footerObitos.textContent =
        totais.obitos;


    footerAdmissoes.textContent =
        totais.admissoes;


    emptyReport.classList.add(
        "hidden"
    );


    reportSummary.classList.remove(
        "hidden"
    );


    reportCard.classList.remove(
        "hidden"
    );

}


/* =========================================
   RENDERIZAR TABELA
========================================= */

function renderizarTabela() {

    reportTableBody.innerHTML =
        "";


    if (
        dadosRelatorioAtual.length === 0
    ) {

        reportTableBody.innerHTML = `
            <tr>
                <td colspan="13">
                    Nenhum censo preenchido neste período.
                </td>
            </tr>
        `;

        return;

    }


    dadosRelatorioAtual
        .forEach(item => {

            const tr =
                document.createElement(
                    "tr"
                );


            tr.innerHTML = `
                <td>${item.dia}</td>

                <td>
                    ${
                        contextoRelatorioAtual
                            .consolidado
                            ? `${item.setor} - ${item.especialidade}`
                            : item.especialidade
                    }
                </td>

                <td>${item.encontro}</td>
                <td>${item.altas}</td>
                <td>${item.evasao}</td>

                <td>
                    ${item.obitosMenor24}
                </td>

                <td>
                    ${item.obitosMaior24}
                </td>

                <td>
                    ${item.transfExternas}
                </td>

                <td>
                    ${item.transfInternas}
                </td>

                <td>
                    ${item.admissao}
                </td>

                <td>
                    ${item.deixo}
                </td>

                <td>
                    ${item.leitoIsolamento}
                </td>

                <td>
                    ${item.leitoManutencao}
                </td>
            `;


            reportTableBody
                .appendChild(
                    tr
                );

        });

}


/* =========================================
   TOTAIS
========================================= */

function calcularTotais(
    dados
) {

    return dados.reduce(
        (total, item) => {

            /*
               Aqui estamos usando Deixo
               como total de diárias do dia,
               conforme a estrutura atual
               que você definiu.
            */

            total.diarias +=
                item.deixo;


            total.obitos +=
                item.obitosMenor24 +
                item.obitosMaior24;


            total.admissoes +=
                item.admissao;


            return total;

        },
        {
            diarias: 0,
            obitos: 0,
            admissoes: 0
        }
    );

}


/* =========================================
   GERAR PDF
========================================= */

btnGerarPdf.addEventListener(
    "click",
    gerarPdf
);


function gerarPdf() {

    if (
        !contextoRelatorioAtual
    ) {

        alert(
            "Consulte um relatório antes de gerar o PDF."
        );

        return;

    }


    if (
        dadosRelatorioAtual.length === 0
    ) {

        alert(
            "Não há dados para gerar o PDF."
        );

        return;

    }


    const {
        jsPDF
    } =
        window.jspdf;


    /*
       A4 PAISAGEM

       Isso é importante porque a tabela
       possui muitas colunas.
    */

    const pdf =
        new jsPDF({

            orientation:
                "landscape",

            unit:
                "mm",

            format:
                "a4"

        });


    const {
        ano,
        mes,
        setor,
        consolidado
    } =
        contextoRelatorioAtual;


    const periodo =
        `${meses[mes - 1]} / ${ano}`;


    const titulo =
        consolidado
            ? "CENSO HOSPITALAR - CONSOLIDADO GERAL"
            : `CENSO HOSPITALAR - ${String(setor).toUpperCase()}`;


    /* =====================================
       CABEÇALHO PDF
    ===================================== */

    pdf.setFont(
        "helvetica",
        "bold"
    );

    pdf.setFontSize(
        13
    );


    pdf.text(
        titulo,
        14,
        14
    );


    pdf.setFont(
        "helvetica",
        "normal"
    );

    pdf.setFontSize(
        9
    );


    pdf.text(
        `Período: ${periodo}`,
        14,
        20
    );


    pdf.text(
        `Emitido em: ${new Date().toLocaleString("pt-BR")}`,
        14,
        25
    );


    const totais =
        calcularTotais(
            dadosRelatorioAtual
        );


    pdf.text(
        `Total de Diárias: ${totais.diarias}`,
        170,
        20
    );


    pdf.text(
        `Óbitos Total: ${totais.obitos}`,
        220,
        20
    );


    /* =====================================
       COLUNAS
    ===================================== */

    const cabecalho =
        consolidado
            ? [
                "Setor",
                "Dia",
                "Especialidade",
                "Encontro",
                "Altas",
                "Evasão",
                "Ób.<24",
                "Ób.>24",
                "T.Ext.",
                "T.Int.",
                "Adm.",
                "Deixo",
                "Iso.",
                "Manut."
            ]
            : [
                "Dia",
                "Especialidade",
                "Encontro",
                "Altas",
                "Evasão",
                "Ób.<24",
                "Ób.>24",
                "T.Ext.",
                "T.Int.",
                "Adm.",
                "Deixo",
                "Iso.",
                "Manut."
            ];


    const linhas =
        dadosRelatorioAtual
            .map(item => {

                const base = [

                    item.dia,

                    item.especialidade,

                    item.encontro,

                    item.altas,

                    item.evasao,

                    item.obitosMenor24,

                    item.obitosMaior24,

                    item.transfExternas,

                    item.transfInternas,

                    item.admissao,

                    item.deixo,

                    item.leitoIsolamento,

                    item.leitoManutencao

                ];


                if (
                    consolidado
                ) {

                    base.unshift(
                        item.setor
                    );

                }


                return base;

            });


    /* =====================================
       TABELA PDF
    ===================================== */

    pdf.autoTable({

        startY:
            31,

        head:
            [
                cabecalho
            ],

        body:
            linhas,

        theme:
            "grid",

        margin: {
            left: 8,
            right: 8
        },

        styles: {

            font:
                "helvetica",

            fontSize:
                consolidado
                    ? 5.8
                    : 6.3,

            cellPadding:
                1.4,

            halign:
                "center",

            valign:
                "middle",

            lineWidth:
                .15,

            lineColor:
                [
                    190,
                    198,
                    187
                ]

        },

        headStyles: {

            fillColor:
                [
                    66,
                    109,
                    47
                ],

            textColor:
                [
                    255,
                    255,
                    255
                ],

            fontStyle:
                "bold"

        },

        alternateRowStyles: {

            fillColor:
                [
                    247,
                    249,
                    246
                ]

        },

        columnStyles: {

            0: {
                cellWidth:
                    consolidado
                        ? 24
                        : 9
            }

        },

        didDrawPage: function () {

            const quantidadePaginas =
                pdf.internal
                    .getNumberOfPages();


            pdf.setFontSize(
                7
            );


            pdf.text(
                `Página ${quantidadePaginas}`,
                278,
                202,
                {
                    align:
                        "right"
                }
            );

        }

    });


    /* =====================================
       RODAPÉ FINAL
    ===================================== */

    const yFinal =
        pdf.lastAutoTable.finalY +
        7;


    if (
        yFinal < 195
    ) {

        pdf.setFont(
            "helvetica",
            "bold"
        );


        pdf.setFontSize(
            8
        );


        pdf.text(
            `Total de Diárias Geral: ${totais.diarias}`,
            14,
            yFinal
        );


        pdf.text(
            `Óbitos Total: ${totais.obitos}`,
            80,
            yFinal
        );


        pdf.text(
            `Admissões: ${totais.admissoes}`,
            125,
            yFinal
        );

    }


    /* =====================================
       NOME DO ARQUIVO
    ===================================== */

    const nomeArquivo =
        consolidado

            ? `censo_consolidado_${ano}_${String(
                mes
            ).padStart(
                2,
                "0"
            )}.pdf`

            : `censo_${normalizarNomeArquivo(
                setor
            )}_${ano}_${String(
                mes
            ).padStart(
                2,
                "0"
            )}.pdf`;


    pdf.save(
        nomeArquivo
    );

}


/* =========================================
   HELPERS
========================================= */

function numero(
    valor
) {

    return (
        Number(
            valor
        ) || 0
    );

}


function normalizarTexto(
    valor
) {

    return String(
        valor || ""
    )
    .trim()
    .toLowerCase()
    .normalize(
        "NFD"
    )
    .replace(
        /[\u0300-\u036f]/g,
        ""
    );

}


function normalizarNomeArquivo(
    valor
) {

    return normalizarTexto(
        valor
    )
    .replace(
        /\s+/g,
        "_"
    )
    .replace(
        /[^a-z0-9_-]/g,
        ""
    );

}


function gerarIniciais(
    nome
) {

    return String(
        nome || "US"
    )
    .trim()
    .split(/\s+/)
    .slice(
        0,
        2
    )
    .map(parte =>
        parte.charAt(0)
    )
    .join("")
    .toUpperCase();

}


function formatarEspecialidade(
    slug
) {

    const nomes = {

        "saude-mental":
            "Saúde Mental",

        "clinica-medica":
            "Clínica Médica",

        "neurologia-uavc":
            "Neurologia (UAVC)",

        "oncologia-clinica":
            "Oncologia Clínica",

        "cardiologia":
            "Cardiologia",

        "vascular":
            "Vascular",

        "ortotraumatologia":
            "Ortotraumatologia",

        "neurocirurgia":
            "Neurocirurgia",

        "cirurgia-geral":
            "Cirurgia Geral",

        "oncologia-cirurgica":
            "Oncologia Cirúrgica"

    };


    return (
        nomes[slug] ||
        slug
    );

}