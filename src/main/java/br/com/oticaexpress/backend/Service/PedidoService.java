package br.com.oticaexpress.backend.Service;

import br.com.oticaexpress.backend.DTO.PedidoDTO;
import br.com.oticaexpress.backend.Exception.RecursoNaoEncontradoException;
import br.com.oticaexpress.backend.Exception.RegraNegocioException;
import br.com.oticaexpress.backend.Model.Endereco;
import br.com.oticaexpress.backend.Model.Enum.EnumStatusPedido;
import br.com.oticaexpress.backend.Model.Pedido;
import br.com.oticaexpress.backend.Model.Usuario;
import br.com.oticaexpress.backend.Repository.IEnderecoRepository;
import br.com.oticaexpress.backend.Repository.IPedidoRepository;
import br.com.oticaexpress.backend.Repository.IUsuarioRepository;
import br.com.oticaexpress.backend.Util.Utils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private final IPedidoRepository pedidoRepository;
    private final IUsuarioRepository usuarioRepository;
    private final IEnderecoRepository enderecoRepository;

    public List<Pedido> listarTodos() {
        return pedidoRepository.findAll();
    }

    public Pedido buscarPorId(Long id) {
        return pedidoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pedido não encontrado!"));
    }

    public EnumStatusPedido[] listarStatusPedido() {
        return EnumStatusPedido.values();
    }

    public Pedido criarPedido(PedidoDTO dto) {
        Usuario usuario = usuarioRepository.findById(dto.usuarioId())
                .orElseThrow(() -> new RegraNegocioException("Usuário não encontrado!"));
                
        Endereco endereco = enderecoRepository.findById(dto.enderecoId())
                .orElseThrow(() -> new RegraNegocioException("Endereço não encontrado!"));

        Pedido pedido = new Pedido();
        BeanUtils.copyProperties(dto, pedido);
        pedido.setUsuarioId(usuario);
        pedido.setEnderecoId(endereco);
        
        return pedidoRepository.save(pedido);
    }

    public Pedido atualizarPedido(Long id, Pedido pedidoAtualizado) {
        Pedido pedidoExistente = pedidoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pedido não encontrado!"));
                
        Utils.copyNonNullProperties(pedidoAtualizado, pedidoExistente);
        return pedidoRepository.save(pedidoExistente);
    }

    public void deletarPedido(Long id) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pedido não encontrado!"));
        pedidoRepository.deleteById(pedido.getId());
    }
}
