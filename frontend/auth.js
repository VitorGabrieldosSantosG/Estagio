const BASE_URL = 'http://localhost:8080';
const API_ARMACAO = `${BASE_URL}/armacao`;
const API_AUTH = `${BASE_URL}/auth`;
const API_USUARIO = `${BASE_URL}/usuario`;
const API_ENDERECO = `${BASE_URL}/endereco`;
const API_PEDIDO = `${BASE_URL}/pedido`;
const API_ITEM_PEDIDO = `${BASE_URL}/item-pedido`;

// Calcula o prefixo de caminho correto baseado na profundidade da pasta atual
// Ex: em Cadastros/ ou Cliente/ → '../'  |  em frontend/ → ''
function rootPath() {
    const depth = window.location.pathname.split('/').filter(Boolean).length;
    // Se estiver em uma subpasta (ex: /Cliente/, /Cadastros/, /Dashboards/)
    // a profundidade será > 2 em servidores como Live Server
    const segments = window.location.pathname.replace(/\/[^/]+$/, '').split('/');
    const hasSubfolder = ['Cliente', 'Cadastros', 'Dashboards'].some(f =>
        window.location.pathname.includes('/' + f + '/')
    );
    return hasSubfolder ? '../' : '';
}

// Retorna o usuário logado
function getLoggedUser() {
    const user = localStorage.getItem('otica_user');
    return user ? JSON.parse(user) : null;
}

// Verifica se está logado
function isLoggedIn() {
    return getLoggedUser() !== null;
}

// Protege rotas verificando autenticação e permissões de cargo
function checkAuth(allowedRoles) {
    const user = getLoggedUser();
    if (!user) {
        window.location.href = rootPath() + 'login.html';
        return false;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        alert("Você não tem permissão para acessar esta página!");
        window.location.href = rootPath() + 'index.html';
        return false;
    }
    return true;
}

// Desloga o usuário
function logout() {
    localStorage.removeItem('otica_user');
    localStorage.removeItem('otica_cart');
    window.location.href = rootPath() + 'index.html';
}

// Atualiza o cabeçalho padrão da loja
function updateHeader() {
    const user = getLoggedUser();
    const userBtnText = document.getElementById('userNameHeader');
    const btnPedidos = document.getElementById('btnHeaderPedidos');
    const cartBadge = document.getElementById('carrinhoQuantidade');

    // Carrinho
    const cart = JSON.parse(localStorage.getItem('otica_cart') || '[]');
    if (cartBadge) {
        cartBadge.innerText = cart.length;
    }

    if (userBtnText) {
        if (user) {
            userBtnText.innerText = user.nome.split(' ')[0];
            const parent = userBtnText.parentElement;
            if (parent) {
                parent.title = "Sair da Conta";
                parent.onclick = (e) => {
                    e.preventDefault();
                    if (confirm("Deseja sair da sua conta?")) logout();
                };
            }
        } else {
            userBtnText.innerText = "Entrar";
            const parent = userBtnText.parentElement;
            if (parent) {
                parent.title = "Minha Conta";
                parent.onclick = (e) => {
                    e.preventDefault();
                    window.location.href = rootPath() + 'login.html';
                };
            }
        }
    }

    if (btnPedidos) {
        if (user) {
            btnPedidos.style.display = 'flex';
            if (user.role !== 'CLIENTE') {
                btnPedidos.title = "Painel de Gestão";
                btnPedidos.onclick = () => { window.location.href = rootPath() + 'Dashboards/dashboard.html'; };
            } else {
                btnPedidos.title = "Meus Pedidos";
                btnPedidos.onclick = () => { window.location.href = rootPath() + 'Cliente/pedidos.html'; };
            }
        } else {
            btnPedidos.style.display = 'none';
        }
    }
}
