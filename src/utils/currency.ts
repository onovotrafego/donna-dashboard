
/**
 * Converte um valor monetário no formato brasileiro (ex: "200,00" ou "1.234,56") 
 * para um número de ponto flutuante.
 * 
 * @param value Valor em formato de string como moeda brasileira
 * @returns Número convertido
 */
export const parseBrazilianCurrency = (value: string | null): number => {
  if (!value) return 0;
  
  // Remove todos os pontos (separadores de milhar) e substitui a vírgula por ponto
  const normalized = value.replace(/\./g, '').replace(',', '.');
  
  // Converte para número
  const result = parseFloat(normalized);
  
  // Retorna 0 se não for um número válido
  return isNaN(result) ? 0 : result;
};

/**
 * Formata um valor numérico para o formato de moeda brasileiro (BRL)
 * 
 * @param value Valor numérico a ser formatado
 * @param options Opções de formatação do Intl.NumberFormat
 * @returns String formatada como moeda
 */
export const formatCurrency = (
  value: number,
  options: Intl.NumberFormatOptions = {}
): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    ...options
  }).format(value);
};
