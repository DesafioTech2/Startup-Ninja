import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export class AuthService {
  constructor(firebaseConfig) {
    this.app = initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);
  }

  async register(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      return userCredential;
    } catch (error) {
      throw new Error(`Erro ao registrar: ${error.message}`);
    }
  }

  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      return userCredential;
    } catch (error) {
      throw new Error(`Erro ao autenticar: ${error.message}`);
    }
  }
}
