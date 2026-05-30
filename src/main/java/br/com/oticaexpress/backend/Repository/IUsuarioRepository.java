package br.com.oticaexpress.backend.Repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import br.com.oticaexpress.backend.Model.Usuario;

public interface IUsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    Optional<Usuario> findByCpf(String cpf);
}
