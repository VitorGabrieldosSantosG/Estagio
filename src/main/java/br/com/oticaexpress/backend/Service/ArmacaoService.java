package br.com.oticaexpress.backend.Service;

import br.com.oticaexpress.backend.DTO.ArmacaoAtualizacaoDTO;
import br.com.oticaexpress.backend.DTO.ArmacaoDTO;
import br.com.oticaexpress.backend.DTO.Response.ArmacaoResponseDTO;
import br.com.oticaexpress.backend.Exception.RecursoNaoEncontradoException;
import br.com.oticaexpress.backend.Model.Armacao;
import br.com.oticaexpress.backend.Model.Enum.TipoArmacao;
import br.com.oticaexpress.backend.Repository.IArmacaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ArmacaoService {

    private final IArmacaoRepository armacaoRepository;

    public List<ArmacaoResponseDTO> listarTodos() {
        return armacaoRepository.findAll().stream()
                .map(ArmacaoResponseDTO::new)
                .toList();
    }

    public ArmacaoResponseDTO buscarArmacao(Long id) {
        Armacao armacao = armacaoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Armação não encontrada!"));
        return new ArmacaoResponseDTO(armacao);
    }

    public TipoArmacao[] listarTiposArmacao() {
        return TipoArmacao.values();
    }

    public ArmacaoResponseDTO criarArmacao(ArmacaoDTO dto) {
        Armacao armacao = new Armacao();
        BeanUtils.copyProperties(dto, armacao);
        Armacao salva = armacaoRepository.save(armacao);
        return new ArmacaoResponseDTO(salva);
    }

    public ArmacaoResponseDTO atualizarArmacao(Long id, ArmacaoAtualizacaoDTO dto) {
        Armacao armacao = armacaoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Armação não encontrada!"));

        if (dto.cor() != null) armacao.setCor(dto.cor());
        if (dto.material() != null) armacao.setMaterial(dto.material());
        if (dto.modelo() != null) armacao.setModelo(dto.modelo());
        if (dto.marca() != null) armacao.setMarca(dto.marca());
        if (dto.tamanho() != null) armacao.setTamanho(dto.tamanho());
        if (dto.descricao() != null) armacao.setDescricao(dto.descricao());
        if (dto.imagemUrl() != null) armacao.setImagemUrl(dto.imagemUrl());
        if (dto.quantidade() != null) armacao.setQuantidade(dto.quantidade());
        if (dto.preco() != null) armacao.setPreco(dto.preco());
        if (dto.tipo() != null) armacao.setTipo(dto.tipo());

        Armacao salva = armacaoRepository.save(armacao);
        return new ArmacaoResponseDTO(salva);
    }

    public void deletarArmacao(Long id) {
        Armacao armacao = armacaoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Armação não encontrada!"));
        armacaoRepository.deleteById(armacao.getId());
    }
}
