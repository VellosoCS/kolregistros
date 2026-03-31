

## Plano: Adicionar "Opções" centralizado na coluna de ações

Editar linha 301 de `src/components/IncidentList.tsx`, adicionando o texto "Opções" dentro do `<th>` que está vazio.

**De:**
```tsx
<th className="label-text text-center px-4 py-3 w-20"></th>
```

**Para:**
```tsx
<th className="label-text text-center px-4 py-3 w-20">Opções</th>
```

