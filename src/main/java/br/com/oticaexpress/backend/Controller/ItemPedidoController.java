package br.com.oticaexpress.backend.Controller;

import java.util.Optional;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import br.com.oticaexpress.backend.DTO.ItemPedidoDTO;
import br.com.oticaexpress.backend.Model.Armacao;
import br.com.oticaexpress.backend.Model.ItemPedido;
import br.com.oticaexpress.backend.Model.Pedido;
import br.com.oticaexpress.backend.Repository.IArmacaoRepository;
import br.com.oticaexpress.backend.Repository.IItemPedidoRepository;
import br.com.oticaexpress.backend.Repository.IPedidoRepository;
import br.com.oticaexpress.backend.Util.Utils;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/item-pedido")
@CrossOrigin(origins = "*")
public class ItemPedidoController {

    @Autowired
    private IItemPedidoRepository itemPedidoRepository;

    @Autowired
    private IPedidoRepository pedidoRepository;

    @Autowired
    private IArmacaoRepository armacaoRepository;

    @GetMapping
    public ResponseEntity<?> listarItensPedido() {
        return ResponseEntity.ok(itemPedidoRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarItemPedidoId(@PathVariable Long id) {
        Optional<ItemPedido> itemPedido = itemPedidoRepository.findById(id);
        if (itemPedido.isPresent()) {
            return ResponseEntity.ok(itemPedido.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Item de pedido não localizado, tente com outro ID!");
        }
    }

    @PostMapping
    public ResponseEntity<?> criarItemPedido(@RequestBody @Valid ItemPedidoDTO itemPedidoDTO) {
        Optional<Pedido> buscaPedido = pedidoRepository.findById(itemPedidoDTO.pedidoId());
        if (!buscaPedido.isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Pedido não encontrado!");
        }

        Optional<Armacao> buscaArmacao = armacaoRepository.findById(itemPedidoDTO.produtoId());
        if (!buscaArmacao.isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Produto (armação) não encontrado!");
        }

        ItemPedido itemPedidoModel = new ItemPedido();
        BeanUtils.copyProperties(itemPedidoDTO, itemPedidoModel);
        itemPedidoModel.setPedidoId(buscaPedido.get());
        itemPedidoModel.setProdutoId(buscaArmacao.get());

        return ResponseEntity.status(HttpStatus.CREATED).body(itemPedidoRepository.save(itemPedidoModel));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizarItemPedido(@PathVariable Long id, @RequestBody ItemPedido itemPedido) {
        Optional<ItemPedido> buscaItemPedido = itemPedidoRepository.findById(id);
        if (buscaItemPedido.isPresent()) {
            ItemPedido itemPedidoExistente = buscaItemPedido.get();
            Utils.copyNonNullProperties(itemPedido, itemPedidoExistente);
            return ResponseEntity.ok().body(itemPedidoRepository.save(itemPedidoExistente));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Item de pedido não encontrado!");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletarItemPedido(@PathVariable Long id) {
        Optional<ItemPedido> buscaItemPedido = itemPedidoRepository.findById(id);
        if (buscaItemPedido.isPresent()) {
            itemPedidoRepository.deleteById(id);
            return ResponseEntity.ok().body("Item de pedido deletado com sucesso!");
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Item de pedido não encontrado!");
        }
    }
}
