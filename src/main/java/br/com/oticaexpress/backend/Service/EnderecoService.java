package br.com.oticaexpress.backend.Service;

import br.com.oticaexpress.backend.DTO.EnderecoDTO;
import br.com.oticaexpress.backend.Exception.RecursoNaoEncontradoException;
import br.com.oticaexpress.backend.Exception.RegraNegocioException;
import br.com.oticaexpress.backend.Model.Endereco;
import br.com.oticaexpress.backend.Model.Usuario;
import br.com.oticaexpress.backend.Repository.IEnderecoRepository;
import br.com.oticaexpress.backend.Repository.IUsuarioRepository;
import br.com.oticaexpress.backend.Util.Utils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EnderecoService {

    private final IEnderecoRepository enderecoRepository;
    private final IUsuarioRepository usuarioRepository;

    public List<Endereco> listarTodos() {
        return enderecoRepository.findAll();
    }

    public Endereco buscarPorId(Long id) {
        return enderecoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Endereço não encontrado!"));
    }

    public Endereco criarEndereco(EnderecoDTO dto) {
        Usuario usuario = usuarioRepository.findById(dto.usuarioId())
                .orElseThrow(() -> new RegraNegocioException("Usuário não encontrado para associar o endereço!"));

        Endereco endereco = new Endereco();
        BeanUtils.copyProperties(dto, endereco, "usuarioId");
        
        Endereco savedEndereco = enderecoRepository.save(endereco);
        usuario.setEndereco(savedEndereco);
        usuarioRepository.save(usuario);
        
        return savedEndereco;
    }

    public Endereco atualizarEndereco(Long id, Endereco enderecoAtualizado) {
        Endereco enderecoExistente = enderecoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Endereço não encontrado!"));
                
        Utils.copyNonNullProperties(enderecoAtualizado, enderecoExistente);
        return enderecoRepository.save(enderecoExistente);
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
