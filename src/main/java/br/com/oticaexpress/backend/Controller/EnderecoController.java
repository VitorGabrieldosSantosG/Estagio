package br.com.oticaexpress.backend.Controller;

import br.com.oticaexpress.backend.DTO.EnderecoAtualizacaoDTO;
import br.com.oticaexpress.backend.DTO.EnderecoDTO;
import br.com.oticaexpress.backend.DTO.Response.EnderecoResponseDTO;
import br.com.oticaexpress.backend.Service.EnderecoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/endereco")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class EnderecoController {

    private final EnderecoService enderecoService;

    @GetMapping
    public ResponseEntity<List<EnderecoResponseDTO>> listarTodos() {
        return ResponseEntity.ok(enderecoService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EnderecoResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(enderecoService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<EnderecoResponseDTO> criarEndereco(@RequestBody @Valid EnderecoDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(enderecoService.criarEndereco(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EnderecoResponseDTO> atualizarEndereco(@PathVariable Long id, @RequestBody EnderecoAtualizacaoDTO dto) {
        return ResponseEntity.ok(enderecoService.atualizarEndereco(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletarEndereco(@PathVariable Long id) {
        enderecoService.deletarEndereco(id);
        return ResponseEntity.ok("Endereço deletado com sucesso!");
    }
}
