package br.com.oticaexpress.backend.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import br.com.oticaexpress.backend.Model.Enum.TipoArmacao;

public record ItemProdutoDTO(
    @NotNull Long armacaoId,
    @NotBlank String marca,
    @NotNull @PositiveOrZero Integer quantidade,
    @NotNull @PositiveOrZero BigDecimal preco,
    @NotBlank String cor,
    @NotBlank String tamanho,
    @NotBlank String modelo,
    @NotBlank String material,
    @NotBlank String imagemUrl,
    TipoArmacao tipo
) {}
