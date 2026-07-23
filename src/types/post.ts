// Os nomes vêm em pt-BR e minúsculos porque o Postgres rebaixa identificadores
// não citados: a coluna idPost chega no JSON como "idpost". Mantido igual ao
// TC3 web em vez de renomear no cliente.
export interface Post {
  idpost: number;
  titulo: string;
  conteudo: string;
  autor: string;
  datacriacao: string;
}

export interface PostInput {
  titulo: string;
  conteudo: string;
  autor: string;
}

// POST/PUT respondem { message, post } em vez do recurso puro.
export interface PostMutationResponse {
  message: string;
  post: Post;
}
