package br.com.oticaexpress.backend.DTO;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;


public record ArmacaoDTO(

    @NotBlank (message = "O campo cor não pode ser nulo")
    String cor,

    @NotBlank (message = "O campo material não pode ser nulo")
    String material,

    @NotBlank (message = "O campo modelo não pode ser nulo")
    String modelo,

    @NotBlank (message = "O campo marca não pode ser nulo")
    String marca,

    @NotBlank (message = "O campo tamanho não pode ser nulo")
    String tamanho,

    @NotBlank (message = "O campo descrição não pode ser nulo")
    String descricao,
    
    @NotBlank (message = "O campo URl da imagem não pode ser nulo")
    String imagemUrl,
    
    @NotNull(message = "O campo quuantidade não pode ser nulo")
    @PositiveOrZero(message = "O campo deve ser 0 ou maior")
    Integer quantidade,

    @NotNull (message = "O campo preço não pode ser nulo")
    @PositiveOrZero (message = "O campo preço deve ser 0 ou maior")
    BigDecimal preco

) {}