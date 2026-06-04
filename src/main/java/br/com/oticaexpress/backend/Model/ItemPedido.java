package br.com.oticaexpress.backend.Model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Data;
import lombok.ToString;

@Data
@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "pedidoId"})
public class ItemPedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ToString.Exclude
    @ManyToOne
    @JoinColumn(name = "pedido_id")
    @JsonIgnore
    private Pedido pedidoId;

    @ManyToOne
    @JoinColumn(name = "produto_id")
    private Armacao produtoId;

    private String marca;
    private String modelo;
    private String tamanho;
    private String cor;

    private boolean ativo;
}
