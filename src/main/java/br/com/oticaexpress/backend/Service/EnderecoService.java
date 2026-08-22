package br.com.oticaexpress.backend.Service;

import br.com.oticaexpress.backend.DTO.EnderecoAtualizacaoDTO;
import br.com.oticaexpress.backend.DTO.EnderecoDTO;
import br.com.oticaexpress.backend.DTO.Response.EnderecoResponseDTO;
import br.com.oticaexpress.backend.Exception.RecursoNaoEncontradoException;
import br.com.oticaexpress.backend.Exception.RegraNegocioException;
import br.com.oticaexpress.backend.Model.Endereco;
import br.com.oticaexpress.backend.Model.Usuario;
import br.com.oticaexpress.backend.Repository.IEnderecoRepository;
import br.com.oticaexpress.backend.Repository.IUsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EnderecoService {

    private final IEnderecoRepository enderecoRepository;
    private final IUsuarioRepository usuarioRepository;

    public List<EnderecoResponseDTO> listarTodos() {
        return enderecoRepository.findAll().stream()
                .map(EnderecoResponseDTO::new)
                .toList();
    }

    public EnderecoResponseDTO buscarPorId(Long id) {
        Endereco endereco = enderecoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Endereço não encontrado!"));
        return new EnderecoResponseDTO(endereco);
    }

    public EnderecoResponseDTO criarEndereco(EnderecoDTO dto) {
        Usuario usuario = usuarioRepository.findById(dto.usuarioId())
                .orElseThrow(() -> new RegraNegocioException("Usuário não encontrado para associar o endereço!"));

        Endereco endereco = new Endereco();
        BeanUtils.copyProperties(dto, endereco, "usuarioId");
        
        Endereco savedEndereco = enderecoRepository.save(endereco);
        usuario.setEndereco(savedEndereco);
        usuarioRepository.save(usuario);
        
        return new EnderecoResponseDTO(savedEndereco);
    }

    public EnderecoResponseDTO atualizarEndereco(Long id, EnderecoAtualizacaoDTO dto) {
        Endereco endereco = enderecoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Endereço não encontrado!"));

        if (dto.cep() != null) endereco.setCep(dto.cep());
        if (dto.rua() != null) endereco.setRua(dto.rua());
        if (dto.cidade() != null) endereco.setCidade(dto.cidade());
        if (dto.bairro() != null) endereco.setBairro(dto.bairro());
        if (dto.complemento() != null) endereco.setComplemento(dto.complemento());
        if (dto.estado() != null) endereco.setEstado(dto.estado());
        if (dto.numero() != null) endereco.setNumero(dto.numero());

        Endereco salvo = enderecoRepository.save(endereco);
        return new EnderecoResponseDTO(salvo);
    }

    public void deletarEndereco(Long id) {
        Endereco endereco = enderecoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Endereço não encontrado!"));
                
        Usuario usuario = endereco.getUsarioId();
        if (usuario != null) {
            usuario.setEndereco(null);
            usuarioRepository.save(usuario);
        }
        
        enderecoRepository.deleteById(endereco.getId());
    }
}
