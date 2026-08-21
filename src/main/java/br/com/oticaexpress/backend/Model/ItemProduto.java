package br.com.oticaexpress.backend.Model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import br.com.oticaexpress.backend.Model.Enum.TipoArmacao;

@Data
@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ItemProduto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "armacao_id")
    private Armacao armacao;

    private String marca;
    private Integer quantidade;
    private BigDecimal preco;
    private String cor;
    private String tamanho;
    private String modelo;
    private String material;
    private String imagemUrl;

    @Enumerated(EnumType.STRING)
    private TipoArmacao tipo;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime criadoEm;
}
