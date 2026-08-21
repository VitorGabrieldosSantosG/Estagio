package br.com.oticaexpress.backend.DTO.Response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import br.com.oticaexpress.backend.Model.Enum.TipoArmacao;
import br.com.oticaexpress.backend.Model.ItemProduto;

public record ItemProdutoResponseDTO(
    Long id,
    Long armacaoId,
    String marca,
    Integer quantidade,
    BigDecimal preco,
    String cor,
    String tamanho,
    String modelo,
    String material,
    String imagemUrl,
    TipoArmacao tipo,
    LocalDateTime criadoEm
) {
    public ItemProdutoResponseDTO(ItemProduto item) {
        this(item.getId(),
             item.getArmacao() != null ? item.getArmacao().getId() : null,
             item.getMarca(),
             item.getQuantidade(),
             item.getPreco(),
             item.getCor(),
             item.getTamanho(),
             item.getModelo(),
             item.getMaterial(),
             item.getImagemUrl(),
             item.getTipo(),
             item.getCriadoEm());
    }
}
