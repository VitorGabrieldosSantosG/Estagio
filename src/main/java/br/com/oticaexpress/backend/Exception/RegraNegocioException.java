package br.com.oticaexpress.backend.Exception;

public class RegraNegocioException extends RuntimeException {
    public RegraNegocioException(String mensagem){
        super(mensagem);
    } 
}
