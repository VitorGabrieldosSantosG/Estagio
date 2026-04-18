# Ótica Express (SOE) 

Bem-vindo ao repositório do **Ótica Express**, um sistema de venda e gerenciamento de óculos. Este projeto foi desenvolvido com uma arquitetura separada entre Back-end (REST API) e Front-end (Vanilla), no qual muitas etapas ainda estão por vir

## Tecnologias Utilizadas

**Back-end:**
* Java 21
* Spring Boot 3
* Spring Data JPA & Hibernate
* Bean Validation (Jakarta)
* MySQL 8
* Docker & Docker Compose (Containerização)

**Front-end:**
* HTML5 Semântico
* CSS3 Vanilla (Flexbox & Variáveis CSS)
* JavaScript Puro (Fetch API)

---

## Como Testar o Projeto na Sua Máquina

Foi utilizado o **Docker** para facilitar a utilização do aplicativo. Sendo necessário apenas o [Docker Desktop](https://www.docker.com/products/docker-desktop/) rodando!

### Passo 1: Subindo o Back-end e o Banco de Dados

1. Certifique-se de que o **Docker Desktop** está aberto e rodando.
2. Abra o seu terminal e navegue até a pasta raiz do projeto Back-end (onde está o arquivo `docker-compose.yml`).
3. Execute o comando mágico abaixo:
   ``` bash
   docker compose up -d --build

### Passo 2: Executando o Front-end
Como o nosso Front-end é totalmente desacoplado da API, para executá-lo: 
1. Navegue até a pasta do Front-end.
2. Dê um clique duplo no arquivo index.html para abri-lo no seu navegador favorito (Chrome, Edge, Firefox, etc).
3. A interface já estará se comunicando com o Spring Boot via CORS!

## Endpoints da API 
Caso queira testar a API via Postman ou Insomnia, aqui estão as rotas disponíveis na base http://localhost:8080/armacao

| Método | Rota                  | Descrição                                                                 |
|--------|----------------------|--------------------------------------------------------------------------|
| GET    | /armacao             | Lista todas as armações em estoque.                                     |
| GET    | /armacao/{id}        | Busca os detalhes de uma armação específica.                            |
| GET    | /armacao/tipos       | Retorna o Enum dos tipos de armação (Ex: MASCULINO, FEMINO).           |
| POST   | /armacao             | Cadastra uma nova armação no sistema.                                   |
| PUT    | /armacao/{id}        | Atualiza os dados de uma armação existente.                             |
| DELETE | /armacao/{id}        | Remove permanentemente uma armação.                                     |

## Estrutura de Dados (Payload POST/PUT)
Exemplo de JSON aceito pelo sistema para a criação de um produto:
``` JSON
    {
    "marca": "Ray-Ban",
    "modelo": "Aviador Clássico",
    "cor": "Preto Fosco",
    "tamanho": "M",
    "material": "Metal",
    "tipo": "SOLAR",
    "preco": 450.50,
    "quantidade": 15,
    "imagemUrl": "[https://site.com/imagem.jpg](https://site.com/imagem.jpg)",
    "descricao": "Armação super leve e resistente para o dia a dia."
    }
```