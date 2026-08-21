package br.com.oticaexpress.backend.Controller;

import br.com.oticaexpress.backend.DTO.ArmacaoDTO;
import br.com.oticaexpress.backend.Model.Armacao;
import br.com.oticaexpress.backend.Service.ArmacaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/armacao")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ArmacaoController {

    private final ArmacaoService armacaoService;

    @GetMapping
    public ResponseEntity<?> listarTodos() {
        return ResponseEntity.ok(armacaoService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarArmacao(@PathVariable Long id) {
        return ResponseEntity.ok(armacaoService.buscarArmacao(id));
    }

    @GetMapping("/tipos")
    public ResponseEntity<?> listarTiposArmacao() {
        return ResponseEntity.ok(armacaoService.listarTiposArmacao());
    }

    @PostMapping
    public ResponseEntity<?> criarArmacao(@RequestBody @Valid ArmacaoDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(armacaoService.criarArmacao(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizarArmacao(@PathVariable Long id, @RequestBody Armacao armacao) {
        return ResponseEntity.ok(armacaoService.atualizarArmacao(id, armacao));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletarArmacao(@PathVariable Long id) {
        armacaoService.deletarArmacao(id);
        return ResponseEntity.ok("Armação deletada com sucesso!");
    }
}
