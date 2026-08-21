package br.com.oticaexpress.backend.Service;

import br.com.oticaexpress.backend.DTO.ItemProdutoDTO;
import br.com.oticaexpress.backend.Exception.RecursoNaoEncontradoException;
import br.com.oticaexpress.backend.Exception.RegraNegocioException;
import br.com.oticaexpress.backend.Model.Armacao;
import br.com.oticaexpress.backend.Model.ItemProduto;
import br.com.oticaexpress.backend.Repository.IArmacaoRepository;
import br.com.oticaexpress.backend.Repository.IItemProdutoRepository;
import br.com.oticaexpress.backend.Util.Utils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ItemProdutoService {

    private final IItemProdutoRepository itemProdutoRepository;
    private final IArmacaoRepository armacaoRepository;

    public List<ItemProduto> listarTodos() {
        return itemProdutoRepository.findAll();
    }

    public ItemProduto buscarPorId(Long id) {
        return itemProdutoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Item de produto não localizado!"));
    }

    public List<ItemProduto> buscarPorArmacaoId(Long armacaoId) {
        return itemProdutoRepository.findByArmacaoId(armacaoId);
    }

    public ItemProduto criarItemProduto(ItemProdutoDTO dto) {
        Armacao armacao = armacaoRepository.findById(dto.armacaoId())
                .orElseThrow(() -> new RegraNegocioException("Armação não encontrada!"));

        ItemProduto itemProduto = new ItemProduto();
        BeanUtils.copyProperties(dto, itemProduto);
        itemProduto.setArmacao(armacao);
        
        return itemProdutoRepository.save(itemProduto);
    }

    public ItemProduto atualizarItemProduto(Long id, ItemProduto itemProdutoAtualizado) {
        ItemProduto itemProdutoExistente = itemProdutoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Item de produto não localizado!"));
                
        Utils.copyNonNullProperties(itemProdutoAtualizado, itemProdutoExistente);
        return itemProdutoRepository.save(itemProdutoExistente);
    }

    public void deletarItemProduto(Long id) {
        ItemProduto itemProduto = itemProdutoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Item de produto não localizado!"));
        itemProdutoRepository.deleteById(itemProduto.getId());
    }
}
