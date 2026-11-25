// Linha digitável do boleto.
//
// Nesta base só existe a limpeza do que foi colado. A conferência (dígitos
// verificadores, banco, valor e vencimento) entra com a pesquisa das regras
// oficiais, com testes. Até lá, o site diz que ainda não confere.

/** Só os dígitos do que foi colado (tira espaços, pontos e traços). */
export function soDigitos(texto) {
  return String(texto ?? "").replace(/\D/g, "");
}

/**
 * Resultado da conferência da linha.
 * status: "vazio" | "indisponivel"
 */
export function conferirLinha(texto) {
  const digitos = soDigitos(texto);
  if (!digitos) return { status: "vazio", digitos };
  return { status: "indisponivel", digitos };
}
