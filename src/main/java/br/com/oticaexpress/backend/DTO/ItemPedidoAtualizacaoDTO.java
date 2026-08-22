package br.com.oticaexpress.backend.DTO;

public record ItemPedidoAtualizacaoDTO(
    String marca,
    String modelo,
    String tamanho,
    String cor,
    Boolean ativo
) {}
