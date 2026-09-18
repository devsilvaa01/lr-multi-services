// ================================
// LOGIN
// ================================

const LOGIN_USUARIO = "admin";
const LOGIN_SENHA = "LR2026";

const telaLogin = document.querySelector("#tela-login");
const app = document.querySelector("#app");
const formularioLogin = document.querySelector("#form-login");
const erroLogin = document.querySelector("#login-erro");
const botaoSair = document.querySelector("#btn-sair");

function verificarLogin() {
    const logado = sessionStorage.getItem("lrMultiServicesLogado") === "true";

    if (logado) {
        telaLogin.classList.add("app-oculto");
        app.classList.remove("app-oculto");
    } else {
        telaLogin.classList.remove("app-oculto");
        app.classList.add("app-oculto");
    }
}

formularioLogin.addEventListener("submit", function (event) {
    event.preventDefault();

    const usuario = document.querySelector("#login-usuario").value.trim();
    const senha = document.querySelector("#login-senha").value;

    if (usuario === LOGIN_USUARIO && senha === LOGIN_SENHA) {
        sessionStorage.setItem("lrMultiServicesLogado", "true");
        erroLogin.textContent = "";
        formularioLogin.reset();
        verificarLogin();
    } else {
        erroLogin.textContent = "Usuário ou senha incorretos.";
    }
});

botaoSair.addEventListener("click", function () {
    sessionStorage.removeItem("lrMultiServicesLogado");
    verificarLogin();
});

verificarLogin();

// ================================
// MODAL DE CONFIRMAÇÃO
// ================================

const modalConfirmacao = document.querySelector("#modal-confirmacao");
const modalTitulo = document.querySelector("#modal-titulo");
const modalMensagem = document.querySelector("#modal-mensagem");
const modalCancelar = document.querySelector("#modal-cancelar");
const modalConfirmar = document.querySelector("#modal-confirmar");

let resolverConfirmacao = null;

function mostrarConfirmacao(mensagem, titulo = "Confirmar ação", textoBotao = "Confirmar") {
    return new Promise(function (resolve) {
        resolverConfirmacao = resolve;

        modalTitulo.textContent = titulo;
        modalMensagem.textContent = mensagem;
        modalConfirmar.textContent = textoBotao;

        modalConfirmacao.classList.add("ativo");
        modalConfirmacao.setAttribute("aria-hidden", "false");

        setTimeout(function () {
            modalConfirmar.focus();
        }, 50);
    });
}

function fecharConfirmacao(resultado) {
    if (resolverConfirmacao) {
        resolverConfirmacao(resultado);
        resolverConfirmacao = null;
    }

    modalConfirmacao.classList.remove("ativo");
    modalConfirmacao.setAttribute("aria-hidden", "true");
}

modalCancelar.addEventListener("click", function () {
    fecharConfirmacao(false);
});

modalConfirmar.addEventListener("click", function () {
    fecharConfirmacao(true);
});

modalConfirmacao.addEventListener("click", function (event) {
    if (event.target === modalConfirmacao) {
        fecharConfirmacao(false);
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && modalConfirmacao.classList.contains("ativo")) {
        fecharConfirmacao(false);
    }
});

// ================================
// CLIENTES
// ================================

let clientes = JSON.parse(
    localStorage.getItem("clientes")
) || [];

const formularioCliente = document.querySelector("#form-cliente");
const totalClientes = document.querySelector("#total-clientes");
const listaClientes = document.querySelector("#lista-clientes");
const clienteOrcamento = document.querySelector("#cliente-orcamento");

formularioCliente.addEventListener("submit", function (event) {

    event.preventDefault();

    const nome = document.querySelector("#nome").value;
    const telefone = document.querySelector("#telefone").value;
    const email = document.querySelector("#email").value;

    const cliente = {
        nome: nome,
        telefone: telefone,
        email: email
    };

    clientes.push(cliente);

    localStorage.setItem(
        "clientes",
        JSON.stringify(clientes)
    );

    atualizarClientes();

    formularioCliente.reset();

    alert("Cliente cadastrado com sucesso!");

});


function atualizarClientes() {

    totalClientes.textContent = clientes.length;

    listaClientes.innerHTML = "";

    clienteOrcamento.innerHTML = `
        <option value="">
            Selecione um cliente
        </option>
    `;

    clientes.forEach(function (cliente, index) {

        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td>${cliente.nome}</td>

            <td>${cliente.telefone}</td>

            <td>${cliente.email || "Não informado"}</td>

            <td>

                <div class="acoes">

                    <button
                        class="btn-editar"
                        onclick="editarCliente(${index})"
                    >
                        Editar
                    </button>

                    <button
                        class="btn-excluir"
                        onclick="excluirCliente(${index})"
                    >
                        Excluir
                    </button>

                </div>

            </td>
        `;

        listaClientes.appendChild(linha);

        const opcao = document.createElement("option");

        opcao.value = index;

        opcao.textContent = cliente.nome;

        clienteOrcamento.appendChild(opcao);

    });

}


function editarCliente(index) {

    const cliente = clientes[index];

    document.querySelector("#nome").value =
        cliente.nome;

    document.querySelector("#telefone").value =
        cliente.telefone;

    document.querySelector("#email").value =
        cliente.email;

    clientes.splice(index, 1);

    localStorage.setItem(
        "clientes",
        JSON.stringify(clientes)
    );

    atualizarClientes();

}


async function excluirCliente(index) {

    const confirmar = await mostrarConfirmacao(
        "Tem certeza que deseja excluir este cliente?",
        "Excluir cliente?",
        "Excluir"
    );

    if (confirmar) {

        clientes.splice(index, 1);

        localStorage.setItem(
            "clientes",
            JSON.stringify(clientes)
        );

        atualizarClientes();

        alert(
            "Cliente excluído com sucesso!"
        );

    }

}



// ================================
// ORÇAMENTOS
// ================================

let itensOrcamento = [];

let orcamentos = JSON.parse(
    localStorage.getItem("orcamentos")
) || [];

const formularioOrcamento =
    document.querySelector("#form-orcamento");

const listaItens =
    document.querySelector("#lista-itens");

const valorTotal =
    document.querySelector("#valor-total");

const btnFinalizar =
    document.querySelector("#btn-finalizar-orcamento");

const totalOrcamentos =
    document.querySelector("#total-orcamentos");

const listaOrcamentos =
    document.querySelector("#lista-orcamentos");

const totalPendentes =
    document.querySelector("#total-pendentes");

const totalAprovados =
    document.querySelector("#total-aprovados");

const totalRecusados =
    document.querySelector("#total-recusados");



// ================================
// ADICIONAR ITEM
// ================================

formularioOrcamento.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        const cliente =
            document.querySelector(
                "#cliente-orcamento"
            ).value;

        const descricao =
            document.querySelector(
                "#descricao"
            ).value;

        const unidade =
            document.querySelector(
                "#unidade"
            ).value;

        const quantidade =
            Number(
                document.querySelector(
                    "#quantidade"
                ).value
            );

        const valor =
            Number(
                document.querySelector(
                    "#valor"
                ).value
            );

        if (cliente === "") {

            alert(
                "Selecione um cliente."
            );

            return;
        }

        const item = {

            cliente: cliente,

            descricao: descricao,

            unidade: unidade,

            quantidade: quantidade,

            valor: valor,

            total: quantidade * valor

        };

        itensOrcamento.push(item);

        atualizarItens();

        document.querySelector(
            "#descricao"
        ).value = "";

        document.querySelector(
            "#unidade"
        ).value = "un";

        document.querySelector(
            "#quantidade"
        ).value = 1;

        document.querySelector(
            "#valor"
        ).value = "";

    }
);



// ================================
// ATUALIZAR ITENS
// ================================

function atualizarItens() {

    listaItens.innerHTML = "";

    let total = 0;

    itensOrcamento.forEach(
        function (item, index) {

            total += item.total;

            const linha =
                document.createElement("tr");

            linha.innerHTML = `
                <td>${item.descricao}</td>

                <td>${item.unidade || "un"}</td>

                <td>${item.quantidade}</td>

                <td>
                    ${formatarMoeda(item.valor)}
                </td>

                <td>
                    ${formatarMoeda(item.total)}
                </td>

                <td>

                    <button
                        class="btn-excluir"
                        onclick="excluirItem(${index})"
                    >
                        Excluir
                    </button>

                </td>
            `;

            listaItens.appendChild(linha);

        }
    );

    valorTotal.textContent =
        formatarMoeda(total);

}


function excluirItem(index) {

    itensOrcamento.splice(
        index,
        1
    );

    atualizarItens();

}



// ================================
// FINALIZAR ORÇAMENTO
// ================================

btnFinalizar.addEventListener(
    "click",
    function () {

        if (itensOrcamento.length === 0) {

            alert(
                "Adicione pelo menos um item ao orçamento."
            );

            return;
        }

        const clienteIndex =
            document.querySelector(
                "#cliente-orcamento"
            ).value;

        if (clienteIndex === "") {

            alert(
                "Selecione um cliente."
            );

            return;
        }

        const cliente =
            clientes[clienteIndex];

        let total = 0;

        itensOrcamento.forEach(
            function (item) {

                total += item.total;

            }
        );

        const orcamento = {

            cliente: cliente,

            itens: [
                ...itensOrcamento
            ],

            total: total,

            status: "Pendente",

            data:
                new Date().toLocaleDateString(
                    "pt-BR"
                )

        };

        orcamentos.push(
            orcamento
        );

        localStorage.setItem(
            "orcamentos",
            JSON.stringify(orcamentos)
        );

        atualizarHistorico();

        atualizarContadores();

        itensOrcamento = [];

        atualizarItens();

        document.querySelector(
            "#cliente-orcamento"
        ).value = "";

        alert(
            "Orçamento finalizado com sucesso!"
        );

    }
);



// ================================
// HISTÓRICO
// ================================

function atualizarHistorico() {

    listaOrcamentos.innerHTML = "";

    orcamentos.forEach(
        function (orcamento, index) {

            const linha =
                document.createElement("tr");

            linha.innerHTML = `
                <td>
                    ${orcamento.cliente.nome}
                </td>

                <td>
                    ${orcamento.data}
                </td>

                <td>
                    ${formatarMoeda(orcamento.total)}
                </td>

                <td class="status-${orcamento.status.toLowerCase()}">
                    ${orcamento.status}
                </td>

                <td>

                    <div class="acoes">

                        <button
                            class="btn-status"
                            onclick="alterarStatus(${index})"
                        >
                            Alterar status
                        </button>

                        <button
                            class="btn-visualizar"
                            onclick="visualizarOrcamento(${index})"
                        >
                            Visualizar
                        </button>

                        <button
                            class="btn-pdf"
                            onclick="gerarPDF(${index})"
                        >
                            Gerar PDF
                        </button>

                        <button
                            class="btn-whatsapp"
                            onclick="enviarWhatsApp(${index})"
                        >
                            WhatsApp
                        </button>

                        <button
                            class="btn-excluir"
                            onclick="excluirOrcamento(${index})"
                        >
                            Excluir
                        </button>

                    </div>

                </td>
            `;

            listaOrcamentos.appendChild(linha);

        }
    );

}



// ================================
// ALTERAR STATUS
// ================================

function alterarStatus(index) {

    const orcamento =
        orcamentos[index];

    let novoStatus;

    if (orcamento.status === "Pendente") {

        novoStatus = "Aprovado";

    } else if (orcamento.status === "Aprovado") {

        novoStatus = "Recusado";

    } else {

        novoStatus = "Pendente";

    }

    orcamento.status =
        novoStatus;

    localStorage.setItem(
        "orcamentos",
        JSON.stringify(orcamentos)
    );

    atualizarHistorico();

    atualizarContadores();

}



// ================================
// CONTADORES
// ================================

function atualizarContadores() {

    totalOrcamentos.textContent =
        orcamentos.length;

    const pendentes =
        orcamentos.filter(
            function (orcamento) {

                return (
                    orcamento.status ===
                    "Pendente"
                );

            }
        );

    const aprovados =
        orcamentos.filter(
            function (orcamento) {

                return (
                    orcamento.status ===
                    "Aprovado"
                );

            }
        );

    const recusados =
        orcamentos.filter(
            function (orcamento) {

                return (
                    orcamento.status ===
                    "Recusado"
                );

            }
        );

    totalPendentes.textContent =
        pendentes.length;

    totalAprovados.textContent =
        aprovados.length;

    totalRecusados.textContent =
        recusados.length;

}



// ================================
// VISUALIZAR ORÇAMENTO
// ================================

function visualizarOrcamento(index) {

    const orcamento =
        orcamentos[index];

    let mensagem =
        `ORÇAMENTO\n\n`;

    mensagem +=
        `Cliente: ${orcamento.cliente.nome}\n`;

    mensagem +=
        `Telefone: ${orcamento.cliente.telefone}\n`;

    mensagem +=
        `Data: ${orcamento.data}\n`;

    mensagem +=
        `Status: ${orcamento.status}\n\n`;

    mensagem +=
        `ITENS:\n\n`;

    orcamento.itens.forEach(
        function (item) {

            mensagem +=
                `${item.descricao}\n`;

            mensagem +=
                `Unidade: ${item.unidade || "un"}\n`;

            mensagem +=
                `Quantidade: ${item.quantidade}\n`;

            mensagem +=
                `Valor: ${formatarMoeda(item.valor)}\n`;

            mensagem +=
                `Total: ${formatarMoeda(item.total)}\n\n`;

        }
    );

    mensagem +=
        `TOTAL: ${formatarMoeda(orcamento.total)}`;

    alert(mensagem);

}



// ================================
// LOGO PARA O PDF
// ================================

let logoPDF = null;

function carregarLogoPDF() {

    return new Promise(function (resolve) {

        if (logoPDF) {
            resolve(logoPDF);
            return;
        }

        const imagem = new Image();

        imagem.onload = function () {

            const canvas = document.createElement("canvas");
            const contexto = canvas.getContext("2d");

            canvas.width = imagem.naturalWidth;
            canvas.height = imagem.naturalHeight;

            contexto.drawImage(
                imagem,
                0,
                0
            );

            logoPDF = canvas.toDataURL("image/png");

            resolve(logoPDF);

        };

        imagem.onerror = function () {
            resolve(null);
        };

        imagem.src = "logo.png";

    });

}


// ================================
// PDF PROFISSIONAL
// ================================

async function gerarPDF(index) {

    const orcamento =
        orcamentos[index];

    const { jsPDF } =
        window.jspdf;

    const pdf =
        new jsPDF();

    const logo = await carregarLogoPDF();


    // --------------------------------
    // CONFIGURAÇÕES
    // --------------------------------

    const margem =
        20;

    const larguraPagina =
        210;

    const larguraConteudo =
        170;


    // --------------------------------
    // CABEÇALHO
    // --------------------------------

    pdf.setFillColor(
        17,
        17,
        17
    );

    pdf.rect(
        0,
        0,
        larguraPagina,
        42,
        "F"
    );


    pdf.setTextColor(
        255,
        255,
        255
    );

    if (logo) {

        pdf.addImage(
            logo,
            "PNG",
            margem,
            4,
            48,
            32
        );

    }

    pdf.setFont(
        "helvetica",
        "bold"
    );

    pdf.setFontSize(20);

    pdf.text(
        "ORÇAMENTO",
        76,
        19
    );


    pdf.setFont(
        "helvetica",
        "normal"
    );

    pdf.setFontSize(9);

    pdf.text(
        "LR MULTI SERVICES",
        76,
        29
    );


    // Número do orçamento

    pdf.setFont(
        "helvetica",
        "bold"
    );

    pdf.setFontSize(11);

    pdf.text(
        `Nº ${String(index + 1).padStart(4, "0")}`,
        160,
        19
    );


    pdf.setFont(
        "helvetica",
        "normal"
    );

    pdf.setFontSize(9);

    pdf.text(
        `Data: ${orcamento.data}`,
        160,
        29
    );


    // Resetar cor

    pdf.setTextColor(
        0,
        0,
        0
    );



    // --------------------------------
    // DADOS DO CLIENTE
    // --------------------------------

    pdf.setFont(
        "helvetica",
        "bold"
    );

    pdf.setFontSize(13);

    pdf.text(
        "DADOS DO CLIENTE",
        margem,
        60
    );


    pdf.setDrawColor(
        220,
        220,
        220
    );

    pdf.line(
        margem,
        64,
        190,
        64
    );


    pdf.setFont(
        "helvetica",
        "bold"
    );

    pdf.setFontSize(10);

    pdf.text(
        "Nome",
        margem,
        76
    );


    pdf.setFont(
        "helvetica",
        "normal"
    );

    pdf.text(
        orcamento.cliente.nome,
        margem,
        84
    );


    pdf.setFont(
        "helvetica",
        "bold"
    );

    pdf.text(
        "Telefone",
        105,
        76
    );


    pdf.setFont(
        "helvetica",
        "normal"
    );

    pdf.text(
        orcamento.cliente.telefone,
        105,
        84
    );


    pdf.setFont(
        "helvetica",
        "bold"
    );

    pdf.text(
        "E-mail",
        margem,
        96
    );


    pdf.setFont(
        "helvetica",
        "normal"
    );

    pdf.text(
        orcamento.cliente.email ||
        "Não informado",
        margem,
        104
    );



    // --------------------------------
    // SERVIÇOS
    // --------------------------------

    pdf.setFont(
        "helvetica",
        "bold"
    );

    pdf.setFontSize(13);

    pdf.text(
        "SERVIÇOS",
        margem,
        125
    );


    // Cabeçalho da tabela

    pdf.setFillColor(
        245,
        245,
        245
    );

    pdf.roundedRect(
        margem,
        132,
        larguraConteudo,
        12,
        2,
        2,
        "F"
    );


    pdf.setFont(
        "helvetica",
        "bold"
    );

    pdf.setFontSize(9);


    pdf.text(
        "DESCRIÇÃO",
        24,
        140
    );


    pdf.text(
        "UN.",
        105,
        140
    );


    pdf.text(
        "QTD.",
        119,
        140
    );


    pdf.text(
        "VALOR UNIT.",
        136,
        140
    );


    pdf.text(
        "TOTAL",
        175,
        140
    );


    // --------------------------------
    // ITENS
    // --------------------------------

    let y = 153;


    orcamento.itens.forEach(
        function (item, itemIndex) {

            // Nova página
            if (y > 260) {

                adicionarCabecalhoPagina(
                    pdf
                );

                y = 55;

            }


            // Linha

            if (itemIndex % 2 === 0) {

                pdf.setFillColor(
                    250,
                    250,
                    250
                );

                pdf.rect(
                    margem,
                    y - 7,
                    larguraConteudo,
                    11,
                    "F"
                );

            }


            pdf.setTextColor(
                40,
                40,
                40
            );

            pdf.setFont(
                "helvetica",
                "normal"
            );

            pdf.setFontSize(9);


            let descricao =
                item.descricao;


            if (
                descricao.length > 42
            ) {

                descricao =
                    descricao.substring(
                        0,
                        42
                    ) + "...";

            }


            pdf.text(
                descricao,
                24,
                y
            );


            pdf.text(
                item.unidade || "un",
                105,
                y
            );


            pdf.text(
                String(item.quantidade),
                119,
                y
            );


            pdf.text(
                formatarMoeda(
                    item.valor
                ),
                136,
                y
            );


            pdf.text(
                formatarMoeda(
                    item.total
                ),
                175,
                y
            );


            y += 12;

        }
    );



    // --------------------------------
    // TOTAL
    // --------------------------------

    y += 8;


    pdf.setDrawColor(
        210,
        210,
        210
    );

    pdf.line(
        margem,
        y,
        190,
        y
    );


    y += 18;


    pdf.setFont(
        "helvetica",
        "bold"
    );

    pdf.setFontSize(12);

    pdf.text(
        "TOTAL DO ORÇAMENTO",
        105,
        y
    );


    pdf.setFontSize(18);

    pdf.text(
        formatarMoeda(
            orcamento.total
        ),
        160,
        y
    );



    // --------------------------------
    // STATUS
    // --------------------------------

    y += 18;


    pdf.setFont(
        "helvetica",
        "bold"
    );

    pdf.setFontSize(10);

    pdf.text(
        "STATUS:",
        margem,
        y
    );


    pdf.setFont(
        "helvetica",
        "normal"
    );

    pdf.text(
        orcamento.status,
        42,
        y
    );



    // --------------------------------
    // OBSERVAÇÃO
    // --------------------------------

    y += 20;


    pdf.setDrawColor(
        230,
        230,
        230
    );

    pdf.line(
        margem,
        y,
        190,
        y
    );


    y += 12;


    pdf.setFont(
        "helvetica",
        "bold"
    );

    pdf.setFontSize(10);

    pdf.text(
        "Observações",
        margem,
        y
    );


    pdf.setFont(
        "helvetica",
        "normal"
    );

    pdf.setFontSize(9);

    pdf.text(
        "Este orçamento está sujeito à confirmação das condições acordadas.",
        margem,
        y + 9
    );



    // --------------------------------
    // RODAPÉ
    // --------------------------------

    adicionarRodape(
        pdf
    );


    // --------------------------------
    // SALVAR
    // --------------------------------

    pdf.save(
        `orcamento-${String(index + 1).padStart(4, "0")}.pdf`
    );

}



// ================================
// ENVIAR PELO WHATSAPP
// ================================

async function enviarWhatsApp(index) {

    const orcamento = orcamentos[index];

    if (!orcamento || !orcamento.cliente) {
        alert("Orçamento não encontrado.");
        return;
    }

    const telefone = String(orcamento.cliente.telefone || "")
        .replace(/\D/g, "");

    if (!telefone) {
        alert("Este cliente não possui telefone cadastrado.");
        return;
    }

    // Abre a janela imediatamente para evitar bloqueio de pop-up.
    const janela = window.open("about:blank", "_blank");

    await gerarPDF(index);

    const numero = telefone.startsWith("55")
        ? telefone
        : `55${telefone}`;

    const mensagem =
        `Olá, ${orcamento.cliente.nome}!\n\n` +
        `Estou enviando o orçamento da LR MULTI SERVICES.\n` +
        `Valor total: ${formatarMoeda(orcamento.total)}.\n\n` +
        `O PDF do orçamento foi gerado.\n` +
        `Nº ${String(index + 1).padStart(4, "0")}`;

    const url =
        `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;

    if (janela) {
        janela.location.href = url;
    } else {
        window.open(url, "_blank");
    }
}


// ================================
// CABEÇALHO DE NOVA PÁGINA
// ================================

function adicionarCabecalhoPagina(pdf) {

    pdf.setFillColor(
        17,
        17,
        17
    );

    pdf.rect(
        0,
        0,
        210,
        32,
        "F"
    );


    pdf.setTextColor(
        255,
        255,
        255
    );

    pdf.setFont(
        "helvetica",
        "bold"
    );

    pdf.setFontSize(14);

    pdf.text(
        "LR MULTI SERVICES",
        20,
        20
    );


    pdf.setTextColor(
        0,
        0,
        0
    );

}



// ================================
// RODAPÉ
// ================================

function adicionarRodape(pdf) {

    const altura =
        pdf.internal.pageSize.getHeight();


    pdf.setDrawColor(
        220,
        220,
        220
    );


    pdf.line(
        20,
        altura - 20,
        190,
        altura - 20
    );


    pdf.setFont(
        "helvetica",
        "normal"
    );

    pdf.setFontSize(8);


    pdf.setTextColor(
        120,
        120,
        120
    );


    pdf.text(
        "LR Multi Services • Orçamento de construção civil",
        20,
        altura - 12
    );


    pdf.text(
        `Página ${pdf.internal.getNumberOfPages()}`,
        170,
        altura - 12
    );


    pdf.setTextColor(
        0,
        0,
        0
    );

}



// ================================
// EXCLUIR ORÇAMENTO
// ================================

async function excluirOrcamento(index) {

    const confirmar = await mostrarConfirmacao(
        "Tem certeza que deseja excluir este orçamento?",
        "Excluir orçamento?",
        "Excluir"
    );

    if (confirmar) {

        orcamentos.splice(
            index,
            1
        );


        localStorage.setItem(
            "orcamentos",
            JSON.stringify(orcamentos)
        );


        atualizarHistorico();

        atualizarContadores();


        alert(
            "Orçamento excluído com sucesso!"
        );

    }

}



// ================================
// FORMATAÇÃO DE MOEDA
// ================================

function formatarMoeda(valor) {

    return valor.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}



// ================================
// INICIALIZAÇÃO
// ================================

atualizarClientes();

atualizarHistorico();

atualizarContadores();