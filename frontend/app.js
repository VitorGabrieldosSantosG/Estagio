const API_URL = 'http://localhost:8080/armacao';

document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
    carregarTiposDeArmacao(); 
});

async function carregarTiposDeArmacao() {
    try {
        const response = await fetch(`${API_URL}/tipos`);
        const tiposEnum = await response.json(); 
        
        const selectTipo = document.getElementById('inputTipo');
        selectTipo.innerHTML = ''; 
        
        tiposEnum.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo; 
            
            const textoBonito = tipo.charAt(0) + tipo.slice(1).toLowerCase();
            option.textContent = textoBonito; 
            
            selectTipo.appendChild(option);
        });

    } catch (error) {
        console.error("Erro ao carregar tipos de armação do servidor:", error);
    }
}

//GET
async function carregarProdutos() {
    try {
        const response = await fetch(API_URL);
        const produtos = await response.json();
        const tbody = document.getElementById('corpoTabela');
        tbody.innerHTML = ''; 

        produtos.forEach(produto => {
            // Formata o preço para R$ 100,00
            const precoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${produto.id}</td>
                <td>${produto.marca}</td>
                <td>${produto.modelo}</td>
                <td>${produto.cor}</td>
                <td>${produto.tamanho}</td>
                <td>${precoFormatado}</td>
                <td>${produto.quantidade}</td>
                <td>
                    <button onclick='prepararEdicao(${JSON.stringify(produto)})' class="btn-icone" title="Editar">✏️</button>
                    <button onclick="deletarProduto(${produto.id})" class="btn-icone" title="Excluir">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Erro ao carregar:", error);
    }
}

//POST e PUT
document.getElementById('formProduto').addEventListener('submit', async (e) => {
    e.preventDefault(); 

    const id = document.getElementById('produtoId').value;
    
    const armacao = {
        marca: document.getElementById('inputMarca').value,
        modelo: document.getElementById('inputModelo').value,
        cor: document.getElementById('inputCor').value,
        tamanho: document.getElementById('inputTamanho').value,
        quantidade: document.getElementById('inputEstoque').value,
        preco: document.getElementById('inputPreco').value,
        material: document.getElementById('inputMaterial').value,
        tipo: document.getElementById('inputTipo').value,
        imagemUrl: document.getElementById('inputImagemUrl').value,
        descricao: document.getElementById('inputDescricao').value
    };

    const metodo = id ? 'PUT' : 'POST';
    const urlFinal = id ? `${API_URL}/${id}` : API_URL;

    try {
        const response = await fetch(urlFinal, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(armacao)
        });

        if(response.ok) {
            fecharModal();
            carregarProdutos(); 
        } else {
            const erro = await response.text();
            alert("Atenção: " + erro);
        }
    } catch (error) {
        console.error("Erro ao salvar:", error);
    }
});

//DELET
async function deletarProduto(id) {
    if(confirm('Tem certeza que deseja excluir esta armação?')) {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        carregarProdutos(); 
    }
}

//MODAL
const modal = document.getElementById('modalProduto');

document.getElementById('btnAbrirModal').onclick = () => {
    document.getElementById('formProduto').reset();
    document.getElementById('produtoId').value = '';
    document.getElementById('modalTitulo').innerText = 'Adicionar produto';
    document.getElementById('btnSalvar').innerText = 'Salvar produto';
    modal.style.display = 'flex';
};

document.getElementById('btnCancelar').onclick = fecharModal;

function fecharModal() {
    modal.style.display = 'none';
}

window.prepararEdicao = function(produto) {
    document.getElementById('produtoId').value = produto.id;
    document.getElementById('inputMarca').value = produto.marca;
    document.getElementById('inputModelo').value = produto.modelo;
    document.getElementById('inputCor').value = produto.cor;
    document.getElementById('inputTamanho').value = produto.tamanho;
    document.getElementById('inputPreco').value = produto.preco;
    document.getElementById('inputEstoque').value = produto.quantidade;
    document.getElementById('inputMaterial').value = produto.material || '';
    document.getElementById('inputTipo').value = produto.tipo || 'UNISSEX';
    document.getElementById('inputImagemUrl').value = produto.imagemUrl || '';
    document.getElementById('inputDescricao').value = produto.descricao || '';
    
    document.getElementById('modalTitulo').innerText = 'Editar produto';
    document.getElementById('btnSalvar').innerText = 'Salvar alteração';
    modal.style.display = 'flex';
};