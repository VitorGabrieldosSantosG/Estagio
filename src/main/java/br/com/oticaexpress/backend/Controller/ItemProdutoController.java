package br.com.oticaexpress.backend.Controller;

import br.com.oticaexpress.backend.DTO.ItemProdutoDTO;
import br.com.oticaexpress.backend.Model.ItemProduto;
import br.com.oticaexpress.backend.Service.ItemProdutoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/item-produto")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ItemProdutoController {

    private final ItemProdutoService itemProdutoService;

    @GetMapping
    public ResponseEntity<?> listarTodos() {
        return ResponseEntity.ok(itemProdutoService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(itemProdutoService.buscarPorId(id));
    }

    @GetMapping("/armacao/{armacaoId}")
    public ResponseEntity<?> buscarPorArmacaoId(@PathVariable Long armacaoId) {
        return ResponseEntity.ok(itemProdutoService.buscarPorArmacaoId(armacaoId));
    }

    @PostMapping
    public ResponseEntity<?> criarItemProduto(@RequestBody @Valid ItemProdutoDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(itemProdutoService.criarItemProduto(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizarItemProduto(@PathVariable Long id, @RequestBody ItemProduto itemProduto) {
        return ResponseEntity.ok(itemProdutoService.atualizarItemProduto(id, itemProduto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletarItemProduto(@PathVariable Long id) {
        itemProdutoService.deletarItemProduto(id);
        return ResponseEntity.ok("Item de produto deletado com sucesso!");
    }
}
