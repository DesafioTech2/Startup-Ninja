
import { firebaseConfig } from "./firebaseConfig.js";
import { Usuario } from "./models.mjs";
import { FirestoreService } from "./FirestoreService.js";

const firestoreService = new FirestoreService(firebaseConfig);


const usuario = new Usuario('João Silva', '123.456.789-10', '1990-05-15', 'joao@exemplo.com', '123456789', 'Gerente');

async function addData() {
  try {
  
    
    await firestoreService.addDocument('usuarios', 'user1', usuario.toFirestore());

    console.log('Dados adicionados com sucesso!');
  } catch (error) {
    console.error('Erro ao adicionar dados:', error.message);
  }
}




// Executar as funções
(async () => {
  console.log('Adicionando dados...');
  await addData();

 
})();