import { firebaseConfig } from './firebaseConfig.js';
import { FirestoreService } from './FirestoreService.js';

const firestoreService = new FirestoreService(firebaseConfig);

async function ensureUserExists(userId, userData) {
    try {
      const userDoc = await firestoreService.getDocument('usuarios', userId);
      if (!userDoc) {
        console.log(`Usuário ${userId} não encontrado. Criando novo usuário...`);
        await firestoreService.addDocument('usuarios', userId, userData);
        console.log(`Usuário ${userId} criado com sucesso.`);
      } else {
        console.log(`Usuário ${userId} já existe.`);
      }
    } catch (error) {
      console.error("Erro ao garantir existência do usuário:", error.message);
    }
  }  


(async () => {
    const cursos = [
      { id: "curso1", titulo: "Curso de JavaScript", descricao: "Aprenda JavaScript do básico ao avançado", preco: 100.00 },
      { id: "curso2", titulo: "Curso de Python", descricao: "Domine Python para ciência de dados", preco: 150.00 },
      { id: "curso3", titulo: "Curso de React", descricao: "Crie aplicações modernas com React", preco: 200.00 }
    ];
  
    try {
      for (const curso of cursos) {
        await firestoreService.addDocument('cursos', curso.id, curso);
        console.log(`Curso ${curso.titulo} adicionado com sucesso.`);
      }
    } catch (error) {
      console.error("Erro ao adicionar cursos:", error.message);
    }
  })();
  
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
