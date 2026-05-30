package br.com.oticaexpress.backend.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginDTO(
    @NotBlank(message = "O campo email não pode ser nulo ou vazio")
    @Email(message = "O formato do email deve ser válido")
    String email,

    @NotBlank(message = "O campo senha não pode ser nulo ou vazio")
    String senha
) {}
