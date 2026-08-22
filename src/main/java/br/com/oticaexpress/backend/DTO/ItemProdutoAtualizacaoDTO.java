package br.com.oticaexpress.backend.DTO;

import java.math.BigDecimal;
import br.com.oticaexpress.backend.Model.Enum.TipoArmacao;

public record ItemProdutoAtualizacaoDTO(
    String marca,
    Integer quantidade,
    BigDecimal preco,
    String cor,
    String tamanho,
    String modelo,
    String material,
    String imagemUrl,
    TipoArmacao tipo
) {}
