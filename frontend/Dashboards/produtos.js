document.addEventListener('DOMContentLoaded', () => {
    // Proteger página - Apenas Administrador
    if (!checkAuth(['ADMINISTRADOR'])) return;

    // Configurar sidebar user info
    const user = getLoggedUser();
    document.getElementById('sidebarUserName').innerText = `${user.nome} (${user.role.toLowerCase()})`;

    carregarVariacoes();
});

// =============================================
//  LISTAGEM DE VARIAÇÕES (ITENS DE PRODUTO)
// =============================================
async function carregarVariacoes() {
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
            const armacaoNome = `${item.marca || '-'} ${item.modelo || '-'}`;
            const tipoBonito = item.tipo ? (item.tipo.charAt(0) + item.tipo.slice(1).toLowerCase()) : '-';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${item.id}</td>
                <td>${armacaoNome}</td>
                <td>${item.cor || '-'}</td>
                <td>${item.tamanho || '-'}</td>
                <td>${item.material || '-'}</td>
                <td>${precoFormatado}</td>
                <td>${item.quantidade || 0}</td>
                <td>${tipoBonito}</td>
                <td>
                    <button onclick='abrirModalEditarItem(${JSON.stringify(item).replace(/'/g, "&apos;")})' class="btn-icone" title="Editar">✏️</button>
                    <button onclick="deletarVariacao(${item.id})" class="btn-icone" title="Excluir">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Erro ao carregar itens de produto:", error);
    }
}

// =============================================
//  MODAL DE CRIAÇÃO UNIFICADA (ARMAÇÃO + ITENS)
// =============================================
function abrirModalNovoProduto() {
    document.getElementById('formNovoProduto').reset();
    document.getElementById('variacoesContainer').innerHTML = '';
    adicionarVariacao(); // Adiciona a primeira linha vazia por padrão
    document.getElementById('modalNovoProduto').style.display = 'flex';
}

function fecharModalNovoProduto() {
    document.getElementById('modalNovoProduto').style.display = 'none';
}

function adicionarVariacao() {
    const container = document.getElementById('variacoesContainer');
    const div = document.createElement('div');
    div.className = 'variacao-row';
    
    div.innerHTML = `
        <div class="form-group">
            <label>Cor:</label>
            <input type="text" class="var-cor" placeholder="Ex: Preto" required>
        </div>
        <div class="form-group">
            <label>Tamanho:</label>
            <input type="text" class="var-tamanho" placeholder="Ex: M" required>
        </div>
        <div class="form-group">
            <label>Preço:</label>
            <input type="number" step="0.01" min="0" class="var-preco" placeholder="0.00" required>
        </div>
        <div class="form-group">
            <label>Qtd:</label>
            <input type="number" min="0" class="var-qtd" placeholder="0" required>
        </div>
        <div class="form-group">
            <label>URL Imagem:</label>
            <input type="url" class="var-img" placeholder="https://..." required>
        </div>
        <button type="button" class="btn-remover-variacao" onclick="removerVariacao(this)" title="Remover variação">
            <span class="material-icons">delete</span>
        </button>
    `;
    container.appendChild(div);
}

function removerVariacao(btn) {
    const container = document.getElementById('variacoesContainer');
    if (container.children.length > 1) {
        btn.closest('.variacao-row').remove();
    } else {
        alert("O produto precisa ter pelo menos uma variação.");
    }
}

async function salvarProdutoComVariacoes(event) {
    event.preventDefault();
    const user = getLoggedUser();
    if (!user || user.role !== 'ADMINISTRADOR') return;

    // 1. Coletar dados da armação base
    const baseMarca = document.getElementById('inputBaseMarca').value;
    const baseModelo = document.getElementById('inputBaseModelo').value;
    const baseMaterial = document.getElementById('inputBaseMaterial').value;
    const baseTipo = document.getElementById('inputBaseTipo').value;
    const baseDescricao = document.getElementById('inputBaseDescricao').value;

    // 2. Coletar variações
    const variacoesRows = document.querySelectorAll('.variacao-row');
    const variacoes = [];
    let primeiraImagem = '';

    variacoesRows.forEach((row, index) => {
        const cor = row.querySelector('.var-cor').value;
        const tamanho = row.querySelector('.var-tamanho').value;
        const preco = parseFloat(row.querySelector('.var-preco').value);
        const quantidade = parseInt(row.querySelector('.var-qtd').value);
        const imagemUrl = row.querySelector('.var-img').value;

        if (index === 0) primeiraImagem = imagemUrl;

        variacoes.push({ cor, tamanho, preco, quantidade, imagemUrl });
    });

    // 3. POST para criar Armação Base
    const armacaoDto = {
        marca: baseMarca,
        modelo: baseModelo,
        material: baseMaterial,
        tipo: baseTipo,
        descricao: baseDescricao,
        cor: 'Variado',
        tamanho: 'Variado',
        preco: 0,
        quantidade: 0,
        imagemUrl: primeiraImagem
    };

    try {
        const resArmacao = await fetch(API_ARMACAO, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(armacaoDto)
        });

        if (!resArmacao.ok) {
            const erro = await resArmacao.text();
            throw new Error("Erro ao criar armação base: " + erro);
        }

        const armacaoCriada = await resArmacao.json();
        const armacaoId = armacaoCriada.id;

        // 4. POST para criar cada Variação (ItemProduto)
        const promessasVariaveis = variacoes.map(v => {
            const itemProdutoDto = {
                armacaoId: armacaoId,
                marca: baseMarca,
                modelo: baseModelo,
                material: baseMaterial,
                tipo: baseTipo,
                cor: v.cor,
                tamanho: v.tamanho,
                preco: v.preco,
                quantidade: v.quantidade,
                imagemUrl: v.imagemUrl
            };

            return fetch(API_ITEM_PRODUTO, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(itemProdutoDto)
            });
        });

        const respostasItens = await Promise.all(promessasVariaveis);
        
        let erroAoSalvarVariavel = false;
        for (let res of respostasItens) {
            if (!res.ok) {
                console.error("Falha ao salvar uma variação", await res.text());
                erroAoSalvarVariavel = true;
            }
        }
        
        if (erroAoSalvarVariavel) {
            alert("Produto base criado, mas houve erro ao salvar algumas variações. Verifique o console.");
        }

        fecharModalNovoProduto();
        carregarVariacoes();
        
    } catch (error) {
        alert(error.message);
        console.error("Erro ao salvar produto completo:", error);
    }
}

// =============================================
//  MODAL DE EDIÇÃO DE ITEM DE PRODUTO
// =============================================
function abrirModalEditarItem(item) {
    document.getElementById('editItemId').value = item.id;
    document.getElementById('editItemArmacaoId').value = item.armacaoId || (item.armacao ? item.armacao.id : '');
    
    document.getElementById('editItemMarca').value = item.marca || '';
    document.getElementById('editItemModelo').value = item.modelo || '';
    
    document.getElementById('editItemCor').value = item.cor || '';
    document.getElementById('editItemTamanho').value = item.tamanho || '';
    document.getElementById('editItemMaterial').value = item.material || '';
    document.getElementById('editItemTipo').value = item.tipo || 'UNISSEX';
    document.getElementById('editItemPreco').value = item.preco || '';
    document.getElementById('editItemQuantidade').value = item.quantidade || 0;
    document.getElementById('editItemImagemUrl').value = item.imagemUrl || '';

    document.getElementById('modalEditarItem').style.display = 'flex';
}

function fecharModalEditarItem() {
    document.getElementById('modalEditarItem').style.display = 'none';
}

async function salvarEdicaoItem(event) {
    event.preventDefault();
    const user = getLoggedUser();
    if (!user || user.role !== 'ADMINISTRADOR') return;

    const id = document.getElementById('editItemId').value;

    const itemProdutoAtualizado = {
        armacaoId: parseInt(document.getElementById('editItemArmacaoId').value),
        marca: document.getElementById('editItemMarca').value,
        modelo: document.getElementById('editItemModelo').value,
        cor: document.getElementById('editItemCor').value,
        tamanho: document.getElementById('editItemTamanho').value,
        material: document.getElementById('editItemMaterial').value,
        tipo: document.getElementById('editItemTipo').value,
        preco: parseFloat(document.getElementById('editItemPreco').value),
        quantidade: parseInt(document.getElementById('editItemQuantidade').value),
        imagemUrl: document.getElementById('editItemImagemUrl').value
    };

    try {
        const response = await fetch(`${API_ITEM_PRODUTO}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(itemProdutoAtualizado)
        });

        if (response.ok) {
            fecharModalEditarItem();
            carregarVariacoes();
        } else {
            const erro = await response.text();
            alert("Erro ao editar variação: " + erro);
        }
    } catch (error) {
        console.error("Erro ao salvar edição:", error);
    }
}

// =============================================
//  DELEÇÃO DE VARIAÇÃO
// =============================================
async function deletarVariacao(id) {
    const user = getLoggedUser();
    if (!user || user.role !== 'ADMINISTRADOR') return;

    if (confirm('Tem certeza que deseja excluir esta variação de produto?')) {
        try {
            const response = await fetch(`${API_ITEM_PRODUTO}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (response.ok) {
                carregarVariacoes();
            } else {
                const erro = await response.text();
                alert("Erro ao excluir: " + erro);
            }
        } catch (e) {
            console.error(e);
        }
    }
}
