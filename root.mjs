import { firebaseConfig } from './firebaseConfig.js';
import { FirestoreService } from './FirestoreService.js';
import { AuthService } from './AuthService.js';

const firestoreService = new FirestoreService(firebaseConfig);
const authService = new AuthService(firebaseConfig);

// Função para registrar um novo usuário
async function registerUser(email, password, userData) {
  try {
    console.log("Registrando novo usuário...");
    const userCredential = await authService.register(email, password);
    const userId = userCredential.user.uid;

    userData.id = userId; // Relacionar com o Firestore
    await firestoreService.addDocument('usuarios', userId, userData);
    console.log("Usuário registrado com sucesso:", userData);
  } catch (error) {
    console.error("Erro ao registrar usuário:", error.message);
  }
}

// Função para autenticar usuário
async function loginUser(email, password) {
  try {
    console.log("Autenticando usuário...");
    const userCredential = await authService.login(email, password);
    console.log("Usuário autenticado:", userCredential.user.email);
  } catch (error) {
    console.error("Erro ao autenticar usuário:", error.message);
  }
}

// Função para listar cursos
async function listCourses() {
  try {
    console.log("Listando cursos...");
    const courses = await firestoreService.getCollection('cursos');
    console.log("Cursos disponíveis:", courses);
    return courses;
  } catch (error) {
    console.error("Erro ao listar cursos:", error.message);
  }
}

// Função para adicionar curso ao carrinho
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

// Função para remover curso do carrinho
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

// Função para finalizar compra
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

// Função de registro de logs
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

// Testando funcionalidades (simulação de front-end)
(async () => {
  const email = "usuario@example.com";
  const password = "senha123";
  const userData = {
    nome: "João Silva",
    cpf: "123.456.789-10",
    dataNascimento: "1990-05-15",
    telefone: "123456789",
    cargo: "Cliente",
  };

  // Registro e login
  await registerUser(email, password, userData);
  await loginUser(email, password);

  // Listagem de cursos
  const courses = await listCourses();

  // Adicionando cursos ao carrinho
  if (courses.length > 0) {
    const courseId = courses[0].id;
    await addToCart(userData.id, courseId);

    // Finalizando compra
    await checkout(userData.id);

    // Registrando log de ação
    await logAction("Compra finalizada", userData.id, { courseId });
  }
})();
