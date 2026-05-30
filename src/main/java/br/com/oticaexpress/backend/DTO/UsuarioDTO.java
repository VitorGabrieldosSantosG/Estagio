package br.com.oticaexpress.backend.DTO;

import br.com.oticaexpress.backend.Model.Enum.EnumRoleUsuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UsuarioDTO(
    @NotBlank(message = "O campo nome não pode ser nulo ou vazio")
    String nome,

    @NotBlank(message = "O campo email não pode ser nulo ou vazio")
    @Email(message = "O formato do email deve ser válido")
    String email,

    @NotBlank(message = "O campo senha não pode ser nulo ou vazio")
    String senha,

    @NotBlank(message = "O campo cpf não pode ser nulo ou vazio")
    String cpf,

    @NotBlank(message = "O campo telefone não pode ser nulo ou vazio")
    String telefone,

    @NotNull(message = "O campo role não pode ser nulo")
    EnumRoleUsuario role
) {}
