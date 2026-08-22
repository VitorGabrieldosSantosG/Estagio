package br.com.oticaexpress.backend.DTO;

import java.math.BigDecimal;
import br.com.oticaexpress.backend.Model.Enum.EnumStatusPedido;

public record PedidoAtualizacaoDTO(
    EnumStatusPedido status,
    String urlReceitaValidada,
    BigDecimal precoFrete,
    BigDecimal precoTotal
) {}
