# 📚 Rotina em Curso 

Este projeto é uma aplicação interativa desenvolvida em **Node.js** que integra funcionalidades de autenticação e gerenciamento de dados utilizando **Firebase Authentication** e **Firestore**. O objetivo é permitir o gerenciamento de usuários e cursos em um ambiente seguro, eficiente e intuitivo.

---

## ✨ **Funcionalidades Principais**
- **Gerenciamento de Usuários:**
  - Cadastro, remoção e autenticação de usuários.
  - Controle de permissões por cargo: **Aluno**, **Professor** ou **Administrador**.
  - Validação de dados como CPF, telefone e e-mail.

- **Gerenciamento de Cursos:**
  - Adição, listagem e registro de compra de cursos.
  - Controle de usuários inscritos em cada curso.
  - Organização dos cursos por nome, categoria e nível (Básico, Intermediário, Avançado).

- **Autenticação e Sessão:**
  - Login e logout com Firebase Authentication.
  - Gerenciamento de sessões com persistência local em arquivo JSON.

- **Outras Funcionalidades:**
  - Histórico de compras para usuários.
  - Suporte a administradores para remover usuários e gerenciar dados sensíveis.

---

## 🚀 **Tecnologias Utilizadas**
- **Node.js** - Ambiente de execução.
- **Firebase Authentication** - Gerenciamento de autenticação.
- **Firestore** - Banco de dados para armazenamento de usuários e cursos.
- **readline** - Captura de entrada de dados via terminal.
- **fs** - Gerenciamento de arquivos locais para sessões.

---

## 🛠️ **Pré-requisitos**
Antes de iniciar, você precisará ter as seguintes ferramentas instaladas:
- **Node.js** (v16 ou superior)
- **npm** (gerenciador de pacotes do Node.js)

Além disso, você precisará configurar um projeto no [Firebase Console](https://console.firebase.google.com/), ativar os serviços de Authentication e Firestore, e gerar suas credenciais.

---

## 🏗️ **Configuração do Projeto**

### 1. Clone o repositório:
```bash
git clone https://github.com/DesafioTech2/Startup-Ninja/
cd Startup-Ninja/
