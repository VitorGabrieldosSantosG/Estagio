package br.com.oticaexpress.backend.Model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import br.com.oticaexpress.backend.Model.Enum.EnumRoleUsuario;
import jakarta.persistence.*;
import lombok.Data;

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

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "endereco_id", referencedColumnName = "id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "usarioId"})  
    private Endereco endereco;

    @Enumerated(EnumType.STRING)
    private EnumRoleUsuario role;
}
