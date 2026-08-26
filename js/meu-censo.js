/* =========================================
   ELEMENTOS
========================================= */

const mesAnoInput =
    document.getElementById("mesAnoCenso");

const daysGrid =
    document.getElementById("daysGrid");

const mesReferenciaTitulo =
    document.getElementById("mesReferenciaTitulo");

const periodDeadline =
    document.getElementById("periodDeadline");

const deadlineText =
    document.getElementById("deadlineText");

const chooseDayMessage =
    document.getElementById("chooseDayMessage");

const censoFormArea =
    document.getElementById("censoFormArea");

const activeDateText =
    document.getElementById("activeDateText");

const editStatus =
    document.getElementById("editStatus");

const saveCenso =
    document.getElementById("saveCenso");

const totalClinicaMedica =
    document.getElementById(
        "totalDiariasClinicaMedica"
    );

const totalClinicaCirurgica =
    document.getElementById(
        "totalDiariasClinicaCirurgica"
    );


/* =========================================
   CONFIGURAÇÕES
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


let diaSelecionado = null;
let mesSelecionado = null;
let anoSelecionado = null;


/* =========================================
   BANCO LOCAL TEMPORÁRIO

   Depois substituiremos pela API
   ligada ao Google Sheets.
========================================= */

let censosTemporarios =
    JSON.parse(
        localStorage.getItem("censosHospitalares")
    ) || {};


/* =========================================
   ALTERAÇÃO DO MÊS
========================================= */

mesAnoInput.addEventListener(
    "change",
    () => {

        if (!mesAnoInput.value) {

            limparPeriodo();

            return;
        }


        const [
            anoString,
            mesString
        ] = mesAnoInput.value.split("-");


        anoSelecionado =
            Number(anoString);

        mesSelecionado =
            Number(mesString);

        diaSelecionado =
            null;


        mesReferenciaTitulo.textContent =
            `${meses[mesSelecionado - 1]} de ${anoSelecionado}`;


        atualizarPrazo();

        gerarDias();


        chooseDayMessage.classList.remove(
            "hidden"
        );

        censoFormArea.classList.add(
            "hidden"
        );

    }
);


/* =========================================
   LIMPAR PERÍODO
========================================= */

function limparPeriodo() {

    diaSelecionado = null;
    mesSelecionado = null;
    anoSelecionado = null;


    mesReferenciaTitulo.textContent =
        "Selecione um mês";


    deadlineText.textContent =
        "Selecione um mês para consultar o período.";


    periodDeadline.classList.remove(
        "closed"
    );


    daysGrid.innerHTML = `
        <div class="days-empty">

            <i class="fa-regular fa-calendar"></i>

            <span>
                Selecione um mês para visualizar os dias.
            </span>

        </div>
    `;


    chooseDayMessage.classList.remove(
        "hidden"
    );

    censoFormArea.classList.add(
        "hidden"
    );

}


/* =========================================
   GERAR DIAS
========================================= */

function gerarDias() {

    daysGrid.innerHTML = "";


    const quantidadeDias =
        new Date(
            anoSelecionado,
            mesSelecionado,
            0
        ).getDate();


    for (
        let dia = 1;
        dia <= quantidadeDias;
        dia++
    ) {

        const botao =
            document.createElement(
                "button"
            );


        botao.type =
            "button";

        botao.className =
            "day-button";


        const chave =
            montarChaveDia(
                dia,
                mesSelecionado,
                anoSelecionado
            );


        const preenchido =
            Boolean(
                censosTemporarios[chave]
            );


        botao.classList.add(
            preenchido
                ? "completed"
                : "pending"
        );


        botao.innerHTML = `
            <strong>
                ${dia}
            </strong>

            <span>
                ${
                    preenchido
                        ? "Preenchido"
                        : "Pendente"
                }
            </span>
        `;


        botao.addEventListener(
            "click",
            () => {

                selecionarDia(
                    dia,
                    botao
                );

            }
        );


        daysGrid.appendChild(
            botao
        );

    }

}


/* =========================================
   SELECIONAR DIA
========================================= */

function selecionarDia(
    dia,
    botao
) {

    diaSelecionado =
        dia;


    /* IMPORTANTE:
       controla o Encontro manual do dia 1 */

    atualizarCampoEncontroInicial();


    document
        .querySelectorAll(
            ".day-button"
        )
        .forEach(item => {

            item.classList.remove(
                "selected"
            );

        });


    botao.classList.add(
        "selected"
    );


    chooseDayMessage.classList.add(
        "hidden"
    );

    censoFormArea.classList.remove(
        "hidden"
    );


    activeDateText.textContent =
        `${dia} de ${meses[mesSelecionado - 1]} de ${anoSelecionado}`;


    const podeEditar =
        periodoPodeSerEditado(
            mesSelecionado,
            anoSelecionado
        );


    aplicarModoEdicao(
        podeEditar
    );


    carregarCensoDia();


    document
        .querySelectorAll(
            ".specialty-card"
        )
        .forEach(
            (card, index) => {

                card.open =
                    index === 0;

            }
        );

}


/* =========================================
   CAMPO ENCONTRO DO PRIMEIRO DIA
========================================= */

function atualizarCampoEncontroInicial() {

    const primeiroDia =
        diaSelecionado === 1;


    /*
       DIA 1:
       mostra input Encontro.

       DIA 2+:
       esconde input Encontro.
    */

    document
        .querySelectorAll(
            "[data-encontro-manual]"
        )
        .forEach(campo => {

            campo.classList.toggle(
                "hidden",
                !primeiroDia
            );

        });


    /*
       DIA 1:
       não mostramos "Deixo do dia anterior".

       DIA 2+:
       mostramos normalmente.
    */

    document
        .querySelectorAll(
            "[data-previous-day-note], .previous-day-note"
        )
        .forEach(aviso => {

            aviso.classList.toggle(
                "hidden",
                primeiroDia
            );

        });

}


/* =========================================
   TERCEIRO DIA ÚTIL DO MÊS SEGUINTE
========================================= */

function obterDataLimiteEdicao(
    mes,
    ano
) {

    /*
       Como mesSelecionado é 1-12,
       passar "mes" diretamente para Date()
       já cria o primeiro dia do mês seguinte.

       Exemplo:
       mes = 8 (agosto)
       new Date(2026, 8, 1)
       = 01/09/2026
    */

    let data =
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


        const ehDiaUtil =
            diaSemana !== 0 &&
            diaSemana !== 6;


        if (ehDiaUtil) {

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


    data.setHours(
        23,
        59,
        59,
        999
    );


    return data;

}


/* =========================================
   VERIFICAR SE PODE EDITAR
========================================= */

function periodoPodeSerEditado(
    mes,
    ano
) {

    const agora =
        new Date();


    const limite =
        obterDataLimiteEdicao(
            mes,
            ano
        );


    return agora <= limite;

}


/* =========================================
   ATUALIZAR PRAZO
========================================= */

function atualizarPrazo() {

    const limite =
        obterDataLimiteEdicao(
            mesSelecionado,
            anoSelecionado
        );


    const aberto =
        periodoPodeSerEditado(
            mesSelecionado,
            anoSelecionado
        );


    if (aberto) {

        deadlineText.textContent =
            `Alterações permitidas até ${formatarData(limite)}.`;


        periodDeadline.classList.remove(
            "closed"
        );

    } else {

        deadlineText.textContent =
            `Período encerrado em ${formatarData(limite)}. Disponível apenas para consulta.`;


        periodDeadline.classList.add(
            "closed"
        );

    }

}


/* =========================================
   MODO DE EDIÇÃO
========================================= */

function aplicarModoEdicao(
    podeEditar
) {

    const campos =
        document.querySelectorAll(
            ".specialty-content input"
        );


    campos.forEach(
        input => {

            input.disabled =
                !podeEditar;

        }
    );


    saveCenso.disabled =
        !podeEditar;


    if (podeEditar) {

        editStatus.textContent =
            "Período aberto";

        editStatus.className =
            "edit-status open";


        saveCenso.innerHTML = `
            <i class="fa-regular fa-floppy-disk"></i>
            Salvar Censo
        `;

    } else {

        editStatus.textContent =
            "Somente consulta";

        editStatus.className =
            "edit-status closed";


        saveCenso.innerHTML = `
            <i class="fa-solid fa-lock"></i>
            Período Encerrado
        `;

    }

}


/* =========================================
   EVENTOS DOS CAMPOS
========================================= */

document
    .querySelectorAll(
        ".specialty-card"
    )
    .forEach(
        card => {

            card
                .querySelectorAll(
                    'input[type="number"]'
                )
                .forEach(
                    input => {

                        input.addEventListener(
                            "input",
                            () => {

                                normalizarCampo(
                                    input
                                );


                                calcularEspecialidade(
                                    card
                                );


                                marcarEspecialidade(
                                    card
                                );


                                calcularTotaisGrupos();

                            }
                        );

                    }
                );

        }
    );


/* =========================================
   NORMALIZAR CAMPO
========================================= */

function normalizarCampo(
    input
) {

    const valor =
        Number(
            input.value
        );


    if (
        !Number.isFinite(valor) ||
        valor < 0
    ) {

        input.value =
            0;

    }

}


/* =========================================
   CALCULAR ESPECIALIDADE

   REGRA CORRETA DA PLANILHA
========================================= */

function calcularEspecialidade(
    card
) {

    const altas =
        lerCampo(
            card,
            "altas"
        );

    const evasao =
        lerCampo(
            card,
            "evasao"
        );

    const obitosMenor24 =
        lerCampo(
            card,
            "obitosMenor24"
        );

    const obitosMaior24 =
        lerCampo(
            card,
            "obitosMaior24"
        );

    const transfExternas =
        lerCampo(
            card,
            "transfExternas"
        );

    const transfInternas =
        lerCampo(
            card,
            "transfInternas"
        );

    const admissao =
        lerCampo(
            card,
            "admissao"
        );


    /* =====================================
       ENCONTRO
    ===================================== */

    let encontro = 0;


    /*
       DIA 1

       O coordenador informa manualmente
       o encontro inicial.
    */

    if (
        diaSelecionado === 1
    ) {

        encontro =
            lerCampo(
                card,
                "encontroManual"
            );

    }


    /*
       DIA 2 EM DIANTE

       Encontro recebe EXATAMENTE
       o Deixo do dia anterior.

       NÃO soma admissão aqui.
    */

    else {

        encontro =
            Number(
                card
                    .querySelector(
                        "[data-deixo-anterior]"
                    )
                    ?.textContent
            ) || 0;

    }


    /* =====================================
       ÓBITOS TOTAL
    ===================================== */

    const obitosTotal =
        obitosMenor24 +
        obitosMaior24;


    /* =====================================
       Nº SAÍDAS / DIA

       Igual à sua planilha:

       Altas
       + Evasão
       + Óbitos <24
       + Óbitos >24
       + Transferência externa
       + Transferência interna
    ===================================== */

    const saidas =
        altas +
        evasao +
        obitosMenor24 +
        obitosMaior24 +
        transfExternas +
        transfInternas;


    /* =====================================
       DEIXO

       Fórmula:

       DEIXO =
       ENCONTRO
       - SAÍDAS
       + ADMISSÃO

       Equivalente à planilha:

       = B5 -
       (B6+B7+B8+B9+B10+B11)
       + B12
    ===================================== */

    const deixo =
        encontro
        - saidas
        + admissao;


    /* =====================================
       MOSTRAR RESULTADOS
    ===================================== */

    const encontroElemento =
        card.querySelector(
            "[data-encontro]"
        );

    const saidasElemento =
        card.querySelector(
            "[data-saidas]"
        );

    const obitosElemento =
        card.querySelector(
            "[data-obitos-total]"
        );

    const deixoElemento =
        card.querySelector(
            "[data-deixo]"
        );


    if (encontroElemento) {

        encontroElemento.textContent =
            encontro;

    }


    if (saidasElemento) {

        saidasElemento.textContent =
            saidas;

    }


    if (obitosElemento) {

        obitosElemento.textContent =
            obitosTotal;

    }


    if (deixoElemento) {

        deixoElemento.textContent =
            deixo;

    }

}


/* =========================================
   LER CAMPO
========================================= */

function lerCampo(
    card,
    campo
) {

    const input =
        card.querySelector(
            `[data-field="${campo}"]`
        );


    return (
        Number(
            input?.value
        ) || 0
    );

}
/* =========================================
   STATUS DA ESPECIALIDADE
========================================= */

function marcarEspecialidade(
    card
) {

    const status =
        card.querySelector(
            "[data-status]"
        );


    if (!status) {

        return;

    }


    const possuiMovimento =
        [
            ...card.querySelectorAll(
                "[data-field]"
            )
        ]
        .some(
            input => {

                return (
                    Number(
                        input.value
                    ) > 0
                );

            }
        );


    if (possuiMovimento) {

        status.textContent =
            "Preenchido";


        status.classList.add(
            "filled"
        );

    } else {

        status.textContent =
            "Não preenchido";


        status.classList.remove(
            "filled"
        );

    }

}


/* =========================================
   TOTAL DOS GRUPOS
========================================= */

function calcularTotaisGrupos() {

    if (totalClinicaMedica) {

        totalClinicaMedica.textContent =
            somarDeixosDoGrupo(
                "clinica-medica"
            );

    }


    if (totalClinicaCirurgica) {

        totalClinicaCirurgica.textContent =
            somarDeixosDoGrupo(
                "clinica-cirurgica"
            );

    }

}


/* =========================================
   SOMAR DEIXOS
========================================= */

function somarDeixosDoGrupo(
    grupo
) {

    const section =
        document.querySelector(
            `[data-group="${grupo}"]`
        );


    if (!section) {

        return 0;

    }


    let total = 0;


    section
        .querySelectorAll(
            ".specialty-card"
        )
        .forEach(
            card => {

                const elemento =
                    card.querySelector(
                        "[data-deixo]"
                    );


                total +=
                    Number(
                        elemento?.textContent
                    ) || 0;

            }
        );


    return total;

}


/* =========================================
   CARREGAR CENSO DO DIA
========================================= */
/* =========================================
   CARREGAR CENSO DO DIA
========================================= */

function carregarCensoDia() {

    limparFormulario();


    const chave =
        montarChaveDia(
            diaSelecionado,
            mesSelecionado,
            anoSelecionado
        );


    const salvo =
        censosTemporarios[chave];


    /*
       Se já existe algo salvo/rascunho
       para esse dia, preenche os campos.
    */

    if (salvo) {

        preencherFormulario(
            salvo
        );

    }


    /*
       Depois calcula toda a cadeia
       até o dia selecionado.
    */

    atualizarEncontroDoDiaAtual();


    document
        .querySelectorAll(
            ".specialty-card"
        )
        .forEach(card => {

            calcularEspecialidade(
                card
            );

            marcarEspecialidade(
                card
            );

        });


    calcularTotaisGrupos();

}


/* =========================================
   LIMPAR FORMULÁRIO
========================================= */

function limparFormulario() {

    document
        .querySelectorAll(
            '.specialty-content input[type="number"]'
        )
        .forEach(input => {

            input.value = 0;

        });


    document
        .querySelectorAll(
            `
                [data-encontro],
                [data-saidas],
                [data-obitos-total],
                [data-deixo]
            `
        )
        .forEach(elemento => {

            elemento.textContent =
                "0";

        });


    document
        .querySelectorAll(
            "[data-deixo-anterior]"
        )
        .forEach(elemento => {

            elemento.textContent =
                "0";

        });

}


/* =========================================
   CALCULAR ESTADO DA ESPECIALIDADE
   ATÉ DETERMINADO DIA

   DIA 1:
   Encontro manual.

   DIA 2+:
   Encontro = Deixo anterior.
========================================= */

function calcularEstadoAteDia(
    diaDestino,
    especialidade
) {

    let encontro = 0;
    let deixo = 0;


    for (
        let dia = 1;
        dia <= diaDestino;
        dia++
    ) {

        const chave =
            montarChaveDia(
                dia,
                mesSelecionado,
                anoSelecionado
            );


        const registro =
            censosTemporarios[chave]
                ?.especialidades
                ?.[especialidade];


        /* =====================================
           ENCONTRO
        ===================================== */

        if (dia === 1) {

            encontro =
                Number(
                    registro
                        ?.encontroManual
                ) || 0;

        } else {

            encontro =
                deixo;

        }


        /* =====================================
           MOVIMENTAÇÕES
        ===================================== */

        const altas =
            Number(
                registro?.altas
            ) || 0;


        const evasao =
            Number(
                registro?.evasao
            ) || 0;


        const obitosMenor24 =
            Number(
                registro?.obitosMenor24
            ) || 0;


        const obitosMaior24 =
            Number(
                registro?.obitosMaior24
            ) || 0;


        const transfExternas =
            Number(
                registro?.transfExternas
            ) || 0;


        const transfInternas =
            Number(
                registro?.transfInternas
            ) || 0;


        const admissao =
            Number(
                registro?.admissao
            ) || 0;


        /* =====================================
           SAÍDAS
        ===================================== */

        const saidas =
            altas +
            evasao +
            obitosMenor24 +
            obitosMaior24 +
            transfExternas +
            transfInternas;


        /* =====================================
           DEIXO

           ENCONTRO
           - SAÍDAS
           + ADMISSÃO
        ===================================== */

        deixo =
            encontro
            - saidas
            + admissao;

    }


    return {
        encontro,
        deixo
    };

}


/* =========================================
   ATUALIZAR ENCONTRO DO DIA ATUAL
========================================= */

function atualizarEncontroDoDiaAtual() {

    document
        .querySelectorAll(
            ".specialty-card"
        )
        .forEach(card => {

            const especialidade =
                card.dataset
                    .especialidade;


            const deixoAnteriorElemento =
                card.querySelector(
                    "[data-deixo-anterior]"
                );


            /*
               DIA 1:

               Não existe Deixo anterior.
               O Encontro será digitado.
            */

            if (
                diaSelecionado === 1
            ) {

                if (
                    deixoAnteriorElemento
                ) {

                    deixoAnteriorElemento
                        .textContent =
                        "0";

                }

                return;

            }


            /*
               DIA 2+:

               Calcula toda a cadeia
               desde o dia 1 até ontem.
            */

            const estadoAnterior =
                calcularEstadoAteDia(
                    diaSelecionado - 1,
                    especialidade
                );


            if (
                deixoAnteriorElemento
            ) {

                deixoAnteriorElemento
                    .textContent =
                    estadoAnterior.deixo;

            }

        });

}


/* =========================================
   ATUALIZAR RASCUNHO DO DIA ATUAL

   Isso faz a alteração refletir nos
   próximos dias antes mesmo de salvar.
========================================= */

function atualizarRascunhoDiaAtual() {

    if (
        !diaSelecionado ||
        !mesSelecionado ||
        !anoSelecionado
    ) {

        return;

    }


    const chave =
        montarChaveDia(
            diaSelecionado,
            mesSelecionado,
            anoSelecionado
        );


    /*
       Preserva se já estava salvo.
    */

    const registroAnterior =
        censosTemporarios[chave];

const payload = {

    setor:
        obterSetorUsuario(),

    data:
        `${anoSelecionado}-${String(
            mesSelecionado
        ).padStart(
            2,
            "0"
        )}-${String(
            diaSelecionado
        ).padStart(
            2,
            "0"
        )}`,

    especialidades: {},

    rascunho: false

};


    document
        .querySelectorAll(
            ".specialty-card"
        )
        .forEach(card => {

            const slug =
                card.dataset
                    .especialidade;


            payload
                .especialidades[
                    slug
                ] =
                coletarEspecialidade(
                    card
                );

        });


    censosTemporarios[
        chave
    ] =
        payload;

}


/* =========================================
   RECALCULAR TODOS OS DIAS POSTERIORES
========================================= */

function recalcularDiasPosteriores(
    diaAlterado
) {

    const quantidadeDias =
        new Date(
            anoSelecionado,
            mesSelecionado,
            0
        ).getDate();


    /*
       Vamos recalcular todos os registros
       existentes depois do dia alterado.

       Exemplo:
       mudou dia 2
       → recalcula 3, 4, 5...
    */

    for (
        let dia = diaAlterado + 1;
        dia <= quantidadeDias;
        dia++
    ) {

        const chaveAtual =
            montarChaveDia(
                dia,
                mesSelecionado,
                anoSelecionado
            );


        const censoAtual =
            censosTemporarios[
                chaveAtual
            ];


        /*
           Se ainda não existe movimentação
           nesse dia, não criamos um registro.

           Mesmo assim, ao abrir o dia,
           calcularEstadoAteDia() mostrará
           o Encontro correto.
        */

        if (!censoAtual) {

            continue;

        }


        Object
            .keys(
                censoAtual
                    .especialidades || {}
            )
            .forEach(
                especialidade => {

                    const atual =
                        censoAtual
                            .especialidades[
                                especialidade
                            ];


                    /*
                       Estado calculado
                       até o dia anterior.
                    */

                    const anterior =
                        calcularEstadoAteDia(
                            dia - 1,
                            especialidade
                        );


                    const encontro =
                        anterior.deixo;


                    const altas =
                        Number(
                            atual.altas
                        ) || 0;


                    const evasao =
                        Number(
                            atual.evasao
                        ) || 0;


                    const obitosMenor24 =
                        Number(
                            atual.obitosMenor24
                        ) || 0;


                    const obitosMaior24 =
                        Number(
                            atual.obitosMaior24
                        ) || 0;


                    const transfExternas =
                        Number(
                            atual.transfExternas
                        ) || 0;


                    const transfInternas =
                        Number(
                            atual.transfInternas
                        ) || 0;


                    const admissao =
                        Number(
                            atual.admissao
                        ) || 0;


                    const saidas =
                        altas +
                        evasao +
                        obitosMenor24 +
                        obitosMaior24 +
                        transfExternas +
                        transfInternas;


                    const obitosTotal =
                        obitosMenor24 +
                        obitosMaior24;


                    const deixo =
                        encontro
                        - saidas
                        + admissao;


                    atual.encontro =
                        encontro;


                    atual.numeroSaidas =
                        saidas;


                    atual.obitosTotal =
                        obitosTotal;


                    atual.deixo =
                        deixo;

                }
            );

    }

}


/* =========================================
   SALVAR CENSO
========================================= */

saveCenso.addEventListener(
    "click",
    () => {

        if (
            !diaSelecionado ||
            !mesSelecionado ||
            !anoSelecionado
        ) {

            alert(
                "Selecione o mês e o dia do censo."
            );

            return;

        }


        if (
            !periodoPodeSerEditado(
                mesSelecionado,
                anoSelecionado
            )
        ) {

            alert(
                "Este período já está encerrado para alterações."
            );

            return;

        }


        const chave =
            montarChaveDia(
                diaSelecionado,
                mesSelecionado,
                anoSelecionado
            );


        const payload = {

            data:
                `${anoSelecionado}-${String(
                    mesSelecionado
                ).padStart(
                    2,
                    "0"
                )}-${String(
                    diaSelecionado
                ).padStart(
                    2,
                    "0"
                )}`,

            especialidades:
                {},

            rascunho:
                false

        };


        document
            .querySelectorAll(
                ".specialty-card"
            )
            .forEach(card => {

                const slug =
                    card.dataset
                        .especialidade;


                payload
                    .especialidades[
                        slug
                    ] =
                    coletarEspecialidade(
                        card
                    );

            });


        /*
           SALVA O DIA
        */

        censosTemporarios[
            chave
        ] =
            payload;


        /*
           ALTEROU UM DIA?

           Recalcula toda a cadeia
           posterior automaticamente.
        */

        recalcularDiasPosteriores(
            diaSelecionado
        );


        /*
           Atualiza calendário.
        */

        gerarDias();


        /*
           Mantém o dia selecionado.
        */

        const botoes =
            document.querySelectorAll(
                ".day-button"
            );


        const botaoAtual =
            botoes[
                diaSelecionado - 1
            ];


        if (botaoAtual) {

            botaoAtual.classList.add(
                "selected"
            );

        }


        alert(
            "Censo salvo localmente para teste."
        );


        console.log(
            "Censo salvo:",
            payload
        );

    }
);


/* =========================================
   COLETAR DADOS DA ESPECIALIDADE
========================================= */

function coletarEspecialidade(
    card
) {

    return {

        encontroManual:
            lerCampo(
                card,
                "encontroManual"
            ),


        altas:
            lerCampo(
                card,
                "altas"
            ),


        evasao:
            lerCampo(
                card,
                "evasao"
            ),


        obitosMenor24:
            lerCampo(
                card,
                "obitosMenor24"
            ),


        obitosMaior24:
            lerCampo(
                card,
                "obitosMaior24"
            ),


        transfExternas:
            lerCampo(
                card,
                "transfExternas"
            ),


        transfInternas:
            lerCampo(
                card,
                "transfInternas"
            ),


        admissao:
            lerCampo(
                card,
                "admissao"
            ),


        leitoIsolamento:
            lerCampo(
                card,
                "leitoIsolamento"
            ),


        leitoManutencao:
            lerCampo(
                card,
                "leitoManutencao"
            ),


        encontro:
            Number(
                card
                    .querySelector(
                        "[data-encontro]"
                    )
                    ?.textContent
            ) || 0,


        numeroSaidas:
            Number(
                card
                    .querySelector(
                        "[data-saidas]"
                    )
                    ?.textContent
            ) || 0,


        obitosTotal:
            Number(
                card
                    .querySelector(
                        "[data-obitos-total]"
                    )
                    ?.textContent
            ) || 0,


        deixo:
            Number(
                card
                    .querySelector(
                        "[data-deixo]"
                    )
                    ?.textContent
            ) || 0

    };

}


/* =========================================
   PREENCHER FORMULÁRIO
========================================= */

function preencherFormulario(
    censo
) {

    document
        .querySelectorAll(
            ".specialty-card"
        )
        .forEach(card => {

            const slug =
                card.dataset
                    .especialidade;


            const dados =
                censo
                    .especialidades
                    ?.[slug];


            if (!dados) {

                return;

            }


            const campos = {

                encontroManual:
                    dados.encontroManual,

                altas:
                    dados.altas,

                evasao:
                    dados.evasao,

                obitosMenor24:
                    dados.obitosMenor24,

                obitosMaior24:
                    dados.obitosMaior24,

                transfExternas:
                    dados.transfExternas,

                transfInternas:
                    dados.transfInternas,

                admissao:
                    dados.admissao,

                leitoIsolamento:
                    dados.leitoIsolamento,

                leitoManutencao:
                    dados.leitoManutencao

            };


            Object.entries(
                campos
            )
            .forEach(
                ([campo, valor]) => {

                    const input =
                        card.querySelector(
                            `[data-field="${campo}"]`
                        );


                    if (input) {

                        input.value =
                            Number(
                                valor
                            ) || 0;

                    }

                }
            );

        });

}


/* =========================================
   CHAVE DA DATA
========================================= */

function montarChaveDia(
    dia,
    mes,
    ano
) {

    return [

        ano,

        String(
            mes
        ).padStart(
            2,
            "0"
        ),

        String(
            dia
        ).padStart(
            2,
            "0"
        )

    ].join("-");

}


/* =========================================
   FORMATAR DATA
========================================= */

function formatarData(
    data
) {

    return new Intl.DateTimeFormat(
        "pt-BR"
    ).format(
        data
    );

}
function persistirCensos() {

    localStorage.setItem(
        "censosHospitalares",
        JSON.stringify(
            censosTemporarios
        )
    );

}
function obterSetorUsuario() {

    const usuario =
        JSON.parse(
            localStorage.getItem("usuarioLogado")
        );


    return usuario?.setor || "Internamento";

}