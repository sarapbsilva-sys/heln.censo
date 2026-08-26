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
   URL DA API - APPS SCRIPT
========================================= */

const API_URL =
    "https://script.google.com/macros/s/AKfycby9_rpR0MimTfGA_39teRD8J-vefPcSdxwOAsSf4VcFxZtgVpcAeLOV_z0kjO6Yq4g/exec";


/* =========================================
   LOGIN
========================================= */

loginForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        limparMensagem();


        const nome =
            usuarioInput.value.trim();

        const senha =
            senhaInput.value.trim();


        if (!nome || !senha) {

            mostrarMensagem(
                "Informe usuário e senha.",
                "error"
            );

            return;
        }


        try {

            ativarCarregamento();


            const resposta =
                await fetch(
                    API_URL,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "text/plain;charset=utf-8"
                        },

                        body:
                            JSON.stringify({
                                acao: "login",
                                nome,
                                senha
                            })
                    }
                );


            const resultado =
                await resposta.json();


            if (!resultado.success) {

                throw new Error(
                    resultado.message ||
                    "Usuário ou senha inválidos."
                );

            }


            /* =====================================
               SALVAR USUÁRIO LOGADO
            ===================================== */

            sessionStorage.setItem(
                "usuarioLogado",
                JSON.stringify(
                    resultado.usuario
                )
            );


            mostrarMensagem(
                "Acesso autorizado. Redirecionando...",
                "success"
            );


            setTimeout(
                () => {

                    window.location.href =
                        "./dashboard.html";

                },
                500
            );

        }

        catch (error) {

            console.error(
                "Erro no login:",
                error
            );


            mostrarMensagem(
                error.message ||
                "Não foi possível realizar o login.",
                "error"
            );

        }

        finally {

            desativarCarregamento();

        }

    }
);


/* =========================================
   MOSTRAR / OCULTAR SENHA
========================================= */

togglePassword.addEventListener(
    "click",
    () => {

        const senhaVisivel =
            senhaInput.type === "text";


        senhaInput.type =
            senhaVisivel
                ? "password"
                : "text";


        const icone =
            togglePassword.querySelector("i");


        if (senhaVisivel) {

            icone.className =
                "fa-regular fa-eye";

            togglePassword.setAttribute(
                "aria-label",
                "Mostrar senha"
            );

        } else {

            icone.className =
                "fa-regular fa-eye-slash";

            togglePassword.setAttribute(
                "aria-label",
                "Ocultar senha"
            );

        }

    }
);


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
   MENSAGENS
========================================= */

function mostrarMensagem(
    mensagem,
    tipo
) {

    loginMessage.textContent =
        mensagem;


    loginMessage.className =
        `login-message ${tipo}`;

}


function limparMensagem() {

    loginMessage.textContent =
        "";

    loginMessage.className =
        "login-message";

}


/* =========================================
   SE JÁ ESTIVER LOGADO
========================================= */

const usuarioLogado =
    sessionStorage.getItem(
        "usuarioLogado"
    );


if (usuarioLogado) {

    try {

        const usuario =
            JSON.parse(
                usuarioLogado
            );


        if (
            usuario?.nome &&
            usuario?.perfil
        ) {

            window.location.href =
                "./dashboard.html";

        }

    }

    catch {

        sessionStorage.removeItem(
            "usuarioLogado"
        );

    }

}