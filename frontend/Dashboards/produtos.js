document.addEventListener('DOMContentLoaded', () => {
    // Proteger página - Apenas Administrador
    if (!checkAuth(['ADMINISTRADOR'])) return;

    // Configurar sidebar user info
    const user = getLoggedUser();
    document.getElementById('sidebarUserName').innerText = `${user.nome} (${user.role.toLowerCase()})`;

    carregarEstoqueProdutos();
});

async function carregarEstoqueProdutos() {
    const user = getLoggedUser();
    if (!user) return;

    try {
        const response = await fetch(API_ARMACAO);
        const produtos = await response.json();
        const tbody = document.getElementById('corpoTabela');
        tbody.innerHTML = '';

        produtos.forEach(prod => {
            const precoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prod.preco);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${prod.id}</td>
                <td>${prod.marca}</td>
                <td>${prod.modelo}</td>
                <td>${prod.cor}</td>
                <td>${prod.tamanho}</td>
                <td>${precoFormatado}</td>
                <td>${prod.quantidade}</td>
                <td>
                    <button onclick='prepararEdicaoProduto(${JSON.stringify(prod)})' class="btn-icone" title="Editar">✏️</button>
                    <button onclick="deletarProdutoEstoque(${prod.id})" class="btn-icone" title="Excluir">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Erro ao carregar estoque:", error);
    }
}

async function salvarProduto(event) {
    event.preventDefault();
    const user = getLoggedUser();
    if (!user || user.role !== 'ADMINISTRADOR') return;

    const id = document.getElementById('produtoId').value;
    
    const armacao = {
        marca: document.getElementById('inputMarca').value,
        modelo: document.getElementById('inputModelo').value,
        cor: document.getElementById('inputCor').value,
        tamanho: document.getElementById('inputTamanho').value,
        quantidade: parseInt(document.getElementById('inputEstoque').value),
        preco: parseFloat(document.getElementById('inputPreco').value),
        material: document.getElementById('inputMaterial').value,
        tipo: document.getElementById('inputTipo').value,
        imagemUrl: document.getElementById('inputImagemUrl').value,
        descricao: document.getElementById('inputDescricao').value
    };

    const metodo = id ? 'PUT' : 'POST';
    const urlFinal = id ? `${API_ARMACAO}/${id}` : API_ARMACAO;

    try {
        const response = await fetch(urlFinal, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(armacao)
        });

        if (response.ok) {
            fecharModalProduto();
            carregarEstoqueProdutos(); 
        } else {
            const erro = await response.text();
            alert("Atenção: " + erro);
        }
    } catch (error) {
        console.error("Erro ao salvar produto:", error);
    }
}

async function deletarProdutoEstoque(id) {
    const user = getLoggedUser();
    if (!user || user.role !== 'ADMINISTRADOR') return;

    if (confirm('Tem certeza que deseja excluir esta armação?')) {
        try {
            const response = await fetch(`${API_ARMACAO}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (response.ok) {
                carregarEstoqueProdutos();
            } else {
                const erro = await response.text();
                alert("Erro ao excluir: " + erro);
            }
        } catch (e) {
            console.error(e);
        }
    }
}

function abrirModalProduto() {
    document.getElementById('formProduto').reset();
    document.getElementById('produtoId').value = '';
    document.getElementById('modalTitulo').innerText = 'Adicionar produto';
    document.getElementById('btnSalvar').innerText = 'Salvar produto';
    document.getElementById('modalProduto').style.display = 'flex';
}

function fecharModalProduto() {
    document.getElementById('modalProduto').style.display = 'none';
}

window.prepararEdicaoProduto = function(prod) {
    document.getElementById('produtoId').value = prod.id;
    document.getElementById('inputMarca').value = prod.marca;
    document.getElementById('inputModelo').value = prod.modelo;
    document.getElementById('inputCor').value = prod.cor;
    document.getElementById('inputTamanho').value = prod.tamanho;
    document.getElementById('inputPreco').value = prod.preco;
    document.getElementById('inputEstoque').value = prod.quantidade;
    document.getElementById('inputMaterial').value = prod.material || '';
    document.getElementById('inputTipo').value = prod.tipo || 'UNISSEX';
    document.getElementById('inputImagemUrl').value = prod.imagemUrl || '';
    document.getElementById('inputDescricao').value = prod.descricao || '';
    
    document.getElementById('modalTitulo').innerText = 'Editar produto';
    document.getElementById('btnSalvar').innerText = 'Salvar alteração';
    document.getElementById('modalProduto').style.display = 'flex';
};
