let currentChecklistPedido = null;

document.addEventListener('DOMContentLoaded', () => {
    // Proteger página contra acessos não autorizados
    if (!checkAuth(['ADMINISTRADOR', 'LABORATORISTA'])) return;

    // Configurar informações do usuário no painel sidebar
    const user = getLoggedUser();
    document.getElementById('sidebarUserName').innerText = `${user.nome} (${user.role.toLowerCase()})`;

    // Esconder "Controle de produtos" do menu caso seja Laboratorista
    const menuProd = document.getElementById('menuProdutos');
    if (user.role === 'LABORATORISTA') {
        menuProd.style.display = 'none';
    } else {
        menuProd.style.display = 'flex';
    }

    carregarFilaPedidos();
});

async function carregarFilaPedidos() {
    const user = getLoggedUser();
    if (!user) return;

    try {
        const response = await fetch(API_PEDIDO, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const pedidos = await response.json();

        // 1. Contabilizar KPIs
        let aguardando = 0;
        let producao = 0;
        let prontos = 0;

        pedidos.forEach(p => {
            if (['MEDIDAS_CONFIRMADAS', 'PEDIDO_RECEBIDO'].includes(p.status)) {
                aguardando++;
            } else if (['SEPARACAO_ARMACAO', 'FABRICACAO_LENTE', 'MONTAGEM_OCULOS', 'CONTROLE_QUALIDADE'].includes(p.status)) {
                producao++;
            } else if (['EMBALAR', 'ENVIO_ENTREGA'].includes(p.status)) {
                prontos++;
            }
        });

        document.getElementById('kpiAguardando').innerText = aguardando;
        document.getElementById('kpiProducao').innerText = producao;
        document.getElementById('kpiProntos').innerText = prontos;

        // 2. Renderizar a fila de pedidos
        const tbody = document.getElementById('corpoTabelaPedidos');
        tbody.innerHTML = '';

        if (pedidos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum pedido na fila.</td></tr>';
            return;
        }

        const statusNomes = {
            'MEDIDAS_CONFIRMADAS': 'Medidas confirmadas',
            'PEDIDO_RECEBIDO': 'Pedido recebido',
            'SEPARACAO_ARMACAO': 'Separação da armação',
            'FABRICACAO_LENTE': 'Fabricação de lentes',
            'MONTAGEM_OCULOS': 'Em montagem',
            'CONTROLE_QUALIDADE': 'Controle de qualidade',
            'EMBALAR': 'Aguardando envio',
            'ENVIO_ENTREGA': 'Aguardando envio',
            'ENTREGUE_CLIENTE': 'Entregue',
            'CANCELADO': 'Cancelado'
        };

        const statusClasses = {
            'MEDIDAS_CONFIRMADAS': 'badge-recebido',
            'PEDIDO_RECEBIDO': 'badge-recebido',
            'SEPARACAO_ARMACAO': 'badge-montagem',
            'FABRICACAO_LENTE': 'badge-montagem',
            'MONTAGEM_OCULOS': 'badge-montagem',
            'CONTROLE_QUALIDADE': 'badge-montagem',
            'EMBALAR': 'badge-envio',
            'ENVIO_ENTREGA': 'badge-envio',
            'ENTREGUE_CLIENTE': 'badge-envio',
            'CANCELADO': 'badge-cancelado'
        };

        pedidos.forEach(p => {
            const tr = document.createElement('tr');
            
            const clienteNome = p.usuarioId ? p.usuarioId.nome : 'Cliente Desconhecido';
            const armacaoTexto = (p.listaProdutos && p.listaProdutos.length > 0) 
                ? `${p.listaProdutos[0].marca} ${p.listaProdutos[0].modelo}` 
                : 'Lente e Armação Padrão';
            
            const badgeClass = statusClasses[p.status] || 'badge-padrao';
            const statusTexto = statusNomes[p.status] || p.status;

            tr.innerHTML = `
                <td><strong>#${p.id}</strong></td>
                <td>${clienteNome}</td>
                <td>${armacaoTexto}</td>
                <td><span class="status-badge ${badgeClass}">${statusTexto}</span></td>
                <td>
                    <button class="btn-action-primary" onclick="abrirChecklistPedido(${p.id})">Ver checklist</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (e) {
        console.error("Erro ao carregar fila de pedidos:", e);
    }
}

const checklistFluxo = [
    'MEDIDAS_CONFIRMADAS',
    'PEDIDO_RECEBIDO',
    'SEPARACAO_ARMACAO',
    'FABRICACAO_LENTE',
    'MONTAGEM_OCULOS',
    'CONTROLE_QUALIDADE',
    'EMBALAR',
    'ENVIO_ENTREGA',
    'ENTREGUE_CLIENTE'
];

async function abrirChecklistPedido(id) {
    const user = getLoggedUser();
    if (!user) return;
    
    try {
        const response = await fetch(`${API_PEDIDO}/${id}`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const ped = await response.json();
        currentChecklistPedido = ped;

        document.getElementById('checklistTitulo').innerText = `Pedido #${ped.id}`;

        const isLaboratorista = user.role === 'LABORATORISTA';
        const currentIdx = checklistFluxo.indexOf(ped.status);

        checklistFluxo.forEach((status, idx) => {
            const chk = document.getElementById(`chkStatus_${status}`);
            if (chk) {
                // Se o status do pedido já passou por esse passo, manter marcado
                chk.checked = (idx <= currentIdx);

                // Configurar habilitado / desabilitado
                if (isLaboratorista && ['ENVIO_ENTREGA', 'ENTREGUE_CLIENTE'].includes(status)) {
                    chk.disabled = true;
                } else {
                    chk.disabled = false;
                }
            }
        });

        document.getElementById('modalChecklist').style.display = 'flex';

    } catch (e) {
        console.error("Erro ao obter dados do checklist:", e);
    }
}

function fecharModalChecklist() {
    document.getElementById('modalChecklist').style.display = 'none';
    currentChecklistPedido = null;
}

async function salvarChecklistStatus() {
    const user = getLoggedUser();
    if (!user || !currentChecklistPedido) return;

    let novoStatus = currentChecklistPedido.status;

    // Achar o maior selecionado
    for (let i = checklistFluxo.length - 1; i >= 0; i--) {
        const chk = document.getElementById(`chkStatus_${checklistFluxo[i]}`);
        if (chk && chk.checked) {
            novoStatus = checklistFluxo[i];
            break;
        }
    }

    if (novoStatus === currentChecklistPedido.status) {
        fecharModalChecklist();
        return;
    }

    try {
        const payload = {
            id: currentChecklistPedido.id,
            status: novoStatus
        };

        const response = await fetch(`${API_PEDIDO}/${currentChecklistPedido.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            fecharModalChecklist();
            carregarFilaPedidos();
            alert("Status do pedido atualizado com sucesso!");
        } else {
            const err = await response.text();
            alert("Erro ao salvar alteração: " + err);
        }
    } catch (e) {
        console.error("Erro ao atualizar status:", e);
    }
}
