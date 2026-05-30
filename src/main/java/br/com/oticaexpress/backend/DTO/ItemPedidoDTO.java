package br.com.oticaexpress.backend.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ItemPedidoDTO(
    @NotNull(message = "O ID do pedido não pode ser nulo")
    Long pedidoId,

    @NotNull(message = "O ID do produto (armação) não pode ser nulo")
    Long produtoId,

    @NotBlank(message = "O campo marca não pode ser nulo ou vazio")
    String marca,

    @NotBlank(message = "O campo modelo não pode ser nulo ou vazio")
    String modelo,

    @NotBlank(message = "O campo tamanho não pode ser nulo ou vazio")
    String tamanho,

    @NotBlank(message = "O campo cor não pode ser nulo ou vazio")
    String cor,

    boolean ativo
) {}
