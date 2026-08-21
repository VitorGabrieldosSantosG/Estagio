package br.com.oticaexpress.backend.DTO.Response;

import br.com.oticaexpress.backend.Model.Endereco;
import br.com.oticaexpress.backend.Model.Usuario;

public record UsuarioResponseDTO(
        String nome,
        String email,
        String senha,
        String cpf,
        String telefone,
        Endereco endereco) {

    public UsuarioResponseDTO(Usuario usuario) {
        this(
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getSenha(),
                usuario.getCpf(),
                usuario.getTelefone(),
                usuario.getEndereco());
    }

}
