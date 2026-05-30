package br.com.oticaexpress.backend.DTO;

import java.math.BigDecimal;
import br.com.oticaexpress.backend.Model.Enum.EnumStatusPedido;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record PedidoDTO(
    @NotNull(message = "O ID do usuário não pode ser nulo")
    Long usuarioId,

    @NotNull(message = "O ID do endereço não pode ser nulo")
    Long enderecoId,

    @NotNull(message = "O status do pedido não pode ser nulo")
    EnumStatusPedido status,

    String urlReceitaValidada,

    @NotNull(message = "O preço do frete não pode ser nulo")
    @PositiveOrZero(message = "O preço do frete deve ser maior ou igual a zero")
    BigDecimal precoFrete,

    @NotNull(message = "O preço total não pode ser nulo")
    @PositiveOrZero(message = "O preço total deve ser maior ou igual a zero")
    BigDecimal precoTotal
) {}
