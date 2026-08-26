const loginForm = document.getElementById("loginForm");
const usuarioInput = document.getElementById("usuario");
const senhaInput = document.getElementById("senha");
const btnLogin = document.getElementById("btnLogin");
const loginMessage = document.getElementById("loginMessage");
const togglePassword = document.getElementById("togglePassword");

const API_URL =
    "https://script.google.com/macros/s/AKfycby9_rpR0MimTfGA_39teRD8J-vefPcSdxwOAsSf4VcFxZtgVpcAeLOV_z0kjO6Yq4g/exec";


console.log("login.js carregado");
console.log("Form:", loginForm);
console.log("Usuário:", usuarioInput);
console.log("Senha:", senhaInput);
console.log("Botão:", btnLogin);


/* =========================================
   LOGIN
========================================= */

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    console.log("Submit capturado");

    const nome = usuarioInput.value.trim();
    const senha = senhaInput.value.trim();

    console.log("Tentando login:", nome);


    if (!nome || !senha) {

        mostrarMensagem(
            "Informe usuário e senha.",
            "error"
        );

        return;
    }


    try {

        btnLogin.disabled = true;

        btnLogin.innerHTML = `
            <span>Entrando...</span>
            <i class="fa-solid fa-spinner fa-spin"></i>
        `;


        mostrarMensagem(
            "Conectando ao servidor...",
            ""
        );


        console.log("Enviando para Apps Script...");


        const resposta = await fetch(
            API_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "text/plain;charset=utf-8"
                },

                body: JSON.stringify({
                    acao: "login",
                    nome: nome,
                    senha: senha
                })
            }
        );


        console.log(
            "HTTP:",
            resposta.status,
            resposta.statusText
        );


        const texto = await resposta.text();

        console.log(
            "Resposta bruta:",
            texto
        );


        let resultado;


        try {

            resultado =
                JSON.parse(texto);

        } catch (erro) {

            console.error(
                "Resposta não é JSON:",
                texto
            );

            throw new Error(
                "O Apps Script não retornou uma resposta válida."
            );

        }


        console.log(
            "Resultado:",
            resultado
        );


        if (!resultado.success) {

            throw new Error(
                resultado.message ||
                "Usuário ou senha inválidos."
            );

        }


        sessionStorage.setItem(
            "usuarioLogado",
            JSON.stringify(
                resultado.usuario
            )
        );


        mostrarMensagem(
            "Acesso autorizado.",
            "success"
        );


        console.log(
            "LOGIN OK:",
            resultado.usuario
        );


        setTimeout(() => {

            window.location.href =
                "./dashboard.html";

        }, 500);

    }

    catch (error) {

        console.error(
            "ERRO LOGIN:",
            error
        );


        mostrarMensagem(
            error.message ||
            "Erro ao realizar login.",
            "error"
        );

    }

    finally {

        btnLogin.disabled = false;

        btnLogin.innerHTML = `
            <span>Entrar</span>
            <i class="fa-solid fa-arrow-right"></i>
        `;

    }

});


/* =========================================
   MOSTRAR SENHA
========================================= */

if (togglePassword) {

    togglePassword.addEventListener(
        "click",
        function () {

            const visivel =
                senhaInput.type === "text";


            senhaInput.type =
                visivel
                    ? "password"
                    : "text";


            const icone =
                togglePassword.querySelector("i");


            if (icone) {

                icone.className =
                    visivel
                        ? "fa-regular fa-eye"
                        : "fa-regular fa-eye-slash";

            }

        }
    );

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

    if (tipo) {

        loginMessage.classList.add(
            tipo
        );

    }

}