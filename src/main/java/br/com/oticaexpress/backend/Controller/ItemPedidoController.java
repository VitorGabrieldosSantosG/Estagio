package br.com.oticaexpress.backend.Controller;

import br.com.oticaexpress.backend.DTO.ItemPedidoDTO;
import br.com.oticaexpress.backend.Model.ItemPedido;
import br.com.oticaexpress.backend.Service.ItemPedidoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/item-pedido")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ItemPedidoController {

    private final ItemPedidoService itemPedidoService;

    @GetMapping
    public ResponseEntity<?> listarTodos() {
        return ResponseEntity.ok(itemPedidoService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(itemPedidoService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<?> criarItemPedido(@RequestBody @Valid ItemPedidoDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(itemPedidoService.criarItemPedido(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizarItemPedido(@PathVariable Long id, @RequestBody ItemPedido itemPedido) {
        return ResponseEntity.ok(itemPedidoService.atualizarItemPedido(id, itemPedido));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletarItemPedido(@PathVariable Long id) {
        itemPedidoService.deletarItemPedido(id);
        return ResponseEntity.ok("Item de pedido deletado com sucesso!");
    }
}
