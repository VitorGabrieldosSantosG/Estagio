package br.com.oticaexpress.backend.Service;

import br.com.oticaexpress.backend.DTO.PedidoAtualizacaoDTO;
import br.com.oticaexpress.backend.DTO.PedidoDTO;
import br.com.oticaexpress.backend.DTO.Response.PedidoResponseDTO;
import br.com.oticaexpress.backend.Exception.RecursoNaoEncontradoException;
import br.com.oticaexpress.backend.Exception.RegraNegocioException;
import br.com.oticaexpress.backend.Model.Endereco;
import br.com.oticaexpress.backend.Model.Enum.EnumStatusPedido;
import br.com.oticaexpress.backend.Model.Pedido;
import br.com.oticaexpress.backend.Model.Usuario;
import br.com.oticaexpress.backend.Repository.IEnderecoRepository;
import br.com.oticaexpress.backend.Repository.IPedidoRepository;
import br.com.oticaexpress.backend.Repository.IUsuarioRepository;
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

    public List<PedidoResponseDTO> listarTodos() {
        return pedidoRepository.findAll().stream()
                .map(PedidoResponseDTO::new)
                .toList();
    }

    public PedidoResponseDTO buscarPorId(Long id) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pedido não encontrado!"));
        return new PedidoResponseDTO(pedido);
    }

    public EnumStatusPedido[] listarStatusPedido() {
        return EnumStatusPedido.values();
    }

    public PedidoResponseDTO criarPedido(PedidoDTO dto) {
        Usuario usuario = usuarioRepository.findById(dto.usuarioId())
                .orElseThrow(() -> new RegraNegocioException("Usuário não encontrado!"));
                
        Endereco endereco = enderecoRepository.findById(dto.enderecoId())
                .orElseThrow(() -> new RegraNegocioException("Endereço não encontrado!"));

        Pedido pedido = new Pedido();
        BeanUtils.copyProperties(dto, pedido);
        pedido.setUsuarioId(usuario);
        pedido.setEnderecoId(endereco);
        
        Pedido salvo = pedidoRepository.save(pedido);
        return new PedidoResponseDTO(salvo);
    }

    public PedidoResponseDTO atualizarPedido(Long id, PedidoAtualizacaoDTO dto) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pedido não encontrado!"));

        if (dto.status() != null) pedido.setStatus(dto.status());
        if (dto.urlReceitaValidada() != null) pedido.setUrlReceitaValidada(dto.urlReceitaValidada());
        if (dto.precoFrete() != null) pedido.setPrecoFrete(dto.precoFrete());
        if (dto.precoTotal() != null) pedido.setPrecoTotal(dto.precoTotal());

        Pedido salvo = pedidoRepository.save(pedido);
        return new PedidoResponseDTO(salvo);
    }

    public void deletarPedido(Long id) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pedido não encontrado!"));
        pedidoRepository.deleteById(pedido.getId());
    }
}
