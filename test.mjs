import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { FirestoreService } from "./FirestoreService.js";
import { firebaseConfig } from "./firebaseConfig.js";
import { Usuario } from './models.mjs';
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

// Função de registro de usuário
export async function registerUser(email, password, userData) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

    console.log("Usuário registrado com sucesso:", userId);

    // Salvar dados adicionais no Firestore
    await firestoreService.addDocument("usuarios", userId, { ...userData, email });
    console.log("Dados adicionais do usuário salvos no Firestore.");
  } catch (error) {
    console.error("Erro ao registrar usuário:", error.message);
  }
}

// Função para registrar uma compra de curso
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

    // Atualizar dados no Firestore
    usuario.cursosComprados.push(nomeCurso);
    curso.usuariosInscritos.push(usuario.email);

    await firestoreService.updateDocument("usuarios", usuario.id, usuario);
    await firestoreService.updateDocument("cursos", nomeCurso, curso);

    console.log(`Compra registrada: ${usuario.nome} comprou o curso "${nomeCurso}".`);
  } catch (error) {
    console.error("Erro ao registrar compra:", error.message);
  }
}

// Função para visualizar histórico de compras
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

// Função para adicionar um usuário
async function adicionarUsuario() {
  try {
    console.log("Iniciando cadastro de usuário...");
    
    // Coleta de dados do usuário
    const nome = await askQuestion("Nome: ");
    const cpf = await askQuestion("CPF: ");
    const email = await askQuestion("Email: ");
    const senha = await askQuestion("Senha: ");
    const cargo = await askQuestion("Cargo (Aluno, Professor, Administrador): ");
    const telefone = await askQuestion("Telefone (99999-9999): ");

    // Validação simples dos dados
    if (!nome || !cpf || !email || !senha || !cargo || !telefone) {
      throw new Error("Todos os campos são obrigatórios.");
    }

    if (!/^\d{11}$/.test(cpf)) {
      throw new Error("CPF inválido. Deve conter 11 dígitos numéricos.");
    }

    if (!/^\d{5}-\d{4}$/.test(telefone)) {
      throw new Error("Telefone inválido. Use o formato 99999-9999.");
    }

    // Criação do objeto usuário
    const usuario = new Usuario(nome, cpf, email, telefone, cargo);

    // Adiciona ao Firebase
    await firestoreService.addDocument("usuarios", usuario.cpf, usuario.toFirestore());
    console.log(`Usuário ${usuario.nome} salvo no Firebase com sucesso.`);

    // Registro no sistema
    await registerUser(email, senha, usuario);
    console.log(`Usuário ${usuario.nome} registrado no sistema com sucesso.`);

  } catch (error) {
    // Tratamento de erros
    console.error("Erro ao adicionar usuário:", error.message);
  }
}

// Função para adicionar um curso
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

// Função principal
(async () => {
  try {
    console.log("1. Adicionar usuário");
    console.log("2. Adicionar curso");
    console.log("3. Registrar compra");
    console.log("4. Visualizar histórico de compras");
    const escolha = await askQuestion("Escolha uma opção: ");

    if (escolha === "1") {
      await adicionarUsuario();
    } else if (escolha === "2") {
      await adicionarCurso();
    } else if (escolha === "3") {
      const emailUsuario = await askQuestion("Email do usuário: ");
      const nomeCurso = await askQuestion("Nome do curso: ");
      await registrarCompra(emailUsuario, nomeCurso);
    } else if (escolha === "4") {
      const emailUsuario = await askQuestion("Email do usuário: ");
      await visualizarHistoricoCompras(emailUsuario);
    } else {
      console.log("Opção inválida.");
    }
  } catch (error) {
    console.error("Erro na execução do programa:", error.message);
  }
})();
