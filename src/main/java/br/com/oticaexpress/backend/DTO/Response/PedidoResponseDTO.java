package br.com.oticaexpress.backend.DTO.Response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import br.com.oticaexpress.backend.Model.Enum.EnumStatusPedido;
import br.com.oticaexpress.backend.Model.Pedido;

public record PedidoResponseDTO(
    Long id,
    Long usuarioId,
    String nomeUsuario,
    Long enderecoId,
    EnumStatusPedido status,
    String urlReceitaValidada,
    BigDecimal precoFrete,
    BigDecimal precoTotal,
    LocalDateTime dataCriacao,
    List<ItemPedidoResponseDTO> listaProdutos
) {
    public PedidoResponseDTO(Pedido pedido) {
        this(pedido.getId(),
             pedido.getUsuarioId() != null ? pedido.getUsuarioId().getId() : null,
             pedido.getUsuarioId() != null ? pedido.getUsuarioId().getNome() : null,
             pedido.getEnderecoId() != null ? pedido.getEnderecoId().getId() : null,
             pedido.getStatus(),
             pedido.getUrlReceitaValidada(),
             pedido.getPrecoFrete(),
             pedido.getPrecoTotal(),
             pedido.getDataCriacao(),
             pedido.getListaProdutos() != null
                 ? pedido.getListaProdutos().stream().map(ItemPedidoResponseDTO::new).toList()
                 : List.of());
    }
}
