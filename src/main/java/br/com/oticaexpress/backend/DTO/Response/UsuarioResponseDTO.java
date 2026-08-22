package br.com.oticaexpress.backend.DTO.Response;

import br.com.oticaexpress.backend.Model.Enum.EnumRoleUsuario;
import br.com.oticaexpress.backend.Model.Usuario;

public record UsuarioResponseDTO(
        Long id,
        String nome,
        String email,
        String cpf,
        String telefone,
        EnumRoleUsuario role,
        EnderecoResponseDTO endereco) {

    public UsuarioResponseDTO(Usuario usuario) {
        this(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getCpf(),
                usuario.getTelefone(),
                usuario.getRole(),
                usuario.getEndereco() != null ? new EnderecoResponseDTO(usuario.getEndereco()) : null);
    }
}
