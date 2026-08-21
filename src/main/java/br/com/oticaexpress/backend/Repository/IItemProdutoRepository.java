package br.com.oticaexpress.backend.Repository;

import br.com.oticaexpress.backend.Model.ItemProduto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IItemProdutoRepository extends JpaRepository<ItemProduto, Long> {
    List<ItemProduto> findByArmacaoId(Long armacaoId);
    List<ItemProduto> findByMarca(String marca);
}
