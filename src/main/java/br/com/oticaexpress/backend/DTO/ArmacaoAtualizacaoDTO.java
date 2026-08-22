package br.com.oticaexpress.backend.DTO;

import java.math.BigDecimal;
import br.com.oticaexpress.backend.Model.Enum.TipoArmacao;

public record ArmacaoAtualizacaoDTO(
    String cor,
    String material,
    String modelo,
    String marca,
    String tamanho,
    String descricao,
    String imagemUrl,
    Integer quantidade,
    BigDecimal preco,
    TipoArmacao tipo
) {}
