package br.com.oticaexpress.backend.DTO;

import br.com.oticaexpress.backend.Model.Enum.EnumEstado;

public record EnderecoAtualizacaoDTO(
    String cep,
    String rua,
    String cidade,
    String bairro,
    String complemento,
    EnumEstado estado,
    Integer numero
) {}
