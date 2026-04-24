package br.com.oticaexpress.backend.Controller;

import java.util.Optional;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.oticaexpress.backend.DTO.ArmacaoDTO;
import br.com.oticaexpress.backend.Model.Armacao;
import br.com.oticaexpress.backend.Model.Enum.TipoArmacao;
import br.com.oticaexpress.backend.Repository.IArmacaoRepository;
import br.com.oticaexpress.backend.Util.Utils;
import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;

@RestController
@RequestMapping("/armacao")
@CrossOrigin(origins = "*")
public class ArmacaoController {
    @Autowired
    private IArmacaoRepository armacaoRepository;

    @GetMapping
    public ResponseEntity<?> listarArmacoes() {
        return ResponseEntity.ok(armacaoRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarArmacaoId(@PathVariable Long id) {

        Optional<Armacao> armacao = armacaoRepository.findById(id);

        if (armacao.isPresent()) {
            return ResponseEntity.ok(armacao);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Produto não localizado, tente com outro ID!");
        }
    }

    @GetMapping("/tipos")
    public ResponseEntity<?> listarTiposDeArmacao() {
        return ResponseEntity.ok(TipoArmacao.values());
    }

    @PostMapping
    public ResponseEntity<?> criarArmacao(@RequestBody @Valid ArmacaoDTO armacao) {

        Armacao armacaoModel = new Armacao();
        BeanUtils.copyProperties(armacao, armacaoModel);
    
        return ResponseEntity.status(HttpStatus.CREATED).body(armacaoRepository.save(armacaoModel));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizarArmacao(@PathVariable Long id, @RequestBody Armacao armacao) {
        Optional<Armacao> buscaArmacao = armacaoRepository.findById(id);
        if (buscaArmacao.isPresent()) {
            Armacao armacaoExistente = buscaArmacao.get();
            Utils.copyNonNullProperties(armacao, armacaoExistente);
            return ResponseEntity.ok().body(armacaoRepository.save(armacaoExistente));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Armação não encontrada!");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletarArmacao(@PathVariable Long id) {
        Optional<Armacao> buscaArmacao = armacaoRepository.findById(id);

        if (buscaArmacao.isPresent()) {
            armacaoRepository.deleteById(id);
            return ResponseEntity.ok().body("Armacao deletado com sucesso!");
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Armacao não encontrada!");
        }
    }
}
