package br.com.oticaexpress.backend.Service;

import br.com.oticaexpress.backend.DTO.ItemProdutoAtualizacaoDTO;
import br.com.oticaexpress.backend.DTO.ItemProdutoDTO;
import br.com.oticaexpress.backend.DTO.Response.ItemProdutoResponseDTO;
import br.com.oticaexpress.backend.Exception.RecursoNaoEncontradoException;
import br.com.oticaexpress.backend.Exception.RegraNegocioException;
import br.com.oticaexpress.backend.Model.Armacao;
import br.com.oticaexpress.backend.Model.ItemProduto;
import br.com.oticaexpress.backend.Repository.IArmacaoRepository;
import br.com.oticaexpress.backend.Repository.IItemProdutoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ItemProdutoService {

    private final IItemProdutoRepository itemProdutoRepository;
    private final IArmacaoRepository armacaoRepository;

    public List<ItemProdutoResponseDTO> listarTodos() {
        return itemProdutoRepository.findAll().stream()
                .map(ItemProdutoResponseDTO::new)
                .toList();
    }

    public ItemProdutoResponseDTO buscarPorId(Long id) {
        ItemProduto itemProduto = itemProdutoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Item de produto não localizado!"));
        return new ItemProdutoResponseDTO(itemProduto);
    }

    public List<ItemProdutoResponseDTO> buscarPorArmacaoId(Long armacaoId) {
        return itemProdutoRepository.findByArmacaoId(armacaoId).stream()
                .map(ItemProdutoResponseDTO::new)
                .toList();
    }

    public ItemProdutoResponseDTO criarItemProduto(ItemProdutoDTO dto) {
        Armacao armacao = armacaoRepository.findById(dto.armacaoId())
                .orElseThrow(() -> new RegraNegocioException("Armação não encontrada!"));

        ItemProduto itemProduto = new ItemProduto();
        BeanUtils.copyProperties(dto, itemProduto);
        itemProduto.setArmacao(armacao);
        
        ItemProduto salvo = itemProdutoRepository.save(itemProduto);
        return new ItemProdutoResponseDTO(salvo);
    }

    public ItemProdutoResponseDTO atualizarItemProduto(Long id, ItemProdutoAtualizacaoDTO dto) {
        ItemProduto itemProduto = itemProdutoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Item de produto não localizado!"));

        if (dto.marca() != null) itemProduto.setMarca(dto.marca());
        if (dto.quantidade() != null) itemProduto.setQuantidade(dto.quantidade());
        if (dto.preco() != null) itemProduto.setPreco(dto.preco());
        if (dto.cor() != null) itemProduto.setCor(dto.cor());
        if (dto.tamanho() != null) itemProduto.setTamanho(dto.tamanho());
        if (dto.modelo() != null) itemProduto.setModelo(dto.modelo());
        if (dto.material() != null) itemProduto.setMaterial(dto.material());
        if (dto.imagemUrl() != null) itemProduto.setImagemUrl(dto.imagemUrl());
        if (dto.tipo() != null) itemProduto.setTipo(dto.tipo());

        ItemProduto salvo = itemProdutoRepository.save(itemProduto);
        return new ItemProdutoResponseDTO(salvo);
    }

    public void deletarItemProduto(Long id) {
        ItemProduto itemProduto = itemProdutoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Item de produto não localizado!"));
        itemProdutoRepository.deleteById(itemProduto.getId());
    }
}
