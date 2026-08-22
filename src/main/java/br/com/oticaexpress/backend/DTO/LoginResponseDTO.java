package br.com.oticaexpress.backend.DTO;

import br.com.oticaexpress.backend.DTO.Response.EnderecoResponseDTO;

public record LoginResponseDTO(
    String token,
    String email,
    String role,
    String nome,
    Long id,
    String cpf,
    String telefone,
    EnderecoResponseDTO endereco
) {}
