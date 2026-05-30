package br.com.oticaexpress.backend.Repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import br.com.oticaexpress.backend.Model.ItemPedido;
import br.com.oticaexpress.backend.Model.Pedido;

public interface IItemPedidoRepository extends JpaRepository<ItemPedido, Long> {
    List<ItemPedido> findByPedidoId(Pedido pedidoId);
}
