let currentProduct = null;

document.addEventListener('DOMContentLoaded', () => {
    updateHeader();
    
    // Ler ID da URL
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    
    if (productId) {
        carregarDetalhesProduto(productId);
    } else {
        alert("Produto não especificado.");
        window.location.href = "../index.html";
    }
});

async function carregarDetalhesProduto(id) {
    try {
        const response = await fetch(`${API_ITEM_PRODUTO}/${id}`);
        if (!response.ok) {
            alert("Produto não encontrado.");
            window.location.href = "../index.html";
            return;
        }
        
        currentProduct = await response.json();

        // Renderizar informações
        document.getElementById('detailTitulo').innerText = `${currentProduct.marca} ${currentProduct.modelo}`;
        document.getElementById('detailTamanho').innerText = currentProduct.tamanho || 'Único';
        
        // ItemProduto não possui descricao, vamos montar um texto descritivo
        const material = currentProduct.material || 'Material não informado';
        const tipo = currentProduct.tipo || 'Unissex';
        document.getElementById('detailDescricao').innerText = `${material} | ${tipo}`;
        
        const precoFormatado = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(currentProduct.preco);
        const precoParcela = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(currentProduct.preco / 10);
        document.getElementById('detailPreco').innerText = precoFormatado;
        document.getElementById('detailParcela').innerText = precoParcela;

        // Imagens (miniaturas e principal)
        const imgUrl = currentProduct.imagemUrl || '';
        document.getElementById('detailMainImage').src = imgUrl;
        document.getElementById('thumb1').src = imgUrl;
        document.getElementById('thumb2').src = imgUrl;
        document.getElementById('thumb3').src = imgUrl;
        document.getElementById('thumb4').src = imgUrl;

        // Exibir cor real do produto como texto
        const coresDiv = document.getElementById('detailColorCircles');
        coresDiv.innerHTML = '';
        const cor = currentProduct.cor || 'Não informado';
        const badge = document.createElement('span');
        badge.className = 'detail-color-badge';
        badge.textContent =  cor;
        coresDiv.appendChild(badge);

    } catch (error) {
        console.error("Erro ao carregar detalhes:", error);
    }
}

function adicionarAoCarrinhoDetalhes() {
    if (!currentProduct) return;

    let cart = JSON.parse(localStorage.getItem('otica_cart') || '[]');
    const indexExistente = cart.findIndex(item => item.id === currentProduct.id);

    if (indexExistente !== -1) {
        const qtdAtual = cart[indexExistente].qtdCarrinho || 1;
        const estoqueMax = currentProduct.quantidade != null ? currentProduct.quantidade : 999;
        if (qtdAtual >= estoqueMax) {
            alert(`Limite de estoque atingido! Há apenas ${estoqueMax} unidade(s) disponível(is).`);
            return;
        }
        cart[indexExistente].qtdCarrinho = qtdAtual + 1;
    } else {
        const itemParaAdicionar = { ...currentProduct, qtdCarrinho: 1 };
        cart.push(itemParaAdicionar);
    }

    localStorage.setItem('otica_cart', JSON.stringify(cart));
    updateHeader();
    alert(`Produto ${currentProduct.marca} ${currentProduct.modelo} adicionado ao carrinho!`);
    window.location.href = "../index.html";
}
