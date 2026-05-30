document.addEventListener('DOMContentLoaded', () => {
    updateHeader();
    
    // Se houver dados temporários anteriores, pré-carregar
    const temp = localStorage.getItem('otica_temp_register');
    if (temp) {
        const data = JSON.parse(temp);
        if (data.nome) document.getElementById('regNome').value = data.nome;
        if (data.email) document.getElementById('regEmail').value = data.email;
        if (data.cpf) document.getElementById('regCpf').value = data.cpf;
        if (data.telefone) document.getElementById('regTelefone').value = data.telefone;
    }
});

function irParaCadastroEndereco(event) {
    event.preventDefault();
    
    const tempRegister = {
        nome: document.getElementById('regNome').value,
        email: document.getElementById('regEmail').value,
        cpf: document.getElementById('regCpf').value,
        telefone: document.getElementById('regTelefone').value
    };

    localStorage.setItem('otica_temp_register', JSON.stringify(tempRegister));
    window.location.href = 'cadastro-endereco.html';
}
