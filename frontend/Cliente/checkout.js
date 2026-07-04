let cart = [];
let checkoutPrescriptionUrl = "https://otica-express-receitas.s3.amazonaws.com/mock-receita.png";

document.addEventListener('DOMContentLoaded', () => {
    // Proteger página exigindo autenticação do usuário
    if (!checkAuth()) return;
    
    updateHeader();

    // Carregar carrinho
    cart = JSON.parse(localStorage.getItem('otica_cart') || '[]');
    if (cart.length === 0) {
        alert("O seu carrinho está vazio! Adicione algum produto para finalizar.");
        window.location.href = '../index.html';
        return;
    }

    carregarDadosUsuario();
});

async function carregarDadosUsuario() {
    const user = getLoggedUser();
    if (!user) return;

    try {
        // Carregar endereço atualizado do usuário
        const response = await fetch(`${API_USUARIO}/${user.id}`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (response.ok) {
            const fullUser = await response.json();
            user.endereco = fullUser.endereco;
            localStorage.setItem('otica_user', JSON.stringify(user));
        }
    } catch (e) {
        console.error("Erro ao sincronizar endereço:", e);
    }

    // Preencher campos
    document.getElementById('checkNome').value = user.nome;
    document.getElementById('checkCpf').value = user.cpf || 'Não cadastrado';
    document.getElementById('checkTelefone').value = user.telefone || 'Não cadastrado';
    document.getElementById('checkEmail').value = user.email;

    const end = user.endereco;
    if (end) {
        document.getElementById('checkCep').value = end.cep;
        document.getElementById('checkNumero').value = end.numero;
        document.getElementById('checkComplemento').value = end.complemento || '';
        document.getElementById('checkCidadeEstado').value = `${end.cidade}/${end.estado}`;
        document.getElementById('checkRua').value = end.rua;
        document.getElementById('checkBairro').value = end.bairro;
    } else {
        alert("Endereço de entrega não localizado! Por favor, cadastre seu endereço.");
        window.location.href = 'cadastro-endereco.html';
        return;
    }

    // Preencher Resumo do Pedido com o tamanho da primeira armação no carrinho
    const tamanhoPrimeiraArmacao = cart[0].tamanho || 'M';
    document.getElementById('summaryTamanhoArmacao').innerText = tamanhoPrimeiraArmacao;

    // Calcular valores
    const subtotal = cart.reduce((acc, item) => acc + item.preco, 0);
    const frete = 15.00;
    const total = subtotal + frete;

    const subtotalFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal);
    const totalFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);

    document.getElementById('summarySubtotal').innerText = subtotalFmt.replace('R$', '').trim();
    document.getElementById('summaryTotal').innerText = totalFmt;
}

function simularUploadReceita(event) {
    const file = event.target.files[0];
    const user = getLoggedUser();
    if (file && user) {
        checkoutPrescriptionUrl = `https://otica-express-receitas.s3.amazonaws.com/usuario-${user.id}/${file.name}`;
        document.getElementById('receitaStatus').innerText = `Sucesso: receita "${file.name}" anexada com sucesso.`;
    }
}

async function finalizarCompra() {
    const user = getLoggedUser();
    if (!user) return;

    const subtotal = cart.reduce((acc, item) => acc + item.preco, 0);
    const frete = 15.00;
    const total = subtotal + frete;

    // Payload de criação do pedido
    const pedidoPayload = {
        usuarioId: user.id,
        enderecoId: user.endereco.id,
        status: "MEDIDAS_CONFIRMADAS",
        urlReceitaValidada: checkoutPrescriptionUrl,
        precoFrete: frete,
        precoTotal: total
    };

    try {
        // 1. Criar o Pedido no Banco
        const responsePedido = await fetch(API_PEDIDO, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(pedidoPayload)
        });

        if (!responsePedido.ok) {
            const erroMsg = await responsePedido.text();
            alert("Erro ao finalizar pedido: " + erroMsg);
            return;
        }

        const pedidoSalvo = await responsePedido.json();

        // 2. Criar os Itens do Pedido vinculados
        for (const item of cart) {
            const itemPayload = {
                pedidoId: pedidoSalvo.id,
                produtoId: item.id,
                marca: item.marca,
                modelo: item.modelo,
                tamanho: item.tamanho,
                cor: item.cor,
                ativo: true
            };

            await fetch(API_ITEM_PEDIDO, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(itemPayload)
            });
        }

        // Limpar carrinho local
        localStorage.removeItem('otica_cart');
        window.location.href = 'sucesso.html';

    } catch (e) {
        console.error("Erro na transação de finalização da compra:", e);
        alert("Ocorreu um erro ao processar o seu pedido.");
    }
}
