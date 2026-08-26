const loginForm =
    document.getElementById("loginForm");

const nomeInput =
    document.getElementById("nome");

const senhaInput =
    document.getElementById("senha");

const loginButton =
    document.getElementById("loginButton");


const API_URL =
    "https://script.google.com/macros/s/AKfycby9_rpR0MimTfGA_39teRD8J-vefPcSdxwOAsSf4VcFxZtgVpcAeLOV_z0kjO6Yq4g/exec";


loginForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        const nome =
            nomeInput.value.trim();

        const senha =
            senhaInput.value.trim();


        if (!nome || !senha) {

            alert(
                "Informe nome e senha."
            );

            return;

        }


        try {

            loginButton.disabled =
                true;

            loginButton.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Entrando...
            `;


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
                    "Não foi possível realizar o login."
                );

            }


            sessionStorage.setItem(
                "usuarioLogado",
                JSON.stringify(
                    resultado.usuario
                )
            );


            window.location.href =
                "./dashboard.html";

        }

        catch (error) {

            console.error(
                "Erro no login:",
                error
            );


            alert(
                error.message ||
                "Erro ao realizar login."
            );

        }

        finally {

            loginButton.disabled =
                false;

            loginButton.innerHTML =
                "Entrar";

        }

    }
);