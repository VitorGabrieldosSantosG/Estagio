package br.com.oticaexpress.backend.Model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import br.com.oticaexpress.backend.Model.Enum.EnumEstado;
import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;

@Data
@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "usarioId"})
public class Endereco {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ToString.Exclude
    @OneToOne(mappedBy = "endereco")
    @JsonIgnore
    private Usuario usarioId;

    private String cep;
    private String rua;
    private String cidade;
    private String bairro;
    private String complemento;

    @Enumerated(EnumType.STRING)
    private EnumEstado estado;

    private int numero;
}
