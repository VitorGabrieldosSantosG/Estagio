package br.com.oticaexpress.backend.DTO.Response;

import br.com.oticaexpress.backend.Model.ItemPedido;

public record ItemPedidoResponseDTO(
    Long id,
    Long pedidoId,
    Long produtoId,
    String marca,
    String modelo,
    String tamanho,
    String cor,
    boolean ativo
) {
    public ItemPedidoResponseDTO(ItemPedido item) {
        this(item.getId(),
             item.getPedidoId() != null ? item.getPedidoId().getId() : null,
             item.getProdutoId() != null ? item.getProdutoId().getId() : null,
             item.getMarca(),
             item.getModelo(),
             item.getTamanho(),
             item.getCor(),
             item.isAtivo());
    }
}
