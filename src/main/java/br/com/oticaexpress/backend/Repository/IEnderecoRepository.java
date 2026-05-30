package br.com.oticaexpress.backend.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import br.com.oticaexpress.backend.Model.Endereco;

public interface IEnderecoRepository extends JpaRepository<Endereco, Long> {
}
