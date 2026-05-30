package br.com.oticaexpress.backend.Controller;

import java.util.Optional;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import br.com.oticaexpress.backend.DTO.EnderecoDTO;
import br.com.oticaexpress.backend.Model.Endereco;
import br.com.oticaexpress.backend.Model.Usuario;
import br.com.oticaexpress.backend.Repository.IEnderecoRepository;
import br.com.oticaexpress.backend.Repository.IUsuarioRepository;
import br.com.oticaexpress.backend.Util.Utils;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/endereco")
@CrossOrigin(origins = "*")
public class EnderecoController {

    @Autowired
    private IEnderecoRepository enderecoRepository;

    @Autowired
    private IUsuarioRepository usuarioRepository;

    @GetMapping
    public ResponseEntity<?> listarEnderecos() {
        return ResponseEntity.ok(enderecoRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarEnderecoId(@PathVariable Long id) {
        Optional<Endereco> endereco = enderecoRepository.findById(id);
        if (endereco.isPresent()) {
            return ResponseEntity.ok(endereco.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Endereço não localizado, tente com outro ID!");
        }
    }

    @PostMapping
    public ResponseEntity<?> criarEndereco(@RequestBody @Valid EnderecoDTO enderecoDTO) {
        Optional<Usuario> buscaUsuario = usuarioRepository.findById(enderecoDTO.usuarioId());
        if (!buscaUsuario.isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Usuário não encontrado para associar o endereço!");
        }
        Usuario usuario = buscaUsuario.get();

        Endereco enderecoModel = new Endereco();
        BeanUtils.copyProperties(enderecoDTO, enderecoModel);

        Endereco enderecoSalvo = enderecoRepository.save(enderecoModel);

        usuario.setEndereco(enderecoSalvo);
        usuarioRepository.save(usuario);

        return ResponseEntity.status(HttpStatus.CREATED).body(enderecoSalvo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizarEndereco(@PathVariable Long id, @RequestBody Endereco endereco) {
        Optional<Endereco> buscaEndereco = enderecoRepository.findById(id);
        if (buscaEndereco.isPresent()) {
            Endereco enderecoExistente = buscaEndereco.get();
            Utils.copyNonNullProperties(endereco, enderecoExistente);
            return ResponseEntity.ok().body(enderecoRepository.save(enderecoExistente));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Endereço não encontrado!");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletarEndereco(@PathVariable Long id) {
        Optional<Endereco> buscaEndereco = enderecoRepository.findById(id);
        if (buscaEndereco.isPresent()) {
            Endereco endereco = buscaEndereco.get();
            Usuario usuario = endereco.getUsarioId();
            if (usuario != null) {
                usuario.setEndereco(null);
                usuarioRepository.save(usuario);
            }
            enderecoRepository.deleteById(id);
            return ResponseEntity.ok().body("Endereço deletado com sucesso!");
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Endereço não encontrado!");
        }
    }
}
