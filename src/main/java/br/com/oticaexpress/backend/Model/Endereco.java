package br.com.oticaexpress.backend.Model;

import br.com.oticaexpress.backend.Model.Enum.EnumEstado;
import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;

@Data
@Entity
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "usarioId"})
public class Endereco {
    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Long id;

    @ToString.Exclude
    @OneToOne(mappedBy = "endereco")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Usuario usarioId;

    private String cep;
    private String rua;
    private String cidade;
    private String bairro;
    private String complemento;

    @jakarta.persistence.Enumerated(jakarta.persistence.EnumType.STRING)
    private EnumEstado estado;

    private int numero;
}
