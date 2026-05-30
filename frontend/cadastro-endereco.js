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
});

function irParaCadastroSenha(event) {
    event.preventDefault();
    
    const temp = localStorage.getItem('otica_temp_register');
    if (!temp) return;
    
    let data = JSON.parse(temp);
    data.cidade = document.getElementById('regCidade').value;
    data.estado = document.getElementById('regEstado').value;
    data.cep = document.getElementById('regCep').value;
    data.bairro = document.getElementById('regBairro').value;
    data.rua = document.getElementById('regRua').value;
    data.numero = parseInt(document.getElementById('regNumero').value);
    data.complemento = document.getElementById('regComplemento').value;

    localStorage.setItem('otica_temp_register', JSON.stringify(data));
    window.location.href = 'cadastro-senha.html';
}
