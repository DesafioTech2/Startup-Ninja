import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";

export class FirestoreService {
  constructor(firebaseConfig) {
    this.app = initializeApp(firebaseConfig);
    this.db = getFirestore(this.app);
  }

  async addDocument(collection, documentId, data) {
    try {
      const documentRef = doc(this.db, collection, documentId);
      await setDoc(documentRef, data);
      console.log(
        `Documento ${documentId} adicionado com sucesso à coleção ${collection}.`
      );
    } catch (error) {
      console.error("Erro ao adicionar documento:", error.message);
    }
  }

  async updateDocument(collectionName, docId, updatedData) {
    try {
      const docRef = doc(this.db, collectionName, docId);
      await updateDoc(docRef, updatedData);
      console.log("Documento atualizado");
    } catch (error) {
      console.error("Erro ao atualizar documento:", error);
    }
  }

  async deleteDocument(collectionName, docId) {
    try {
      const docRef = doc(this.db, collectionName, docId);
      await deleteDoc(docRef);
      console.log("Documento removido");
    } catch (error) {
      console.error("Erro ao remover documento:", error);
    }
  }

  async getDocumentWithReferences(
    mainCollection,
    docId,
    refField,
    relatedCollection
  ) {
    const docRef = doc(FirestoreService.db, mainCollection, docId);
    const docSnapshot = await getDoc(docRef);

    if (!docSnapshot.exists()) {
      throw new Error(
        `Documento com ID ${docId} não encontrado na coleção ${mainCollection}`
      );
    }

    const documentData = docSnapshot.data();

    if (!documentData[refField] || !Array.isArray(documentData[refField])) {
      throw new Error(`O campo ${refField} não é válido ou não é uma lista`);
    }

    const relatedDocs = [];
    for (const refId of documentData[refField]) {
      const relatedDocRef = doc(firestoreService.db, relatedCollection, refId);
      const relatedDocSnapshot = await getDoc(relatedDocRef);

      if (relatedDocSnapshot.exists()) {
        relatedDocs.push({
          id: relatedDocSnapshot.id,
          ...relatedDocSnapshot.data(),
        });
      } else {
        console.warn(
          `Documento com ID ${refId} não encontrado na coleção ${relatedCollection}`
        );
      }
    }

    return { ...documentData, [refField]: relatedDocs };
  }
}

