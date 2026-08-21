package br.com.oticaexpress.backend.DTO.Response;

import java.time.LocalDateTime;

public record ErroResponseDTO(
    LocalDateTime timestamp,
    Integer status,
    String erro, 
    String mensagem
){} 
