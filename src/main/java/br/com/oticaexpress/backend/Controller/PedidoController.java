package br.com.oticaexpress.backend.Controller;

import java.util.Optional;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import br.com.oticaexpress.backend.DTO.PedidoDTO;
import br.com.oticaexpress.backend.Model.Endereco;
import br.com.oticaexpress.backend.Model.Pedido;
import br.com.oticaexpress.backend.Model.Usuario;
import br.com.oticaexpress.backend.Model.Enum.EnumStatusPedido;
import br.com.oticaexpress.backend.Repository.IEnderecoRepository;
import br.com.oticaexpress.backend.Repository.IPedidoRepository;
import br.com.oticaexpress.backend.Repository.IUsuarioRepository;
import br.com.oticaexpress.backend.Util.Utils;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/pedido")
@CrossOrigin(origins = "*")
public class PedidoController {

    @Autowired
    private IPedidoRepository pedidoRepository;

    @Autowired
    private IUsuarioRepository usuarioRepository;

    @Autowired
    private IEnderecoRepository enderecoRepository;

    @GetMapping
    public ResponseEntity<?> listarPedidos() {
        return ResponseEntity.ok(pedidoRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPedidoId(@PathVariable Long id) {
        Optional<Pedido> pedido = pedidoRepository.findById(id);
        if (pedido.isPresent()) {
            return ResponseEntity.ok(pedido.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Pedido não localizado, tente com outro ID!");
        }
    }

    @GetMapping("/status")
    public ResponseEntity<?> listarStatusPedido() {
        return ResponseEntity.ok(EnumStatusPedido.values());
    }

    @PostMapping
    public ResponseEntity<?> criarPedido(@RequestBody @Valid PedidoDTO pedidoDTO) {
        Optional<Usuario> buscaUsuario = usuarioRepository.findById(pedidoDTO.usuarioId());
        if (!buscaUsuario.isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Usuário não encontrado!");
        }

        Optional<Endereco> buscaEndereco = enderecoRepository.findById(pedidoDTO.enderecoId());
        if (!buscaEndereco.isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Endereço não encontrado!");
        }

        Pedido pedidoModel = new Pedido();
        BeanUtils.copyProperties(pedidoDTO, pedidoModel);
        pedidoModel.setUsuarioId(buscaUsuario.get());
        pedidoModel.setEnderecoId(buscaEndereco.get());

        return ResponseEntity.status(HttpStatus.CREATED).body(pedidoRepository.save(pedidoModel));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizarPedido(@PathVariable Long id, @RequestBody Pedido pedido) {
        Optional<Pedido> buscaPedido = pedidoRepository.findById(id);
        if (buscaPedido.isPresent()) {
            Pedido pedidoExistente = buscaPedido.get();
            Utils.copyNonNullProperties(pedido, pedidoExistente);
            return ResponseEntity.ok().body(pedidoRepository.save(pedidoExistente));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Pedido não encontrado!");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletarPedido(@PathVariable Long id) {
        Optional<Pedido> buscaPedido = pedidoRepository.findById(id);
        if (buscaPedido.isPresent()) {
            pedidoRepository.deleteById(id);
            return ResponseEntity.ok().body("Pedido deletado com sucesso!");
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Pedido não encontrado!");
        }
    }
}
