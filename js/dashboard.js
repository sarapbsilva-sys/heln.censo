const usuarioLogado =
    JSON.parse(
        sessionStorage.getItem(
            "usuarioLogado"
        )
    );


if (!usuarioLogado) {

    window.location.href =
        "./index.html";

}






const user = {
    nome: "João Silva",

    // Troque entre:
    // "gestao"
    // "coordenador"

    permissao: "gestao",

    setor: "UTI 1"
};


const managementDashboard =
    document.getElementById("managementDashboard");

const coordinatorDashboard =
    document.getElementById("coordinatorDashboard");

const userName =
    document.getElementById("userName");

const userRole =
    document.getElementById("userRole");

const pageTitle =
    document.getElementById("pageTitle");

const coordinatorSector =
    document.getElementById("coordinatorSector");


userName.textContent = user.nome;


if (user.permissao === "gestao") {

    userRole.textContent = "Gestão";

    pageTitle.textContent = "Visão Geral";

    managementDashboard.classList.remove("hidden");

    coordinatorDashboard.classList.add("hidden");


    document
        .querySelectorAll(".coordinator-only")
        .forEach(item => {

            item.style.display = "none";

        });

}


if (user.permissao === "coordenador") {

    userRole.textContent = "Coordenador";

    pageTitle.textContent = "Meu Censo";

    managementDashboard.classList.add("hidden");

    coordinatorDashboard.classList.remove("hidden");

    coordinatorSector.textContent = user.setor;


    document
        .querySelectorAll(".management-only")
        .forEach(item => {

            item.style.display = "none";

        });

}