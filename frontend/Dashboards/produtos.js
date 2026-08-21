document.addEventListener('DOMContentLoaded', () => {
    // Proteger página - Apenas Administrador
    if (!checkAuth(['ADMINISTRADOR'])) return;

    // Configurar sidebar user info
    const user = getLoggedUser();
    document.getElementById('sidebarUserName').innerText = `${user.nome} (${user.role.toLowerCase()})`;

    carregarEstoqueProdutos();
    carregarItensProduto();
});

// =============================================
//  CONTROLE DE ABAS
// =============================================
function trocarAba(aba) {
    const abaArmacoes = document.getElementById('abaArmacoes');
    const abaItens = document.getElementById('abaItensProduto');
    const tabArmacoes = document.getElementById('tabArmacoes');
    const tabItens = document.getElementById('tabItensProduto');

    if (aba === 'armacoes') {
        abaArmacoes.style.display = 'block';
        abaItens.style.display = 'none';
        tabArmacoes.className = 'btn-action-primary';
        tabItens.className = 'btn-cinza';
    } else {
        abaArmacoes.style.display = 'none';
        abaItens.style.display = 'block';
        tabArmacoes.className = 'btn-cinza';
        tabItens.className = 'btn-action-primary';
    }
}

// =============================================
//  ARMAÇÕES (CRUD existente)
// =============================================
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
    document.getElementById('modalTitulo').innerText = 'Adicionar armação';
    document.getElementById('btnSalvar').innerText = 'Salvar armação';
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
    
    document.getElementById('modalTitulo').innerText = 'Editar armação';
    document.getElementById('btnSalvar').innerText = 'Salvar alteração';
    document.getElementById('modalProduto').style.display = 'flex';
};

// =============================================
//  ITENS DE PRODUTO (NOVO - Estoque)
// =============================================
async function carregarItensProduto() {
    const user = getLoggedUser();
    if (!user) return;

    try {
        const response = await fetch(API_ITEM_PRODUTO, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const itens = await response.json();
        const tbody = document.getElementById('corpoTabelaItens');
        tbody.innerHTML = '';

        itens.forEach(item => {
            const precoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco || 0);
            const armacaoId = item.armacao ? item.armacao.id : '-';
            const tipoBonito = item.tipo ? (item.tipo.charAt(0) + item.tipo.slice(1).toLowerCase()) : '-';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${item.id}</td>
                <td>${armacaoId}</td>
                <td>${item.marca || '-'}</td>
                <td>${item.modelo || '-'}</td>
                <td>${item.cor || '-'}</td>
                <td>${item.tamanho || '-'}</td>
                <td>${item.material || '-'}</td>
                <td>${precoFormatado}</td>
                <td>${item.quantidade || 0}</td>
                <td>${tipoBonito}</td>
                <td>
                    <button onclick='prepararEdicaoItemProduto(${JSON.stringify(item)})' class="btn-icone" title="Editar">✏️</button>
                    <button onclick="deletarItemProduto(${item.id})" class="btn-icone" title="Excluir">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Erro ao carregar itens de produto:", error);
    }
}

async function salvarItemProduto(event) {
    event.preventDefault();
    const user = getLoggedUser();
    if (!user || user.role !== 'ADMINISTRADOR') return;

    const id = document.getElementById('itemProdutoId').value;

    const itemProduto = {
        armacaoId: parseInt(document.getElementById('inputItemArmacaoId').value),
        marca: document.getElementById('inputItemMarca').value,
        modelo: document.getElementById('inputItemModelo').value,
        cor: document.getElementById('inputItemCor').value,
        tamanho: document.getElementById('inputItemTamanho').value,
        material: document.getElementById('inputItemMaterial').value,
        tipo: document.getElementById('inputItemTipo').value,
        preco: parseFloat(document.getElementById('inputItemPreco').value),
        quantidade: parseInt(document.getElementById('inputItemQuantidade').value),
        imagemUrl: document.getElementById('inputItemImagemUrl').value
    };

    const metodo = id ? 'PUT' : 'POST';
    const urlFinal = id ? `${API_ITEM_PRODUTO}/${id}` : API_ITEM_PRODUTO;

    try {
        const response = await fetch(urlFinal, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(itemProduto)
        });

        if (response.ok) {
            fecharModalItemProduto();
            carregarItensProduto();
        } else {
            const erro = await response.text();
            alert("Atenção: " + erro);
        }
    } catch (error) {
        console.error("Erro ao salvar item de produto:", error);
    }
}

async function deletarItemProduto(id) {
    const user = getLoggedUser();
    if (!user || user.role !== 'ADMINISTRADOR') return;

    if (confirm('Tem certeza que deseja excluir este item de produto?')) {
        try {
            const response = await fetch(`${API_ITEM_PRODUTO}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (response.ok) {
                carregarItensProduto();
            } else {
                const erro = await response.text();
                alert("Erro ao excluir: " + erro);
            }
        } catch (e) {
            console.error(e);
        }
    }
}

function abrirModalItemProduto() {
    document.getElementById('formItemProduto').reset();
    document.getElementById('itemProdutoId').value = '';
    document.getElementById('modalTituloItem').innerText = 'Adicionar item de produto';
    document.getElementById('btnSalvarItem').innerText = 'Salvar item';
    document.getElementById('modalItemProduto').style.display = 'flex';
}

function fecharModalItemProduto() {
    document.getElementById('modalItemProduto').style.display = 'none';
}

window.prepararEdicaoItemProduto = function(item) {
    document.getElementById('itemProdutoId').value = item.id;
    document.getElementById('inputItemArmacaoId').value = item.armacao ? item.armacao.id : '';
    document.getElementById('inputItemMarca').value = item.marca || '';
    document.getElementById('inputItemModelo').value = item.modelo || '';
    document.getElementById('inputItemCor').value = item.cor || '';
    document.getElementById('inputItemTamanho').value = item.tamanho || '';
    document.getElementById('inputItemMaterial').value = item.material || '';
    document.getElementById('inputItemTipo').value = item.tipo || 'UNISSEX';
    document.getElementById('inputItemPreco').value = item.preco || '';
    document.getElementById('inputItemQuantidade').value = item.quantidade || 0;
    document.getElementById('inputItemImagemUrl').value = item.imagemUrl || '';

    document.getElementById('modalTituloItem').innerText = 'Editar item de produto';
    document.getElementById('btnSalvarItem').innerText = 'Salvar alteração';
    document.getElementById('modalItemProduto').style.display = 'flex';
};
