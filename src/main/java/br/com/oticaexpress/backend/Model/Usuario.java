package br.com.oticaexpress.backend.Model;

import br.com.oticaexpress.backend.Model.Enum.EnumRoleUsuario;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String email;
    private String senha;
    private String cpf;
    private String telefone;

    @OneToOne(cascade = jakarta.persistence.CascadeType.ALL)
    @jakarta.persistence.JoinColumn(name = "endereco_id", referencedColumnName = "id")
    private Endereco endereco;

    @jakarta.persistence.Enumerated(jakarta.persistence.EnumType.STRING)
    private EnumRoleUsuario role;
}
