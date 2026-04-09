

## Colar Imagens e Suporte a Vídeos nos Incidentes

### Resumo
1. Permitir colar imagens da área de transferência (Ctrl+V / Cmd+V) diretamente nos formulários de criação e edição de incidentes
2. Adicionar suporte a upload de vídeos (além de imagens)

### Alterações

**1. `src/components/IncidentForm.tsx`**
- Adicionar listener `onPaste` no formulário que captura imagens do clipboard (`e.clipboardData.files` / `e.clipboardData.items`)
- Converter itens colados em `File` e adicionar ao array `selectedFiles` com preview
- Alterar `accept` do input de `image/*` para `image/*,video/*`
- Alterar filtro em `handleFilesChange` para aceitar `image/*` e `video/*`
- No preview, renderizar `<video>` para arquivos de vídeo ao invés de `<img>`
- Renomear label "Imagens" → "Imagens e vídeos" e botão "Anexar imagens" → "Anexar mídia"

**2. `src/components/EditIncidentDialog.tsx`**
- Mesmas alterações de paste e vídeo: listener `onPaste`, `accept` expandido, preview com `<video>` para vídeos
- Alterar filtro para aceitar `video/*` também
- Renderizar vídeos existentes (de `imageUrls`) com tag `<video>` baseado na extensão do URL

**3. `src/lib/image-upload.ts`**
- Renomear conceito interno para "media" — aceitar tanto imagens quanto vídeos
- Manter o bucket `incident-images` existente (funciona para qualquer tipo de arquivo)
- Sem alteração funcional necessária — o Storage já aceita qualquer tipo de arquivo

**4. Componentes de visualização (`IncidentList.tsx`, `IncidentDetail.tsx`, `ImageCarouselDialog.tsx`)**
- Onde exibem imagens de incidentes, detectar extensões de vídeo (`.mp4`, `.webm`, `.mov`) e renderizar com `<video controls>` ao invés de `<img>`

### Detalhes Técnicos

- **Paste handler**: captura `ClipboardEvent`, itera `clipboardData.items`, filtra por `type.startsWith("image/")` ou `type.startsWith("video/")`, chama `getAsFile()` e adiciona ao estado
- **Preview de vídeos**: usar `URL.createObjectURL(file)` com tag `<video>` para previews locais; para URLs persistidos, verificar extensão
- **Limite de tamanho**: o bucket do Storage aceita arquivos grandes, mas pode ser útil adicionar validação de tamanho para vídeos (ex: 50MB)
- **Sem mudança no banco**: o campo `image_urls` (text[]) já armazena URLs genéricos, funciona para vídeos também

