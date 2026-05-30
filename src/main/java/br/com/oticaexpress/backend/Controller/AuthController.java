package br.com.oticaexpress.backend.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.oticaexpress.backend.Config.TokenService;
import br.com.oticaexpress.backend.DTO.LoginDTO;
import br.com.oticaexpress.backend.DTO.LoginResponseDTO;
import br.com.oticaexpress.backend.Model.Usuario;
import br.com.oticaexpress.backend.Repository.IUsuarioRepository;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private IUsuarioRepository usuarioRepository;

    @Autowired
    private TokenService tokenService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid LoginDTO loginDTO) {
        try {
            var usernamePassword = new UsernamePasswordAuthenticationToken(loginDTO.email(), loginDTO.senha());
            this.authenticationManager.authenticate(usernamePassword);
            
            Usuario usuario = usuarioRepository.findByEmail(loginDTO.email())
                    .orElseThrow(() -> new RuntimeException("Erro inesperado: usuário autenticado não encontrado no banco."));

            String token = tokenService.generateToken(usuario);

            return ResponseEntity.ok(new LoginResponseDTO(
                    token,
                    usuario.getEmail(),
                    usuario.getRole().name(),
                    usuario.getNome(),
                    usuario.getId(),
                    usuario.getCpf(),
                    usuario.getTelefone(),
                    usuario.getEndereco()
            ));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("E-mail ou senha incorretos!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro interno durante autenticação: " + e.getMessage());
        }
    }
}
