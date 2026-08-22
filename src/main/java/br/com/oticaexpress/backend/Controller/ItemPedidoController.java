package br.com.oticaexpress.backend.Controller;

import br.com.oticaexpress.backend.DTO.ItemPedidoAtualizacaoDTO;
import br.com.oticaexpress.backend.DTO.ItemPedidoDTO;
import br.com.oticaexpress.backend.DTO.Response.ItemPedidoResponseDTO;
import br.com.oticaexpress.backend.Service.ItemPedidoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/item-pedido")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ItemPedidoController {

    private final ItemPedidoService itemPedidoService;

    @GetMapping
    public ResponseEntity<List<ItemPedidoResponseDTO>> listarTodos() {
        return ResponseEntity.ok(itemPedidoService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ItemPedidoResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(itemPedidoService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<ItemPedidoResponseDTO> criarItemPedido(@RequestBody @Valid ItemPedidoDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(itemPedidoService.criarItemPedido(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ItemPedidoResponseDTO> atualizarItemPedido(@PathVariable Long id, @RequestBody ItemPedidoAtualizacaoDTO dto) {
        return ResponseEntity.ok(itemPedidoService.atualizarItemPedido(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletarItemPedido(@PathVariable Long id) {
        itemPedidoService.deletarItemPedido(id);
        return ResponseEntity.ok("Item de pedido deletado com sucesso!");
    }
}
