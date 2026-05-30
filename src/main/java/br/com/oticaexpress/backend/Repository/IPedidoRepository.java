package br.com.oticaexpress.backend.Repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import br.com.oticaexpress.backend.Model.Pedido;
import br.com.oticaexpress.backend.Model.Usuario;

public interface IPedidoRepository extends JpaRepository<Pedido, Long> {
    List<Pedido> findByUsuarioId(Usuario usuarioId);
}
