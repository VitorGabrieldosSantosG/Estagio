package br.com.oticaexpress.backend.DTO;

import br.com.oticaexpress.backend.Model.Endereco;

public record LoginResponseDTO(
    String token,
    String email,
    String role,
    String nome,
    Long id,
    String cpf,
    String telefone,
    Endereco endereco
) {}
