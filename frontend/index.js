let localProducts = [];

document.addEventListener('DOMContentLoaded', () => {
    // Atualizar Cabeçalho
    updateHeader();
    
    // Carregar Produtos
    carregarProdutos();
});

async function carregarProdutos() {
    try {
        const response = await fetch(API_ARMACAO);
        localProducts = await response.json();
        renderizarCatalogo(localProducts);
    } catch (error) {
        console.error("Erro ao carregar catálogo:", error);
    }
}

function renderizarCatalogo(produtos) {
    const grid = document.getElementById('catalogoGrid');
    grid.innerHTML = '';

    if (produtos.length === 0) {
        grid.innerHTML = '<p class="no-products">Nenhuma armação localizada.</p>';
        return;
    }

    produtos.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'product-card';

        // Preço formatado e parcelas
        const precoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prod.preco);
        const precoParcela = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prod.preco / 10);

        // Imagem
        let imgHtml = `<span class="material-icons no-img-placeholder">glasses</span>`;
        if (prod.imagemUrl) {
            imgHtml = `<img src="${prod.imagemUrl}" alt="${prod.modelo}">`;
        }

        // Tipo com tratamento de nulo corrigido
        const tipoBonito = prod.tipo ? (prod.tipo.charAt(0) + prod.tipo.slice(1).toLowerCase()) : 'Unissex';

        card.innerHTML = `
            <div class="product-card-img" onclick="verDetalhes(${prod.id})">
                ${imgHtml}
            </div>
            <div class="product-card-body">
                <span class="product-card-type">Armação ${tipoBonito}</span>
                <h3 class="product-card-title" onclick="verDetalhes(${prod.id})">${prod.marca} ${prod.modelo}</h3>
                <div class="product-card-price-row">
                    <span class="product-card-price">${precoFormatado}</span>
                    <p class="product-card-installments">ou 10X de ${precoParcela}</p>
                </div>
                <div class="color-circles">
                    <div class="color-circle" style="background-color: #1a1a1a;"></div>
                    <div class="color-circle" style="background-color: #795548;"></div>
                    <div class="color-circle" style="background-color: #0d47a1;"></div>
                </div>
                <button class="btn-orange-cart" onclick="adicionarAoCarrinho(${prod.id})">
                    <span class="material-icons">add_shopping_cart</span> Adicionar ao carrinho
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function filtrarCatalogo() {
    const query = document.getElementById('inputPesquisar').value.toLowerCase();
    const filtrados = localProducts.filter(prod => 
        prod.marca.toLowerCase().includes(query) || 
        prod.modelo.toLowerCase().includes(query) ||
        prod.descricao.toLowerCase().includes(query)
    );
    renderizarCatalogo(filtrados);
}

function verDetalhes(id) {
    window.location.href = `detalhes.html?id=${id}`;
}

function adicionarAoCarrinho(productId) {
    const prod = localProducts.find(p => p.id === productId);
    if (!prod) return;

    let cart = JSON.parse(localStorage.getItem('otica_cart') || '[]');
    cart.push(prod);
    localStorage.setItem('otica_cart', JSON.stringify(cart));
    
    updateHeader();
    alert(`Produto ${prod.marca} ${prod.modelo} adicionado ao carrinho!`);
}
