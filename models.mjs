export class Usuario {
  constructor(nome, cpf, dataNascimento, email, telefone, cargo) {
    this.nome = nome;
    this.cpf = cpf;
    this.dataNascimento = dataNascimento;
    this.email = email;
    this.telefone = telefone;
    this.cargo = cargo;
    this.cursosComprados = [];
  }

  validarCPF() {
    const regex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    return regex.test(this.cpf);
  }

  calcularIdade() {
    const nascimento = new Date(this.dataNascimento);
    const idade = new Date().getFullYear() - nascimento.getFullYear();
    return idade;
  }

  getInformacoes() {
    return {
      nome: this.nome,
      cpf: this.cpf,
      idade: this.calcularIdade(),
      email: this.email,
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
      telefone: this.telefone,
      cargo: this.cargo,
      cursosComprados: this.cursosComprados,
    };
  }

  comprarCurso(curso) {
    if (!this.cursosComprados.includes(curso.nome)) {
      this.cursosComprados.push(curso.nome);
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
    this.usuariosInscritos = [];
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
      usuariosInscritos: this.usuariosInscritos,
    };
  }

  async adicionarUsuario(userId) {
    if (!this.usuariosInscritos.includes(userId)) {
      this.usuariosInscritos.push(userId);
      await console.log(
        `Usuário ${userId} adicionado ao curso "${this.nome}".`
      );
    } else {
      console.log(
        `Usuário ${userId} já está inscrito no curso "${this.nome}".`
      );
    }
  }
}
