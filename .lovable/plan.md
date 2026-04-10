

## Plano: Badge de "novos resolvidos" nas abas Solucionados e Solucionados CI

### Conceito

Rastrear quantos incidentes foram resolvidos desde a última vez que o usuário visualizou cada aba. Ao clicar na aba, o contador zera. O badge aparece como um pequeno indicador numérico ao lado do texto da aba.

### Implementação

**1. Estado de contagem de novos resolvidos (`Index.tsx`)**

- Adicionar dois estados: `newResolvedCount` e `newResolvedCICount`, inicializados em 0.
- Usar `useEffect` que monitora `resolvedIncidents.length` e `resolvedInternoIncidents.length`:
  - Quando o tamanho aumenta e a aba correspondente NÃO está ativa, incrementar o contador pela diferença.
  - Guardar o comprimento anterior via `useRef`.
- Ao clicar na aba "resolved", zerar `newResolvedCount`. Ao clicar em "resolvedCI", zerar `newResolvedCICount`.

**2. Badge visual nas abas**

- Nas abas "Solucionados" e "Solucionados CI", renderizar um `<span>` com estilo de badge (fundo vermelho/primário, texto branco, `rounded-full`, tamanho pequeno) quando o contador > 0.
- Exemplo: `Solucionados (12)` + badge vermelho `3`.

### Arquivos modificados

- `src/pages/Index.tsx` — lógica de contagem + badges nas abas.

### Detalhes técnicos

```text
Aba "Solucionados (12)"  [3]   ← badge vermelho com novos
Aba "Solucionados CI (5)" [1]  ← badge vermelho com novos
```

- `useRef` para armazenar `prevResolvedLen` e `prevResolvedCILen`.
- O badge desaparece quando o usuário clica na aba (reset do contador).
- Sem persistência em banco — é por sessão, resetado ao recarregar.

