package br.com.oticaexpress.backend.Controller;

import br.com.oticaexpress.backend.DTO.ItemProdutoAtualizacaoDTO;
import br.com.oticaexpress.backend.DTO.ItemProdutoDTO;
import br.com.oticaexpress.backend.DTO.Response.ItemProdutoResponseDTO;
import br.com.oticaexpress.backend.Service.ItemProdutoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/item-produto")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ItemProdutoController {

    private final ItemProdutoService itemProdutoService;

    @GetMapping
    public ResponseEntity<List<ItemProdutoResponseDTO>> listarTodos() {
        return ResponseEntity.ok(itemProdutoService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ItemProdutoResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(itemProdutoService.buscarPorId(id));
    }

    @GetMapping("/armacao/{armacaoId}")
    public ResponseEntity<List<ItemProdutoResponseDTO>> buscarPorArmacaoId(@PathVariable Long armacaoId) {
        return ResponseEntity.ok(itemProdutoService.buscarPorArmacaoId(armacaoId));
    }

    @PostMapping
    public ResponseEntity<ItemProdutoResponseDTO> criarItemProduto(@RequestBody @Valid ItemProdutoDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(itemProdutoService.criarItemProduto(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ItemProdutoResponseDTO> atualizarItemProduto(@PathVariable Long id, @RequestBody ItemProdutoAtualizacaoDTO dto) {
        return ResponseEntity.ok(itemProdutoService.atualizarItemProduto(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletarItemProduto(@PathVariable Long id) {
        itemProdutoService.deletarItemProduto(id);
        return ResponseEntity.ok("Item de produto deletado com sucesso!");
    }
}
