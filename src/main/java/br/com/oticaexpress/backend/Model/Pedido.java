package br.com.oticaexpress.backend.Model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;

import br.com.oticaexpress.backend.Model.Enum.EnumStatusPedido;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import lombok.Data;

@Data
@Entity
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuarioId;

    @ManyToOne
    @JoinColumn(name = "endereco_id")
    private Endereco enderecoId;

    @Enumerated(EnumType.STRING)
    private EnumStatusPedido status;

    @OneToMany(mappedBy = "pedidoId", cascade = CascadeType.ALL, fetch = jakarta.persistence.FetchType.EAGER)
    private List<ItemPedido> listaProdutos;

    private String urlReceitaValidada;

    private BigDecimal precoFrete;
    private BigDecimal precoTotal;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime dataCriacao;
}
