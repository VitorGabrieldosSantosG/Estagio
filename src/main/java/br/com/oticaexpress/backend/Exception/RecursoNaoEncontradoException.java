package br.com.oticaexpress.backend.Exception;

public class RecursoNaoEncontradoException extends RuntimeException{
    public RecursoNaoEncontradoException (String mensagem){
        super(mensagem);
    }
}
