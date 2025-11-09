
# AllRev - Aplicação Front-end (Angular 17 & NgRx)

Este é o projeto front-end da plataforma AllRev, construído como um Single Page Application (SPA) robusto usando **Angular 17** e **TypeScript**.

A aplicação consome a API back-end (`allrev-backend`) e fornece a interface de usuário para administradores, gerentes e clientes gerenciarem seus tenants, usuários, clientes e pedidos. O projeto utiliza **NgRx** para um gerenciamento de estado reativo e escalável.

## 🚀 Tecnologias Principais

* **Framework:** Angular 17 (com Standalone Components)
* **Linguagem:** TypeScript
* **Gerenciamento de Estado:** NgRx (Store, Effects, Reducers)
* **UI Components:** Angular Material e PrimeNG
* **Estilização:** SCSS (Sass)
* **Autenticação:** Gerenciamento de JWT com `angular-jwt` e Interceptors HTTP
* **Notificações:** `ngx-toastr`

## 🏛️ Arquitetura e Features

* **Roteamento Modular:** As seções da aplicação (Home, Clientes, Usuários, Pedidos) são carregadas usando **Lazy Loading** (`loadChildren`), o que otimiza o *load* inicial da aplicação.
* **Gerenciamento de Estado (NgRx):** O estado global, especialmente o de autenticação (token, perfil do usuário, papéis), é gerenciado pelo NgRx, garantindo uma fonte única de verdade.
* **Segurança (RBAC):** A aplicação implementa segurança no front-end através de **Route Guards**:
    * `AuthGuard`: Bloqueia rotas para usuários não autenticados.
    * `RoleGuard`: Bloqueia rotas com base nos papéis do usuário (ex: `ADMIN`, `CLIENT`), lendo os dados da rota.
* **Interceptors HTTP:**
    * `JwtInterceptor`: Anexa automaticamente o token JWT (armazenado via `AuthService`) em todas as requisições para a API.
    * `ErrorInterceptor`: Captura erros HTTP globalmente e usa o `ToastService` para exibir mensagens amigáveis.

## ⚙️ Como Rodar (Desenvolvimento)

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/Devs-IO/allrev-frontend.git](https://github.com/Devs-IO/allrev-frontend.git)
    cd allrev-frontend
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure o Ambiente:**
    * Configure os arquivos em `src/environments/` (ex: `environment.ts`) para apontar para a URL correta da sua API back-end (ex: `http://localhost:3000/api/v1`).

4.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run start
    ```

5.  **Acesse a aplicação:**
    * Abra o navegador em `http://localhost:4200`.
