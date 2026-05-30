package br.com.oticaexpress.backend.DTO;

import br.com.oticaexpress.backend.Model.Enum.EnumEstado;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record EnderecoDTO(
    @NotBlank(message = "O campo CEP não pode ser nulo ou vazio")
    String cep,

    @NotBlank(message = "O campo rua não pode ser nulo ou vazio")
    String rua,

    @NotBlank(message = "O campo cidade não pode ser nulo ou vazio")
    String cidade,

    @NotBlank(message = "O campo bairro não pode ser nulo ou vazio")
    String bairro,

    String complemento,

    @NotNull(message = "O campo estado não pode ser nulo")
    EnumEstado estado,

    @Positive(message = "O campo número deve ser um valor positivo")
    int numero,

    @NotNull(message = "O ID do usuário não pode ser nulo")
    Long usuarioId
) {}
