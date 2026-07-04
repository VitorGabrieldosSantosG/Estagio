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

    // Configurar máscaras dinâmicas
    const cpfInput = document.getElementById('regCpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            if (val.length > 11) val = val.slice(0, 11);
            if (val.length <= 3) {
                e.target.value = val;
            } else if (val.length <= 6) {
                e.target.value = val.slice(0, 3) + '.' + val.slice(3);
            } else if (val.length <= 9) {
                e.target.value = val.slice(0, 3) + '.' + val.slice(3, 6) + '.' + val.slice(6);
            } else {
                e.target.value = val.slice(0, 3) + '.' + val.slice(3, 6) + '.' + val.slice(6, 9) + '-' + val.slice(9);
            }
        });
    }

    const telInput = document.getElementById('regTelefone');
    if (telInput) {
        telInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            if (val.length > 11) val = val.slice(0, 11);
            
            if (val.length === 0) {
                e.target.value = '';
            } else if (val.length <= 2) {
                e.target.value = '(' + val;
            } else if (val.length <= 6) {
                e.target.value = '(' + val.slice(0, 2) + ') ' + val.slice(2);
            } else if (val.length <= 10) {
                e.target.value = '(' + val.slice(0, 2) + ') ' + val.slice(2, 6) + '-' + val.slice(6);
            } else {
                e.target.value = '(' + val.slice(0, 2) + ') ' + val.slice(2, 7) + '-' + val.slice(7);
            }
        });
    }
});

function irParaCadastroEndereco(event) {
    event.preventDefault();
    
    const cpfValue = document.getElementById('regCpf').value;
    const telValue = document.getElementById('regTelefone').value;

    const cpfRaw = cpfValue.replace(/\D/g, '');
    if (cpfRaw.length !== 11) {
        alert('CPF inválido! O CPF deve conter 11 dígitos.');
        return;
    }

    const telRaw = telValue.replace(/\D/g, '');
    if (telRaw.length < 10 || telRaw.length > 11) {
        alert('Telefone inválido! Digite o DDD + número (10 ou 11 dígitos).');
        return;
    }

    const tempRegister = {
        nome: document.getElementById('regNome').value,
        email: document.getElementById('regEmail').value,
        cpf: cpfValue,
        telefone: telValue
    };

    localStorage.setItem('otica_temp_register', JSON.stringify(tempRegister));
    window.location.href = 'cadastro-endereco.html';
}
