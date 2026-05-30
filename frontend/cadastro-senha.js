document.addEventListener('DOMContentLoaded', () => {
    updateHeader();
    
    // Validar se dados anteriores existem
    const temp = localStorage.getItem('otica_temp_register');
    if (!temp) {
        alert("Preencha primeiro os dados do cadastro!");
        window.location.href = 'cadastro.html';
        return;
    }
});

async function finalizarCadastro(event) {
    event.preventDefault();
    
    const senha = document.getElementById('regSenha').value;
    const senhaRepetida = document.getElementById('regSenhaRepetida').value;
    const role = document.getElementById('regRole').value;

    if (senha !== senhaRepetida) {
        alert("As senhas não coincidem!");
        return;
    }

    const temp = localStorage.getItem('otica_temp_register');
    if (!temp) return;
    
    const data = JSON.parse(temp);
    data.senha = senha;
    data.role = role;

    // Payload do Usuário
    const userPayload = {
        nome: data.nome,
        email: data.email,
        senha: data.senha,
        cpf: data.cpf,
        telefone: data.telefone,
        role: data.role
    };

    try {
        // 1. Criar o Usuário
        const resUser = await fetch(API_USUARIO, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userPayload)
        });

        if (!resUser.ok) {
            const erroMsg = await resUser.text();
            alert("Erro no cadastro de usuário: " + erroMsg);
            return;
        }

        const userSalvo = await resUser.json();

        // 2. Login automático para obter token
        const resLogin = await fetch(`${API_AUTH}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: data.email, senha: data.senha })
        });

        if (!resLogin.ok) {
            alert("Erro ao realizar login automático.");
            window.location.href = 'login.html';
            return;
        }

        const loginData = await resLogin.json();

        // 3. Criar o Endereço
        const addressPayload = {
            cep: data.cep,
            rua: data.rua,
            cidade: data.cidade,
            bairro: data.bairro,
            complemento: data.complemento,
            estado: data.estado,
            numero: data.numero,
            usuarioId: userSalvo.id
        };

        const resAddress = await fetch(API_ENDERECO, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${loginData.token}`
            },
            body: JSON.stringify(addressPayload)
        });

        if (!resAddress.ok) {
            alert("Erro ao cadastrar endereço. Conecte-se e tente novamente.");
            window.location.href = 'login.html';
            return;
        }

        const addressSalvo = await resAddress.json();

        // Guardar no local e global
        const currentUser = {
            token: loginData.token,
            email: loginData.email,
            role: loginData.role,
            nome: loginData.nome,
            id: userSalvo.id,
            cpf: userSalvo.cpf,
            telefone: userSalvo.telefone,
            endereco: addressSalvo
        };

        localStorage.setItem('otica_user', JSON.stringify(currentUser));
        localStorage.removeItem('otica_temp_register');

        alert("Conta e endereço criados com sucesso!");

        // Redirecionamento com base no cargo
        if (currentUser.role === 'ADMINISTRADOR' || currentUser.role === 'LABORATORISTA') {
            window.location.href = 'dashboard.html';
        } else {
            window.location.href = 'index.html';
        }

    } catch (e) {
        console.error("Erro no cadastro completo:", e);
        alert("Falha ao comunicar com o servidor.");
    }
}
