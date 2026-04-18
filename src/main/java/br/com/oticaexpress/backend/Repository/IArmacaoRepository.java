package br.com.oticaexpress.backend.Repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.oticaexpress.backend.Model.Armacao;


public interface IArmacaoRepository extends JpaRepository<Armacao, Long> {
    Optional<Armacao> findById(Long id);
    Optional<Armacao> findByModelo(String modelo);
}
