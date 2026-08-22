package br.com.oticaexpress.backend.DTO.Response;

import java.math.BigDecimal;

import br.com.oticaexpress.backend.Model.Armacao;
import br.com.oticaexpress.backend.Model.Enum.TipoArmacao;

public record ArmacaoResponseDTO(
        Long id,
        String cor,
        String material,
        String modelo,
        String marca,
        String tamanho,
        String descricao,
        String imagemUrl,
        Integer quantidade,
        TipoArmacao tipo,
        BigDecimal preco) {
    public ArmacaoResponseDTO(Armacao armacao) {
        this(
                armacao.getId(),
                armacao.getCor(),
                armacao.getMaterial(),
                armacao.getModelo(),
                armacao.getMarca(),
                armacao.getTamanho(),
                armacao.getDescricao(),
                armacao.getImagemUrl(),
                armacao.getQuantidade(),
                armacao.getTipo(),
                armacao.getPreco());
    }
}
