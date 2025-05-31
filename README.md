# AllrevFrontend

# AllRev - Frontend

## 🚀 Tecnologias Utilizadas

* **Linguagem:** TypeScript
* **Framework:** Angular 19
* **UI:** Bootstrap com Ícones
* **Controle de Acesso:** RoleGuard (Autenticação e Autorização por Roles)

## 📌 Funcionalidades Atuais

* **Login e Autenticação:** JWT com expiração de 1 hora.
* **Menu de Navegação:** Controlado por roles (Admin, User, Manager\_Reviewers, Client, Assistant\_Reviewers).
* **Gestão de Usuários:** Listar usuários já implementado.
* **Perfil:** Visualizar já implementado.

## 🚀 Como Rodar o Frontend

1. Clone o repositório:

```bash
  git clone https://github.com/seu-usuario/allrev-frontend.git
```

2. Entre na pasta do frontend:

```bash
  cd allrev-frontend
```

3. Instale as dependências:

```bash
  npm install
```

4. Execute o servidor de desenvolvimento:

```bash
  ng serve
```

5. Acesse o sistema em `http://localhost:4200`.

## ✅ TODO

* [x] Autenticação (JWT)
* [x] Autorização (Roles)
* [x] Listagem de Usuários
* [x] Visualização de Perfil
* [ ] CRUD de Usuários (Visualizar, Editar, Excluir, Cadastrar)
* [ ] CRUD de Produtos
* [ ] CRUD de Clientes
* [ ] CRUD de Relatórios
