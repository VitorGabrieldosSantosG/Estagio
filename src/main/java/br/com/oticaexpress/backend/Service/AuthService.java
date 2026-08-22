package br.com.oticaexpress.backend.Service;

import br.com.oticaexpress.backend.DTO.LoginDTO;
import br.com.oticaexpress.backend.DTO.LoginResponseDTO;
import br.com.oticaexpress.backend.DTO.Response.EnderecoResponseDTO;
import br.com.oticaexpress.backend.Model.Usuario;
import br.com.oticaexpress.backend.Repository.IUsuarioRepository;
import br.com.oticaexpress.backend.Config.TokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final IUsuarioRepository usuarioRepository;
    private final TokenService tokenService;

    public LoginResponseDTO login(LoginDTO loginDTO) {
        var authToken = new UsernamePasswordAuthenticationToken(loginDTO.email(), loginDTO.senha());
        authenticationManager.authenticate(authToken);

        Usuario usuario = usuarioRepository.findByEmail(loginDTO.email())
                .orElseThrow(() -> new RuntimeException("Erro inesperado: usuário autenticado não encontrado no banco."));

        String token = tokenService.generateToken(usuario);

        EnderecoResponseDTO enderecoDTO = usuario.getEndereco() != null
                ? new EnderecoResponseDTO(usuario.getEndereco())
                : null;

        return new LoginResponseDTO(
                token,
                usuario.getEmail(),
                usuario.getRole().name(),
                usuario.getNome(),
                usuario.getId(),
                usuario.getCpf(),
                usuario.getTelefone(),
                enderecoDTO
        );
    }
}
