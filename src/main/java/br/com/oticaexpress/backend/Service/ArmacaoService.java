package br.com.oticaexpress.backend.Service;

import br.com.oticaexpress.backend.DTO.ArmacaoDTO;
import br.com.oticaexpress.backend.DTO.Response.ArmacaoResponseDTO;
import br.com.oticaexpress.backend.Exception.RecursoNaoEncontradoException;
import br.com.oticaexpress.backend.Model.Armacao;
import br.com.oticaexpress.backend.Model.Enum.TipoArmacao;
import br.com.oticaexpress.backend.Repository.IArmacaoRepository;
import br.com.oticaexpress.backend.Util.Utils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ArmacaoService {

    private final IArmacaoRepository armacaoRepository;

    public List<Armacao> listarTodos() {
        return armacaoRepository.findAll();
    }

    public ArmacaoResponseDTO buscarArmacao(Long id) {
        Armacao armacao = armacaoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Armação não encontrada!"));
        return new ArmacaoResponseDTO(armacao);
    }

    public TipoArmacao[] listarTiposArmacao() {
        return TipoArmacao.values();
    }

    public Armacao criarArmacao(ArmacaoDTO dto) {
        Armacao armacao = new Armacao();
        BeanUtils.copyProperties(dto, armacao);
        return armacaoRepository.save(armacao);
    }

    public Armacao atualizarArmacao(Long id, Armacao armacaoAtualizada) {
        Armacao armacao = armacaoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Armação não encontrada!"));
        Utils.copyNonNullProperties(armacaoAtualizada, armacao);
        return armacaoRepository.save(armacao);
    }

    public void deletarArmacao(Long id) {
        Armacao armacao = armacaoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Armação não encontrada!"));
        armacaoRepository.deleteById(armacao.getId());
    }
}
