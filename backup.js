// ================================
// BACKUP DOS DADOS
// ================================

const btnExportarBackup = document.querySelector("#btn-exportar-backup");
const inputImportarBackup = document.querySelector("#input-importar-backup");

// Exportar clientes e orçamentos para um arquivo JSON.
btnExportarBackup.addEventListener("click", function () {
    const backup = {
        sistema: "Sistema de Orçamentos",
        versao: 1,
        dataBackup: new Date().toISOString(),
        clientes: JSON.parse(localStorage.getItem("clientes")) || [],
        orcamentos: JSON.parse(localStorage.getItem("orcamentos")) || []
    };

    const conteudo = JSON.stringify(backup, null, 4);
    const arquivo = new Blob([conteudo], {
        type: "application/json"
    });

    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");

    const data = new Date().toLocaleDateString("pt-BR")
        .replaceAll("/", "-");

    link.href = url;
    link.download = `backup-orcamentos-${data}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    alert("Backup exportado com sucesso!");
});

// Importar um backup existente.
inputImportarBackup.addEventListener("change", function (event) {
    const arquivo = event.target.files[0];

    if (!arquivo) {
        return;
    }

    const leitor = new FileReader();

    leitor.onload = async function (e) {
        try {
            const backup = JSON.parse(e.target.result);

            if (
                !backup ||
                !Array.isArray(backup.clientes) ||
                !Array.isArray(backup.orcamentos)
            ) {
                throw new Error("Formato inválido");
            }

            const confirmar = await mostrarConfirmacao(
                "Importar este backup vai substituir os clientes e orçamentos atuais.",
                "Importar backup?",
                "Importar"
            );

            if (!confirmar) {
                inputImportarBackup.value = "";
                return;
            }

            localStorage.setItem(
                "clientes",
                JSON.stringify(backup.clientes)
            );

            localStorage.setItem(
                "orcamentos",
                JSON.stringify(backup.orcamentos)
            );

            alert(
                "Backup importado com sucesso! A página será atualizada."
            );

            location.reload();

        } catch (erro) {
            alert(
                "Não foi possível importar o backup. Verifique se o arquivo é válido."
            );

            console.error("Erro ao importar backup:", erro);
        }

        inputImportarBackup.value = "";
    };

    leitor.readAsText(arquivo);
});
