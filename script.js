// ============================================================
// LR MULTI SERVICES - SISTEMA DE ORÇAMENTOS
// Estrutura por ambiente + compatibilidade com orçamentos antigos
// ============================================================

const LOGIN_USUARIO = "admin";
const LOGIN_SENHA = "LR2026";

// ============================================================
// UTILITÁRIOS
// ============================================================

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function escaparHTML(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function textoComQuebra(valor) {
    return escaparHTML(valor).replace(/\n/g, "<br>");
}

function calcularTotalItem(item) {
    if (String(item.unidade).toLowerCase() === "empreitada") {
        return Number(item.valor || 0);
    }

    return Number(item.quantidade || 0) * Number(item.valor || 0);
}

function obterAmbientes(orcamento) {
    if (Array.isArray(orcamento.ambientes) && orcamento.ambientes.length) {
        return orcamento.ambientes;
    }

    // Compatibilidade com orçamentos antigos que tinham apenas "itens".
    if (Array.isArray(orcamento.itens) && orcamento.itens.length) {
        return [{
            nome: "Serviços gerais",
            itens: orcamento.itens.map(item => ({
                ...item,
                total: Number(item.total ?? calcularTotalItem(item))
            })),
            total: Number(
                orcamento.total ||
                orcamento.itens.reduce(
                    (soma, item) => soma + calcularTotalItem(item),
                    0
                )
            )
        }];
    }

    return [];
}

function calcularTotalAmbiente(ambiente) {
    return (ambiente.itens || []).reduce(
        (total, item) => total + calcularTotalItem(item),
        0
    );
}

function calcularTotalOrcamento(orcamento) {
    return obterAmbientes(orcamento).reduce(
        (total, ambiente) => total + calcularTotalAmbiente(ambiente),
        0
    );
}

function salvarOrcamentos() {
    localStorage.setItem("orcamentos", JSON.stringify(orcamentos));
}

// ============================================================
// LOGIN
// ============================================================

const telaLogin = document.querySelector("#tela-login");
const app = document.querySelector("#app");
const formularioLogin = document.querySelector("#form-login");
const erroLogin = document.querySelector("#login-erro");
const botaoSair = document.querySelector("#btn-sair");

function verificarLogin() {
    const logado =
        sessionStorage.getItem("lrMultiServicesLogado") === "true";

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

    const usuario = document
        .querySelector("#login-usuario")
        .value
        .trim();

    const senha = document.querySelector("#login-senha").value;

    if (
        usuario === LOGIN_USUARIO &&
        senha === LOGIN_SENHA
    ) {
        sessionStorage.setItem(
            "lrMultiServicesLogado",
            "true"
        );

        erroLogin.textContent = "";
        formularioLogin.reset();
        verificarLogin();
    } else {
        erroLogin.textContent =
            "Usuário ou senha incorretos.";
    }
});

botaoSair.addEventListener("click", function () {
    sessionStorage.removeItem(
        "lrMultiServicesLogado"
    );

    verificarLogin();
});

// ============================================================
// MODAL DE CONFIRMAÇÃO
// ============================================================

const modalConfirmacao =
    document.querySelector("#modal-confirmacao");

const modalTitulo =
    document.querySelector("#modal-titulo");

const modalMensagem =
    document.querySelector("#modal-mensagem");

const modalCancelar =
    document.querySelector("#modal-cancelar");

const modalConfirmar =
    document.querySelector("#modal-confirmar");

let resolverConfirmacao = null;

function mostrarConfirmacao(
    mensagem,
    titulo = "Confirmar ação",
    textoBotao = "Confirmar"
) {
    return new Promise(function (resolve) {
        resolverConfirmacao = resolve;

        modalTitulo.textContent = titulo;
        modalMensagem.textContent = mensagem;
        modalConfirmar.textContent = textoBotao;

        modalConfirmacao.classList.add("ativo");

        modalConfirmacao.setAttribute(
            "aria-hidden",
            "false"
        );

        setTimeout(
            () => modalConfirmar.focus(),
            50
        );
    });
}

function fecharConfirmacao(resultado) {
    if (resolverConfirmacao) {
        resolverConfirmacao(resultado);
        resolverConfirmacao = null;
    }

    modalConfirmacao.classList.remove("ativo");

    modalConfirmacao.setAttribute(
        "aria-hidden",
        "true"
    );
}

modalCancelar.addEventListener(
    "click",
    () => fecharConfirmacao(false)
);

modalConfirmar.addEventListener(
    "click",
    () => fecharConfirmacao(true)
);

modalConfirmacao.addEventListener(
    "click",
    event => {
        if (event.target === modalConfirmacao) {
            fecharConfirmacao(false);
        }
    }
);

// ============================================================
// CLIENTES
// ============================================================

let clientes =
    JSON.parse(localStorage.getItem("clientes")) || [];

let orcamentos =
    JSON.parse(localStorage.getItem("orcamentos")) || [];

const formularioCliente =
    document.querySelector("#form-cliente");

const totalClientes =
    document.querySelector("#total-clientes");

const listaClientes =
    document.querySelector("#lista-clientes");

const clienteOrcamento =
    document.querySelector("#cliente-orcamento");

formularioCliente.addEventListener(
    "submit",
    function (event) {
        event.preventDefault();

        const cliente = {
            nome: document
                .querySelector("#nome")
                .value
                .trim(),

            telefone: document
                .querySelector("#telefone")
                .value
                .trim(),

            email: document
                .querySelector("#email")
                .value
                .trim()
        };

        if (!cliente.nome || !cliente.telefone) {
            alert(
                "Preencha o nome e o telefone do cliente."
            );
            return;
        }

        clientes.push(cliente);

        localStorage.setItem(
            "clientes",
            JSON.stringify(clientes)
        );

        atualizarClientes();

        formularioCliente.reset();

        alert(
            "Cliente cadastrado com sucesso!"
        );
    }
);

function atualizarClientes() {
    totalClientes.textContent = clientes.length;

    listaClientes.innerHTML = "";

    clienteOrcamento.innerHTML =
        `<option value="">Selecione um cliente</option>`;

    clientes.forEach(function (cliente, index) {
        const linha =
            document.createElement("tr");

        linha.innerHTML = `
            <td>${escaparHTML(cliente.nome)}</td>

            <td>${escaparHTML(
                cliente.telefone
            )}</td>

            <td>${escaparHTML(
                cliente.email || "Não informado"
            )}</td>

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

        const opcao =
            document.createElement("option");

        opcao.value = index;
        opcao.textContent = cliente.nome;

        clienteOrcamento.appendChild(opcao);
    });
}

function editarCliente(index) {
    const cliente = clientes[index];

    if (!cliente) return;

    document.querySelector("#nome").value =
        cliente.nome || "";

    document.querySelector("#telefone").value =
        cliente.telefone || "";

    document.querySelector("#email").value =
        cliente.email || "";

    clientes.splice(index, 1);

    localStorage.setItem(
        "clientes",
        JSON.stringify(clientes)
    );

    atualizarClientes();

    window.scrollTo({
        top:
            document.querySelector(".clientes")
                .offsetTop - 20,

        behavior: "smooth"
    });
}

async function excluirCliente(index) {
    const confirmar =
        await mostrarConfirmacao(
            "Tem certeza que deseja excluir este cliente?",
            "Excluir cliente?",
            "Excluir"
        );

    if (!confirmar) return;

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

// ============================================================
// NOVO ORÇAMENTO - AMBIENTES
// ============================================================

let ambientesOrcamento = [];
let itensAmbienteRascunho = [];

const formularioItemAmbiente =
    document.querySelector(
        "#form-item-ambiente"
    );

const listaItensAmbienteRascunho =
    document.querySelector(
        "#itens-ambiente-rascunho"
    );

const listaAmbientes =
    document.querySelector(
        "#lista-ambientes"
    );

const valorTotal =
    document.querySelector("#valor-total");

const unidadeCampo =
    document.querySelector("#unidade");

const campoQuantidade =
    document.querySelector("#campo-quantidade");

const btnLimparItem =
    document.querySelector(
        "#btn-limpar-item"
    );

const btnAdicionarAmbiente =
    document.querySelector(
        "#btn-adicionar-ambiente"
    );

const btnFinalizar =
    document.querySelector(
        "#btn-finalizar-orcamento"
    );

function atualizarCampoQuantidade() {
    const empreitada =
        unidadeCampo.value === "empreitada";

    campoQuantidade.style.display =
        empreitada ? "none" : "block";

    if (empreitada) {
        document.querySelector(
            "#quantidade"
        ).value = 1;
    }
}

unidadeCampo.addEventListener(
    "change",
    atualizarCampoQuantidade
);

function limparFormularioItem() {
    document.querySelector(
        "#descricao-item"
    ).value = "";

    document.querySelector(
        "#unidade"
    ).value = "empreitada";

    document.querySelector(
        "#quantidade"
    ).value = 1;

    document.querySelector(
        "#valor"
    ).value = "";

    document.querySelector(
        "#especificacoes-item"
    ).value = "";

    atualizarCampoQuantidade();
}

btnLimparItem.addEventListener(
    "click",
    limparFormularioItem
);

formularioItemAmbiente.addEventListener(
    "submit",
    function (event) {
        event.preventDefault();

        const nomeAmbiente =
            document.querySelector(
                "#nome-ambiente"
            ).value.trim();

        const descricao =
            document.querySelector(
                "#descricao-item"
            ).value.trim();

        const unidade =
            document.querySelector(
                "#unidade"
            ).value;

        const quantidade =
            Number(
                document.querySelector(
                    "#quantidade"
                ).value || 1
            );

        const valor =
            Number(
                document.querySelector(
                    "#valor"
                ).value
            );

        const especificacoes =
            document.querySelector(
                "#especificacoes-item"
            ).value.trim();

        if (!nomeAmbiente) {
            alert(
                "Informe o nome do ambiente."
            );
            return;
        }

        // Para Empreitada, "Empreitada" pode ser
        // usada como descrição automaticamente.
        const descricaoFinal =
            descricao ||
            (
                unidade === "empreitada"
                    ? "Empreitada"
                    : ""
            );

        if (!descricaoFinal) {
            alert(
                "Informe o serviço ou descrição do item."
            );
            return;
        }

        if (
            !Number.isFinite(valor) ||
            valor < 0
        ) {
            alert(
                "Informe um valor válido."
            );
            return;
        }

        if (
            unidade !== "empreitada" &&
            (
                !Number.isFinite(quantidade) ||
                quantidade <= 0
            )
        ) {
            alert(
                "Informe uma quantidade válida."
            );
            return;
        }

        const item = {
            descricao: descricaoFinal,
            unidade,

            quantidade:
                unidade === "empreitada"
                    ? 1
                    : quantidade,

            valor,

            especificacoes,

            total:
                unidade === "empreitada"
                    ? valor
                    : quantidade * valor
        };

        itensAmbienteRascunho.push(item);

        renderizarItensAmbienteRascunho();

        limparFormularioItem();
    }
);

function renderizarItensAmbienteRascunho() {
    if (!itensAmbienteRascunho.length) {
        listaItensAmbienteRascunho.innerHTML =
            "";

        return;
    }

    const nomeAmbiente =
        document
            .querySelector("#nome-ambiente")
            .value
            .trim() ||
        "Ambiente atual";

    listaItensAmbienteRascunho.innerHTML = `
        <div class="ambiente-rascunho">

            <div class="ambiente-cabecalho">
                <div>
                    <strong>
                        ${escaparHTML(nomeAmbiente)}
                    </strong>

                    <small>
                        ${
                            itensAmbienteRascunho.length
                        }
                        item(ns) aguardando
                        adição ao orçamento
                    </small>
                </div>

                <div class="ambiente-subtotal">
                    ${
                        formatarMoeda(
                            itensAmbienteRascunho.reduce(
                                (soma, item) =>
                                    soma + item.total,
                                0
                            )
                        )
                    }
                </div>
            </div>

            <div class="lista-itens-ambiente">

                <table class="mini-tabela">

                    <thead>
                        <tr>
                            <th>Serviço</th>
                            <th>Cobrança</th>
                            <th>Qtd.</th>
                            <th>Valor</th>
                            <th>Total</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>

                        ${
                            itensAmbienteRascunho
                                .map(
                                    (item, index) => `
                            <tr>

                                <td>
                                    ${escaparHTML(
                                        item.descricao
                                    )}

                                    ${
                                        item.especificacoes
                                            ? `
                                        <br>
                                        <small>
                                            ${textoComQuebra(
                                                item.especificacoes
                                            )}
                                        </small>
                                    `
                                            : ""
                                    }
                                </td>

                                <td>
                                    ${escaparHTML(
                                        item.unidade
                                    )}
                                </td>

                                <td>
                                    ${
                                        item.unidade ===
                                        "empreitada"
                                            ? "—"
                                            : item.quantidade
                                    }
                                </td>

                                <td>
                                    ${formatarMoeda(
                                        item.valor
                                    )}
                                </td>

                                <td>
                                    ${formatarMoeda(
                                        item.total
                                    )}
                                </td>

                                <td>
                                    <button
                                        type="button"
                                        class="btn-excluir"
                                        onclick="excluirItemRascunho(${index})"
                                    >
                                        Excluir
                                    </button>
                                </td>

                            </tr>
                        `
                                )
                                .join("")
                        }

                    </tbody>

                </table>

            </div>

        </div>
    `;
}

function excluirItemRascunho(index) {
    itensAmbienteRascunho.splice(
        index,
        1
    );

    renderizarItensAmbienteRascunho();
}

// Se o usuário alterar o nome depois de
// adicionar itens, o rascunho acompanha o nome.
document
    .querySelector("#nome-ambiente")
    .addEventListener(
        "input",
        renderizarItensAmbienteRascunho
    );

btnAdicionarAmbiente.addEventListener(
    "click",
    function () {
        const nome =
            document
                .querySelector("#nome-ambiente")
                .value
                .trim();

        if (!nome) {
            alert(
                "Informe o nome do ambiente."
            );
            return;
        }

        if (!itensAmbienteRascunho.length) {
            alert(
                "Adicione pelo menos um item ao ambiente antes de salvá-lo."
            );
            return;
        }

        const ambiente = {
            nome,

            itens:
                itensAmbienteRascunho.map(
                    item => ({ ...item })
                ),

            total:
                itensAmbienteRascunho.reduce(
                    (soma, item) =>
                        soma + item.total,
                    0
                )
        };

        ambientesOrcamento.push(
            ambiente
        );

        itensAmbienteRascunho = [];

        document.querySelector(
            "#nome-ambiente"
        ).value = "";

        limparFormularioItem();

        renderizarItensAmbienteRascunho();
        renderizarAmbientes();
    }
);

function renderizarAmbientes() {
    if (!ambientesOrcamento.length) {
        listaAmbientes.innerHTML =
            `<div class="sem-ambientes">
                Nenhum ambiente adicionado ainda.
            </div>`;

        atualizarTotalTela();

        return;
    }

    listaAmbientes.innerHTML =
        ambientesOrcamento
            .map(
                (
                    ambiente,
                    ambienteIndex
                ) => {
                    const total =
                        calcularTotalAmbiente(
                            ambiente
                        );

                    return `
            <div class="ambiente-card">

                <div class="ambiente-cabecalho">

                    <div>
                        <strong>
                            ${escaparHTML(
                                ambiente.nome
                            )}
                        </strong>

                        <small>
                            ${
                                ambiente.itens.length
                            }
                            item(ns)
                        </small>
                    </div>

                    <div class="ambiente-subtotal">
                        Subtotal:
                        ${formatarMoeda(total)}
                    </div>

                </div>

                <div class="lista-itens-ambiente">

                    <table class="mini-tabela">

                        <thead>
                            <tr>
                                <th>Serviço</th>
                                <th>Cobrança</th>
                                <th>Qtd.</th>
                                <th>Valor</th>
                                <th>Total</th>
                            </tr>
                        </thead>

                        <tbody>

                            ${
                                ambiente.itens
                                    .map(
                                        item => `
                                <tr>

                                    <td>
                                        ${escaparHTML(
                                            item.descricao
                                        )}

                                        ${
                                            item.especificacoes
                                                ? `
                                            <br>
                                            <small>
                                                ${textoComQuebra(
                                                    item.especificacoes
                                                )}
                                            </small>
                                        `
                                                : ""
                                        }
                                    </td>

                                    <td>
                                        ${escaparHTML(
                                            item.unidade
                                        )}
                                    </td>

                                    <td>
                                        ${
                                            item.unidade ===
                                            "empreitada"
                                                ? "—"
                                                : item.quantidade
                                        }
                                    </td>

                                    <td>
                                        ${formatarMoeda(
                                            item.valor
                                        )}
                                    </td>

                                    <td>
                                        ${formatarMoeda(
                                            item.total
                                        )}
                                    </td>

                                </tr>
                            `
                                    )
                                    .join("")
                            }

                        </tbody>

                    </table>

                </div>

                <div class="acoes-ambiente">

                    <button
                        type="button"
                        class="btn-excluir"
                        onclick="excluirAmbiente(${ambienteIndex})"
                    >
                        Excluir ambiente
                    </button>

                </div>

            </div>
        `;
                }
            )
            .join("");

    atualizarTotalTela();
}

async function excluirAmbiente(index) {
    const ambiente =
        ambientesOrcamento[index];

    if (!ambiente) return;

    const confirmar =
        await mostrarConfirmacao(
            `Excluir o ambiente "${ambiente.nome}" e todos os seus itens?`,
            "Excluir ambiente?",
            "Excluir"
        );

    if (!confirmar) return;

    ambientesOrcamento.splice(
        index,
        1
    );

    renderizarAmbientes();
}

function atualizarTotalTela() {
    const total =
        ambientesOrcamento.reduce(
            (soma, ambiente) =>
                soma +
                calcularTotalAmbiente(
                    ambiente
                ),
            0
        );

    valorTotal.textContent =
        formatarMoeda(total);
}

function limparFormularioOrcamento() {
    ambientesOrcamento = [];
    itensAmbienteRascunho = [];

    document.querySelector(
        "#cliente-orcamento"
    ).value = "";

    document.querySelector(
        "#tipo-orcamento"
    ).value = "";

    document.querySelector(
        "#descricao-geral"
    ).value = "";

    document.querySelector(
        "#forma-pagamento"
    ).value = "";

    document.querySelector(
        "#prazo-execucao"
    ).value = "";

    document.querySelector(
        "#especificacoes-gerais"
    ).value = "";

    document.querySelector(
        "#observacoes"
    ).value = "";

    document.querySelector(
        "#nome-ambiente"
    ).value = "";

    limparFormularioItem();

    renderizarItensAmbienteRascunho();
    renderizarAmbientes();
}

btnFinalizar.addEventListener(
    "click",
    function () {
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

        if (!ambientesOrcamento.length) {
            alert(
                "Adicione pelo menos um ambiente ao orçamento."
            );
            return;
        }

        if (itensAmbienteRascunho.length) {
            alert(
                "Você adicionou itens a um ambiente, mas ainda não salvou esse ambiente. Clique em 'Adicionar ambiente ao orçamento'."
            );
            return;
        }

        const cliente =
            clientes[
                Number(clienteIndex)
            ];

        if (!cliente) {
            alert(
                "Cliente não encontrado."
            );
            return;
        }

        const total =
            ambientesOrcamento.reduce(
                (soma, ambiente) =>
                    soma +
                    calcularTotalAmbiente(
                        ambiente
                    ),
                0
            );

        const orcamento = {
            cliente: {
                ...cliente
            },

            tipoOrcamento:
                document
                    .querySelector(
                        "#tipo-orcamento"
                    )
                    .value
                    .trim(),

            descricaoGeral:
                document
                    .querySelector(
                        "#descricao-geral"
                    )
                    .value
                    .trim(),

            ambientes:
                ambientesOrcamento.map(
                    ambiente => ({
                        nome:
                            ambiente.nome,

                        itens:
                            ambiente.itens.map(
                                item => ({
                                    ...item,
                                    total:
                                        calcularTotalItem(
                                            item
                                        )
                                })
                            ),

                        total:
                            calcularTotalAmbiente(
                                ambiente
                            )
                    })
                ),

            especificacoesGerais:
                document
                    .querySelector(
                        "#especificacoes-gerais"
                    )
                    .value
                    .trim(),

            formaPagamento:
                document
                    .querySelector(
                        "#forma-pagamento"
                    )
                    .value
                    .trim(),

            prazoExecucao:
                document
                    .querySelector(
                        "#prazo-execucao"
                    )
                    .value
                    .trim(),

            observacoes:
                document
                    .querySelector(
                        "#observacoes"
                    )
                    .value
                    .trim(),

            total,

            status: "Pendente",

            data:
                new Date().toLocaleDateString(
                    "pt-BR"
                )
        };

        orcamentos.push(
            orcamento
        );

        salvarOrcamentos();
        atualizarHistorico();
        atualizarContadores();

        limparFormularioOrcamento();

        alert(
            "Orçamento finalizado com sucesso!"
        );
    }
);

// ============================================================
// HISTÓRICO
// ============================================================

const totalOrcamentos =
    document.querySelector(
        "#total-orcamentos"
    );

const listaOrcamentos =
    document.querySelector(
        "#lista-orcamentos"
    );

const totalPendentes =
    document.querySelector(
        "#total-pendentes"
    );

const totalAprovados =
    document.querySelector(
        "#total-aprovados"
    );

const totalRecusados =
    document.querySelector(
        "#total-recusados"
    );

function atualizarHistorico() {
    listaOrcamentos.innerHTML = "";

    orcamentos.forEach(
        function (orcamento, index) {
            const totalAtual =
                calcularTotalOrcamento(
                    orcamento
                );

            orcamento.total =
                totalAtual;

            const clienteNome =
                orcamento.cliente?.nome ||
                "Cliente não informado";

            const linha =
                document.createElement("tr");

            linha.innerHTML = `
                <td>
                    ${escaparHTML(
                        clienteNome
                    )}
                </td>

                <td>
                    ${escaparHTML(
                        orcamento.data || "—"
                    )}
                </td>

                <td>
                    ${formatarMoeda(
                        totalAtual
                    )}
                </td>

                <td
                    class="status-${String(
                        orcamento.status ||
                        "Pendente"
                    ).toLowerCase()}"
                >
                    ${escaparHTML(
                        orcamento.status ||
                        "Pendente"
                    )}
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

            listaOrcamentos.appendChild(
                linha
            );
        }
    );

    salvarOrcamentos();
}

function alterarStatus(index) {
    const orcamento =
        orcamentos[index];

    if (!orcamento) return;

    if (
        orcamento.status ===
        "Pendente"
    ) {
        orcamento.status =
            "Aprovado";
    } else if (
        orcamento.status ===
        "Aprovado"
    ) {
        orcamento.status =
            "Recusado";
    } else {
        orcamento.status =
            "Pendente";
    }

    salvarOrcamentos();

    atualizarHistorico();
    atualizarContadores();
}

function atualizarContadores() {
    totalOrcamentos.textContent =
        orcamentos.length;

    totalPendentes.textContent =
        orcamentos.filter(
            o => o.status === "Pendente"
        ).length;

    totalAprovados.textContent =
        orcamentos.filter(
            o => o.status === "Aprovado"
        ).length;

    totalRecusados.textContent =
        orcamentos.filter(
            o => o.status === "Recusado"
        ).length;
}

// ============================================================
// VISUALIZAR ORÇAMENTO
// ============================================================

const modalVisualizacao =
    document.querySelector(
        "#modal-visualizacao"
    );

const visualizacaoTitulo =
    document.querySelector(
        "#visualizacao-titulo"
    );

const visualizacaoSubtitulo =
    document.querySelector(
        "#visualizacao-subtitulo"
    );

const visualizacaoConteudo =
    document.querySelector(
        "#visualizacao-conteudo"
    );

const fecharVisualizacao =
    document.querySelector(
        "#fechar-visualizacao"
    );

function abrirVisualizacao() {
    modalVisualizacao.classList.add(
        "ativo"
    );

    modalVisualizacao.setAttribute(
        "aria-hidden",
        "false"
    );
}

function fecharModalVisualizacao() {
    modalVisualizacao.classList.remove(
        "ativo"
    );

    modalVisualizacao.setAttribute(
        "aria-hidden",
        "true"
    );
}

fecharVisualizacao.addEventListener(
    "click",
    fecharModalVisualizacao
);

modalVisualizacao.addEventListener(
    "click",
    event => {
        if (
            event.target ===
            modalVisualizacao
        ) {
            fecharModalVisualizacao();
        }
    }
);

document.addEventListener(
    "keydown",
    event => {
        if (event.key === "Escape") {
            if (
                modalVisualizacao.classList.contains(
                    "ativo"
                )
            ) {
                fecharModalVisualizacao();
            }

            if (
                modalConfirmacao.classList.contains(
                    "ativo"
                )
            ) {
                fecharConfirmacao(false);
            }
        }
    }
);

function visualizarOrcamento(index) {
    const orcamento =
        orcamentos[index];

    if (!orcamento) return;

    const ambientes =
        obterAmbientes(
            orcamento
        );

    const total =
        calcularTotalOrcamento(
            orcamento
        );

    visualizacaoTitulo.textContent =
        `Orçamento Nº ${String(
            index + 1
        ).padStart(4, "0")}`;

    visualizacaoSubtitulo.textContent =
        `${
            orcamento.cliente?.nome ||
            "Cliente não informado"
        } • ${
            orcamento.data || ""
        } • ${
            orcamento.status ||
            "Pendente"
        }`;

    let html = "";

    if (orcamento.tipoOrcamento) {
        html += `
            <p>
                <strong>Tipo:</strong>
                ${escaparHTML(
                    orcamento.tipoOrcamento
                )}
            </p>
        `;
    }

    if (orcamento.descricaoGeral) {
        html += `
            <div>
                <strong>
                    Descrição geral
                </strong>

                <p>
                    ${textoComQuebra(
                        orcamento.descricaoGeral
                    )}
                </p>
            </div>
        `;
    }

    ambientes.forEach(
        ambiente => {
            html += `
                <div class="visualizacao-ambiente">

                    <div class="ambiente-cabecalho">

                        <h4>
                            ${escaparHTML(
                                ambiente.nome
                            )}
                        </h4>

                        <strong>
                            ${formatarMoeda(
                                calcularTotalAmbiente(
                                    ambiente
                                )
                            )}
                        </strong>

                    </div>

                    <div class="lista-itens-ambiente">

                        <table class="mini-tabela">

                            <thead>
                                <tr>
                                    <th>Serviço</th>
                                    <th>Cobrança</th>
                                    <th>Qtd.</th>
                                    <th>Valor</th>
                                    <th>Total</th>
                                </tr>
                            </thead>

                            <tbody>

                                ${
                                    ambiente.itens
                                        .map(
                                            item => `
                                    <tr>

                                        <td>

                                            ${escaparHTML(
                                                item.descricao
                                            )}

                                            ${
                                                item.especificacoes
                                                    ? `
                                                <br>
                                                <small>
                                                    ${textoComQuebra(
                                                        item.especificacoes
                                                    )}
                                                </small>
                                            `
                                                    : ""
                                            }

                                        </td>

                                        <td>
                                            ${escaparHTML(
                                                item.unidade
                                            )}
                                        </td>

                                        <td>
                                            ${
                                                item.unidade ===
                                                "empreitada"
                                                    ? "—"
                                                    : item.quantidade
                                            }
                                        </td>

                                        <td>
                                            ${formatarMoeda(
                                                item.valor
                                            )}
                                        </td>

                                        <td>
                                            ${formatarMoeda(
                                                calcularTotalItem(
                                                    item
                                                )
                                            )}
                                        </td>

                                    </tr>
                                `
                                        )
                                        .join("")
                                }

                            </tbody>

                        </table>

                    </div>

                </div>
            `;
        }
    );

    const extras = [
        [
            "Forma de pagamento",
            orcamento.formaPagamento
        ],

        [
            "Prazo de execução",
            orcamento.prazoExecucao
        ],

        [
            "Especificações gerais",
            orcamento.especificacoesGerais
        ],

        [
            "Observações",
            orcamento.observacoes
        ]
    ];

    extras.forEach(
        ([titulo, valor]) => {
            if (valor) {
                html += `
                    <div
                        style="margin:14px 0;"
                    >
                        <strong>
                            ${titulo}
                        </strong>

                        <p>
                            ${textoComQuebra(
                                valor
                            )}
                        </p>
                    </div>
                `;
            }
        }
    );

    html += `
        <div class="visualizacao-total">
            <span>
                Total geral
            </span>

            <strong>
                ${formatarMoeda(total)}
            </strong>
        </div>
    `;

    visualizacaoConteudo.innerHTML =
        html;

    abrirVisualizacao();
}

// ============================================================
// PDF
// ============================================================

let logoPDF = null;

function carregarLogoPDF() {
    return new Promise(
        function (resolve) {
            if (logoPDF) {
                resolve(logoPDF);
                return;
            }

            const imagem =
                new Image();

            imagem.onload =
                function () {
                    const canvas =
                        document.createElement(
                            "canvas"
                        );

                    const contexto =
                        canvas.getContext(
                            "2d"
                        );

                    canvas.width =
                        imagem.naturalWidth;

                    canvas.height =
                        imagem.naturalHeight;

                    contexto.drawImage(
                        imagem,
                        0,
                        0
                    );

                    logoPDF =
                        canvas.toDataURL(
                            "image/png"
                        );

                    resolve(
                        logoPDF
                    );
                };

            imagem.onerror =
                () => resolve(null);

            imagem.src =
                "logo.png";
        }
    );
}

function adicionarCabecalhoPagina(
    pdf
) {
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
        `Página ${
            pdf.internal.getNumberOfPages()
        }`,
        170,
        altura - 12
    );

    pdf.setTextColor(
        0,
        0,
        0
    );
}

function textoPDFQuebrado(
    pdf,
    texto,
    largura,
    tamanho = 9
) {
    pdf.setFontSize(
        tamanho
    );

    return pdf.splitTextToSize(
        String(texto || ""),
        largura
    );
}

async function gerarPDF(index) {
    const orcamento =
        orcamentos[index];

    if (!orcamento) {
        alert(
            "Orçamento não encontrado."
        );
        return;
    }

    if (!window.jspdf) {
        alert(
            "Não foi possível carregar o gerador de PDF. Verifique sua conexão e tente novamente."
        );
        return;
    }

    const {
        jsPDF
    } = window.jspdf;

    const pdf =
        new jsPDF();

    const logo =
        await carregarLogoPDF();

    const margem = 20;
    const larguraConteudo = 170;

    const ambientes =
        obterAmbientes(
            orcamento
        );

    const totalGeral =
        calcularTotalOrcamento(
            orcamento
        );

    // Cabeçalho
    pdf.setFillColor(
        17,
        17,
        17
    );

    pdf.rect(
        0,
        0,
        210,
        44,
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
            5,
            45,
            30
        );
    }

    pdf.setFont(
        "helvetica",
        "bold"
    );

    pdf.setFontSize(19);

    pdf.text(
        "ORÇAMENTO",
        75,
        19
    );

    pdf.setFont(
        "helvetica",
        "normal"
    );

    pdf.setFontSize(9);

    pdf.text(
        "LR MULTI SERVICES",
        75,
        29
    );

    pdf.setFont(
        "helvetica",
        "bold"
    );

    pdf.setFontSize(10);

    pdf.text(
        `Nº ${String(
            index + 1
        ).padStart(4, "0")}`,
        158,
        18
    );

    pdf.setFont(
        "helvetica",
        "normal"
    );

    pdf.text(
        `Data: ${
            orcamento.data || ""
        }`,
        158,
        28
    );

    pdf.setTextColor(
        0,
        0,
        0
    );

    let y = 60;

    function garantirEspaco(
        necessario = 20
    ) {
        if (
            y + necessario >
            275
        ) {
            adicionarRodape(
                pdf
            );

            pdf.addPage();

            adicionarCabecalhoPagina(
                pdf
            );

            y = 48;
        }
    }

    function adicionarTitulo(
        titulo
    ) {
        garantirEspaco(
            16
        );

        pdf.setFont(
            "helvetica",
            "bold"
        );

        pdf.setFontSize(
            12
        );

        pdf.setTextColor(
            25,
            25,
            25
        );

        pdf.text(
            titulo,
            margem,
            y
        );

        y += 7;

        pdf.setDrawColor(
            225,
            225,
            225
        );

        pdf.line(
            margem,
            y,
            190,
            y
        );

        y += 8;
    }

    // Cliente
    adicionarTitulo(
        "DADOS DO CLIENTE"
    );

    pdf.setFont(
        "helvetica",
        "bold"
    );

    pdf.setFontSize(9);

    pdf.text(
        "Nome",
        margem,
        y
    );

    pdf.text(
        "Telefone",
        105,
        y
    );

    y += 6;

    pdf.setFont(
        "helvetica",
        "normal"
    );

    pdf.text(
        String(
            orcamento.cliente?.nome ||
            "Não informado"
        ),
        margem,
        y
    );

    pdf.text(
        String(
            orcamento.cliente?.telefone ||
            "Não informado"
        ),
        105,
        y
    );

    y += 7;

    if (
        orcamento.cliente?.email
    ) {
        pdf.setFont(
            "helvetica",
            "bold"
        );

        pdf.text(
            "E-mail",
            margem,
            y
        );

        y += 6;

        pdf.setFont(
            "helvetica",
            "normal"
        );

        pdf.text(
            String(
                orcamento.cliente.email
            ),
            margem,
            y
        );

        y += 7;
    }

    if (
        orcamento.tipoOrcamento
    ) {
        pdf.setFont(
            "helvetica",
            "bold"
        );

        pdf.text(
            "Tipo de orçamento",
            margem,
            y
        );

        y += 6;

        pdf.setFont(
            "helvetica",
            "normal"
        );

        pdf.text(
            String(
                orcamento.tipoOrcamento
            ),
            margem,
            y
        );

        y += 7;
    }

    if (
        orcamento.descricaoGeral
    ) {
        adicionarTitulo(
            "DESCRIÇÃO GERAL"
        );

        pdf.setFont(
            "helvetica",
            "normal"
        );

        const linhas =
            textoPDFQuebrado(
                pdf,
                orcamento.descricaoGeral,
                larguraConteudo,
                9
            );

        linhas.forEach(
            linha => {
                garantirEspaco(
                    8
                );

                pdf.text(
                    linha,
                    margem,
                    y
                );

                y += 5;
            }
        );

        y += 3;
    }

    // Ambientes
    adicionarTitulo(
        "AMBIENTES E SERVIÇOS"
    );

    for (
        const ambiente of ambientes
    ) {
        garantirEspaco(
            30
        );

        pdf.setFillColor(
            245,
            245,
            245
        );

        pdf.roundedRect(
            margem,
            y - 5,
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

        pdf.setFontSize(
            11
        );

        pdf.setTextColor(
            25,
            25,
            25
        );

        pdf.text(
            String(
                ambiente.nome ||
                "Ambiente"
            ).toUpperCase(),
            margem + 5,
            y + 3
        );

        pdf.text(
            formatarMoeda(
                calcularTotalAmbiente(
                    ambiente
                )
            ),
            155,
            y + 3
        );

        y += 15;

        pdf.setFont(
            "helvetica",
            "bold"
        );

        pdf.setFontSize(8);

        pdf.text(
            "SERVIÇO",
            24,
            y
        );

        pdf.text(
            "COBRANÇA",
            94,
            y
        );

        pdf.text(
            "QTD.",
            125,
            y
        );

        pdf.text(
            "TOTAL",
            165,
            y
        );

        y += 5;

        pdf.setFont(
            "helvetica",
            "normal"
        );

        pdf.setFontSize(
            8.5
        );

        for (
            const item of (
                ambiente.itens ||
                []
            )
        ) {
            const linhasDescricao =
                pdf.splitTextToSize(
                    String(
                        item.descricao ||
                        ""
                    ),
                    65
                );

            const altura =
                Math.max(
                    8,
                    linhasDescricao.length *
                        4.5 +
                        (
                            item.especificacoes
                                ? 7
                                : 0
                        )
                );

            garantirEspaco(
                altura + 5
            );

            pdf.setDrawColor(
                235,
                235,
                235
            );

            pdf.line(
                margem,
                y + 2,
                190,
                y + 2
            );

            linhasDescricao.forEach(
                (
                    linha,
                    indice
                ) => {
                    pdf.text(
                        linha,
                        24,
                        y +
                            indice *
                                4.5
                    );
                }
            );

            if (
                item.especificacoes
            ) {
                pdf.setFontSize(
                    7.5
                );

                pdf.setTextColor(
                    100,
                    100,
                    100
                );

                const specs =
                    pdf.splitTextToSize(
                        String(
                            item.especificacoes
                        ),
                        65
                    );

                specs
                    .slice(0, 2)
                    .forEach(
                        (
                            linha,
                            indice
                        ) => {
                            pdf.text(
                                linha,
                                24,
                                y +
                                    linhasDescricao.length *
                                        4.5 +
                                    indice *
                                        3.5
                            );
                        }
                    );

                pdf.setTextColor(
                    25,
                    25,
                    25
                );

                pdf.setFontSize(
                    8.5
                );
            }

            pdf.text(
                String(
                    item.unidade ||
                    "un"
                ),
                94,
                y
            );

            pdf.text(
                item.unidade ===
                    "empreitada"
                    ? "—"
                    : String(
                          item.quantidade ??
                              1
                      ),
                125,
                y
            );

            pdf.text(
                formatarMoeda(
                    calcularTotalItem(
                        item
                    )
                ),
                165,
                y
            );

            y += altura;
        }

        y += 6;
    }

    // Total geral
    garantirEspaco(
        30
    );

    y += 3;

    pdf.setDrawColor(
        180,
        180,
        180
    );

    pdf.line(
        margem,
        y,
        190,
        y
    );

    y += 13;

    pdf.setFont(
        "helvetica",
        "bold"
    );

    pdf.setFontSize(
        13
    );

    pdf.text(
        "TOTAL GERAL",
        20,
        y
    );

    pdf.setFontSize(
        18
    );

    pdf.text(
        formatarMoeda(
            totalGeral
        ),
        145,
        y
    );

    y += 12;

    // Informações opcionais
    const secoes = [
        [
            "FORMA DE PAGAMENTO",
            orcamento.formaPagamento
        ],

        [
            "PRAZO DE EXECUÇÃO",
            orcamento.prazoExecucao
        ],

        [
            "ESPECIFICAÇÕES GERAIS",
            orcamento.especificacoesGerais
        ],

        [
            "OBSERVAÇÕES",
            orcamento.observacoes
        ]
    ];

    for (
        const [titulo, texto]
        of secoes
    ) {
        if (!texto) continue;

        adicionarTitulo(
            titulo
        );

        pdf.setFont(
            "helvetica",
            "normal"
        );

        pdf.setFontSize(9);

        const linhas =
            pdf.splitTextToSize(
                String(texto),
                larguraConteudo
            );

        for (
            const linha of linhas
        ) {
            garantirEspaco(
                7
            );

            pdf.text(
                linha,
                margem,
                y
            );

            y += 5;
        }

        y += 3;
    }

    // Status
    garantirEspaco(
        15
    );

    pdf.setFont(
        "helvetica",
        "bold"
    );

    pdf.setFontSize(9);

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
        String(
            orcamento.status ||
            "Pendente"
        ),
        42,
        y
    );

    adicionarRodape(
        pdf
    );

    pdf.save(
        `orcamento-${String(
            index + 1
        ).padStart(4, "0")}.pdf`
    );
}

// ============================================================
// WHATSAPP
// ============================================================

async function enviarWhatsApp(index) {
    const orcamento =
        orcamentos[index];

    if (!orcamento?.cliente) {
        alert(
            "Orçamento não encontrado."
        );
        return;
    }

    const telefone =
        String(
            orcamento.cliente.telefone ||
            ""
        ).replace(
            /\D/g,
            ""
        );

    if (!telefone) {
        alert(
            "Este cliente não possui telefone cadastrado."
        );
        return;
    }

    const janela =
        window.open(
            "about:blank",
            "_blank"
        );

    await gerarPDF(index);

    const numero =
        telefone.startsWith("55")
            ? telefone
            : `55${telefone}`;

    const mensagem =
        `Olá, ${orcamento.cliente.nome}!\n\n` +
        `Estou enviando o orçamento da LR MULTI SERVICES.\n` +
        `Valor total: ${formatarMoeda(
            calcularTotalOrcamento(
                orcamento
            )
        )}.\n\n` +
        `Nº ${String(
            index + 1
        ).padStart(4, "0")}`;

    const url =
        `https://wa.me/${numero}?text=${encodeURIComponent(
            mensagem
        )}`;

    if (janela) {
        janela.location.href =
            url;
    } else {
        window.open(
            url,
            "_blank"
        );
    }
}

// ============================================================
// EXCLUIR ORÇAMENTO
// ============================================================

async function excluirOrcamento(
    index
) {
    const confirmar =
        await mostrarConfirmacao(
            "Tem certeza que deseja excluir este orçamento?",
            "Excluir orçamento?",
            "Excluir"
        );

    if (!confirmar) return;

    orcamentos.splice(
        index,
        1
    );

    salvarOrcamentos();

    atualizarHistorico();
    atualizarContadores();

    alert(
        "Orçamento excluído com sucesso!"
    );
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================

atualizarCampoQuantidade();
atualizarClientes();
renderizarAmbientes();
atualizarHistorico();
atualizarContadores();
verificarLogin();
