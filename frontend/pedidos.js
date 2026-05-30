document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth(['CLIENTE', 'ADMINISTRADOR'])) return;
    updateHeader();
    carregarMeusPedidos();
});

async function carregarMeusPedidos() {
    const listDiv = document.getElementById('listaMeusPedidos');
    listDiv.innerHTML = '<p class="loading">Carregando pedidos...</p>';

    const user = getLoggedUser();
    if (!user) return;

    try {
        const response = await fetch(API_PEDIDO, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const pedidos = await response.json();
        
        // Filtrar apenas pedidos do próprio usuário logado
        const meusPedidos = pedidos.filter(p => p.usuarioId && p.usuarioId.id === user.id);

        listDiv.innerHTML = '';
        if (meusPedidos.length === 0) {
            listDiv.innerHTML = '<p class="no-orders">Você ainda não realizou pedidos.</p>';
            return;
        }

        // Traduzir status
        const statusMap = {
            'MEDIDAS_CONFIRMADAS': 'Medidas confirmadas',
            'PEDIDO_RECEBIDO': 'Pedido recebido',
            'SEPARACAO_ARMACAO': 'Separação da armação',
            'FABRICACAO_LENTE': 'Fabricação da lente',
            'MONTAGEM_OCULOS': 'Montagem do óculos',
            'CONTROLE_QUALIDADE': 'Controle de qualidade',
            'EMBALAR': 'Embalado',
            'ENVIO_ENTREGA': 'Envio para entrega',
            'ENTREGUE_CLIENTE': 'Entregue ao cliente',
            'CANCELADO': 'Cancelado'
        };

        meusPedidos.forEach(ped => {
            const card = document.createElement('div');
            card.className = 'order-client-card animate-fade';

            const precoFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ped.precoTotal);
            const statusFmt = statusMap[ped.status] || ped.status;

            card.innerHTML = `
                <div class="order-client-img">
                    <span class="material-icons">shopping_bag</span>
                </div>
                <div class="order-client-info">
                    <h3>Pedido #${ped.id}</h3>
                    <p>Itens do pedido vinculados no sistema</p>
                    <p>Total: <strong>${precoFmt}</strong></p>
                    <div class="order-client-status">Status: <span>${statusFmt}</span></div>
                </div>
            `;
            listDiv.appendChild(card);
        });
    } catch (e) {
        console.error("Erro ao carregar histórico de pedidos:", e);
        listDiv.innerHTML = '<p class="error-msg">Erro ao carregar dados do servidor.</p>';
    }
}
