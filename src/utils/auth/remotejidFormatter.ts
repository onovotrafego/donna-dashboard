
// Funções auxiliares para formatação e normalização de remotejids

// Normaliza um remotejid adicionando o prefixo '+' se necessário
export const normalizeRemotejid = (remotejid: string): string => {
  const trimmed = remotejid.trim();
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
};

// Remove o prefixo '+' de um remotejid
export const removeRemotejidPlus = (remotejid: string): string => {
  return remotejid.startsWith('+') ? remotejid.substring(1) : remotejid;
};

// Gera formatos de pesquisa para o remotejid para busca LIKE
export const generateSearchFormats = (remotejid: string): string[] => {
  const trimmed = remotejid.trim();
  
  return [
    `%${trimmed}%`,
    trimmed.startsWith('+') ? `%${trimmed.substring(1)}%` : `%${trimmed}%`,
    !trimmed.startsWith('+') ? `%+${trimmed}%` : `%${trimmed}%`
  ];
};
