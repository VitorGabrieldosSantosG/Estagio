document.addEventListener('DOMContentLoaded', () => {
    // Se o usuário já estiver logado, redirecionar para a home
    if (isLoggedIn()) {
        const user = getLoggedUser();
        if (user.role === 'CLIENTE') {
            window.location.href = 'index.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    }
    updateHeader();
});

async function realizarLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginSenha').value;

    try {
        const response = await fetch(`${API_AUTH}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        if (response.ok) {
            const loginData = await response.json(); // { token, email, role, nome, id, cpf, telefone, endereco }
            
            const currentUser = {
                token: loginData.token,
                email: loginData.email,
                role: loginData.role,
                nome: loginData.nome,
                id: loginData.id,
                cpf: loginData.cpf,
                telefone: loginData.telefone,
                endereco: loginData.endereco
            };

            localStorage.setItem('otica_user', JSON.stringify(currentUser));
            document.getElementById('formLogin').reset();
            
            alert("Login efetuado com sucesso!");

            // Redirecionamento baseado na role
            if (currentUser.role === 'ADMINISTRADOR' || currentUser.role === 'LABORATORISTA') {
                window.location.href = 'dashboard.html';
            } else {
                window.location.href = 'index.html';
            }
        } else {
            const erroMsg = await response.text();
            alert("Falha no login: " + erroMsg);
        }
    } catch (e) {
        console.error("Erro na requisição de login:", e);
        alert("Servidor inacessível.");
    }
}
