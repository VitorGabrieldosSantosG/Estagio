document.addEventListener('DOMContentLoaded', () => {
    updateHeader();
    renderizarCarrinho();
});

function renderizarCarrinho() {
    const container = document.getElementById('carrinhoContainer');
    let cart = JSON.parse(localStorage.getItem('otica_cart') || '[]');
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="cart-empty animate-fade">
                <span class="material-icons">production_quantity_limits</span>
                <p>Seu carrinho está vazio.</p>
                <button class="btn-voltar-loja" onclick="window.location.href='../index.html'">Continuar Comprando</button>
            </div>
        `;
        return;
    }
    
    let subtotal = 0;
    let totalItens = 0;
    let itensHtml = '';
    
    cart.forEach((item, index) => {
        const qtd = item.qtdCarrinho || 1;
        const subtotalItem = item.preco * qtd;
        subtotal += subtotalItem;
        totalItens += qtd;
        
        const precoUnitarioFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco);
        const subtotalItemFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotalItem);
        const estoqueMax = item.quantidade != null ? item.quantidade : 999;
        
        let imgHtml = `<span class="material-icons no-img-placeholder">glasses</span>`;
        if (item.imagemUrl) {
            imgHtml = `<img src="${item.imagemUrl}" alt="${item.modelo}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><span class="material-icons no-img-placeholder" style="display:none;">glasses</span>`;
        }
        
        itensHtml += `
            <div class="cart-item-card">
                <div class="cart-item-img">
                    ${imgHtml}
                </div>
                <div class="cart-item-info">
                    <h3>${item.marca} ${item.modelo}</h3>
                    <p class="cart-item-specs">Cor: <span>${item.cor || 'N/A'}</span> | Tamanho: <span>${item.tamanho || 'N/A'}</span></p>
                    <p class="cart-item-unit-price">Unitário: <strong>${precoUnitarioFmt}</strong></p>
                </div>
                <div class="cart-item-controls">
                    <div class="cart-item-quantity">
                        <button type="button" class="btn-qty" onclick="alterarQuantidade(${index}, -1)" title="${qtd <= 1 ? 'Remover item' : 'Diminuir quantidade'}">
                            <span class="material-icons" style="font-size: 1rem;">${qtd <= 1 ? 'delete' : 'remove'}</span>
                        </button>
                        <span class="cart-qty-value">${qtd}</span>
                        <button type="button" class="btn-qty" onclick="alterarQuantidade(${index}, 1)" title="Aumentar quantidade" ${qtd >= estoqueMax ? 'disabled' : ''}>
                            <span class="material-icons" style="font-size: 1rem;">add</span>
                        </button>
                    </div>
                </div>
                <div class="cart-item-subtotal-box">
                    <span class="subtotal-label">Subtotal</span>
                    <strong class="cart-item-price">${subtotalItemFmt}</strong>
                </div>
                <button class="cart-item-remove" onclick="removerDoCarrinho(${index})" title="Excluir item do carrinho">
                    <span class="material-icons">delete_outline</span>
                </button>
            </div>
        `;
    });
    
    const frete = 15.00;
    const total = subtotal + frete;
    const subtotalFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal);
    const freteFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(frete);
    const totalFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);
    
    container.innerHTML = `
        <div class="cart-layout animate-fade" id="cartLayout">
            <div class="cart-items-list" id="listaCarrinho">
                ${itensHtml}
            </div>
            <div class="checkout-summary" style="align-self: start;">
                <div class="checkout-card">
                    <h2>Resumo do Pedido</h2>
                    <div class="summary-details">
                        <p>Produtos (${totalItens} ${totalItens === 1 ? 'item' : 'itens'}): <span id="resumoSubtotal">${subtotalFmt}</span></p>
                        <p>Frete: <span id="resumoFrete">${freteFmt}</span></p>
                        <hr class="summary-divider">
                        <div class="total-row">
                            <span>Total:</span>
                            <strong id="resumoTotal">${totalFmt}</strong>
                        </div>
                        <button class="btn-green-submit" onclick="irParaCheckout()">Finalizar Compra</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function alterarQuantidade(index, delta) {
    let cart = JSON.parse(localStorage.getItem('otica_cart') || '[]');
    if (!cart[index]) return;

    let qtdAtual = cart[index].qtdCarrinho || 1;
    let novaQtd = qtdAtual + delta;

    if (novaQtd <= 0) {
        if (confirm(`Deseja remover "${cart[index].marca} ${cart[index].modelo}" do carrinho?`)) {
            removerDoCarrinho(index);
        }
        return;
    }

    const estoqueMax = cart[index].quantidade != null ? cart[index].quantidade : 999;
    if (novaQtd > estoqueMax) {
        alert(`Limite de estoque atingido! Há apenas ${estoqueMax} unidade(s) disponível(is).`);
        return;
    }

    cart[index].qtdCarrinho = novaQtd;
    localStorage.setItem('otica_cart', JSON.stringify(cart));
    updateHeader();
    renderizarCarrinho();
}

function removerDoCarrinho(index) {
    let cart = JSON.parse(localStorage.getItem('otica_cart') || '[]');
    if (index < 0 || index >= cart.length) return;
    
    cart.splice(index, 1);
    localStorage.setItem('otica_cart', JSON.stringify(cart));
    
    updateHeader();
    renderizarCarrinho();
}

function irParaCheckout() {
    let cart = JSON.parse(localStorage.getItem('otica_cart') || '[]');
    if (cart.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }
    
    const user = getLoggedUser();
    if (!user) {
        alert('Você precisa fazer login para finalizar a compra.');
        window.location.href = '../login.html';
        return;
    }
    
    window.location.href = 'checkout.html';
}
