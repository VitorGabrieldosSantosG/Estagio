package br.com.oticaexpress.backend.DTO.Response;

import br.com.oticaexpress.backend.Model.Endereco;
import br.com.oticaexpress.backend.Model.Enum.EnumEstado;

public record EnderecoResponseDTO(
        String cep,
        String rua,
        String cidade,
        String bairro,
        String complemento,
        EnumEstado estado,
        int numero) {
    public EnderecoResponseDTO(Endereco endereco) {
        this(
            endereco.getCep(), 
            endereco.getRua(), 
            endereco.getCidade(), 
            endereco.getBairro(),
            endereco.getComplemento(), 
            endereco.getEstado(), 
            endereco.getNumero());
    }
}
