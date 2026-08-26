const loginForm =
    document.getElementById("loginForm");

const usuarioInput =
    document.getElementById("usuario");

const senhaInput =
    document.getElementById("senha");

const btnLogin =
    document.getElementById("btnLogin");

const loginMessage =
    document.getElementById("loginMessage");

const togglePassword =
    document.getElementById("togglePassword");


/* =========================================
   API
========================================= */

const API_URL =
    "https://script.google.com/macros/s/AKfycby9_rpR0MimTfGA_39teRD8J-vefPcSdxwOAsSf4VcFxZtgVpcAeLOV_z0kjO6Yq4g/exec";


console.log(
    "LOGIN.JS CARREGADO"
);


/* =========================================
   LOGIN
========================================= */

loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        /* =====================================
           LIMPA SESSÃO ANTIGA
        ===================================== */

        sessionStorage.removeItem(
            "usuarioLogado"
        );


        limparMensagem();


        const nome =
            usuarioInput.value.trim();

        const senha =
            senhaInput.value.trim();


        if (
            !nome ||
            !senha
        ) {

            mostrarMensagem(
                "Informe usuário e senha.",
                "error"
            );

            return;
        }


        try {

            ativarCarregamento();


            console.log(
                "Tentando login:",
                nome
            );


            /* =====================================
               CHAMADA AO APPS SCRIPT
            ===================================== */

            const resposta =
                await fetch(
                    API_URL,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "text/plain;charset=utf-8"
                        },

                        body:
                            JSON.stringify({
                                acao:
                                    "login",

                                nome:
                                    nome,

                                senha:
                                    senha
                            })
                    }
                );


            console.log(
                "HTTP:",
                resposta.status
            );


            const texto =
                await resposta.text();


            console.log(
                "RESPOSTA BRUTA:",
                texto
            );


            /* =====================================
               CONVERTER RESPOSTA
            ===================================== */

            let resultado;


            try {

                resultado =
                    JSON.parse(
                        texto
                    );

            }

            catch (erro) {

                console.error(
                    "Resposta inválida:",
                    texto
                );


                throw new Error(
                    "O servidor não retornou uma resposta válida."
                );

            }


            console.log(
                "RESULTADO:",
                resultado
            );


            /* =====================================
               LOGIN NEGADO
            ===================================== */

            if (
                !resultado.success
            ) {

                throw new Error(
                    resultado.message ||
                    "Usuário ou senha inválidos."
                );

            }


            if (
                !resultado.usuario
            ) {

                throw new Error(
                    "Os dados do usuário não foram retornados."
                );

            }


            /* =====================================
               NORMALIZAR USUÁRIO
            ===================================== */

            const usuario = {

                nome:
                    String(
                        resultado.usuario.nome ||
                        ""
                    )
                    .trim(),

                perfil:
                    normalizarPerfil(
                        resultado.usuario.perfil
                    ),

                setor:
                    String(
                        resultado.usuario.setor ||
                        ""
                    )
                    .trim()
                    .toUpperCase()

            };


            /* =====================================
               VALIDAR PERFIL
            ===================================== */

            if (
                usuario.perfil !==
                    "GESTAO"
                &&
                usuario.perfil !==
                    "COORDENADOR"
            ) {

                console.error(
                    "Perfil retornado:",
                    resultado.usuario.perfil
                );


                throw new Error(
                    "Perfil de usuário inválido."
                );

            }


            /* =====================================
               SALVAR SESSÃO
            ===================================== */

            sessionStorage.setItem(
                "usuarioLogado",
                JSON.stringify(
                    usuario
                )
            );


            console.log(
                "USUÁRIO SALVO NA SESSÃO:",
                usuario
            );


            console.log(
                "SESSION STORAGE:",
                sessionStorage.getItem(
                    "usuarioLogado"
                )
            );


            mostrarMensagem(
                "Acesso autorizado.",
                "success"
            );


            /* =====================================
               REDIRECIONAR
            ===================================== */

            setTimeout(
                () => {

                    window.location.href =
                        "./dashboard.html";

                },
                400
            );

        }

        catch (error) {

            console.error(
                "ERRO LOGIN:",
                error
            );


            sessionStorage.removeItem(
                "usuarioLogado"
            );


            mostrarMensagem(
                error.message ||
                "Erro ao realizar login.",
                "error"
            );

        }

        finally {

            desativarCarregamento();

        }

    }
);


/* =========================================
   NORMALIZAR PERFIL
========================================= */

function normalizarPerfil(
    perfil
) {

    return String(
        perfil ||
        ""
    )
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(
        /[\u0300-\u036f]/g,
        ""
    );

}


/* =========================================
   MOSTRAR / OCULTAR SENHA
========================================= */

if (
    togglePassword
) {

    togglePassword.addEventListener(
        "click",
        function () {

            const visivel =
                senhaInput.type ===
                "text";


            senhaInput.type =
                visivel
                    ? "password"
                    : "text";


            const icone =
                togglePassword
                    .querySelector(
                        "i"
                    );


            if (
                icone
            ) {

                icone.className =
                    visivel
                        ? "fa-regular fa-eye"
                        : "fa-regular fa-eye-slash";

            }


            togglePassword.setAttribute(
                "aria-label",
                visivel
                    ? "Mostrar senha"
                    : "Ocultar senha"
            );

        }
    );

}


/* =========================================
   CARREGAMENTO
========================================= */

function ativarCarregamento() {

    btnLogin.disabled =
        true;


    btnLogin.innerHTML = `
        <span>Entrando...</span>
        <i class="fa-solid fa-spinner fa-spin"></i>
    `;

}


function desativarCarregamento() {

    btnLogin.disabled =
        false;


    btnLogin.innerHTML = `
        <span>Entrar</span>
        <i class="fa-solid fa-arrow-right"></i>
    `;

}


/* =========================================
   MENSAGEM
========================================= */

function mostrarMensagem(
    mensagem,
    tipo
) {

    loginMessage.textContent =
        mensagem;


    loginMessage.className =
        "login-message";


    if (
        tipo
    ) {

        loginMessage.classList.add(
            tipo
        );

    }

}


function limparMensagem() {

    loginMessage.textContent =
        "";


    loginMessage.className =
        "login-message";

}