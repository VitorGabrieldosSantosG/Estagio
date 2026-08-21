package br.com.oticaexpress.backend.DTO.Response;

import java.math.BigDecimal;

import br.com.oticaexpress.backend.Model.Armacao;
import br.com.oticaexpress.backend.Model.Enum.TipoArmacao;

public record ArmacaoResponseDTO(
        String cor,
        String material,
        String modelo,
        String marca,
        String tamanho,
        String descricao,
        String imagemURL,
        Integer quantidade,
        TipoArmacao tipoArmacao,
        BigDecimal preco) {
    public ArmacaoResponseDTO(Armacao armacao) {
        this(
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
