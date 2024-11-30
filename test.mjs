import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { FirestoreService } from "./FirestoreService.js";
import { firebaseConfig } from "./firebaseConfig.js";
import { Usuario } from "./models.mjs";
import readline from "readline";
import fs from "fs";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestoreService = new FirestoreService(firebaseConfig);

const SESSION_FILE = "./session.json";

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


// Remove um usuário do sistema e do Firebase Auth com base no e-mail
async function removerUsuario() {
  try {
    const email = await askQuestion("Digite o e-mail do usuário que deseja remover: ");

    // Busca todos os usuários na coleção 'usuarios'
    const usuarios = await firestoreService.getAllDocuments("usuarios");
    const usuario = usuarios.find((u) => u.email === email);

    if (!usuario) {
      console.log("Usuário não encontrado.");
      return;
    }

    
    const confirmacao = await askQuestion(`Tem certeza de que deseja remover o usuário "${usuario.nome}"? (S/N): `);
    if (confirmacao.toLowerCase() !== 's') {
      console.log("Ação cancelada.");
      return;
    }

    
    await firestoreService.deleteDocument("usuarios", usuario.id);
    console.log(`Usuário "${usuario.nome}" removido do sistema com sucesso.`);

    console.log("Observação: a conta do Firebase Auth só pode ser removida usando o Admin SDK.");
  } catch (error) {
    console.error("Erro ao remover usuário:", error.message);
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
async function registrarCompra(emailUsuario, palavraChaveCurso) {
  try {
    const usuarios = await firestoreService.getAllDocuments("usuarios");
    const usuario = usuarios.find((u) => u.email === emailUsuario);

    if (!usuario) {
      console.log("Usuário não encontrado.");
      return;
    }

    // Busca todos os cursos e filtra por palavra-chave
    const cursos = await firestoreService.getAllDocuments("cursos");
    const cursosFiltrados = cursos.filter((curso) =>
      curso.nome.toLowerCase().includes(palavraChaveCurso.toLowerCase())
    );

    if (cursosFiltrados.length === 0) {
      console.log("Nenhum curso encontrado com essa palavra-chave.");
      return;
    }

    if (cursosFiltrados.length > 1) {
      console.log("Mais de um curso encontrado. Seja mais específico.");
      cursosFiltrados.forEach((curso, index) => {
        console.log(`${index + 1}. ${curso.nome}`);
      });
      return;
    }

    const cursoSelecionado = cursosFiltrados[0];

    // Atualiza os dados do usuário e do curso
    if (!usuario.cursosComprados) usuario.cursosComprados = [];
    usuario.cursosComprados.push(cursoSelecionado.nome);

    if (!cursoSelecionado.usuariosInscritos) cursoSelecionado.usuariosInscritos = [];
    cursoSelecionado.usuariosInscritos.push(usuario.email);

    await firestoreService.updateDocument("usuarios", usuario.id, usuario);
    await firestoreService.updateDocument("cursos", cursoSelecionado.nome, cursoSelecionado);

    console.log(`Compra registrada: ${usuario.nome} comprou o curso "${cursoSelecionado.nome}".`);
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

// Lista todos os cursos disponíveis no sistema
async function listarCursos() {
  try {
    const cursos = await firestoreService.getAllDocuments("cursos");
    
    if (!cursos || cursos.length === 0) {
      console.log("Nenhum curso disponível no momento.");
      return;
    }

    console.log("\n--- Cursos Disponíveis ---");
    cursos.forEach((curso, index) => {
      console.log(`${index + 1}. Nome: ${curso.nome}`);
      console.log(`   Descrição: ${curso.descricao}`);
      console.log(`   Duração: ${curso.duracao} horas`);
      console.log(`   Preço: R$ ${curso.preco.toFixed(2)}`);
      console.log(`   Categoria: ${curso.categoria}`);
      console.log(`   Nível: ${curso.nivel}`);
      console.log(`   Instrutor: ${curso.instrutor}`);
      console.log("------------------------------");
    });
  } catch (error) {
    console.error("Erro ao listar cursos:", error.message);
  }
}


/* ===================================
   Funções de Autenticação
=================================== */


// Verifica se há uma sessão ativa
const loadSession = () => {
  if (fs.existsSync(SESSION_FILE)) {
    const sessionData = fs.readFileSync(SESSION_FILE, "utf8");
    return JSON.parse(sessionData);
  }
  return null;
};

// Salva a sessão no arquivo
const saveSession = (session) => {
  fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));
};

// Remove a sessão
const clearSession = () => {
  if (fs.existsSync(SESSION_FILE)) {
    fs.unlinkSync(SESSION_FILE);
  }
};

// Registra um usuário no Firebase Auth
async function registerUser(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Usuário registrado com sucesso:", userCredential.user.uid);
  } catch (error) {
    console.error("Erro ao registrar usuário:", error.message);
  }
}

// Função para criar uma nova conta
async function criarConta() {
  try {
    console.log("\n=== Criar Conta ===");
    const email = await askQuestion("Email: ");
    const senha = await askQuestion("Senha: ");
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    console.log("Conta criada com sucesso:", userCredential.user.email);
    saveSession({ email: userCredential.user.email });
    return userCredential.user.email;
  } catch (error) {
    console.error("Erro ao criar conta:", error.message);
    return null;
  }
}

// Faz login do usuário
async function loginUser() {
  try {
    console.log("\n=== Login ===");
    const email = await askQuestion("Email: ");
    const senha = await askQuestion("Senha: ");
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    console.log("Usuário logado com sucesso:", userCredential.user.email);
    saveSession({ email: userCredential.user.email });
    return userCredential.user.email;
  } catch (error) {
    console.error("Erro ao fazer login:", error.message);
    return null;
  }
}
// Faz logout do usuário
async function logoutUser() {
  try {
    await signOut(auth);
    console.log("Usuário desconectado com sucesso.");
    clearSession();
  } catch (error) {
    console.error("Erro ao desconectar usuário:", error.message);
  }
}



/* ===================================
   Menu Principal
=================================== */

async function menuPrincipal(emailLogado) {
  while (true) {
    console.log("\n=== Menu Principal ===");
    console.log("1. Adicionar usuário");
    console.log("2. Adicionar curso");
    console.log("3. Realizar compra");
    console.log("4. Visualizar histórico de compras");
    console.log("5. Listar cursos");
    console.log("6. Logout");
    console.log("7. Sair");
    console.log("8. Remover usuario:");
    

    const escolha = await askQuestion("Escolha uma opção: ");

    try {
      switch (escolha) {
        case "1":
          await adicionarUsuario();
          break;
        case "2":
          await adicionarCurso();
          break;
        case "3":
          const palavraChaveCurso = await askQuestion("Palavra-chave do curso: ");
          await registrarCompra(emailLogado, palavraChaveCurso);
          break;
          break;
        case "4":
          await visualizarHistoricoCompras(emailLogado);
          break;
        case "6":
          await logoutUser();
          console.log("Encerrando sessão...");
          return;
        case "7":
          console.log("Saindo...");
          process.exit(0);
        case  "5":
          await listarCursos();
        case "8":
          await removerUsuario();
        default:
          console.log("Opção inválida.");
      }
    } catch (error) {
      console.error("Erro ao executar a opção:", error.message);
    }
  }
}



// Fluxo principal
(async () => {
  const session = loadSession();
  let emailLogado = session?.email;

  if (!emailLogado) {
    while (!emailLogado) {
      console.log("\n=== Bem-vindo ===");
      console.log("1. Fazer Login");
      console.log("2. Criar Conta");
      console.log("3. Sair");

      const escolha = await askQuestion("Escolha uma opção: ");
      switch (escolha) {
        case "1":
          emailLogado = await loginUser();
          break;
        case "2":
          emailLogado = await criarConta();
          break;
        case "3":
          console.log("Saindo...");
          process.exit(0);
        default:
          console.log("Opção inválida.");
      }
    }
  } else {
    console.log(`Sessão recuperada. Usuário logado: ${emailLogado}`);
  }

  await menuPrincipal(emailLogado);
})();
