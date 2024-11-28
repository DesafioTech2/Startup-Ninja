import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
} from "firebase/firestore";

export class FirestoreService {
  constructor(firebaseConfig) {
    this.app = initializeApp(firebaseConfig);
    this.db = getFirestore(this.app);
  }

  async addDocument(collectionName, documentId, data) {
    if (!collectionName || typeof collectionName !== 'string') {
      throw new Error('O nome da coleção deve ser uma string válida.');
    }
    if (!documentId || typeof documentId !== 'string') {
      throw new Error('O ID do documento deve ser uma string válida.');
    }
    try {
      const documentRef = doc(this.db, collectionName, documentId);
      await setDoc(documentRef, data);
      console.log(`Documento ${documentId} adicionado com sucesso à coleção ${collectionName}.`);
    } catch (error) {
      console.error("Erro ao adicionar documento:", error.message);
    }
  }

  async updateDocument(collectionName, documentId, updatedData) {
    if (!collectionName || typeof collectionName !== 'string') {
      throw new Error('O nome da coleção deve ser uma string válida.');
    }
    if (!documentId || typeof documentId !== 'string') {
      throw new Error('O ID do documento deve ser uma string válida.');
    }
    try {
      const docRef = doc(this.db, collectionName, documentId);
      await updateDoc(docRef, updatedData);
      console.log("Documento atualizado");
    } catch (error) {
      console.error("Erro ao atualizar documento:", error.message);
    }
  }

  async deleteDocument(collectionName, documentId) {
    if (!collectionName || typeof collectionName !== 'string') {
      throw new Error('O nome da coleção deve ser uma string válida.');
    }
    if (!documentId || typeof documentId !== 'string') {
      throw new Error('O ID do documento deve ser uma string válida.');
    }
    try {
      const docRef = doc(this.db, collectionName, documentId);
      await deleteDoc(docRef);
      console.log("Documento removido");
    } catch (error) {
      console.error("Erro ao remover documento:", error.message);
    }
  }

  async getDocument(collectionName, documentId) {
    if (!collectionName || typeof collectionName !== 'string') {
      throw new Error('O nome da coleção deve ser uma string válida.');
    }
    if (!documentId || typeof documentId !== 'string') {
      throw new Error('O ID do documento deve ser uma string válida.');
    }
    try {
      const docRef = doc(this.db, collectionName, documentId);
      const docSnapshot = await getDoc(docRef);
      if (!docSnapshot.exists()) {
        throw new Error(`Documento com ID ${documentId} não encontrado na coleção ${collectionName}.`);
      }
      return { id: docSnapshot.id, ...docSnapshot.data() };
    } catch (error) {
      console.error("Erro ao buscar documento:", error.message);
      throw error;
    }
  }

  async documentExists(collectionName, documentId) {
    if (!collectionName || typeof collectionName !== 'string') {
      throw new Error('O nome da coleção deve ser uma string válida.');
    }
    if (!documentId || typeof documentId !== 'string') {
      throw new Error('O ID do documento deve ser uma string válida.');
    }
    const docRef = doc(this.db, collectionName, documentId);
    const docSnapshot = await getDoc(docRef);
    return docSnapshot.exists();
  }

  async getDocumentsWithPagination(collectionName, limitValue, startAfterDoc = null) {
    if (!collectionName || typeof collectionName !== 'string') {
      throw new Error('O nome da coleção deve ser uma string válida.');
    }
    if (!limitValue || typeof limitValue !== 'number') {
      throw new Error('O limite deve ser um número válido.');
    }
    try {
      const collectionRef = collection(this.db, collectionName);
      let querySnapshot;

      if (startAfterDoc) {
        querySnapshot = await getDocs(query(collectionRef, orderBy("id"), startAfter(startAfterDoc), limit(limitValue)));
      } else {
        querySnapshot = await getDocs(query(collectionRef, limit(limitValue)));
      }

      const documents = [];
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });

      return documents;
    } catch (error) {
      console.error("Erro ao buscar documentos com paginação:", error.message);
      throw error;
    }
  }

  async getDocumentWithReferences(mainCollection, docId, refField, relatedCollection) {
    if (!mainCollection || typeof mainCollection !== 'string') {
      throw new Error('O nome da coleção principal deve ser uma string válida.');
    }
    if (!docId || typeof docId !== 'string') {
      throw new Error('O ID do documento deve ser uma string válida.');
    }
    try {
      const docRef = doc(this.db, mainCollection, docId);
      const docSnapshot = await getDoc(docRef);

      if (!docSnapshot.exists()) {
        throw new Error(`Documento com ID ${docId} não encontrado na coleção ${mainCollection}.`);
      }

      const documentData = docSnapshot.data();
      if (!Array.isArray(documentData[refField])) {
        throw new Error(`O campo ${refField} não é uma lista válida de referências.`);
      }

      const relatedDocs = await Promise.all(
        documentData[refField].map(async (refId) => {
          const relatedDocRef = doc(this.db, relatedCollection, refId);
          const relatedDocSnapshot = await getDoc(relatedDocRef);

          if (relatedDocSnapshot.exists()) {
            return { id: relatedDocSnapshot.id, ...relatedDocSnapshot.data() };
          } else {
            console.warn(`Referência ${refId} não encontrada em ${relatedCollection}.`);
            return null;
          }
        })
      );

      return { ...documentData, [refField]: relatedDocs.filter(Boolean) };
    } catch (error) {
      console.error("Erro ao buscar documento com referências:", error.message);
      throw error;
    }
  }

  async getCollection(collectionName) {
    if (!collectionName || typeof collectionName !== 'string') {
      throw new Error('O nome da coleção deve ser uma string válida.');
    }
    try {
      const collectionRef = collection(this.db, collectionName);
      const querySnapshot = await getDocs(query(collectionRef));
      const documents = [];
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      return documents;
    } catch (error) {
      console.error("Erro ao buscar coleção:", error.message);
      throw error;
    }
  }
}

