export class Usuario {
  constructor(nome, cpf, dataNascimento, email, senha,telefone, cargo) {
    this.nome = nome;
    this.cpf = cpf;
    this.dataNascimento = dataNascimento;
    this.email = email;
    this.senha = senha; 
    this.telefone = telefone;
    this.cargo = cargo;
    this.cursosComprados = new Set(); 
  }

  validarCPF() {
    const regex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    return regex.test(this.cpf);
  }

  calcularIdade() {
    const nascimento = new Date(this.dataNascimento);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    if (
      hoje.getMonth() < nascimento.getMonth() ||
      (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate())
    ) {
      idade--;
    }
    return idade;
  }

  getInformacoes() {
    return {
      nome: this.nome,
      cpf: this.cpf,
      idade: this.calcularIdade(),
      email: this.email,
      senha: this.senha,
      telefone: this.telefone,
      cargo: this.cargo,
    };
  }

  toFirestore() {
    return {
      nome: this.nome,
      cpf: this.cpf,
      dataNascimento: this.dataNascimento,
      email: this.email,
      senha: this.senha,
      telefone: this.telefone,
      cargo: this.cargo,
      cursosComprados: Array.from(this.cursosComprados), 
    };
  }

  comprarCurso(curso) {
    if (!curso || typeof curso !== "object" || !curso.nome) {
      console.error("Curso inválido fornecido.");
      return;
    }
    if (!this.cursosComprados.has(curso.nome)) {
      this.cursosComprados.add(curso.nome);
      curso.adicionarUsuario(this.cpf);
      console.log(`Curso "${curso.nome}" comprado com sucesso!`);
    } else {
      console.log(`O curso "${curso.nome}" já foi comprado por ${this.nome}.`);
    }
  }
}

export class Curso {
  constructor(
    nome,
    descricao,
    duracao,
    preco,
    categoria,
    nivel,
    instrutor,
    urlImagem
  ) {
    this.nome = nome;
    this.descricao = descricao;
    this.duracao = duracao;
    this.preco = preco;
    this.categoria = categoria;
    this.nivel = nivel;
    this.instrutor = instrutor;
    this.urlImagem = urlImagem;
    this.usuariosInscritos = new Set(); 
  }

  toFirestore() {
    return {
      nome: this.nome,
      descricao: this.descricao,
      duracao: this.duracao,
      preco: this.preco,
      categoria: this.categoria,
      nivel: this.nivel,
      instrutor: this.instrutor,
      urlImagem: this.urlImagem,
      usuariosInscritos: Array.from(this.usuariosInscritos), 
        };
  }

  adicionarUsuario(userId) {
    if (!this.usuariosInscritos.has(userId)) {
      this.usuariosInscritos.add(userId);
      console.log(`Usuário ${userId} adicionado ao curso "${this.nome}".`);
    } else {
      console.log(`Usuário ${userId} já está inscrito no curso "${this.nome}".`);
    }
  }
}
