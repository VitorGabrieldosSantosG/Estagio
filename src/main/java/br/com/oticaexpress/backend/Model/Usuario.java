package br.com.oticaexpress.backend.Model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import br.com.oticaexpress.backend.Model.Enum.EnumRoleUsuario;
import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;

@Data
@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String email;
    private String senha;
    private String cpf;
    private String telefone;

    @ToString.Exclude
    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "endereco_id", referencedColumnName = "id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "usarioId"})  
    private Endereco endereco;

    @Enumerated(EnumType.STRING)
    private EnumRoleUsuario role;
}
