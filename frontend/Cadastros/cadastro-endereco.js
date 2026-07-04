document.addEventListener('DOMContentLoaded', () => {
    updateHeader();
    
    // Validar se o passo 1 foi preenchido, senão voltar
    const temp = localStorage.getItem('otica_temp_register');
    if (!temp) {
        alert("Preencha primeiro os dados pessoais!");
        window.location.href = 'cadastro.html';
        return;
    }

    const data = JSON.parse(temp);
    if (data.cidade) document.getElementById('regCidade').value = data.cidade;
    if (data.estado) document.getElementById('regEstado').value = data.estado;
    if (data.cep) document.getElementById('regCep').value = data.cep;
    if (data.bairro) document.getElementById('regBairro').value = data.bairro;
    if (data.rua) document.getElementById('regRua').value = data.rua;
    if (data.numero) document.getElementById('regNumero').value = data.numero;
    if (data.complemento) document.getElementById('regComplemento').value = data.complemento;

    // Configurar máscara de CEP
    const cepInput = document.getElementById('regCep');
    if (cepInput) {
        cepInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            if (val.length > 8) val = val.slice(0, 8);
            if (val.length <= 5) {
                e.target.value = val;
            } else {
                e.target.value = val.slice(0, 5) + '-' + val.slice(5);
            }
        });
    }
});

function irParaCadastroSenha(event) {
    event.preventDefault();
    
    const temp = localStorage.getItem('otica_temp_register');
    if (!temp) return;
    
    const cepValue = document.getElementById('regCep').value;
    const cepRaw = cepValue.replace(/\D/g, '');
    if (cepRaw.length !== 8) {
        alert('CEP inválido! O CEP deve conter 8 dígitos.');
        return;
    }

    let data = JSON.parse(temp);
    data.cidade = document.getElementById('regCidade').value;
    data.estado = document.getElementById('regEstado').value;
    data.cep = cepValue;
    data.bairro = document.getElementById('regBairro').value;
    data.rua = document.getElementById('regRua').value;
    data.numero = parseInt(document.getElementById('regNumero').value);
    data.complemento = document.getElementById('regComplemento').value;

    localStorage.setItem('otica_temp_register', JSON.stringify(data));
    window.location.href = 'cadastro-senha.html';
}
