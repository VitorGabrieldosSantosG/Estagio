package br.com.oticaexpress.backend.Controller;

import java.util.Optional;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import br.com.oticaexpress.backend.DTO.UsuarioDTO;
import br.com.oticaexpress.backend.Model.Usuario;
import br.com.oticaexpress.backend.Repository.IUsuarioRepository;
import br.com.oticaexpress.backend.Util.Utils;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/usuario")
@CrossOrigin(origins = "*")
public class UsuarioController {

    @Autowired
    private IUsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<?> listarUsuarios() {
        return ResponseEntity.ok(usuarioRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarUsuarioId(@PathVariable Long id) {
        Optional<Usuario> usuario = usuarioRepository.findById(id);
        if (usuario.isPresent()) {
            return ResponseEntity.ok(usuario.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuário não localizado, tente com outro ID!");
        }
    }

    @PostMapping
    public ResponseEntity<?> criarUsuario(@RequestBody @Valid UsuarioDTO usuarioDTO) {
        if (usuarioRepository.findByEmail(usuarioDTO.email()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("E-mail já cadastrado!");
        }
        if (usuarioRepository.findByCpf(usuarioDTO.cpf()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("CPF já cadastrado!");
        }

        Usuario usuarioModel = new Usuario();
        BeanUtils.copyProperties(usuarioDTO, usuarioModel);
        usuarioModel.setSenha(passwordEncoder.encode(usuarioDTO.senha()));

        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioRepository.save(usuarioModel));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizarUsuario(@PathVariable Long id, @RequestBody Usuario usuario) {
        Optional<Usuario> buscaUsuario = usuarioRepository.findById(id);
        if (buscaUsuario.isPresent()) {
            Usuario usuarioExistente = buscaUsuario.get();
            
            if (usuario.getSenha() != null && !usuario.getSenha().isBlank() && !usuario.getSenha().equals(usuarioExistente.getSenha())) {
                usuario.setSenha(passwordEncoder.encode(usuario.getSenha()));
            }
            
            Utils.copyNonNullProperties(usuario, usuarioExistente);
            return ResponseEntity.ok().body(usuarioRepository.save(usuarioExistente));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuário não encontrado!");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletarUsuario(@PathVariable Long id) {
        Optional<Usuario> buscaUsuario = usuarioRepository.findById(id);
        if (buscaUsuario.isPresent()) {
            usuarioRepository.deleteById(id);
            return ResponseEntity.ok().body("Usuário deletado com sucesso!");
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Usuário não encontrado!");
        }
    }
}
