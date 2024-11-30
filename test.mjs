import { firebaseConfig } from './firebaseConfig.js';
import { FirestoreService } from './FirestoreService.js';

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
export async function adicionarUsuario(dados) {
  try {
      console.log("Iniciando cadastro de usuário...");
      const { cpf, nome, dataNascimento, email, senha, telefone, cargo } = dados;

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
      if (usuariosExistentes.some((u) => u.cpf === cpf)) {
          throw new Error("CPF já cadastrado.");
      }

      const usuario = new Usuario(nome, cpf, dataNascimento, email, senha, telefone, cargo);
      await firestoreService.addDocument("usuarios", cpf, usuario.toFirestore());
      console.log(`Usuário ${usuario.nome} salvo no Firebase Firestore com sucesso.`);
  } catch (error) {
      console.error("Erro ao adicionar usuário:", error.message);
      throw error; // Repassa o erro para ser tratado no formulário
  }
}

// Adiciona um novo curso ao sistema
async function adicionarCurso() {
  try {
    console.log("Listando cursos...");
    const courses = await firestoreService.getCollection('cursos');
    console.log("Cursos disponíveis:", courses);
    return courses;
  } catch (error) {
    console.error("Erro ao listar cursos:", error.message);
  }
}


async function addToCart(userId, courseId) {
  try {
    console.log(`Adicionando curso ${courseId} ao carrinho do usuário ${userId}...`);
    const userDoc = await firestoreService.getDocument('usuarios', userId);
    if (!userDoc.carrinho) userDoc.carrinho = [];
    
    if (!userDoc.carrinho.includes(courseId)) {
      userDoc.carrinho.push(courseId);
      await firestoreService.updateDocument('usuarios', userId, { carrinho: userDoc.carrinho });
      console.log(`Curso ${courseId} adicionado ao carrinho.`);
    } else {
      console.log(`Curso ${courseId} já está no carrinho.`);
    }
  } catch (error) {
    console.error("Erro ao adicionar curso ao carrinho:", error.message);
  }
}


async function removeFromCart(userId, courseId) {
  try {
    console.log(`Removendo curso ${courseId} do carrinho do usuário ${userId}...`);
    const userDoc = await firestoreService.getDocument('usuarios', userId);
    if (userDoc.carrinho && userDoc.carrinho.includes(courseId)) {
      userDoc.carrinho = userDoc.carrinho.filter(course => course !== courseId);
      await firestoreService.updateDocument('usuarios', userId, { carrinho: userDoc.carrinho });
      console.log(`Curso ${courseId} removido do carrinho.`);
    } else {
      console.log(`Curso ${courseId} não está no carrinho.`);
    }
  } catch (error) {
    console.error("Erro ao remover curso do carrinho:", error.message);
  }
}


async function checkout(userId) {
  try {
    console.log(`Finalizando compra para o usuário ${userId}...`);
    const userDoc = await firestoreService.getDocument('usuarios', userId);
    if (userDoc.carrinho && userDoc.carrinho.length > 0) {
      userDoc.cursosComprados = userDoc.cursosComprados || [];
      userDoc.carrinho.forEach(courseId => {
        if (!userDoc.cursosComprados.includes(courseId)) {
          userDoc.cursosComprados.push(courseId);
        }
      });

      userDoc.carrinho = []; // Esvaziar carrinho após compra
      await firestoreService.updateDocument('usuarios', userId, {
        cursosComprados: userDoc.cursosComprados,
        carrinho: [],
      });
      console.log("Compra finalizada com sucesso.");
    } else {
      console.log("Carrinho vazio, nada para comprar.");
    }
  } catch (error) {
    console.error("Erro ao finalizar compra:", error.message);
  }
}


async function logAction(action, userId, details) {
  try {
    const logData = {
      action,
      userId,
      details,
      timestamp: new Date().toISOString(),
    };
    await firestoreService.addDocument('logs', `${userId}-${Date.now()}`, logData);
    console.log("Ação registrada nos logs:", logData);
  } catch (error) {
    console.error("Erro ao registrar logs:", error.message);
  }
}


(async () => {
  const userId = "exemploUserId123"; // ID fixo para teste
  console.log("Iniciando testes...");

  // Listagem de cursos
  const courses = await listCourses();

  // Adicionando cursos ao carrinho
  if (courses.length > 0) {
    const courseId = courses[0].id;
    await addToCart(userId, courseId);

    // Finalizando compra
    await checkout(userId);

    // Registrando log de ação
    await logAction("Compra finalizada", userId, { courseId });
  }
})();
