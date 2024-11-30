import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { FirestoreService } from "./FirestoreService.js";
import { firebaseConfig } from "./firebaseConfig.js";
import { Usuario } from "./models.mjs";
import readline from "readline";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestoreService = new FirestoreService(firebaseConfig);

// Função para capturar entrada do usuário
const askQuestion = (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
};

/* ===================================
   Funções de Usuário e Cursos
=================================== */

// Formata o CPF no padrão 000.000.000-00
const formatarCPF = (cpf) => {
  return cpf.replace(/\D/g, "") // Remove caracteres não numéricos
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

// Adiciona um novo usuário ao sistema e registra no Firebase Auth
async function adicionarUsuario() {
  try {
    console.log("Iniciando cadastro de usuário...");
    let cpf = await askQuestion("CPF (somente números): ");
    const cpfSemFormatacao = cpf.replace(/\D/g, "");
    const cpfFormatado = formatarCPF(cpf);

    const nome = await askQuestion("Nome: ");
    const dataNascimento = await askQuestion("Data de Nascimento (YYYY-MM-DD): "); 
    const email = await askQuestion("Email: ");
    const senha = await askQuestion("Senha: ");
    const cargo = String(await askQuestion("Cargo (Aluno, Professor, Administrador): ")) || "Não informado";
    const telefone = await askQuestion("Telefone (99999-9999): ");

    if (!nome || !cpf || !email || !senha || !cargo || !telefone || !dataNascimento) {
      throw new Error("Todos os campos são obrigatórios.");
    }

    if (!/^\d{5}-\d{4}$/.test(telefone)) {
      throw new Error("Telefone inválido. Use o formato 99999-9999.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Email inválido.");
    }

    const usuariosExistentes = await firestoreService.getAllDocuments("usuarios");
    if (usuariosExistentes.some((u) => u.cpf === cpfSemFormatacao)) {
      throw new Error("CPF já cadastrado.");
    }

    const usuario = new Usuario(nome, cpfFormatado, dataNascimento, email,senha, telefone, cargo);
    await firestoreService.addDocument("usuarios", cpfSemFormatacao, usuario.toFirestore());
    console.log(`Usuário ${usuario.nome} salvo no Firebase Firestore com sucesso.`);
    await registerUser(email, senha, usuario);
    console.log(`Usuário ${usuario.nome} registrado no sistema com sucesso.`);
  } catch (error) {
    console.error("Erro ao adicionar usuário:", error.message);
  }
}

// Adiciona um novo curso ao sistema
async function adicionarCurso() {
  try {
    const nome = await askQuestion("Nome do curso: ");
    const descricao = await askQuestion("Descrição: ");
    const duracao = await askQuestion("Duração (em horas): ");
    const preco = parseFloat(await askQuestion("Preço: "));
    const categoria = await askQuestion("Categoria: ");
    const nivel = await askQuestion("Nível (Básico, Intermediário, Avançado): ");
    const instrutor = await askQuestion("Instrutor: ");
    const urlImagem = await askQuestion("URL da imagem: ");

    const curso = {
      nome,
      descricao,
      duracao,
      preco,
      categoria,
      nivel,
      instrutor,
      urlImagem,
      usuariosInscritos: [],
    };

    await firestoreService.addDocument("cursos", nome, curso);
    console.log(`Curso "${nome}" adicionado com sucesso!`);
  } catch (error) {
    console.error("Erro ao adicionar curso:", error.message);
  }
}

// Registra a compra de um curso por um usuário
async function registrarCompra(emailUsuario, nomeCurso) {
  try {
    const usuarios = await firestoreService.getAllDocuments("usuarios");
    const usuario = usuarios.find((u) => u.email === emailUsuario);

    if (!usuario) {
      console.log("Usuário não encontrado.");
      return;
    }

    const curso = await firestoreService.getDocument("cursos", nomeCurso);
    if (!curso) {
      console.log("Curso não encontrado.");
      return;
    }

    usuario.cursosComprados.push(nomeCurso);
    curso.usuariosInscritos.push(usuario.email);

    await firestoreService.updateDocument("usuarios", usuario.id, usuario);
    await firestoreService.updateDocument("cursos", nomeCurso, curso);

    console.log(`Compra registrada: ${usuario.nome} comprou o curso "${nomeCurso}".`);
  } catch (error) {
    console.error("Erro ao registrar compra:", error.message);
  }
}

// Mostra o histórico de compras de um usuário
async function visualizarHistoricoCompras(emailUsuario) {
  try {
    const usuarios = await firestoreService.getAllDocuments("usuarios");
    const usuario = usuarios.find((u) => u.email === emailUsuario);

    if (!usuario) {
      console.log("Usuário não encontrado.");
      return;
    }

    console.log(`Histórico de compras de ${usuario.nome}:`);
    usuario.cursosComprados.forEach((curso) => console.log(curso));
  } catch (error) {
    console.error("Erro ao visualizar histórico de compras:", error.message);
  }
}

/* ===================================
   Funções de Autenticação
=================================== */

// Registra um usuário no Firebase Auth
async function registerUser(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Usuário registrado com sucesso:", userCredential.user.uid);
  } catch (error) {
    console.error("Erro ao registrar usuário:", error.message);
  }
}

// Faz login do usuário
async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Usuário logado com sucesso:", userCredential.user.uid);
  } catch (error) {
    console.error("Erro ao fazer login:", error.message);
  }
}

// Faz logout do usuário
async function logoutUser() {
  try {
    await signOut(auth);
    console.log("Usuário desconectado com sucesso.");
  } catch (error) {
    console.error("Erro ao desconectar usuário:", error.message);
  }
}

/* ===================================
   Menu Principal
=================================== */
(async () => {
  try {
    console.log("1. Adicionar usuário");
    console.log("2. Adicionar curso");
    console.log("3. Registrar compra");
    console.log("4. Visualizar histórico de compras");
    console.log("5. Registrar Usuário");
    console.log("6. Fazer Login");
    console.log("7. Logout");
    console.log("8. Sair");

    const escolha = await askQuestion("Escolha uma opção: ");

    switch (escolha) {
      case "1":
        await adicionarUsuario();
        break;
      case "2":
        await adicionarCurso();
        break;
      case "3":
        const emailUsuarioCompra = await askQuestion("Email do usuário: ");
        const nomeCurso = await askQuestion("Nome do curso: ");
        await registrarCompra(emailUsuarioCompra, nomeCurso);
        break;
      case "4":
        const emailUsuarioHistorico = await askQuestion("Email do usuário: ");
        await visualizarHistoricoCompras(emailUsuarioHistorico);
        break;
      case "5":
        const regEmail = await askQuestion("Email: ");
        const regSenha = await askQuestion("Senha: ");
        await registerUser(regEmail, regSenha);
        break;
      case "6":
        const loginEmail = await askQuestion("Email: ");
        const loginSenha = await askQuestion("Senha: ");
        await loginUser(loginEmail, loginSenha);
        break;
      case "7":
        await logoutUser();
        break;
      case "8":
        console.log("Saindo...");
        process.exit(0);
      default:
        console.log("Opção inválida.");
    }
  } catch (error) {
    console.error("Erro na execução do programa:", error.message);
  }
})();
