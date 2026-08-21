package br.com.oticaexpress.backend.Service;

import br.com.oticaexpress.backend.DTO.ItemPedidoDTO;
import br.com.oticaexpress.backend.Exception.RecursoNaoEncontradoException;
import br.com.oticaexpress.backend.Exception.RegraNegocioException;
import br.com.oticaexpress.backend.Model.ItemPedido;
import br.com.oticaexpress.backend.Model.ItemProduto;
import br.com.oticaexpress.backend.Model.Pedido;
import br.com.oticaexpress.backend.Repository.IItemPedidoRepository;
import br.com.oticaexpress.backend.Repository.IItemProdutoRepository;
import br.com.oticaexpress.backend.Repository.IPedidoRepository;
import br.com.oticaexpress.backend.Util.Utils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ItemPedidoService {

    private final IItemPedidoRepository itemPedidoRepository;
    private final IPedidoRepository pedidoRepository;
    private final IItemProdutoRepository itemProdutoRepository;

    public List<ItemPedido> listarTodos() {
        return itemPedidoRepository.findAll();
    }

    public ItemPedido buscarPorId(Long id) {
        return itemPedidoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Item do pedido não encontrado!"));
    }

    public ItemPedido criarItemPedido(ItemPedidoDTO dto) {
        Pedido pedido = pedidoRepository.findById(dto.pedidoId())
                .orElseThrow(() -> new RegraNegocioException("Pedido não encontrado!"));
                
        ItemProduto itemProduto = itemProdutoRepository.findById(dto.produtoId())
                .orElseThrow(() -> new RegraNegocioException("Item de produto não encontrado!"));

        if (itemProduto.getQuantidade() == null || itemProduto.getQuantidade() <= 0) {
            throw new RegraNegocioException("Produto '" + itemProduto.getMarca() + " " + itemProduto.getModelo() + "' está sem estoque disponível!");
        }

        ItemPedido itemPedido = new ItemPedido();
        BeanUtils.copyProperties(dto, itemPedido, "pedidoId", "produtoId");
        
        itemPedido.setPedidoId(pedido);
        itemPedido.setProdutoId(itemProduto);

        itemProduto.setQuantidade(itemProduto.getQuantidade() - 1);
        itemProdutoRepository.save(itemProduto);

        return itemPedidoRepository.save(itemPedido);
    }

    public ItemPedido atualizarItemPedido(Long id, ItemPedido itemPedidoAtualizado) {
        ItemPedido itemPedidoExistente = itemPedidoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Item do pedido não encontrado!"));
                
        Utils.copyNonNullProperties(itemPedidoAtualizado, itemPedidoExistente);
        return itemPedidoRepository.save(itemPedidoExistente);
    }

    public void deletarItemPedido(Long id) {
        ItemPedido itemPedido = itemPedidoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Item do pedido não encontrado!"));
        itemPedidoRepository.deleteById(itemPedido.getId());
    }
}
