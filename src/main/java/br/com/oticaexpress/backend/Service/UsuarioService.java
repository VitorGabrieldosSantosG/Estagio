package br.com.oticaexpress.backend.Service;

import br.com.oticaexpress.backend.DTO.UsuarioDTO;
import br.com.oticaexpress.backend.Exception.RecursoNaoEncontradoException;
import br.com.oticaexpress.backend.Exception.RegraNegocioException;
import br.com.oticaexpress.backend.Model.Usuario;
import br.com.oticaexpress.backend.Repository.IUsuarioRepository;
import br.com.oticaexpress.backend.Util.Utils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final IUsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public List<Usuario> listarTodos() {
        return usuarioRepository.findAll();
    }

    public Usuario buscarPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não localizado"));
    }

    public Usuario criarUsuario(UsuarioDTO dto) {
        if (usuarioRepository.findByEmail(dto.email()).isPresent()) {
            throw new RegraNegocioException("E-mail já cadastrado!");
        }
        if (usuarioRepository.findByCpf(dto.cpf()).isPresent()) {
            throw new RegraNegocioException("CPF já cadastrado!");
        }

        Usuario usuario = new Usuario();
        BeanUtils.copyProperties(dto, usuario);
        usuario.setSenha(passwordEncoder.encode(dto.senha()));
        
        return usuarioRepository.save(usuario);
    }

    public Usuario atualizarUsuario(Long id, Usuario usuarioAtualizado) {
        Usuario usuarioExistente = usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não localizado"));

        if (usuarioAtualizado.getSenha() != null && !usuarioAtualizado.getSenha().isBlank() && 
            !usuarioAtualizado.getSenha().equals(usuarioExistente.getSenha())) {
            usuarioAtualizado.setSenha(passwordEncoder.encode(usuarioAtualizado.getSenha()));
        }

        Utils.copyNonNullProperties(usuarioAtualizado, usuarioExistente);
        return usuarioRepository.save(usuarioExistente);
    }

    public void deletarUsuario(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não localizado"));
        usuarioRepository.deleteById(usuario.getId());
    }
}
