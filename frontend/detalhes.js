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
        window.location.href = "index.html";
    }
});

async function carregarDetalhesProduto(id) {
    try {
        const response = await fetch(`${API_ARMACAO}/${id}`);
        if (!response.ok) {
            alert("Produto não encontrado.");
            window.location.href = "index.html";
            return;
        }
        
        currentProduct = await response.json();

        // Renderizar informações
        document.getElementById('detailTitulo').innerText = `${currentProduct.marca} ${currentProduct.modelo}`;
        document.getElementById('detailTamanho').innerText = currentProduct.tamanho;
        document.getElementById('detailDescricao').innerText = currentProduct.descricao || 'Nenhuma descrição fornecida.';
        
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

        // Cores
        const coresDiv = document.getElementById('detailColorCircles');
        coresDiv.innerHTML = '';
        const cores = [currentProduct.cor, 'Marrom', 'Azul Marinho', 'Verde', 'Roxo', 'Azul'];
        const coresHex = {
            'Preto': '#1a1a1a', 'Marrom': '#795548', 'Azul Marinho': '#0d47a1', 
            'Verde': '#2ecc71', 'Roxo': '#9b59b6', 'Azul': '#3498db', 'Dourado': '#f1c40f', 'Prata': '#bdc3c7'
        };

        cores.forEach(c => {
            const hex = coresHex[c] || '#888';
            const circle = document.createElement('div');
            circle.className = 'color-circle';
            circle.style.backgroundColor = hex;
            circle.title = c;
            coresDiv.appendChild(circle);
        });

    } catch (error) {
        console.error("Erro ao carregar detalhes:", error);
    }
}

function adicionarAoCarrinhoDetalhes() {
    if (!currentProduct) return;

    let cart = JSON.parse(localStorage.getItem('otica_cart') || '[]');
    cart.push(currentProduct);
    localStorage.setItem('otica_cart', JSON.stringify(cart));
    
    updateHeader();
    alert(`Produto ${currentProduct.marca} ${currentProduct.modelo} adicionado ao carrinho!`);
    window.location.href = "index.html";
}
