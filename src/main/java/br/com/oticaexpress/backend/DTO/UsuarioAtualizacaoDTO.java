package br.com.oticaexpress.backend.DTO;

import br.com.oticaexpress.backend.Model.Enum.EnumRoleUsuario;

public record UsuarioAtualizacaoDTO(
    String nome,
    String email,
    String senha,
    String cpf,
    String telefone,
    EnumRoleUsuario role
) {}
