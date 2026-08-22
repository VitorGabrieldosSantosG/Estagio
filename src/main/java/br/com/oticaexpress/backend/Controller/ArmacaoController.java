package br.com.oticaexpress.backend.Controller;

import br.com.oticaexpress.backend.DTO.ArmacaoAtualizacaoDTO;
import br.com.oticaexpress.backend.DTO.ArmacaoDTO;
import br.com.oticaexpress.backend.DTO.Response.ArmacaoResponseDTO;
import br.com.oticaexpress.backend.Model.Enum.TipoArmacao;
import br.com.oticaexpress.backend.Service.ArmacaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/armacao")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ArmacaoController {

    private final ArmacaoService armacaoService;

    @GetMapping
    public ResponseEntity<List<ArmacaoResponseDTO>> listarTodos() {
        return ResponseEntity.ok(armacaoService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ArmacaoResponseDTO> buscarArmacao(@PathVariable Long id) {
        return ResponseEntity.ok(armacaoService.buscarArmacao(id));
    }

    @GetMapping("/tipos")
    public ResponseEntity<TipoArmacao[]> listarTiposArmacao() {
        return ResponseEntity.ok(armacaoService.listarTiposArmacao());
    }

    @PostMapping
    public ResponseEntity<ArmacaoResponseDTO> criarArmacao(@RequestBody @Valid ArmacaoDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(armacaoService.criarArmacao(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ArmacaoResponseDTO> atualizarArmacao(@PathVariable Long id, @RequestBody ArmacaoAtualizacaoDTO dto) {
        return ResponseEntity.ok(armacaoService.atualizarArmacao(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletarArmacao(@PathVariable Long id) {
        armacaoService.deletarArmacao(id);
        return ResponseEntity.ok("Armação deletada com sucesso!");
    }
}
